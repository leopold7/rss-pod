package app

import (
	"testing"
	"time"

	"github.com/synrise25/rss-pod/internal/config"
)

func TestRescueStuckAfterExtendsTheJobDeadline(t *testing.T) {
	testCases := []struct {
		name       string
		jobTimeout time.Duration
		want       time.Duration
	}{
		{
			name:       "default job timeout",
			jobTimeout: config.DefaultJobTimeout,
			want:       config.DefaultJobTimeout + jobRescueLeeway,
		},
		{
			name:       "long job timeout",
			jobTimeout: 3 * time.Hour,
			want:       3*time.Hour + jobRescueLeeway,
		},
		{
			name:       "missing job timeout keeps River's default",
			jobTimeout: 0,
			want:       time.Hour,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			got := rescueStuckAfter(testCase.jobTimeout)
			if got != testCase.want {
				t.Fatalf("rescueStuckAfter(%s) = %s, want %s", testCase.jobTimeout, got, testCase.want)
			}
			// River rejects a rescue horizon shorter than the job deadline.
			if got < testCase.jobTimeout {
				t.Fatalf("rescueStuckAfter(%s) = %s must not be shorter than the job deadline", testCase.jobTimeout, got)
			}
		})
	}
}

// A killed worker otherwise leaves its job running for River's one hour
// default, which is what made restarted poll-only episodes look stuck.
func TestRescueStuckAfterBeatsRiverDefault(t *testing.T) {
	if got := rescueStuckAfter(config.DefaultJobTimeout); got >= time.Hour {
		t.Fatalf("rescueStuckAfter(%s) = %s, want less than River's one hour default", config.DefaultJobTimeout, got)
	}
}

func TestSoftStopTimeoutLeavesRoomForStop(t *testing.T) {
	if softStopTimeout >= stopTimeout {
		t.Fatalf("softStopTimeout (%s) must stay below stopTimeout (%s), otherwise the process exits before cancelled jobs are requeued", softStopTimeout, stopTimeout)
	}
}
