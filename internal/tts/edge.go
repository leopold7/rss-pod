package tts

import (
	"context"
	"errors"
	"log/slog"
	"math/rand/v2"
	"strings"
	"time"

	edgetts "github.com/foresturquhart/edge-tts"
)

// Edge TTS rejects a WebSocket handshake with HTTP 403 while Microsoft's
// regional v2 rollout is in flight, and the client library's built-in recovery
// only re-sends the identical Sec-MS-GEC token. Retrying the whole stream with a
// short jittered backoff lets the next attempt land on a healthy backend node
// instead of failing the episode.
const edgeHandshakeAttempts = 3

// edgeHandshakeBaseDelay is the delay before the second attempt; it doubles for
// every further attempt. It is a variable so tests can shrink it.
var edgeHandshakeBaseDelay = time.Second

// IsEdgeHandshakeFailure reports whether err is an Edge TTS WebSocket handshake
// rejection.
//
// The edge-tts client wraps gorilla/websocket errors with %v, so neither the
// underlying websocket.ErrBadHandshake nor the HTTP status code survive
// wrapping: only the sentinel and the message text can be matched. Do not
// replace this with an errors.Is(websocket.ErrBadHandshake) check.
func IsEdgeHandshakeFailure(err error) bool {
	return errors.Is(err, edgetts.ErrWebSocket) && strings.Contains(err.Error(), "bad handshake")
}

// RetryEdgeHandshake runs attempt until it succeeds, until the error stops
// looking like a handshake rejection, or until edgeHandshakeAttempts is
// exhausted. The caller must discard the partial output of a failed attempt,
// because each attempt starts from a clean buffer.
func RetryEdgeHandshake(ctx context.Context, attempt func() error) error {
	var err error
	for i := 1; i <= edgeHandshakeAttempts; i++ {
		if i > 1 {
			if waitErr := sleepWithContext(ctx, edgeHandshakeDelay(i-1)); waitErr != nil {
				return err
			}
			slog.WarnContext(ctx, "retrying Edge TTS after handshake rejection",
				"attempt", i, "max_attempts", edgeHandshakeAttempts, "error", err)
		}
		if err = attempt(); err == nil {
			return nil
		}
		if !IsEdgeHandshakeFailure(err) || ctx.Err() != nil {
			return err
		}
	}
	return err
}

// edgeHandshakeDelay returns the exponential backoff plus jitter before attempt
// number retry, counting from one.
func edgeHandshakeDelay(retry int) time.Duration {
	delay := edgeHandshakeBaseDelay << (retry - 1)
	return delay + time.Duration(rand.Int64N(int64(delay)))
}

func sleepWithContext(ctx context.Context, delay time.Duration) error {
	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}
