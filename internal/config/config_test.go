package config

import (
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"
)

func TestLoadCurrentConfig(t *testing.T) {
	t.Setenv("DATABASE_HOST", "127.0.0.1")
	t.Setenv("DATABASE_USER", "rsspod")
	t.Setenv("DATABASE_PASSWORD", "secret")
	t.Setenv("S3_ENDPOINT", "http://127.0.0.1:9000")
	t.Setenv("S3_ACCESS_KEY_ID", "access")
	t.Setenv("S3_SECRET_ACCESS_KEY", "secret")
	t.Setenv("PUBLIC_MEDIA_BASE_URL", "http://127.0.0.1:9000/rsspod-media")
	t.Setenv("JINA_API_KEY", "")
	t.Setenv("JINA_PROXY", "")
	t.Setenv("CRAWL4AI_BASE_URL", "http://127.0.0.1:11235")
	t.Setenv("CRAWL4AI_API_TOKEN", "")
	t.Setenv("CRAWL4AI_PROXY", "")
	t.Setenv("LLM_DEEPSEEK_BASE_URL", "http://127.0.0.1:8080/v1")
	t.Setenv("LLM_DEEPSEEK_API_KEY", "secret")
	t.Setenv("LLM_DEEPSEEK_MODEL", "model-a")
	t.Setenv("LLM_DEEPSEEK_PROXY", "")
	t.Setenv("LLM_GEMINI_BASE_URL", "http://127.0.0.1:8081/v1")
	t.Setenv("LLM_GEMINI_API_KEY", "secret")
	t.Setenv("LLM_GEMINI_MODEL", "model-b")
	t.Setenv("LLM_GEMINI_PROXY", "")
	t.Setenv("EDGE_TTS_PROXY", "")
	t.Setenv("AZURE_SPEECH_REGION", "southeastasia")
	t.Setenv("AZURE_SPEECH_KEY", "speech-key")
	t.Setenv("AZURE_SPEECH_PROXY", "")

	path := filepath.Join("..", "..", "config.example.yaml")
	cfg, err := Load(path)
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.Defaults.Content.Type != "rss-item" {
		t.Fatalf("default content type = %q", cfg.Defaults.Content.Type)
	}
	if got := cfg.Services.Content.Crawl4AI; got.EffectiveMode() != "md" || got.EffectiveFilter() != "fit" {
		t.Fatalf("Crawl4AI service = %#v", got)
	}
	zhihu, ok := cfg.Source("zhihu-topic")
	if !ok || zhihu.Content == nil || zhihu.Content.Type != "derived-rss" {
		t.Fatalf("zhihu content was not decoded: %#v", zhihu.Content)
	}
	v2ex, ok := cfg.Source("v2ex-hot")
	if !ok {
		t.Fatal("v2ex source not found")
	}
	if got := cfg.EffectiveGeneration(v2ex); got.TargetDuration != "3m" || got.PromptTemplate == "" || got.DialogueProfile != "v2ex-commentary" {
		t.Fatalf("effective generation = %#v", got)
	}
	if got := cfg.DialogueProfiles[cfg.EffectiveGeneration(v2ex).DialogueProfile].Speakers[0]; got.Name != "小雅" || !strings.Contains(got.Role, "科技播客主持人") || got.Voice != "azure:zh-CN-Multitalker-Xiaochen-Yunhan:DragonHDLatestNeural:xiaochen" {
		t.Fatalf("v2ex speaker = %#v", got)
	}
	if got := cfg.DialogueProfiles[cfg.EffectiveGeneration(zhihu).DialogueProfile].Speakers[0]; got.Name != "小雅" || !strings.Contains(got.Role, "中文互联网观察") {
		t.Fatalf("zhihu speaker = %#v", got)
	}
	if got := cfg.DialogueProfiles[cfg.Defaults.Generation.DialogueProfile]; cfg.Defaults.Generation.DialogueProfile != "general-dialogue" || !strings.HasPrefix(got.Speakers[0].Voice, "edge:") || !strings.Contains(got.Speakers[0].Role, "普通听众") {
		t.Fatalf("default dialogue profile = %#v", got)
	}
	if got := cfg.Services.TTS[EdgeTTSServiceName]; got.ConnectTimeout != "20s" || got.ReceiveTimeout != "120s" {
		t.Fatalf("edge TTS timeouts = %#v", got)
	}
	if got := cfg.Services.TTS[AzureTTSServiceName]; got.AzureEndpoint() != "https://southeastasia.tts.speech.microsoft.com/cognitiveservices/v1" || got.OutputFormat != "audio-24khz-48kbitrate-mono-mp3" {
		t.Fatalf("azure TTS service = %#v", got)
	}
	if v2ex.Content == nil || v2ex.Content.Crawl4AI.EffectiveService(cfg.Services.Content.Crawl4AI).EffectiveMode() != "crawl" || v2ex.Content.Transform.Type != "v2ex-topic" {
		t.Fatalf("v2ex content = %#v", v2ex.Content)
	}
	if got := cfg.EffectiveLimits(v2ex).MaxDocumentsPerItem; got != 20 {
		t.Fatalf("effective max documents = %d", got)
	}
	if got := cfg.EffectivePodcast(v2ex).MaxAge; got != "72h" {
		t.Fatalf("effective podcast max age = %q", got)
	}
	// The publishable example must keep the automatic pipeline by default.
	if ids := cfg.PollOnlySourceIDs(); len(ids) != 0 {
		t.Fatalf("poll-only sources = %v, want none", ids)
	}
	// Mirroring calls another deployment, so the example keeps it disabled and
	// must not add it to the player's source filter.
	peer, ok := cfg.Subscription("peer-podcast")
	if !ok || peer.Enabled || peer.BaseURL == "" || peer.Schedule.Cron != "0 8 * * *" {
		t.Fatalf("example subscription = %#v", peer)
	}
	if got := cfg.EnabledSubscriptions(); len(got) != 0 {
		t.Fatalf("enabled subscriptions = %#v, want none", got)
	}
	if got := cfg.EpisodeSources(); len(got) != 0 {
		t.Fatalf("episode sources = %#v, want none", got)
	}
}

func TestLoadSourcePollOnly(t *testing.T) {
	tests := []struct {
		name    string
		new     string
		want    bool
		wantIDs []string
	}{
		{name: "defaults to disabled", new: "enabled: true", want: false},
		{name: "reads explicit true", new: "enabled: true\n    poll_only: true", want: true, wantIDs: []string{"test"}},
		{name: "reads explicit false", new: "enabled: true\n    poll_only: false", want: false},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			data := strings.Replace(minimalConfig, "enabled: true", test.new, 1)
			path := filepath.Join(t.TempDir(), "config.yaml")
			if err := os.WriteFile(path, []byte(data), 0o600); err != nil {
				t.Fatal(err)
			}
			cfg, err := Load(path)
			if err != nil {
				t.Fatalf("Load() error = %v", err)
			}
			source, ok := cfg.Source("test")
			if !ok {
				t.Fatal("source test not found")
			}
			if source.PollOnly != test.want {
				t.Fatalf("source.PollOnly = %v, want %v", source.PollOnly, test.want)
			}
			ids := cfg.PollOnlySourceIDs()
			if len(ids) != len(test.wantIDs) {
				t.Fatalf("PollOnlySourceIDs() = %v, want %v", ids, test.wantIDs)
			}
			for index, want := range test.wantIDs {
				if ids[index] != want {
					t.Fatalf("PollOnlySourceIDs() = %v, want %v", ids, test.wantIDs)
				}
			}
		})
	}
}

func TestPollOnlySourceIDsSkipsDisabledSources(t *testing.T) {
	cfg := &Config{Sources: []SourceConfig{
		{ID: "discover-only", Enabled: true, PollOnly: true},
		{ID: "paused", Enabled: false, PollOnly: true},
		{ID: "automatic", Enabled: true},
	}}
	ids := cfg.PollOnlySourceIDs()
	if len(ids) != 1 || ids[0] != "discover-only" {
		t.Fatalf("PollOnlySourceIDs() = %v, want [discover-only]", ids)
	}
}

func TestLoadSourceFilter(t *testing.T) {
	tests := []struct {
		name   string
		filter string
		titles map[string]bool
	}{
		{
			name: "whitelist keeps the matches",
			filter: "    filter:\n      whitelist:\n        - {type: title, regex: \"财新|独家\"}\n" +
				"        - {type: Title, regex: \"深度\"}",
			titles: map[string]bool{
				"财新周刊封面":   true,
				"某公司的独家消息": true,
				"深度报道":     true,
				"今日要闻":     false,
				"":         false,
			},
		},
		{
			name:   "blacklist drops the matches",
			filter: "    filter:\n      blacklist:\n        - {type: title, regex: \"人事观察\"}",
			titles: map[string]bool{
				// The pattern only has to appear somewhere in the title.
				"本周人事观察汇总": false,
				"财新周刊封面":   true,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			data := strings.Replace(minimalConfig, "    feed: {url: http://localhost/feed.xml}",
				"    feed: {url: http://localhost/feed.xml}\n"+test.filter, 1)
			if data == minimalConfig {
				t.Fatal("test fixture does not contain the source feed")
			}
			cfg, err := Load(writeConfig(t, data))
			if err != nil {
				t.Fatalf("Load() error = %v", err)
			}
			source, ok := cfg.Source("test")
			if !ok || source.Filter == nil {
				t.Fatalf("source filter was not decoded: %#v", source.Filter)
			}
			filter, err := source.Filter.Compile()
			if err != nil {
				t.Fatalf("Compile() error = %v", err)
			}
			for title, want := range test.titles {
				if got := filter.Accept(FilterItem{Title: title}); got != want {
					t.Errorf("Accept(%q) = %v, want %v", title, got, want)
				}
			}
		})
	}
}

// A source without a filter, and a filter whose declared list carries no rules,
// must keep the pipeline unchanged instead of dropping every item.
func TestSourceFilterAcceptsEverythingWhenUnconfigured(t *testing.T) {
	for _, test := range []struct {
		name   string
		filter *SourceFilterConfig
	}{
		{name: "absent filter", filter: nil},
		{name: "empty filter", filter: &SourceFilterConfig{}},
		{name: "empty whitelist", filter: &SourceFilterConfig{Whitelist: []FilterRuleConfig{}}},
		{name: "empty blacklist", filter: &SourceFilterConfig{Blacklist: []FilterRuleConfig{}}},
		{name: "both lists declared empty", filter: &SourceFilterConfig{
			Whitelist: []FilterRuleConfig{},
			Blacklist: []FilterRuleConfig{},
		}},
	} {
		t.Run(test.name, func(t *testing.T) {
			filter, err := test.filter.Compile()
			if err != nil {
				t.Fatalf("Compile() error = %v", err)
			}
			if !filter.Accept(FilterItem{Title: "任意标题"}) {
				t.Fatal("an unconfigured filter dropped an item")
			}
		})
	}
}

func TestValidateSourceFilter(t *testing.T) {
	tests := []struct {
		name    string
		filter  string
		wantErr string
	}{
		{
			name:   "valid whitelist",
			filter: "    filter:\n      whitelist:\n        - {type: title, regex: \"财新\"}\n        - {type: TITLE, regex: \"独家\"}",
		},
		{
			name:   "valid blacklist",
			filter: "    filter:\n      blacklist:\n        - {type: title, regex: \"人事观察\"}",
		},
		{
			// An empty list holds no rules, so it filters nothing and does not
			// count as using both lists at once.
			name:   "an empty list next to the other one",
			filter: "    filter:\n      whitelist: []\n      blacklist:\n        - {type: title, regex: \"人事观察\"}",
		},
		{
			name: "whitelist and blacklist together",
			filter: "    filter:\n      whitelist:\n        - {type: title, regex: \"财新\"}\n" +
				"      blacklist:\n        - {type: title, regex: \"人事观察\"}",
			wantErr: "source test filter: whitelist and blacklist cannot be used together",
		},
		{
			name:    "unknown rule type",
			filter:  "    filter:\n      blacklist:\n        - {type: link, regex: \"caixin\"}",
			wantErr: `source test filter: blacklist[0].type must be "title", got "link"`,
		},
		{
			name:    "missing rule type",
			filter:  "    filter:\n      whitelist:\n        - {regex: \"caixin\"}",
			wantErr: "whitelist[0].type must be",
		},
		{
			name:    "empty regex",
			filter:  "    filter:\n      blacklist:\n        - {type: title, regex: \"   \"}",
			wantErr: "blacklist[0].regex must not be empty",
		},
		{
			name:    "missing regex",
			filter:  "    filter:\n      whitelist:\n        - {type: title}",
			wantErr: "whitelist[0].regex must not be empty",
		},
		{
			name:    "invalid regex reports its rule",
			filter:  "    filter:\n      whitelist:\n        - {type: title, regex: \"ok\"}\n        - {type: title, regex: \"[unclosed\"}",
			wantErr: "whitelist[1].regex",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			data := strings.Replace(minimalConfig, "    feed: {url: http://localhost/feed.xml}",
				"    feed: {url: http://localhost/feed.xml}\n"+test.filter, 1)
			if data == minimalConfig {
				t.Fatal("test fixture does not contain the source feed")
			}
			_, err := Load(writeConfig(t, data))
			if test.wantErr == "" {
				if err != nil {
					t.Fatalf("Load() error = %v", err)
				}
				return
			}
			if err == nil || !strings.Contains(err.Error(), test.wantErr) {
				t.Fatalf("Load() error = %v, want containing %q", err, test.wantErr)
			}
		})
	}
}

func TestEpisodeSourcesOrder(t *testing.T) {
	order := func(value int) *int { return &value }
	tests := []struct {
		name          string
		sources       []SourceConfig
		subscriptions []SubscriptionConfig
		want          []string
	}{
		{
			name:    "keeps the configuration sequence by default",
			sources: []SourceConfig{{ID: "a", Enabled: true}, {ID: "b", Enabled: true}},
			want:    []string{"a", "b"},
		},
		{
			name:    "skips disabled entries",
			sources: []SourceConfig{{ID: "a", Enabled: true}, {ID: "paused"}, {ID: "b", Enabled: true, Order: order(1)}},
			want:    []string{"b", "a"},
		},
		{
			name:    "unset entries fill the free positions",
			sources: []SourceConfig{{ID: "a", Enabled: true}, {ID: "b", Enabled: true}, {ID: "c", Enabled: true, Order: order(1)}},
			want:    []string{"c", "a", "b"},
		},
		{
			name:    "an order keeps the position it asks for",
			sources: []SourceConfig{{ID: "a", Enabled: true, Order: order(3)}, {ID: "b", Enabled: true}, {ID: "c", Enabled: true}},
			want:    []string{"b", "c", "a"},
		},
		{
			name:          "sources and subscriptions share one sequence",
			sources:       []SourceConfig{{ID: "a", Enabled: true}, {ID: "b", Enabled: true}},
			subscriptions: []SubscriptionConfig{{ID: "peer", Enabled: true, Order: order(2)}},
			want:          []string{"a", "peer", "b"},
		},
		{
			name:    "an order beyond the list moves towards the end",
			sources: []SourceConfig{{ID: "a", Enabled: true, Order: order(9)}, {ID: "b", Enabled: true}},
			want:    []string{"b", "a"},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			cfg := &Config{Sources: test.sources, Subscriptions: test.subscriptions}
			got := make([]string, 0, len(test.want))
			for _, ref := range cfg.EpisodeSources() {
				got = append(got, ref.ID)
			}
			if strings.Join(got, ",") != strings.Join(test.want, ",") {
				t.Fatalf("EpisodeSources() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestLoadSubscriptions(t *testing.T) {
	cfg, err := Load(writeConfig(t, minimalConfig+subscriptionFixture))
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if len(cfg.Subscriptions) != 1 {
		t.Fatalf("subscriptions = %#v", cfg.Subscriptions)
	}
	subscription := cfg.Subscriptions[0]
	if subscription.ID != "peer" || subscription.Name != "朋友的播客" || !subscription.Enabled ||
		subscription.BaseURL != "https://pod.example.com/" || subscription.SourceID != "zhihu-daily" {
		t.Fatalf("subscription = %#v", subscription)
	}
	if got := subscription.EffectiveLimit(); got != 500 {
		t.Fatalf("EffectiveLimit() = %d, want 500", got)
	}
	if subscription.Order == nil || *subscription.Order != 2 {
		t.Fatalf("subscription.Order = %v, want 2", subscription.Order)
	}
	if got, err := subscription.LookbackDuration(); err != nil || got != 48*time.Hour {
		t.Fatalf("LookbackDuration() = %s, %v", got, err)
	}

	loaded, ok := cfg.Subscription("peer")
	if !ok || loaded.ID != subscription.ID {
		t.Fatalf("Subscription(peer) = %#v, %v", loaded, ok)
	}
	if _, ok := cfg.Subscription("missing"); ok {
		t.Fatal("Subscription(missing) unexpectedly succeeded")
	}
	if got := cfg.EnabledSubscriptions(); len(got) != 1 || got[0].ID != "peer" {
		t.Fatalf("EnabledSubscriptions() = %#v", got)
	}
	if got := cfg.EpisodeSources(); len(got) != 2 || got[0].ID != "test" || got[1].ID != "peer" || got[1].Name != "朋友的播客" {
		t.Fatalf("EpisodeSources() = %#v", got)
	}
	if name, ok := cfg.EpisodeSourceName("peer"); !ok || name != "朋友的播客" {
		t.Fatalf("EpisodeSourceName(peer) = %q, %v", name, ok)
	}
	if name, ok := cfg.EpisodeSourceName("test"); !ok || name != "Test" {
		t.Fatalf("EpisodeSourceName(test) = %q, %v", name, ok)
	}
	if _, ok := cfg.EpisodeSourceName("missing"); ok {
		t.Fatal("EpisodeSourceName(missing) unexpectedly succeeded")
	}
}

func TestSubscriptionEpisodesURL(t *testing.T) {
	subscription := SubscriptionConfig{
		BaseURL:  " https://pod.example.com/ ",
		SourceID: " zhihu-daily ",
		Limit:    500,
	}
	if got := subscription.EpisodesEndpoint(); got != "https://pod.example.com/api/v1/player/episodes" {
		t.Fatalf("EpisodesEndpoint() = %q", got)
	}
	since := time.Date(2026, time.September, 17, 16, 0, 0, 0, time.UTC)
	before := time.Date(2026, time.September, 20, 16, 0, 0, 0, time.UTC)
	want := "https://pod.example.com/api/v1/player/episodes" +
		"?before=2026-09-20T16%3A00%3A00.000Z&limit=500&since=2026-09-17T16%3A00%3A00.000Z&source_id=zhihu-daily"
	if got := subscription.EpisodesURL(since, before, subscription.EffectiveLimit()); got != want {
		t.Fatalf("EpisodesURL() = %q, want %q", got, want)
	}

	// Without a remote source the pull covers every source of that deployment.
	subscription.SourceID = ""
	subscription.Limit = 0
	got := subscription.EpisodesURL(since, before, subscription.EffectiveLimit())
	if strings.Contains(got, "source_id") || !strings.Contains(got, "limit="+strconv.Itoa(DefaultSubscriptionLimit)) {
		t.Fatalf("EpisodesURL() = %q", got)
	}
}

func TestValidateSubscriptions(t *testing.T) {
	valid, err := Load(writeConfig(t, minimalConfig+subscriptionFixture))
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if err := valid.Validate(); err != nil {
		t.Fatalf("valid subscriptions rejected: %v", err)
	}

	tests := []struct {
		name    string
		mutate  func(*Config)
		wantErr string
	}{
		{
			name:    "collides with a source ID",
			mutate:  func(c *Config) { c.Subscriptions[0].ID = "test" },
			wantErr: "already used by a source",
		},
		{
			name: "duplicate subscription ID",
			mutate: func(c *Config) {
				c.Subscriptions = append(c.Subscriptions, c.Subscriptions[0])
			},
			wantErr: "duplicate subscription id",
		},
		{
			name:    "missing name",
			mutate:  func(c *Config) { c.Subscriptions[0].Name = "" },
			wantErr: "id and name must not be empty",
		},
		{
			name:    "relative base URL",
			mutate:  func(c *Config) { c.Subscriptions[0].BaseURL = "pod.example.com" },
			wantErr: "absolute URL",
		},
		{
			name:    "invalid cron",
			mutate:  func(c *Config) { c.Subscriptions[0].Schedule.Cron = "every morning" },
			wantErr: "schedule.cron",
		},
		{
			name:    "invalid lookback",
			mutate:  func(c *Config) { c.Subscriptions[0].Lookback = "0s" },
			wantErr: "positive duration",
		},
		{
			name:    "limit above the remote maximum",
			mutate:  func(c *Config) { c.Subscriptions[0].Limit = MaxSubscriptionLimit + 1 },
			wantErr: "limit must be between",
		},
		{
			name:    "negative limit",
			mutate:  func(c *Config) { c.Subscriptions[0].Limit = -1 },
			wantErr: "limit must be between",
		},
		{
			name:    "order below one",
			mutate:  func(c *Config) { c.Subscriptions[0].Order = intPtr(0) },
			wantErr: "subscription peer order must be at least 1",
		},
		{
			name: "order colliding with a source",
			mutate: func(c *Config) {
				c.Subscriptions[0].Order = intPtr(1)
				c.Sources = append([]SourceConfig(nil), c.Sources...)
				c.Sources[0].Order = intPtr(1)
			},
			wantErr: "subscription peer order 1 is already used by source test",
		},
		{
			name: "order below one on a source",
			mutate: func(c *Config) {
				c.Sources = append([]SourceConfig(nil), c.Sources...)
				c.Sources[0].Order = intPtr(-2)
			},
			wantErr: "source test order must be at least 1",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			invalid := *valid
			invalid.Subscriptions = append([]SubscriptionConfig(nil), valid.Subscriptions...)
			test.mutate(&invalid)
			err := invalid.Validate()
			if err == nil || !strings.Contains(err.Error(), test.wantErr) {
				t.Fatalf("Validate() error = %v, want containing %q", err, test.wantErr)
			}
		})
	}
}

// A disabled entry never reaches the player filter, so its order may repeat a
// position that an enabled entry already holds.
func TestValidateFilterOrderIgnoresDisabledEntries(t *testing.T) {
	cfg, err := Load(writeConfig(t, minimalConfig+subscriptionFixture))
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	cfg.Sources[0].Order = intPtr(1)
	cfg.Subscriptions[0].Order = intPtr(1)
	cfg.Subscriptions[0].Enabled = false
	if err := cfg.Validate(); err != nil {
		t.Fatalf("disabled entry with a duplicate order rejected: %v", err)
	}

	cfg.Subscriptions[0].Enabled = true
	if err := cfg.Validate(); err == nil || !strings.Contains(err.Error(), "already used by source test") {
		t.Fatalf("Validate() error = %v, want duplicate order error", err)
	}
}

func intPtr(value int) *int { return &value }

func writeConfig(t *testing.T, data string) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "config.yaml")
	if err := os.WriteFile(path, []byte(data), 0o600); err != nil {
		t.Fatal(err)
	}
	return path
}

// subscriptionFixture is appended to minimalConfig, which already declares the
// source "test" that the ID collision case reuses.
const subscriptionFixture = `
subscriptions:
  - id: peer
    name: 朋友的播客
    enabled: true
    base_url: https://pod.example.com/
    source_id: zhihu-daily
    schedule: {cron: "0 8 * * *"}
    lookback: 48h
    limit: 500
    order: 2
`

func TestLoadDoesNotInterpolateEnvironmentIntoYAML(t *testing.T) {
	t.Setenv("TEST_PASSWORD", "colon: # still a scalar")
	path := filepath.Join(t.TempDir(), "config.yaml")
	data := strings.ReplaceAll(minimalConfig, "PASSWORD", "env://TEST_PASSWORD")
	if err := os.WriteFile(path, []byte(data), 0o600); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(path)
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.Runtime.Database.Password != "colon: # still a scalar" {
		t.Fatalf("password = %q", cfg.Runtime.Database.Password)
	}
}

func TestLoadResolvesTypedEnvironmentValues(t *testing.T) {
	tests := []struct {
		name string
		old  string
		new  string
		env  map[string]string
		want func(*testing.T, *Config)
	}{
		{
			name: "integer field",
			old:  "port: 5432",
			new:  "port: env://TEST_PORT",
			env:  map[string]string{"TEST_PORT": "32707"},
			want: func(t *testing.T, cfg *Config) {
				if cfg.Runtime.Database.Port != 32707 {
					t.Fatalf("database port = %d, want 32707", cfg.Runtime.Database.Port)
				}
			},
		},
		{
			name: "quoted integer field",
			old:  "port: 5432",
			new:  `port: "env://TEST_PORT"`,
			env:  map[string]string{"TEST_PORT": "5433"},
			want: func(t *testing.T, cfg *Config) {
				if cfg.Runtime.Database.Port != 5433 {
					t.Fatalf("database port = %d, want 5433", cfg.Runtime.Database.Port)
				}
			},
		},
		{
			name: "boolean field",
			old:  "force_path_style: true",
			new:  "force_path_style: env://TEST_FORCE_PATH_STYLE",
			env:  map[string]string{"TEST_FORCE_PATH_STYLE": "false"},
			want: func(t *testing.T, cfg *Config) {
				if cfg.Runtime.Storage.ForcePathStyle {
					t.Fatal("storage force_path_style = true, want false")
				}
			},
		},
		{
			name: "numeric text stays a string field",
			old:  "host: localhost",
			new:  "host: env://TEST_HOST",
			env:  map[string]string{"TEST_HOST": "12345"},
			want: func(t *testing.T, cfg *Config) {
				if cfg.Runtime.Database.Host != "12345" {
					t.Fatalf("database host = %q, want 12345", cfg.Runtime.Database.Host)
				}
			},
		},
		{
			name: "empty value clears a string field",
			old:  "password: PASSWORD",
			new:  "password: env://TEST_PASSWORD",
			env:  map[string]string{"TEST_PASSWORD": ""},
			want: func(t *testing.T, cfg *Config) {
				if cfg.Runtime.Database.Password != "" {
					t.Fatalf("database password = %q, want empty", cfg.Runtime.Database.Password)
				}
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			for name, value := range test.env {
				t.Setenv(name, value)
			}
			data := strings.Replace(minimalConfig, test.old, test.new, 1)
			if data == minimalConfig {
				t.Fatalf("test fixture does not contain %q", test.old)
			}
			path := filepath.Join(t.TempDir(), "config.yaml")
			if err := os.WriteFile(path, []byte(data), 0o600); err != nil {
				t.Fatal(err)
			}
			cfg, err := Load(path)
			if err != nil {
				t.Fatalf("Load() error = %v", err)
			}
			test.want(t, cfg)
		})
	}
}

func TestLoadTreatsUnsetEnvironmentReferenceAsEmpty(t *testing.T) {
	const name = "RSS_POD_MISSING_PASSWORD"
	os.Unsetenv(name)
	path := filepath.Join(t.TempDir(), "config.yaml")
	data := strings.Replace(minimalConfig, "password: PASSWORD", "password: env://"+name, 1)
	if data == minimalConfig {
		t.Fatal("test fixture does not contain the password field")
	}
	if err := os.WriteFile(path, []byte(data), 0o600); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(path)
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.Runtime.Database.Password != "" {
		t.Fatalf("database password = %q, want empty", cfg.Runtime.Database.Password)
	}
}

func TestLoadJinaBaseURLDefaultAndEnvironmentOverride(t *testing.T) {
	const name = "RSS_POD_TEST_JINA_BASE_URL"
	os.Unsetenv(name)
	data := strings.Replace(minimalConfig, "base_url: https://r.jina.ai", "base_url: env://"+name, 1)
	if data == minimalConfig {
		t.Fatal("test fixture does not contain the Jina base URL")
	}
	path := filepath.Join(t.TempDir(), "config.yaml")
	if err := os.WriteFile(path, []byte(data), 0o600); err != nil {
		t.Fatal(err)
	}

	cfg, err := Load(path)
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if got := cfg.Services.Content.Jina.BaseURL; got != DefaultJinaBaseURL {
		t.Fatalf("Jina base URL = %q, want built-in default %q", got, DefaultJinaBaseURL)
	}

	t.Setenv(name, "https://jina.internal.example.com")
	cfg, err = Load(path)
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if got := cfg.Services.Content.Jina.BaseURL; got != "https://jina.internal.example.com" {
		t.Fatalf("Jina base URL = %q, want environment override", got)
	}
}

func TestApplyDefaultsFillsBlankJinaBaseURL(t *testing.T) {
	cfg := &Config{Services: ServicesConfig{Content: ContentServices{Jina: JinaService{BaseURL: "   "}}}}
	cfg.applyDefaults()
	if got := cfg.Services.Content.Jina.BaseURL; got != DefaultJinaBaseURL {
		t.Fatalf("Jina base URL = %q, want built-in default %q", got, DefaultJinaBaseURL)
	}
}

func TestHTTPManagementAddressDefaultsToLoopback(t *testing.T) {
	if got := (HTTPConfig{}).ManagementAddress(); got != "127.0.0.1:8081" {
		t.Fatalf("ManagementAddress() = %q, want 127.0.0.1:8081", got)
	}
}

func TestHTTPThemeToggleDefaultsToEnabled(t *testing.T) {
	enabled := true
	disabled := false
	for _, test := range []struct {
		name  string
		value *bool
		want  bool
	}{
		{name: "unset", value: nil, want: true},
		{name: "enabled", value: &enabled, want: true},
		{name: "disabled", value: &disabled, want: false},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := (HTTPConfig{ThemeToggle: test.value}).ThemeToggleEnabled(); got != test.want {
				t.Fatalf("ThemeToggleEnabled() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestLoadReadsDisabledThemeToggle(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.yaml")
	data := strings.Replace(minimalConfig, `http: {listen: ":8080"}`, `http: {listen: ":8080", theme_toggle: false}`, 1)
	if data == minimalConfig {
		t.Fatal("minimal config no longer declares runtime.http")
	}
	if err := os.WriteFile(path, []byte(data), 0o600); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(path)
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.Runtime.HTTP.ThemeToggleEnabled() {
		t.Fatal("theme_toggle: false was ignored")
	}
}

func TestValidateLoopbackListen(t *testing.T) {
	for _, address := range []string{"127.0.0.1:8081", "127.10.20.30:9000", "localhost:8081", "[::1]:8081"} {
		if err := validateLoopbackListen(address); err != nil {
			t.Errorf("validateLoopbackListen(%q) error = %v", address, err)
		}
	}
	for _, address := range []string{":8081", "0.0.0.0:8081", "192.168.1.2:8081", "[::]:8081", "localhost:0"} {
		if err := validateLoopbackListen(address); err == nil {
			t.Errorf("validateLoopbackListen(%q) unexpectedly succeeded", address)
		}
	}
}

func TestValidateOptionalProxy(t *testing.T) {
	for _, value := range []string{"", "   ", "http://127.0.0.1:4090", "  socks5://localhost:1080  "} {
		if err := validateOptionalProxy("proxy", value); err != nil {
			t.Errorf("validateOptionalProxy(%q) error = %v", value, err)
		}
	}
	for _, value := range []string{"localhost:4090", "://broken"} {
		if err := validateOptionalProxy("proxy", value); err == nil {
			t.Errorf("validateOptionalProxy(%q) unexpectedly succeeded", value)
		}
	}
}

func TestCrawl4AIServiceDefaults(t *testing.T) {
	service := Crawl4AIService{}
	if got := service.EffectiveMode(); got != "md" {
		t.Fatalf("EffectiveMode() = %q, want md", got)
	}
	if got := service.EffectiveFilter(); got != "fit" {
		t.Fatalf("EffectiveFilter() = %q, want fit", got)
	}
	if got, err := service.TimeoutDuration(); err != nil || got != 45*time.Second {
		t.Fatalf("TimeoutDuration() = %s, %v, want 45s", got, err)
	}
}

func TestValidateCrawl4AIContent(t *testing.T) {
	content := ContentConfig{Type: "crawl4ai", URL: URLMappingConfig{From: "item.link"}}
	service := Crawl4AIService{BaseURL: "  http://crawl4ai:11235  ", Timeout: "45s"}
	if err := validateContent("test", content, ContentServices{Crawl4AI: service}); err != nil {
		t.Fatalf("valid Crawl4AI content rejected: %v", err)
	}

	tests := []struct {
		name    string
		mutate  func(*Crawl4AIService)
		wantErr string
	}{
		{name: "missing base URL", mutate: func(s *Crawl4AIService) { s.BaseURL = "" }, wantErr: "base_url must not be empty"},
		{name: "whitespace base URL", mutate: func(s *Crawl4AIService) { s.BaseURL = "   " }, wantErr: "base_url must not be empty"},
		{name: "invalid base URL", mutate: func(s *Crawl4AIService) { s.BaseURL = "crawl4ai:11235" }, wantErr: "absolute URL"},
		{name: "invalid timeout", mutate: func(s *Crawl4AIService) { s.Timeout = "never" }, wantErr: "timeout"},
		{name: "unsupported filter", mutate: func(s *Crawl4AIService) { s.Filter = "bm25" }, wantErr: "filter must be raw or fit"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			invalid := service
			test.mutate(&invalid)
			err := validateContent("test", content, ContentServices{Crawl4AI: invalid})
			if err == nil || !strings.Contains(err.Error(), test.wantErr) {
				t.Fatalf("validateContent() error = %v, want containing %q", err, test.wantErr)
			}
		})
	}

	content.URL.From = "feed.url"
	if err := validateContent("test", content, ContentServices{Crawl4AI: service}); err == nil || !strings.Contains(err.Error(), "url.from=item.link") {
		t.Fatalf("validateContent() error = %v, want item.link validation error", err)
	}
}

func TestContentServiceOverrides(t *testing.T) {
	text := func(value string) *string { return &value }

	jina := JinaContentConfig{
		BaseURL: text("https://source-jina.example.com"),
		APIKey:  text("source-key"),
		Proxy:   text(""),
		Timeout: text("10s"),
		Format:  text("html"),
	}.EffectiveService(JinaService{
		BaseURL: "https://global-jina.example.com", APIKey: "global-key", Proxy: "http://proxy.example.com", Timeout: "45s", Format: "markdown",
	})
	if jina.BaseURL != "https://source-jina.example.com" || jina.APIKey != "source-key" || jina.Proxy != "" || jina.Timeout != "10s" || jina.Format != "html" {
		t.Fatalf("Jina overrides = %#v", jina)
	}

	crawl4ai := Crawl4AIContentConfig{
		Mode: text("crawl"), Filter: text("raw"), Proxy: text(""),
	}.EffectiveService(Crawl4AIService{
		BaseURL: "https://crawl.example.com", APIToken: "token", Proxy: "http://proxy.example.com", Timeout: "45s", Mode: "md", Filter: "fit",
	})
	if crawl4ai.BaseURL != "https://crawl.example.com" || crawl4ai.APIToken != "token" || crawl4ai.Proxy != "" || crawl4ai.Timeout != "45s" || crawl4ai.EffectiveMode() != "crawl" || crawl4ai.EffectiveFilter() != "raw" {
		t.Fatalf("Crawl4AI overrides = %#v", crawl4ai)
	}
}

func TestValidateV2EXCrawlTransform(t *testing.T) {
	text := func(value string) *string { return &value }
	services := ContentServices{Crawl4AI: Crawl4AIService{BaseURL: "https://crawl.example.com"}}
	content := ContentConfig{
		Type:      "crawl4ai",
		URL:       URLMappingConfig{From: "item.link"},
		Crawl4AI:  Crawl4AIContentConfig{Mode: text("crawl")},
		Transform: ContentTransformConfig{Type: "v2ex-topic"},
	}
	if err := validateContent("v2ex", content, services); err != nil {
		t.Fatalf("valid V2EX transform rejected: %v", err)
	}

	content.Crawl4AI.Mode = text("md")
	if err := validateContent("v2ex", content, services); err == nil || !strings.Contains(err.Error(), "requires content.crawl4ai.mode=crawl") {
		t.Fatalf("validateContent() error = %v, want mode requirement", err)
	}

	content.Crawl4AI.Mode = text("browser")
	if err := validateContent("v2ex", content, services); err == nil || !strings.Contains(err.Error(), "mode must be md or crawl") {
		t.Fatalf("validateContent() error = %v, want supported mode validation", err)
	}

	content.Crawl4AI.Mode = text("crawl")
	content.Transform.Type = ""
	if err := validateContent("v2ex", content, services); err == nil || !strings.Contains(err.Error(), "requires content.transform.type") {
		t.Fatalf("validateContent() error = %v, want transform requirement", err)
	}
}

func TestValidateJinaContentRequiresItemLink(t *testing.T) {
	services := ContentServices{Jina: JinaService{BaseURL: "  https://r.jina.ai  ", Timeout: "45s"}}
	content := ContentConfig{Type: "jina", URL: URLMappingConfig{From: "item.link"}}
	if err := validateContent("test", content, services); err != nil {
		t.Fatalf("valid Jina content rejected: %v", err)
	}

	invalidServices := services
	invalidServices.Jina.BaseURL = "   "
	if err := validateContent("test", content, invalidServices); err == nil || !strings.Contains(err.Error(), "base_url must not be empty") {
		t.Fatalf("validateContent() error = %v, want empty base_url error", err)
	}
	invalidServices = services
	invalidServices.Jina.BaseURL = "r.jina.ai"
	if err := validateContent("test", content, invalidServices); err == nil || !strings.Contains(err.Error(), "absolute URL") {
		t.Fatalf("validateContent() error = %v, want absolute URL validation error", err)
	}
	invalidServices = services
	invalidServices.Jina.Timeout = "never"
	if err := validateContent("test", content, invalidServices); err == nil || !strings.Contains(err.Error(), "timeout") {
		t.Fatalf("validateContent() error = %v, want timeout validation error", err)
	}

	content.URL.From = "feed.url"
	if err := validateContent("test", content, services); err == nil || !strings.Contains(err.Error(), "url.from=item.link") {
		t.Fatalf("validateContent() error = %v, want item.link validation error", err)
	}
}

func TestLoadRejectsUnknownTTSService(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.yaml")
	data := strings.Replace(minimalConfig, "tts: {edge:", "tts: {chrome:", 1)
	if err := os.WriteFile(path, []byte(data), 0o600); err != nil {
		t.Fatal(err)
	}
	_, err := Load(path)
	if err == nil || !strings.Contains(err.Error(), `unsupported service "chrome"`) {
		t.Fatalf("Load() error = %v, want unsupported chrome service", err)
	}
}

func TestLoadRejectsInvalidTTSTimeouts(t *testing.T) {
	for _, test := range []struct {
		field string
		old   string
		new   string
	}{
		{field: "connect_timeout", old: "connect_timeout: 1s", new: "connect_timeout: 0s"},
		{field: "receive_timeout", old: "receive_timeout: 2s", new: "receive_timeout: invalid"},
	} {
		t.Run(test.field, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "config.yaml")
			data := strings.Replace(minimalConfig, test.old, test.new, 1)
			if err := os.WriteFile(path, []byte(data), 0o600); err != nil {
				t.Fatal(err)
			}
			_, err := Load(path)
			if err == nil || !strings.Contains(err.Error(), test.field) {
				t.Fatalf("Load() error = %v, want %s validation error", err, test.field)
			}
		})
	}
}

func TestValidateTTSServicesRequiresAzureKeyOnlyWhenUsed(t *testing.T) {
	azure := TTSService{
		Region:         "southeastasia",
		OutputFormat:   "audio-24khz-48kbitrate-mono-mp3",
		ConnectTimeout: "1s",
		ReceiveTimeout: "2s",
	}
	cfg := Config{
		Services: ServicesConfig{TTS: map[string]TTSService{
			EdgeTTSServiceName:  {ConnectTimeout: "1s", ReceiveTimeout: "2s"},
			AzureTTSServiceName: azure,
		}},
		DialogueProfiles: map[string]DialogueProfile{
			"azure-profile": {
				Rate: "+0%", Volume: "+0%", Pitch: "+0Hz",
				Speakers: []SpeakerConfig{
					{ID: "host", Name: "Host", Role: "Host role", Voice: "azure:zh-CN-Xiaoxiao2:DragonHDFlashLatestNeural"},
				},
			},
		},
	}
	if err := cfg.validateTTSServices(); err != nil {
		t.Fatalf("azure service unused by any source rejected: %v", err)
	}
	cfg.Sources = []SourceConfig{{
		ID:         "test",
		Generation: &GenerationConfig{DialogueProfile: "azure-profile"},
	}}
	if err := cfg.validateTTSServices(); err == nil || !strings.Contains(err.Error(), "api_key must not be empty") {
		t.Fatalf("validateTTSServices() error = %v, want azure api_key requirement", err)
	}
}

func TestValidateDialogueProfileSkipsUnusedServiceReferences(t *testing.T) {
	cfg := Config{Services: ServicesConfig{TTS: map[string]TTSService{EdgeTTSServiceName: {}}}}
	profile := DialogueProfile{
		Rate: "+0%", Volume: "+0%", Pitch: "+0Hz",
		Speakers: []SpeakerConfig{
			{ID: "host", Name: "Host", Role: "Host role", Voice: "azure:zh-CN-Xiaoxiao2:DragonHDFlashLatestNeural"},
		},
	}
	if err := cfg.validateDialogueProfile("unused", profile); err != nil {
		t.Fatalf("unused profile referencing an undeclared service rejected: %v", err)
	}
	cfg.Defaults.Generation.DialogueProfile = "unused"
	if err := cfg.validateDialogueProfile("unused", profile); err == nil || !strings.Contains(err.Error(), "unknown TTS service") {
		t.Fatalf("validateDialogueProfile() error = %v, want unknown TTS service error", err)
	}
}

func TestValidateAzureTTSEndpoint(t *testing.T) {
	service := TTSService{
		Endpoint:       "https://southeastasia.tts.speech.microsoft.com/cognitiveservices/v1",
		APIKey:         "speech-key",
		OutputFormat:   "audio-24khz-48kbitrate-mono-mp3",
		ConnectTimeout: "1s",
		ReceiveTimeout: "2s",
	}
	cfg := Config{Services: ServicesConfig{TTS: map[string]TTSService{AzureTTSServiceName: service}}}
	if err := cfg.validateTTSServices(); err != nil {
		t.Fatalf("valid Azure endpoint rejected: %v", err)
	}
	service.Endpoint = "https://southeastasia.api.cognitive.microsoft.com/"
	cfg.Services.TTS[AzureTTSServiceName] = service
	if err := cfg.validateTTSServices(); err == nil || !strings.Contains(err.Error(), "/cognitiveservices/v1") {
		t.Fatalf("generic Cognitive Services endpoint error = %v", err)
	}
}

func TestParseSpeakerVoiceSplitsOnlyServicePrefix(t *testing.T) {
	voice, err := ParseSpeakerVoice("azure:zh-CN-Xiaoxiao2:DragonHDFlashLatestNeural")
	if err != nil {
		t.Fatal(err)
	}
	if voice.Service != "azure" || voice.Voice != "zh-CN-Xiaoxiao2:DragonHDFlashLatestNeural" || voice.Talker != "" {
		t.Fatalf("ParseSpeakerVoice() = %#v", voice)
	}
	for _, value := range []string{"", "edge", ":voice", "edge:"} {
		if _, err := ParseSpeakerVoice(value); err == nil {
			t.Errorf("ParseSpeakerVoice(%q) unexpectedly succeeded", value)
		}
	}
}

func TestParseSpeakerVoiceMultiTalker(t *testing.T) {
	voice, err := ParseSpeakerVoice("azure:zh-CN-Multitalker-Xiaochen-Yunhan:DragonHDLatestNeural:xiaochen")
	if err != nil {
		t.Fatal(err)
	}
	if voice.Service != "azure" || voice.Voice != "zh-CN-Multitalker-Xiaochen-Yunhan:DragonHDLatestNeural" || voice.Talker != "xiaochen" || !voice.IsMultiTalker() {
		t.Fatalf("ParseSpeakerVoice() = %#v", voice)
	}
	for _, value := range []string{
		"azure:zh-CN-Multitalker-Xiaochen-Yunhan:DragonHDLatestNeural",
		"edge:zh-CN-Multitalker-Xiaochen-Yunhan:DragonHDLatestNeural:xiaochen",
		"azure:zh-CN-Multitalker-Xiaochen-Yunhan:DragonHDLatestNeural:bad talker",
	} {
		if _, err := ParseSpeakerVoice(value); err == nil {
			t.Errorf("ParseSpeakerVoice(%q) unexpectedly succeeded", value)
		}
	}
}

func TestValidateDialogueProfileAllowsMixedTTS(t *testing.T) {
	cfg := Config{
		Services: ServicesConfig{TTS: map[string]TTSService{
			EdgeTTSServiceName:  {},
			AzureTTSServiceName: {},
		}},
		Defaults: DefaultsConfig{Generation: GenerationConfig{DialogueProfile: "mixed"}},
	}
	profile := DialogueProfile{
		Rate: "+0%", Volume: "+0%", Pitch: "+0Hz",
		Speakers: []SpeakerConfig{
			{ID: "host", Name: "Host", Role: "Host role", Voice: "edge:voice-a"},
			{ID: "guest", Name: "Guest", Role: "Guest role", Voice: "azure:voice:b"},
		},
	}
	if err := cfg.validateDialogueProfile("mixed", profile); err != nil {
		t.Fatalf("mixed TTS profile rejected: %v", err)
	}
}

func TestValidateDialogueProfileMultiTalker(t *testing.T) {
	cfg := Config{
		Services: ServicesConfig{TTS: map[string]TTSService{AzureTTSServiceName: {}}},
		Defaults: DefaultsConfig{Generation: GenerationConfig{DialogueProfile: "multi"}},
	}
	valid := DialogueProfile{
		Rate: "+0%", Volume: "+0%", Pitch: "+0Hz",
		Speakers: []SpeakerConfig{
			{ID: "host", Name: "Host", Role: "Host role", Voice: "azure:zh-CN-Multitalker-Xiaochen-Yunhan:DragonHDLatestNeural:xiaochen"},
			{ID: "guest", Name: "Guest", Role: "Guest role", Voice: "azure:zh-CN-Multitalker-Xiaochen-Yunhan:DragonHDLatestNeural:yunhan"},
		},
	}
	if err := cfg.validateDialogueProfile("multi", valid); err != nil {
		t.Fatalf("valid MultiTalker profile rejected: %v", err)
	}

	tests := []struct {
		name  string
		voice string
	}{
		{name: "mixed", voice: "azure:zh-CN-Xiaoxiao2:DragonHDFlashLatestNeural"},
		{name: "different-model", voice: "azure:en-US-MultiTalker-Ava-Andrew:DragonHDLatestNeural:andrew"},
		{name: "duplicate-talker", voice: "azure:zh-CN-Multitalker-Xiaochen-Yunhan:DragonHDLatestNeural:xiaochen"},
		{name: "unknown-talker", voice: "azure:zh-CN-Multitalker-Xiaochen-Yunhan:DragonHDLatestNeural:other"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			profile := valid
			profile.Speakers = append([]SpeakerConfig(nil), valid.Speakers...)
			profile.Speakers[1].Voice = test.voice
			if err := cfg.validateDialogueProfile("multi", profile); err == nil {
				t.Fatal("invalid MultiTalker profile unexpectedly accepted")
			}
		})
	}
}

func TestRuntimeTimeoutDefaults(t *testing.T) {
	jobTimeout, err := (JobsConfig{}).TimeoutDuration()
	if err != nil {
		t.Fatal(err)
	}
	if jobTimeout != DefaultJobTimeout {
		t.Fatalf("default job timeout = %s, want %s", jobTimeout, DefaultJobTimeout)
	}
	jobFetchPollInterval, err := (JobsConfig{}).FetchPollIntervalDuration()
	if err != nil {
		t.Fatal(err)
	}
	if jobFetchPollInterval != DefaultJobFetchPollInterval {
		t.Fatalf("default job fetch poll interval = %s, want %s", jobFetchPollInterval, DefaultJobFetchPollInterval)
	}

	storageTimeout, err := (StorageConfig{}).TimeoutDuration()
	if err != nil {
		t.Fatal(err)
	}
	if storageTimeout != DefaultStorageOperationTimeout {
		t.Fatalf("default storage timeout = %s, want %s", storageTimeout, DefaultStorageOperationTimeout)
	}
}

func TestRuntimeTimeoutValidation(t *testing.T) {
	for _, value := range []string{"0s", "-1s", "invalid"} {
		if _, err := (JobsConfig{Timeout: value}).TimeoutDuration(); err == nil {
			t.Errorf("JobsConfig timeout %q unexpectedly succeeded", value)
		}
		if _, err := (JobsConfig{FetchPollInterval: value}).FetchPollIntervalDuration(); err == nil {
			t.Errorf("JobsConfig fetch poll interval %q unexpectedly succeeded", value)
		}
		if _, err := (StorageConfig{Timeout: value}).TimeoutDuration(); err == nil {
			t.Errorf("StorageConfig timeout %q unexpectedly succeeded", value)
		}
	}
	if _, err := (JobsConfig{FetchPollInterval: "50ms"}).FetchPollIntervalDuration(); err == nil {
		t.Error("JobsConfig fetch poll interval below River fetch cooldown unexpectedly succeeded")
	}
}

const minimalConfig = `
version: 6
runtime:
  http: {listen: ":8080"}
  database: {type: postgres, host: localhost, port: 5432, name: rsspod, user: app, password: PASSWORD, ssl_mode: disable}
  jobs:
    type: river
    queues: {source: {concurrency: 1}}
  storage:
    type: s3
    endpoint: http://localhost:9000
    region: us-east-1
    access_key: access
    secret_key: secret
    private_bucket: private
    media_bucket: media
    force_path_style: true
    public_media_base_url: http://localhost:9000/media
services:
  content: {jina: {base_url: https://r.jina.ai}}
  llm: {one: {type: openai_compatible, base_url: http://localhost:8000/v1, api_key: key, model: model, proxy: "", timeout: 1s}}
  tts: {edge: {proxy: "", connect_timeout: 1s, receive_timeout: 2s}}
dialogue_profiles:
  default:
    rate: "+0%"
    volume: "+0%"
    pitch: "+0Hz"
    speakers:
      - {id: host, name: Host, role: Friendly host, voice: edge:voice-a}
      - {id: guest, name: Guest, role: Critical guest, voice: edge:voice-b}
defaults:
  schedule: {timezone: Asia/Shanghai}
  llm: [one]
  generation:
    target_duration: 3m
    prompt_template: prompt.tmpl
    dialogue_profile: default
  content: {type: rss-item}
  limits: {max_feed_items_per_run: 10, max_documents_per_item: 10}
  podcast: {max_age: 72h}
sources:
  - id: test
    name: Test
    enabled: true
    feed: {url: http://localhost/feed.xml}
    schedule: {cron: "0 0 * * *"}
`

// One deployment can answer on several public domains, so the media origin of a
// response is resolved from the request host rather than from one global value.
func TestMediaBaseURLByHost(t *testing.T) {
	data := strings.Replace(minimalConfig, "    public_media_base_url: http://localhost:9000/media",
		`    public_media_base_url: http://localhost:9000/media
    public_media_hosts:
      Pod.Example.com: https://media-a.example.com/
      pod-b.example.com: https://media-b.example.com`, 1)
	cfg, err := Load(writeConfig(t, data))
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	storage := cfg.Runtime.Storage
	for _, test := range []struct {
		name string
		host string
		want string
	}{
		{name: "mapped host", host: "pod.example.com", want: "https://media-a.example.com"},
		{name: "mapping ignores case", host: "POD.EXAMPLE.COM", want: "https://media-a.example.com"},
		{name: "mapping ignores a trailing dot", host: "pod.example.com.", want: "https://media-a.example.com"},
		{name: "mapping ignores the port", host: "pod-b.example.com:8443", want: "https://media-b.example.com"},
		{name: "unmapped host keeps the default", host: "other.example.com", want: "http://localhost:9000/media"},
		{name: "empty host keeps the default", host: "", want: "http://localhost:9000/media"},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := storage.MediaBaseURL(test.host); got != test.want {
				t.Fatalf("MediaBaseURL(%q) = %q, want %q", test.host, got, test.want)
			}
		})
	}

	// A deployment without a mapping keeps the configured default everywhere,
	// which is what makes the feature optional.
	if got := (StorageConfig{PublicMediaBaseURL: "https://media.example.com/"}).MediaBaseURL("pod.example.com"); got != "https://media.example.com" {
		t.Fatalf("default MediaBaseURL() = %q", got)
	}
}

func TestValidatePublicMediaHosts(t *testing.T) {
	for _, test := range []struct {
		name    string
		hosts   string
		wantErr string
	}{
		{
			name:  "accepts a bare host",
			hosts: "    public_media_hosts:\n      pod.example.com: https://media.example.com",
		},
		{
			name:    "rejects an empty host",
			hosts:   "    public_media_hosts:\n      \"\": https://media.example.com",
			wantErr: "public_media_hosts contains an empty host",
		},
		{
			// An env:// variable the process never received is the usual reason
			// for an empty value, so the error names it.
			name:    "rejects an empty media address",
			hosts:   "    public_media_hosts:\n      pod.example.com: env://RSS_POD_TEST_UNSET_MEDIA_BASE_URL",
			wantErr: "public_media_hosts pod.example.com needs a media URL",
		},
		{
			// A scheme would never match a request host, so it must not pass
			// validation as a silently ignored entry.
			name:    "rejects a URL as the host",
			hosts:   "    public_media_hosts:\n      https://pod.example.com: https://media.example.com",
			wantErr: "public_media_hosts keys must be bare host names",
		},
		{
			name:    "rejects a relative media address",
			hosts:   "    public_media_hosts:\n      pod.example.com: media.example.com",
			wantErr: "public_media_hosts pod.example.com must be an absolute URL",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			data := strings.Replace(minimalConfig, "    public_media_base_url: http://localhost:9000/media",
				"    public_media_base_url: http://localhost:9000/media\n"+test.hosts, 1)
			_, err := Load(writeConfig(t, data))
			if test.wantErr == "" {
				if err != nil {
					t.Fatalf("Load() error = %v", err)
				}
				return
			}
			if err == nil || !strings.Contains(err.Error(), test.wantErr) {
				t.Fatalf("Load() error = %v, want containing %q", err, test.wantErr)
			}
		})
	}
}

// Both sides of a pair may be an env:// reference, which lets a deployment keep
// the public domain and its media origin out of the configuration file. An unset
// variable resolves to an empty string, so the pair then fails validation.
func TestMediaHostsFromEnvironment(t *testing.T) {
	path := func(t *testing.T) string {
		t.Helper()
		data := strings.Replace(minimalConfig, "    public_media_base_url: http://localhost:9000/media",
			`    public_media_base_url: http://localhost:9000/media
    public_media_hosts:
      env://RSS_POD_TEST_HOST: env://RSS_POD_TEST_MEDIA`, 1)
		return writeConfig(t, data)
	}

	t.Run("both variables are substituted", func(t *testing.T) {
		t.Setenv("RSS_POD_TEST_HOST", "pod.example.com")
		t.Setenv("RSS_POD_TEST_MEDIA", "https://oss.example.com/rsspod-media")
		cfg, err := Load(path(t))
		if err != nil {
			t.Fatalf("Load() error = %v", err)
		}
		if got := cfg.Runtime.Storage.MediaBaseURL("pod.example.com"); got != "https://oss.example.com/rsspod-media" {
			t.Fatalf("MediaBaseURL(pod.example.com) = %q", got)
		}
		if got := cfg.Runtime.Storage.MediaBaseURL("other.example.com"); got != "http://localhost:9000/media" {
			t.Fatalf("MediaBaseURL(other.example.com) = %q", got)
		}
	})

	t.Run("an unset variable fails with the empty pair", func(t *testing.T) {
		t.Setenv("RSS_POD_TEST_HOST", "")
		t.Setenv("RSS_POD_TEST_MEDIA", "")
		if _, err := Load(path(t)); err == nil {
			t.Fatal("Load() accepted a pair that resolved to empty strings")
		}
	})
}
