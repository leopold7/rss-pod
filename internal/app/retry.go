package app

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"

	"github.com/synrise25/rss-pod/internal/config"
	"github.com/synrise25/rss-pod/internal/database"
	"github.com/synrise25/rss-pod/internal/jobs"
)

// MaxRetryEpisodes caps how many failed episodes one command may re-queue.
const MaxRetryEpisodes = 200

// RetryFailedEpisodes re-queues failed episodes of the selected sources at the
// stage each one failed, without polling the source feed again.
func RetryFailedEpisodes(
	ctx context.Context,
	cfg *config.Config,
	sources []config.SourceConfig,
	limit int,
) ([]jobs.RetriedEpisode, error) {
	if len(sources) == 0 {
		return nil, fmt.Errorf("at least one source is required")
	}
	if limit < 1 || limit > MaxRetryEpisodes {
		return nil, fmt.Errorf("limit must be between 1 and %d", MaxRetryEpisodes)
	}
	sourceIDs := make([]string, 0, len(sources))
	for _, source := range sources {
		sourceIDs = append(sourceIDs, source.ID)
	}

	pool, err := database.Open(ctx, cfg.Runtime.Database)
	if err != nil {
		return nil, err
	}
	defer pool.Close()
	client, err := newRiverClient(cfg, pool, nil)
	if err != nil {
		return nil, err
	}

	rows, err := pool.Query(ctx, `
		SELECT id FROM episodes
		WHERE status = 'failed' AND source_id = ANY($1)
		ORDER BY created_at DESC, id
		LIMIT $2
	`, sourceIDs, limit)
	if err != nil {
		return nil, fmt.Errorf("query failed episodes: %w", err)
	}
	episodeIDs := make([]uuid.UUID, 0)
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return nil, fmt.Errorf("scan failed episode: %w", err)
		}
		episodeIDs = append(episodeIDs, id)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return nil, fmt.Errorf("iterate failed episodes: %w", err)
	}
	rows.Close()

	retried := make([]jobs.RetriedEpisode, 0, len(episodeIDs))
	for _, episodeID := range episodeIDs {
		result, err := retryEpisode(ctx, pool, client, episodeID)
		if errors.Is(err, jobs.ErrEpisodeNotFailed) {
			// Already re-queued by a concurrent operation; nothing to do.
			continue
		}
		if err != nil {
			return retried, fmt.Errorf("retry episode %s: %w", episodeID, err)
		}
		retried = append(retried, result)
	}
	return retried, nil
}

func retryEpisode(ctx context.Context, pool *pgxpool.Pool, client *river.Client[pgx.Tx], episodeID uuid.UUID) (jobs.RetriedEpisode, error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return jobs.RetriedEpisode{}, fmt.Errorf("begin retry transaction: %w", err)
	}
	defer tx.Rollback(ctx)
	result, err := jobs.RetryEpisodeLocked(ctx, tx, client, episodeID)
	if err != nil {
		return jobs.RetriedEpisode{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return jobs.RetriedEpisode{}, fmt.Errorf("commit retry: %w", err)
	}
	return result, nil
}
