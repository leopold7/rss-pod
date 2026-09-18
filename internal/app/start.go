package app

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"

	"github.com/synrise25/rss-pod/internal/config"
	"github.com/synrise25/rss-pod/internal/database"
	"github.com/synrise25/rss-pod/internal/jobs"
)

// MaxStartEpisodes caps how many episodes one command may start.
const MaxStartEpisodes = 200

// ParsePollOnlySources resolves the source selection of the start command.
// "all" selects every enabled poll-only source, while an explicit list has to
// name poll-only sources so a mistake cannot look like "nothing to do".
func ParsePollOnlySources(cfg *config.Config, value string) ([]config.SourceConfig, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil, fmt.Errorf("--sources is required")
	}
	if value == "all" {
		sources := make([]config.SourceConfig, 0, len(cfg.Sources))
		for _, source := range cfg.Sources {
			if source.Enabled && source.PollOnly {
				sources = append(sources, source)
			}
		}
		if len(sources) == 0 {
			return nil, fmt.Errorf("configuration has no enabled poll-only sources")
		}
		return sources, nil
	}

	sources, err := ParsePollSources(cfg, value)
	if err != nil {
		return nil, err
	}
	for _, source := range sources {
		if !source.PollOnly {
			return nil, fmt.Errorf("source %q does not use poll_only and generates automatically", source.ID)
		}
	}
	return sources, nil
}

// StartEpisodes starts generation for the named episodes. Each episode must
// belong to a poll-only source and either wait for a start or have failed,
// which resumes it at the stage that failed.
func StartEpisodes(ctx context.Context, cfg *config.Config, episodeIDs []uuid.UUID) ([]jobs.StartedEpisode, error) {
	if len(episodeIDs) == 0 {
		return nil, errors.New("at least one episode is required")
	}
	if len(episodeIDs) > MaxStartEpisodes {
		return nil, fmt.Errorf("at most %d episodes can be started at once", MaxStartEpisodes)
	}
	pool, client, err := openStartClient(ctx, cfg)
	if err != nil {
		return nil, err
	}
	defer pool.Close()
	return startEpisodes(ctx, cfg, pool, client, episodeIDs)
}

// StartWaitingEpisodes starts the oldest waiting episodes of the selected
// poll-only sources. Failed episodes are left to `retry`, which reports the
// stage each one resumes at.
func StartWaitingEpisodes(ctx context.Context, cfg *config.Config, sources []config.SourceConfig, limit int) ([]jobs.StartedEpisode, error) {
	if len(sources) == 0 {
		return nil, errors.New("at least one source is required")
	}
	if limit < 1 || limit > MaxStartEpisodes {
		return nil, fmt.Errorf("limit must be between 1 and %d", MaxStartEpisodes)
	}
	sourceIDs := make([]string, 0, len(sources))
	for _, source := range sources {
		sourceIDs = append(sourceIDs, source.ID)
	}

	pool, client, err := openStartClient(ctx, cfg)
	if err != nil {
		return nil, err
	}
	defer pool.Close()

	rows, err := pool.Query(ctx, `
		SELECT id FROM episodes
		WHERE status = 'queued' AND source_id = ANY($1)
		ORDER BY created_at DESC, id
		LIMIT $2
	`, sourceIDs, limit)
	if err != nil {
		return nil, fmt.Errorf("query waiting episodes: %w", err)
	}
	episodeIDs := make([]uuid.UUID, 0)
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return nil, fmt.Errorf("scan waiting episode: %w", err)
		}
		episodeIDs = append(episodeIDs, id)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return nil, fmt.Errorf("iterate waiting episodes: %w", err)
	}
	rows.Close()

	return startEpisodes(ctx, cfg, pool, client, episodeIDs)
}

func openStartClient(ctx context.Context, cfg *config.Config) (*pgxpool.Pool, *river.Client[pgx.Tx], error) {
	pool, err := database.Open(ctx, cfg.Runtime.Database)
	if err != nil {
		return nil, nil, err
	}
	client, err := newRiverClient(cfg, pool, nil)
	if err != nil {
		pool.Close()
		return nil, nil, err
	}
	return pool, client, nil
}

func startEpisodes(
	ctx context.Context,
	cfg *config.Config,
	pool *pgxpool.Pool,
	client *river.Client[pgx.Tx],
	episodeIDs []uuid.UUID,
) ([]jobs.StartedEpisode, error) {
	started := make([]jobs.StartedEpisode, 0, len(episodeIDs))
	for _, episodeID := range episodeIDs {
		result, err := startEpisode(ctx, cfg, pool, client, episodeID)
		if err != nil {
			return started, fmt.Errorf("start episode %s: %w", episodeID, err)
		}
		started = append(started, result)
	}
	return started, nil
}

func startEpisode(
	ctx context.Context,
	cfg *config.Config,
	pool *pgxpool.Pool,
	client *river.Client[pgx.Tx],
	episodeID uuid.UUID,
) (jobs.StartedEpisode, error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return jobs.StartedEpisode{}, fmt.Errorf("begin start transaction: %w", err)
	}
	defer tx.Rollback(ctx)
	result, err := jobs.StartEpisodeLocked(ctx, tx, client, cfg, episodeID)
	if err != nil {
		return jobs.StartedEpisode{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return jobs.StartedEpisode{}, fmt.Errorf("commit start: %w", err)
	}
	return result, nil
}
