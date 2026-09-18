package main

import (
	"strings"
	"testing"

	"github.com/google/uuid"
)

func TestParseEpisodeIDs(t *testing.T) {
	first := uuid.New()
	second := uuid.New()

	parsed, err := parseEpisodeIDs(" " + first.String() + " ," + second.String() + "," + first.String() + " ")
	if err != nil {
		t.Fatal(err)
	}
	if len(parsed) != 2 || parsed[0] != first || parsed[1] != second {
		t.Fatalf("parseEpisodeIDs() = %#v, want both unique IDs", parsed)
	}

	for _, value := range []string{"", " , ", "not-a-uuid", first.String() + ",bad"} {
		if _, err := parseEpisodeIDs(value); err == nil {
			t.Errorf("parseEpisodeIDs(%q) unexpectedly succeeded", value)
		}
	}
}

func TestStartCommandRequiresExactlyOneSelection(t *testing.T) {
	for _, test := range []struct {
		name string
		args []string
		want string
	}{
		{name: "no selection", args: nil, want: "--episode or --sources is required"},
		{name: "both selections", args: []string{"--episode", uuid.NewString(), "--sources", "all"}, want: "exactly one"},
	} {
		t.Run(test.name, func(t *testing.T) {
			err := runStart(t.Context(), test.args)
			if err == nil || !strings.Contains(err.Error(), test.want) {
				t.Fatalf("runStart() error = %v, want containing %q", err, test.want)
			}
		})
	}
}
