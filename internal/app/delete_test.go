package app

import (
	"context"
	"testing"

	"github.com/synrise25/rss-pod/internal/config"
)

func TestDeleteFailedTasksValidatesBeforeConnecting(t *testing.T) {
	cfg := &config.Config{}
	sources := []config.SourceConfig{{ID: "alpha", Enabled: true}}
	tests := []struct {
		name    string
		sources []config.SourceConfig
		limit   int
	}{
		{name: "no sources", sources: nil, limit: 1},
		{name: "zero limit", sources: sources, limit: 0},
		{name: "limit above maximum", sources: sources, limit: MaxDeleteEpisodes + 1},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			// A zero-value database configuration would fail to connect, so a
			// passing test proves the input is rejected before any connection.
			for _, dryRun := range []bool{false, true} {
				opts := DeleteFailedTasksOptions{Limit: test.limit, DryRun: dryRun}
				if _, err := DeleteFailedTasks(context.Background(), cfg, test.sources, opts); err == nil {
					t.Fatalf("DeleteFailedTasks(dry_run=%t) unexpectedly succeeded", dryRun)
				}
			}
		})
	}
}

func TestWaitingSourceIDsOfOnlyIncludesPollOnlySourcesWhenRequested(t *testing.T) {
	sources := []config.SourceConfig{
		{ID: "manual", PollOnly: true},
		{ID: "automatic", Enabled: true},
	}
	if got := waitingSourceIDsOf(sources, false); got != nil {
		t.Fatalf("waitingSourceIDsOf(include=false) = %v, want nil", got)
	}
	got := waitingSourceIDsOf(sources, true)
	if len(got) != 1 || got[0] != "manual" {
		t.Fatalf("waitingSourceIDsOf(include=true) = %v, want only manual", got)
	}
}

func TestIgnoredFeedItemsValidateBeforeConnecting(t *testing.T) {
	cfg := &config.Config{}
	sources := []config.SourceConfig{{ID: "alpha", Enabled: true}}
	for _, test := range []struct {
		name    string
		sources []config.SourceConfig
		limit   int
	}{
		{name: "list without sources", limit: 1},
		{name: "list with a zero limit", sources: sources, limit: 0},
		{name: "list above the maximum", sources: sources, limit: MaxDeleteEpisodes + 1},
	} {
		t.Run(test.name, func(t *testing.T) {
			if _, err := ListIgnoredFeedItems(context.Background(), cfg, test.sources, test.limit); err == nil {
				t.Fatal("ListIgnoredFeedItems() unexpectedly succeeded")
			}
		})
	}
	if _, err := ForgetIgnoredFeedItems(context.Background(), cfg, nil, false); err == nil {
		t.Fatal("ForgetIgnoredFeedItems() unexpectedly succeeded")
	}
}
