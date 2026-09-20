package app

import (
	"context"
	"testing"

	"github.com/synrise25/rss-pod/internal/config"
)

func TestParsePollSources(t *testing.T) {
	cfg := &config.Config{Sources: []config.SourceConfig{
		{ID: "alpha", Enabled: true},
		{ID: "beta", Enabled: true},
		{ID: "disabled", Enabled: false},
	}}

	sources, err := ParsePollSources(cfg, " beta, alpha, beta ")
	if err != nil {
		t.Fatal(err)
	}
	if len(sources) != 2 || sources[0].ID != "beta" || sources[1].ID != "alpha" {
		t.Fatalf("ParsePollSources() = %#v, want beta then alpha", sources)
	}

	sources, err = ParsePollSources(cfg, "all")
	if err != nil {
		t.Fatal(err)
	}
	if len(sources) != 2 || sources[0].ID != "alpha" || sources[1].ID != "beta" {
		t.Fatalf("ParsePollSources(all) = %#v, want all enabled sources", sources)
	}
}

func TestParsePollSourcesRejectsInvalidSelection(t *testing.T) {
	cfg := &config.Config{Sources: []config.SourceConfig{
		{ID: "alpha", Enabled: true},
		{ID: "disabled", Enabled: false},
	}}
	for _, value := range []string{"", "unknown", "disabled", "all,alpha"} {
		if _, err := ParsePollSources(cfg, value); err == nil {
			t.Errorf("ParsePollSources(%q) unexpectedly succeeded", value)
		}
	}
}

func TestEnqueuePollsValidatesBatchBeforeConnecting(t *testing.T) {
	cfg := &config.Config{
		Defaults: config.DefaultsConfig{Limits: config.LimitsConfig{MaxFeedItemsPerRun: 5}},
		Sources:  []config.SourceConfig{{ID: "alpha", Enabled: true}},
		Subscriptions: []config.SubscriptionConfig{
			{ID: "mirror", Enabled: true, Limit: 10},
		},
	}
	targets := []PollTarget{{ID: "alpha"}}
	tests := []struct {
		name   string
		target []PollTarget
		times  int
		limit  int
	}{
		{name: "no target"},
		{name: "zero times", target: targets, times: 0},
		{name: "too many times", target: targets, times: MaxManualPollTimes + 1},
		{name: "negative limit", target: targets, times: 1, limit: -1},
		{name: "limit above source maximum", target: targets, times: 1, limit: 6},
		{name: "limit above subscription maximum", target: []PollTarget{{ID: "mirror", Subscription: true}}, times: 1, limit: 11},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if _, err := EnqueuePolls(context.Background(), cfg, test.target, test.times, test.limit); err == nil {
				t.Fatal("EnqueuePolls() unexpectedly succeeded")
			}
		})
	}
}

func TestParsePollTargetsIncludesSubscriptions(t *testing.T) {
	cfg := &config.Config{
		Sources: []config.SourceConfig{
			{ID: "alpha", Enabled: true},
			{ID: "disabled", Enabled: false},
		},
		Subscriptions: []config.SubscriptionConfig{
			{ID: "mirror", Enabled: true},
			{ID: "paused", Enabled: false},
		},
	}

	targets, err := ParsePollTargets(cfg, "mirror,alpha")
	if err != nil {
		t.Fatal(err)
	}
	want := []PollTarget{{ID: "mirror", Subscription: true}, {ID: "alpha"}}
	if len(targets) != len(want) || targets[0] != want[0] || targets[1] != want[1] {
		t.Fatalf("ParsePollTargets() = %#v, want %#v", targets, want)
	}

	targets, err = ParsePollTargets(cfg, "all")
	if err != nil {
		t.Fatal(err)
	}
	if len(targets) != 2 || targets[0] != want[1] || targets[1] != want[0] {
		t.Fatalf("ParsePollTargets(all) = %#v, want enabled sources then subscriptions", targets)
	}

	for _, value := range []string{"", "unknown", "paused", "all,alpha"} {
		if _, err := ParsePollTargets(cfg, value); err == nil {
			t.Errorf("ParsePollTargets(%q) unexpectedly succeeded", value)
		}
	}
}
