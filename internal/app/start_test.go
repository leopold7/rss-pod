package app

import (
	"context"
	"strings"
	"testing"

	"github.com/google/uuid"

	"github.com/synrise25/rss-pod/internal/config"
)

func startTestConfig() *config.Config {
	return &config.Config{Sources: []config.SourceConfig{
		{ID: "manual", Name: "Manual", Enabled: true, PollOnly: true},
		{ID: "manual-paused", Name: "Paused", Enabled: false, PollOnly: true},
		{ID: "automatic", Name: "Automatic", Enabled: true},
	}}
}

func TestParsePollOnlySources(t *testing.T) {
	cfg := startTestConfig()

	t.Run("all selects enabled poll-only sources", func(t *testing.T) {
		sources, err := ParsePollOnlySources(cfg, " all ")
		if err != nil {
			t.Fatal(err)
		}
		if len(sources) != 1 || sources[0].ID != "manual" {
			t.Fatalf("sources = %#v, want only manual", sources)
		}
	})

	t.Run("explicit poll-only source", func(t *testing.T) {
		sources, err := ParsePollOnlySources(cfg, "manual")
		if err != nil {
			t.Fatal(err)
		}
		if len(sources) != 1 || sources[0].ID != "manual" {
			t.Fatalf("sources = %#v", sources)
		}
	})

	t.Run("explicit automatic source is rejected", func(t *testing.T) {
		_, err := ParsePollOnlySources(cfg, "automatic")
		if err == nil || !strings.Contains(err.Error(), "does not use poll_only") {
			t.Fatalf("error = %v, want poll_only requirement", err)
		}
	})

	t.Run("no poll-only sources at all", func(t *testing.T) {
		for _, candidate := range []struct {
			name string
			cfg  *config.Config
		}{
			{name: "empty", cfg: &config.Config{}},
			{name: "automatic only", cfg: &config.Config{Sources: []config.SourceConfig{
				{ID: "automatic", Name: "Automatic", Enabled: true},
			}}},
		} {
			t.Run(candidate.name, func(t *testing.T) {
				if _, err := ParsePollOnlySources(candidate.cfg, "all"); err == nil {
					t.Fatal("expected an error for a configuration without poll-only sources")
				}
			})
		}
	})

	t.Run("missing selection", func(t *testing.T) {
		if _, err := ParsePollOnlySources(cfg, "   "); err == nil {
			t.Fatal("expected --sources to be required")
		}
	})

	t.Run("unknown source", func(t *testing.T) {
		if _, err := ParsePollOnlySources(cfg, "missing"); err == nil {
			t.Fatal("expected an unknown source error")
		}
	})
}

func TestStartEpisodesValidatesTheBatchBeforeConnecting(t *testing.T) {
	cfg := startTestConfig()
	if _, err := StartEpisodes(context.Background(), cfg, nil); err == nil {
		t.Fatal("expected an empty batch to be rejected")
	}
	oversized := make([]uuid.UUID, MaxStartEpisodes+1)
	_, err := StartEpisodes(context.Background(), cfg, oversized)
	if err == nil || !strings.Contains(err.Error(), "at most") {
		t.Fatalf("error = %v, want the batch size limit", err)
	}
	if _, err := StartWaitingEpisodes(context.Background(), cfg, nil, 1); err == nil {
		t.Fatal("expected a missing source selection to be rejected")
	}
	if _, err := StartWaitingEpisodes(context.Background(), cfg, cfg.Sources[:1], 0); err == nil {
		t.Fatal("expected a zero limit to be rejected")
	}
}
