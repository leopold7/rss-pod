package jobs

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"

	"github.com/synrise25/rss-pod/internal/config"
)

var (
	// ErrEpisodeNotStartable reports that the episode does not wait for a manual
	// start, so a listener must not start it by hand. Only enabled poll-only
	// sources expose that state.
	ErrEpisodeNotStartable = errors.New("episode does not belong to a poll-only source")
	// ErrEpisodeGenerating reports that the episode is already being generated.
	ErrEpisodeGenerating = errors.New("episode generation is already in progress")
)

// StartedEpisode describes the stage a manually started episode was queued at.
type StartedEpisode struct {
	EpisodeID uuid.UUID `json:"episode_id"`
	JobID     int64     `json:"job_id"`
	JobKind   string    `json:"job_kind"`
	// Status is the in-progress episode status the start moved the episode to.
	Status string `json:"status"`
}

// StartEpisodeLocked starts generation for an episode that a poll-only source
// left waiting for a listener. The caller owns the transaction and must commit
// it.
//
// A queued episode starts at content resolution. A failed one resumes at the
// stage that failed, because that reuses documents, scripts, and audio segments
// which already exist.
//
// The episode never stays queued after a successful start: it is moved to the
// in-progress status of the stage that was queued, so a second request within
// the same poll-only source sees a busy episode instead of queueing the same
// work twice.
func StartEpisodeLocked(
	ctx context.Context,
	tx pgx.Tx,
	client *river.Client[pgx.Tx],
	cfg *config.Config,
	episodeID uuid.UUID,
) (StartedEpisode, error) {
	var sourceID, status string
	if err := tx.QueryRow(ctx, `
		SELECT source_id, status FROM episodes WHERE id = $1 FOR UPDATE
	`, episodeID).Scan(&sourceID, &status); err != nil {
		return StartedEpisode{}, err
	}
	source, ok := cfg.Source(sourceID)
	if !ok || !source.Enabled || !source.PollOnly {
		return StartedEpisode{}, ErrEpisodeNotStartable
	}

	switch status {
	case "queued":
		return enqueueEpisodeStage(ctx, tx, client, episodeID,
			ResolveContentArgs{EpisodeID: episodeID.String()}, "resolving_content")
	case "failed":
		retried, err := RetryEpisodeLocked(ctx, tx, client, episodeID)
		if err != nil {
			return StartedEpisode{}, err
		}
		// RetryEpisodeLocked records queued because it only re-enqueues work,
		// but a manual start must leave the episode busy so it cannot be started
		// a second time while the job is still queued.
		queuedStatus := stageStatus(retried.JobKind)
		if _, err := tx.Exec(ctx, `
			UPDATE episodes SET status = $2, error = '', updated_at = now() WHERE id = $1
		`, episodeID, queuedStatus); err != nil {
			return StartedEpisode{}, fmt.Errorf("mark episode %s: %w", queuedStatus, err)
		}
		return StartedEpisode{
			EpisodeID: retried.EpisodeID,
			JobID:     retried.JobID,
			JobKind:   retried.JobKind,
			Status:    queuedStatus,
		}, nil
	default:
		return StartedEpisode{}, ErrEpisodeGenerating
	}
}

// enqueueEpisodeStage inserts one pipeline job and records the matching
// in-progress episode status in the same transaction.
func enqueueEpisodeStage(
	ctx context.Context,
	tx pgx.Tx,
	client *river.Client[pgx.Tx],
	episodeID uuid.UUID,
	args river.JobArgs,
	status string,
) (StartedEpisode, error) {
	inserted, err := client.InsertTx(ctx, tx, args, nil)
	if err != nil {
		return StartedEpisode{}, fmt.Errorf("enqueue %s: %w", args.Kind(), err)
	}
	if inserted == nil || inserted.UniqueSkippedAsDuplicate {
		// River only deduplicates when insert options enable uniqueness. Should
		// that ever happen here, report a busy episode instead of leaving it
		// marked in progress without a job of its own.
		return StartedEpisode{}, ErrEpisodeGenerating
	}
	if _, err := tx.Exec(ctx, `
		UPDATE episodes SET status = $2, error = '', updated_at = now() WHERE id = $1
	`, episodeID, status); err != nil {
		return StartedEpisode{}, fmt.Errorf("mark episode %s: %w", status, err)
	}
	return StartedEpisode{
		EpisodeID: episodeID,
		JobID:     inserted.Job.ID,
		JobKind:   args.Kind(),
		Status:    status,
	}, nil
}

// stageStatus maps a pipeline job kind to the in-progress episode status the
// worker sets when it picks the job up.
func stageStatus(jobKind string) string {
	switch jobKind {
	case GenerateScriptArgs{}.Kind():
		return "generating_script"
	case GenerateTTSArgs{}.Kind():
		return "generating_tts"
	default:
		return "resolving_content"
	}
}
