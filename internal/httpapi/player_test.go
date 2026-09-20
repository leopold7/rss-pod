package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"

	"github.com/synrise25/rss-pod/internal/config"
)

func TestPlayerNoticeDisabled(t *testing.T) {
	t.Parallel()

	response := httptest.NewRecorder()
	(&playerServer{}).notice(response, httptest.NewRequest(http.MethodGet, "/api/v1/player/notice", nil))

	if response.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", response.Code)
	}
	if cacheControl := response.Header().Get("Cache-Control"); cacheControl != "no-store" {
		t.Fatalf("Cache-Control = %q, want no-store", cacheControl)
	}
}

func TestPlayerNoticeMissingFile(t *testing.T) {
	t.Parallel()

	response := httptest.NewRecorder()
	server := &playerServer{noticeFile: filepath.Join(t.TempDir(), "missing.md")}
	server.notice(response, httptest.NewRequest(http.MethodGet, "/api/v1/player/notice", nil))

	if response.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", response.Code)
	}
}

func TestPlayerNoticeRendersMarkdownAndReloadsFile(t *testing.T) {
	t.Parallel()

	path := filepath.Join(t.TempDir(), "notice.md")
	if err := os.WriteFile(path, []byte("**First**\n\n- one\n- two\n\n[bad](javascript:alert(1))\n\n<script>alert(1)</script>"), 0o600); err != nil {
		t.Fatal(err)
	}
	server := &playerServer{noticeFile: path}

	response := httptest.NewRecorder()
	server.notice(response, httptest.NewRequest(http.MethodGet, "/api/v1/player/notice", nil))
	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200: %s", response.Code, response.Body.String())
	}
	body := response.Body.String()
	if !strings.Contains(body, "<strong>First</strong>") || !strings.Contains(body, "<li>one</li>") {
		t.Fatalf("Markdown was not rendered: %s", body)
	}
	if strings.Contains(body, "<script>") || strings.Contains(body, "javascript:") {
		t.Fatalf("unsafe Markdown was rendered: %s", body)
	}
	if contentType := response.Header().Get("Content-Type"); contentType != "text/html; charset=utf-8" {
		t.Fatalf("Content-Type = %q", contentType)
	}
	firstETag := response.Header().Get("ETag")
	if firstETag == "" {
		t.Fatal("ETag is empty")
	}
	firstNoticeID := response.Header().Get("X-Notice-ID")
	if firstNoticeID == "" || firstETag != `"`+firstNoticeID+`"` {
		t.Fatalf("X-Notice-ID = %q, ETag = %q; want matching validators", firstNoticeID, firstETag)
	}

	for name, ifNoneMatch := range map[string]string{
		"exact":    firstETag,
		"weak":     "W/" + firstETag,
		"list":     `"unrelated", W/` + firstETag,
		"wildcard": "*",
	} {
		t.Run(name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, "/api/v1/player/notice", nil)
			request.Header.Set("If-None-Match", ifNoneMatch)
			response := httptest.NewRecorder()
			server.notice(response, request)
			if response.Code != http.StatusNotModified || response.Body.Len() != 0 {
				t.Fatalf("matching ETag response = %d, %q; want 304 with empty body", response.Code, response.Body.String())
			}
		})
	}

	if err := os.WriteFile(path, []byte("Updated"), 0o600); err != nil {
		t.Fatal(err)
	}
	response = httptest.NewRecorder()
	server.notice(response, httptest.NewRequest(http.MethodGet, "/api/v1/player/notice", nil))
	if !strings.Contains(response.Body.String(), "Updated") {
		t.Fatalf("updated file was not read: %s", response.Body.String())
	}
	if updatedETag := response.Header().Get("ETag"); updatedETag == "" || updatedETag == firstETag {
		t.Fatalf("updated ETag = %q, want a new non-empty value", updatedETag)
	}
	if updatedNoticeID := response.Header().Get("X-Notice-ID"); updatedNoticeID == "" || updatedNoticeID == firstNoticeID {
		t.Fatalf("updated X-Notice-ID = %q, want a new non-empty value", updatedNoticeID)
	}
}

func TestPlayerNoticeRejectsOversizedFile(t *testing.T) {
	t.Parallel()

	path := filepath.Join(t.TempDir(), "notice.md")
	if err := os.WriteFile(path, []byte(strings.Repeat("x", maxNoticeBytes+1)), 0o600); err != nil {
		t.Fatal(err)
	}
	response := httptest.NewRecorder()
	(&playerServer{noticeFile: path}).notice(response, httptest.NewRequest(http.MethodGet, "/api/v1/player/notice", nil))

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", response.Code)
	}
}

func TestListPlayerSourcesReturnsOnlyPublicFields(t *testing.T) {
	t.Parallel()

	server := newPlayerServer(&config.Config{Sources: []config.SourceConfig{
		{ID: "enabled", Name: "Enabled source", Enabled: true, Feed: config.FeedConfig{URL: "https://private.example/feed"}},
		{ID: "disabled", Name: "Disabled source", Enabled: false},
	}}, nil, nil)
	response := httptest.NewRecorder()
	server.listSources(response, httptest.NewRequest("GET", "/api/v1/player/sources", nil))

	body := response.Body.String()
	if !strings.Contains(body, `"id":"enabled"`) || !strings.Contains(body, `"name":"Enabled source"`) {
		t.Fatalf("response does not contain enabled source: %s", body)
	}
	if strings.Contains(body, "disabled") || strings.Contains(body, "private.example") || strings.Contains(body, "feed") {
		t.Fatalf("response exposes non-public source configuration: %s", body)
	}
}

// The filter renders the list in the order the endpoint returns, so the
// optional order of a source and of a subscription has to survive the handler.
func TestListPlayerSourcesFollowsConfiguredOrder(t *testing.T) {
	t.Parallel()

	second := 2
	server := newPlayerServer(&config.Config{
		Sources: []config.SourceConfig{
			{ID: "first", Name: "First", Enabled: true},
			{ID: "third", Name: "Third", Enabled: true},
		},
		Subscriptions: []config.SubscriptionConfig{
			{ID: "second", Name: "Second", Enabled: true, Order: &second},
		},
	}, nil, nil)
	response := httptest.NewRecorder()
	server.listSources(response, httptest.NewRequest("GET", "/api/v1/player/sources", nil))

	var payload struct {
		Sources []config.SourceRef `json:"sources"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode sources: %v", err)
	}
	got := make([]string, 0, len(payload.Sources))
	for _, source := range payload.Sources {
		got = append(got, source.ID)
	}
	if want := "first,second,third"; strings.Join(got, ",") != want {
		t.Fatalf("sources = %v, want %s", got, want)
	}
}

func TestPlayerConfigReportsThemeToggle(t *testing.T) {
	t.Parallel()

	for _, want := range []bool{true, false} {
		server := &playerServer{themeToggle: want}
		response := httptest.NewRecorder()
		server.config(response, httptest.NewRequest(http.MethodGet, "/api/v1/player/config", nil))

		if response.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", response.Code)
		}
		if cacheControl := response.Header().Get("Cache-Control"); cacheControl != "no-store" {
			t.Fatalf("Cache-Control = %q, want no-store", cacheControl)
		}
		var payload struct {
			ThemeToggle bool `json:"theme_toggle"`
		}
		if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
			t.Fatalf("decode player config: %v", err)
		}
		if payload.ThemeToggle != want {
			t.Fatalf("theme_toggle = %v, want %v", payload.ThemeToggle, want)
		}
	}
}

func TestNewPlayerServerHonoursThemeToggleConfig(t *testing.T) {
	t.Parallel()

	disabled := false
	if server := newPlayerServer(&config.Config{Runtime: config.RuntimeConfig{
		HTTP: config.HTTPConfig{ThemeToggle: &disabled},
	}}, nil, nil); server.themeToggle {
		t.Fatal("explicit runtime.http.theme_toggle=false should hide the switch")
	}
	if server := newPlayerServer(&config.Config{}, nil, nil); !server.themeToggle {
		t.Fatal("the theme switch should be visible when runtime.http.theme_toggle is unset")
	}
}

func TestPlayerMuxDoesNotExposeManagementRoutes(t *testing.T) {
	t.Parallel()

	mux := newPlayerMux(&playerServer{})
	tests := []struct {
		method string
		path   string
	}{
		{method: http.MethodGet, path: "/healthz"},
		{method: http.MethodGet, path: "/readyz"},
		{method: http.MethodGet, path: "/api/v1/sources"},
		{method: http.MethodPost, path: "/api/v1/sources/example/poll"},
		{method: http.MethodGet, path: "/api/v1/sources/example/podcast.xml"},
		{method: http.MethodPost, path: "/api/v1/episodes/example/retry"},
	}
	for _, test := range tests {
		t.Run(test.method+" "+test.path, func(t *testing.T) {
			response := httptest.NewRecorder()
			mux.ServeHTTP(response, httptest.NewRequest(test.method, test.path, nil))
			if response.Code != http.StatusNotFound {
				t.Fatalf("status = %d, want 404", response.Code)
			}
		})
	}
}

func TestManagementMuxDoesNotExposePlayerRoutes(t *testing.T) {
	t.Parallel()

	response := httptest.NewRecorder()
	newManagementMux(&Server{}).ServeHTTP(
		response,
		httptest.NewRequest(http.MethodGet, "/api/v1/player/sources", nil),
	)
	if response.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", response.Code)
	}
}

func TestParseOptionalRFC3339(t *testing.T) {
	t.Parallel()

	w := httptest.NewRecorder()
	parsed, ok := parseOptionalRFC3339(w, "2026-08-23T00:00:00+08:00", "since")
	if !ok {
		t.Fatalf("expected valid timestamp, response body: %s", w.Body.String())
	}
	want := time.Date(2026, time.August, 23, 0, 0, 0, 0, time.FixedZone("CST", 8*60*60))
	if !parsed.Equal(want) {
		t.Fatalf("parsed time = %s, want %s", parsed, want)
	}
}

func TestParseOptionalRFC3339RejectsInvalidValue(t *testing.T) {
	t.Parallel()

	w := httptest.NewRecorder()
	parsed, ok := parseOptionalRFC3339(w, "today", "since")
	if ok || parsed != nil {
		t.Fatal("expected invalid timestamp to be rejected")
	}
	if w.Code != 400 {
		t.Fatalf("status = %d, want 400", w.Code)
	}
}

func TestPlayerEpisodeState(t *testing.T) {
	t.Parallel()

	tests := []struct {
		status   string
		hasAudio bool
		state    string
		stage    string
	}{
		{status: "published", hasAudio: true, state: "ready"},
		{status: "published", hasAudio: false, state: "failed"},
		{status: "queued", state: "pending"},
		{status: "resolving_content", state: "processing", stage: "content"},
		{status: "content_ready", state: "processing", stage: "script"},
		{status: "generating_script", state: "processing", stage: "script"},
		{status: "script_ready", state: "processing", stage: "tts"},
		{status: "generating_tts", state: "processing", stage: "tts"},
		{status: "composing", state: "processing", stage: "compose"},
		{status: "retrying", state: "processing"},
		{status: "failed", state: "failed"},
	}
	for _, test := range tests {
		t.Run(test.status, func(t *testing.T) {
			state, stage := playerEpisodeState(test.status, test.hasAudio)
			if state != test.state || stage != test.stage {
				t.Fatalf("playerEpisodeState(%q, %t) = %q/%q, want %q/%q",
					test.status, test.hasAudio, state, stage, test.state, test.stage)
			}
		})
	}
}

func TestStartEpisodeRejectsInvalidID(t *testing.T) {
	t.Parallel()

	response := httptest.NewRecorder()
	newPlayerMux(&playerServer{}).ServeHTTP(
		response,
		httptest.NewRequest(http.MethodPost, "/api/v1/player/episodes/not-an-id/start", nil),
	)
	if response.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", response.Code)
	}
}

func TestStartEpisodeIntegration(t *testing.T) {
	pool := adminTestPool(t)
	cfg := &config.Config{Sources: []config.SourceConfig{
		{ID: "manual", Name: "Manual", Enabled: true, PollOnly: true},
		{ID: "automatic", Name: "Automatic", Enabled: true},
	}}
	client, err := river.NewClient(riverpgxv5.New(pool), &river.Config{})
	if err != nil {
		t.Fatal(err)
	}
	player := newPlayerServer(cfg, pool, client)
	mux := newPlayerMux(player)
	ctx := context.Background()

	insertEpisode := func(sourceID, status, audioURL string, publishedAt *time.Time) uuid.UUID {
		t.Helper()
		id := uuid.New()
		if _, err := pool.Exec(ctx, `
			WITH f AS (
			    INSERT INTO feed_items (source_id, external_id, title, content, published_at)
			    VALUES ($2, $3, 'Episode', 'content', now())
			    RETURNING id
			)
			INSERT INTO episodes (id, source_id, feed_item_id, title, status, audio_url, published_at)
			SELECT $1, $2, id, 'Episode', $4, $5, $6 FROM f
		`, id, sourceID, uuid.NewString(), status, audioURL, publishedAt); err != nil {
			t.Fatal(err)
		}
		return id
	}
	start := func(id uuid.UUID) *httptest.ResponseRecorder {
		t.Helper()
		response := httptest.NewRecorder()
		mux.ServeHTTP(response, httptest.NewRequest(
			http.MethodPost, "/api/v1/player/episodes/"+id.String()+"/start", nil))
		return response
	}
	listEpisodes := func() string {
		t.Helper()
		response := httptest.NewRecorder()
		mux.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/v1/player/episodes", nil))
		if response.Code != http.StatusOK {
			t.Fatalf("player episodes status = %d: %s", response.Code, response.Body.String())
		}
		return response.Body.String()
	}
	countJobs := func(kind string, episodeID uuid.UUID) int {
		t.Helper()
		var count int
		if err := pool.QueryRow(ctx, `
			SELECT count(*) FROM river_job WHERE kind = $1 AND args->>'episode_id' = $2
		`, kind, episodeID.String()).Scan(&count); err != nil {
			t.Fatal(err)
		}
		return count
	}
	episodeStatus := func(id uuid.UUID) string {
		t.Helper()
		var status string
		if err := pool.QueryRow(ctx, `SELECT status FROM episodes WHERE id = $1`, id).Scan(&status); err != nil {
			t.Fatal(err)
		}
		return status
	}

	// A listener starts an episode a poll-only source left waiting.
	pending := insertEpisode("manual", "queued", "", nil)
	response := start(pending)
	if response.Code != http.StatusAccepted {
		t.Fatalf("start status = %d, want 202: %s", response.Code, response.Body.String())
	}
	var payload struct {
		EpisodeID uuid.UUID `json:"episode_id"`
		JobKind   string    `json:"job_kind"`
		State     string    `json:"state"`
		Stage     string    `json:"stage"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatal(err)
	}
	if payload.EpisodeID != pending || payload.JobKind != "resolve_content" || payload.State != "processing" || payload.Stage != "content" {
		t.Fatalf("start payload = %#v", payload)
	}
	if got := episodeStatus(pending); got != "resolving_content" {
		t.Fatalf("episode status = %q, want resolving_content", got)
	}
	if got := countJobs("resolve_content", pending); got != 1 {
		t.Fatalf("resolve_content jobs = %d, want 1", got)
	}

	// A second tap must report the running generation instead of queueing it twice.
	if code := start(pending).Code; code != http.StatusConflict {
		t.Fatalf("second start status = %d, want 409", code)
	}
	if got := countJobs("resolve_content", pending); got != 1 {
		t.Fatalf("resolve_content jobs after a second tap = %d, want 1", got)
	}

	body := listEpisodes()
	if !strings.Contains(body, pending.String()) || !strings.Contains(body, `"state":"processing"`) {
		t.Fatalf("player does not show the running episode: %s", body)
	}

	// Automatic sources keep their automatic behaviour on both sides.
	automatic := insertEpisode("automatic", "queued", "", nil)
	if code := start(automatic).Code; code != http.StatusConflict {
		t.Fatalf("start of an automatic episode status = %d, want 409", code)
	}
	if body := listEpisodes(); strings.Contains(body, automatic.String()) {
		t.Fatalf("player listed an automatic episode before it was generated: %s", body)
	}

	// Published episodes still play through the unchanged path.
	publishedAt := time.Now()
	published := insertEpisode("automatic", "published", "https://media.example.com/episode.mp3", &publishedAt)
	body = listEpisodes()
	if !strings.Contains(body, published.String()) || !strings.Contains(body, `"state":"ready"`) {
		t.Fatalf("player does not show a published episode: %s", body)
	}

	// A failed episode resumes where it stopped.
	failed := insertEpisode("manual", "failed", "", nil)
	if code := start(failed).Code; code != http.StatusAccepted {
		t.Fatalf("restart status = %d, want 202", code)
	}
	if got := episodeStatus(failed); got != "resolving_content" {
		t.Fatalf("restarted episode status = %q, want resolving_content", got)
	}

	if code := start(uuid.New()).Code; code != http.StatusNotFound {
		t.Fatalf("unknown episode status = %d, want 404", code)
	}
}
