const SPEED_KEY = "rss-pod.player-speed";
const RESUME_KEY = "rss-pod.resume-state";
const DISMISSED_NOTICE_KEY = "rss-pod.dismissed-notice";
const THEME_KEY = "rss-pod.theme";
const THEME_MODES = ["system", "light", "dark"];
const DISPLAY_KEY = "rss-pod.display-mode";
const DISPLAY_MODES = ["date", "category"];
const DEFAULT_CATEGORY_KEY = "rss-pod.default-category";
const PLAYER_DRAWER_KEY = "rss-pod.player-drawer";
const PLAYER_DRAWER_MODES = ["expanded", "collapsed"];
const LISTEN_LATER_KEY = "rss-pod.listen-later";
const LISTENED_KEY = "rss-pod.listened";
const LATER_AUTO_REMOVE_KEY = "rss-pod.personal-later-auto-remove";
const LATER_AUTO_DOWNLOAD_KEY = "rss-pod.personal-later-auto-download";
const DIM_LISTENED_KEY = "rss-pod.personal-dim-listened";
const PRELOAD_NEXT_KEY = "rss-pod.personal-preload-next";
const AUDIO_CACHE_KEY = "rss-pod.audio-cache";
const AUDIO_CACHE_NAME = "rss-pod-audio-v1";
const THEME_COLORS = { light: "#f4f9ff", dark: "#0b1420" };
const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)");
const smallViewport = window.matchMedia("(max-width: 700px)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const DEMO_AUDIO = "/demo.mp3";
const MEDIA_ARTWORK = [
  { src: "/icons/favicon.png", sizes: "64x64", type: "image/png" },
  { src: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
];
const DEFAULT_SEEK_OFFSET = 10;
// The list keeps a slot of its own for the episodes saved in this browser.
const LATER_SLOT = "later";
// A long press has to be deliberate, and a finger that moves is scrolling or
// paging rather than asking for the row actions.
const LONG_PRESS_MS = 500;
const LONG_PRESS_SLOP = 8;
const LONG_PRESS_CLICK_GUARD_MS = 700;
const LISTENED_LIMIT = 500;
const LISTEN_LATER_LIMIT = 200;
// Only the episode that is playing and the one after it are worth holding
// locally, so a handful of entries covers a queue and its lookahead.
const AUDIO_CACHE_LIMIT = 5;
// The marquee crawls rather than scrolls: about twenty pixels a second, which
// is roughly one character per second, and a whole cycle stays under a minute.
const MARQUEE_PIXELS_PER_SECOND = 20;
const MARQUEE_MIN_SECONDS = 10;
const MARQUEE_MAX_SECONDS = 60;
// The crawl takes a third of the cycle in either direction.
const MARQUEE_TRAVEL_SHARE = 0.34;

// Material Symbols Rounded, the same set as the icons under web/icons.
const ICON_PLAY =
  "M320-258v-450q0-14 9-22t21-8q4 0 8 1t8 3l354 226q7 5 10.5 11t3.5 14q0 8-3.5 14T720-458L366-232q-4 2-8 3t-8 1q-12 0-21-8t-9-22Z";
const ICON_PAUSE =
  "M615-200q-24.75 0-42.37-17.63Q555-235.25 555-260v-440q0-24.75 17.63-42.38Q590.25-760 615-760h55q24.75 0 42.38 17.62Q730-724.75 730-700v440q0 24.75-17.62 42.37Q694.75-200 670-200h-55Zm-325 0q-24.75 0-42.37-17.63Q230-235.25 230-260v-440q0-24.75 17.63-42.38Q265.25-760 290-760h55q24.75 0 42.38 17.62Q405-724.75 405-700v440q0 24.75-17.62 42.37Q369.75-200 345-200h-55Z";
const ICON_DOWNLOAD =
  "M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z";
const ICON_RETRY =
  "M480-160q-133 0-226.5-93.5T160-480q0-133 93.5-226.5T480-800q85 0 149 34.5T740-671v-99q0-13 8.5-21.5T770-800q13 0 21.5 8.5T800-770v194q0 13-8.5 21.5T770-546H576q-13 0-21.5-8.5T546-576q0-13 8.5-21.5T576-606h138q-38-60-97-97t-137-37q-109 0-184.5 75.5T220-480q0 109 75.5 184.5T480-220q75 0 140-39.5T717-366q5-11 16.5-16.5t22.5-.5q12 5 16 16.5t-1 23.5q-39 84-117.5 133.5T480-160Z";
const ICON_BOOKMARK =
  "m480-240-196 84q-30 13-57-4.76-27-17.75-27-50.24v-574q0-24 18-42t42-18h440q24 0 42 18t18 42v574q0 32.49-27 50.24Q706-143 676-156l-196-84Zm0-64 220 93v-574H260v574l220-93Zm0-481H260h440-220Z";
const ICON_CHECK = "M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z";
const ICON_CHEVRON_DOWN =
  "M469-358q-5-2-10-7L261-563q-9-9-8.5-21.5T262-606q9-9 21.5-9t21.5 9l175 176 176-176q9-9 21-8.5t21 9.5q9 9 9 21.5t-9 21.5L501-365q-5 5-10 7t-11 2q-6 0-11-2Z";

const isAdminPage = /^\/admin(?:\/|$)/.test(window.location.pathname);
let adminCSRF = "";
let adminSessionTimer;
let adminBusy = false;
const localeKey = (/^(?:\/admin)?\/zh-cn(?:\/|$)/i.test(window.location.pathname) || window.location.pathname === "/admin") ? "zh-CN" : "en";
const copy = {
  en: {
    lang: "en",
    documentTitle: "Commute Podcasts",
    languageLabel: "Language",
    githubLabel: "View project on GitHub",
    settingsLabel: "Settings",
    settingsTitle: "Settings",
    themeLabel: "Color theme",
    themeModes: { system: "follows device", light: "light", dark: "dark" },
    themeSettingLabel: "Color theme",
    displaySettingLabel: "Layout",
    displayModes: { date: "By date", category: "By feed" },
    categorySettingLabel: "Default category",
    categoryTabsLabel: "Choose a feed",
    dateTabsLabel: "Choose a date",
    carouselRole: "carousel",
    slideRole: "slide",
    noticeLabel: "Notice",
    dismissNotice: "Dismiss notice",
    sourceSectionLabel: "Filter by source",
    sourceFilterLabel: "Feeds",
    episodeRegionLabel: "Podcast episodes",
    playerLabel: "Player",
    play: "Play",
    pause: "Pause",
    previous: "Previous episode",
    next: "Next episode",
    nowPlaying: "PLAYING",
    chooseEpisode: "Choose an episode",
    collapsePlayer: "Fold the player away",
    expandPlayer: "Show the full player",
    progressLabel: "Playback progress",
    speedLabel: "Speed",
    playbackSpeed: "Playback speed",
    loading: "Loading podcasts…",
    loadError: "Podcasts are unavailable right now. Please try again later.",
    empty: "No matching podcasts for this day",
    emptyCategory: "No episodes for this feed in the last three days",
    allSources: "All",
    untitled: "Untitled episode",
    durationUnavailable: "Duration unavailable",
    mediaAlbum: "Commute Podcasts",
    relativeDates: ["Today", "Yesterday", "2 days ago"],
    dateLocale: "en-US",
    greetings: ["Good morning", "Good afternoon", "Good afternoon", "Good evening"],
    greeting: (value) => `${value}. What's worth a listen?`,
    episodeCount: (count) => `${count} ${count === 1 ? "episode" : "episodes"}`,
    playEpisode: (title) => `Play: ${title}`,
    pauseEpisode: (title) => `Pause: ${title}`,
    durationLabel: (duration) => `Duration ${duration}`,
    downloadEpisode: (title) => `Download: ${title}`,
    downloadingEpisode: (title) => `Downloading: ${title}`,
    retryEpisodeDownload: (title) => `Download failed, retry: ${title}`,
    generatingStages: {
      content: "reading the page",
      script: "writing the script",
      tts: "converting to speech",
      compose: "composing and uploading",
      fallback: "working",
    },
    generatingReady: "Download finished. Ready to play.",
    generatingUnavailable: "The download could not be started. Please try again later.",
    generatingAlreadyRunning: "This episode is already downloading.",
    listenLater: "Listen later",
    listenLaterDropdown: "Choose all episodes or Listen later",
    emptyLater: "Nothing saved for later yet",
    personalSettingLabel: "Personalization",
    laterGroupLabel: "Listen later",
    otherGroupLabel: "Other",
    laterAutoRemoveLabel: "Remove played episodes from Listen later",
    laterDownloadLabel: "Move a manual download into Listen later",
    dimListenedLabel: "Dim listened episodes",
    preloadNextLabel: "Load the next episode locally",
    clearCache: "Clear cache",
    cacheCleared: "Cache cleared",
    cacheEmpty: "Nothing cached yet",
    cacheSummary: (size, count) => `Cached ${size} (${count} ${count === 1 ? "episode" : "episodes"})`,
    cacheSummaryUnknown: (count) => `Cached ${count} ${count === 1 ? "episode" : "episodes"} (size unavailable)`,
    addListenLater: "Save for later",
    removeListenLater: "Remove from Listen later",
    laterAdded: "Saved for later",
    laterUnavailable: "This one cannot be started here",
    menuDownload: "Download",
    menuRetry: "Download again",
    openEpisodeActions: (title) => `Actions for ${title}`,
  },
  "zh-CN": {
    lang: "zh-CN",
    documentTitle: "通勤播客",
    languageLabel: "语言",
    githubLabel: "在 GitHub 上查看项目",
    settingsLabel: "设置",
    settingsTitle: "设置管理",
    themeLabel: "配色主题",
    themeModes: { system: "跟随系统", light: "日间模式", dark: "暗黑模式" },
    themeSettingLabel: "主题设置",
    displaySettingLabel: "显示设置",
    displayModes: { date: "按日期", category: "按分类" },
    categorySettingLabel: "默认分类",
    categoryTabsLabel: "选择分类",
    dateTabsLabel: "选择日期",
    carouselRole: "轮播",
    slideRole: "幻灯片",
    noticeLabel: "通知",
    dismissNotice: "关闭通知",
    sourceSectionLabel: "按来源筛选",
    sourceFilterLabel: "内容来源",
    episodeRegionLabel: "播客列表",
    playerLabel: "播放器",
    play: "播放",
    pause: "暂停",
    previous: "上一条",
    next: "下一条",
    nowPlaying: "正在播放",
    chooseEpisode: "选择一条播客开始播放",
    collapsePlayer: "收起播放器",
    expandPlayer: "展开播放器",
    progressLabel: "播放进度",
    speedLabel: "播放倍速",
    playbackSpeed: "播放速度",
    loading: "正在载入播客…",
    loadError: "暂时无法载入播客，请稍后重试",
    empty: "这一天还没有符合条件的播客",
    emptyCategory: "该分类最近三天还没有内容",
    allSources: "全部",
    untitled: "未命名播客",
    durationUnavailable: "暂无播放时长",
    mediaAlbum: "通勤播客",
    relativeDates: ["今天", "昨天", "前天"],
    dateLocale: "zh-CN",
    greetings: ["早上好", "中午好", "下午好", "晚上好"],
    greeting: (value) => `${value}，今天听什么？`,
    episodeCount: (count) => `${count} 条`,
    playEpisode: (title) => `播放：${title}`,
    pauseEpisode: (title) => `暂停：${title}`,
    durationLabel: (duration) => `播放时长 ${duration}`,
    downloadEpisode: (title) => `下载：${title}`,
    downloadingEpisode: (title) => `正在下载：${title}`,
    retryEpisodeDownload: (title) => `下载失败，重新下载：${title}`,
    generatingStages: {
      content: "正在读取页面",
      script: "正在生成脚本",
      tts: "正在转为语音",
      compose: "正在合成并上传",
      fallback: "正在处理",
    },
    generatingReady: "下载完成，可以播放了",
    generatingUnavailable: "无法开始下载，请稍后重试",
    generatingAlreadyRunning: "该条目正在下载中",
    listenLater: "稍后在听",
    listenLaterDropdown: "在全部与稍后在听之间切换",
    emptyLater: "还没有稍后在听的内容",
    personalSettingLabel: "个性化设置",
    laterGroupLabel: "稍后在听",
    otherGroupLabel: "其他",
    laterAutoRemoveLabel: "稍后在听自动移除听过的博客",
    laterDownloadLabel: "手动下载自动移动至稍后在听",
    dimListenedLabel: "已听过的标题置灰",
    preloadNextLabel: "自动本地加载下一个博客",
    clearCache: "清除缓存",
    cacheCleared: "已清除缓存",
    cacheEmpty: "还没有本地缓存",
    cacheSummary: (size, count) => `已缓存 ${size}（${count} 条）`,
    cacheSummaryUnknown: (count) => `已缓存 ${count} 条（大小不可用）`,
    addListenLater: "稍后在听",
    removeListenLater: "取消稍后在听",
    laterAdded: "已加入稍后在听",
    laterUnavailable: "该条目无法在这里开始下载",
    menuDownload: "下载",
    menuRetry: "重新下载",
    openEpisodeActions: (title) => `${title} 的操作`,
  },
}[localeKey];

const adminCopy = localeKey === "zh-CN" ? {
  login: "管理员登录", code: "验证器动态码", hint: "输入验证器中的 6 位动态码，会话有效期 30 分钟。",
  logout: "退出管理", hide: "隐藏", restore: "恢复显示", hidden: "已隐藏",
  loginError: "动态码无效或已使用，请等待下一组动态码。", rateLimit: "尝试过于频繁，请等待一分钟。",
  expired: "会话已过期，请重新登录。", error: "操作失败，请稍后重试。",
} : {
  login: "Admin login", code: "Authenticator code", hint: "Enter your 6-digit code. Sessions last 30 minutes.",
  logout: "Sign out", hide: "Hide", restore: "Restore", hidden: "Hidden",
  loginError: "Invalid or already used code. Wait for the next code.", rateLimit: "Too many attempts. Wait one minute.",
  expired: "Session expired. Please sign in again.", error: "Operation failed. Please try again.",
};

const demoContent = {
  en: {
    sources: ["Daily Brief", "Tech Radar", "Deep Reads"],
    titles: [
      "Why important thoughts surface at bedtime",
      "Open-source projects worth watching — Issue 182",
      "What would you do with more time?",
      "Can waking up early change your life?",
      "How engineers choose the right technology",
      "Which jobs will AI replace—and create?",
      "Five ideas worth revisiting",
      "How a small team maintains a large project",
    ],
  },
  "zh-CN": {
    sources: ["知乎日报", "V2EX 热门", "知乎话题"],
    titles: [
      "为什么我们总在睡前想起重要的事？关于记忆与焦虑的科学解释",
      "本周值得关注的开源项目 第 182 期",
      "如果给你一笔时间，你会用来做什么？来自 238 个真实回答的启发",
      "早起真的能改变人生吗？一项长达 5 年的追踪研究",
      "程序员如何优雅地进行技术选型？来自一线团队的实践经验",
      "AI 会取代哪些工作，又会创造哪些新机会？",
      "昨天最值得认真读完的五个回答",
      "一个小团队如何维护大型开源项目",
    ],
  },
}[localeKey];

const elements = {
  greeting: document.querySelector("#greeting"),
  languageSwitcher: document.querySelector("#language-switcher"),
  languageLinks: [...document.querySelectorAll("[data-locale]")],
  githubLink: document.querySelector("#github-link"),
  settingsToggle: document.querySelector("#settings-toggle"),
  settingsPanel: document.querySelector("#settings-panel"),
  settingsTitle: document.querySelector("#settings-title"),
  settingsThemeSection: document.querySelector("#settings-theme-section"),
  settingsThemeLabel: document.querySelector("#settings-theme-label"),
  settingsDisplayLabel: document.querySelector("#settings-display-label"),
  settingsCategoryLabel: document.querySelector("#settings-category-label"),
  settingsCategorySelect: document.querySelector("#settings-default-category"),
  settingsPersonalLabel: document.querySelector("#settings-personal-label"),
  laterGroupLabel: document.querySelector("#settings-later-group-label"),
  otherGroupLabel: document.querySelector("#settings-other-group-label"),
  laterAutoLabel: document.querySelector("#settings-later-auto-label"),
  laterAutoToggle: document.querySelector("#settings-later-auto"),
  laterDownloadLabel: document.querySelector("#settings-later-download-label"),
  laterDownloadToggle: document.querySelector("#settings-later-download"),
  dimListenedLabel: document.querySelector("#settings-dim-label"),
  dimListenedToggle: document.querySelector("#settings-dim"),
  preloadNextLabel: document.querySelector("#settings-preload-label"),
  preloadNextToggle: document.querySelector("#settings-preload"),
  cacheSummary: document.querySelector("#settings-cache-summary"),
  cacheClear: document.querySelector("#settings-cache-clear"),
  popupMenu: document.querySelector("#popup-menu"),
  settingsLanguageLabel: document.querySelector("#settings-language-label"),
  settingsGithubLink: document.querySelector("#settings-github-link"),
  themeModeButtons: [...document.querySelectorAll("[data-theme-mode]")],
  displayModeButtons: [...document.querySelectorAll("[data-display-mode]")],
  themeToggle: document.querySelector("#theme-toggle"),
  dateTabs: document.querySelector("#date-tabs"),
  noticeRegion: document.querySelector("#notice-region"),
  noticeContent: document.querySelector("#notice-content"),
  noticeDismiss: document.querySelector("#notice-dismiss"),
  sourceFilterSection: document.querySelector("#source-filter-section"),
  sourceFilterLabel: document.querySelector("#source-filter-label"),
  sourceFilters: document.querySelector("#source-filters"),
  episodeRegion: document.querySelector("#episode-region"),
  episodeSlider: document.querySelector("#episode-slider"),
  episodeWrapper: document.querySelector("#episode-slider .swiper-wrapper"),
  statusMessage: document.querySelector("#status-message"),
  rowTemplate: document.querySelector("#episode-row-template"),
  audio: document.querySelector("#audio"),
  playToggle: document.querySelector("#play-toggle"),
  playToggleIcon: document.querySelector("#play-toggle-icon"),
  previousButton: document.querySelector("#previous-button"),
  nextButton: document.querySelector("#next-button"),
  nowPlayingTitle: document.querySelector("#now-playing-title"),
  nowPlayingSource: document.querySelector("#now-playing-source"),
  progress: document.querySelector("#progress"),
  elapsedTime: document.querySelector("#elapsed-time"),
  remainingTime: document.querySelector("#remaining-time"),
  playerDock: document.querySelector("#player-dock"),
  playerDrawerToggle: document.querySelector("#player-drawer-toggle"),
  nowPlayingLabel: document.querySelector("#now-playing-label"),
  speedLabel: document.querySelector("#speed-label"),
  speedLegend: document.querySelector("#speed-legend"),
  speedButtons: [...document.querySelectorAll("[data-speed]")],
  toast: document.querySelector("#toast"),
};

// The theme starts out following the device; the switch cycles through
// system, light and dark, and a stored value keeps an explicit choice.
let themePreference = readThemePreference();
// The list groups by day unless the listener picked categories in the settings
// panel. Both choices live in this browser for the current site.
let displayMode = readDisplayPreference();
// The feed the list opens on. It is applied to the first payload of the page,
// so a later poll never pulls a listener back after they swiped elsewhere.
let defaultCategory = readDefaultCategoryPreference();
let defaultCategoryApplied = false;
// The player dock folds into a drawer so the list can take the screen back.
let playerDrawer = readPlayerDrawerPreference();
// The episodes saved for later and the ones already played through live in this
// browser, like the preferences above, so they survive a reload on their own.
let listenLater = readListenLaterRecords();
let listened = readListenedRecords();
let laterAutoRemove = readFlag(LATER_AUTO_REMOVE_KEY);
let laterAutoDownload = readFlag(LATER_AUTO_DOWNLOAD_KEY);
let dimListened = readFlag(DIM_LISTENED_KEY);
let preloadNext = readFlag(PRELOAD_NEXT_KEY);
// The first tab of the feed row is shared: it lists every feed until the
// caret switches it to the episodes saved on this device. The slot keeps its
// identity, so switching views never rebuilds the pages behind the swipe.
let primaryView = "all";
// The local audio cache is a manifest plus the object URLs that point at the
// blobs it holds; the object URLs only make sense in this page.
let audioCacheIndex = readAudioCacheIndex();
const cachedBlobURLs = new Map();
const preloadElements = new Map();
const preloadsInFlight = new Set();
// The menu, a long press, and the marquee each remember one thing at a time.
let popupMenuAnchor = null;
let popupMenuIgnoreClick = false;
let popupMenuOpenedAt = 0;
let suppressClickUntil = 0;
let nowPlayingText = copy.chooseEpisode;

applyLocale();
initTheme();
initSettings();
initPlayerDrawer();

const dateOptions = createDateOptions();
const state = {
  sources: [],
  episodes: [],
  dateOptions,
  activeDate: dateOptions[0].key,
  activeSource: "all",
  currentEpisodeID: null,
  speed: isDemoMode() ? 1 : readStoredNumber(SPEED_KEY, 1),
  pendingResume: isDemoMode() ? null : readResumeState(),
  restoringResume: false,
  // Downloads this page asked for and whose response has not arrived yet.
  startingEpisodes: new Set(),
};

// Swiper owns the sideways paging of the episode list; the pages themselves are
// rendered from the header controls.
const slider = initEpisodeSlider();

renderCategorySetting();
updateGreeting();
window.setInterval(updateGreeting, 60_000);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    window.clearTimeout(refreshTimer);
    refreshTimer = 0;
    return;
  }
  updateGreeting();
  // Coming back to the page is a good moment to catch up with a download.
  if (state.episodes.some((episode) => episode.state === "processing")) refreshEpisodes();
});

// The poll timer is declared before the first load: a load that has no request
// to await reaches the polling code in the same tick.
const REFRESH_INTERVAL = 5_000;
let refreshTimer = 0;

// A narrower dock has less room for the title, so both the viewport and the
// reduced motion preference decide whether it crawls.
window.addEventListener("resize", () => applyTitleMarquee());
smallViewport.addEventListener("change", () => applyTitleMarquee());
reducedMotion.addEventListener("change", () => applyTitleMarquee());

bindPlayerEvents();
bindNoticeEvents();
initPopupMenu();
renderSpeed();
loadNotice();
loadPlayerConfig();
if (isAdminPage) setupAdmin();
else loadPlayer();

async function loadNotice() {
  try {
    const dismissedNotice = normalizeNoticeID(readStoredString(DISMISSED_NOTICE_KEY));
    const headers = { Accept: "text/html" };
    if (dismissedNotice) headers["If-None-Match"] = `"${dismissedNotice}"`;
    const response = await fetch("/api/v1/player/notice", {
      cache: "no-store",
      headers,
    });
    if (response.status === 304) return;
    if (response.status === 204) {
      clearNoticeDismissal();
      return;
    }
    if (!response.ok) throw new Error(`notice API returned ${response.status}`);
    const html = await response.text();
    if (!html.trim()) {
      clearNoticeDismissal();
      return;
    }
    const noticeID =
      normalizeNoticeID(response.headers.get("X-Notice-ID") || response.headers.get("ETag")) ||
      (await fingerprintNotice(html));
    if (dismissedNotice) {
      if (dismissedNotice === noticeID) return;
      clearNoticeDismissal();
    }
    elements.noticeRegion.dataset.noticeId = noticeID;
    elements.noticeContent.innerHTML = html;
    elements.noticeRegion.hidden = false;
  } catch (error) {
    console.error("load notice", error);
  }
}

// The static shell ships every optional control; this endpoint decides which of
// them the deployment keeps visible.
async function loadPlayerConfig() {
  if (!elements.themeToggle) return;
  try {
    const response = await fetch("/api/v1/player/config", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return;
    const payload = await response.json();
    elements.themeToggle.hidden = payload.theme_toggle === false;
    elements.settingsThemeSection.hidden = payload.theme_toggle === false;
  } catch (error) {
    console.error("load player config", error);
    // The demo page has no backend that could confirm a deployment hides the
    // theme choice, so it keeps the control the way an unset option would.
    if (isDemoMode()) elements.settingsThemeSection.hidden = false;
  }
}

function bindNoticeEvents() {
  elements.noticeDismiss.addEventListener("click", () => {
    const noticeID = elements.noticeRegion.dataset.noticeId;
    if (noticeID) writeStorage(DISMISSED_NOTICE_KEY, noticeID);
    elements.noticeRegion.hidden = true;
    const focusTarget = elements.dateTabs.querySelector(".date-tab") || elements.dateTabs;
    focusTarget.focus();
  });
}

function clearNoticeDismissal() {
  elements.noticeRegion.hidden = true;
  elements.noticeContent.replaceChildren();
  delete elements.noticeRegion.dataset.noticeId;
  removeStorage(DISMISSED_NOTICE_KEY);
}

async function loadPlayer() {
  setStatus(copy.loading);
  try {
    // The await keeps the demo payload on the same footing as a fetched one:
    // the render runs after this module finished evaluating, so the state
    // descriptions it reads are initialised by then.
    const payload = await (isDemoMode() ? demoPayload() : fetchPlayerData());
    if (payload === null) return;
    applyPayload(payload);
    selectInitialEpisode();
    scheduleRefresh();
  } catch (error) {
    console.error("load player", error);
    setStatus(copy.loadError);
    renderTabs();
    renderSourceFilters();
  }
}

// applyPayload stores the list the player renders. An episode that waits for a
// listener has no audio yet; it keeps its row so its download control shows.
function applyPayload(payload) {
  state.sources = payload.sources;
  state.episodes = payload.episodes
    .map(normalizeEpisode)
    .filter((episode) => episode.id && (episode.audioURL !== "" || episode.state !== "ready"))
    .sort((a, b) => b.sortTime - a.sortTime);
  applyDefaultCategory();
  renderCategorySetting();
  syncListenLaterSnapshots();
}

// The default feed only applies to the first payload of the page: a poll that
// lands later has to leave the page the listener swiped to alone.
function applyDefaultCategory() {
  if (defaultCategoryApplied) return;
  defaultCategoryApplied = true;
  // The saved list is not a feed: it opens the shared first tab on it instead
  // of selecting a source of its own.
  if (defaultCategory === LATER_SLOT) {
    primaryView = LATER_SLOT;
    state.activeSource = "all";
    return;
  }
  primaryView = "all";
  state.activeSource = resolveCategory(defaultCategory);
}

// A running download is the only reason to poll: the episode list already
// reports the state and the stage of every episode, which also brings a page
// that was reloaded mid-download back up to date.
function scheduleRefresh() {
  window.clearTimeout(refreshTimer);
  refreshTimer = 0;
  if (isDemoMode() || document.hidden) return;
  if (isAdminPage && !adminCSRF) return;
  if (!state.episodes.some((episode) => episode.state === "processing")) return;
  refreshTimer = window.setTimeout(refreshEpisodes, REFRESH_INTERVAL);
}

// refreshEpisodes replaces the data and redraws the rows, but it never touches
// the audio element or the selected episode, so a download never interrupts
// what is playing.
async function refreshEpisodes() {
  window.clearTimeout(refreshTimer);
  refreshTimer = 0;
  try {
    const payload = await fetchPlayerData();
    if (payload === null) return;
    applyPayload(payload);
    renderAll();
  } catch (error) {
    console.error("refresh player", error);
  } finally {
    scheduleRefresh();
  }
}

async function fetchPlayerData() {
  const start = startOfDay(state.dateOptions[state.dateOptions.length - 1].date);
  const before = startOfDay(addDays(state.dateOptions[0].date, 1));
  const params = new URLSearchParams({
    since: start.toISOString(),
    before: before.toISOString(),
    limit: "500",
  });

  const [sourcesResponse, episodesResponse] = await Promise.all([
    fetch("/api/v1/player/sources", { headers: { Accept: "application/json" } }),
    fetch(`/api/v1/${isAdminPage ? "admin" : "player"}/episodes?${params}`, { headers: { Accept: "application/json" } }),
  ]);

  if (isAdminPage && episodesResponse.status === 401) {
    showAdminLogin(adminCopy.expired);
    return null;
  }
  if (!sourcesResponse.ok || !episodesResponse.ok) {
    throw new Error(`player API returned ${sourcesResponse.status}/${episodesResponse.status}`);
  }

  const [sourcesPayload, episodesPayload] = await Promise.all([
    sourcesResponse.json(),
    episodesResponse.json(),
  ]);
  return {
    sources: Array.isArray(sourcesPayload.sources) ? sourcesPayload.sources : [],
    episodes: Array.isArray(episodesPayload.episodes) ? episodesPayload.episodes : [],
  };
}

function renderAll() {
  renderTabs();
  renderSourceFilters();
  renderEpisodeList();
  renderDisplaySettings();
}

// The header row follows the display mode: dates pick a day, categories pick a
// feed. Either way it lists what the API returned for the same three-day window.
function renderTabs() {
  const byCategory = displayMode === "category";
  elements.dateTabs.classList.toggle("is-category", byCategory);
  elements.dateTabs.setAttribute(
    "aria-label",
    byCategory ? copy.categoryTabsLabel : copy.dateTabsLabel,
  );
  elements.dateTabs.replaceChildren();

  if (byCategory) {
    categoryChoices().forEach((choice, index) => {
      const shared = index === 0;
      const tab = createTab(
        choice.id,
        choice.name,
        shared && primaryView === LATER_SLOT ? listenLaterCount() : countEpisodesForSource(choice.id),
        state.activeSource === choice.id,
        () => selectSlot({ source: choice.id }),
      );
      elements.dateTabs.append(shared ? createSharedControl(tab) : tab);
    });
    return;
  }

  // While the saved list is on, each day tab counts the saved episodes of that
  // day, which is what opening it will show.
  const savedEpisodes = primaryView === LATER_SLOT ? listenLaterEpisodes() : null;
  for (const option of state.dateOptions) {
    const count = savedEpisodes
      ? savedEpisodes.filter((episode) => episode.dayKey === option.key).length
      : countEpisodesForDate(option.key);
    elements.dateTabs.append(
      createTab(
        option.key,
        `${option.relativeLabel} ${option.monthDay}`,
        count,
        state.activeDate === option.key,
        () => selectSlot({ date: option.key }),
      ),
    );
  }
}

function createTab(key, label, count, selected, onSelect) {
  const button = document.createElement("button");
  button.className = "date-tab";
  button.type = "button";
  button.role = "tab";
  button.dataset.tab = key;
  button.setAttribute("aria-selected", String(selected));

  const text = document.createElement("span");
  text.textContent = label;
  const badge = document.createElement("span");
  badge.className = "date-count";
  badge.textContent = String(count);
  badge.setAttribute("aria-label", copy.episodeCount(count));
  button.append(text, badge);

  button.addEventListener("click", onSelect);
  return button;
}

// The "all" control is shared in both layouts: the caret beside it switches
// between every episode and the episodes saved on this device. The caret is a
// sibling rather than a child, because a control cannot sit inside another one.
function createSharedControl(button) {
  const group = document.createElement("div");
  group.className = "shared-control";
  group.append(button, createTabDropdown());
  return group;
}

// The shared first tab switches between every feed and the entries saved on
// this device, so the saved list needs no tab of its own.
function createTabDropdown() {
  const button = document.createElement("button");
  button.className = "date-tab-caret";
  button.type = "button";
  button.dataset.tabDropdown = "all";
  button.setAttribute("aria-haspopup", "menu");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", copy.listenLaterDropdown);
  button.title = copy.listenLaterDropdown;
  button.append(createIcon(ICON_CHEVRON_DOWN, "date-tab-caret-icon"));
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleAllDropdown(button);
  });
  return button;
}

function toggleAllDropdown(anchor) {
  if (popupMenuAnchor === anchor) {
    closePopupMenu();
    return;
  }
  openPopupMenu({
    anchor,
    label: copy.listenLaterDropdown,
    items: [
      {
        label: copy.allSources,
        checked: primaryView !== LATER_SLOT,
        onSelect: () => setPrimaryView("all"),
      },
      {
        label: copy.listenLater,
        checked: primaryView === LATER_SLOT,
        onSelect: () => setPrimaryView(LATER_SLOT),
      },
    ],
  });
}

// The shared tab swaps what it lists: every feed, or the episodes saved on this
// device. The pages behind the swipe are rebuilt in place, so the tab the
// listener is on stays where it is.
function setPrimaryView(view) {
  const next = view === LATER_SLOT ? LATER_SLOT : "all";
  if (next === primaryView) return;
  primaryView = next;
  renderAll();
}

// The feed row always offers "all" first, which is also where a swipe into a
// new date row starts over. The saved-for-later slot only joins the row when
// the list is grouped by feed, because it belongs to no single day.
function sourceChoices() {
  return [{ id: "all", name: copy.allSources }, ...state.sources];
}

// The row opens with one shared tab and then one tab per feed.
function categoryChoices() {
  return [
    { id: "all", name: primaryView === LATER_SLOT ? copy.listenLater : copy.allSources },
    ...state.sources,
  ];
}

// The shared "all" control lists the saved episodes while the personalisation
// view is on. It works in either layout, because the saved list belongs to no
// single day and to no single feed.
function showsListenLater(slot) {
  return primaryView === LATER_SLOT && slot?.source === "all";
}

function listenLaterCount() {
  return listenLaterEpisodes().length;
}

function renderSourceFilters() {
  // The header tabs already list every feed in category mode, so the second
  // row would only repeat them.
  elements.sourceFilterSection.hidden = displayMode === "category";
  elements.sourceFilters.replaceChildren();
  const sources = sourceChoices();
  const laterView = primaryView === LATER_SLOT;
  for (const source of sources) {
    const shared = source.id === "all";
    const button = document.createElement("button");
    button.className = "source-filter";
    button.type = "button";
    button.textContent = shared && laterView ? copy.listenLater : source.name;
    button.dataset.source = source.id;
    button.setAttribute("aria-pressed", String(state.activeSource === source.id));
    button.addEventListener("click", () => selectSlot({ source: source.id }));
    // "All" carries the same caret here as it does in the feed row, so the
    // saved list is reachable without changing the layout.
    elements.sourceFilters.append(shared ? createSharedControl(button) : button);
  }
}

// The header controls read as one chain rather than as two rows: in date mode
// every date offers the same row of feeds, so a swipe walks those feeds first
// and hands the step over to the following date once the last feed is behind
// it. Category mode has a single row, so there the feeds are the whole chain.
// Every control owns one page of the episode list.
function listSlots() {
  if (displayMode === "category") {
    return categoryChoices().map((source) => ({ date: "", source: source.id }));
  }
  const sources = sourceChoices().map((source) => source.id);
  return state.dateOptions.flatMap((option) =>
    sources.map((source) => ({ date: option.key, source })),
  );
}

function activeSlot() {
  return { date: state.activeDate, source: state.activeSource };
}

function activeSlotIndex(slots) {
  return slots.findIndex(
    (slot) => slot.source === state.activeSource && (!slot.date || slot.date === state.activeDate),
  );
}

function slotKey(slot) {
  return `${slot.date}|${slot.source}`;
}

// A page is named by the day and feed it shows, because that is what a listener
// needs to hear rather than the number of the page.
function slotLabel(slot) {
  if (showsListenLater(slot)) return copy.listenLater;
  const option = state.dateOptions.find((candidate) => candidate.key === slot.date);
  const feedName = sourceName(slot.source);
  return option ? `${option.relativeLabel} ${option.monthDay} · ${feedName}` : feedName;
}

// The episodes behind one header control. Category mode keeps the whole window
// and orders it by date, so a feed reads as one continuous list; date mode stays
// on the selected day. The saved-for-later slot ignores both and shows what this
// browser holds, newest save first.
function slotEpisodes(slot) {
  if (showsListenLater(slot)) {
    const saved = listenLaterEpisodes();
    // The date layout splits the saved list the way it splits everything else:
    // one page per day, so the day tabs keep their meaning while it is on.
    if (displayMode === "category" || !slot.date) return saved;
    return saved.filter((episode) => episode.dayKey === slot.date);
  }
  if (displayMode === "category") {
    return state.episodes.filter((episode) => inSource(episode, slot.source));
  }
  return state.episodes.filter(
    (episode) => episode.dayKey === slot.date && inSource(episode, slot.source),
  );
}

// A slot either shows one feed or the whole list.
function inSource(episode, sourceID) {
  return sourceID === "all" || episode.sourceID === sourceID;
}

// Swiper moves the pages sideways: a finger, a mouse drag, a touchpad swipe and
// a sideways wheel all walk the same chain of header controls. It is vendored
// under web/vendor/swiper and loaded before this module.
function initEpisodeSlider() {
  const container = elements.episodeSlider;
  if (!container || typeof Swiper !== "function") {
    // Without the vendored slider the list still renders, it just cannot page.
    container?.classList.add("is-static");
    return null;
  }
  const instance = new Swiper(container, {
    slidesPerView: 1,
    spaceBetween: 0,
    speed: 260,
    // A slow drag has to travel a fifth of the page to count, while a quick
    // flick pages right away.
    threshold: 8,
    longSwipesRatio: 0.2,
    longSwipesMs: 300,
    shortSwipes: true,
    // Dragging past the first or the last page stretches instead of following.
    resistanceRatio: 0.3,
    watchOverflow: true,
    // The pages are rebuilt whenever the episodes change.
    observer: true,
    observeParents: true,
    // Without this the browser reads a touchpad swipe as a back or forward
    // navigation instead of scrolling the list.
    mousewheel: { forceToAxis: true, sensitivity: 1, releaseOnEdges: false },
    // Arrow keys stay with the player controls instead of paging the list.
    keyboard: { enabled: false },
    a11y: {
      enabled: true,
      containerMessage: copy.episodeRegionLabel,
      containerRoleDescriptionMessage: copy.carouselRole,
      itemRoleDescriptionMessage: copy.slideRole,
      // Each page is labelled from its day and feed instead of its position.
      slideLabelMessage: "",
    },
  });
  instance.on("slideChange", syncActiveSlot);
  return instance;
}

// Everything that follows the page in front: the highlighted control, the empty
// state and the rows the queue plays.
function syncActiveSlot() {
  // The page behind the menu changes, so the actions no longer belong to what
  // the listener is looking at.
  closePopupMenu();
  const slot = slider ? listSlots()[slider.activeIndex] : activeSlot();
  if (!slot) return;
  state.activeSource = slot.source;
  if (slot.date) state.activeDate = slot.date;
  renderTabs();
  renderSourceFilters();
  revealActiveControls();
  renderSlotStatus();
  updateQueueButtons();
}

// The header controls pick a page by name, so a click lands on the same chain
// the swipe walks.
function selectSlot(slot) {
  // A day tab names only the day, so the feed the list is already on stays
  // selected; assigning an absent source would drop the page and leave the
  // empty state over the list.
  if (slot.source) state.activeSource = slot.source;
  if (slot.date) state.activeDate = slot.date;
  const index = activeSlotIndex(listSlots());
  if (!slider || index < 0) {
    renderAll();
    return;
  }
  // A click on the page already in front still has to refresh the header rows
  // and the empty state, which no slide change will announce.
  if (index === slider.activeIndex) syncActiveSlot();
  else slider.slideTo(index);
}

// Both header rows can scroll sideways, and redrawing the tabs starts theirs
// over, so the control the list is on is brought back into view.
function revealActiveControls() {
  const controls = [
    elements.dateTabs.querySelector('.date-tab[aria-selected="true"]'),
    elements.sourceFilters.querySelector('.source-filter[aria-pressed="true"]'),
  ];
  for (const control of controls) {
    if (control) control.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}

// Only the page in front reports whether it is empty, because the message covers
// the list rather than one page of it.
function renderSlotStatus() {
  if (visibleEpisodes().length > 0) {
    setStatus("");
    return;
  }
  if (showsListenLater(activeSlot())) {
    setStatus(copy.emptyLater);
    return;
  }
  setStatus(displayMode === "category" ? copy.emptyCategory : copy.empty);
}

// The list is one page per header control, and every page is rebuilt together
// so a row shows the same episode state wherever it appears.
function renderEpisodeList() {
  // A finger on the list owns it for the moment: a poll that lands mid-swipe
  // would replace the page under it.
  if (slider && slider.touching) return;
  const scrollPositions = new Map();
  if (slider) {
    for (const slide of slider.slides) {
      if (slide.dataset.slot) scrollPositions.set(slide.dataset.slot, slide.scrollTop);
    }
  }

  const slots = listSlots();
  const fragment = document.createDocumentFragment();
  for (const slot of slots) fragment.append(createEpisodeSlide(slot));
  elements.episodeWrapper.replaceChildren(fragment);
  for (const slide of elements.episodeWrapper.children) {
    const scrollTop = scrollPositions.get(slide.dataset.slot);
    if (scrollTop) slide.scrollTop = scrollTop;
  }

  const index = activeSlotIndex(slots);
  if (slider) {
    slider.update();
    if (index >= 0 && index !== slider.activeIndex) slider.slideTo(index, 0);
  } else if (index >= 0) {
    // The fallback keeps the page the header controls picked in front.
    elements.episodeWrapper.children[index]?.classList.add("swiper-slide-active");
  }
  renderSlotStatus();
  updateQueueButtons();
}

// The page in front: the one that scrolls, and the one that holds the row that
// is playing.
function activeSlide() {
  const index = slider ? slider.activeIndex : -1;
  return slider && index >= 0 ? slider.slides[index] : null;
}

// One page of the list: the episodes behind a single header control. The page
// scrolls on its own, so switching pages leaves the one in front where it was.
function createEpisodeSlide(slot) {
  const slide = document.createElement("div");
  slide.className = "swiper-slide episode-slide";
  slide.dataset.slot = slotKey(slot);
  // Swiper labels a page by its position; the day and the feed read better.
  slide.setAttribute("aria-label", slotLabel(slot));

  const rows = document.createElement("div");
  rows.className = "episode-rows";
  rows.role = "list";
  const fragment = document.createDocumentFragment();
  for (const episode of slotEpisodes(slot)) fragment.append(createEpisodeRow(episode, slot));
  rows.append(fragment);
  slide.append(rows);
  return slide;
}

function createEpisodeRow(episode, slot = null) {
  const row = elements.rowTemplate.content.firstElementChild.cloneNode(true);
  row.dataset.episodeId = episode.id;
  row.classList.toggle("is-current", episode.id === state.currentEpisodeID);
  row.classList.toggle("is-playing", episode.id === state.currentEpisodeID && !elements.audio.paused);

  const playButton = row.querySelector(".episode-play-button");
  const playIcon = row.querySelector(".episode-play-button img");
  const isPlaying = episode.id === state.currentEpisodeID && !elements.audio.paused;
  const controlLabel = episodeControlLabel(episode, isPlaying);
  row.classList.toggle("is-generating", episode.state === "processing");
  row.classList.toggle("is-generation-failed", episode.state === "failed");
  playButton.dataset.state = episode.state;
  playButton.setAttribute("aria-label", controlLabel);
  playButton.title = controlLabel;
  playIcon.src =
    episode.state === "ready" && isPlaying ? "/icons/pause.svg" : episodeControlIcon(episode);
  playButton.addEventListener("click", () => activateEpisode(episode));

  row.tabIndex = 0;
  row.setAttribute("aria-label", controlLabel);
  row.addEventListener("click", (event) => {
    if (event.target.closest("button, a, input")) return;
    activateEpisode(episode);
  });
  row.addEventListener("keydown", (event) => {
    if (event.target !== row || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    activateEpisode(episode);
  });
  bindRowContextMenu(row, episode);

  // In category mode every row repeats the same feed, so that column carries
  // the publish date instead of the feed name; the saved-for-later page mixes
  // feeds and keeps the names instead.
  const byDate = displayMode === "category" && !showsListenLater(slot);
  const source = row.querySelector(".episode-source");
  source.classList.toggle("is-date", byDate);
  source.textContent = byDate ? episodeDateLabel(episode) : sourceName(episode.sourceID);
  const title = row.querySelector(".episode-title");
  title.textContent = episode.title;
  title.title = episode.title;
  // Dimming is a personalisation choice, so a listened title only greys out
  // once the listener asked for it.
  title.classList.toggle("is-listened", dimListened && isListened(episode.id));

  const time = row.querySelector(".episode-time");
  renderEpisodeDuration(time, episode.durationSeconds);
  // Visibility only applies to published episodes, which are the playable ones.
  if (isAdminPage && adminCSRF && isPlayable(episode)) {
    row.classList.add("admin-episode-row");
    const visibilityButton = document.createElement("button");
    visibilityButton.type = "button";
    visibilityButton.className = "admin-visibility";
    row.classList.toggle("is-hidden", episode.hidden);
    visibilityButton.textContent = episode.hidden ? adminCopy.restore : adminCopy.hide;
    visibilityButton.setAttribute("aria-label", `${visibilityButton.textContent}: ${episode.title}`);
    visibilityButton.disabled = adminBusy;
    visibilityButton.addEventListener("click", () => setAdminVisibility(episode));
    if (episode.hidden) {
      const badge = document.createElement("span");
      badge.className = "admin-hidden-badge";
      badge.textContent = adminCopy.hidden;
      title.prepend(badge);
    }
    row.append(visibilityButton);
  }
  return row;
}

// The row control plays a ready episode, starts a download for one that is
// waiting, and reports progress for one that is already running.
function activateEpisode(episode) {
  // The click that follows a long press belongs to the menu, not to the row.
  if (Date.now() < suppressClickUntil) return;
  if (isPlayable(episode)) {
    toggleEpisode(episode);
    return;
  }
  if (episode.state === "processing") {
    showToast(stageToast(episode));
    return;
  }
  startEpisodeDownload(episode);
}

async function toggleEpisode(episode) {
  if (state.currentEpisodeID === episode.id) {
    if (elements.audio.paused) {
      await safePlay();
    } else {
      elements.audio.pause();
    }
    return;
  }
  selectEpisode(episode, { autoplay: true });
}

async function startEpisodeDownload(episode, { conflictToast = copy.generatingAlreadyRunning } = {}) {
  // A download started by hand can also be the moment the episode joins the
  // saved list, which is what the Listen later group in the settings controls.
  if (laterAutoDownload) saveEpisodeForLater(episode);
  if (isDemoMode()) {
    simulateDemoDownload(episode);
    return;
  }
  if (state.startingEpisodes.has(episode.id)) return;
  state.startingEpisodes.add(episode.id);
  renderEpisodeList();
  try {
    const response = await fetch(
      `/api/v1/player/episodes/${encodeURIComponent(episode.id)}/start`,
      { method: "POST", headers: { Accept: "application/json" } },
    );
    if (response.status === 409) {
      // Another listener started it, or the page was stale about its state.
      showToast(conflictToast);
      await refreshEpisodes();
      return;
    }
    if (!response.ok) throw new Error(`start API returned ${response.status}`);
    applyStartedEpisode(episode, await response.json());
  } catch (error) {
    console.error("start episode download", error);
    showToast(copy.generatingUnavailable);
  } finally {
    state.startingEpisodes.delete(episode.id);
    renderEpisodeList();
  }
}

function applyStartedEpisode(episode, payload) {
  if (payload.state === "processing") {
    episode.state = "processing";
    episode.stage = String(payload.stage || "");
  }
  showToast(stageToast(episode));
  scheduleRefresh();
}

// A running download names the step it is on, so the wait reads as progress
// instead of one anonymous spinner. The stage comes from the API and is absent
// while a job is only retrying, hence the fallback.
const STAGE_ICONS = {
  content: "/icons/reading.svg",
  script: "/icons/writing.svg",
  tts: "/icons/voice.svg",
  compose: "/icons/upload.svg",
};

// The control icon belongs to the episode state, not to the playback state.
function episodeControlIcon(episode) {
  switch (episode.state) {
    case "ready":
      return "/icons/play.svg";
    case "processing":
      return STAGE_ICONS[episode.stage] || "/icons/download.svg";
    case "failed":
      return "/icons/retry.svg";
    default:
      return "/icons/download.svg";
  }
}

function episodeControlLabel(episode, isPlaying) {
  switch (episode.state) {
    case "processing":
      return `${copy.downloadingEpisode(episode.title)} · ${stageText(episode.stage)}`;
    case "failed":
      return copy.retryEpisodeDownload(episode.title);
    case "pending":
      return copy.downloadEpisode(episode.title);
    default:
      return isPlaying ? copy.pauseEpisode(episode.title) : copy.playEpisode(episode.title);
  }
}

function stageText(stage) {
  return copy.generatingStages[stage] || copy.generatingStages.fallback;
}

// The toast reports a stage without any decoration: the row itself already
// shows that a download is running.
function stageToast(episode) {
  return stageText(episode.stage);
}

let toastTimer = 0;

// The toast is a reaction to a click, never to a poll: it appears when the
// listener asks for something and fades out on its own.
function showToast(message) {
  const toast = elements.toast;
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toastTimer = 0;
  toast.textContent = message;
  if (!toast.hidden) {
    // A hidden element restarts its entry animation when it is shown again, so
    // a replaced message animates the same way a fresh one does.
    toast.hidden = true;
    void toast.offsetWidth;
  }
  toast.hidden = false;
  toastTimer = window.setTimeout(hideToast, 3_600);
}

function hideToast() {
  window.clearTimeout(toastTimer);
  toastTimer = 0;
  if (elements.toast) elements.toast.hidden = true;
}

function selectEpisode(episode, { autoplay = false, resumeAt = 0 } = {}) {
  // Moving on is the moment the episode before this one is behind the
  // listener, which is when the saved list may let go of it.
  const previousEpisodeID = state.currentEpisodeID;
  state.currentEpisodeID = episode.id;
  if (previousEpisodeID && previousEpisodeID !== episode.id) {
    releaseListenedFromListenLater(previousEpisodeID);
  }
  state.restoringResume = resumeAt > 0;
  clearMediaSessionPosition();
  elements.audio.defaultPlaybackRate = state.speed;
  if (resumeAt > 0) {
    const resumeEpisodeID = episode.id;
    elements.audio.addEventListener(
      "loadedmetadata",
      () => {
        if (state.currentEpisodeID !== resumeEpisodeID) return;
        elements.audio.currentTime = Math.min(resumeAt, Math.max(0, elements.audio.duration - 1));
        state.restoringResume = false;
      },
      { once: true },
    );
  }
  // A cached episode plays from the copy this page already holds.
  elements.audio.src = audioSourceFor(episode);
  elements.audio.load();
  applyPlaybackRate();
  document.title = episode.title;
  renderNowPlayingTitle(episode.title);
  elements.nowPlayingSource.textContent = sourceName(episode.sourceID);
  elements.playToggle.disabled = false;
  elements.progress.disabled = false;
  updateMediaSession(episode);
  renderEpisodeList();
  scrollCurrentEpisodeIntoView();

  if (autoplay) safePlay();
}

async function safePlay() {
  try {
    await elements.audio.play();
  } catch (error) {
    if (!isDemoMode()) console.error("play audio", error);
  }
}

function bindPlayerEvents() {
  elements.playToggle.addEventListener("click", () => {
    if (elements.audio.paused) safePlay();
    else elements.audio.pause();
  });
  elements.previousButton.addEventListener("click", () => moveInQueue(-1));
  elements.nextButton.addEventListener("click", () => moveInQueue(1));
  elements.audio.addEventListener("play", renderPlaybackState);
  elements.audio.addEventListener("pause", renderPlaybackState);
  elements.audio.addEventListener("play", () => {
    markEpisodeListened(state.currentEpisodeID);
    // Playing an episode is the moment to pull the next one down for the rest
    // of the trip.
    preloadNextEpisode();
  });
  elements.audio.addEventListener("ended", () => {
    // An episode that played through is done with, even when it was the last
    // one in the queue and nothing follows it.
    releaseListenedFromListenLater(state.currentEpisodeID);
    moveInQueue(1);
  });
  elements.audio.addEventListener("loadedmetadata", () => {
    applyPlaybackRate();
    updateProgress();
    updateMediaSessionPosition();
  });
  elements.audio.addEventListener("durationchange", () => {
    updateProgress();
    updateMediaSessionPosition();
  });
  elements.audio.addEventListener("timeupdate", () => {
    updateProgress();
    updateMediaSessionPosition();
    persistResumeState();
  });
  elements.audio.addEventListener("seeked", updateMediaSessionPosition);
  elements.audio.addEventListener("ratechange", updateMediaSessionPosition);
  elements.progress.addEventListener("input", () => {
    if (!Number.isFinite(elements.audio.duration)) return;
    elements.audio.currentTime = (Number(elements.progress.value) / 100) * elements.audio.duration;
  });
  for (const button of elements.speedButtons) {
    button.addEventListener("click", () => setSpeed(Number(button.dataset.speed)));
  }
}

function renderPlaybackState() {
  const playing = !elements.audio.paused;
  elements.playToggleIcon.src = playing ? "/icons/pause.svg" : "/icons/play.svg";
  elements.playToggle.setAttribute("aria-label", playing ? copy.pause : copy.play);
  updateMediaSessionPlaybackState();
  updateMediaSessionPosition();
  registerMediaSessionActions();
  renderEpisodeList();
  scrollCurrentEpisodeIntoView();
}

function moveInQueue(offset) {
  const queue = playableEpisodes();
  if (queue.length === 0) return;
  const currentIndex = queue.findIndex((episode) => episode.id === state.currentEpisodeID);
  const nextIndex = currentIndex < 0 ? 0 : currentIndex + offset;
  if (nextIndex < 0 || nextIndex >= queue.length) return;
  selectEpisode(queue[nextIndex], { autoplay: true });
}

function updateQueueButtons() {
  const queue = playableEpisodes();
  const index = queue.findIndex((episode) => episode.id === state.currentEpisodeID);
  elements.previousButton.disabled = index <= 0;
  elements.nextButton.disabled = index < 0 || index >= queue.length - 1;
}

function setSpeed(speed) {
  if (![1, 1.2, 1.5].includes(speed)) return;
  state.speed = speed;
  applyPlaybackRate();
  if (!isDemoMode()) writeStorage(SPEED_KEY, String(speed));
  renderSpeed();
}

function applyPlaybackRate() {
  // Some in-car browsers reset playbackRate when audio.load() switches sources.
  // defaultPlaybackRate makes the next resource inherit the selection, while
  // playbackRate updates the currently loaded resource immediately.
  elements.audio.defaultPlaybackRate = state.speed;
  elements.audio.playbackRate = state.speed;
}

function renderSpeed() {
  for (const button of elements.speedButtons) {
    button.setAttribute("aria-pressed", String(Number(button.dataset.speed) === state.speed));
  }
}

function updateProgress() {
  const duration = elements.audio.duration;
  const current = elements.audio.currentTime || 0;
  if (!Number.isFinite(duration) || duration <= 0) {
    elements.progress.value = "0";
    elements.progress.style.setProperty("--progress-value", "0%");
    elements.elapsedTime.textContent = formatDuration(current);
    elements.remainingTime.textContent = "--:--";
    return;
  }
  const progress = Math.min(100, Math.max(0, (current / duration) * 100));
  elements.progress.value = String(progress);
  elements.progress.style.setProperty("--progress-value", `${progress}%`);
  elements.elapsedTime.textContent = formatDuration(current);
  elements.remainingTime.textContent = `-${formatDuration(Math.max(0, duration - current))}`;
}

const EPISODE_STATES = ["ready", "pending", "processing", "failed"];

function normalizeEpisode(episode) {
  // Rows are grouped by the date of the article, not by the moment its audio
  // was produced: a download that finishes today must not move an entry from
  // yesterday into today's tab. The episode's own published_at is set when the
  // audio is published, so the feed item timestamp wins when it exists.
  const publishedAt = parseDate(episode.original_published_at) || parseDate(episode.published_at);
  const durationSeconds = Number(episode.audio_duration_seconds);
  const audioURL = String(episode.audio_url || "");
  const reportedState = String(episode.state || "");
  return {
    id: String(episode.id || ""),
    hidden: episode.hidden === true,
    sourceID: String(episode.source_id || ""),
    title: String(episode.title || copy.untitled),
    audioURL,
    // The demo page and older responses only describe playable episodes.
    state: EPISODE_STATES.includes(reportedState) ? reportedState : audioURL ? "ready" : "pending",
    stage: String(episode.stage || ""),
    publishedAt,
    durationSeconds: Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : null,
    dayKey: publishedAt ? dateKey(publishedAt) : "",
    sortTime: publishedAt?.getTime() || 0,
  };
}

function renderEpisodeDuration(element, durationSeconds) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    element.textContent = "--:--";
    element.removeAttribute("datetime");
    element.setAttribute("aria-label", copy.durationUnavailable);
    return;
  }
  element.textContent = formatTotalDuration(durationSeconds);
  element.dateTime = `PT${Math.round(durationSeconds)}S`;
  element.setAttribute("aria-label", copy.durationLabel(element.textContent));
}

// Only the page in front scrolls: the episode that is playing sits on it, and a
// page further along keeps its own position.
function scrollCurrentEpisodeIntoView() {
  window.requestAnimationFrame(() => {
    const page = activeSlide();
    if (!page) return;
    const row = [...page.querySelectorAll(".episode-row")].find(
      (candidate) => candidate.dataset.episodeId === state.currentEpisodeID,
    );
    if (!row) return;
    const listRect = page.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    if (rowRect.top >= listRect.top && rowRect.bottom <= listRect.bottom) return;
    const top = page.scrollTop + rowRect.top - listRect.top - (page.clientHeight - rowRect.height) / 2;
    // Switching sources triggers both a list render and an audio `play` event.
    // Assigning scrollTop directly keeps the final position deterministic even
    // when those updates happen within the same frame.
    page.scrollTop = Math.max(0, top);
  });
}

function visibleEpisodes() {
  return slotEpisodes(activeSlot());
}

// Only an episode with audio can join the playback queue: the others are still
// waiting for their download.
function isPlayable(episode) {
  return episode.audioURL !== "";
}

function playableEpisodes() {
  return visibleEpisodes().filter(isPlayable);
}

function countEpisodesForDate(key) {
  return state.episodes.filter((episode) => episode.dayKey === key).length;
}

function countEpisodesForSource(sourceID) {
  return state.episodes.filter(
    (episode) => sourceID === "all" || episode.sourceID === sourceID,
  ).length;
}

// Only three days are ever listed, so the relative day is always accurate.
function episodeDateLabel(episode) {
  const option = state.dateOptions.find((candidate) => candidate.key === episode.dayKey);
  const clock = formatClockTime(episode.publishedAt);
  if (!option) return clock;
  return clock ? `${option.relativeLabel} ${clock}` : option.relativeLabel;
}

function formatClockTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function sourceName(sourceID) {
  return state.sources.find((source) => source.id === sourceID)?.name || sourceID;
}

function applyLocale() {
  document.documentElement.lang = copy.lang;
  document.title = copy.documentTitle;
  elements.languageSwitcher.setAttribute("aria-label", copy.languageLabel);
  elements.githubLink.setAttribute("aria-label", copy.githubLabel);
  elements.githubLink.title = copy.githubLabel;
  elements.settingsToggle.setAttribute("aria-label", copy.settingsLabel);
  elements.settingsToggle.title = copy.settingsLabel;
  elements.settingsTitle.textContent = copy.settingsTitle;
  elements.settingsThemeLabel.textContent = copy.themeSettingLabel;
  elements.settingsDisplayLabel.textContent = copy.displaySettingLabel;
  elements.settingsCategoryLabel.textContent = copy.categorySettingLabel;
  elements.settingsPersonalLabel.textContent = copy.personalSettingLabel;
  elements.laterGroupLabel.textContent = copy.laterGroupLabel;
  elements.otherGroupLabel.textContent = copy.otherGroupLabel;
  elements.laterAutoLabel.textContent = copy.laterAutoRemoveLabel;
  elements.laterDownloadLabel.textContent = copy.laterDownloadLabel;
  elements.dimListenedLabel.textContent = copy.dimListenedLabel;
  elements.preloadNextLabel.textContent = copy.preloadNextLabel;
  elements.cacheClear.textContent = copy.clearCache;
  // The settings panel repeats both controls for phones, where the header
  // hides them; the label text is the only thing they need here.
  elements.settingsLanguageLabel.textContent = copy.languageLabel;
  elements.settingsGithubLink.setAttribute("aria-label", copy.githubLabel);
  elements.settingsGithubLink.title = copy.githubLabel;
  for (const button of elements.themeModeButtons) {
    button.textContent = copy.themeModes[button.dataset.themeMode];
  }
  for (const button of elements.displayModeButtons) {
    button.textContent = copy.displayModes[button.dataset.displayMode];
  }
  elements.noticeRegion.setAttribute("aria-label", copy.noticeLabel);
  elements.noticeDismiss.setAttribute("aria-label", copy.dismissNotice);
  elements.noticeDismiss.title = copy.dismissNotice;
  elements.sourceFilterSection.setAttribute("aria-label", copy.sourceSectionLabel);
  elements.sourceFilterLabel.textContent = copy.sourceFilterLabel;
  elements.episodeRegion.setAttribute("aria-label", copy.episodeRegionLabel);
  elements.playerDock.setAttribute("aria-label", copy.playerLabel);
  elements.playToggle.setAttribute("aria-label", copy.play);
  elements.previousButton.setAttribute("aria-label", copy.previous);
  elements.nextButton.setAttribute("aria-label", copy.next);
  elements.nowPlayingLabel.textContent = copy.nowPlaying;
  renderNowPlayingTitle(copy.chooseEpisode);
  elements.progress.setAttribute("aria-label", copy.progressLabel);
  elements.speedLabel.textContent = copy.speedLabel;
  elements.speedLegend.textContent = copy.playbackSpeed;
  elements.statusMessage.textContent = copy.loading;

  for (const link of elements.languageLinks) {
    const selected = link.dataset.locale === localeKey;
    if (selected) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
    const targetPath = link.dataset.locale === "zh-CN" ? "/zh-cn" : "/en";
    link.href = `${isAdminPage ? "/admin" : ""}${targetPath}${window.location.search}${window.location.hash}`;
  }
  applyPlayerDrawer();
}

function readThemePreference() {
  const stored = readStoredString(THEME_KEY);
  return THEME_MODES.includes(stored) ? stored : "system";
}

function readDisplayPreference() {
  const stored = readStoredString(DISPLAY_KEY);
  return DISPLAY_MODES.includes(stored) ? stored : "date";
}

// "all" is both the default and the absence of a stored choice.
function readDefaultCategoryPreference() {
  return readStoredString(DEFAULT_CATEGORY_KEY) || "all";
}

function readPlayerDrawerPreference() {
  const stored = readStoredString(PLAYER_DRAWER_KEY);
  return PLAYER_DRAWER_MODES.includes(stored) ? stored : "expanded";
}

function resolvedTheme() {
  if (themePreference !== "system") return themePreference;
  return prefersDarkMode.matches ? "dark" : "light";
}

function initTheme() {
  applyTheme();
  prefersDarkMode.addEventListener("change", () => {
    if (themePreference === "system") applyTheme();
  });
  if (elements.themeToggle) {
    elements.themeToggle.addEventListener("click", () => {
      const next = THEME_MODES[(THEME_MODES.indexOf(themePreference) + 1) % THEME_MODES.length];
      setThemePreference(next);
    });
  }
  for (const button of elements.themeModeButtons) {
    button.addEventListener("click", () => setThemePreference(button.dataset.themeMode));
  }
}

// The header switch and the settings panel drive the same preference, so the
// stored value stays the single source of truth for both controls.
function setThemePreference(mode) {
  if (!THEME_MODES.includes(mode)) return;
  themePreference = mode;
  if (mode === "system") removeStorage(THEME_KEY);
  else writeStorage(THEME_KEY, mode);
  applyTheme();
}

// The header button opens a panel of the preferences that have more than one
// reasonable choice. It closes on a click outside it or on Escape, and it never
// touches the list, so audio keeps playing while it is open.
function initSettings() {
  if (!elements.settingsToggle || !elements.settingsPanel) return;
  elements.settingsToggle.addEventListener("click", () => {
    if (elements.settingsPanel.hidden) openSettings();
    else closeSettings();
  });
  document.addEventListener("click", (event) => {
    if (elements.settingsPanel.hidden) return;
    if (event.target.closest("#settings-menu")) return;
    closeSettings();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.settingsPanel.hidden) closeSettings(true);
  });
  for (const button of elements.displayModeButtons) {
    button.addEventListener("click", () => setDisplayMode(button.dataset.displayMode));
  }
  if (elements.settingsCategorySelect) {
    elements.settingsCategorySelect.addEventListener("change", () =>
      setDefaultCategory(elements.settingsCategorySelect.value),
    );
  }
  initPersonalSettings();
  renderDisplaySettings();
}

function openSettings() {
  elements.settingsPanel.hidden = false;
  elements.settingsToggle.setAttribute("aria-expanded", "true");
}

function closeSettings(focusToggle = false) {
  elements.settingsPanel.hidden = true;
  elements.settingsToggle.setAttribute("aria-expanded", "false");
  if (focusToggle) elements.settingsToggle.focus();
}

// Switching the display mode only re-groups the list; the loaded audio and the
// playing episode are left alone.
function setDisplayMode(mode) {
  if (!DISPLAY_MODES.includes(mode) || mode === displayMode) {
    renderDisplaySettings();
    return;
  }
  displayMode = mode;
  writeStorage(DISPLAY_KEY, mode);
  renderAll();
}

function renderDisplaySettings() {
  for (const button of elements.displayModeButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.displayMode === displayMode));
  }
}

// The default feed is a dropdown rather than a segmented control, because a
// deployment can follow more feeds than would fit in one row. Its options repeat
// the header tabs, "all" first, so both read in the same order.
// The dropdown repeats the feed row and adds the saved list, which the shared
// first tab can show in place of "all".
function defaultCategoryChoices() {
  return [
    { id: "all", name: copy.allSources },
    { id: LATER_SLOT, name: copy.listenLater },
    ...state.sources,
  ];
}

function renderCategorySetting() {
  const select = elements.settingsCategorySelect;
  if (!select) return;
  const options = defaultCategoryChoices().map((choice) => {
    const option = document.createElement("option");
    option.value = choice.id;
    option.textContent = choice.name;
    return option;
  });
  select.replaceChildren(...options);
  select.value = resolveCategory(defaultCategory);
}

// A feed the deployment no longer follows falls back to the whole list; the
// saved list is a choice of its own rather than a feed.
function resolveCategory(sourceID) {
  if (sourceID === LATER_SLOT) return LATER_SLOT;
  return sourceChoices().some((choice) => choice.id === sourceID) ? sourceID : "all";
}

// Picking a feed stores it and shows it right away, so the panel previews what
// the next visit will open on. The saved list works in either layout, so it
// needs no layout of its own.
function setDefaultCategory(sourceID) {
  defaultCategory = resolveCategory(sourceID);
  // An explicit pick is the current choice as well, so the first payload must
  // not override it.
  defaultCategoryApplied = true;
  if (defaultCategory === "all") removeStorage(DEFAULT_CATEGORY_KEY);
  else writeStorage(DEFAULT_CATEGORY_KEY, defaultCategory);
  renderCategorySetting();
  if (defaultCategory === LATER_SLOT) {
    setPrimaryView(LATER_SLOT);
    return;
  }
  setPrimaryView("all");
  selectSlot({ source: defaultCategory });
}

// The dock doubles as a drawer: folding it away hands the rows it used back to
// the episode list. That is a choice about this screen rather than about the
// deployment, so it is stored in the browser like the other preferences.
function initPlayerDrawer() {
  applyPlayerDrawer();
  if (!elements.playerDrawerToggle) return;
  elements.playerDrawerToggle.addEventListener("click", () => {
    playerDrawer = playerDrawer === "collapsed" ? "expanded" : "collapsed";
    writeStorage(PLAYER_DRAWER_KEY, playerDrawer);
    applyPlayerDrawer();
  });
}

function applyPlayerDrawer() {
  const collapsed = playerDrawer === "collapsed";
  // The attribute drives both the shell rows and the compact dock layout.
  if (collapsed) document.documentElement.dataset.playerDrawer = "collapsed";
  else delete document.documentElement.dataset.playerDrawer;
  // Folding the dock changes the width the title has, which decides whether it
  // has to crawl at all.
  applyTitleMarquee();
  if (!elements.playerDrawerToggle) return;
  const label = collapsed ? copy.expandPlayer : copy.collapsePlayer;
  elements.playerDrawerToggle.setAttribute("aria-expanded", String(!collapsed));
  elements.playerDrawerToggle.setAttribute("aria-label", label);
  elements.playerDrawerToggle.title = label;
}

function applyTheme() {
  const theme = resolvedTheme();
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = THEME_COLORS[theme];
  for (const button of elements.themeModeButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.themeMode === themePreference));
  }
  if (!elements.themeToggle) return;
  elements.themeToggle.dataset.mode = themePreference;
  const label = `${copy.themeLabel}: ${copy.themeModes[themePreference]}`;
  elements.themeToggle.setAttribute("aria-label", label);
  elements.themeToggle.title = label;
}

function updateGreeting() {
  const hour = new Date().getHours();
  let greeting = copy.greetings[3];
  if (hour >= 5 && hour < 11) greeting = copy.greetings[0];
  else if (hour >= 11 && hour < 14) greeting = copy.greetings[1];
  else if (hour >= 14 && hour < 18) greeting = copy.greetings[2];
  elements.greeting.textContent = isAdminPage ? (localeKey === "zh-CN" ? "播客管理" : "Manage podcasts") : copy.greeting(greeting);
}

function createDateOptions() {
  const today = startOfDay(new Date());
  return [
    { relativeLabel: copy.relativeDates[0], date: today },
    { relativeLabel: copy.relativeDates[1], date: addDays(today, -1) },
    { relativeLabel: copy.relativeDates[2], date: addDays(today, -2) },
  ].map((option) => ({
    ...option,
    key: dateKey(option.date),
    monthDay: new Intl.DateTimeFormat(copy.dateLocale, {
      month: "short",
      day: "numeric",
    }).format(option.date),
  }));
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
}

function formatTotalDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  const whole = Math.round(seconds);
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
}

function setStatus(message) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.hidden = message === "";
}

function selectInitialEpisode() {
  const availableDateKeys = new Set(state.dateOptions.map((option) => option.key));
  const inWindow = (candidate) => availableDateKeys.has(candidate.dayKey) && isPlayable(candidate);
  // The list opens on the selected feed, so the first episode comes from it when
  // it has one. Falling back to every feed keeps the player usable when the
  // default feed has nothing in the window. The saved list is a view of its own,
  // so the player follows it when the page opened there; one saved today wins,
  // because that is the day the date layout would open on.
  const savedEpisodes = showsListenLater(activeSlot()) ? listenLaterEpisodes() : [];
  // The date layout only shows the saved episodes of the three days on screen,
  // so it picks one of those; the feed layout lists every saved episode at once.
  const savedEpisode =
    (displayMode === "date" ? savedEpisodes.find(inWindow) : savedEpisodes.find(isPlayable)) || null;
  const latestEpisode =
    savedEpisode ||
    state.episodes.find(
      (candidate) => inWindow(candidate) && inSource(candidate, state.activeSource),
    ) ||
    state.episodes.find(inWindow);
  if (!latestEpisode) {
    renderAll();
    return;
  }

  state.activeDate = latestEpisode.dayKey;
  const resumeEpisode = state.pendingResume?.episodeID
    ? state.episodes.find((candidate) => candidate.id === state.pendingResume.episodeID)
    : null;
  const episode = resumeEpisode?.dayKey === latestEpisode.dayKey ? resumeEpisode : latestEpisode;
  renderTabs();
  renderSourceFilters();
  selectEpisode(episode, {
    resumeAt: episode === resumeEpisode ? state.pendingResume.currentTime || 0 : 0,
  });
}

let lastPersistSecond = -1;
function persistResumeState() {
  if (isDemoMode() || !state.currentEpisodeID || state.restoringResume) return;
  const wholeSecond = Math.floor(elements.audio.currentTime || 0);
  if (wholeSecond === lastPersistSecond || wholeSecond % 5 !== 0) return;
  lastPersistSecond = wholeSecond;
  writeStorage(
    RESUME_KEY,
    JSON.stringify({ episodeID: state.currentEpisodeID, currentTime: wholeSecond }),
  );
}

function readResumeState() {
  try {
    const value = JSON.parse(localStorage.getItem(RESUME_KEY) || "null");
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

function readStoredNumber(key, fallback) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

function readStoredString(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Playback remains functional in browsers that disable storage.
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Stale preferences are harmless in browsers that disable storage.
  }
}

// ---- Personalisation flags ----

function readFlag(key) {
  return readStoredString(key) === "1";
}

function writeFlag(key, enabled) {
  if (enabled) writeStorage(key, "1");
  else removeStorage(key);
}

// ---- Listen later ----

// The saved entries keep a snapshot of the row they came from: an episode that
// the API window dropped stays listed and playable, and the live payload only
// refreshes the snapshot while the episode is still in it.
function readListenLaterRecords() {
  try {
    const value = JSON.parse(readStoredString(LISTEN_LATER_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((record) => record && typeof record.id === "string" && record.id !== "");
  } catch {
    return [];
  }
}

function writeListenLaterRecords(records) {
  writeStorage(LISTEN_LATER_KEY, JSON.stringify(records.slice(0, LISTEN_LATER_LIMIT)));
}

function snapshotFromEpisode(episode, addedAt) {
  return {
    id: episode.id,
    sourceID: episode.sourceID,
    title: episode.title,
    audioURL: episode.audioURL,
    durationSeconds: episode.durationSeconds || 0,
    state: episode.state,
    stage: episode.stage || "",
    publishedAt: episode.publishedAt ? episode.publishedAt.toISOString() : "",
    addedAt: addedAt || Date.now(),
  };
}

function episodeFromLaterRecord(record) {
  const publishedAt = parseDate(record.publishedAt);
  const audioURL = String(record.audioURL || "");
  const reportedState = String(record.state || "");
  const durationSeconds = Number(record.durationSeconds);
  return {
    id: String(record.id),
    hidden: false,
    sourceID: String(record.sourceID || ""),
    title: String(record.title || copy.untitled),
    audioURL,
    state: EPISODE_STATES.includes(reportedState) ? reportedState : audioURL ? "ready" : "pending",
    stage: String(record.stage || ""),
    publishedAt,
    durationSeconds: Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : null,
    dayKey: publishedAt ? dateKey(publishedAt) : "",
    sortTime: publishedAt ? publishedAt.getTime() : 0,
    addedAt: Number(record.addedAt) || 0,
  };
}

// What the saved-for-later page shows: the live episode when the API still
// returns it, the stored snapshot otherwise.
function listenLaterEpisodes() {
  return listenLater.map((record) => {
    const live = state.episodes.find((episode) => episode.id === record.id);
    return live ? { ...live, addedAt: record.addedAt } : episodeFromLaterRecord(record);
  });
}

function inListenLater(id) {
  return listenLater.some((record) => record.id === id);
}

function removeEpisodeFromListenLater(id) {
  const next = listenLater.filter((record) => record.id !== id);
  if (next.length === listenLater.length) return false;
  listenLater = next;
  writeListenLaterRecords(listenLater);
  return true;
}

function addEpisodeToListenLater(episode) {
  listenLater = [
    snapshotFromEpisode(episode),
    ...listenLater.filter((record) => record.id !== episode.id),
  ];
  writeListenLaterRecords(listenLater);
}

// A poll moved an episode on (its download finished, or it failed), so the
// saved copy follows it; only the fields the row renders are compared.
function syncListenLaterSnapshots() {
  if (listenLater.length === 0) return;
  let changed = false;
  const records = listenLater.map((record) => {
    const live = state.episodes.find((episode) => episode.id === record.id);
    if (!live) return record;
    const next = snapshotFromEpisode(live, record.addedAt);
    if (
      next.audioURL === record.audioURL &&
      next.state === record.state &&
      next.durationSeconds === record.durationSeconds &&
      next.stage === record.stage
    ) {
      return record;
    }
    changed = true;
    return next;
  });
  if (!changed) return;
  listenLater = records;
  writeListenLaterRecords(records);
}

function toggleListenLater(episode) {
  if (!episode) return;
  if (inListenLater(episode.id)) {
    // Dropping an entry speaks for itself: the row leaves the saved list.
    removeEpisodeFromListenLater(episode.id);
    renderAll();
    return;
  }
  addEpisodeToListenLater(episode);
  showToast(copy.laterAdded);
  // The shared tab carries the count, so the header is redrawn as well.
  renderAll();
  startLaterDownload(episode);
}

// Saving an episode that has no audio yet is a request for it, so the download
// starts right away. Only a poll-only source can be started from the player;
// everything else already runs through the automatic pipeline.
function startLaterDownload(episode) {
  if (episode.state !== "pending" && episode.state !== "failed") return;
  startEpisodeDownload(episode, { conflictToast: copy.laterUnavailable });
}

// The same save without the toast: a download the listener started by hand
// already reports its own stage, so joining the saved list stays quiet.
function saveEpisodeForLater(episode) {
  if (!episode || inListenLater(episode.id)) return false;
  addEpisodeToListenLater(episode);
  // The shared tab carries the count of what is saved.
  renderAll();
  return true;
}

// ---- Listened episodes ----

function readListenedRecords() {
  try {
    const value = JSON.parse(readStoredString(LISTENED_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

// The markers are only kept to grey out rows and to drop a finished entry from
// the saved list, so the oldest ones are trimmed away.
function writeListenedRecords(records) {
  const entries = Object.entries(records)
    .sort((left, right) => right[1] - left[1])
    .slice(0, LISTENED_LIMIT);
  writeStorage(LISTENED_KEY, JSON.stringify(Object.fromEntries(entries)));
}

function isListened(id) {
  return Boolean(id) && Boolean(listened[id]);
}

// Playing an episode is enough to count as listened: a listener who moves on
// before the end has still heard it. The saved list is left alone here, because
// dropping the episode the moment it starts would empty the list under the
// listener's finger; it lets go once the episode is behind them.
function markEpisodeListened(id) {
  if (!id || listened[id]) return;
  listened[id] = Date.now();
  writeListenedRecords(listened);
  if (dimListened) renderAll();
}

// The saved list releases an episode the listener has left: it played through,
// or they moved on to something else. Only an episode that was actually played
// counts, so a saved one that is merely tapped through stays.
function releaseListenedFromListenLater(id) {
  if (!laterAutoRemove || !id || !listened[id] || !inListenLater(id)) return false;
  removeEpisodeFromListenLater(id);
  renderAll();
  return true;
}

// ---- The shared popup menu ----

function createIcon(path, className = "") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 -960 960 960");
  svg.setAttribute("aria-hidden", "true");
  if (className) svg.setAttribute("class", className);
  const shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shape.setAttribute("d", path);
  shape.setAttribute("fill", "currentColor");
  svg.append(shape);
  return svg;
}

// One menu serves the "All" dropdown and the row actions. It hangs off the body
// because both the tab row and the episode pages scroll, and a menu inside them
// would be clipped.
function initPopupMenu() {
  const menu = elements.popupMenu;
  if (!menu) return;
  document.addEventListener("click", (event) => {
    if (menu.hidden) return;
    if (event.target.closest("#popup-menu")) return;
    // The click that opened the menu is still on its way here, and the one a
    // long press leaves behind belongs to the menu as well.
    if (popupMenuIgnoreClick && Date.now() - popupMenuOpenedAt < LONG_PRESS_CLICK_GUARD_MS) {
      popupMenuIgnoreClick = false;
      return;
    }
    closePopupMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || menu.hidden) return;
    closePopupMenu({ focusAnchor: true });
  });
  document.addEventListener("scroll", () => closePopupMenu(), { capture: true, passive: true });
  window.addEventListener("resize", () => closePopupMenu());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) closePopupMenu();
  });
}

function openPopupMenu({ anchor = null, x = null, y = null, items = [], label = "" }) {
  const menu = elements.popupMenu;
  if (!menu || items.length === 0) return;
  menu.replaceChildren();
  if (label) menu.setAttribute("aria-label", label);
  else menu.removeAttribute("aria-label");

  for (const item of items) {
    const button = document.createElement("button");
    button.className = "popup-menu-item";
    button.type = "button";
    const selectable = item.checked !== undefined;
    button.role = selectable ? "menuitemradio" : "menuitem";
    if (selectable) button.setAttribute("aria-checked", String(Boolean(item.checked)));
    button.disabled = Boolean(item.disabled);
    button.append(createIcon(item.icon || "", "popup-menu-icon"));
    const text = document.createElement("span");
    text.className = "popup-menu-label";
    text.textContent = item.label;
    button.append(text);
    const mark = document.createElement("span");
    mark.className = "popup-menu-mark";
    if (item.checked) mark.append(createIcon(ICON_CHECK, "popup-menu-check"));
    button.append(mark);
    button.addEventListener("click", () => {
      if (button.disabled) return;
      closePopupMenu();
      item.onSelect?.();
    });
    menu.append(button);
  }

  menu.hidden = false;
  positionPopupMenu(menu, anchor, x, y);
  popupMenuAnchor = anchor;
  popupMenuOpenedAt = Date.now();
  popupMenuIgnoreClick = true;
  if (anchor?.hasAttribute("aria-haspopup")) anchor.setAttribute("aria-expanded", "true");
  menu.querySelector(".popup-menu-item:not(:disabled)")?.focus({ preventScroll: true });
}

function positionPopupMenu(menu, anchor, x, y) {
  const margin = 8;
  const size = menu.getBoundingClientRect();
  const anchorRect = anchor ? anchor.getBoundingClientRect() : null;
  const wantedLeft = x !== null ? x : anchorRect ? anchorRect.left : margin;
  const wantedTop = y !== null ? y : anchorRect ? anchorRect.bottom + 6 : margin;
  const left = Math.min(
    Math.max(margin, wantedLeft),
    Math.max(margin, window.innerWidth - margin - size.width),
  );
  let top = wantedTop;
  if (top + size.height > window.innerHeight - margin) {
    top = anchorRect ? anchorRect.top - size.height - 6 : y - size.height;
  }
  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(Math.max(margin, top))}px`;
}

function closePopupMenu({ focusAnchor = false } = {}) {
  const menu = elements.popupMenu;
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  menu.replaceChildren();
  popupMenuIgnoreClick = false;
  const anchor = popupMenuAnchor;
  popupMenuAnchor = null;
  if (anchor?.isConnected) {
    if (anchor.hasAttribute("aria-haspopup")) anchor.setAttribute("aria-expanded", "false");
    if (focusAnchor && typeof anchor.focus === "function") anchor.focus({ preventScroll: true });
  }
}

// ---- Row actions: long press and right click ----

// A press that is held on a row opens the same actions a right click does, so a
// phone can start a download, save an entry for later, or drop it again.
function bindRowContextMenu(row, episode) {
  let timer = 0;
  let pressed = false;
  let startX = 0;
  let startY = 0;
  const cancel = () => {
    window.clearTimeout(timer);
    timer = 0;
    pressed = false;
  };
  row.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" || (event.button ?? 0) !== 0) return;
    pressed = true;
    startX = event.clientX;
    startY = event.clientY;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = 0;
      pressed = false;
      suppressEpisodeClick();
      navigator.vibrate?.(12);
      openEpisodeMenu(episode, { x: startX, y: startY, anchor: row });
    }, LONG_PRESS_MS);
  });
  row.addEventListener("pointermove", (event) => {
    if (!pressed) return;
    if (
      Math.abs(event.clientX - startX) > LONG_PRESS_SLOP ||
      Math.abs(event.clientY - startY) > LONG_PRESS_SLOP
    ) {
      cancel();
    }
  });
  row.addEventListener("pointerup", cancel);
  row.addEventListener("pointercancel", cancel);
  row.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    cancel();
    suppressEpisodeClick();
    openEpisodeMenu(episode, { x: event.clientX, y: event.clientY, anchor: row });
  });
}

// The click a long press leaves behind must not also start playback.
function suppressEpisodeClick() {
  suppressClickUntil = Date.now() + LONG_PRESS_CLICK_GUARD_MS;
}

function openEpisodeMenu(episode, { x = null, y = null, anchor = null } = {}) {
  openPopupMenu({
    anchor,
    x,
    y,
    label: copy.openEpisodeActions(episode.title),
    items: episodeMenuItems(episode),
  });
}

// The first item mirrors the row control: it plays what is ready, starts or
// retries a download, and reports the stage of one that is already running. The
// second item always offers the saved-for-later toggle.
function episodeMenuItems(episode) {
  const id = episode.id;
  const items = [];
  const playing = id === state.currentEpisodeID && !elements.audio.paused;
  if (episode.state === "processing") {
    items.push({ label: stageText(episode.stage), icon: ICON_DOWNLOAD, disabled: true });
  } else if (episode.state === "failed") {
    items.push({
      label: copy.menuRetry,
      icon: ICON_RETRY,
      onSelect: () => startEpisodeDownload(findEpisode(id) || episode),
    });
  } else if (episode.state === "pending") {
    items.push({
      label: copy.menuDownload,
      icon: ICON_DOWNLOAD,
      onSelect: () => startEpisodeDownload(findEpisode(id) || episode),
    });
  } else {
    items.push({
      label: playing ? copy.pause : copy.play,
      icon: playing ? ICON_PAUSE : ICON_PLAY,
      onSelect: () => toggleEpisode(findEpisode(id) || episode),
    });
  }
  items.push({
    label: inListenLater(id) ? copy.removeListenLater : copy.addListenLater,
    icon: ICON_BOOKMARK,
    checked: inListenLater(id),
    onSelect: () => toggleListenLater(findEpisode(id) || episode),
  });
  return items;
}

// A menu lives longer than the row it was opened from, so its actions look the
// current episode up again instead of holding the rendered row.
function findEpisode(id) {
  const live = state.episodes.find((episode) => episode.id === id);
  if (live) return live;
  const record = listenLater.find((item) => item.id === id);
  return record ? episodeFromLaterRecord(record) : null;
}

// ---- Local audio cache ----

function readAudioCacheIndex() {
  try {
    const value = JSON.parse(readStoredString(AUDIO_CACHE_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function writeAudioCacheIndex() {
  writeStorage(AUDIO_CACHE_KEY, JSON.stringify(audioCacheIndex));
}

function cachedTotals() {
  const entries = Object.values(audioCacheIndex);
  const sized = entries.filter((entry) => Number(entry?.bytes) > 0);
  return {
    count: entries.length,
    bytes: sized.reduce((total, entry) => total + Number(entry.bytes), 0),
    sized: sized.length > 0,
  };
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 ? 0 : value < 10 ? 1 : 0;
  return `${value.toFixed(digits)} ${units[unit]}`;
}

// Playing an episode also fetches the next one that can be played, so a queue
// keeps going on a train with no signal. The fetch is idempotent per episode.
function preloadNextEpisode() {
  if (!preloadNext) return;
  const queue = playableEpisodes();
  const index = queue.findIndex((episode) => episode.id === state.currentEpisodeID);
  if (index < 0) return;
  const next = queue[index + 1];
  if (next) preloadEpisodeAudio(next);
}

function preloadEpisodeAudio(episode) {
  const url = episode.audioURL;
  if (!url || preloadsInFlight.has(url)) return;
  if (cachedBlobURLs.has(url) || audioCacheIndex[episode.id]?.url === url) return;
  preloadsInFlight.add(url);
  if (typeof caches === "undefined" || !window.isSecureContext) {
    preloadsInFlight.delete(url);
    preloadViaAudioElement(episode);
    return;
  }
  fetch(url, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`audio preload returned ${response.status}`);
      return response.blob();
    })
    .then(async (blob) => {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      await cache.put(url, new Response(blob, { headers: { "Content-Type": blob.type || "audio/mpeg" } }));
      cachedBlobURLs.set(url, URL.createObjectURL(blob));
      recordCachedEpisode(episode.id, url, blob.size);
    })
    .catch(() => {
      // A cross-origin audio host without CORS headers cannot be read here, so
      // the media element fetches it instead; its size stays unknown.
      preloadViaAudioElement(episode);
    })
    .finally(() => preloadsInFlight.delete(url));
}

function preloadViaAudioElement(episode) {
  if (preloadElements.has(episode.id)) return;
  const audio = document.createElement("audio");
  audio.preload = "auto";
  audio.src = episode.audioURL;
  audio.addEventListener("loadeddata", () => recordCachedEpisode(episode.id, episode.audioURL, null), {
    once: true,
  });
  preloadElements.set(episode.id, audio);
  audio.load();
}

function recordCachedEpisode(episodeID, url, bytes) {
  const previous = audioCacheIndex[episodeID];
  if (previous && previous.url !== url) dropCachedEpisode(episodeID);
  audioCacheIndex[episodeID] = {
    url,
    bytes: Number.isFinite(bytes) && bytes > 0 ? bytes : null,
    cachedAt: Date.now(),
  };
  evictCachedEpisodes();
  writeAudioCacheIndex();
  renderCacheSummary();
}

function evictCachedEpisodes() {
  const entries = Object.entries(audioCacheIndex).sort(
    (left, right) => (left[1]?.cachedAt || 0) - (right[1]?.cachedAt || 0),
  );
  while (entries.length > AUDIO_CACHE_LIMIT) {
    const [episodeID] = entries.shift();
    dropCachedEpisode(episodeID);
  }
}

function dropCachedEpisode(episodeID) {
  const entry = audioCacheIndex[episodeID];
  delete audioCacheIndex[episodeID];
  if (entry?.url) {
    const objectURL = cachedBlobURLs.get(entry.url);
    if (objectURL) {
      cachedBlobURLs.delete(entry.url);
      // The object URL of the episode that is playing stays alive until the
      // listener moves on, so dropping the copy never stops the audio.
      if (elements.audio.currentSrc !== objectURL) URL.revokeObjectURL(objectURL);
    }
    if (typeof caches !== "undefined") {
      caches
        .open(AUDIO_CACHE_NAME)
        .then((cache) => cache.delete(entry.url))
        .catch(() => {});
    }
  }
  const preload = preloadElements.get(episodeID);
  if (preload) {
    preloadElements.delete(episodeID);
    preload.removeAttribute("src");
    preload.load();
  }
}

function clearAudioCache() {
  for (const episodeID of Object.keys(audioCacheIndex)) dropCachedEpisode(episodeID);
  audioCacheIndex = {};
  writeAudioCacheIndex();
  if (typeof caches !== "undefined") caches.delete(AUDIO_CACHE_NAME).catch(() => {});
  renderCacheSummary();
  showToast(copy.cacheCleared);
}

// The audio of one entry is only ever used through its object URL, so the
// cached bytes are what plays back without asking the network again.
function audioSourceFor(episode) {
  return cachedBlobURLs.get(episode.audioURL) || episode.audioURL;
}

function renderCacheSummary() {
  const summary = elements.cacheSummary;
  const clear = elements.cacheClear;
  if (!summary || !clear) return;
  summary.hidden = !preloadNext;
  clear.hidden = !preloadNext;
  if (!preloadNext) return;
  const totals = cachedTotals();
  if (totals.count === 0) summary.textContent = copy.cacheEmpty;
  else if (totals.sized) summary.textContent = copy.cacheSummary(formatBytes(totals.bytes), totals.count);
  else summary.textContent = copy.cacheSummaryUnknown(totals.count);
}

// ---- Personalisation settings ----

function initPersonalSettings() {
  elements.laterAutoToggle?.addEventListener("click", () =>
    setPersonalFlag("laterAutoRemove", !laterAutoRemove),
  );
  elements.laterDownloadToggle?.addEventListener("click", () =>
    setPersonalFlag("laterAutoDownload", !laterAutoDownload),
  );
  elements.dimListenedToggle?.addEventListener("click", () =>
    setPersonalFlag("dimListened", !dimListened),
  );
  elements.preloadNextToggle?.addEventListener("click", () =>
    setPersonalFlag("preloadNext", !preloadNext),
  );
  elements.cacheClear?.addEventListener("click", () => clearAudioCache());
  renderPersonalSettings();
}

function setPersonalFlag(name, enabled) {
  if (name === "laterAutoRemove") {
    laterAutoRemove = enabled;
    writeFlag(LATER_AUTO_REMOVE_KEY, enabled);
  } else if (name === "laterAutoDownload") {
    laterAutoDownload = enabled;
    writeFlag(LATER_AUTO_DOWNLOAD_KEY, enabled);
  } else if (name === "dimListened") {
    dimListened = enabled;
    writeFlag(DIM_LISTENED_KEY, enabled);
  } else {
    preloadNext = enabled;
    writeFlag(PRELOAD_NEXT_KEY, enabled);
    // Turning local loading on is a request for the queue to be held, so the
    // episode after the one that is playing is fetched right away.
    if (enabled) preloadNextEpisode();
  }
  renderPersonalSettings();
  renderEpisodeList();
}

function renderPersonalSettings() {
  setSwitchState(elements.laterAutoToggle, laterAutoRemove);
  setSwitchState(elements.laterDownloadToggle, laterAutoDownload);
  setSwitchState(elements.dimListenedToggle, dimListened);
  setSwitchState(elements.preloadNextToggle, preloadNext);
  renderCacheSummary();
}

function setSwitchState(element, enabled) {
  if (element) element.setAttribute("aria-checked", String(Boolean(enabled)));
}

// ---- The now playing title ----

function renderNowPlayingTitle(text) {
  nowPlayingText = text;
  applyTitleMarquee();
}

// A title that does not fit one line crawls to its end and back, which keeps
// the dock at its single-line height instead of growing a second row into the
// transparent part around it.
function applyTitleMarquee() {
  const title = elements.nowPlayingTitle;
  if (!title) return;
  title.classList.remove("is-marquee");
  title.style.removeProperty("--marquee-distance");
  title.style.removeProperty("--marquee-duration");
  title.replaceChildren(document.createTextNode(nowPlayingText));
  const singleLine = smallViewport.matches || playerDrawer === "collapsed";
  if (!singleLine || reducedMotion.matches) return;
  // The class is applied before the measurement: it is what turns the title
  // into a single clipped line and what keeps the crawl away from the drawer
  // handle, so both decide how much room the title really has.
  title.classList.add("is-marquee");
  title.replaceChildren(marqueeRun(nowPlayingText));
  const distance = title.scrollWidth - title.clientWidth;
  if (distance <= 6) {
    title.classList.remove("is-marquee");
    title.replaceChildren(document.createTextNode(nowPlayingText));
    return;
  }
  title.style.setProperty("--marquee-distance", `${-distance}px`);
  title.style.setProperty("--marquee-duration", `${marqueeDuration(distance)}s`);
}

// One copy of the title, walked left by exactly the part that did not fit. The
// title itself stays where it is and only clips, so the crawl never repeats the
// name and never reaches the controls beside it.
function marqueeRun(text) {
  const run = document.createElement("span");
  run.className = "now-playing-title-run";
  run.textContent = text;
  return run;
}

function marqueeDuration(distance) {
  const seconds = distance / MARQUEE_PIXELS_PER_SECOND / MARQUEE_TRAVEL_SHARE;
  return Math.round(Math.min(MARQUEE_MAX_SECONDS, Math.max(MARQUEE_MIN_SECONDS, seconds)));
}

function normalizeNoticeID(value) {
  const normalized = (value || "").trim().replace(/^W\//, "");
  if (normalized.startsWith('"') && normalized.endsWith('"')) {
    return normalized.slice(1, -1);
  }
  return normalized;
}

async function fingerprintNotice(html) {
  if (globalThis.crypto?.subtle && typeof TextEncoder !== "undefined") {
    try {
      const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(html));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    } catch {
      // Fall through to a deterministic non-cryptographic fingerprint.
    }
  }

  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < html.length; index += 1) {
    const codeUnit = html.charCodeAt(index);
    first = Math.imul(first ^ codeUnit, 0x01000193);
    second = Math.imul(second ^ codeUnit, 0x85ebca6b);
  }
  return `fallback-${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0)
    .toString(16)
    .padStart(8, "0")}-${html.length}`;
}

function updateMediaSession(episode) {
  const mediaSession = getMediaSession();
  if (!mediaSession) return;

  // Some embedded and in-car browsers implement the Media Session actions
  // without exposing MediaMetadata. Keep every capability independently
  // detectable so those browsers still receive transport and seek controls.
  const metadata = {
    title: episode.title,
    artist: sourceName(episode.sourceID),
    album: copy.mediaAlbum,
    artwork: MEDIA_ARTWORK,
  };
  try {
    mediaSession.metadata =
      typeof window.MediaMetadata === "function" ? new window.MediaMetadata(metadata) : metadata;
  } catch {
    // document.title remains a useful metadata fallback for partial clients.
  }

  registerMediaSessionActions();
  updateMediaSessionPlaybackState();
  updateMediaSessionPosition(episode.durationSeconds);
}

function registerMediaSessionActions() {
  const mediaSession = getMediaSession();
  if (!mediaSession || typeof mediaSession.setActionHandler !== "function") return;
  const handlers = {
    play: () => safePlay(),
    pause: () => elements.audio.pause(),
    previoustrack: () => moveInQueue(-1),
    nexttrack: () => moveInQueue(1),
    seekbackward: (details) => seekBy(-(details.seekOffset || DEFAULT_SEEK_OFFSET)),
    seekforward: (details) => seekBy(details.seekOffset || DEFAULT_SEEK_OFFSET),
    seekto: (details) => seekTo(details.seekTime, details.fastSeek),
  };
  for (const [action, handler] of Object.entries(handlers)) {
    try {
      mediaSession.setActionHandler(action, handler);
    } catch {
      // Some in-car browsers expose Media Session but only support a subset.
    }
  }
}

function updateMediaSessionPlaybackState() {
  const mediaSession = getMediaSession();
  if (!mediaSession || !("playbackState" in mediaSession)) return;
  try {
    mediaSession.playbackState = elements.audio.paused ? "paused" : "playing";
  } catch {
    // Playback remains controlled by the media element on partial clients.
  }
}

function updateMediaSessionPosition(fallbackDuration = null) {
  const mediaSession = getMediaSession();
  if (!mediaSession || typeof mediaSession.setPositionState !== "function") return;

  const audioDuration = elements.audio.duration;
  const duration =
    Number.isFinite(audioDuration) && audioDuration > 0 ? audioDuration : fallbackDuration;
  if (!Number.isFinite(duration) || duration <= 0) return;

  const currentTime = Number.isFinite(elements.audio.currentTime) ? elements.audio.currentTime : 0;
  const playbackRate =
    Number.isFinite(elements.audio.playbackRate) && elements.audio.playbackRate > 0
      ? elements.audio.playbackRate
      : 1;
  try {
    mediaSession.setPositionState({
      duration,
      playbackRate,
      position: Math.min(duration, Math.max(0, currentTime)),
    });
  } catch {
    // Invalid or stale media state should not interrupt playback.
  }
}

function clearMediaSessionPosition() {
  const mediaSession = getMediaSession();
  if (!mediaSession || typeof mediaSession.setPositionState !== "function") return;
  try {
    mediaSession.setPositionState();
  } catch {
    // Older clients may not support clearing position state.
  }
}

function seekBy(offset) {
  if (!Number.isFinite(offset)) return;
  seekTo(elements.audio.currentTime + offset);
}

function seekTo(time, fastSeek = false) {
  const duration = elements.audio.duration;
  if (!Number.isFinite(time) || !Number.isFinite(duration) || duration <= 0) return;
  const target = Math.min(duration, Math.max(0, time));
  try {
    if (fastSeek && typeof elements.audio.fastSeek === "function") elements.audio.fastSeek(target);
    else elements.audio.currentTime = target;
  } catch {
    // Ignore seek requests that the current media resource cannot satisfy.
  }
}

function getMediaSession() {
  return "mediaSession" in navigator ? navigator.mediaSession : null;
}

function isDemoMode() {
  if (isAdminPage) return false;
  return new URLSearchParams(window.location.search).get("demo") === "1";
}

function demoPayload() {
  const [today, yesterday, dayBefore] = state.dateOptions;
  const at = (option, hour, minute) => {
    const date = new Date(option.date);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  };
  return {
    sources: [
      { id: "zhihu-daily", name: demoContent.sources[0] },
      { id: "v2ex-hot", name: demoContent.sources[1] },
      { id: "zhihu-topic", name: demoContent.sources[2] },
    ],
    episodes: [
      demoEpisode("demo-1", "zhihu-daily", demoContent.titles[0], at(today, 7, 30)),
      demoEpisode("demo-2", "v2ex-hot", demoContent.titles[1], at(today, 6, 45)),
      demoEpisode("demo-3", "zhihu-topic", demoContent.titles[2], at(today, 5, 40)),
      demoEpisode("demo-4", "zhihu-daily", demoContent.titles[3], at(today, 5, 10)),
      demoEpisode("demo-5", "v2ex-hot", demoContent.titles[4], at(today, 4, 20)),
      demoEpisode("demo-6", "zhihu-topic", demoContent.titles[5], null, at(today, 3, 55), "processing", "tts"),
      demoEpisode("demo-7", "zhihu-daily", demoContent.titles[6], at(yesterday, 20, 15), undefined, "pending"),
      demoEpisode("demo-8", "v2ex-hot", demoContent.titles[7], at(dayBefore, 18, 20), undefined, "failed"),
    ],
  };
}

// The demo page has no backend, so it also shows what a poll-only source
// produces: episodes waiting for a download, one that is downloading, and one
// whose download failed.
function demoEpisode(id, sourceID, title, originalPublishedAt, publishedAt = originalPublishedAt, state = "ready", stage = "") {
  return {
    id,
    source_id: sourceID,
    title,
    audio_url: state === "ready" ? DEMO_AUDIO : "",
    audio_duration_seconds: state === "ready" ? 30 : 0,
    published_at: publishedAt,
    original_published_at: originalPublishedAt,
    state,
    stage,
  };
}

// The demo page walks a download through its stages locally, because polling is
// skipped without a backend.
function simulateDemoDownload(episode) {
  const stages = ["content", "script", "tts", "compose"];
  episode.state = "processing";
  episode.stage = stages[0];
  showToast(stageToast(episode));
  renderEpisodeList();

  let position = 0;
  const timer = window.setInterval(() => {
    position += 1;
    if (position < stages.length) {
      episode.stage = stages[position];
      renderEpisodeList();
      showToast(stageToast(episode));
      return;
    }
    window.clearInterval(timer);
    episode.state = "ready";
    episode.stage = "";
    episode.audioURL = DEMO_AUDIO;
    episode.durationSeconds = 30;
    renderAll();
    showToast(copy.generatingReady);
  }, 2_500);
}

async function setupAdmin() {
  document.title = localeKey === "zh-CN" ? "播客管理" : "Manage podcasts";
  const panel = document.createElement("section");
  panel.className = "admin-panel";
  panel.innerHTML = `<form id="admin-login" class="admin-login">
    <h2>${adminCopy.login}</h2><p>${adminCopy.hint}</p>
    <label for="admin-code">${adminCopy.code}</label>
    <div class="admin-login-controls"><input id="admin-code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required />
    <button type="submit">${adminCopy.login}</button></div>
    </form><p id="admin-message" role="status" aria-live="polite"></p>
    <button id="admin-logout" type="button" hidden>${adminCopy.logout}</button>`;
  elements.dateTabs.before(panel);
  const logoutButton = panel.querySelector("#admin-logout");
  elements.languageSwitcher.before(logoutButton);
  const form = panel.querySelector("form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    try {
      const response = await fetch("/api/v1/admin/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.elements.code.value }),
      });
      form.elements.code.value = "";
      if (!response.ok) {
        adminMessage(response.status === 429 ? adminCopy.rateLimit : response.status === 401 ? adminCopy.loginError : adminCopy.error);
        return;
      }
      adminCSRF = (await response.json()).csrf_token;
      await showAdminPlayer();
    } catch { adminMessage(adminCopy.error); }
    finally { button.disabled = false; }
  });
  logoutButton.addEventListener("click", async () => {
    try {
      const response = await adminFetch("/api/v1/admin/logout", { method: "POST" });
      if (response.ok) showAdminLogin();
      else if (response.status !== 401) adminMessage(adminCopy.error);
    } catch { adminMessage(adminCopy.error); }
  });
  showAdminLogin();
  try {
    const response = await fetch("/api/v1/admin/session", { cache: "no-store" });
    if (response.ok) {
      adminCSRF = (await response.json()).csrf_token;
      await showAdminPlayer();
    } else if (response.status !== 401) adminMessage(adminCopy.error);
  } catch { adminMessage(adminCopy.error); }
}

function adminMessage(message) {
  document.querySelector("#admin-message").textContent = message;
}
function setAdminPlayerVisible(visible) {
  const panel = document.querySelector(".admin-panel");
  panel.classList.toggle("is-authenticated", visible);
  document.body.classList.toggle("admin-authenticated", visible);
  document.body.classList.toggle("admin-locked", !visible);
  if (visible) elements.dateTabs.before(panel);
  else document.querySelector(".app-shell").append(panel);
  for (const element of [elements.dateTabs, elements.sourceFilterSection, elements.episodeRegion, elements.playerDock]) element.hidden = !visible;
  document.querySelector("#admin-login").hidden = visible;
  document.querySelector("#admin-logout").hidden = !visible;
}
function showAdminLogin(message = "") {
  adminCSRF = "";
  window.clearInterval(adminSessionTimer);
  elements.audio.pause();
  setAdminPlayerVisible(false);
  adminMessage(message);
  document.querySelector("#admin-code").focus();
}
async function showAdminPlayer() {
  setAdminPlayerVisible(true);
  await loadPlayer();
  if (!adminCSRF) return;
  adminMessage("");
  window.clearInterval(adminSessionTimer);
  if (adminCSRF) adminSessionTimer = window.setInterval(checkAdminSession, 60_000);
}
async function adminFetch(url, options = {}) {
  const response = await fetch(url, { ...options, cache: "no-store", headers: { ...options.headers, "X-CSRF-Token": adminCSRF } });
  if (response.status === 401) showAdminLogin(adminCopy.expired);
  return response;
}
async function checkAdminSession() {
  if (!adminCSRF || document.hidden) return;
  try { await adminFetch("/api/v1/admin/session"); } catch { /* Actions also verify the session. */ }
}
async function setAdminVisibility(episode) {
  if (adminBusy || !adminCSRF) return;
  adminBusy = true;
  renderEpisodeList();
  try {
    const response = await adminFetch(`/api/v1/admin/episodes/${encodeURIComponent(episode.id)}/visibility`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hidden: !episode.hidden }),
    });
    if (!response.ok) {
      if (response.status !== 401) adminMessage(adminCopy.error);
      return;
    }
    episode.hidden = (await response.json()).hidden;
    adminMessage("");
  } catch { adminMessage(adminCopy.error); }
  finally {
    adminBusy = false;
    renderEpisodeList();
    const page = activeSlide();
    const row = page
      ? [...page.querySelectorAll(".episode-row")].find((item) => item.dataset.episodeId === episode.id)
      : null;
    row?.querySelector(".admin-visibility")?.focus();
  }
}
