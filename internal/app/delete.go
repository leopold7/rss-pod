package app

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/synrise25/rss-pod/internal/config"
	"github.com/synrise25/rss-pod/internal/database"
	"github.com/synrise25/rss-pod/internal/storage"
)

// MaxDeleteEpisodes caps how many failed episodes one command may delete.
const MaxDeleteEpisodes = 1000

// terminalJobStates are the River states that no worker will act on again, so
// their records are safe to delete.
const terminalJobStates = `('completed', 'cancelled', 'discarded')`

// DeleteFailedTasksOptions configures one delete run.
type DeleteFailedTasksOptions struct {
	Limit  int
	DryRun bool
	// Ignore remembers the deleted items so later polls skip them instead of
	// generating the same episode again.
	Ignore bool
	// IncludeWaiting also deletes the queued episodes of poll-only sources,
	// which wait for a listener instead of running the pipeline.
	IncludeWaiting bool
}

// DeletedTasks reports what the delete command removed, or would remove.
type DeletedTasks struct {
	DryRun     bool        `json:"dry_run,omitempty"`
	Episodes   int         `json:"episodes"`
	FeedItems  int         `json:"feed_items"`
	Objects    int         `json:"objects"`
	Jobs       int         `json:"jobs"`
	Runs       int         `json:"runs"`
	Ignored    int         `json:"ignored"`
	EpisodeIDs []uuid.UUID `json:"episode_ids"`
}

// IgnoredFeedItem is one RSS item that later polls skip.
type IgnoredFeedItem struct {
	SourceID   string    `json:"source_id"`
	ExternalID string    `json:"external_id"`
	Title      string    `json:"title,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

// deleteTarget is one failed episode with everything that references it.
type deleteTarget struct {
	episodeID  uuid.UUID
	feedItemID int64
	sourceID   string
	externalID string
	title      string
	segments   []string
	mediaKey   string
}

func (t deleteTarget) objectKeys() []string {
	keys := make([]string, 0, len(t.segments)+1)
	keys = append(keys, t.segments...)
	if t.mediaKey != "" {
		keys = append(keys, t.mediaKey)
	}
	return keys
}

// DeleteFailedTasks purges failed episodes of the selected sources: their
// documents, scripts, and audio segments, the audio objects those segments
// point at, the feed items that carry the original content, the finished River
// job records, and the failed poll records of those sources.
//
// IncludeWaiting widens the selection to the queued episodes of poll-only
// sources, which wait for a listener and own no job yet.
//
// Feed items are removed, so a later poll treats the same RSS entry as new and
// generates it again unless the item was remembered with Ignore.
func DeleteFailedTasks(
	ctx context.Context,
	cfg *config.Config,
	sources []config.SourceConfig,
	opts DeleteFailedTasksOptions,
) (DeletedTasks, error) {
	if err := validateDeleteSources(sources); err != nil {
		return DeletedTasks{}, err
	}
	if opts.Limit < 1 || opts.Limit > MaxDeleteEpisodes {
		return DeletedTasks{}, fmt.Errorf("limit must be between 1 and %d", MaxDeleteEpisodes)
	}
	sourceIDs := sourceIDsOf(sources)
	waitingIDs := waitingSourceIDsOf(sources, opts.IncludeWaiting)

	pool, err := database.Open(ctx, cfg.Runtime.Database)
	if err != nil {
		return DeletedTasks{}, err
	}
	defer pool.Close()

	if opts.DryRun {
		return describeDelete(ctx, pool, sourceIDs, waitingIDs, opts)
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return DeletedTasks{}, fmt.Errorf("begin delete transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	targets, err := loadDeleteTargets(ctx, tx, sourceIDs, waitingIDs, opts.Limit)
	if err != nil {
		return DeletedTasks{}, err
	}
	result := DeletedTasks{Episodes: len(targets), FeedItems: len(targets), EpisodeIDs: episodeIDsOf(targets)}
	for _, target := range targets {
		result.Objects += len(target.objectKeys())
	}

	if len(targets) > 0 {
		episodeIDs := uuidStrings(result.EpisodeIDs)
		jobTag, err := tx.Exec(ctx, `
			DELETE FROM river_job
			WHERE args->>'episode_id' = ANY($1::text[])
			  AND state IN `+terminalJobStates, episodeIDs)
		if err != nil {
			return DeletedTasks{}, fmt.Errorf("delete episode job records: %w", err)
		}
		result.Jobs = int(jobTag.RowsAffected())

		if _, err := tx.Exec(ctx, `DELETE FROM episodes WHERE id = ANY($1::uuid[])`, result.EpisodeIDs); err != nil {
			return DeletedTasks{}, fmt.Errorf("delete failed episodes: %w", err)
		}
		feedItemIDs := make([]int64, 0, len(targets))
		for _, target := range targets {
			feedItemIDs = append(feedItemIDs, target.feedItemID)
		}
		if _, err := tx.Exec(ctx, `DELETE FROM feed_items WHERE id = ANY($1::bigint[])`, feedItemIDs); err != nil {
			return DeletedTasks{}, fmt.Errorf("delete feed items: %w", err)
		}
		if opts.Ignore {
			ignored, err := rememberDeletedItems(ctx, tx, targets)
			if err != nil {
				return DeletedTasks{}, err
			}
			result.Ignored = ignored
		}
		// Stored audio goes last: everything above is transactional, so a
		// storage failure still rolls the records back for a clean retry, and
		// removing an already removed key is not an error.
		if err := removeTargetObjects(ctx, cfg, targets); err != nil {
			return DeletedTasks{}, err
		}
	}

	runTag, err := tx.Exec(ctx, `
		DELETE FROM source_runs WHERE status = 'failed' AND source_id = ANY($1)
	`, sourceIDs)
	if err != nil {
		return DeletedTasks{}, fmt.Errorf("delete failed source runs: %w", err)
	}
	result.Runs = int(runTag.RowsAffected())

	if err := tx.Commit(ctx); err != nil {
		return DeletedTasks{}, fmt.Errorf("commit delete: %w", err)
	}
	return result, nil
}

// describeDelete counts what a delete run would remove without changing
// anything.
func describeDelete(ctx context.Context, pool *pgxpool.Pool, sourceIDs, waitingIDs []string, opts DeleteFailedTasksOptions) (DeletedTasks, error) {
	targets, err := loadDeleteTargets(ctx, pool, sourceIDs, waitingIDs, opts.Limit)
	if err != nil {
		return DeletedTasks{}, err
	}
	result := DeletedTasks{
		DryRun:     true,
		Episodes:   len(targets),
		FeedItems:  len(targets),
		EpisodeIDs: episodeIDsOf(targets),
	}
	for _, target := range targets {
		result.Objects += len(target.objectKeys())
	}
	if len(targets) > 0 {
		if err := pool.QueryRow(ctx, `
			SELECT count(*) FROM river_job
			WHERE args->>'episode_id' = ANY($1::text[])
			  AND state IN `+terminalJobStates, uuidStrings(result.EpisodeIDs)).Scan(&result.Jobs); err != nil {
			return DeletedTasks{}, fmt.Errorf("count episode job records: %w", err)
		}
		if opts.Ignore {
			var known int
			if err := pool.QueryRow(ctx, `
				SELECT count(*) FROM ignored_feed_items
				WHERE source_id = ANY($1) AND external_id = ANY($2)
			`, sourceIDs, externalIDsOf(targets)).Scan(&known); err != nil {
				return DeletedTasks{}, fmt.Errorf("count remembered items: %w", err)
			}
			result.Ignored = len(targets) - known
		}
	}
	if err := pool.QueryRow(ctx, `
		SELECT count(*) FROM source_runs WHERE status = 'failed' AND source_id = ANY($1)
	`, sourceIDs).Scan(&result.Runs); err != nil {
		return DeletedTasks{}, fmt.Errorf("count failed source runs: %w", err)
	}
	return result, nil
}

// ListIgnoredFeedItems returns the items later polls skip.
func ListIgnoredFeedItems(
	ctx context.Context,
	cfg *config.Config,
	sources []config.SourceConfig,
	limit int,
) ([]IgnoredFeedItem, error) {
	if err := validateDeleteSources(sources); err != nil {
		return nil, err
	}
	if limit < 1 || limit > MaxDeleteEpisodes {
		return nil, fmt.Errorf("limit must be between 1 and %d", MaxDeleteEpisodes)
	}
	pool, err := database.Open(ctx, cfg.Runtime.Database)
	if err != nil {
		return nil, err
	}
	defer pool.Close()
	rows, err := pool.Query(ctx, `
		SELECT source_id, external_id, title, created_at
		FROM ignored_feed_items
		WHERE source_id = ANY($1)
		ORDER BY created_at DESC, source_id, external_id
		LIMIT $2
	`, sourceIDsOf(sources), limit)
	if err != nil {
		return nil, fmt.Errorf("query ignored feed items: %w", err)
	}
	defer rows.Close()
	items := make([]IgnoredFeedItem, 0)
	for rows.Next() {
		var item IgnoredFeedItem
		if err := rows.Scan(&item.SourceID, &item.ExternalID, &item.Title, &item.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan ignored feed item: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate ignored feed items: %w", err)
	}
	return items, nil
}

// ForgetIgnoredFeedItems drops the skip records of the selected sources, so a
// later poll generates those items again.
func ForgetIgnoredFeedItems(
	ctx context.Context,
	cfg *config.Config,
	sources []config.SourceConfig,
	dryRun bool,
) (int, error) {
	if err := validateDeleteSources(sources); err != nil {
		return 0, err
	}
	sourceIDs := sourceIDsOf(sources)
	pool, err := database.Open(ctx, cfg.Runtime.Database)
	if err != nil {
		return 0, err
	}
	defer pool.Close()
	if dryRun {
		var count int
		if err := pool.QueryRow(ctx, `
			SELECT count(*) FROM ignored_feed_items WHERE source_id = ANY($1)
		`, sourceIDs).Scan(&count); err != nil {
			return 0, fmt.Errorf("count ignored feed items: %w", err)
		}
		return count, nil
	}
	tag, err := pool.Exec(ctx, `DELETE FROM ignored_feed_items WHERE source_id = ANY($1)`, sourceIDs)
	if err != nil {
		return 0, fmt.Errorf("delete ignored feed items: %w", err)
	}
	return int(tag.RowsAffected()), nil
}

// queryer is satisfied by both a pool and a transaction.
type queryer interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
}

func loadDeleteTargets(ctx context.Context, q queryer, sourceIDs, waitingIDs []string, limit int) ([]deleteTarget, error) {
	rows, err := q.Query(ctx, `
		SELECT e.id, e.feed_item_id, f.external_id, e.source_id, e.title, e.audio_object_key
		FROM episodes AS e
		JOIN feed_items AS f ON f.id = e.feed_item_id
		WHERE e.source_id = ANY($1)
		  AND (
		        e.status = 'failed'
		        OR (e.status = 'queued' AND e.source_id = ANY($2::text[]))
		      )
		ORDER BY e.created_at DESC, e.id
		LIMIT $3
	`, sourceIDs, waitingIDs, limit)
	if err != nil {
		return nil, fmt.Errorf("query failed episodes: %w", err)
	}
	targets := make([]deleteTarget, 0)
	for rows.Next() {
		var target deleteTarget
		if err := rows.Scan(&target.episodeID, &target.feedItemID, &target.externalID,
			&target.sourceID, &target.title, &target.mediaKey); err != nil {
			rows.Close()
			return nil, fmt.Errorf("scan failed episode: %w", err)
		}
		targets = append(targets, target)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return nil, fmt.Errorf("iterate failed episodes: %w", err)
	}
	rows.Close()
	if len(targets) == 0 {
		return targets, nil
	}

	segmentRows, err := q.Query(ctx, `
		SELECT episode_id, object_key FROM audio_segments
		WHERE episode_id = ANY($1::uuid[])
		ORDER BY episode_id, position
	`, episodeIDsOf(targets))
	if err != nil {
		return nil, fmt.Errorf("query episode audio segments: %w", err)
	}
	defer segmentRows.Close()
	segments := make(map[uuid.UUID][]string, len(targets))
	for segmentRows.Next() {
		var episodeID uuid.UUID
		var objectKey string
		if err := segmentRows.Scan(&episodeID, &objectKey); err != nil {
			return nil, fmt.Errorf("scan episode audio segment: %w", err)
		}
		segments[episodeID] = append(segments[episodeID], objectKey)
	}
	if err := segmentRows.Err(); err != nil {
		return nil, fmt.Errorf("iterate episode audio segments: %w", err)
	}
	for index := range targets {
		targets[index].segments = segments[targets[index].episodeID]
	}
	return targets, nil
}

// removeTargetObjects deletes the stored audio of the targeted episodes. A
// missing object is not an error, so re-running a partial delete is safe.
func removeTargetObjects(ctx context.Context, cfg *config.Config, targets []deleteTarget) error {
	private := make([]string, 0)
	media := make([]string, 0)
	for _, target := range targets {
		private = append(private, target.segments...)
		if target.mediaKey != "" {
			media = append(media, target.mediaKey)
		}
	}
	if len(private) == 0 && len(media) == 0 {
		return nil
	}
	client, err := storage.New(cfg.Runtime.Storage)
	if err != nil {
		return err
	}
	if len(private) > 0 {
		if err := client.RemovePrivate(ctx, private...); err != nil {
			return err
		}
	}
	if len(media) > 0 {
		if err := client.RemoveMedia(ctx, media...); err != nil {
			return err
		}
	}
	return nil
}

func rememberDeletedItems(ctx context.Context, tx pgx.Tx, targets []deleteTarget) (int, error) {
	sourceIDs := make([]string, 0, len(targets))
	externalIDs := make([]string, 0, len(targets))
	titles := make([]string, 0, len(targets))
	for _, target := range targets {
		sourceIDs = append(sourceIDs, target.sourceID)
		externalIDs = append(externalIDs, target.externalID)
		titles = append(titles, target.title)
	}
	tag, err := tx.Exec(ctx, `
		INSERT INTO ignored_feed_items (source_id, external_id, title)
		SELECT * FROM unnest($1::text[], $2::text[], $3::text[])
		ON CONFLICT (source_id, external_id) DO UPDATE SET title = EXCLUDED.title
	`, sourceIDs, externalIDs, titles)
	if err != nil {
		return 0, fmt.Errorf("remember deleted items: %w", err)
	}
	return int(tag.RowsAffected()), nil
}

func validateDeleteSources(sources []config.SourceConfig) error {
	if len(sources) == 0 {
		return fmt.Errorf("at least one source is required")
	}
	return nil
}

// waitingSourceIDsOf lists the selected sources whose queued episodes wait for
// a listener. Only a poll-only source keeps that state: an automatic source
// queues its first stage in the same transaction that creates the episode, so a
// queued episode there is in flight and must keep its job.
func waitingSourceIDsOf(sources []config.SourceConfig, include bool) []string {
	if !include {
		return nil
	}
	ids := make([]string, 0, len(sources))
	for _, source := range sources {
		if source.PollOnly {
			ids = append(ids, source.ID)
		}
	}
	return ids
}

func sourceIDsOf(sources []config.SourceConfig) []string {
	ids := make([]string, 0, len(sources))
	for _, source := range sources {
		ids = append(ids, source.ID)
	}
	return ids
}

func episodeIDsOf(targets []deleteTarget) []uuid.UUID {
	ids := make([]uuid.UUID, 0, len(targets))
	for _, target := range targets {
		ids = append(ids, target.episodeID)
	}
	return ids
}

func externalIDsOf(targets []deleteTarget) []string {
	ids := make([]string, 0, len(targets))
	for _, target := range targets {
		ids = append(ids, target.externalID)
	}
	return ids
}

func uuidStrings(ids []uuid.UUID) []string {
	values := make([]string, 0, len(ids))
	for _, id := range ids {
		values = append(values, id.String())
	}
	return values
}
