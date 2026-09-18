package app

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/rivertype"

	"github.com/synrise25/rss-pod/internal/config"
	"github.com/synrise25/rss-pod/internal/database"
)

// stoppedWorkError explains why the stop command recorded work as failed.
const stoppedWorkError = "stopped by operator"

// inFlightJobStates are the River states for jobs that still have work to do.
var inFlightJobStates = []rivertype.JobState{
	rivertype.JobStateAvailable,
	rivertype.JobStatePending,
	rivertype.JobStateRetryable,
	rivertype.JobStateRunning,
	rivertype.JobStateScheduled,
}

// StopResult summarizes what the stop command interrupted.
type StopResult struct {
	CancelledJobs  int `json:"cancelled_jobs"`
	FailedEpisodes int `json:"failed_episodes"`
	FailedRuns     int `json:"failed_runs"`
}

// StopRunningTasks cancels every in-flight River job and records the episodes
// and source runs they belong to as failed, so `retry` can resume them later.
//
// Scheduled polls are not disabled: the source scheduler enqueues them again at
// their next cron tick.
func StopRunningTasks(ctx context.Context, cfg *config.Config) (StopResult, error) {
	pool, err := database.Open(ctx, cfg.Runtime.Database)
	if err != nil {
		return StopResult{}, err
	}
	defer pool.Close()
	client, err := newRiverClient(cfg, pool, nil)
	if err != nil {
		return StopResult{}, err
	}

	jobIDs, err := inFlightJobIDs(ctx, client)
	if err != nil {
		return StopResult{}, err
	}
	cancelled := 0
	for _, jobID := range jobIDs {
		if _, err := client.JobCancel(ctx, jobID); err != nil {
			if errors.Is(err, river.ErrNotFound) {
				// The job finished on its own between listing and cancelling.
				continue
			}
			return StopResult{}, fmt.Errorf("cancel job %d: %w", jobID, err)
		}
		cancelled++
	}

	episodes, runs, err := failInFlightWork(ctx, pool, cfg.PollOnlySourceIDs())
	if err != nil {
		return StopResult{}, err
	}
	return StopResult{CancelledJobs: cancelled, FailedEpisodes: episodes, FailedRuns: runs}, nil
}

// inFlightJobIDs lists every River job that is queued, running, or waiting for
// a delayed retry.
func inFlightJobIDs(ctx context.Context, client *river.Client[pgx.Tx]) ([]int64, error) {
	const pageSize = 1000
	ids := make([]int64, 0)
	params := river.NewJobListParams().States(inFlightJobStates...).First(pageSize)
	for {
		result, err := client.JobList(ctx, params)
		if err != nil {
			return nil, fmt.Errorf("list in-flight jobs: %w", err)
		}
		for _, job := range result.Jobs {
			ids = append(ids, job.ID)
		}
		if result.LastCursor == nil || len(result.Jobs) < pageSize {
			return ids, nil
		}
		params = params.After(result.LastCursor)
	}
}

// failInFlightWork marks every episode and source run that is still in flight as
// failed. Published and already failed rows are left untouched, and so are the
// episodes poll-only sources left waiting for a listener: a queued episode of
// such a source has no job behind it, so stopping work must not turn it into a
// failure the listener never caused.
func failInFlightWork(ctx context.Context, pool *pgxpool.Pool, pollOnlySourceIDs []string) (episodes, runs int, err error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return 0, 0, fmt.Errorf("begin stop transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	episodeTag, err := tx.Exec(ctx, `
		UPDATE episodes
		SET status = 'failed', error = $1, updated_at = now()
		WHERE status NOT IN ('published', 'failed')
		  AND NOT (status = 'queued' AND source_id = ANY(COALESCE($2::text[], '{}')))
	`, stoppedWorkError, pollOnlySourceIDs)
	if err != nil {
		return 0, 0, fmt.Errorf("fail in-flight episodes: %w", err)
	}
	runTag, err := tx.Exec(ctx, `
		UPDATE source_runs
		SET status = 'failed', error = $1, completed_at = now()
		WHERE status NOT IN ('completed', 'failed')
	`, stoppedWorkError)
	if err != nil {
		return 0, 0, fmt.Errorf("fail in-flight source runs: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return 0, 0, fmt.Errorf("commit stop: %w", err)
	}
	return int(episodeTag.RowsAffected()), int(runTag.RowsAffected()), nil
}
