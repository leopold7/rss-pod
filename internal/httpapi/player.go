package httpapi

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"

	"github.com/synrise25/rss-pod/internal/config"
	"github.com/synrise25/rss-pod/internal/jobs"
)

type playerServer struct {
	pool  *pgxpool.Pool
	river *river.Client[pgx.Tx]
	cfg   *config.Config
	// pollOnlySources lists the enabled sources whose episodes wait for a
	// listener to start them, so they are listed before they are generated.
	pollOnlySources []string
	// sources is every enabled episode owner the filter can show: the feed
	// sources and the subscriptions that mirror other deployments.
	sources     []config.SourceRef
	noticeFile  string
	themeToggle bool
	// storage resolves the media origin of the domain that is asking, so the
	// player does not depend on the address stored when the episode was made.
	storage config.StorageConfig
}

const maxNoticeBytes = 64 << 10

var noticeMarkdown = goldmark.New(goldmark.WithExtensions(extension.GFM))

func newPlayerServer(cfg *config.Config, pool *pgxpool.Pool, riverClient *river.Client[pgx.Tx]) *playerServer {
	return &playerServer{
		pool:            pool,
		river:           riverClient,
		cfg:             cfg,
		pollOnlySources: cfg.PollOnlySourceIDs(),
		sources:         cfg.EpisodeSources(),
		noticeFile:      strings.TrimSpace(cfg.Runtime.HTTP.NoticeFile),
		themeToggle:     cfg.Runtime.HTTP.ThemeToggleEnabled(),
		storage:         cfg.Runtime.Storage,
	}
}

func (s *playerServer) listSources(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"sources": s.sources})
}

// config exposes the player preferences that the embedded static shell cannot
// know, so hiding an optional control in config.yaml does not need a rebuild.
func (s *playerServer) config(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, http.StatusOK, map[string]any{"theme_toggle": s.themeToggle})
}

func (s *playerServer) notice(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	if s.noticeFile == "" {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	file, err := os.Open(s.noticeFile)
	if err != nil {
		if os.IsNotExist(err) {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		slog.Error("open player notice", "error", err)
		http.Error(w, "player notice unavailable", http.StatusInternalServerError)
		return
	}
	defer file.Close()

	content, err := io.ReadAll(io.LimitReader(file, maxNoticeBytes+1))
	if err != nil {
		slog.Error("read player notice", "error", err)
		http.Error(w, "player notice unavailable", http.StatusInternalServerError)
		return
	}
	if len(content) > maxNoticeBytes {
		http.Error(w, "player notice is too large", http.StatusInternalServerError)
		return
	}
	if len(bytes.TrimSpace(content)) == 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	var rendered bytes.Buffer
	if err := noticeMarkdown.Convert(content, &rendered); err != nil {
		slog.Error("render player notice", "error", err)
		http.Error(w, "player notice unavailable", http.StatusInternalServerError)
		return
	}

	noticeHash := sha256.Sum256(rendered.Bytes())
	noticeID := hex.EncodeToString(noticeHash[:])
	etag := `"` + noticeID + `"`
	w.Header().Set("X-Notice-ID", noticeID)
	w.Header().Set("ETag", etag)
	if matchesETag(r.Header.Values("If-None-Match"), etag) {
		w.WriteHeader(http.StatusNotModified)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(rendered.Bytes())
}

func matchesETag(headerValues []string, current string) bool {
	current = strings.TrimPrefix(current, "W/")
	for _, headerValue := range headerValues {
		for _, candidate := range strings.Split(headerValue, ",") {
			candidate = strings.TrimSpace(candidate)
			if candidate == "*" || strings.TrimPrefix(candidate, "W/") == current {
				return true
			}
		}
	}
	return false
}

type playerEpisode struct {
	Hidden               bool       `json:"hidden,omitempty"`
	ID                   uuid.UUID  `json:"id"`
	SourceID             string     `json:"source_id"`
	Title                string     `json:"title"`
	AudioURL             string     `json:"audio_url"`
	AudioByteSize        int64      `json:"audio_byte_size,omitempty"`
	AudioDurationSeconds int64      `json:"audio_duration_seconds,omitempty"`
	PublishedAt          *time.Time `json:"published_at,omitempty"`
	OriginalPublishedAt  *time.Time `json:"original_published_at,omitempty"`
	// OriginalURL is the address of the article the episode was generated from,
	// so a listener can open the source in a window of its own. A feed item that
	// published no link leaves it empty and the player hides the entry.
	OriginalURL string `json:"original_url,omitempty"`
	// State tells the player which control to render: ready plays, pending can
	// be started by hand, processing is already running, and failed can be tried
	// again. Stage is set while state is processing.
	State string `json:"state"`
	Stage string `json:"stage,omitempty"`
	// Tag carries the badge text in every language the deployment configured;
	// the page picks the one it renders. An episode whose source rule does not
	// match, and a deployment without a rule, send no tag at all.
	Tag config.TagText `json:"tag,omitempty"`
	// objectKey locates the audio inside the media bucket. It is only used to
	// rebuild AudioURL for the site that asked, so it is never serialised.
	objectKey string
}

// mediaAudioURL returns the audio address the requesting site should receive.
// A locally composed episode carries its object key, so the address is rebuilt
// on the media origin that the request host maps to; a mirrored subscription
// episode has no key and keeps the remote address it was published under.
func mediaAudioURL(host, storedURL, objectKey string, storage config.StorageConfig) string {
	if objectKey == "" {
		return storedURL
	}
	base := storage.MediaBaseURL(host)
	if base == "" {
		return storedURL
	}
	return base + "/" + strings.TrimLeft(objectKey, "/")
}

// episodeTag resolves the badge an episode shows. A server built without a
// configuration, which is how the notice tests build one, shows none.
func (s *playerServer) episodeTag(sourceID string, articleLength int) config.TagText {
	if s.cfg == nil {
		return nil
	}
	return s.cfg.TagForArticle(sourceID, articleLength)
}

// playerEpisodeState maps the internal pipeline status to the small, machine
// readable state the player renders. The stage names the running step so the
// player can show its own localised wording.
func playerEpisodeState(status string, hasAudio bool) (state, stage string) {
	switch status {
	case "published":
		if hasAudio {
			return "ready", ""
		}
		// A published episode always carries audio; treat anything else as
		// broken rather than pretending it can be played.
		return "failed", ""
	case "queued":
		return "pending", ""
	case "resolving_content":
		return "processing", "content"
	case "content_ready", "generating_script":
		return "processing", "script"
	case "script_ready", "generating_tts":
		return "processing", "tts"
	case "composing":
		return "processing", "compose"
	case "retrying":
		return "processing", ""
	default:
		return "failed", ""
	}
}

func (s *playerServer) listEpisodes(w http.ResponseWriter, r *http.Request) {
	s.episodes(w, r, false)
}

func (s *playerServer) episodes(w http.ResponseWriter, r *http.Request, includeHidden bool) {
	limit := 200
	if value := r.URL.Query().Get("limit"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil || parsed < 1 || parsed > 500 {
			writeError(w, http.StatusBadRequest, "limit must be between 1 and 500")
			return
		}
		limit = parsed
	}

	// A poll that follows a running download asks for the episodes it is
	// watching rather than for the whole window, which leaves `since`, `before`
	// and `limit` to the callers that read the list for the first time.
	ids, ok := parseEpisodeIDs(w, r.URL.Query().Get("ids"))
	if !ok {
		return
	}
	if len(ids) > 0 {
		limit = len(ids)
	}

	since, ok := parseOptionalRFC3339(w, r.URL.Query().Get("since"), "since")
	if !ok {
		return
	}
	before, ok := parseOptionalRFC3339(w, r.URL.Query().Get("before"), "before")
	if !ok {
		return
	}
	if since != nil && before != nil && !since.Before(*before) {
		writeError(w, http.StatusBadRequest, "since must be before before")
		return
	}

	sourceID := r.URL.Query().Get("source_id")
	// Episodes of a poll-only source are listed before they are generated, and
	// an episode waiting for a listener has no published_at yet, so both the
	// window and the order fall back to the feed item's own timestamp. The
	// article is measured in the database, so its text never has to leave it:
	// it reads the field the content pipeline reads (content, falling back to
	// description) with its markup removed, because that is what a reader
	// counts. Entities such as &amp; stay counted as written, which is precise
	// enough for a threshold an operator tunes against its own feeds.
	rows, err := s.pool.Query(r.Context(), `
		SELECT e.id, e.source_id, e.title, f.link, e.audio_url, e.audio_object_key,
		       e.audio_byte_size, e.audio_duration_seconds,
		       COALESCE(e.published_at, f.published_at), f.published_at, e.hidden_at IS NOT NULL, e.status,
		       char_length(regexp_replace(COALESCE(NULLIF(f.content, ''), f.description), '<[^>]*>', '', 'g'))
		FROM episodes e
		JOIN feed_items f ON f.id = e.feed_item_id
		WHERE (
		         (e.status = 'published' AND e.audio_url <> '')
		         OR e.source_id = ANY($6::text[])
		      )
		  AND ($5 OR e.hidden_at IS NULL)
		  AND ($1 = '' OR e.source_id = $1)
		  AND ($2::timestamptz IS NULL OR COALESCE(e.published_at, f.published_at) >= $2)
		  AND ($3::timestamptz IS NULL OR COALESCE(e.published_at, f.published_at) < $3)
		  AND (COALESCE(cardinality($7::uuid[]), 0) = 0 OR e.id = ANY($7::uuid[]))
		ORDER BY COALESCE(e.published_at, f.published_at) DESC NULLS LAST
		LIMIT $4
	`, sourceID, since, before, limit, includeHidden, s.pollOnlySources, ids)
	if err != nil {
		slog.Error("query player episodes", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to load episodes")
		return
	}
	defer rows.Close()

	episodes := make([]playerEpisode, 0)
	for rows.Next() {
		var episode playerEpisode
		var status string
		var articleLength int
		if err := rows.Scan(
			&episode.ID,
			&episode.SourceID,
			&episode.Title,
			&episode.OriginalURL,
			&episode.AudioURL,
			&episode.objectKey,
			&episode.AudioByteSize,
			&episode.AudioDurationSeconds,
			&episode.PublishedAt,
			&episode.OriginalPublishedAt,
			&episode.Hidden,
			&status,
			&articleLength,
		); err != nil {
			slog.Error("scan player episode", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to load episodes")
			return
		}
		// Every public domain receives the audio address of its own media host,
		// so a mirrored episode (which has no object key) is left untouched.
		episode.AudioURL = mediaAudioURL(r.Host, episode.AudioURL, episode.objectKey, s.storage)
		episode.State, episode.Stage = playerEpisodeState(status, episode.AudioURL != "")
		episode.Tag = s.episodeTag(episode.SourceID, articleLength)
		episodes = append(episodes, episode)
	}
	if err := rows.Err(); err != nil {
		slog.Error("iterate player episodes", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to load episodes")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"episodes": episodes})
}

// startEpisode begins generation for an episode a poll-only source left waiting
// for a listener. It is public on purpose: the player page is where the
// listener decides which entry is worth generating.
func (s *playerServer) startEpisode(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	episodeID, err := uuid.Parse(r.PathValue("episodeID"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid episode ID")
		return
	}

	tx, err := s.pool.Begin(r.Context())
	if err != nil {
		slog.Error("begin episode start", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to start generation")
		return
	}
	defer tx.Rollback(r.Context())

	started, err := jobs.StartEpisodeLocked(r.Context(), tx, s.river, s.cfg, episodeID)
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		writeError(w, http.StatusNotFound, "episode not found")
		return
	case errors.Is(err, jobs.ErrEpisodeNotStartable):
		writeError(w, http.StatusConflict, "episode does not wait for a manual start")
		return
	case errors.Is(err, jobs.ErrEpisodeGenerating):
		writeError(w, http.StatusConflict, "generation is already in progress")
		return
	case err != nil:
		slog.Error("start episode generation", "error", err, "episode", episodeID)
		writeError(w, http.StatusInternalServerError, "failed to start generation")
		return
	}
	if err := tx.Commit(r.Context()); err != nil {
		slog.Error("commit episode start", "error", err, "episode", episodeID)
		writeError(w, http.StatusInternalServerError, "failed to start generation")
		return
	}

	state, stage := playerEpisodeState(started.Status, false)
	writeJSON(w, http.StatusAccepted, map[string]any{
		"episode_id": started.EpisodeID,
		"job_id":     started.JobID,
		"job_kind":   started.JobKind,
		"state":      state,
		"stage":      stage,
	})
}

func parseOptionalRFC3339(w http.ResponseWriter, value, field string) (*time.Time, bool) {
	if value == "" {
		return nil, true
	}
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		writeError(w, http.StatusBadRequest, field+" must be an RFC3339 timestamp")
		return nil, false
	}
	return &parsed, true
}

// parseEpisodeIDs reads the episodes a list is narrowed to. An empty value asks
// for the whole window, which is what a caller that has no list yet needs.
func parseEpisodeIDs(w http.ResponseWriter, value string) ([]uuid.UUID, bool) {
	if value == "" {
		return nil, true
	}
	parts := strings.Split(value, ",")
	// The bound matches the largest window a player page can ask for, so a poll
	// can never ask for more episodes than a full list would have returned.
	if len(parts) > 500 {
		writeError(w, http.StatusBadRequest, "ids must name at most 500 episodes")
		return nil, false
	}
	ids := make([]uuid.UUID, 0, len(parts))
	for _, part := range parts {
		id, err := uuid.Parse(strings.TrimSpace(part))
		if err != nil {
			writeError(w, http.StatusBadRequest, "ids must be comma separated episode IDs")
			return nil, false
		}
		ids = append(ids, id)
	}
	return ids, true
}
