package jobs

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"
)

type permanentError struct{ err error }

const episodeFailureUpdateTimeout = 5 * time.Second

func (e *permanentError) Error() string { return e.err.Error() }
func (e *permanentError) Unwrap() error { return e.err }

func permanent(format string, args ...any) error {
	return &permanentError{err: fmt.Errorf(format, args...)}
}

func finishEpisodeAttempt(ctx context.Context, pool *pgxpool.Pool, episodeID string, attempt, maxAttempts int, workErr error) error {
	var permanentErr *permanentError
	isPermanent := errors.As(workErr, &permanentErr)
	status := episodeAttemptStatus(ctx, attempt, maxAttempts, workErr)
	updateCtx, cancel := episodeFailureUpdateContext(ctx)
	defer cancel()
	if _, err := pool.Exec(updateCtx, `
		UPDATE episodes SET status = $2, error = $3, updated_at = now() WHERE id = $1
	`, episodeID, status, workErr.Error()); err != nil {
		return fmt.Errorf("%v; update episode failure: %w", workErr, err)
	}
	if isPermanent {
		return river.JobCancel(workErr)
	}
	return workErr
}

func episodeFailureUpdateContext(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.WithoutCancel(ctx), episodeFailureUpdateTimeout)
}

// episodeAttemptStatus decides how an episode is recorded after a failed
// attempt. A cancelled job context means the job was cancelled (the stop
// command cancelled it, or the worker was asked to abort), so the episode
// becomes failed: nothing will retry it, and `retry` can resume it later. A job
// timeout is left as retrying because River runs the job again.
func episodeAttemptStatus(ctx context.Context, attempt, maxAttempts int, workErr error) string {
	var permanentErr *permanentError
	if errors.As(workErr, &permanentErr) || attempt >= maxAttempts || errors.Is(ctx.Err(), context.Canceled) {
		return "failed"
	}
	return "retrying"
}

// The pipeline args below tag EpisodeID as unique, but River only deduplicates
// when InsertOpts enables uniqueness (UniqueOpts.ByArgs and friends); a struct
// tag alone is inert. These jobs are therefore not deduplicated, and the
// episodes.status column is the single source of truth for whether a stage is
// already running.
type ResolveContentArgs struct {
	EpisodeID string `json:"episode_id" river:"unique"`
}

func (ResolveContentArgs) Kind() string { return "resolve_content" }
func (ResolveContentArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{Queue: "content", MaxAttempts: 5}
}

type GenerateScriptArgs struct {
	EpisodeID string `json:"episode_id" river:"unique"`
}

func (GenerateScriptArgs) Kind() string { return "generate_script" }
func (GenerateScriptArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{Queue: "llm", MaxAttempts: 4}
}

type GenerateTTSArgs struct {
	EpisodeID string `json:"episode_id" river:"unique"`
}

func (GenerateTTSArgs) Kind() string { return "generate_tts" }
func (GenerateTTSArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{Queue: "tts", MaxAttempts: 5}
}

type ComposeEpisodeArgs struct {
	EpisodeID string `json:"episode_id" river:"unique"`
}

func (ComposeEpisodeArgs) Kind() string { return "compose_episode" }
func (ComposeEpisodeArgs) InsertOpts() river.InsertOpts {
	return river.InsertOpts{Queue: "media", MaxAttempts: 5}
}
