package tts

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	edgetts "github.com/foresturquhart/edge-tts"
)

// edgeHandshakeError mirrors the error text that reaches callers: the client
// library wraps the gorilla/websocket error with %v, so the underlying
// websocket.ErrBadHandshake is not preserved.
func edgeHandshakeError() error {
	return fmt.Errorf("%w: %v", edgetts.ErrWebSocket, errors.New("websocket: bad handshake"))
}

func TestIsEdgeHandshakeFailure(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want bool
	}{
		{"handshake rejection", edgeHandshakeError(), true},
		{"websocket read failure", fmt.Errorf("%w: %v", edgetts.ErrWebSocket, errors.New("read: connection reset by peer")), false},
		{"bad handshake without sentinel", errors.New("websocket: bad handshake"), false},
		{"no error", nil, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsEdgeHandshakeFailure(tt.err); got != tt.want {
				t.Fatalf("IsEdgeHandshakeFailure(%v) = %v, want %v", tt.err, got, tt.want)
			}
		})
	}
}

func TestRetryEdgeHandshakeSucceedsAfterRejection(t *testing.T) {
	shrinkEdgeHandshakeDelay(t)
	attempts := 0
	err := RetryEdgeHandshake(context.Background(), func() error {
		attempts++
		if attempts == 1 {
			return edgeHandshakeError()
		}
		return nil
	})
	if err != nil {
		t.Fatalf("RetryEdgeHandshake() error = %v, want success on the second attempt", err)
	}
	if attempts != 2 {
		t.Fatalf("attempts = %d, want 2", attempts)
	}
}

func TestRetryEdgeHandshakeStopsOnOtherErrors(t *testing.T) {
	shrinkEdgeHandshakeDelay(t)
	want := fmt.Errorf("%w: %v", edgetts.ErrWebSocket, errors.New("read: connection reset by peer"))
	attempts := 0
	err := RetryEdgeHandshake(context.Background(), func() error {
		attempts++
		return want
	})
	if !errors.Is(err, want) {
		t.Fatalf("RetryEdgeHandshake() error = %v, want %v", err, want)
	}
	if attempts != 1 {
		t.Fatalf("attempts = %d, want 1: non-handshake errors must not be retried", attempts)
	}
}

func TestRetryEdgeHandshakeGivesUpAfterMaxAttempts(t *testing.T) {
	shrinkEdgeHandshakeDelay(t)
	attempts := 0
	err := RetryEdgeHandshake(context.Background(), func() error {
		attempts++
		return edgeHandshakeError()
	})
	if !IsEdgeHandshakeFailure(err) {
		t.Fatalf("RetryEdgeHandshake() error = %v, want the last handshake failure", err)
	}
	if attempts != edgeHandshakeAttempts {
		t.Fatalf("attempts = %d, want %d", attempts, edgeHandshakeAttempts)
	}
}

func TestRetryEdgeHandshakeHonoursCancelledContext(t *testing.T) {
	shrinkEdgeHandshakeDelay(t)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	attempts := 0
	err := RetryEdgeHandshake(ctx, func() error {
		attempts++
		cancel()
		return edgeHandshakeError()
	})
	if !IsEdgeHandshakeFailure(err) {
		t.Fatalf("RetryEdgeHandshake() error = %v, want the handshake failure", err)
	}
	if attempts != 1 {
		t.Fatalf("attempts = %d, want 1: a cancelled context must stop retrying", attempts)
	}
}

func shrinkEdgeHandshakeDelay(t *testing.T) {
	t.Helper()
	original := edgeHandshakeBaseDelay
	edgeHandshakeBaseDelay = time.Millisecond
	t.Cleanup(func() { edgeHandshakeBaseDelay = original })
}
