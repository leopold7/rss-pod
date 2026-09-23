package config

import (
	"errors"
	"fmt"
	"net"
	"net/url"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"text/template"
	"time"

	"github.com/robfig/cron/v3"
	"gopkg.in/yaml.v3"
)

const CurrentVersion = 6

const (
	EdgeTTSServiceName  = "edge"
	AzureTTSServiceName = "azure"
)

const (
	DefaultJobTimeout              = 30 * time.Minute
	DefaultJobFetchPollInterval    = 30 * time.Second
	MinimumJobFetchPollInterval    = 100 * time.Millisecond
	DefaultStorageOperationTimeout = 2 * time.Minute
)

const (
	// SubscriptionEpisodesPath is the public player endpoint a subscription
	// mirrors; it is served by every rss-pod deployment.
	SubscriptionEpisodesPath = "/api/v1/player/episodes"
	// DefaultSubscriptionLookback covers the first pull of a subscription that
	// has no completed run yet. Later pulls continue from the previous run.
	DefaultSubscriptionLookback = 72 * time.Hour
	// DefaultSubscriptionLimit and MaxSubscriptionLimit bound the page a
	// subscription asks for. The remote player endpoint accepts at most 500.
	DefaultSubscriptionLimit = 200
	MaxSubscriptionLimit     = 500
	// SubscriptionTimeFormat matches the millisecond precision the player
	// endpoint examples use for its since/before window.
	SubscriptionTimeFormat = "2006-01-02T15:04:05.000Z07:00"
)

// DefaultJinaBaseURL is the publishable fallback applied when
// services.content.jina.base_url is missing or resolves to an empty value.
// Deployments point JINA_BASE_URL at their own Jina instance to replace it.
const DefaultJinaBaseURL = "https://r.jina.ai"

type Config struct {
	Admin            AdminConfig                `yaml:"-" json:"-"`
	Version          int                        `yaml:"version"`
	Runtime          RuntimeConfig              `yaml:"runtime"`
	Services         ServicesConfig             `yaml:"services"`
	DialogueProfiles map[string]DialogueProfile `yaml:"dialogue_profiles"`
	// TagTexts is the shared dictionary the tag rules read their text from:
	// rules reference one entry by key, so several sources can show the same
	// wording without repeating it.
	// TagTexts 是标识规则读取文案的共享词典：规则按 key 引用其中一条，多个来源可以
	// 共用同一段文案而不必重复书写。
	TagTexts      map[string]TagText   `yaml:"tag_texts" json:"tag_texts,omitempty"`
	Defaults      DefaultsConfig       `yaml:"defaults"`
	Sources       []SourceConfig       `yaml:"sources"`
	Subscriptions []SubscriptionConfig `yaml:"subscriptions"`
}

type RuntimeConfig struct {
	HTTP     HTTPConfig     `yaml:"http"`
	Database DatabaseConfig `yaml:"database"`
	Jobs     JobsConfig     `yaml:"jobs"`
	Storage  StorageConfig  `yaml:"storage"`
}

type HTTPConfig struct {
	Listen           string `yaml:"listen"`
	ManagementListen string `yaml:"management_listen"`
	NoticeFile       string `yaml:"notice_file"`
	// ThemeToggle is a pointer so an omitted value keeps the player's
	// light/dark switch visible; only an explicit false hides it.
	ThemeToggle *bool `yaml:"theme_toggle"`
}

func (c HTTPConfig) ManagementAddress() string {
	if strings.TrimSpace(c.ManagementListen) == "" {
		return "127.0.0.1:8081"
	}
	return c.ManagementListen
}

// ThemeToggleEnabled reports whether the player shows its light/dark theme
// switch. The switch is visible unless runtime.http.theme_toggle is explicitly
// set to false.
func (c HTTPConfig) ThemeToggleEnabled() bool {
	return c.ThemeToggle == nil || *c.ThemeToggle
}

type DatabaseConfig struct {
	Type     string `yaml:"type"`
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Name     string `yaml:"name"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	SSLMode  string `yaml:"ssl_mode"`
}

func (c DatabaseConfig) URL() string {
	u := &url.URL{
		Scheme: "postgres",
		Host:   fmt.Sprintf("%s:%d", c.Host, c.Port),
		Path:   c.Name,
		User:   url.UserPassword(c.User, c.Password),
	}
	q := u.Query()
	q.Set("sslmode", c.SSLMode)
	u.RawQuery = q.Encode()
	return u.String()
}

type JobsConfig struct {
	Type              string                 `yaml:"type"`
	Timeout           string                 `yaml:"timeout"`
	FetchPollInterval string                 `yaml:"fetch_poll_interval"`
	Queues            map[string]QueueConfig `yaml:"queues"`
}

func (c JobsConfig) TimeoutDuration() (time.Duration, error) {
	return optionalDuration(c.Timeout, DefaultJobTimeout)
}

func (c JobsConfig) FetchPollIntervalDuration() (time.Duration, error) {
	duration, err := optionalDuration(c.FetchPollInterval, DefaultJobFetchPollInterval)
	if err != nil {
		return 0, err
	}
	// River's default fetch cooldown is 100 ms, and its poll interval may not
	// be shorter than that cooldown.
	if duration < MinimumJobFetchPollInterval {
		return 0, fmt.Errorf("must be at least %s", MinimumJobFetchPollInterval)
	}
	return duration, nil
}

type QueueConfig struct {
	Concurrency int `yaml:"concurrency"`
}

type StorageConfig struct {
	Type               string `yaml:"type"`
	Endpoint           string `yaml:"endpoint"`
	Region             string `yaml:"region"`
	AccessKey          string `yaml:"access_key"`
	SecretKey          string `yaml:"secret_key"`
	PrivateBucket      string `yaml:"private_bucket"`
	MediaBucket        string `yaml:"media_bucket"`
	ForcePathStyle     bool   `yaml:"force_path_style"`
	PublicMediaBaseURL string `yaml:"public_media_base_url"`
	// PublicMediaHosts maps a public site host to the media origin its listeners
	// should receive. One deployment can answer on several public domains, and
	// each of them can publish its audio under its own media host. A request
	// whose host has no entry keeps PublicMediaBaseURL, so the mapping is purely
	// additive and a single-domain deployment is unaffected.
	// PublicMediaHosts 把公开站点域名映射到该域名的听众应使用的媒体地址。一个部署可以
	// 在多个域名上提供服务，每个域名可以用各自的媒体主机发布音频；请求域名未命中时回退
	// PublicMediaBaseURL，因此这张表完全是可选的，单域名部署不受影响。
	PublicMediaHosts map[string]string `yaml:"public_media_hosts"`
	Timeout          string            `yaml:"timeout"`
}

func (c StorageConfig) TimeoutDuration() (time.Duration, error) {
	return optionalDuration(c.Timeout, DefaultStorageOperationTimeout)
}

// MediaBaseURL returns the media origin a request host should use. Keys are
// normalised while loading, so this stays a plain lookup, and a host without an
// entry falls back to the configured default.
func (c StorageConfig) MediaBaseURL(host string) string {
	if base, ok := c.PublicMediaHosts[normalizeHost(host)]; ok && base != "" {
		return base
	}
	return strings.TrimRight(strings.TrimSpace(c.PublicMediaBaseURL), "/")
}

// normalizeHost makes a request host and a mapping key comparable: host names
// are case insensitive, may carry a trailing dot, and a request host carries a
// port whenever the deployment does not listen on the default one.
func normalizeHost(host string) string {
	host = strings.ToLower(strings.TrimSpace(host))
	host = strings.TrimSuffix(host, ".")
	// A request host never carries a path, so a value that has one is a broken
	// mapping key, such as a full URL; leave it intact for Validate to reject
	// instead of splitting it into a host that would silently never match.
	if strings.Contains(host, "/") {
		return host
	}
	if name, _, err := net.SplitHostPort(host); err == nil {
		return name
	}
	return host
}

func optionalDuration(value string, fallback time.Duration) (time.Duration, error) {
	if strings.TrimSpace(value) == "" {
		return fallback, nil
	}
	duration, err := time.ParseDuration(value)
	if err != nil || duration <= 0 {
		return 0, errors.New("must be a positive duration")
	}
	return duration, nil
}

type ServicesConfig struct {
	Content ContentServices       `yaml:"content"`
	LLM     map[string]LLMService `yaml:"llm"`
	TTS     map[string]TTSService `yaml:"tts"`
}

type ContentServices struct {
	Jina     JinaService     `yaml:"jina"`
	Crawl4AI Crawl4AIService `yaml:"crawl4ai"`
}

type JinaService struct {
	BaseURL string `yaml:"base_url"`
	APIKey  string `yaml:"api_key"`
	Proxy   string `yaml:"proxy"`
	Timeout string `yaml:"timeout"`
	Format  string `yaml:"format"`
}

func (s JinaService) TimeoutDuration() (time.Duration, error) {
	return optionalDuration(s.Timeout, 45*time.Second)
}

type Crawl4AIService struct {
	BaseURL  string `yaml:"base_url"`
	APIToken string `yaml:"api_token"`
	Proxy    string `yaml:"proxy"`
	Timeout  string `yaml:"timeout"`
	Mode     string `yaml:"mode"`
	Filter   string `yaml:"filter"`
}

func (s Crawl4AIService) EffectiveMode() string {
	if strings.TrimSpace(s.Mode) == "" {
		return "md"
	}
	return strings.ToLower(strings.TrimSpace(s.Mode))
}

func (s Crawl4AIService) EffectiveFilter() string {
	if strings.TrimSpace(s.Filter) == "" {
		return "fit"
	}
	return strings.ToLower(strings.TrimSpace(s.Filter))
}

func (s Crawl4AIService) TimeoutDuration() (time.Duration, error) {
	return optionalDuration(s.Timeout, 45*time.Second)
}

type LLMService struct {
	Type    string `yaml:"type"`
	BaseURL string `yaml:"base_url"`
	APIKey  string `yaml:"api_key"`
	Model   string `yaml:"model"`
	Proxy   string `yaml:"proxy"`
	Timeout string `yaml:"timeout"`
}

type TTSService struct {
	Proxy          string `yaml:"proxy"`
	ConnectTimeout string `yaml:"connect_timeout"`
	ReceiveTimeout string `yaml:"receive_timeout"`
	Endpoint       string `yaml:"endpoint"`
	Region         string `yaml:"region"`
	APIKey         string `yaml:"api_key"`
	OutputFormat   string `yaml:"output_format"`
}

func (c TTSService) AzureEndpoint() string {
	if endpoint := strings.TrimSpace(c.Endpoint); endpoint != "" {
		return endpoint
	}
	return fmt.Sprintf("https://%s.tts.speech.microsoft.com/cognitiveservices/v1", strings.TrimSpace(c.Region))
}

type DialogueProfile struct {
	Rate     string          `yaml:"rate" json:"rate"`
	Volume   string          `yaml:"volume" json:"volume"`
	Pitch    string          `yaml:"pitch" json:"pitch"`
	Speakers []SpeakerConfig `yaml:"speakers" json:"speakers"`
}

type DefaultsConfig struct {
	Schedule   ScheduleConfig   `yaml:"schedule"`
	LLM        []string         `yaml:"llm"`
	Generation GenerationConfig `yaml:"generation"`
	Content    ContentConfig    `yaml:"content"`
	Limits     LimitsConfig     `yaml:"limits"`
	Podcast    PodcastConfig    `yaml:"podcast"`
	// Tag is the badge every source shows beside its name unless it declares
	// one of its own. Unset means no source shows a badge.
	// Tag 是所有来源在名称旁显示的标识，来源自己声明 tag 时整块覆盖它；不配置表示
	// 没有任何来源显示标识。
	Tag *TagRuleConfig `yaml:"tag" json:"tag,omitempty"`
}

type ScheduleConfig struct {
	Timezone string `yaml:"timezone"`
	Cron     string `yaml:"cron"`
}

type GenerationConfig struct {
	TargetDuration  string `yaml:"target_duration" json:"target_duration"`
	PromptTemplate  string `yaml:"prompt_template" json:"prompt_template"`
	DialogueProfile string `yaml:"dialogue_profile" json:"dialogue_profile"`
}

type SpeakerConfig struct {
	ID    string `yaml:"id" json:"id"`
	Name  string `yaml:"name" json:"name"`
	Role  string `yaml:"role" json:"role"`
	Voice string `yaml:"voice" json:"voice"`
}

type SpeakerVoice struct {
	Service string
	Voice   string
	Talker  string
}

func (v SpeakerVoice) IsMultiTalker() bool {
	return v.Talker != ""
}

func ParseSpeakerVoice(value string) (SpeakerVoice, error) {
	value = strings.TrimSpace(value)
	separator := strings.IndexByte(value, ':')
	if separator <= 0 || separator == len(value)-1 {
		return SpeakerVoice{}, errors.New("must use service:voice format")
	}
	result := SpeakerVoice{
		Service: strings.TrimSpace(value[:separator]),
		Voice:   strings.TrimSpace(value[separator+1:]),
	}
	if result.Service == "" || result.Voice == "" {
		return SpeakerVoice{}, errors.New("must use service:voice format")
	}
	if !isMultiTalkerVoice(result.Voice) {
		return result, nil
	}
	if result.Service != AzureTTSServiceName {
		return SpeakerVoice{}, errors.New("MultiTalker voices require the azure service")
	}
	if strings.Count(result.Voice, ":") < 2 {
		return SpeakerVoice{}, errors.New("MultiTalker voice must use service:voice:talker format")
	}
	talkerSeparator := strings.LastIndexByte(result.Voice, ':')
	if talkerSeparator <= 0 || talkerSeparator == len(result.Voice)-1 {
		return SpeakerVoice{}, errors.New("MultiTalker voice must use service:voice:talker format")
	}
	result.Talker = strings.TrimSpace(result.Voice[talkerSeparator+1:])
	result.Voice = strings.TrimSpace(result.Voice[:talkerSeparator])
	if result.Voice == "" || !validTalkerID.MatchString(result.Talker) {
		return SpeakerVoice{}, errors.New("MultiTalker voice contains an invalid talker")
	}
	return result, nil
}

var validTalkerID = regexp.MustCompile(`^[A-Za-z][A-Za-z0-9_-]*$`)

func isMultiTalkerVoice(voice string) bool {
	return strings.Contains(strings.ToLower(voice), "multitalker")
}

func multiTalkerNames(voice string) []string {
	lower := strings.ToLower(voice)
	marker := "multitalker-"
	start := strings.Index(lower, marker)
	if start < 0 {
		return nil
	}
	value := voice[start+len(marker):]
	if end := strings.IndexByte(value, ':'); end >= 0 {
		value = value[:end]
	}
	parts := strings.Split(value, "-")
	if len(parts) < 2 {
		return nil
	}
	return parts
}

type ContentConfig struct {
	Type      string                 `yaml:"type"`
	URL       URLMappingConfig       `yaml:"url"`
	Jina      JinaContentConfig      `yaml:"jina"`
	Crawl4AI  Crawl4AIContentConfig  `yaml:"crawl4ai"`
	Transform ContentTransformConfig `yaml:"transform"`
}

type JinaContentConfig struct {
	BaseURL *string `yaml:"base_url"`
	APIKey  *string `yaml:"api_key"`
	Proxy   *string `yaml:"proxy"`
	Timeout *string `yaml:"timeout"`
	Format  *string `yaml:"format"`
}

func (c JinaContentConfig) EffectiveService(service JinaService) JinaService {
	service.BaseURL = overrideString(service.BaseURL, c.BaseURL)
	service.APIKey = overrideString(service.APIKey, c.APIKey)
	service.Proxy = overrideString(service.Proxy, c.Proxy)
	service.Timeout = overrideString(service.Timeout, c.Timeout)
	service.Format = overrideString(service.Format, c.Format)
	return service
}

type Crawl4AIContentConfig struct {
	Mode     *string `yaml:"mode"`
	BaseURL  *string `yaml:"base_url"`
	APIToken *string `yaml:"api_token"`
	Proxy    *string `yaml:"proxy"`
	Timeout  *string `yaml:"timeout"`
	Filter   *string `yaml:"filter"`
}

func (c Crawl4AIContentConfig) EffectiveService(service Crawl4AIService) Crawl4AIService {
	service.BaseURL = overrideString(service.BaseURL, c.BaseURL)
	service.APIToken = overrideString(service.APIToken, c.APIToken)
	service.Proxy = overrideString(service.Proxy, c.Proxy)
	service.Timeout = overrideString(service.Timeout, c.Timeout)
	service.Mode = overrideString(service.Mode, c.Mode)
	service.Filter = overrideString(service.Filter, c.Filter)
	return service
}

func overrideString(fallback string, override *string) string {
	if override == nil {
		return fallback
	}
	return *override
}

type ContentTransformConfig struct {
	Type string `yaml:"type"`
}

type URLMappingConfig struct {
	From     string `yaml:"from"`
	Regex    string `yaml:"regex"`
	Template string `yaml:"template"`
}

type LimitsConfig struct {
	MaxFeedItemsPerRun  int `yaml:"max_feed_items_per_run"`
	MaxDocumentsPerItem int `yaml:"max_documents_per_item"`
}

type PodcastConfig struct {
	MaxAge string `yaml:"max_age" json:"max_age"`
}

type SourceConfig struct {
	ID      string `yaml:"id" json:"id"`
	Name    string `yaml:"name" json:"name"`
	Enabled bool   `yaml:"enabled" json:"enabled"`
	// PollOnly keeps the source discover-only: a poll stores new feed items and
	// creates episodes that wait in the player until a listener starts
	// generation. The default keeps the fully automatic pipeline.
	// PollOnly 让来源只负责发现内容：轮询只入库并创建条目，等待听众在播放器里
	// 手动开始生成；默认关闭时保持全自动流水线。
	PollOnly bool `yaml:"poll_only" json:"poll_only"`
	// Order places the source in the player's filter; 1 comes first. An entry
	// without an order keeps the configuration sequence and fills the positions
	// that the ordered entries leave open. A repeated order, or one that skips a
	// position, moves towards the next free slot rather than being rejected.
	// Order 决定该来源在播放器筛选中的位置，1 表示排在最前；不填写时按配置顺序
	// 填补已排序条目留下的位置。order 重复或断档都不会报错，而是自动顺延到下一个
	// 空位。
	Order      *int              `yaml:"order" json:"order,omitempty"`
	Feed       FeedConfig        `yaml:"feed" json:"feed"`
	Schedule   ScheduleConfig    `yaml:"schedule" json:"schedule"`
	Content    *ContentConfig    `yaml:"content" json:"content,omitempty"`
	Generation *GenerationConfig `yaml:"generation" json:"generation,omitempty"`
	LLM        []string          `yaml:"llm" json:"llm,omitempty"`
	Limits     *LimitsConfig     `yaml:"limits" json:"limits,omitempty"`
	Podcast    *PodcastConfig    `yaml:"podcast" json:"podcast,omitempty"`
	// Filter picks the articles a source processes out of a feed that carries
	// more: a whitelist keeps the matches and a blacklist drops them, and the
	// two cannot be combined. An absent filter, or one whose list carries no
	// rules, processes every item.
	// Filter 用于从内容较多的 feed 中挑选该来源要处理的文章：白名单保留命中的条目，
	// 黑名单丢弃命中的条目，二者不能同时使用。不配置时，或列表里没有规则时，处理
	// 全部条目。
	Filter *SourceFilterConfig `yaml:"filter" json:"filter,omitempty"`
	// Tag shows a badge beside this source's name in the player. It replaces
	// defaults.tag as a whole, so a source that wants no badge declares an
	// empty block instead of inheriting one; an absent block keeps the
	// default, and neither being set shows nothing.
	// Tag 在该来源名称旁显示一个标识。它会整块替换 defaults.tag，因此不想要标识的
	// 来源需要显式声明空块而不能靠继承关闭；不声明时沿用默认值，两者都没有则不显示。
	Tag *TagRuleConfig `yaml:"tag" json:"tag,omitempty"`
}

type FeedConfig struct {
	URL string `yaml:"url" json:"url"`
}

// FilterRuleTypeTitle matches a rule against the title of a feed item. A new
// rule type is added by extending FilterItem and the switch in
// ItemFilter.matches, so a source keeps selecting its articles through one
// configuration shape.
const FilterRuleTypeTitle = "title"

// SourceFilterConfig selects the feed items a source processes. At most one of
// Whitelist and Blacklist may carry rules, because the two lists answer the
// same question in opposite ways: a whitelist keeps the items its rules match,
// while a blacklist drops them. A source without a filter, and one whose
// declared list carries no rules, process every item the feed returns, which
// makes filtering opt-in.
type SourceFilterConfig struct {
	// Whitelist keeps only the items that at least one rule matches, so
	// requiring several patterns at once means writing one regular expression
	// for them. An empty list does not filter anything.
	Whitelist []FilterRuleConfig `yaml:"whitelist" json:"whitelist,omitempty"`
	// Blacklist drops the items that at least one rule matches and keeps the
	// rest. An empty list does not filter anything.
	Blacklist []FilterRuleConfig `yaml:"blacklist" json:"blacklist,omitempty"`
}

// FilterRuleConfig is one filter rule. Type selects the feed item field that
// the regular expression runs against, and regex is matched unanchored, so the
// pattern only has to appear somewhere inside that field.
type FilterRuleConfig struct {
	Type  string `yaml:"type" json:"type"`
	Regex string `yaml:"regex" json:"regex"`
}

// FilterItem carries the feed item fields that filter rules can read.
type FilterItem struct {
	Title string
}

// ItemFilter is a compiled SourceFilterConfig. Its zero value accepts every
// item, so a source without a filter needs no special case.
type ItemFilter struct {
	// whitelist tells which list the rules came from, because it decides
	// whether a match keeps an item or drops it.
	whitelist bool
	rules     []compiledFilterRule
}

type compiledFilterRule struct {
	ruleType string
	regex    *regexp.Regexp
}

// Compile resolves the configured rules, including their regular expressions,
// so matching an item stays a plain regular expression call. A nil config, and
// a config whose lists carry no rules, compile into the zero filter, which
// accepts everything.
func (c *SourceFilterConfig) Compile() (ItemFilter, error) {
	if c == nil {
		return ItemFilter{}, nil
	}
	if len(c.Whitelist) > 0 && len(c.Blacklist) > 0 {
		return ItemFilter{}, errors.New("whitelist and blacklist cannot be used together")
	}
	// An empty list is what an unset key and an explicitly empty one both
	// resolve to, so only the list that carries rules reaches the loop below,
	// and its name keeps the error messages pointing at the configured key.
	whitelist := len(c.Whitelist) > 0
	name, list := "blacklist", c.Blacklist
	if whitelist {
		name, list = "whitelist", c.Whitelist
	}
	if len(list) == 0 {
		return ItemFilter{}, nil
	}
	rules := make([]compiledFilterRule, 0, len(list))
	for i, rule := range list {
		ruleType := strings.ToLower(strings.TrimSpace(rule.Type))
		if ruleType != FilterRuleTypeTitle {
			return ItemFilter{}, fmt.Errorf("%s[%d].type must be %q, got %q", name, i, FilterRuleTypeTitle, rule.Type)
		}
		pattern := strings.TrimSpace(rule.Regex)
		if pattern == "" {
			return ItemFilter{}, fmt.Errorf("%s[%d].regex must not be empty", name, i)
		}
		compiled, err := regexp.Compile(pattern)
		if err != nil {
			return ItemFilter{}, fmt.Errorf("%s[%d].regex: %w", name, i, err)
		}
		rules = append(rules, compiledFilterRule{ruleType: ruleType, regex: compiled})
	}
	return ItemFilter{whitelist: whitelist, rules: rules}, nil
}

// Accept reports whether an item passes the filter and continues through the
// pipeline. A filter without rules accepts every item.
func (f ItemFilter) Accept(item FilterItem) bool {
	if len(f.rules) == 0 {
		return true
	}
	if f.whitelist {
		return f.matches(item)
	}
	return !f.matches(item)
}

// matches reports whether at least one rule matches the item.
func (f ItemFilter) matches(item FilterItem) bool {
	for _, rule := range f.rules {
		switch rule.ruleType {
		case FilterRuleTypeTitle:
			if rule.regex.MatchString(item.Title) {
				return true
			}
		}
	}
	return false
}

// TagRuleTypeLength shows a source's badge once the article it turned into an
// episode reaches Value characters. The count is the article the content
// pipeline reads, feed_items.content falling back to description, with its
// markup removed, so the threshold compares characters a reader would see. A
// new rule type is added by extending TagForArticle, so every badge keeps one
// configuration shape.
// TagRuleTypeLength 表示文章达到 Value 个字符时显示标识；字符数是内容流水线读取的那份
// 正文（feed_items.content，为空时用 description）去掉 HTML 标签后的结果，因此阈值比
// 较的是读者能看到的字数。新增规则类型只需扩展 TagForArticle。
const TagRuleTypeLength = "length"

// TagText is one badge text in every language the player serves. Keys are the
// language codes the player renders ("en" and "zh-CN"), and a page picks the
// entry that matches its own language, falling back to the first text the
// entry carries.
// TagText 是一条标识文案在各语言下的文本。key 使用播放器渲染的语言代码（"en" 与
// "zh-CN"），页面优先取与自己语言一致的条目，取不到时回退到其中任意一条。
type TagText map[string]string

// TagRuleConfig is the badge a source shows beside its name in the player:
// Type selects the condition the rule tests, Value is the threshold that
// condition reads (for length, the character count of the article text), and
// Text names one entry of the shared tag_texts dictionary, so several rules can
// reuse the same wording. An empty block declares no badge, which is how a
// source opts out of defaults.tag.
// TagRuleConfig 描述来源显示在播放器名称旁的标识：type 决定规则判断的条件，value
// 是该条件读取的阈值（length 取文章正文的字符数），text 引用顶层 tag_texts 词典里的
// 一个条目，因此多条规则可以复用同一段文案。空块表示不显示标识，来源可以用它退出
// defaults.tag。
type TagRuleConfig struct {
	Type  string `yaml:"type" json:"type"`
	Value int    `yaml:"value" json:"value"`
	Text  string `yaml:"text" json:"text"`
}

// SubscriptionConfig mirrors another rss-pod deployment. Instead of reading a
// feed, it pulls the remote player endpoint and republishes the episodes that
// deployment already produced, so a deployment can carry podcasts that other
// people generate. ID names the mirrored episodes locally: it becomes their
// source_id and the name the player filter shows.
type SubscriptionConfig struct {
	ID      string `yaml:"id" json:"id"`
	Name    string `yaml:"name" json:"name"`
	Enabled bool   `yaml:"enabled" json:"enabled"`
	// Order places the subscription in the player's filter, which both lists
	// share; 1 comes first. An entry without an order keeps the configuration
	// sequence and fills the positions that the ordered entries leave open. A
	// repeated order, or one that skips a position, moves towards the next free
	// slot rather than being rejected.
	// Order 决定该订阅在播放器筛选中的位置（来源与订阅共用同一个筛选），1 表示
	// 排在最前；不填写时按配置顺序填补已排序条目留下的位置。order 重复或断档都不会
	// 报错，而是自动顺延到下一个空位。
	Order *int `yaml:"order" json:"order,omitempty"`
	// BaseURL is the origin of the remote deployment, without the API path.
	BaseURL string `yaml:"base_url" json:"base_url"`
	// SourceID selects one source of the remote deployment; empty mirrors every
	// source it exposes.
	SourceID string         `yaml:"source_id" json:"source_id,omitempty"`
	Schedule ScheduleConfig `yaml:"schedule" json:"schedule"`
	// Lookback is the window of the first pull, used until a run completes.
	Lookback string `yaml:"lookback" json:"lookback,omitempty"`
	// Limit is the page size requested from the remote endpoint.
	Limit int `yaml:"limit" json:"limit,omitempty"`
}

// EffectiveLimit returns the page size sent to the remote endpoint.
func (s SubscriptionConfig) EffectiveLimit() int {
	if s.Limit <= 0 {
		return DefaultSubscriptionLimit
	}
	return s.Limit
}

// LookbackDuration returns the window of the first pull.
func (s SubscriptionConfig) LookbackDuration() (time.Duration, error) {
	return optionalDuration(s.Lookback, DefaultSubscriptionLookback)
}

// EpisodesEndpoint is the remote player endpoint this subscription mirrors.
func (s SubscriptionConfig) EpisodesEndpoint() string {
	return strings.TrimRight(strings.TrimSpace(s.BaseURL), "/") + SubscriptionEpisodesPath
}

// EpisodesURL builds one pull URL. The remote endpoint filters on the window
// between since and before, and source_id is optional: without it the remote
// deployment returns every source it publishes.
func (s SubscriptionConfig) EpisodesURL(since, before time.Time, limit int) string {
	query := url.Values{}
	query.Set("since", since.UTC().Format(SubscriptionTimeFormat))
	query.Set("before", before.UTC().Format(SubscriptionTimeFormat))
	query.Set("limit", strconv.Itoa(limit))
	if sourceID := strings.TrimSpace(s.SourceID); sourceID != "" {
		query.Set("source_id", sourceID)
	}
	return s.EpisodesEndpoint() + "?" + query.Encode()
}

// SourceRef names one entry of the player's source filter.
type SourceRef struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// EpisodeSources lists every enabled owner of episodes: the feed sources that
// generate them and the subscriptions that mirror them, in the order the
// player's filter renders them.
func (c *Config) EpisodeSources() []SourceRef {
	entries := make([]episodeSource, 0, len(c.Sources)+len(c.Subscriptions))
	for _, source := range c.Sources {
		if source.Enabled {
			entries = append(entries, episodeSource{ref: SourceRef{ID: source.ID, Name: source.Name}, order: source.Order})
		}
	}
	for _, subscription := range c.Subscriptions {
		if subscription.Enabled {
			entries = append(entries, episodeSource{ref: SourceRef{ID: subscription.ID, Name: subscription.Name}, order: subscription.Order})
		}
	}
	return orderEpisodeSources(entries)
}

// episodeSource is one filter entry with the optional position that its source
// or subscription asked for.
type episodeSource struct {
	ref   SourceRef
	order *int
}

// orderEpisodeSources places the entries that carry an order at the position
// they ask for and fills the slots that stay open with the unset entries, which
// keep their configuration sequence. An order reads as a rank rather than as a
// fixed slot: a repeated order moves to the next free position, and so does an
// order that leaves a gap, so the filter never carries an empty entry. An order
// beyond the last entry moves towards the end, and positions are resolved in
// ascending order so two entries never claim the same slot.
func orderEpisodeSources(entries []episodeSource) []SourceRef {
	refs := make([]SourceRef, len(entries))
	if len(entries) == 0 {
		return refs
	}

	ordered := make([]episodeSource, 0, len(entries))
	unset := make([]episodeSource, 0, len(entries))
	for _, entry := range entries {
		if entry.order == nil {
			unset = append(unset, entry)
			continue
		}
		ordered = append(ordered, entry)
	}
	sort.SliceStable(ordered, func(i, j int) bool { return *ordered[i].order < *ordered[j].order })

	taken := make([]bool, len(entries))
	// next is the first position that is still free, so a repeated order, or one
	// that asks for a position a previous entry already moved into, keeps the
	// sequence instead of overwriting its neighbour.
	next := 0
	for i, entry := range ordered {
		position := *entry.order - 1
		if position < next {
			position = next
		}
		// The entries that still follow need one position each, so an order past
		// the end collapses onto the tail rather than past it.
		if last := len(entries) - (len(ordered) - i); position > last {
			position = last
		}
		refs[position] = entry.ref
		taken[position] = true
		next = position + 1
	}
	slot := 0
	for _, entry := range unset {
		for taken[slot] {
			slot++
		}
		refs[slot] = entry.ref
		taken[slot] = true
	}
	return refs
}

// EpisodeSourceName resolves the display name of any owner of episodes, so the
// podcast feed works for a mirrored subscription as well as for a source.
func (c *Config) EpisodeSourceName(id string) (string, bool) {
	if source, ok := c.Source(id); ok {
		return source.Name, true
	}
	if subscription, ok := c.Subscription(id); ok {
		return subscription.Name, true
	}
	return "", false
}

func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config: %w", err)
	}

	var document yaml.Node
	if err := yaml.Unmarshal(data, &document); err != nil {
		return nil, fmt.Errorf("parse config: %w", err)
	}
	if err := resolveEnvironment(&document); err != nil {
		return nil, err
	}

	var cfg Config
	if err := document.Decode(&cfg); err != nil {
		return nil, fmt.Errorf("decode config: %w", err)
	}
	cfg.Admin = AdminConfig{TOTPSecret: os.Getenv("RSS_POD_ADMIN_TOTP_SECRET")}
	cfg.applyDefaults()
	if err := cfg.Validate(); err != nil {
		return nil, err
	}
	return &cfg, nil
}

// applyDefaults fills publishable fallbacks for optional service settings so an
// env:// reference can stay unset (for example JINA_BASE_URL) and still resolve
// to a working value. Required fields are still enforced by Validate.
func (c *Config) applyDefaults() {
	if strings.TrimSpace(c.Services.Content.Jina.BaseURL) == "" {
		c.Services.Content.Jina.BaseURL = DefaultJinaBaseURL
	}
	// The per-host media origins are normalised once while loading so that the
	// request path only performs a map lookup when it rebuilds an audio URL.
	if len(c.Runtime.Storage.PublicMediaHosts) > 0 {
		hosts := make(map[string]string, len(c.Runtime.Storage.PublicMediaHosts))
		for host, baseURL := range c.Runtime.Storage.PublicMediaHosts {
			hosts[normalizeHost(host)] = strings.TrimRight(strings.TrimSpace(baseURL), "/")
		}
		c.Runtime.Storage.PublicMediaHosts = hosts
	}
}

func resolveEnvironment(node *yaml.Node) error {
	if node.Kind == yaml.ScalarNode && node.Tag == "!!str" && strings.HasPrefix(node.Value, "env://") {
		name := strings.TrimPrefix(node.Value, "env://")
		if name == "" {
			return errors.New("invalid empty env reference")
		}
		// Unset variables resolve to an empty value instead of failing: every
		// env:// reference is optional, and required fields are still enforced
		// by Config.Validate once the placeholder has been cleared.
		value := os.Getenv(name)
		// An env reference is written as a YAML string, so the substituted text
		// must be re-resolved for typed fields: DATABASE_PORT=5432 has to satisfy
		// an int field instead of failing with "cannot unmarshal !!str".
		node.Value = value
		node.Style = 0
		if isNullScalar(value) {
			// yaml.v3 cannot decode !!null into string fields, so empty values
			// stay strings and still clear string and *string overrides.
			node.Tag = "!!str"
		} else {
			node.Tag = ""
		}
	}
	for _, child := range node.Content {
		if err := resolveEnvironment(child); err != nil {
			return err
		}
	}
	return nil
}

// isNullScalar reports whether yaml.v3 would resolve a plain scalar to !!null.
func isNullScalar(value string) bool {
	switch value {
	case "", "~", "null", "Null", "NULL":
		return true
	}
	return false
}

func (c *Config) Validate() error {
	if err := c.Admin.Validate(); err != nil {
		return err
	}
	if c.Version != CurrentVersion {
		return fmt.Errorf("unsupported config version %d (expected %d)", c.Version, CurrentVersion)
	}
	if c.Runtime.HTTP.Listen == "" {
		return errors.New("runtime.http.listen must not be empty")
	}
	managementListen := c.Runtime.HTTP.ManagementAddress()
	if err := validateLoopbackListen(managementListen); err != nil {
		return fmt.Errorf("runtime.http.management_listen: %w", err)
	}
	if managementListen == c.Runtime.HTTP.Listen {
		return errors.New("runtime.http.listen and management_listen must be different")
	}
	if c.Runtime.Database.Type != "postgres" || c.Runtime.Database.Host == "" || c.Runtime.Database.Port <= 0 || c.Runtime.Database.Name == "" || c.Runtime.Database.User == "" {
		return errors.New("runtime.database must contain a valid postgres connection")
	}
	if c.Runtime.Jobs.Type != "river" {
		return errors.New("runtime.jobs.type must be river")
	}
	if _, err := c.Runtime.Jobs.TimeoutDuration(); err != nil {
		return fmt.Errorf("runtime.jobs.timeout %w", err)
	}
	if _, err := c.Runtime.Jobs.FetchPollIntervalDuration(); err != nil {
		return fmt.Errorf("runtime.jobs.fetch_poll_interval %w", err)
	}
	for name, queue := range c.Runtime.Jobs.Queues {
		if queue.Concurrency < 1 {
			return fmt.Errorf("queue %q concurrency must be positive", name)
		}
	}
	if err := validateURL("runtime.storage.endpoint", c.Runtime.Storage.Endpoint); err != nil {
		return err
	}
	if err := validateURL("runtime.storage.public_media_base_url", c.Runtime.Storage.PublicMediaBaseURL); err != nil {
		return err
	}
	// A key is matched against a request host, so a scheme or a path in it would
	// silently never match; reject it instead of ignoring the entry. Both the key
	// and the value may be an env:// reference, and a variable the process never
	// received resolves to an empty string, so the empty cases name that reason
	// instead of only reporting an invalid URL.
	for host, baseURL := range c.Runtime.Storage.PublicMediaHosts {
		if host == "" {
			return errors.New("runtime.storage.public_media_hosts contains an empty host, which is what an unset env:// variable resolves to")
		}
		if strings.Contains(host, "/") {
			return errors.New("runtime.storage.public_media_hosts keys must be bare host names")
		}
		if strings.TrimSpace(baseURL) == "" {
			return fmt.Errorf("runtime.storage.public_media_hosts %s needs a media URL, because an unset env:// variable resolves to an empty string", host)
		}
		if err := validateURL("runtime.storage.public_media_hosts "+host, baseURL); err != nil {
			return err
		}
	}
	if c.Runtime.Storage.PrivateBucket == "" || c.Runtime.Storage.MediaBucket == "" {
		return errors.New("runtime.storage bucket names must not be empty")
	}
	if _, err := c.Runtime.Storage.TimeoutDuration(); err != nil {
		return fmt.Errorf("runtime.storage.timeout %w", err)
	}
	if _, err := time.LoadLocation(c.Defaults.Schedule.Timezone); err != nil {
		return fmt.Errorf("defaults.schedule.timezone: %w", err)
	}
	if err := c.validateTTSServices(); err != nil {
		return err
	}
	if len(c.DialogueProfiles) == 0 {
		return errors.New("dialogue_profiles must contain at least one profile")
	}
	for name, profile := range c.DialogueProfiles {
		if err := c.validateDialogueProfile(name, profile); err != nil {
			return err
		}
	}
	if err := c.validateGeneration("defaults.generation", c.Defaults.Generation); err != nil {
		return err
	}
	if err := c.validateTagTexts(); err != nil {
		return err
	}
	if err := c.validateTagRule("defaults.tag", c.Defaults.Tag); err != nil {
		return err
	}
	if c.Defaults.Limits.MaxFeedItemsPerRun < 1 || c.Defaults.Limits.MaxDocumentsPerItem < 1 {
		return errors.New("defaults limits must be positive")
	}
	if maxAge, err := time.ParseDuration(c.Defaults.Podcast.MaxAge); err != nil || maxAge <= 0 {
		return errors.New("defaults.podcast.max_age must be a positive duration")
	}
	if err := validateServiceReferences("defaults.llm", c.Defaults.LLM, c.Services.LLM); err != nil {
		return err
	}
	if err := validateOptionalProxy("services.content.jina.proxy", c.Services.Content.Jina.Proxy); err != nil {
		return err
	}
	if err := validateOptionalProxy("services.content.crawl4ai.proxy", c.Services.Content.Crawl4AI.Proxy); err != nil {
		return err
	}
	for name, service := range c.Services.LLM {
		if err := validateOptionalProxy("services.llm "+name+" proxy", service.Proxy); err != nil {
			return err
		}
	}

	seen := make(map[string]struct{}, len(c.Sources))
	cronParser := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow)
	for i := range c.Sources {
		source := &c.Sources[i]
		if source.ID == "" || source.Name == "" {
			return fmt.Errorf("sources[%d] id and name must not be empty", i)
		}
		if _, ok := seen[source.ID]; ok {
			return fmt.Errorf("duplicate source id %q", source.ID)
		}
		seen[source.ID] = struct{}{}
		if _, err := cronParser.Parse(source.Schedule.Cron); err != nil {
			return fmt.Errorf("source %s schedule.cron: %w", source.ID, err)
		}
		if err := validateURL("source "+source.ID+" feed.url", source.Feed.URL); err != nil {
			return err
		}
		content := c.Defaults.Content
		if source.Content != nil {
			content = *source.Content
		}
		if err := validateContent(source.ID, content, c.Services.Content); err != nil {
			return err
		}
		if _, err := source.Filter.Compile(); err != nil {
			return fmt.Errorf("source %s filter: %w", source.ID, err)
		}
		if err := c.validateTagRule("source "+source.ID+" tag", source.Tag); err != nil {
			return err
		}
		if len(source.LLM) > 0 {
			if err := validateServiceReferences("source "+source.ID+" llm", source.LLM, c.Services.LLM); err != nil {
				return err
			}
		}
		if err := c.validateGeneration("source "+source.ID+" generation", c.EffectiveGeneration(*source)); err != nil {
			return err
		}
		if source.Podcast != nil {
			if maxAge, err := time.ParseDuration(c.EffectivePodcast(*source).MaxAge); err != nil || maxAge <= 0 {
				return fmt.Errorf("source %s podcast.max_age must be a positive duration", source.ID)
			}
		}
		if err := validateFilterOrder("source "+source.ID, source.Order); err != nil {
			return err
		}
	}
	subSeen := make(map[string]struct{}, len(c.Subscriptions))
	for i := range c.Subscriptions {
		subscription := &c.Subscriptions[i]
		if subscription.ID == "" || subscription.Name == "" {
			return fmt.Errorf("subscriptions[%d] id and name must not be empty", i)
		}
		// Both lists name episode owners, and a subscription ID becomes the
		// source_id of the episodes it mirrors, so the two share one namespace.
		if _, ok := seen[subscription.ID]; ok {
			return fmt.Errorf("subscription id %q is already used by a source", subscription.ID)
		}
		if _, ok := subSeen[subscription.ID]; ok {
			return fmt.Errorf("duplicate subscription id %q", subscription.ID)
		}
		subSeen[subscription.ID] = struct{}{}
		if err := validateURL("subscription "+subscription.ID+" base_url", subscription.BaseURL); err != nil {
			return err
		}
		if _, err := cronParser.Parse(subscription.Schedule.Cron); err != nil {
			return fmt.Errorf("subscription %s schedule.cron: %w", subscription.ID, err)
		}
		if _, err := subscription.LookbackDuration(); err != nil {
			return fmt.Errorf("subscription %s lookback %w", subscription.ID, err)
		}
		if subscription.Limit < 0 || subscription.Limit > MaxSubscriptionLimit {
			return fmt.Errorf("subscription %s limit must be between 1 and %d, or zero for the default", subscription.ID, MaxSubscriptionLimit)
		}
		if err := validateFilterOrder("subscription "+subscription.ID, subscription.Order); err != nil {
			return err
		}
	}
	return nil
}

// validateFilterOrder checks one order of the player filter. Sources and
// subscriptions share that filter, so both lists are read the same way: an
// order has to start at 1, and repeated or skipped positions are resolved when
// the filter is built rather than rejected here.
func validateFilterOrder(owner string, order *int) error {
	if order == nil {
		return nil
	}
	if *order < 1 {
		return fmt.Errorf("%s order must be at least 1", owner)
	}
	return nil
}

func (c *Config) validateTTSServices() error {
	if len(c.Services.TTS) == 0 {
		return errors.New("services.tts must contain at least one service")
	}
	// A declared TTS service only needs credentials when a dialogue profile
	// actually speaks through it, so an unused azure block does not force an
	// API key onto deployments whose voices are all edge-based.
	referenced := c.referencedTTSServices()
	for name, service := range c.Services.TTS {
		switch name {
		case EdgeTTSServiceName:
		case AzureTTSServiceName:
			if referenced[name] {
				if strings.TrimSpace(service.APIKey) == "" {
					return errors.New("services.tts azure api_key must not be empty when a dialogue profile uses an azure voice")
				}
				if strings.TrimSpace(service.Endpoint) == "" && strings.TrimSpace(service.Region) == "" {
					return errors.New("services.tts azure region must not be empty when a dialogue profile uses an azure voice")
				}
			}
			if strings.TrimSpace(service.Endpoint) != "" {
				if err := validateURL("services.tts azure endpoint", service.Endpoint); err != nil {
					return err
				}
				endpoint, _ := url.Parse(service.Endpoint)
				if strings.TrimRight(endpoint.Path, "/") != "/cognitiveservices/v1" {
					return errors.New("services.tts azure endpoint must be the complete Speech synthesis endpoint ending in /cognitiveservices/v1")
				}
			}
			if !strings.HasSuffix(strings.ToLower(strings.TrimSpace(service.OutputFormat)), "-mp3") {
				return errors.New("services.tts azure output_format must be an MP3 format")
			}
		default:
			return fmt.Errorf("services.tts contains unsupported service %q; supported services are %q and %q", name, EdgeTTSServiceName, AzureTTSServiceName)
		}
		if err := validateOptionalProxy("services.tts "+name+" proxy", service.Proxy); err != nil {
			return err
		}
		for _, timeoutConfig := range []struct {
			field string
			value string
		}{
			{field: "connect_timeout", value: service.ConnectTimeout},
			{field: "receive_timeout", value: service.ReceiveTimeout},
		} {
			timeout, err := time.ParseDuration(timeoutConfig.value)
			if err != nil || timeout <= 0 {
				return fmt.Errorf("services.tts %s %s must be a positive duration", name, timeoutConfig.field)
			}
		}
	}
	return nil
}

// usedDialogueProfiles reports which dialogue profiles can actually run: the
// default profile plus the effective profile of every configured source.
// Declared profiles that no source selects are deliberately excluded, so they
// do not impose service requirements on a deployment that never uses them.
func (c *Config) usedDialogueProfiles() map[string]bool {
	used := make(map[string]bool)
	if name := c.Defaults.Generation.DialogueProfile; name != "" {
		used[name] = true
	}
	for _, source := range c.Sources {
		if name := c.EffectiveGeneration(source).DialogueProfile; name != "" {
			used[name] = true
		}
	}
	return used
}

// referencedTTSServices reports which TTS services are reachable from the
// dialogue profiles that can run. Voice syntax errors are ignored here because
// they are reported by validateDialogueProfile.
func (c *Config) referencedTTSServices() map[string]bool {
	referenced := make(map[string]bool)
	for name := range c.usedDialogueProfiles() {
		profile, ok := c.DialogueProfiles[name]
		if !ok {
			continue // reported by validateGeneration
		}
		for _, speaker := range profile.Speakers {
			voice, err := ParseSpeakerVoice(speaker.Voice)
			if err != nil {
				continue // reported by validateDialogueProfile
			}
			referenced[voice.Service] = true
		}
	}
	return referenced
}

// validateTagTexts checks the shared dictionary the tag rules read from. Every
// declared entry has to name at least one language and carry text for it, so a
// rule can never resolve to a badge without a word in it.
func (c *Config) validateTagTexts() error {
	for key, text := range c.TagTexts {
		if strings.TrimSpace(key) == "" {
			return errors.New("tag_texts contains an entry without a key")
		}
		if len(text) == 0 {
			return fmt.Errorf("tag_texts %s must contain at least one language", key)
		}
		hasText := false
		for language, value := range text {
			if strings.TrimSpace(language) == "" {
				return fmt.Errorf("tag_texts %s contains an entry without a language code", key)
			}
			if strings.TrimSpace(value) != "" {
				hasText = true
			}
		}
		if !hasText {
			return fmt.Errorf("tag_texts %s must contain text for one of its languages", key)
		}
	}
	return nil
}

// validateTagRule checks one tag block against the dictionary it references. A
// block without a type is how a source turns off a default badge, so it is
// accepted as long as it carries nothing else; a rule that does name a type
// has to be complete.
func (c *Config) validateTagRule(field string, rule *TagRuleConfig) error {
	if rule == nil {
		return nil
	}
	switch ruleType := strings.ToLower(strings.TrimSpace(rule.Type)); ruleType {
	case "":
		if rule.Value != 0 || strings.TrimSpace(rule.Text) != "" {
			return fmt.Errorf("%s.type must not be empty", field)
		}
		return nil
	case TagRuleTypeLength:
		if rule.Value < 1 {
			return fmt.Errorf("%s.value must be a positive character count", field)
		}
	default:
		return fmt.Errorf("%s has unsupported type %q; supported types are %q", field, rule.Type, TagRuleTypeLength)
	}
	key := strings.TrimSpace(rule.Text)
	if key == "" {
		return fmt.Errorf("%s.text must reference an entry of tag_texts", field)
	}
	if _, ok := c.TagTexts[key]; !ok {
		return fmt.Errorf("%s references unknown tag_texts entry %q", field, rule.Text)
	}
	return nil
}

func (c *Config) validateGeneration(field string, generation GenerationConfig) error {
	if strings.TrimSpace(generation.TargetDuration) == "" {
		return fmt.Errorf("%s.target_duration must not be empty", field)
	}
	if strings.TrimSpace(generation.PromptTemplate) == "" {
		return fmt.Errorf("%s.prompt_template must not be empty", field)
	}
	if strings.TrimSpace(generation.DialogueProfile) == "" {
		return fmt.Errorf("%s.dialogue_profile must not be empty", field)
	}
	if _, ok := c.DialogueProfiles[generation.DialogueProfile]; !ok {
		return fmt.Errorf("%s references unknown dialogue profile %q", field, generation.DialogueProfile)
	}
	return nil
}

func (c *Config) validateDialogueProfile(name string, profile DialogueProfile) error {
	field := "dialogue_profiles." + name
	if strings.TrimSpace(name) == "" {
		return errors.New("dialogue profile name must not be empty")
	}
	if profile.Rate == "" || profile.Volume == "" || profile.Pitch == "" {
		return fmt.Errorf("%s rate, volume and pitch must not be empty", field)
	}
	if len(profile.Speakers) < 1 {
		return fmt.Errorf("%s.speakers must contain at least one speaker", field)
	}
	seen := make(map[string]struct{}, len(profile.Speakers))
	// A profile no source selects cannot run, so its voices only need to be
	// syntactically valid; requiring a declared service would force unused
	// services (for example azure) to stay configured forever.
	used := c.usedDialogueProfiles()[name]
	var voices []SpeakerVoice
	for i, speaker := range profile.Speakers {
		if strings.TrimSpace(speaker.ID) == "" || strings.TrimSpace(speaker.Name) == "" ||
			strings.TrimSpace(speaker.Role) == "" || strings.TrimSpace(speaker.Voice) == "" {
			return fmt.Errorf("%s.speakers[%d] id, name, role and voice must not be empty", field, i)
		}
		if _, ok := seen[speaker.ID]; ok {
			return fmt.Errorf("%s contains duplicate speaker id %q", field, speaker.ID)
		}
		voice, err := ParseSpeakerVoice(speaker.Voice)
		if err != nil {
			return fmt.Errorf("%s.speakers[%d].voice %w", field, i, err)
		}
		if _, ok := c.Services.TTS[voice.Service]; !ok && used {
			return fmt.Errorf("%s.speakers[%d].voice references unknown TTS service %q", field, i, voice.Service)
		}
		voices = append(voices, voice)
		seen[speaker.ID] = struct{}{}
	}
	if err := validateMultiTalkerProfile(voices); err != nil {
		return fmt.Errorf("%s: %w", field, err)
	}
	return nil
}

func validateMultiTalkerProfile(voices []SpeakerVoice) error {
	var model string
	talkers := make(map[string]struct{})
	multiTalkerCount := 0
	for _, voice := range voices {
		if !voice.IsMultiTalker() {
			continue
		}
		multiTalkerCount++
		if model == "" {
			model = voice.Voice
		} else if !strings.EqualFold(model, voice.Voice) {
			return errors.New("all speakers in a MultiTalker profile must use the same voice model")
		}
		talker := strings.ToLower(voice.Talker)
		if _, exists := talkers[talker]; exists {
			return fmt.Errorf("MultiTalker talker %q is assigned more than once", voice.Talker)
		}
		talkers[talker] = struct{}{}
	}
	if multiTalkerCount == 0 {
		return nil
	}
	if multiTalkerCount != len(voices) {
		return errors.New("MultiTalker and single-talker voices cannot be mixed in one profile")
	}
	if multiTalkerCount < 2 {
		return errors.New("a MultiTalker profile requires at least two speakers")
	}
	allowed := multiTalkerNames(model)
	if len(allowed) == 0 {
		return nil
	}
	allowedSet := make(map[string]struct{}, len(allowed))
	for _, talker := range allowed {
		allowedSet[strings.ToLower(talker)] = struct{}{}
	}
	for talker := range talkers {
		if _, ok := allowedSet[talker]; !ok {
			return fmt.Errorf("talker %q is not part of MultiTalker voice %q", talker, model)
		}
	}
	return nil
}

func validateOptionalProxy(field, value string) error {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	u, err := url.Parse(value)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return fmt.Errorf("%s must be empty or an absolute URL", field)
	}
	return nil
}

func validateLoopbackListen(value string) error {
	host, port, err := net.SplitHostPort(value)
	if err != nil {
		return fmt.Errorf("must be a host:port address: %w", err)
	}
	portNumber, err := strconv.Atoi(port)
	if err != nil || portNumber < 1 || portNumber > 65535 {
		return errors.New("port must be between 1 and 65535")
	}
	if strings.EqualFold(host, "localhost") {
		return nil
	}
	ip := net.ParseIP(host)
	if ip == nil || !ip.IsLoopback() {
		return errors.New("must bind to a loopback address such as 127.0.0.1 or ::1")
	}
	return nil
}

func validateContent(sourceID string, content ContentConfig, services ContentServices) error {
	switch content.Type {
	case "rss-item":
		if strings.TrimSpace(content.Transform.Type) != "" {
			return fmt.Errorf("source %s content.transform is supported only by crawl4ai", sourceID)
		}
		return nil
	case "jina":
		service := content.Jina.EffectiveService(services.Jina)
		field := "source " + sourceID + " content.jina"
		baseURL := strings.TrimSpace(service.BaseURL)
		if baseURL == "" {
			return fmt.Errorf("%s.base_url must not be empty", field)
		}
		if err := validateURL(field+".base_url", baseURL); err != nil {
			return err
		}
		if _, err := service.TimeoutDuration(); err != nil {
			return fmt.Errorf("%s.timeout %w", field, err)
		}
		if err := validateOptionalProxy(field+".proxy", service.Proxy); err != nil {
			return err
		}
		if content.URL.From != "item.link" {
			return fmt.Errorf("source %s jina currently supports only url.from=item.link", sourceID)
		}
		if strings.TrimSpace(content.Transform.Type) != "" {
			return fmt.Errorf("source %s content.transform is supported only by crawl4ai", sourceID)
		}
	case "crawl4ai":
		service := content.Crawl4AI.EffectiveService(services.Crawl4AI)
		field := "source " + sourceID + " content.crawl4ai"
		baseURL := strings.TrimSpace(service.BaseURL)
		if baseURL == "" {
			return fmt.Errorf("%s.base_url must not be empty", field)
		}
		if err := validateURL(field+".base_url", baseURL); err != nil {
			return err
		}
		if _, err := service.TimeoutDuration(); err != nil {
			return fmt.Errorf("%s.timeout %w", field, err)
		}
		mode := service.EffectiveMode()
		if mode != "md" && mode != "crawl" {
			return fmt.Errorf("source %s content.crawl4ai.mode must be md or crawl", sourceID)
		}
		if filter := service.EffectiveFilter(); filter != "raw" && filter != "fit" {
			return fmt.Errorf("source %s content.crawl4ai.filter must be raw or fit", sourceID)
		}
		if err := validateOptionalProxy(field+".proxy", service.Proxy); err != nil {
			return err
		}
		if content.URL.From != "item.link" {
			return fmt.Errorf("source %s crawl4ai currently supports only url.from=item.link", sourceID)
		}
		transform := strings.ToLower(strings.TrimSpace(content.Transform.Type))
		if transform != "" && transform != "v2ex-topic" {
			return fmt.Errorf("source %s has unsupported content.transform.type %q", sourceID, content.Transform.Type)
		}
		if mode == "crawl" && transform == "" {
			return fmt.Errorf("source %s content.crawl4ai.mode=crawl requires content.transform.type", sourceID)
		}
		if transform == "v2ex-topic" && mode != "crawl" {
			return fmt.Errorf("source %s content.transform.type v2ex-topic requires content.crawl4ai.mode=crawl", sourceID)
		}
	case "derived-rss":
		if strings.TrimSpace(content.Transform.Type) != "" {
			return fmt.Errorf("source %s content.transform is supported only by crawl4ai", sourceID)
		}
		if content.URL.Regex == "" || content.URL.Template == "" {
			return fmt.Errorf("source %s derived-rss requires url.regex and url.template", sourceID)
		}
		if _, err := regexp.Compile(content.URL.Regex); err != nil {
			return fmt.Errorf("source %s content.url.regex: %w", sourceID, err)
		}
		if _, err := template.New("url").Parse(content.URL.Template); err != nil {
			return fmt.Errorf("source %s content.url.template: %w", sourceID, err)
		}
	default:
		return fmt.Errorf("source %s has unsupported content.type %q", sourceID, content.Type)
	}
	if content.URL.From == "" {
		return fmt.Errorf("source %s content.url.from must not be empty", sourceID)
	}
	return nil
}

func validateServiceReferences[T any](field string, names []string, services map[string]T) error {
	if len(names) == 0 {
		return fmt.Errorf("%s must contain at least one service", field)
	}
	for _, name := range names {
		if _, ok := services[name]; !ok {
			return fmt.Errorf("%s references unknown service %q", field, name)
		}
	}
	return nil
}

func validateURL(field, value string) error {
	u, err := url.Parse(value)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return fmt.Errorf("%s must be an absolute URL", field)
	}
	return nil
}

func (c *Config) Source(id string) (SourceConfig, bool) {
	for _, source := range c.Sources {
		if source.ID == id {
			return source, true
		}
	}
	return SourceConfig{}, false
}

func (c *Config) Subscription(id string) (SubscriptionConfig, bool) {
	for _, subscription := range c.Subscriptions {
		if subscription.ID == id {
			return subscription, true
		}
	}
	return SubscriptionConfig{}, false
}

// EnabledSubscriptions lists the subscriptions that pull from a remote
// deployment.
func (c *Config) EnabledSubscriptions() []SubscriptionConfig {
	subscriptions := make([]SubscriptionConfig, 0, len(c.Subscriptions))
	for _, subscription := range c.Subscriptions {
		if subscription.Enabled {
			subscriptions = append(subscriptions, subscription)
		}
	}
	return subscriptions
}

// PollOnlySourceIDs lists the enabled sources whose episodes wait for a
// listener to start generation. It follows the playable source list, so a
// disabled source never exposes its unfinished episodes.
func (c *Config) PollOnlySourceIDs() []string {
	ids := make([]string, 0, len(c.Sources))
	for _, source := range c.Sources {
		if source.Enabled && source.PollOnly {
			ids = append(ids, source.ID)
		}
	}
	return ids
}

func (c *Config) EffectiveContent(source SourceConfig) ContentConfig {
	if source.Content != nil {
		return *source.Content
	}
	return c.Defaults.Content
}

func (c *Config) EffectiveGeneration(source SourceConfig) GenerationConfig {
	result := c.Defaults.Generation
	if source.Generation == nil {
		return result
	}
	if source.Generation.TargetDuration != "" {
		result.TargetDuration = source.Generation.TargetDuration
	}
	if source.Generation.PromptTemplate != "" {
		result.PromptTemplate = source.Generation.PromptTemplate
	}
	if source.Generation.DialogueProfile != "" {
		result.DialogueProfile = source.Generation.DialogueProfile
	}
	return result
}

func (c *Config) EffectiveLLM(source SourceConfig) []string {
	if len(source.LLM) > 0 {
		return source.LLM
	}
	return c.Defaults.LLM
}

func (c *Config) EffectiveLimits(source SourceConfig) LimitsConfig {
	result := c.Defaults.Limits
	if source.Limits == nil {
		return result
	}
	if source.Limits.MaxFeedItemsPerRun > 0 {
		result.MaxFeedItemsPerRun = source.Limits.MaxFeedItemsPerRun
	}
	if source.Limits.MaxDocumentsPerItem > 0 {
		result.MaxDocumentsPerItem = source.Limits.MaxDocumentsPerItem
	}
	return result
}

func (c *Config) EffectivePodcast(source SourceConfig) PodcastConfig {
	result := c.Defaults.Podcast
	if source.Podcast != nil && source.Podcast.MaxAge != "" {
		result.MaxAge = source.Podcast.MaxAge
	}
	return result
}

// EffectiveTag returns the badge rule a source shows. A source that declares
// its own tag block replaces the default one as a whole, so an empty block
// turns the badge off instead of inheriting it; nil means the deployment has
// no badge at all.
func (c *Config) EffectiveTag(source SourceConfig) *TagRuleConfig {
	if source.Tag != nil {
		return source.Tag
	}
	return c.Defaults.Tag
}

// TagForArticle reports the badge text an episode owner shows for an article of
// the given character count, keyed by language, or nil when no rule applies. A
// source with its own tag block overrides the default, and a subscription,
// which cannot declare one, follows the default. Adding a rule type means
// adding a case to the switch in evaluateTag.
// TagForArticle 返回某个节目归属方对给定字符数的文章应显示的标识文案（按语言给出），
// 没有规则命中时返回 nil。来源自己的 tag 覆盖默认值，订阅无法声明标识、始终跟随默认
// 规则；新增规则类型就是在 evaluateTag 里加一个分支。
func (c *Config) TagForArticle(sourceID string, articleLength int) TagText {
	rule := c.Defaults.Tag
	if source, ok := c.Source(sourceID); ok {
		rule = c.EffectiveTag(source)
	}
	return c.evaluateTag(rule, articleLength)
}

// evaluateTag applies one rule to one article. A nil rule, and a rule whose
// type is empty, tag nothing, which keeps an unconfigured deployment on the
// behaviour it had before this setting existed.
func (c *Config) evaluateTag(rule *TagRuleConfig, articleLength int) TagText {
	if rule == nil {
		return nil
	}
	switch strings.ToLower(strings.TrimSpace(rule.Type)) {
	case TagRuleTypeLength:
		if articleLength >= rule.Value {
			return c.TagTexts[strings.TrimSpace(rule.Text)]
		}
	}
	return nil
}
