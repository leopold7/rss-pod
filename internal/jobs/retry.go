package jobs

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/riverqueue/river"
)

// ErrEpisodeNotFailed reports that the episode is not in the failed state and
// therefore must not be re-queued.
var ErrEpisodeNotFailed = errors.New("only failed episodes can be retried")

// RetriedEpisode describes the stage a failed episode was re-queued at.
type RetriedEpisode struct {
	EpisodeID uuid.UUID `json:"episode_id"`
	JobID     int64     `json:"job_id"`
	JobKind   string    `json:"job_kind"`
}

// RetryEpisodeLocked re-enqueues a failed episode at the stage that failed and
// resets it to queued. The caller owns the transaction and must commit it.
//
// completed and discarded River jobs do not block a new insertion, so a failed
// episode can be resumed without re-polling its source feed.
func RetryEpisodeLocked(ctx context.Context, tx pgx.Tx, client *river.Client[pgx.Tx], episodeID uuid.UUID) (RetriedEpisode, error) {
	var status string
	var documents, turns int
	err := tx.QueryRow(ctx, `
		SELECT e.status,
		       (SELECT count(*) FROM documents d WHERE d.episode_id = e.id),
		       (SELECT count(*) FROM script_turns t WHERE t.episode_id = e.id)
		FROM episodes e WHERE e.id = $1 FOR UPDATE
	`, episodeID).Scan(&status, &documents, &turns)
	if err != nil {
		return RetriedEpisode{}, err
	}
	if status != "failed" {
		return RetriedEpisode{}, ErrEpisodeNotFailed
	}

	var args river.JobArgs
	switch {
	case documents == 0:
		args = ResolveContentArgs{EpisodeID: episodeID.String()}
	case turns == 0:
		args = GenerateScriptArgs{EpisodeID: episodeID.String()}
	default:
		// GenerateTTSWorker reuses audio segments that already exist and then
		// chains composition, so it is safe for TTS and compose failures.
		args = GenerateTTSArgs{EpisodeID: episodeID.String()}
	}
	inserted, err := client.InsertTx(ctx, tx, args, nil)
	if err != nil {
		return RetriedEpisode{}, fmt.Errorf("enqueue %s: %w", args.Kind(), err)
	}
	if _, err := tx.Exec(ctx, `
		UPDATE episodes SET status = 'queued', error = '', updated_at = now() WHERE id = $1
	`, episodeID); err != nil {
		return RetriedEpisode{}, fmt.Errorf("reset episode status: %w", err)
	}
	return RetriedEpisode{EpisodeID: episodeID, JobID: inserted.Job.ID, JobKind: args.Kind()}, nil
}
