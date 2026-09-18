const SPEED_KEY = "rss-pod.player-speed";
const RESUME_KEY = "rss-pod.resume-state";
const DISMISSED_NOTICE_KEY = "rss-pod.dismissed-notice";
const THEME_KEY = "rss-pod.theme";
const THEME_MODES = ["system", "light", "dark"];
const DISPLAY_KEY = "rss-pod.display-mode";
const DISPLAY_MODES = ["date", "category"];
const PLAYER_DRAWER_KEY = "rss-pod.player-drawer";
const PLAYER_DRAWER_MODES = ["expanded", "collapsed"];
const THEME_COLORS = { light: "#f4f9ff", dark: "#0b1420" };
const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)");
const DEMO_AUDIO = "/demo.mp3";
const MEDIA_ARTWORK = [
  { src: "/icons/favicon.png", sizes: "64x64", type: "image/png" },
  { src: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
];
const DEFAULT_SEEK_OFFSET = 10;

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
// The player dock folds into a drawer so the list can take the screen back.
let playerDrawer = readPlayerDrawerPreference();

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

bindPlayerEvents();
bindNoticeEvents();
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
    const payload = isDemoMode() ? demoPayload() : await fetchPlayerData();
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
    for (const source of sourceChoices()) {
      elements.dateTabs.append(
        createTab(
          source.id,
          source.name,
          countEpisodesForSource(source.id),
          state.activeSource === source.id,
          () => selectSlot({ source: source.id }),
        ),
      );
    }
    return;
  }

  for (const option of state.dateOptions) {
    elements.dateTabs.append(
      createTab(
        option.key,
        `${option.relativeLabel} ${option.monthDay}`,
        countEpisodesForDate(option.key),
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

// The feed row always offers "all" first, which is also where a swipe into a
// new date row starts over.
function sourceChoices() {
  return [{ id: "all", name: copy.allSources }, ...state.sources];
}

function renderSourceFilters() {
  // The header tabs already list every feed in category mode, so the second
  // row would only repeat them.
  elements.sourceFilterSection.hidden = displayMode === "category";
  elements.sourceFilters.replaceChildren();
  const sources = sourceChoices();
  for (const source of sources) {
    const button = document.createElement("button");
    button.className = "source-filter";
    button.type = "button";
    button.textContent = source.name;
    button.dataset.source = source.id;
    button.setAttribute("aria-pressed", String(state.activeSource === source.id));
    button.addEventListener("click", () => selectSlot({ source: source.id }));
    elements.sourceFilters.append(button);
  }
}

// The header controls read as one chain rather than as two rows: in date mode
// every date offers the same row of feeds, so a swipe walks those feeds first
// and hands the step over to the following date once the last feed is behind
// it. Category mode has a single row, so there the feeds are the whole chain.
// Every control owns one page of the episode list.
function listSlots() {
  const sources = sourceChoices().map((source) => source.id);
  if (displayMode === "category") return sources.map((source) => ({ date: "", source }));
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
  const option = state.dateOptions.find((candidate) => candidate.key === slot.date);
  const feed = sourceChoices().find((candidate) => candidate.id === slot.source);
  const feedName = feed ? feed.name : slot.source;
  return option ? `${option.relativeLabel} ${option.monthDay} · ${feedName}` : feedName;
}

// The episodes behind one header control. Category mode keeps the whole window
// and orders it by date, so a feed reads as one continuous list; date mode stays
// on the selected day.
function slotEpisodes(slot) {
  const fromSource = (episode) => slot.source === "all" || episode.sourceID === slot.source;
  if (displayMode === "category") return state.episodes.filter(fromSource);
  return state.episodes.filter((episode) => episode.dayKey === slot.date && fromSource(episode));
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
  state.activeSource = slot.source;
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
  for (const episode of slotEpisodes(slot)) fragment.append(createEpisodeRow(episode));
  rows.append(fragment);
  slide.append(rows);
  return slide;
}

function createEpisodeRow(episode) {
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

  // In category mode every row repeats the same feed, so that column carries
  // the publish date instead of the feed name.
  const source = row.querySelector(".episode-source");
  source.classList.toggle("is-date", displayMode === "category");
  source.textContent =
    displayMode === "category" ? episodeDateLabel(episode) : sourceName(episode.sourceID);
  const title = row.querySelector(".episode-title");
  title.textContent = episode.title;
  title.title = episode.title;

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

async function startEpisodeDownload(episode) {
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
      showToast(copy.generatingAlreadyRunning);
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
  state.currentEpisodeID = episode.id;
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
  elements.audio.src = episode.audioURL;
  elements.audio.load();
  applyPlaybackRate();
  document.title = episode.title;
  elements.nowPlayingTitle.textContent = episode.title;
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
  elements.audio.addEventListener("ended", () => moveInQueue(1));
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
  elements.nowPlayingTitle.textContent = copy.chooseEpisode;
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
  const latestEpisode = state.episodes.find(
    (candidate) => availableDateKeys.has(candidate.dayKey) && isPlayable(candidate),
  );
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
