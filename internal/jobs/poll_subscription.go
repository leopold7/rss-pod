package jobs

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"

	"github.com/synrise25/rss-pod/internal/config"
)

// subscriptionWindowOverlap widens a pull past the previous run. The remote
// endpoint filters on its own publish timestamps, so re-reading a short tail
// closes the gap a clock difference between the two deployments would
// otherwise leave; mirrored feed items are deduplicated by the remote episode
// ID, so the repeated tail costs one request and nothing else.
const subscriptionWindowOverlap = time.Hour

// subscriptionResponseLimit bounds how much of a remote response is read.
const subscriptionResponseLimit = 16 << 20

const subscriptionTimeout = 30 * time.Second

type PollSubscriptionArgs struct {
	SubscriptionID string `json:"subscription_id" river:"unique"`
	RunID          string `json:"run_id"`
	Limit          int    `json:"limit,omitempty"`
}

func (PollSubscriptionArgs) Kind() string { return "poll_subscription" }

func (PollSubscriptionArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{Queue: "source", MaxAttempts: 5}
}

// subscriptionEpisode is one entry of the remote player endpoint. Only the
// fields the player needs are mirrored, plus the state that tells whether the
// remote deployment finished generating it.
type subscriptionEpisode struct {
	ID                   string     `json:"id"`
	SourceID             string     `json:"source_id"`
	Title                string     `json:"title"`
	AudioURL             string     `json:"audio_url"`
	AudioByteSize        int64      `json:"audio_byte_size"`
	AudioDurationSeconds int64      `json:"audio_duration_seconds"`
	PublishedAt          *time.Time `json:"published_at"`
	OriginalPublishedAt  *time.Time `json:"original_published_at"`
	Hidden               bool       `json:"hidden"`
	State                string     `json:"state"`
}

// PollSubscriptionWorker mirrors a remote rss-pod deployment: it pulls the
// episodes that deployment published in the current window and republishes
// them locally, so this deployment's player and podcast feed can carry them.
// The remote audio is referenced, not copied, and no local generation runs for
// a mirrored episode.
type PollSubscriptionWorker struct {
	river.WorkerDefaults[PollSubscriptionArgs]
	Pool   *pgxpool.Pool
	Config *config.Config
	// Client overrides the HTTP client; tests inject one, deployments use the
	// default that ignores environment proxies.
	Client *http.Client
}

func (w *PollSubscriptionWorker) Work(ctx context.Context, job *river.Job[PollSubscriptionArgs]) error {
	if _, err := w.Pool.Exec(ctx, `
		UPDATE source_runs
		SET status = 'running', started_at = COALESCE(started_at, now()), error = ''
		WHERE id = $1
	`, job.Args.RunID); err != nil {
		return fmt.Errorf("mark subscription run running: %w", err)
	}

	if err := w.poll(ctx, job.Args); err != nil {
		status := "retrying"
		var permanentErr *permanentError
		// A permanent error cancels the River job, so the run must not stay
		// "retrying" forever waiting for an attempt that will never come.
		if errors.As(err, &permanentErr) || job.Attempt >= job.MaxAttempts {
			status = "failed"
		}
		_, updateErr := w.Pool.Exec(ctx, `
			UPDATE source_runs
			SET status = $2, error = $3,
			    completed_at = CASE WHEN $2 = 'failed' THEN now() ELSE NULL END
			WHERE id = $1
		`, job.Args.RunID, status, err.Error())
		if updateErr != nil {
			return fmt.Errorf("%v; update run failure: %w", err, updateErr)
		}
		return err
	}
	return nil
}

func (w *PollSubscriptionWorker) poll(ctx context.Context, args PollSubscriptionArgs) error {
	subscription, ok := w.Config.Subscription(args.SubscriptionID)
	if !ok {
		return permanent("unknown subscription %q", args.SubscriptionID)
	}
	if !subscription.Enabled {
		return permanent("subscription %q is disabled", args.SubscriptionID)
	}

	before := time.Now()
	since, err := w.windowStart(ctx, subscription, before)
	if err != nil {
		return err
	}
	limit := subscription.EffectiveLimit()
	if args.Limit > 0 && args.Limit < limit {
		limit = args.Limit
	}

	episodes, err := w.fetchEpisodes(ctx, subscription, since, before, limit)
	if err != nil {
		return err
	}
	mirrored := mirrorableEpisodes(episodes)

	tx, err := w.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin subscription transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	mirroredAt := time.Now()
	itemsNew := 0
	itemsExisting := 0
	for _, episode := range mirrored {
		created, err := storeMirroredEpisode(ctx, tx, subscription, episode, mirroredAt)
		if err != nil {
			return err
		}
		if created {
			itemsNew++
		} else {
			itemsExisting++
		}
	}
	if _, err := tx.Exec(ctx, `
		UPDATE source_runs
		SET status = 'completed', items_found = $2, items_new = $3,
		    items_existing = $4, error = '', completed_at = now()
		WHERE id = $1
	`, args.RunID, len(episodes), itemsNew, itemsExisting); err != nil {
		return fmt.Errorf("complete subscription run: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit subscription run: %w", err)
	}
	return nil
}

// windowStart returns the lower bound of the next pull. A completed run already
// covered everything published before its own start, so the next window only
// repeats a short overlap; without a completed run the configured lookback
// applies.
func (w *PollSubscriptionWorker) windowStart(ctx context.Context, subscription config.SubscriptionConfig, now time.Time) (time.Time, error) {
	var lastRun *time.Time
	if err := w.Pool.QueryRow(ctx, `
		SELECT max(started_at) FROM source_runs
		WHERE source_id = $1 AND status = 'completed'
	`, subscription.ID).Scan(&lastRun); err != nil {
		return time.Time{}, fmt.Errorf("query last subscription run: %w", err)
	}
	if lastRun != nil {
		return lastRun.UTC().Add(-subscriptionWindowOverlap), nil
	}
	lookback, err := subscription.LookbackDuration()
	if err != nil {
		return time.Time{}, permanent("subscription %s lookback %v", subscription.ID, err)
	}
	return now.Add(-lookback), nil
}

func (w *PollSubscriptionWorker) fetchEpisodes(
	ctx context.Context,
	subscription config.SubscriptionConfig,
	since, before time.Time,
	limit int,
) ([]subscriptionEpisode, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, subscription.EpisodesURL(since, before, limit), nil)
	if err != nil {
		return nil, permanent("build subscription request: %v", err)
	}
	request.Header.Set("Accept", "application/json")
	client := w.Client
	if client == nil {
		client = subscriptionHTTPClient()
	}
	response, err := client.Do(request)
	if err != nil {
		return nil, fmt.Errorf("fetch subscription %s: %w", subscription.ID, err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(response.Body, 512))
		message := fmt.Sprintf("subscription %s returned HTTP %d: %s",
			subscription.ID, response.StatusCode, strings.TrimSpace(string(body)))
		// A rejected request means the configured endpoint or remote source is
		// wrong, so repeating the same URL cannot succeed.
		if response.StatusCode >= 400 && response.StatusCode < 500 && response.StatusCode != http.StatusTooManyRequests {
			return nil, permanent("%s", message)
		}
		return nil, errors.New(message)
	}

	var payload struct {
		Episodes []subscriptionEpisode `json:"episodes"`
	}
	if err := json.NewDecoder(io.LimitReader(response.Body, subscriptionResponseLimit)).Decode(&payload); err != nil {
		return nil, fmt.Errorf("decode subscription %s response: %w", subscription.ID, err)
	}
	return payload.Episodes, nil
}

// subscriptionHTTPClient ignores environment proxies, like the feed poller, so
// a container-wide proxy cannot silently redirect a mirror.
func subscriptionHTTPClient() *http.Client {
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = nil
	return &http.Client{Transport: transport, Timeout: subscriptionTimeout}
}

// mirrorableEpisodes keeps the remote episodes a listener can play right away.
// An episode that is still generating remotely has no audio yet; a later pull
// picks it up once the remote deployment publishes it.
func mirrorableEpisodes(episodes []subscriptionEpisode) []subscriptionEpisode {
	playable := make([]subscriptionEpisode, 0, len(episodes))
	seen := make(map[string]struct{}, len(episodes))
	for _, episode := range episodes {
		if episode.Hidden || strings.TrimSpace(episode.AudioURL) == "" {
			continue
		}
		externalID := subscriptionEpisodeID(episode)
		if externalID == "" {
			continue
		}
		if _, duplicate := seen[externalID]; duplicate {
			continue
		}
		seen[externalID] = struct{}{}
		playable = append(playable, episode)
	}
	return playable
}

// subscriptionEpisodeID is the local feed item key: the remote episode ID when
// the remote deployment exposes one, otherwise a digest of what identifies the
// episode there.
func subscriptionEpisodeID(episode subscriptionEpisode) string {
	if id := strings.TrimSpace(episode.ID); id != "" {
		return id
	}
	title := strings.TrimSpace(episode.Title)
	if title == "" {
		return ""
	}
	published := ""
	if date := subscriptionEpisodeDate(episode); date != nil {
		published = date.UTC().Format(time.RFC3339Nano)
	}
	sum := sha256.Sum256([]byte(strings.TrimSpace(episode.SourceID) + "\x00" + title + "\x00" + published))
	return "sha256:" + hex.EncodeToString(sum[:])
}

// subscriptionEpisodeDate prefers the article date the remote feed item carried
// so a mirrored episode lands on the same day as the remote list shows it.
func subscriptionEpisodeDate(episode subscriptionEpisode) *time.Time {
	if episode.OriginalPublishedAt != nil {
		return episode.OriginalPublishedAt
	}
	return episode.PublishedAt
}

// storeMirroredEpisode publishes one remote episode locally. It reports whether
// this run created the episode; a repeated pull of the same window only
// refreshes the feed item and leaves the published episode untouched.
func storeMirroredEpisode(
	ctx context.Context,
	tx pgx.Tx,
	subscription config.SubscriptionConfig,
	episode subscriptionEpisode,
	mirroredAt time.Time,
) (bool, error) {
	externalID := subscriptionEpisodeID(episode)
	if externalID == "" {
		return false, nil
	}
	var feedItemID int64
	err := tx.QueryRow(ctx, `
		INSERT INTO feed_items (
		    source_id, external_id, title, link, description, published_at
		) VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (source_id, external_id) DO UPDATE
		SET title = EXCLUDED.title,
		    link = EXCLUDED.link,
		    description = EXCLUDED.description,
		    published_at = EXCLUDED.published_at
		RETURNING id
	`, subscription.ID, externalID, episode.Title, episode.AudioURL,
		subscriptionProvenance(subscription, episode), subscriptionEpisodeDate(episode)).Scan(&feedItemID)
	if err != nil {
		return false, fmt.Errorf("store mirrored feed item: %w", err)
	}

	episodeID := uuid.New()
	var insertedID string
	// A mirrored episode is published on arrival: the remote deployment already
	// generated its audio, and this deployment only references that audio URL.
	// published_at is the mirror time, matching a locally composed episode,
	// while the feed item keeps the article date for the player's day grouping.
	err = tx.QueryRow(ctx, `
		INSERT INTO episodes (
		    id, source_id, feed_item_id, title, status,
		    audio_url, audio_byte_size, audio_duration_seconds, published_at
		) VALUES ($1, $2, $3, $4, 'published', $5, $6, $7, $8)
		ON CONFLICT (feed_item_id) DO NOTHING
		RETURNING id::text
	`, episodeID, subscription.ID, feedItemID, episode.Title,
		episode.AudioURL, episode.AudioByteSize, episode.AudioDurationSeconds, mirroredAt).Scan(&insertedID)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("store mirrored episode: %w", err)
	}
	return true, nil
}

// subscriptionProvenance records where a mirrored episode came from so an
// operator can tell it apart from a locally generated one.
func subscriptionProvenance(subscription config.SubscriptionConfig, episode subscriptionEpisode) string {
	origin := strings.TrimRight(strings.TrimSpace(subscription.BaseURL), "/")
	if remoteSource := strings.TrimSpace(episode.SourceID); remoteSource != "" {
		origin += " (" + remoteSource + ")"
	}
	return "mirrored from " + origin
}
