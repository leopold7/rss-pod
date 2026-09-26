const SPEED_KEY = "rss-pod.player-speed";
const RESUME_KEY = "rss-pod.resume-state";
const DISMISSED_NOTICE_KEY = "rss-pod.dismissed-notice";
const THEME_KEY = "rss-pod.theme";
const THEME_MODES = ["system", "light", "dark"];
const DISPLAY_KEY = "rss-pod.display-mode";
const DISPLAY_MODES = ["date", "category"];
const CATEGORY_ICON_KEY = "rss-pod.category-icon";
const DEFAULT_CATEGORY_KEY = "rss-pod.default-category";
const FIRST_VIEW_KEY = "rss-pod.first-view";
const PLAYER_DRAWER_KEY = "rss-pod.player-drawer";
const PLAYER_DRAWER_MODES = ["expanded", "collapsed"];
const LISTEN_LATER_KEY = "rss-pod.listen-later";
// Bookmarks are the second list kept in this browser. They are held to the end:
// their copies are cached and no cache sweep takes them away.
const BOOKMARK_KEY = "rss-pod.bookmark";
const LISTENED_KEY = "rss-pod.listened";
const LATER_AUTO_REMOVE_KEY = "rss-pod.personal-later-auto-remove";
const LATER_AUTO_DOWNLOAD_KEY = "rss-pod.personal-later-auto-download";
const DIM_LISTENED_KEY = "rss-pod.personal-dim-listened";
const PRELOAD_NEXT_KEY = "rss-pod.personal-preload-next";
const LATER_AUTO_CACHE_KEY = "rss-pod.personal-later-auto-cache";
const AUDIO_CACHE_KEY = "rss-pod.audio-cache";
const AUDIO_CACHE_NAME = "rss-pod-audio-v1";
// What the player asked the browser for and what came back. The list is a
// rolling record rather than a transcript, so it stays short enough to be read
// on a phone and copied out in one piece.
const AUDIO_LOG_KEY = "rss-pod.audio-log";
const AUDIO_LOG_LIMIT = 200;
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
// The list keeps a slot of its own for the episodes saved in this browser, and
// a second one for the episodes bookmarked in it. The first tab carries either
// of them in place of "All".
const LATER_SLOT = "later";
const BOOKMARK_SLOT = "bookmark";
// A long press has to be deliberate, and a finger that moves is scrolling or
// paging rather than asking for the row actions.
const LONG_PRESS_MS = 500;
const LONG_PRESS_SLOP = 8;
const LONG_PRESS_CLICK_GUARD_MS = 700;
const LISTENED_LIMIT = 500;
const LISTEN_LATER_LIMIT = 200;
const BOOKMARK_LIMIT = 200;
// Only the episode that is playing and the one after it are worth holding
// locally, so a handful of entries covers a queue and its lookahead.
const AUDIO_CACHE_LIMIT = 5;
// The saved list is checked as a whole, so its copies are fetched a few at a
// time: a listener with a hundred saved episodes should not put a hundred
// requests on the wire the moment the page opens.
const LATER_CACHE_CONCURRENCY = 3;
// The marquee crawls rather than scrolls: about twenty pixels a second, which
// is roughly one character per second, and a whole cycle stays under a minute.
const MARQUEE_PIXELS_PER_SECOND = 20;
const MARQUEE_MIN_SECONDS = 10;
const MARQUEE_MAX_SECONDS = 60;
// The crawl takes a third of the cycle in either direction.
const MARQUEE_TRAVEL_SHARE = 0.34;
// How far, at most, the category row fades out towards the button that opens
// the whole list. A phone shows fewer tabs at once, so the fade is a shorter
// stretch of the row there. It stays a soft edge rather than a wide veil: the
// entry it covers is only just leaving, and the row is read right up to it.
const CATEGORY_FADE_PX = { wide: 56, small: 46 };

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
const ICON_TRASH =
  "M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm80-120h80v-400h-80v400Zm160 0h80v-400h-80v400Z";
const ICON_CHEVRON_DOWN =
  "M469-358q-5-2-10-7L261-563q-9-9-8.5-21.5T262-606q9-9 21.5-9t21.5 9l175 176 176-176q9-9 21-8.5t21 9.5q9 9 9 21.5t-9 21.5L501-365q-5 5-10 7t-11 2q-6 0-11-2Z";
// The two halves of the bookmark star, drawn from the same set: the solid one
// is the mark a bookmarked entry wears on its row, and the hollow one is what
// the menu offers while the entry is still free to be marked.
const ICON_STAR =
  "M480-269 294-157q-8 5-17 4.5t-16-5.5q-7-5-10.5-13t-1.5-18l49-212-164-143q-8-7-9.5-15.5t.5-16.5q2-8 9-13.5t17-6.5l217-19 84-200q4-9 12-13.5t16-4.5q8 0 16 4.5t12 13.5l84 200 217 19q10 1 17 6.5t9 13.5q2 8 .5 16.5T826-544L662-401l49 212q2 10-1.5 18T699-158q-7 5-16 5.5t-17-4.5L480-269Z";
const ICON_STAR_OUTLINE =
  "m323-245 157-94 157 95-42-178 138-120-182-16-71-168-71 167-182 16 138 120-42 178Zm157-24L294-157q-8 5-17 4.5t-16-5.5q-7-5-10.5-13t-1.5-18l49-212-164-143q-8-7-9.5-15.5t.5-16.5q2-8 9-13.5t17-6.5l217-19 84-200q4-9 12-13.5t16-4.5q8 0 16 4.5t12 13.5l84 200 217 19q10 1 17 6.5t9 13.5q2 8 .5 16.5T826-544L662-401l49 212q2 10-1.5 18T699-158q-7 5-16 5.5t-17-4.5L480-269Zm0-206Z";
const ICON_OPEN_IN_NEW =
  "M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z";

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
    categoryIconSettingLabel: "Show the category icon",
    categorySettingLabel: "Default category",
    firstViewSettingLabel: "First category shows",
    categoryTabsLabel: "Choose a feed",
    categoryMenuLabel: "All categories",
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
    sharedDropdown: "Choose all episodes, Listen later or Bookmarks",
    emptyLater: "Nothing saved for later yet",
    personalSettingLabel: "Personalization",
    laterGroupLabel: "Listen later",
    otherGroupLabel: "Other",
    laterAutoRemoveLabel: "Remove played episodes from Listen later",
    laterDownloadLabel: "Move a manual download into Listen later",
    dimListenedLabel: "Dim listened episodes",
    preloadNextLabel: "Load the next episode locally",
    laterCacheLabel: "Cache Listen later episodes locally",
    cachedLocally: "Cached on this device",
    clearCache: "Clear cache",
    cacheCleared: "Cache cleared",
    cacheEmpty: "Nothing cached yet",
    cacheSummary: (size, count) => `Cached ${size} (${count} ${count === 1 ? "episode" : "episodes"})`,
    cacheSummaryUnknown: (count) => `Cached ${count} ${count === 1 ? "episode" : "episodes"} (size unavailable)`,
    cacheClearConfirmMessage: (count) =>
      `This removes ${count} locally cached ${count === 1 ? "episode" : "episodes"} from this device. They download again when played.`,
    addListenLater: "Save for later",
    removeListenLater: "Remove from Listen later",
    clearListenedLater: "Clear listened Listen later",
    clearListenedLaterAction: "Clear listened",
    clearAllLater: "Clear all Listen later",
    clearAllLaterAction: "Clear all",
    laterAdded: "Saved for later",
    laterCleared: "Listen later cleared",
    laterListenedCleared: "Listened episodes cleared",
    emptyListenedLater: "Nothing listened in Listen later yet",
    laterClearConfirmMessage: (count) =>
      `This removes ${count} saved ${count === 1 ? "episode" : "episodes"} from this device, and cannot be undone.`,
    laterListenedClearConfirmMessage: (count) =>
      `This removes ${count} listened ${count === 1 ? "episode" : "episodes"} from the saved list, and cannot be undone.`,
    // Bookmarks are the second list the player keeps in this browser. They are
    // held to the end, so their wording never promises a removal by cache.
    bookmark: "Bookmarks",
    bookmarkTitle: "Bookmarks",
    bookmarkGroupLabel: "Bookmarks",
    viewBookmarks: "View bookmarks",
    emptyBookmarks: "Nothing bookmarked yet",
    addBookmark: "Bookmark",
    removeBookmark: "Remove bookmark",
    bookmarkAdded: "Bookmarked",
    bookmarkRemoved: "Bookmark removed",
    bookmarkMark: "Bookmarked",
    clearBookmarks: "Clear bookmarks",
    clearAllBookmarks: "Clear all bookmarks",
    bookmarkClearConfirmMessage: (count) =>
      `This removes ${count} bookmarked ${count === 1 ? "episode" : "episodes"} from this device, and cannot be undone.`,
    bookmarksCleared: "Bookmarks cleared",
    viewOriginal: "View original",
    closeLabel: "Close",
    confirmCancel: "Cancel",
    confirmClear: "Clear",
    laterUnavailable: "This one cannot be started here",
    playbackFailed: "Could not play that episode. Playback paused.",
    menuDownload: "Download",
    menuRetry: "Download again",
    openEpisodeActions: (title) => `Actions for ${title}`,
    playbackLogLabel: "Playback log",
    playbackLogAction: "View playback log",
    playbackLogTitle: "Playback log",
    playbackLogEmpty: "No playback events recorded yet",
    playbackLogCount: (count, failed) =>
      failed > 0 ? `${count} events · ${failed} failed` : `${count} events`,
    playbackLogFilterLabel: "Filter by level",
    playbackLogFilters: { all: "All", info: "INFO", warn: "WARN", error: "ERROR" },
    playbackLogFilterCount: (shown, total) => `showing ${shown} of ${total} events`,
    playbackLogFilterEmpty: (level) => `No ${level} events`,
    playbackLogCopy: "Copy",
    playbackLogCopied: "Log copied",
    playbackLogCopyFailed: "Could not copy the log",
    playbackLogClear: "Clear",
    playbackLogCleared: "Log cleared",
    playbackLogClose: "Close",
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
    categoryIconSettingLabel: "显示分类图标",
    categorySettingLabel: "默认分类",
    firstViewSettingLabel: "首个分类显示",
    categoryTabsLabel: "选择分类",
    categoryMenuLabel: "所有分类",
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
    sharedDropdown: "在全部、稍后在听与收藏之间切换",
    emptyLater: "还没有稍后在听的内容",
    personalSettingLabel: "个性化设置",
    laterGroupLabel: "稍后在听",
    otherGroupLabel: "其他",
    laterAutoRemoveLabel: "稍后在听自动移除听过的博客",
    laterDownloadLabel: "手动下载自动移动至稍后在听",
    dimListenedLabel: "已听过的标题置灰",
    preloadNextLabel: "自动本地加载下一个博客",
    laterCacheLabel: "稍后再听自动缓存至本地",
    cachedLocally: "已缓存至本地",
    clearCache: "清除缓存",
    cacheCleared: "已清除缓存",
    cacheEmpty: "还没有本地缓存",
    cacheSummary: (size, count) => `已缓存 ${size}（${count} 条）`,
    cacheSummaryUnknown: (count) => `已缓存 ${count} 条（大小不可用）`,
    cacheClearConfirmMessage: (count) => `将从本机移除全部 ${count} 条已缓存的内容，播放时会重新下载。`,
    addListenLater: "稍后在听",
    removeListenLater: "取消稍后在听",
    clearListenedLater: "清空已读稍后在听",
    clearListenedLaterAction: "清空已读",
    clearAllLater: "清空全部稍后在听",
    clearAllLaterAction: "清空全部",
    laterAdded: "已加入稍后在听",
    laterCleared: "已清空稍后在听",
    laterListenedCleared: "已清空已读稍后在听",
    emptyListenedLater: "还没有已读的稍后在听内容",
    laterClearConfirmMessage: (count) =>
      `将从本机移除全部 ${count} 条稍后在听的内容，且无法恢复。`,
    laterListenedClearConfirmMessage: (count) =>
      `将从本机移除全部 ${count} 条已读的稍后在听内容，且无法恢复。`,
    bookmark: "收藏",
    bookmarkTitle: "收藏",
    bookmarkGroupLabel: "收藏",
    viewBookmarks: "查看收藏",
    emptyBookmarks: "还没有收藏的内容",
    addBookmark: "收藏",
    removeBookmark: "取消收藏",
    bookmarkAdded: "已收藏",
    bookmarkRemoved: "已取消收藏",
    bookmarkMark: "已收藏",
    clearBookmarks: "清空收藏",
    clearAllBookmarks: "清空全部收藏",
    bookmarkClearConfirmMessage: (count) => `将从本机移除全部 ${count} 条收藏的内容，且无法恢复。`,
    bookmarksCleared: "已清空收藏",
    viewOriginal: "查看原文",
    closeLabel: "关闭",
    confirmCancel: "取消",
    confirmClear: "清空",
    laterUnavailable: "该条目无法在这里开始下载",
    playbackFailed: "这一条无法播放，已暂停",
    menuDownload: "下载",
    menuRetry: "重新下载",
    openEpisodeActions: (title) => `${title} 的操作`,
    playbackLogLabel: "播放日志",
    playbackLogAction: "查看播放日志",
    playbackLogTitle: "播放日志",
    playbackLogEmpty: "还没有记录到播放事件",
    playbackLogCount: (count, failed) => (failed > 0 ? `${count} 条事件 · ${failed} 条失败` : `${count} 条事件`),
    playbackLogFilterLabel: "按级别筛选",
    playbackLogFilters: { all: "全部", info: "INFO", warn: "WARN", error: "ERROR" },
    playbackLogFilterCount: (shown, total) => `显示 ${shown} / ${total} 条`,
    playbackLogFilterEmpty: (level) => `没有 ${level} 级别的记录`,
    playbackLogCopy: "复制",
    playbackLogCopied: "已复制日志",
    playbackLogCopyFailed: "复制日志失败",
    playbackLogClear: "清空",
    playbackLogCleared: "已清空日志",
    playbackLogClose: "关闭",
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
  settingsScrim: document.querySelector("#settings-scrim"),
  settingsTitle: document.querySelector("#settings-title"),
  settingsThemeSection: document.querySelector("#settings-theme-section"),
  settingsThemeLabel: document.querySelector("#settings-theme-label"),
  settingsDisplayLabel: document.querySelector("#settings-display-label"),
  categoryIconLabel: document.querySelector("#settings-category-icon-label"),
  categoryIconToggle: document.querySelector("#settings-category-icon"),
  settingsCategoryLabel: document.querySelector("#settings-category-label"),
  settingsCategorySelect: document.querySelector("#settings-default-category"),
  settingsFirstViewLabel: document.querySelector("#settings-first-view-label"),
  settingsFirstViewSelect: document.querySelector("#settings-first-view"),
  settingsPersonalLabel: document.querySelector("#settings-personal-label"),
  laterGroupLabel: document.querySelector("#settings-later-group-label"),
  bookmarkGroupLabel: document.querySelector("#settings-bookmark-group-label"),
  otherGroupLabel: document.querySelector("#settings-other-group-label"),
  laterAutoLabel: document.querySelector("#settings-later-auto-label"),
  laterAutoToggle: document.querySelector("#settings-later-auto"),
  laterDownloadLabel: document.querySelector("#settings-later-download-label"),
  laterDownloadToggle: document.querySelector("#settings-later-download"),
  dimListenedLabel: document.querySelector("#settings-dim-label"),
  dimListenedToggle: document.querySelector("#settings-dim"),
  preloadNextLabel: document.querySelector("#settings-preload-label"),
  preloadNextToggle: document.querySelector("#settings-preload"),
  laterCacheLabel: document.querySelector("#settings-later-cache-label"),
  laterCacheToggle: document.querySelector("#settings-later-cache"),
  cacheSummary: document.querySelector("#settings-cache-summary"),
  cacheClear: document.querySelector("#settings-cache-clear"),
  laterListenedClear: document.querySelector("#settings-later-listened-clear"),
  laterClear: document.querySelector("#settings-later-clear"),
  bookmarkView: document.querySelector("#settings-bookmark-view"),
  bookmarkClear: document.querySelector("#settings-bookmark-clear"),
  settingsDiagnosticsLabel: document.querySelector("#settings-diagnostics-label"),
  settingsLogOpen: document.querySelector("#settings-log-open"),
  settingsLogSummary: document.querySelector("#settings-log-summary"),
  logDialog: document.querySelector("#log-dialog"),
  confirmDialog: document.querySelector("#confirm-dialog"),
  confirmTitle: document.querySelector("#confirm-title"),
  confirmMessage: document.querySelector("#confirm-message"),
  confirmCancel: document.querySelector("#confirm-cancel"),
  confirmAccept: document.querySelector("#confirm-accept"),
  bookmarkDialog: document.querySelector("#bookmark-dialog"),
  bookmarkTitle: document.querySelector("#bookmark-title"),
  bookmarkSummary: document.querySelector("#bookmark-summary"),
  bookmarkEmpty: document.querySelector("#bookmark-empty"),
  bookmarkEntries: document.querySelector("#bookmark-entries"),
  bookmarkClose: document.querySelector("#bookmark-close"),
  logTitle: document.querySelector("#log-title"),
  logSummary: document.querySelector("#log-summary"),
  logFilters: document.querySelector("#log-filters"),
  logLevelButtons: [...document.querySelectorAll("[data-log-level]")],
  logEntries: document.querySelector("#log-entries"),
  logCopy: document.querySelector("#log-copy"),
  logClear: document.querySelector("#log-clear"),
  logClose: document.querySelector("#log-close"),
  popupScrim: document.querySelector("#popup-scrim"),
  popupMenu: document.querySelector("#popup-menu"),
  settingsLanguageLabel: document.querySelector("#settings-language-label"),
  settingsGithubLink: document.querySelector("#settings-github-link"),
  themeModeButtons: [...document.querySelectorAll("[data-theme-mode]")],
  displayModeButtons: [...document.querySelectorAll("[data-display-mode]")],
  themeToggle: document.querySelector("#theme-toggle"),
  dateTabs: document.querySelector("#date-tabs"),
  dateTabsRow: document.querySelector("#date-tabs-row"),
  categoryMenuToggle: document.querySelector("#category-menu-toggle"),
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
// The button that opens the whole category list is offered unless it has been
// turned off, so the absence of a stored choice means yes.
let showCategoryIcon = readStoredString(CATEGORY_ICON_KEY) !== "off";
// The feed the list opens on, and what the shared first tab lists. Both are
// applied to the first payload of the page, so a later poll never pulls a
// listener back after they swiped elsewhere. The first tab is read first, since
// a default category saved before it existed migrates into it there.
let firstView = readFirstViewPreference();
let defaultCategory = readDefaultCategoryPreference();
let initialViewApplied = false;
// The player dock folds into a drawer so the list can take the screen back.
let playerDrawer = readPlayerDrawerPreference();
// The episodes saved for later and the ones already played through live in this
// browser, like the preferences above, so they survive a reload on their own.
let listenLater = readListenLaterRecords();
let bookmarks = readBookmarkRecords();
let listened = readListenedRecords();
let laterAutoRemove = readFlag(LATER_AUTO_REMOVE_KEY);
let laterAutoDownload = readFlag(LATER_AUTO_DOWNLOAD_KEY);
let dimListened = readFlag(DIM_LISTENED_KEY);
let preloadNext = readFlag(PRELOAD_NEXT_KEY);
let laterAutoCache = readFlag(LATER_AUTO_CACHE_KEY);
// The first tab of the feed row is shared: it lists every feed until the
// caret switches it to the episodes saved or bookmarked on this device. The
// slot keeps its identity, so switching views never rebuilds the pages behind
// the swipe.
let primaryView = "all";
// The local audio cache is a manifest plus the object URLs that point at the
// blobs it holds; the object URLs only make sense in this page.
let audioCacheIndex = readAudioCacheIndex();
const cachedBlobURLs = new Map();
const preloadElements = new Map();
// The copy being fetched for one URL, so two callers asking for the same audio
// share one request rather than starting a second.
const preloadsInFlight = new Map();
// The menu, a long press, and the marquee each remember one thing at a time.
let popupMenuAnchor = null;
let popupMenuIgnoreClick = false;
let popupMenuOpenedAt = 0;
let suppressClickUntil = 0;
let nowPlayingText = copy.chooseEpisode;
// The playback log belongs to this browser rather than to the deployment, and
// it survives a reload: an episode that failed on a phone can be read in the
// settings panel afterwards, without a console anywhere in sight.
let playbackLog = readPlaybackLog();
// The window opens on every level and a level is only hidden until the page is
// reloaded, so a failure is never out of sight by accident.
let logLevelFilter = "all";

applyLocale();
initTheme();
initSettings();
initPlayerDrawer();
initConfirmDialog();
initBookmarkDialog();

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
renderFirstViewSetting();
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
  // It is also a fresh look at the saved list: entering the page is when a
  // copy that was cleared, or one that was never made, is asked for again.
  cacheHeldEpisodes();
  // And it is the moment a start the browser stopped while the page was away is
  // asked for again: being seen is the one thing that start was missing.
  resumePendingPlayback();
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
initCategoryMenu();
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
    // The saved list is checked once the page has its episodes, which is where
    // an episode that was cleared from this device is fetched again.
    cacheHeldEpisodes();
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
  applyInitialView();
  renderCategorySetting();
  renderFirstViewSetting();
  syncHeldSnapshots();
}

// The opening view only applies to the first payload of the page: a poll that
// lands later has to leave the page the listener swiped to alone. The default
// feed picks the slot and the first tab keeps its own display choice, so the
// two settings never overwrite each other.
function applyInitialView() {
  if (initialViewApplied) return;
  initialViewApplied = true;
  primaryView = firstView;
  state.activeSource = resolveCategory(defaultCategory);
}

// A running download is the only reason to poll: an episode of one moves a
// stage on every few seconds, and the page that was reloaded mid-download read
// the window it shows as it opened.
function scheduleRefresh() {
  window.clearTimeout(refreshTimer);
  refreshTimer = 0;
  if (isDemoMode() || document.hidden) return;
  if (isAdminPage && !adminCSRF) return;
  if (downloadingEpisodeIDs().length === 0) return;
  refreshTimer = window.setTimeout(refreshEpisodeProgress, REFRESH_INTERVAL);
}

// The episodes a poll has something to learn about.
function downloadingEpisodeIDs() {
  return state.episodes.filter((episode) => episode.state === "processing").map((episode) => episode.id);
}

// A tick of the poll asks for the rows of the running downloads rather than for
// the window again: the page already holds every other row, and one download
// names a handful of episodes. The window itself is read when the page is
// opened or comes back to the front, which is where a new episode, a different
// day, or the feed list shows up.
async function refreshEpisodeProgress() {
  window.clearTimeout(refreshTimer);
  refreshTimer = 0;
  const ids = downloadingEpisodeIDs();
  if (ids.length === 0) return;
  try {
    const episodes = await fetchEpisodeProgress(ids);
    if (episodes === null) return;
    applyEpisodeProgress(ids, episodes);
    renderAll();
  } catch (error) {
    console.error("refresh episode progress", error);
  } finally {
    scheduleRefresh();
  }
}

// The answer replaces the rows it names and drops the ones it leaves out. An
// episode a download failed on is no longer listed, which is what reading the
// whole window used to say by leaving that row out as well.
function applyEpisodeProgress(ids, episodes) {
  const updates = new Map();
  for (const episode of episodes) {
    const normalized = normalizeEpisode(episode);
    if (normalized.id) updates.set(normalized.id, normalized);
  }
  const watched = new Set(ids);
  state.episodes = state.episodes
    .filter((episode) => !watched.has(episode.id) || updates.has(episode.id))
    .map((episode) => updates.get(episode.id) || episode)
    // A row that just arrived keeps the place its own timestamp gives it, the
    // same way reading the window again would place it.
    .sort((a, b) => b.sortTime - a.sortTime);
  syncHeldSnapshots();
}

async function fetchEpisodeProgress(ids) {
  const params = new URLSearchParams({ ids: ids.join(",") });
  const response = await fetch(
    `/api/v1/${isAdminPage ? "admin" : "player"}/episodes?${params}`,
    { headers: { Accept: "application/json" } },
  );
  if (isAdminPage && response.status === 401) {
    showAdminLogin(adminCopy.expired);
    return null;
  }
  if (!response.ok) throw new Error(`episode progress returned ${response.status}`);
  const payload = await response.json();
  return Array.isArray(payload.episodes) ? payload.episodes : [];
}

// The whole window: the feed list and every row the list shows, which is more
// than a poll needs but is what an opening page or a stale one asks for.
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
  // The bookmark window shows the same rows as the page, so it follows every
  // redraw. It writes nothing while it is closed.
  renderBookmarks();
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
        shared ? countForPrimaryView(choice.id) : countEpisodesForSource(choice.id),
        state.activeSource === choice.id,
        () => selectSlot({ source: choice.id }),
      );
      elements.dateTabs.append(shared ? createSharedControl(tab) : tab);
    });
    syncCategoryMenu();
    return;
  }

  // A day tab counts the whole day, never the saved episodes of it: the number
  // is how the listener reads where the list has something, and the saved view
  // is a personalisation the dates next to it are not about.
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
  syncCategoryMenu();
}

// Where the layout puts the feeds decides where the button goes with them: the
// header tabs carry them while the list is grouped by feed, and the row of
// sources under the header carries them while it is grouped by date. The row
// that is left over goes back to plain.
function categoryRow() {
  return displayMode === "category" ? elements.dateTabs : elements.sourceFilters;
}

function categoryRowHost() {
  return displayMode === "category" ? elements.dateTabsRow : elements.sourceFilterSection;
}

// The category row is measured rather than guessed at: a deployment that
// follows many feeds gives it more entries than it can show, and only then does
// the button beside it appear. The fade is a class of its own, so the row stays
// plain while everything fits.
function syncCategoryMenu() {
  const toggle = elements.categoryMenuToggle;
  const row = categoryRow();
  if (!toggle || !row) return;
  for (const other of [elements.dateTabs, elements.sourceFilters]) {
    if (other && other !== row) {
      other.classList.remove("has-overflow");
      other.style.removeProperty("--category-fade");
    }
  }
  // The button follows the row it belongs to, so switching the layout moves it
  // instead of leaving a second copy of it behind.
  const host = categoryRowHost();
  if (host && toggle.parentElement !== host) host.append(toggle);
  // The row is only offered the button -- and the fade that goes with it --
  // while the switch in the settings panel asks for it.
  const scrollable = showCategoryIcon && row.scrollWidth - row.clientWidth > 1;
  if (!scrollable) closeCategoryMenu();
  toggle.hidden = !scrollable;
  row.classList.toggle("has-overflow", scrollable);
  syncCategoryFade();
}

// How far the row fades out towards the button. The fade reaches as far as the
// entries that are still hidden beyond the edge, and no further: at the end of
// the scroll there is nothing left to fade towards, so the entry beside the
// button is drawn whole. The value lives in a custom property the row is masked
// with.
function syncCategoryFade() {
  const row = categoryRow();
  if (!row) return;
  const limit = smallViewport.matches ? CATEGORY_FADE_PX.small : CATEGORY_FADE_PX.wide;
  const hidden = row.classList.contains("has-overflow")
    ? row.scrollWidth - row.clientWidth - row.scrollLeft
    : 0;
  const fade = `${Math.round(Math.max(0, Math.min(limit, hidden)))}px`;
  if (row.style.getPropertyValue("--category-fade") !== fade) {
    row.style.setProperty("--category-fade", fade);
  }
}

// The button opens the row as a menu: every feed the deployment follows, the
// whole list, and the episodes saved on this device. It is the same menu the
// "all" caret opens, with the feeds the row can only reach by scrolling added
// to it, and it reads the same in either layout -- while the list is grouped by
// date a feed filters the day that is on screen, which is what its count says.
// Exactly one entry is ticked, and it is the page in front -- the same control
// the row marks -- so the two never disagree about where the listener is. The
// first tab is the page in front of a feed only while it is really the one
// showing: the saved list carries that tab while the first tab is set to it,
// and a feed carries its own entry either way.
function openCategoryMenu() {
  const toggle = elements.categoryMenuToggle;
  if (!toggle) return;
  const byView = primaryView;
  const onFirstTab = state.activeSource === "all";
  openPopupMenu({
    anchor: toggle,
    label: copy.categoryMenuLabel,
    items: [
      {
        label: copy.allSources,
        count: menuCount("all"),
        checked: byView === "all" && onFirstTab,
        onSelect: () => selectPrimarySource("all"),
      },
      {
        label: copy.listenLater,
        count: menuCount(LATER_SLOT),
        checked: byView === LATER_SLOT && onFirstTab,
        onSelect: () => selectPrimarySource(LATER_SLOT),
      },
      {
        label: copy.bookmark,
        count: menuCount(BOOKMARK_SLOT),
        checked: byView === BOOKMARK_SLOT && onFirstTab,
        onSelect: () => selectPrimarySource(BOOKMARK_SLOT),
      },
      ...state.sources.map((source) => ({
        label: source.name,
        count: menuCount(source.id),
        checked: state.activeSource === source.id,
        onSelect: () => selectPrimarySource(source.id),
      })),
    ],
  });
}

// How many episodes an entry would put on the page, counted the way that page
// counts them: the whole three-day window while the list is grouped by feed and
// the day in front while it is grouped by date. That is the number the same
// choice carries in the tab row, so the menu and the row agree.
function menuCount(sourceID) {
  // The bookmark page is a local list and never splits by day, so its count is
  // the whole list whichever layout is on screen.
  if (sourceID === BOOKMARK_SLOT) return bookmarkEpisodes().length;
  const episodes = sourceID === LATER_SLOT ? listenLaterEpisodes() : state.episodes;
  const day = displayMode === "date" ? state.activeDate : "";
  return episodes.filter(
    (episode) =>
      (sourceID === LATER_SLOT || inSource(episode, sourceID)) && (!day || episode.dayKey === day),
  ).length;
}

// A menu entry picks the page the row would have picked. The two entries that
// name the first tab -- the whole list and the saved list -- also set what that
// tab carries. A feed is only a page beside it, so reaching one leaves the tab
// as the listener set it: walking the feeds is not a way of putting the whole
// list back in its place.
function selectPrimarySource(sourceID) {
  if (sourceID === LATER_SLOT || sourceID === BOOKMARK_SLOT) {
    setPrimaryView(sourceID);
    selectSlot({ source: "all" });
    return;
  }
  if (sourceID === "all") setPrimaryView("all");
  selectSlot({ source: sourceID });
}

function closeCategoryMenu() {
  if (popupMenuAnchor === elements.categoryMenuToggle) closePopupMenu();
}

function initCategoryMenu() {
  const toggle = elements.categoryMenuToggle;
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    if (popupMenuAnchor === toggle) closePopupMenu();
    else openCategoryMenu();
  });
  // Either row can be the one the feeds are listed in, so both report their
  // scrolling; the measurement of that row is taken again on every redraw and
  // whenever the viewport changes.
  for (const row of [elements.dateTabs, elements.sourceFilters]) {
    row?.addEventListener("scroll", () => syncCategoryFade(), { passive: true });
  }
  window.addEventListener("resize", () => syncCategoryMenu());
  syncCategoryMenu();
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
// The click that opens the menu is listened for on the group rather than on the
// caret, which is a small square in a row that is far taller: the whole control
// answers to the menu, so no tap lands beside the caret and does nothing. The
// label keeps picking its slot whenever that is a change; a press on a label
// that is already the one in front has nothing left to do, so it opens the menu
// instead of swallowing the tap.
function createSharedControl(button) {
  const group = document.createElement("div");
  group.className = "shared-control";
  const caret = createTabDropdown();
  group.append(button, caret);
  // Both rows mark the control in front in their own way -- a tab through
  // aria-selected, a filter through aria-pressed -- and the mark is read while
  // the control is built, before a click can change what it stands for.
  const inFront =
    button.getAttribute("aria-selected") === "true" ||
    button.getAttribute("aria-pressed") === "true";
  // The label redraws the row it lives in through its own handler, which closes
  // the menu and takes the caret with it, so both the row and the open menu have
  // to be read on the way down -- the label has run by the time the group sees
  // the click.
  let menuWasOpen = false;
  let row = null;
  group.addEventListener(
    "click",
    () => {
      row = group.parentElement;
      menuWasOpen =
        !elements.popupMenu.hidden &&
        Boolean(popupMenuAnchor?.classList.contains("date-tab-caret"));
    },
    true,
  );
  group.addEventListener("click", (event) => {
    // A label that is not the one in front picks its slot on its own.
    if (button.contains(event.target) && !inFront) return;
    event.stopPropagation();
    if (menuWasOpen) {
      closePopupMenu();
      return;
    }
    // The menu hangs off the caret that stands in the row now, not off the one
    // this click was made on if the label has just redrawn it.
    toggleAllDropdown(row?.querySelector(".date-tab-caret") || caret);
  });
  return group;
}

// The shared first tab switches between every feed and the entries saved on
// this device, so the saved list needs no tab of its own. It stays a control of
// its own for the accent, the title and the focus ring; the group it sits in is
// what listens for the click.
function createTabDropdown() {
  const button = document.createElement("button");
  button.className = "date-tab-caret";
  button.type = "button";
  button.dataset.tabDropdown = "all";
  button.setAttribute("aria-haspopup", "menu");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", copy.sharedDropdown);
  button.title = copy.sharedDropdown;
  button.append(createIcon(ICON_CHEVRON_DOWN, "date-tab-caret-icon"));
  return button;
}

function toggleAllDropdown(anchor) {
  if (popupMenuAnchor === anchor) {
    closePopupMenu();
    return;
  }
  openPopupMenu({
    anchor,
    label: copy.sharedDropdown,
    items: [
      {
        label: copy.allSources,
        checked: primaryView === "all",
        onSelect: () => setPrimaryView("all"),
      },
      {
        label: copy.listenLater,
        checked: primaryView === LATER_SLOT,
        onSelect: () => setPrimaryView(LATER_SLOT),
      },
      {
        label: copy.bookmark,
        checked: primaryView === BOOKMARK_SLOT,
        onSelect: () => setPrimaryView(BOOKMARK_SLOT),
      },
    ],
  });
}

// What the shared first tab carries is a three-way choice; anything else the
// storage of an older visit may hold falls back to the whole list.
function normalizePrimaryView(view) {
  return view === LATER_SLOT || view === BOOKMARK_SLOT ? view : "all";
}

// The shared tab swaps what it lists: every feed, the episodes saved on this
// device, or the ones bookmarked in it. The pages behind the swipe are rebuilt
// in place, so the tab the listener is on stays where it is.
function setPrimaryView(view) {
  const next = normalizePrimaryView(view);
  if (next === primaryView) return;
  primaryView = next;
  renderAll();
}

// The feed row always offers "all" first, which is also where a swipe into a
// new date row starts over. The saved and the bookmarked slots only join the row
// when the list is grouped by feed, because they belong to no single day.
function sourceChoices() {
  return [{ id: "all", name: copy.allSources }, ...state.sources];
}

// The name the shared control carries: it stands for the whole list until the
// caret, the row menu or the first-view setting sends it to a stored list.
function sharedSlotLabel() {
  if (primaryView === LATER_SLOT) return copy.listenLater;
  if (primaryView === BOOKMARK_SLOT) return copy.bookmark;
  return copy.allSources;
}

// The row opens with one shared tab and then one tab per feed.
function categoryChoices() {
  return [{ id: "all", name: sharedSlotLabel() }, ...state.sources];
}

// The number the shared tab carries. A stored list counts itself; the whole
// list counts the feed it stands for.
function countForPrimaryView(sourceID) {
  if (primaryView === LATER_SLOT) return listenLaterEpisodes().length;
  if (primaryView === BOOKMARK_SLOT) return bookmarkEpisodes().length;
  return countEpisodesForSource(sourceID);
}

// The shared "all" control lists the saved episodes while the personalisation
// view is on. It works in either layout, because the saved list belongs to no
// single day and to no single feed.
function showsListenLater(slot) {
  return primaryView === LATER_SLOT && slot?.source === "all";
}

// The same control carries the bookmarks while that view is on. Its page is the
// one list that never splits by day.
function showsBookmarks(slot) {
  return primaryView === BOOKMARK_SLOT && slot?.source === "all";
}

// Either stored list is on screen, or a row of the bookmark window, which is a
// stored list drawn outside the page. Both mix feeds and days, so the rows they
// draw name the feed an episode came from rather than the day it was published,
// and the player follows the list rather than the window.
function showsStoredList(slot) {
  return showsListenLater(slot) || showsBookmarks(slot) || slot?.source === BOOKMARK_SLOT;
}

function renderSourceFilters() {
  // The header tabs already list every feed in category mode, so the second
  // row would only repeat them.
  elements.sourceFilterSection.hidden = displayMode === "category";
  elements.sourceFilters.replaceChildren();
  const sources = sourceChoices();
  for (const source of sources) {
    const shared = source.id === "all";
    const button = document.createElement("button");
    button.className = "source-filter";
    button.type = "button";
    button.textContent = shared ? sharedSlotLabel() : source.name;
    button.dataset.source = source.id;
    button.setAttribute("aria-pressed", String(state.activeSource === source.id));
    button.addEventListener("click", () => selectSlot({ source: source.id }));
    // "All" carries the same caret here as it does in the feed row, so the
    // saved list is reachable without changing the layout.
    elements.sourceFilters.append(shared ? createSharedControl(button) : button);
  }
  // The sources are the category row in this layout, and the row may have just
  // come back on screen, so the button beside them is measured here too.
  syncCategoryMenu();
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
  if (showsBookmarks(slot)) return copy.bookmark;
  const option = state.dateOptions.find((candidate) => candidate.key === slot.date);
  const feedName = sourceName(slot.source);
  return option ? `${option.relativeLabel} ${option.monthDay} · ${feedName}` : feedName;
}

// The episodes behind one header control. Category mode keeps the whole window
// and orders it by date, so a feed reads as one continuous list; date mode stays
// on the selected day. The saved-for-later slot ignores both and shows what this
// browser holds, newest save first.
function slotEpisodes(slot) {
  // The bookmark page is a list held in this browser rather than a slice of the
  // window, so it is never narrowed to the day in front: a day tab stays a day
  // tab for everything else, and the bookmarks are simply all there.
  if (showsBookmarks(slot)) return bookmarkEpisodes();
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

// The list is one page per header control, and every page is redrawn together
// so a row shows the same episode state wherever it appears. A poll changes
// little, though: an episode moves one stage on. So the pages, and the rows
// inside them, are kept and only brought up to date -- replacing them tore the
// whole list down and built it again on every tick, icons, animations and
// painted layers included, which is what made it blink while a download ran.
function renderEpisodeList() {
  // A finger on the list owns it for the moment: a poll that lands mid-swipe
  // would replace the page under it.
  if (slider && slider.touching) return;
  const wrapper = elements.episodeWrapper;
  const pages = new Map();
  for (const slide of wrapper.children) pages.set(slide.dataset.slot, slide);

  // Swiper reads the pages in the order of the header controls, so the ones
  // that stay are only moved when the chain they are in has changed.
  const slots = listSlots();
  let reference = wrapper.firstElementChild;
  for (const slot of slots) {
    const key = slotKey(slot);
    let slide = pages.get(key);
    if (slide) {
      pages.delete(key);
      // The page is already there, so it keeps the position it is scrolled to
      // and only the rows that changed are written.
      updateEpisodeSlide(slide, slot);
    } else {
      slide = createEpisodeSlide(slot);
    }
    if (slide === reference) reference = reference.nextElementSibling;
    else wrapper.insertBefore(slide, reference);
  }
  // A page the header no longer offers leaves with the slot that named it.
  for (const slide of pages.values()) slide.remove();

  const index = activeSlotIndex(slots);
  if (slider) {
    slider.update();
    if (index >= 0 && index !== slider.activeIndex) slider.slideTo(index, 0);
  } else if (index >= 0) {
    // The fallback keeps the page the header controls picked in front.
    wrapper.children[index]?.classList.add("swiper-slide-active");
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

// A page that is already on screen keeps its rows: the ones whose episode is
// still listed are written afresh, the ones that arrived are added, and the
// ones the page no longer lists are dropped.
function updateEpisodeSlide(slide, slot) {
  // Swiper labels a page by its position; the day and the feed read better.
  slide.setAttribute("aria-label", slotLabel(slot));
  renderEpisodeRows(slide.querySelector(".episode-rows"), slotEpisodes(slot), slot);
}

// Rows are matched by episode id rather than by position, so a poll only writes
// the row it moved and every other row keeps the node -- and the icon element
// inside it -- that it already had.
function renderEpisodeRows(rows, episodes, slot) {
  if (!rows) return;
  const present = new Map();
  for (const row of rows.children) present.set(row.dataset.episodeId, row);

  let reference = rows.firstElementChild;
  for (const episode of episodes) {
    let row = present.get(episode.id) || null;
    if (row) {
      present.delete(episode.id);
      updateEpisodeRow(row, episode, slot);
    } else {
      row = createEpisodeRow(episode, slot);
    }
    if (row === reference) reference = reference.nextElementSibling;
    else rows.insertBefore(row, reference);
  }
  for (const row of present.values()) row.remove();
}

function createEpisodeRow(episode, slot = null) {
  const row = elements.rowTemplate.content.firstElementChild.cloneNode(true);
  row.dataset.episodeId = episode.id;
  // A row outlives the payload it was built from, so its actions read the
  // episode the list shows now instead of the copy the row was built with.
  const live = () => findEpisode(episode.id) || episode;

  const playButton = row.querySelector(".episode-play-button");
  playButton.addEventListener("click", () => activateEpisode(live()));

  row.tabIndex = 0;
  row.addEventListener("click", (event) => {
    if (event.target.closest("button, a, input")) return;
    activateEpisode(live());
  });
  row.addEventListener("keydown", (event) => {
    if (event.target !== row || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    activateEpisode(live());
  });
  bindRowContextMenu(row, live);

  // The mark of a locally held copy is built once with the row, because a row
  // outlives the cache entry it was built beside and only ever toggles it.
  const cached = row.querySelector(".episode-cached");
  cached.append(createIcon(ICON_CHECK, "episode-cached-icon"));
  cached.setAttribute("role", "img");
  cached.setAttribute("aria-label", copy.cachedLocally);
  cached.title = copy.cachedLocally;

  // The star of a bookmarked episode is built the same way and sits beside it.
  const bookmarked = row.querySelector(".episode-bookmark");
  bookmarked.append(createIcon(ICON_STAR, "episode-bookmark-icon"));
  bookmarked.setAttribute("role", "img");
  bookmarked.setAttribute("aria-label", copy.bookmarkMark);
  bookmarked.title = copy.bookmarkMark;

  updateEpisodeRow(row, episode, slot);
  return row;
}

// Everything a row says about its episode. A row that stays on the page is
// written through here, so nothing may assume this runs only once: every write
// is guarded, and a row that did not change is not touched at all.
function updateEpisodeRow(row, episode, slot = null) {
  const isCurrent = episode.id === state.currentEpisodeID;
  const isPlaying = isCurrent && !elements.audio.paused;
  const controlLabel = episodeControlLabel(episode, isPlaying);

  row.classList.toggle("is-current", isCurrent);
  row.classList.toggle("is-playing", isPlaying);
  row.classList.toggle("is-generating", episode.state === "processing");
  row.classList.toggle("is-generation-failed", episode.state === "failed");
  row.setAttribute("aria-label", controlLabel);

  const playButton = row.querySelector(".episode-play-button");
  playButton.dataset.state = episode.state;
  playButton.setAttribute("aria-label", controlLabel);
  playButton.title = controlLabel;
  // A download that is still on the same stage keeps its pulse: writing the
  // source it already has would start that animation over.
  const icon =
    episode.state === "ready" && isPlaying ? "/icons/pause.svg" : episodeControlIcon(episode);
  const playIcon = playButton.querySelector("img");
  if (playIcon.getAttribute("src") !== icon) playIcon.src = icon;

  // In category mode every row repeats the same feed, so that column carries
  // the publish date instead of the feed name; a page of stored entries mixes
  // feeds and keeps the names instead.
  const byDate = displayMode === "category" && !showsStoredList(slot);
  const source = row.querySelector(".episode-source");
  source.classList.toggle("is-date", byDate);
  const sourceLabel = byDate ? episodeDateLabel(episode) : sourceName(episode.sourceID);
  if (source.textContent !== sourceLabel) source.textContent = sourceLabel;

  // The badge a source rule adds stays beside that column, which carries the
  // feed name or the date. It only takes space once it has a text.
  const tag = row.querySelector(".episode-tag");
  const tagLabel = tagText(episode.tag);
  if (tag.textContent !== tagLabel) tag.textContent = tagLabel;
  tag.classList.toggle("is-visible", tagLabel !== "");

  // A copy this device holds is marked beside that same column, which is the
  // one that names the episode's feed or its date.
  const cached = row.querySelector(".episode-cached");
  cached.hidden = !isEpisodeCached(episode);

  // A bookmark is marked beside it, so an episode that is both held and
  // bookmarked shows the two marks together.
  const bookmarked = row.querySelector(".episode-bookmark");
  if (bookmarked) bookmarked.hidden = !inBookmarks(episode.id);

  // The heading can also hold the admin badge, so the title is written into a
  // text node of its own rather than replacing everything the heading holds.
  const title = row.querySelector(".episode-title");
  const titleText = titleTextNode(title);
  if (titleText.textContent !== episode.title) titleText.textContent = episode.title;
  if (title.title !== episode.title) title.title = episode.title;
  // Dimming is a personalisation choice, so a listened title only greys out
  // once the listener asked for it.
  title.classList.toggle("is-listened", dimListened && isListened(episode.id));

  const time = row.querySelector(".episode-time");
  renderEpisodeDuration(time, episode.durationSeconds);

  updateRowVisibility(row, title, episode);
}

// The title carries the admin badge beside its text, so the text lives in a
// node of its own that can be rewritten without dropping that badge.
function titleTextNode(title) {
  for (const node of title.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) return node;
  }
  const text = document.createTextNode("");
  title.prepend(text);
  return text;
}

// Visibility only applies to published episodes, which are the playable ones,
// and only on the admin page, which is the one that carries the control.
function updateRowVisibility(row, title, episode) {
  if (!isAdminPage) return;
  const canHide = Boolean(adminCSRF) && isPlayable(episode);
  row.classList.toggle("admin-episode-row", canHide);
  if (!canHide) {
    row.classList.remove("is-hidden");
    row.querySelector(".admin-visibility")?.remove();
    title.querySelector(".admin-hidden-badge")?.remove();
    return;
  }
  row.classList.toggle("is-hidden", episode.hidden);
  const button = row.querySelector(".admin-visibility") || createVisibilityButton(row, episode.id);
  button.textContent = episode.hidden ? adminCopy.restore : adminCopy.hide;
  button.setAttribute("aria-label", `${button.textContent}: ${episode.title}`);
  button.disabled = adminBusy;
  const badge = title.querySelector(".admin-hidden-badge");
  if (episode.hidden && !badge) {
    const next = document.createElement("span");
    next.className = "admin-hidden-badge";
    next.textContent = adminCopy.hidden;
    title.prepend(next);
  } else if (!episode.hidden && badge) {
    badge.remove();
  }
}

function createVisibilityButton(row, episodeID) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "admin-visibility";
  button.addEventListener("click", () => {
    const live = findEpisode(episodeID);
    if (live) setAdminVisibility(live);
  });
  row.append(button);
  return button;
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
      await requestPlayback();
    } else {
      pausePlayback();
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

// The selection the element is being prepared for. Looking the copy of an
// episode up is the one step here that waits, so a selection that lands while
// it waits is recognised by its number and never gets the element.
let selectionSerial = 0;

// The element is given its source once the copy this browser holds - if there
// is one - has been turned back into an address it can play.
async function selectEpisode(episode, { autoplay = false, resumeAt = 0 } = {}) {
  // Every selection takes a number of its own, so a copy that is read back for
  // the episode before this one never lands on the element after it.
  const selection = ++selectionSerial;
  // Moving on is the moment the episode before this one is behind the
  // listener, which is when the saved list may let go of it.
  const previousEpisodeID = state.currentEpisodeID;
  state.currentEpisodeID = episode.id;
  // A selection that is not meant to play leaves the dock stopped on purpose.
  playingIntent = Boolean(autoplay);
  if (previousEpisodeID && previousEpisodeID !== episode.id) {
    releaseListenedFromListenLater(previousEpisodeID);
  }
  state.restoringResume = resumeAt > 0;
  // A selection is the listener moving on: a start a hidden page stopped is not
  // waited for any more, and the element is handed back with the sound on,
  // because the copy this selection plays is the one the listener asked for.
  clearPendingResume();
  clearBackgroundStart();
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
  // Every selection is a new source, so its probe starts out unanswered, and an
  // attempt the player scheduled for the episode before this one is dropped.
  probedSourceURL = "";
  cancelScheduledRetry();
  // The selection claims the element before the copy it plays is looked up, so
  // the listener who asks for another episode in the meantime wins. What the
  // copy decides is the address: one this browser holds is what lets the
  // episode play without asking the network for it again.
  const source = retrySourceURL(await audioSourceFor(episode));
  if (selection !== selectionSerial) return;
  elements.audio.src = source;
  elements.audio.load();
  // The chosen source is the first thing the log needs: a local copy that fails
  // and a remote file that fails are two different problems.
  logPlayback("info", autoplay ? "select and play" : "select", {
    episode: episode.id,
    source: source.startsWith("blob:") ? "cache" : "remote",
    duration: episode.durationSeconds || "",
    url: source,
  });
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

// The element is asked to play and its answer is reported: a request that is
// refused - the browser's autoplay rule, a source it cannot use - is a failure
// like a stall. A request a newer source interrupted is the exception, because
// the selection or the retry behind it already asks again.
async function safePlay(episodeID = state.currentEpisodeID) {
  playingIntent = true;
  playRequestedAt = Date.now();
  // A start a page nobody can see is not allowed to make sound, so a start made
  // while the page is hidden asks for a muted one - which is always allowed to
  // run - and the watch behind it takes the mute off once the audio really
  // runs. The mark keeps that mute the player's own: a start the page can be
  // seen for, or one that is refused outright, takes it back at once, so the
  // element is never left silent without the player knowing why.
  // Audio that is already running is not a start: it is left alone, and any
  // mute left over from an earlier one is taken off it instead of being put on.
  const hiddenStart = document.hidden && elements.audio.paused;
  if (hiddenStart && !mutedForBackgroundStart) {
    mutedForBackgroundStart = true;
    elements.audio.muted = true;
    logPlayback("info", "background start", audioDiagnostics());
  } else if (!hiddenStart && mutedForBackgroundStart) {
    clearBackgroundStart();
  }
  try {
    await elements.audio.play();
  } catch (error) {
    // A start that was refused never ran, so it does not keep the mute.
    if (hiddenStart) clearBackgroundStart();
    if (!isDemoMode()) console.error("play audio", error);
    // A request a newer source interrupted is expected on every retry, so it is
    // recorded but never treated as a failure of its own.
    if (error?.name === "AbortError") {
      logPlayback("info", "play() aborted", { reason: "the source was requested again" });
      return;
    }
    logPlayback("error", "play() refused", {
      ...audioDiagnostics(),
      reason: `${error?.name || "Error"}: ${error?.message || ""}`,
    });
    // A source the element has already refused has spent its attempt: the play()
    // that is refused on top of it is the same failure reported twice, and
    // counting it twice would cost half of the attempts the player has.
    if (episodeID && episodeID === state.currentEpisodeID && !sourceWasRefused()) handlePlaybackFailure();
    return;
  }
  // The start is watched from here: muted audio that really runs, and a mute
  // that comes off without the browser stopping the episode behind it.
  if (hiddenStart) watchBackgroundStart(episodeID, "muted");
}

// A listener who asks for audio again gets a full set of attempts back; the
// retries the player spends on its own belong to one run of one episode.
async function requestPlayback() {
  playFailures = 0;
  // A listener who asks again asks for the audio now, so a start that was left
  // waiting for the page is not waited for any more.
  clearPendingResume();
  // A listener who asks again also asks the source again: the same question put
  // to the network a moment later can have a different answer.
  probedSourceURL = "";
  // The attempt the player had scheduled for itself is not waited for either.
  cancelScheduledRetry();
  // An element that has already refused its source does not fetch it again for a
  // play(), it refuses again at once. Selecting the episode over is what putting
  // a source back together means, and it starts where the episode had stopped.
  if (elements.audio.error) {
    const episode = findEpisode(state.currentEpisodeID);
    if (episode) {
      // Selecting the episode over puts the source back together; the wait is
      // for the copy it plays, which is looked up before the element is given
      // it, so the play() behind this is not refused by the old source again.
      await selectEpisode(episode, { autoplay: true, resumeAt: elements.audio.currentTime || 0 });
      return;
    }
  }
  return safePlay();
}

// The one place that stops playback on purpose, so a pause the listener or the
// lock screen asked for is never mistaken for a failure and retried.
function pausePlayback() {
  playingIntent = false;
  // A stop the listener asked for also ends the attempt the player had scheduled
  // for itself, and it ends the start a hidden page was waiting to make: coming
  // back to the page must not play an episode the listener stopped.
  cancelScheduledRetry();
  clearPendingResume();
  clearBackgroundStart();
  elements.audio.pause();
}

// An episode that never starts is the one failure a listener cannot see: the
// screen is off, the row still says it is playing, and the element waits for
// bytes that never arrive. Every failure gets the same answer - the source is
// asked for again - and the attempts are spent one at a time. When they run out
// the player stops on the episode it could not play instead of moving on, so
// nothing leaves the queue or the saved list behind the listener's back.
const STALL_TIMEOUT_MS = 20_000;
// Playing audio moves at least this far in that window; waiting audio does not.
const STALL_PROGRESS_SECONDS = 1;
// The first try, followed by three retries.
const PLAY_RETRY_LIMIT = 3;
// The attempts are only given back once the episode is properly under way: a
// source that dies right after every restart must not be retried for ever.
const PLAY_RETRY_PROGRESS_SECONDS = 5;
// The attempts are spaced out, and each one gets more room than the last: a
// source that just dropped needs a moment to come back, and three attempts spent
// within a fifth of a second are three attempts wasted.
const RETRY_BACKOFF_MS = [1_000, 3_000, 9_000];
// A pause the episode change leaves behind settles after the event, so the
// element is given a moment to start before its state is taken at face value.
const PAUSE_RECOVERY_MS = 1_200;
// Only a start that was just asked for is read that way; later on a pause
// belongs to the listener and the player leaves it alone.
const PAUSE_RECOVERY_WINDOW_MS = 5_000;

let stallTimer = 0;
let stallMarkTime = 0;
// What playback should be doing according to the player: the queue and the
// listener's own controls set it, which tells a pause nobody asked for apart
// from a deliberate one.
let playingIntent = false;
let playRequestedAt = 0;
// The attempt budget belongs to one episode: a new selection starts a fresh
// count, and so does a listener who asks for the same episode again.
let playFailureID = "";
let playFailures = 0;
let playFailureSeconds = 0;
// The source whose probe has already been answered, so the retries of one
// episode do not ask the network the same question four times over.
let probedSourceURL = "";
// The attempt the player scheduled for itself, so a listener who takes over is
// never left waiting behind it.
let retryTimer = 0;
// A source that already failed is asked for through a different address the next
// time it is used: a CDN can remember a 404 for days and hand the same answer
// back, which would make every retry of a missing object a wasted request.
const failedSourceURLs = new Set();
let retryNonce = 0;
// A start a page nobody can see is not allowed to make sound, and the episode
// change and every retry are exactly that: a start. A muted start is always
// allowed to run, so a hidden start asks for one, and the watch behind it takes
// the mute off as soon as the audio really runs. The mark says the mute is the
// player's own, so it is always taken back and never outlives its start.
let mutedForBackgroundStart = false;
// The window a hidden start is watched in, so a start the browser quietly
// stopped is caught instead of being left as a dock that claims to play.
let backgroundStartTimer = 0;
// The episode a hidden start was stopped on, and where it was stopped. That is
// not a failure: the source is fine, and the same start is taken the moment the
// page is back, which is what "the retry only worked once I looked at the
// phone" means. Nothing is spent on it and nothing is said about it.
let pendingResumeID = "";
let pendingResumeAt = 0;

function armStallWatchdog() {
  window.clearTimeout(stallTimer);
  stallMarkTime = elements.audio.currentTime || 0;
  stallTimer = window.setTimeout(checkStalledPlayback, STALL_TIMEOUT_MS);
}

function clearStallWatchdog() {
  window.clearTimeout(stallTimer);
  stallTimer = 0;
}

// The position is remembered when the watch starts, so an episode that stalls
// in the middle is caught the same way as one that never begins.
function checkStalledPlayback() {
  stallTimer = 0;
  const episodeID = state.currentEpisodeID;
  if (!episodeID || elements.audio.paused || elements.audio.ended) return;
  if ((elements.audio.currentTime || 0) > stallMarkTime + STALL_PROGRESS_SECONDS) {
    armStallWatchdog();
    return;
  }
  // The element still says it is playing but the position has not moved: this
  // is what a track that dies on its first second looks like from the inside.
  logPlayback("warn", "no progress for 20s", audioDiagnostics());
  handlePlaybackFailure();
}

// A stall, an error, a play() that was refused, a pause nobody asked for: they
// all spend one attempt and get the same retry. When the attempts are gone the
// player stops where it is, and the toast says why.
// The states in which the element could not use the source at all, as opposed to
// a stream that started and then dropped. These are the ones a different address
// can help with, because the address itself is what was refused.
function sourceWasRefused(audio = elements.audio) {
  if (!audio) return false;
  return audio.error?.code === MEDIA_ERR_SRC_NOT_SUPPORTED || audio.networkState === AUDIO_NETWORK_NO_SOURCE;
}

function handlePlaybackFailure() {
  const episodeID = state.currentEpisodeID;
  if (!episodeID) return;
  // The element says it cannot use the source, which covers a missing object, an
  // error page and a connection that never came up. Its error code cannot tell
  // those apart, so the source is remembered as one to ask for differently and
  // the network is asked directly, before the attempts are spent on it.
  if (sourceWasRefused()) {
    const episode = findEpisode(episodeID);
    if (episode?.audioURL) failedSourceURLs.add(episode.audioURL);
  }
  probeUnplayableSource();
  if (playFailureID !== episodeID) {
    playFailureID = episodeID;
    playFailures = 0;
  }
  // The attempts are already spent and the player is stopped on this episode:
  // a late error from the source it was stopped on must not spend another
  // attempt, and must not say the same thing a second time.
  if (playFailures > PLAY_RETRY_LIMIT) return;
  playFailures += 1;
  playFailureSeconds = elements.audio.currentTime || 0;
  clearStallWatchdog();
  const attempt = `${playFailures}/${PLAY_RETRY_LIMIT + 1}`;
  if (playFailures <= PLAY_RETRY_LIMIT) {
    logPlayback("warn", `failure ${attempt}, retrying`, audioDiagnostics());
    retryPlayback(episodeID);
    return;
  }
  logPlayback("error", `gave up after ${attempt}`, audioDiagnostics());
  stopUnplayableEpisode(episodeID);
}

// The wait before an attempt grows with the attempts: a second gives a blip the
// room to pass, and the last one gives a short outage the room it needs.
function retryBackoffMs() {
  const index = Math.min(Math.max(playFailures, 1), RETRY_BACKOFF_MS.length) - 1;
  return RETRY_BACKOFF_MS[index];
}

function cancelScheduledRetry() {
  window.clearTimeout(retryTimer);
  retryTimer = 0;
}

// A failed source is asked for through a different address, because the address
// that was refused can be remembered as refused - by the CDN, which keeps a 404
// for days. The audio URL of a deployment carries no query string of its own, so
// one is added; an address that already has one is left alone, because it may be
// signed and a signed address does not survive an edit.
function retrySourceURL(url) {
  if (!url || url.startsWith("blob:") || url.includes("?") || !failedSourceURLs.has(url)) return url;
  retryNonce += 1;
  return `${url}?retry=${retryNonce}`;
}

// The buster that function adds, so the two addresses are known to be the same
// source wherever that matters.
const RETRY_BUSTER_PATTERN = /([?&])retry=\d+$/;

// Asking for the same source again does not mean starting the episode over, and
// it does not happen at once: the source is given the moment it needs to come
// back, and the listener keeps the power to take the attempt over.
function retryPlayback(episodeID) {
  const resumeAt = elements.audio.currentTime || 0;
  const wait = retryBackoffMs();
  // The restart is recorded with the position it resumes from and the wait it was
  // given, so the log shows whether every attempt dies at the same second.
  logPlayback("info", "retry", {
    resumeAt: roundSeconds(resumeAt),
    attempt: `${playFailures}/${PLAY_RETRY_LIMIT + 1}`,
    wait: `${Math.round(wait / 1000)}s`,
  });
  cancelScheduledRetry();
  retryTimer = window.setTimeout(async () => {
    retryTimer = 0;
    // A listener who paused, or who moved to another episode, is no longer
    // waiting for this attempt.
    if (state.currentEpisodeID !== episodeID || !playingIntent) return;
    const episode = findEpisode(episodeID);
    if (!episode) return;
    const source = retrySourceURL(await audioSourceFor(episode));
    // Looking the copy up takes a moment, and the listener may have stopped
    // waiting in it.
    if (state.currentEpisodeID !== episodeID || !playingIntent) return;
    elements.audio.src = source;
    elements.audio.load();
    if (resumeAt > 0) {
      elements.audio.addEventListener(
        "loadedmetadata",
        () => {
          if (state.currentEpisodeID !== episodeID) return;
          elements.audio.currentTime = Math.min(resumeAt, Math.max(0, elements.audio.duration - 1));
        },
        { once: true },
      );
    }
    safePlay(episodeID);
  }, wait);
}

// The attempts are paid back as the episode gets going, so a source that keeps
// failing right after a restart is not retried for ever.
function notePlaybackProgress() {
  if (playFailureID !== state.currentEpisodeID) return;
  if ((elements.audio.currentTime || 0) <= playFailureSeconds + PLAY_RETRY_PROGRESS_SECONDS) return;
  playFailures = 0;
}

// A pause the player did not ask for, right after the queue moved on or a retry
// started, is what an interrupted play() or a dropped source looks like: the
// dock reports stopped and the listener is given no reason. It is handled as a
// failure, because the attempts are what decides between another try and a
// deliberate stop. Whether the page could be seen when the element was stopped
// is what tells the two apart: a page nobody can see is not allowed to start
// sound on its own, so that pause belongs to the page rather than to the
// episode and is waited on instead of being spent.
// The visibility is taken at the pause itself rather than in the window below,
// because a listener who comes back inside those 1.2 seconds must not turn a
// start that was only waiting for exactly that into a failure.
function recoverUnexpectedPause(episodeID, hiddenAtPause = false) {
  window.setTimeout(() => {
    if (episodeID !== state.currentEpisodeID) return;
    if (!playingIntent || !elements.audio.paused) return;
    if (elements.audio.ended || elements.audio.error) return;
    if (Date.now() - playRequestedAt > PAUSE_RECOVERY_WINDOW_MS) return;
    if (hiddenAtPause) {
      armPendingResume(episodeID);
      return;
    }
    logPlayback("warn", "paused right after a start", audioDiagnostics());
    handlePlaybackFailure();
  }, PAUSE_RECOVERY_MS);
}

// A start made while the page is hidden is watched in two steps, because the
// browser answers that start with silence in two ways: it does not really run
// the muted audio, or it stops the episode the moment the mute comes off. Each
// step gets the moment a pause after a start gets, and a start that did not
// become a running one is not a failure - it is a start the page has to be
// visible for, which is what the wait below writes down.
function watchBackgroundStart(episodeID, stage) {
  window.clearTimeout(backgroundStartTimer);
  backgroundStartTimer = window.setTimeout(() => {
    backgroundStartTimer = 0;
    // A newer selection, or a stop the listener asked for, owns the element
    // now, so this start is not the one being watched any more.
    if (episodeID !== state.currentEpisodeID || !playingIntent) return;
    const audio = elements.audio;
    // A source the element refused is the error handler's business, and an
    // episode that ended is done with: neither is waiting for the page.
    if (audio.error || audio.ended) return;
    if (audio.paused) {
      armPendingResume(episodeID);
      return;
    }
    if (stage !== "muted") return;
    // The muted audio really runs, so the browser took this start and only the
    // sound is left to ask for. The window behind this one says whether the
    // episode survived the mute coming off.
    mutedForBackgroundStart = false;
    elements.audio.muted = false;
    logPlayback("info", "background start unmuted", audioDiagnostics());
    watchBackgroundStart(episodeID, "audible");
  }, PAUSE_RECOVERY_MS);
}

// The mute a hidden start asked for is the player's own, so it is never left
// behind: wherever such a start ends, the element is handed back with its sound.
function clearBackgroundStart() {
  window.clearTimeout(backgroundStartTimer);
  backgroundStartTimer = 0;
  if (!mutedForBackgroundStart) return;
  mutedForBackgroundStart = false;
  elements.audio.muted = false;
}

function clearPendingResume() {
  pendingResumeID = "";
  pendingResumeAt = 0;
}

// A start the browser stopped because the page cannot be seen is not a failure:
// the source is fine, and the same start is taken the moment the page is back.
// The episode is written down rather than spent - no attempt, no toast, nothing
// given up - and it is written down at the position it stopped on, so the wait
// costs the listener nothing but the time the page was away.
function armPendingResume(episodeID) {
  // The pause after a hidden start and the watch behind it both land here, and
  // one waiting episode is all there is to remember.
  if (pendingResumeID === episodeID) return;
  pendingResumeID = episodeID;
  pendingResumeAt = elements.audio.currentTime || 0;
  // The log takes the element as this start left it, mute and all: that is the
  // state the next visit to the log has to explain.
  logPlayback("warn", "hidden start paused", audioDiagnostics());
  clearBackgroundStart();
  clearStallWatchdog();
  // A page that is already back is the very thing the start was waiting for, so
  // a listener who came back inside the window is not left with an episode that
  // stays stopped on a page they are looking at.
  if (!document.hidden) resumePendingPlayback();
}

// The page is back, which is the one thing a start made for a page nobody could
// see was missing. The element is asked to play where it was stopped, and only a
// source it really refuses is put back together first, because that refusal is
// the element's own to report - nothing here guesses at it.
function resumePendingPlayback() {
  const episodeID = pendingResumeID;
  if (!episodeID || episodeID !== state.currentEpisodeID || !playingIntent) return;
  const resumeAt = pendingResumeAt;
  clearPendingResume();
  // A start the listener can see does not need the mute, and an element that
  // refused its source does not play for a play(): the episode is selected over
  // in that case and continues where it was stopped.
  clearBackgroundStart();
  logPlayback("info", "resume on visible", { at: roundSeconds(resumeAt) });
  if (!elements.audio.error) {
    safePlay(episodeID);
    return;
  }
  const episode = findEpisode(episodeID);
  if (!episode) return;
  selectEpisode(episode, { autoplay: true, resumeAt });
}

// Giving up is a pause, not a jump: skipping the episode would take it out of
// the saved list as well, and the listener would have to find it again by hand.
function stopUnplayableEpisode(episodeID) {
  clearStallWatchdog();
  pausePlayback();
  // The episode that never played is not a listened one, so the saved list keeps
  // it for the next attempt.
  unmarkEpisodeListened(episodeID);
  showToast(copy.playbackFailed);
  renderPlaybackState();
}

// A source the element refuses is either gone (HTTP 404/5xx), behind an error
// page, unreachable, or whole but undecodable, and the element reports all of
// them as one code. Asking the source once turns that into the thing that can be
// acted on: an object that has to be put back, a host that has to be reached, or
// a file that has to be decoded again.
function probeUnplayableSource() {
  const audio = elements.audio;
  if (!audio) return;
  const url = audio.currentSrc || audio.src || "";
  // A copy already on the device has no answer of its own to report, and a stall
  // is not a source problem: only a refused source is asked about.
  if (!url || url.startsWith("blob:")) return;
  if (!sourceWasRefused(audio)) return;
  // The retries of one episode all ask about the same object: the address they
  // add a buster to is not a different source, so one answer is kept until the
  // listener selects the episode or asks for it again.
  const key = url.replace(RETRY_BUSTER_PATTERN, "");
  if (probedSourceURL === key) return;
  probedSourceURL = key;
  const details = { episode: state.currentEpisodeID || "-", url };
  fetch(url, { cache: "no-store" })
    .then((response) => {
      // Only the answer is wanted here: the audio itself is not downloaded. A
      // media host without a CORS header for this site cannot be read at all,
      // which the catch below reports as a request that never arrived.
      if (response.body) response.body.cancel().catch(() => {});
      logPlayback(response.ok ? "info" : "error", "source probe", {
        ...details,
        status: response.status,
        type: response.headers.get("content-type") || "",
      });
    })
    .catch((error) => {
      logPlayback("warn", "source probe failed", {
        ...details,
        reason: `${error?.name || "Error"}: ${error?.message || ""}`,
      });
    });
}

function bindPlayerEvents() {
  elements.playToggle.addEventListener("click", () => {
    if (elements.audio.paused) requestPlayback();
    else pausePlayback();
  });
  elements.previousButton.addEventListener("click", () => moveInQueue(-1));
  elements.nextButton.addEventListener("click", () => moveInQueue(1));
  elements.audio.addEventListener("play", renderPlaybackState);
  elements.audio.addEventListener("play", () => {
    markEpisodeListened(state.currentEpisodeID);
    // Playing an episode is the moment to pull the next one down for the rest
    // of the trip.
    preloadNextEpisode();
    // With the screen off nothing else reports that this episode never started.
    armStallWatchdog();
  });
  elements.audio.addEventListener("pause", () => {
    clearStallWatchdog();
    renderPlaybackState();
    // Whether the page could be seen is read here, while it is still the answer
    // that belongs to this pause.
    recoverUnexpectedPause(state.currentEpisodeID, document.hidden);
  });
  elements.audio.addEventListener("waiting", armStallWatchdog);
  // The element says it is producing sound now, which is how far that attempt
  // got; an episode that never gets here never started at all.
  elements.audio.addEventListener("playing", () =>
    logPlayback("info", "playing", { at: roundSeconds(elements.audio.currentTime || 0) }),
  );
  elements.audio.addEventListener("stalled", () => logPlayback("warn", "network stalled", audioDiagnostics()));
  // A source that cannot be fetched or decoded is a playback failure whether or
  // not the listener can see the screen.
  elements.audio.addEventListener("error", () => {
    if (!elements.audio.error) return;
    logPlayback("error", "audio error", audioDiagnostics());
    handlePlaybackFailure();
  });
  elements.audio.addEventListener("ended", () => {
    clearStallWatchdog();
    // The next episode is picked before the saved list lets go of this one:
    // dropping it first would take the episode out of its own queue, and the
    // player would jump back to the top of the list or stop entirely.
    const next = queueNeighbour(1);
    // An episode that played through is done with, even when it was the last
    // one in the queue and nothing follows it.
    releaseListenedFromListenLater(state.currentEpisodeID);
    if (next) {
      selectEpisode(next, { autoplay: true });
      return;
    }
    playingIntent = false;
    // Nothing follows this episode, so there is no start left to wait for the
    // page for, and nothing that may stay muted.
    clearPendingResume();
    clearBackgroundStart();
  });
  elements.audio.addEventListener("loadedmetadata", () => {
    // The duration the browser reads back is compared with what the API
    // promised, which tells a file that arrived whole from a stub.
    logPlayback("info", "metadata loaded", {
      duration: Number.isFinite(elements.audio.duration) ? roundSeconds(elements.audio.duration) : "",
      buffered: roundSeconds(bufferedEndSeconds(elements.audio)),
    });
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
    notePlaybackProgress();
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
  const next = queueNeighbour(offset);
  if (next) selectEpisode(next, { autoplay: true });
}

function updateQueueButtons() {
  const queue = playbackQueue();
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
    // A feed item that published no link sends none, and the row then offers
    // nothing to open rather than an empty window.
    originalURL: String(episode.original_url || ""),
    // The demo page and older responses only describe playable episodes.
    state: EPISODE_STATES.includes(reportedState) ? reportedState : audioURL ? "ready" : "pending",
    stage: String(episode.stage || ""),
    // The badge keeps every language the API sent, so the page resolves the one
    // it renders while drawing a row; that also lets one saved entry read
    // correctly under both language routes, which share this browser's storage.
    tag: normalizeTag(episode.tag),
    publishedAt,
    durationSeconds: Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : null,
    dayKey: publishedAt ? dateKey(publishedAt) : "",
    sortTime: publishedAt?.getTime() || 0,
  };
}

// A source rule sends its badge as a map of language to text. Anything without
// a language that carries text is treated as no badge at all.
function normalizeTag(tag) {
  if (!tag || typeof tag !== "object" || Array.isArray(tag)) return null;
  return Object.values(tag).some((value) => typeof value === "string" && value !== "")
    ? tag
    : null;
}

// What the page prints on a badge: the text of its own language, then the base
// language of that page ("zh-CN" reads "zh"), then English, and finally any
// text the deployment did provide.
function tagText(tag) {
  if (!tag) return "";
  const candidate =
    tag[copy.lang] ||
    tag[copy.lang.split("-")[0]] ||
    tag.en ||
    Object.values(tag).find((value) => typeof value === "string" && value !== "") ||
    "";
  return typeof candidate === "string" ? candidate : "";
}

// A row is written on every poll, so the cell is only touched when the value it
// shows has actually changed: writing the same text would replace the node it
// sits in and repaint the row for nothing.
function renderEpisodeDuration(element, durationSeconds) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    if (element.textContent !== "--:--") element.textContent = "--:--";
    element.removeAttribute("datetime");
    element.setAttribute("aria-label", copy.durationUnavailable);
    return;
  }
  const label = formatTotalDuration(durationSeconds);
  if (element.textContent !== label) element.textContent = label;
  element.dateTime = `PT${Math.round(durationSeconds)}S`;
  element.setAttribute("aria-label", copy.durationLabel(label));
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

// The queue the transport walks is wider than the page: the list renders one
// day or one feed at a time, but an episode that ends has to keep the player
// going through the rest of the window instead of stopping at the end of a page
// the listener cannot even swipe past with the screen off. A stored list is a
// queue of its own while it is on screen, because an episode saved days ago is
// older than anything the API still returns.
function playbackQueue() {
  const saved = listenLaterEpisodes().filter(isPlayable);
  const bookmarked = bookmarkEpisodes().filter(isPlayable);
  const inWindow = state.episodes.filter(isPlayable);
  const holds = (queue) => queue.some((episode) => episode.id === state.currentEpisodeID);
  if (showsBookmarks(activeSlot())) return holds(bookmarked) ? bookmarked : inWindow;
  if (showsListenLater(activeSlot())) return holds(saved) ? saved : inWindow;
  return holds(inWindow) ? inWindow : saved;
}

// The episode the transport moves to, or null at either end of the queue.
function queueNeighbour(offset) {
  const queue = playbackQueue();
  const index = queue.findIndex((episode) => episode.id === state.currentEpisodeID);
  if (index < 0) return null;
  return queue[index + offset] || null;
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
  elements.categoryIconLabel.textContent = copy.categoryIconSettingLabel;
  elements.settingsCategoryLabel.textContent = copy.categorySettingLabel;
  elements.settingsFirstViewLabel.textContent = copy.firstViewSettingLabel;
  elements.settingsPersonalLabel.textContent = copy.personalSettingLabel;
  elements.laterGroupLabel.textContent = copy.laterGroupLabel;
  elements.bookmarkGroupLabel.textContent = copy.bookmarkGroupLabel;
  elements.otherGroupLabel.textContent = copy.otherGroupLabel;
  elements.laterAutoLabel.textContent = copy.laterAutoRemoveLabel;
  elements.laterDownloadLabel.textContent = copy.laterDownloadLabel;
  elements.dimListenedLabel.textContent = copy.dimListenedLabel;
  elements.preloadNextLabel.textContent = copy.preloadNextLabel;
  elements.laterCacheLabel.textContent = copy.laterCacheLabel;
  elements.cacheClear.textContent = copy.clearCache;
  elements.laterListenedClear.textContent = copy.clearListenedLaterAction;
  elements.laterClear.textContent = copy.clearAllLaterAction;
  elements.bookmarkView.textContent = copy.viewBookmarks;
  elements.bookmarkClear.textContent = copy.clearBookmarks;
  elements.bookmarkTitle.textContent = copy.bookmarkTitle;
  elements.bookmarkClose.textContent = copy.closeLabel;
  elements.settingsDiagnosticsLabel.textContent = copy.playbackLogLabel;
  elements.settingsLogOpen.textContent = copy.playbackLogAction;
  elements.logTitle.textContent = copy.playbackLogTitle;
  elements.logFilters?.setAttribute("aria-label", copy.playbackLogFilterLabel);
  for (const button of elements.logLevelButtons) {
    button.textContent = copy.playbackLogFilters[button.dataset.logLevel];
  }
  elements.logCopy.textContent = copy.playbackLogCopy;
  elements.logClear.textContent = copy.playbackLogClear;
  elements.logClose.textContent = copy.playbackLogClose;
  renderLogLevelFilter();
  renderPlaybackLogSummary();
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
  elements.categoryMenuToggle.setAttribute("aria-label", copy.categoryMenuLabel);
  elements.categoryMenuToggle.title = copy.categoryMenuLabel;
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

// A default category that asked for the saved list predates this setting, so it
// moves over to it and the page still opens the way it always did. "all" is
// both the default and the absence of a stored choice.
function readFirstViewPreference() {
  if (readStoredString(DEFAULT_CATEGORY_KEY) === LATER_SLOT) {
    removeStorage(DEFAULT_CATEGORY_KEY);
    writeStorage(FIRST_VIEW_KEY, LATER_SLOT);
  }
  return normalizePrimaryView(readStoredString(FIRST_VIEW_KEY));
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
  elements.categoryIconToggle?.addEventListener("click", () =>
    setShowCategoryIcon(!showCategoryIcon),
  );
  if (elements.settingsCategorySelect) {
    elements.settingsCategorySelect.addEventListener("change", () =>
      setDefaultCategory(elements.settingsCategorySelect.value),
    );
  }
  if (elements.settingsFirstViewSelect) {
    elements.settingsFirstViewSelect.addEventListener("change", () =>
      setFirstView(elements.settingsFirstViewSelect.value),
    );
  }
  initPersonalSettings();
  initPlaybackLog();
  renderDisplaySettings();
}

function openSettings() {
  elements.settingsPanel.hidden = false;
  // The veil joins the panel: a tap on the page behind it closes what it
  // covers, the way the menus behave.
  if (elements.settingsScrim) elements.settingsScrim.hidden = false;
  elements.settingsToggle.setAttribute("aria-expanded", "true");
}

function closeSettings(focusToggle = false) {
  elements.settingsPanel.hidden = true;
  if (elements.settingsScrim) elements.settingsScrim.hidden = true;
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
  setSwitchState(elements.categoryIconToggle, showCategoryIcon);
}

// The category button can be put away, and it is the only part of the scrolling
// row that goes with it: without it the row is left plain, without the fade.
function setShowCategoryIcon(enabled) {
  showCategoryIcon = enabled;
  if (enabled) removeStorage(CATEGORY_ICON_KEY);
  else writeStorage(CATEGORY_ICON_KEY, "off");
  renderDisplaySettings();
  syncCategoryMenu();
}

// The default feed is a dropdown rather than a segmented control, because a
// deployment can follow more feeds than would fit in one row. Its options repeat
// the feed row, "all" first, so both read in the same order.
function defaultCategoryChoices() {
  return [{ id: "all", name: copy.allSources }, ...state.sources];
}

// The shared first tab lists every feed, the episodes saved on this device or
// the ones bookmarked in it, which is a choice of its own rather than a feed to
// open on.
function firstViewChoices() {
  return [
    { id: "all", name: copy.allSources },
    { id: LATER_SLOT, name: copy.listenLater },
    { id: BOOKMARK_SLOT, name: copy.bookmark },
  ];
}

function createSettingOption(choice) {
  const option = document.createElement("option");
  option.value = choice.id;
  option.textContent = choice.name;
  return option;
}

function renderCategorySetting() {
  const select = elements.settingsCategorySelect;
  if (!select) return;
  select.replaceChildren(...defaultCategoryChoices().map(createSettingOption));
  select.value = resolveCategory(defaultCategory);
}

function renderFirstViewSetting() {
  const select = elements.settingsFirstViewSelect;
  if (!select) return;
  select.replaceChildren(...firstViewChoices().map(createSettingOption));
  select.value = firstView;
}

// A feed the deployment no longer follows falls back to the whole list.
function resolveCategory(sourceID) {
  return sourceChoices().some((choice) => choice.id === sourceID) ? sourceID : "all";
}

// Picking a feed stores it and shows it right away, so the panel previews what
// the next visit will open on. The first tab keeps its own setting, so this
// never changes what the shared tab lists.
function setDefaultCategory(sourceID) {
  defaultCategory = resolveCategory(sourceID);
  // An explicit pick is the current choice as well, so the first payload must
  // not override it.
  initialViewApplied = true;
  if (defaultCategory === "all") removeStorage(DEFAULT_CATEGORY_KEY);
  else writeStorage(DEFAULT_CATEGORY_KEY, defaultCategory);
  renderCategorySetting();
  selectSlot({ source: defaultCategory });
}

// The first tab works in either layout, so switching what it lists previews the
// choice right away without touching the slot the listener is on.
function setFirstView(view) {
  firstView = normalizePrimaryView(view);
  if (firstView === "all") removeStorage(FIRST_VIEW_KEY);
  else writeStorage(FIRST_VIEW_KEY, firstView);
  renderFirstViewSetting();
  setPrimaryView(firstView);
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
  const onScreen = (candidate) => availableDateKeys.has(candidate.dayKey);
  const inWindow = (candidate) => onScreen(candidate) && isPlayable(candidate);
  const newestDay = (matches) => state.episodes.find(matches)?.dayKey || "";
  const today = state.dateOptions[0].key;
  // The list opens on today whenever today has a row at all, playable or not:
  // an entry whose audio is still being generated belongs to the day it was
  // published, and the selected tab has to name the day the rows behind it
  // belong to. Only a day with no row at all hands the list over, and then it
  // goes to the nearest day the selected feed has something on before it falls
  // back to the nearest day any feed has a row on, so the list never opens on a
  // day that the feed in front cannot fill.
  const newestRowDay = newestDay(onScreen);
  const newestFeedDay = newestDay(
    (candidate) => onScreen(candidate) && inSource(candidate, state.activeSource),
  );
  const openingDate = newestRowDay === today ? today : newestFeedDay || newestRowDay;
  if (!openingDate) {
    renderAll();
    return;
  }
  // The list opens on the selected feed, so the first episode comes from it when
  // it has one. Falling back to every feed keeps the player usable when the
  // default feed has nothing in the window. A stored list is a view of its own,
  // so the player follows it when the page opened there.
  const byBookmark = showsBookmarks(activeSlot());
  const storedEpisodes = byBookmark
    ? bookmarkEpisodes()
    : showsListenLater(activeSlot())
      ? listenLaterEpisodes()
      : [];
  // The date layout only shows the saved episodes of the three days on screen,
  // so it picks one of those; the feed layout lists every saved episode at once,
  // and the bookmark page never splits by day at all.
  const storedEpisode =
    (displayMode === "date" && !byBookmark
      ? storedEpisodes.find(inWindow)
      : storedEpisodes.find(isPlayable)) || null;
  // Only an episode with audio can fill the player, so the episode the page
  // starts on can be older than the day it opens: the day follows the rows, the
  // player follows the audio, and a row that is still waiting for its download
  // stays on the day it belongs to.
  const latestEpisode =
    storedEpisode ||
    state.episodes.find(
      (candidate) => inWindow(candidate) && inSource(candidate, state.activeSource),
    ) ||
    state.episodes.find(inWindow);
  state.activeDate = openingDate;
  if (!latestEpisode) {
    renderAll();
    return;
  }

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
    // The article address travels with the snapshot too, so an entry the API
    // window dropped can still open its original in a window of its own.
    originalURL: episode.originalURL || "",
    durationSeconds: episode.durationSeconds || 0,
    state: episode.state,
    stage: episode.stage || "",
    tag: episode.tag || null,
    publishedAt: episode.publishedAt ? episode.publishedAt.toISOString() : "",
    addedAt: addedAt || Date.now(),
  };
}

// Every stored list keeps the same snapshot shape, so one reader serves them
// all. A record written before the article address was kept reads as an empty
// one and simply offers no original to open.
function episodeFromRecord(record) {
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
    originalURL: String(record.originalURL || ""),
    state: EPISODE_STATES.includes(reportedState) ? reportedState : audioURL ? "ready" : "pending",
    stage: String(record.stage || ""),
    tag: normalizeTag(record.tag),
    publishedAt,
    durationSeconds: Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : null,
    dayKey: publishedAt ? dateKey(publishedAt) : "",
    sortTime: publishedAt ? publishedAt.getTime() : 0,
    addedAt: Number(record.addedAt) || 0,
  };
}

// What a stored list shows: the live episode when the API still returns it,
// the stored snapshot otherwise.
function episodesFromRecords(records) {
  return records.map((record) => {
    const live = state.episodes.find((episode) => episode.id === record.id);
    return live ? { ...live, addedAt: record.addedAt } : episodeFromRecord(record);
  });
}

// A poll moved an episode on (its download finished, or it failed), so the
// stored copies follow it; only the fields a row renders are compared. The
// answer is null while every record already matches, which keeps a poll from
// writing storage it has no reason to touch.
function refreshedRecords(records) {
  if (records.length === 0) return null;
  // A download that just finished is the moment a stored episode changes from
  // being addressed to being playable, which is the address a copy needs; an
  // episode whose audio was made again is a new address to hold as well.
  const addressed = [];
  let changed = false;
  const next = records.map((record) => {
    const live = state.episodes.find((episode) => episode.id === record.id);
    if (!live) return record;
    const snapshot = snapshotFromEpisode(live, record.addedAt);
    if (
      snapshot.audioURL === record.audioURL &&
      snapshot.originalURL === record.originalURL &&
      snapshot.state === record.state &&
      snapshot.durationSeconds === record.durationSeconds &&
      snapshot.stage === record.stage &&
      tagText(snapshot.tag) === tagText(record.tag)
    ) {
      return record;
    }
    changed = true;
    if (snapshot.audioURL && snapshot.audioURL !== record.audioURL) addressed.push(snapshot);
    return snapshot;
  });
  return changed ? { records: next, addressed } : null;
}

function listenLaterEpisodes() {
  return episodesFromRecords(listenLater);
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
  // Saving an episode is a request to hold it, so one that already plays is
  // fetched now; one that still waits for its download is picked up below,
  // once the poll that moved it on gave it an address.
  queueLaterCaching(episode);
}

function syncListenLaterSnapshots() {
  const refreshed = refreshedRecords(listenLater);
  if (!refreshed) return;
  listenLater = refreshed.records;
  writeListenLaterRecords(listenLater);
  for (const record of refreshed.addressed) queueLaterCaching(record);
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

// The episodes behind the listener can leave the saved list on their own, so a
// long list does not have to be dropped whole to get rid of what was heard.
function listenedLaterRecords() {
  return listenLater.filter((record) => isListened(record.id));
}

// This is the narrower of the two ways out: what has been listened to goes,
// what is still waiting stays, and so does the mark that greys the row out.
function clearListenedLater() {
  listenLater = listenLater.filter((record) => !isListened(record.id));
  writeListenLaterRecords(listenLater);
  renderAll();
  showToast(copy.laterListenedCleared);
}

// The same question is asked before anything leaves, and a list holding nothing
// listened to says so instead of opening a window over nothing.
function confirmClearListenedLater() {
  const count = listenedLaterRecords().length;
  if (count === 0) {
    showToast(copy.emptyListenedLater);
    return;
  }
  openConfirmDialog({
    title: copy.clearListenedLater,
    message: copy.laterListenedClearConfirmMessage(count),
    acceptLabel: copy.confirmClear,
    onAccept: clearListenedLater,
  });
}

// Clearing the list takes every saved record at once. An episode that is playing
// keeps playing; it only stops being one of the saved ones.
function clearListenLater() {
  listenLater = [];
  writeListenLaterRecords(listenLater);
  renderAll();
  showToast(copy.laterCleared);
}

// Both entry points -- the panel and the row menu -- ask first, because the
// action drops everything the listener saved. An empty list has nothing to ask
// about and says so instead.
function confirmClearListenLater() {
  if (listenLater.length === 0) {
    showToast(copy.emptyLater);
    return;
  }
  openConfirmDialog({
    title: copy.clearAllLater,
    message: copy.laterClearConfirmMessage(listenLater.length),
    acceptLabel: copy.confirmClear,
    onAccept: clearListenLater,
  });
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

// ---- Bookmarks ----

// Bookmarks are the second list kept in this browser. They behave like the
// saved-for-later one, with two differences: their copies are held to the end
// rather than until the next sweep, and their page never depends on the day
// the episode was published, because the list is a local one.
function readBookmarkRecords() {
  try {
    const value = JSON.parse(readStoredString(BOOKMARK_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((record) => record && typeof record.id === "string" && record.id !== "");
  } catch {
    return [];
  }
}

function writeBookmarkRecords(records) {
  writeStorage(BOOKMARK_KEY, JSON.stringify(records.slice(0, BOOKMARK_LIMIT)));
}

function bookmarkEpisodes() {
  return episodesFromRecords(bookmarks);
}

function inBookmarks(id) {
  return bookmarks.some((record) => record.id === id);
}

function removeEpisodeFromBookmarks(id) {
  const next = bookmarks.filter((record) => record.id !== id);
  if (next.length === bookmarks.length) return false;
  bookmarks = next;
  writeBookmarkRecords(bookmarks);
  // The copy stays where it is: it was only ever held on the bookmark's
  // behalf, and from here on a sweep may take it like any other.
  laterCacheWaiting.delete(id);
  return true;
}

function addEpisodeToBookmarks(episode) {
  bookmarks = [
    snapshotFromEpisode(episode),
    ...bookmarks.filter((record) => record.id !== episode.id),
  ];
  writeBookmarkRecords(bookmarks);
  // A bookmark is a request to hold the copy, so one that already plays is
  // fetched now; one that still waits for its download is picked up by the
  // poll that follows, the same way a saved-for-later entry is.
  queueLaterCaching(episode);
}

function syncBookmarkSnapshots() {
  const refreshed = refreshedRecords(bookmarks);
  if (!refreshed) return;
  bookmarks = refreshed.records;
  writeBookmarkRecords(bookmarks);
  for (const record of refreshed.addressed) queueLaterCaching(record);
}

// Both stored lists follow the payload the same way, so a poll refreshes them
// together.
function syncHeldSnapshots() {
  syncListenLaterSnapshots();
  syncBookmarkSnapshots();
}

function toggleBookmark(episode) {
  if (!episode) return;
  if (inBookmarks(episode.id)) {
    // Dropping a bookmark speaks for itself: the star leaves the row.
    removeEpisodeFromBookmarks(episode.id);
    renderAll();
    return;
  }
  addEpisodeToBookmarks(episode);
  showToast(copy.bookmarkAdded);
  // The shared tab carries the count, so the header is redrawn as well, and the
  // bookmark window follows the same redraw.
  renderAll();
  // An entry with no audio yet is asked for here too, so a bookmark starts its
  // download the moment it is marked.
  startLaterDownload(episode);
}

function clearBookmarks() {
  bookmarks = [];
  writeBookmarkRecords(bookmarks);
  renderAll();
  showToast(copy.bookmarksCleared);
}

// Both entry points -- the panel and the row menu -- ask first, because the
// action drops everything the listener marked. An empty list has nothing to ask
// about and says so instead.
function confirmClearBookmarks() {
  if (bookmarks.length === 0) {
    showToast(copy.emptyBookmarks);
    return;
  }
  openConfirmDialog({
    title: copy.clearAllBookmarks,
    message: copy.bookmarkClearConfirmMessage(bookmarks.length),
    acceptLabel: copy.confirmClear,
    onAccept: clearBookmarks,
  });
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

// An episode that could not be played is not a listened one: dropping the mark
// keeps the saved list from letting go of it once the listener moves on.
function unmarkEpisodeListened(id) {
  if (!id || !listened[id]) return;
  delete listened[id];
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
    const icon = createIcon(item.icon || "", "popup-menu-icon");
    // An entry that names a tone paints its icon with it; the rest keep the
    // colour the text runs in, which is how a plain entry has always looked.
    if (item.tone) icon.classList.add(`popup-menu-icon-${item.tone}`);
    button.append(icon);
    const text = document.createElement("span");
    text.className = "popup-menu-label";
    text.textContent = item.label;
    button.append(text);
    // An entry that stands for a page can carry what that page holds, so the
    // menu reads like the tab row it opens.
    if (item.count !== undefined && item.count !== null) {
      const count = document.createElement("span");
      count.className = "popup-menu-count";
      count.textContent = String(item.count);
      count.setAttribute("aria-label", copy.episodeCount(item.count));
      button.append(count);
    }
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
  // The veil is what a tap outside the menu lands on; the menu itself stays
  // above it, so the entry that is picked is still the one under the finger.
  if (elements.popupScrim) elements.popupScrim.hidden = false;
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
    const above = anchorRect ? anchorRect.top - size.height - 6 : y - size.height;
    // A menu taller than the room above its anchor stays below and scrolls
    // inside its own height instead of being pulled up under the header it
    // opened from.
    if (above >= margin) top = above;
  }
  // Whichever side it ended up on, the menu stays inside the viewport; one that
  // is taller than the room it has keeps its top and scrolls instead.
  const lowest = Math.max(margin, window.innerHeight - margin - size.height);
  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(Math.max(margin, Math.min(top, lowest)))}px`;
}

function closePopupMenu({ focusAnchor = false } = {}) {
  const menu = elements.popupMenu;
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  menu.replaceChildren();
  if (elements.popupScrim) elements.popupScrim.hidden = true;
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
// phone can start a download, save an entry for later, or drop it again. The
// row passes a reader rather than the episode itself, because the row outlives
// the payload it was built from.
function bindRowContextMenu(row, currentEpisode) {
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
      openEpisodeMenu(currentEpisode(), { x: startX, y: startY, anchor: row });
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
    openEpisodeMenu(currentEpisode(), { x: event.clientX, y: event.clientY, anchor: row });
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
// second item always offers the saved-for-later toggle. The saved page adds the
// one action that belongs to the page rather than to the row.
//
// Every entry names a tone for its icon, which is the colour the menu paints it
// in: the control that acts on the episode wears the accent, the two stored
// lists wear the colours their marks wear in the row, and an entry that only
// takes something away wears the soft red.
function episodeMenuItems(episode) {
  const id = episode.id;
  const items = [];
  const playing = id === state.currentEpisodeID && !elements.audio.paused;
  if (episode.state === "processing") {
    items.push({ label: stageText(episode.stage), icon: ICON_DOWNLOAD, tone: "accent", disabled: true });
  } else if (episode.state === "failed") {
    items.push({
      label: copy.menuRetry,
      icon: ICON_RETRY,
      tone: "accent",
      onSelect: () => startEpisodeDownload(findEpisode(id) || episode),
    });
  } else if (episode.state === "pending") {
    items.push({
      label: copy.menuDownload,
      icon: ICON_DOWNLOAD,
      tone: "accent",
      onSelect: () => startEpisodeDownload(findEpisode(id) || episode),
    });
  } else {
    items.push({
      label: playing ? copy.pause : copy.play,
      icon: playing ? ICON_PAUSE : ICON_PLAY,
      tone: "accent",
      onSelect: () => toggleEpisode(findEpisode(id) || episode),
    });
  }
  items.push({
    label: inListenLater(id) ? copy.removeListenLater : copy.addListenLater,
    icon: ICON_BOOKMARK,
    tone: "later",
    checked: inListenLater(id),
    onSelect: () => toggleListenLater(findEpisode(id) || episode),
  });
  items.push({
    label: inBookmarks(id) ? copy.removeBookmark : copy.addBookmark,
    // The menu draws the star the entry ends up with rather than the one it has:
    // picking "Bookmark" fills it, picking "Remove bookmark" empties it, and the
    // mark on the right is what says which of the two the entry is now.
    icon: inBookmarks(id) ? ICON_STAR_OUTLINE : ICON_STAR,
    tone: "bookmark",
    checked: inBookmarks(id),
    onSelect: () => toggleBookmark(findEpisode(id) || episode),
  });
  // The article the episode was made from opens below the bookmark that holds
  // it. A feed item that published no link leaves nothing to open, so its entry
  // is left out rather than opening an empty window.
  const originalURL = (findEpisode(id) || episode).originalURL;
  if (originalURL) {
    items.push({
      label: copy.viewOriginal,
      icon: ICON_OPEN_IN_NEW,
      tone: "accent",
      onSelect: () => openOriginal(originalURL),
    });
  }
  // A row of the saved page speaks for the whole list as well, which is the one
  // place where clearing it belongs. The narrower clear sits first, so the one
  // that keeps what is still waiting is the closer reach of the two.
  if (showsListenLater(activeSlot())) {
    items.push({
      label: copy.clearListenedLater,
      icon: ICON_TRASH,
      tone: "clear",
      onSelect: () => confirmClearListenedLater(),
    });
    items.push({
      label: copy.clearAllLater,
      icon: ICON_TRASH,
      tone: "clear",
      onSelect: () => confirmClearListenLater(),
    });
  }
  // The bookmark page carries one way out: the whole list, which asks first.
  if (showsBookmarks(activeSlot())) {
    items.push({
      label: copy.clearAllBookmarks,
      icon: ICON_TRASH,
      tone: "clear",
      onSelect: () => confirmClearBookmarks(),
    });
  }
  return items;
}

// The article behind an episode opens in a window of its own rather than in
// this page, so playback keeps going and a long press on a phone never
// navigates the list away from the listener.
function openOriginal(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

// A menu lives longer than the row it was opened from, so its actions look the
// current episode up again instead of holding the rendered row. A bookmark can
// outlive the API window the row came from, so its own list is searched too.
function findEpisode(id) {
  const live = state.episodes.find((episode) => episode.id === id);
  if (live) return live;
  const record =
    listenLater.find((item) => item.id === id) || bookmarks.find((item) => item.id === id);
  return record ? episodeFromRecord(record) : null;
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
  // The lookahead spans the whole queue, not just the page that is on screen.
  const next = queueNeighbour(1);
  if (next) preloadEpisodeAudio(next);
}

// A lookahead copy is best effort: a host this page cannot read from, or a
// file it cannot hold, is not asked for again here, so the media element is
// given the episode instead and its size stays unknown.
function preloadEpisodeAudio(episode) {
  storeEpisodeAudio(episode).catch(() => preloadViaAudioElement(episode));
}

// The bytes of one episode are fetched and kept in this browser's cache, and
// the index entry remembers which address they came from. The promise settles
// with the size of the copy and rejects when no copy could be made. A fetch
// already running for the same address is shared rather than repeated.
function storeEpisodeAudio(episode) {
  const url = episode.audioURL;
  if (!url) return Promise.resolve(null);
  if (cachedBlobURLs.has(url) || audioCacheIndex[episode.id]?.url === url) {
    return Promise.resolve(null);
  }
  const running = preloadsInFlight.get(url);
  if (running) return running;
  const copy = (async () => {
    if (typeof caches === "undefined" || !window.isSecureContext) {
      throw new Error("this browser cannot hold a local copy");
    }
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`audio cache returned ${response.status}`);
    const blob = await response.blob();
    const cache = await caches.open(AUDIO_CACHE_NAME);
    await cache.put(url, new Response(blob, { headers: { "Content-Type": blob.type || "audio/mpeg" } }));
    cachedBlobURLs.set(url, URL.createObjectURL(blob));
    recordCachedEpisode(episode.id, url, blob.size);
    return blob.size;
  })().finally(() => preloadsInFlight.delete(url));
  preloadsInFlight.set(url, copy);
  return copy;
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

// ---- Copies held for the saved list ----

// What is being fetched for the saved list right now, what is waiting for a
// slot, and how many attempts each episode has spent. None of it survives a
// reload: entering the page again starts the whole check over.
const laterCacheQueue = [];
const laterCacheWaiting = new Set();
const laterCacheFailures = new Map();
let laterCacheRunning = 0;

// Whether this device already holds the audio the episode plays. The index is
// the record of what plays back without asking the network, so it is also what
// the row's badge and the settings summary read.
function isEpisodeCached(episode) {
  return Boolean(episode?.audioURL) && audioCacheIndex[episode.id]?.url === episode.audioURL;
}

// The mark of a copy is written straight onto the rows that show the episode,
// rather than waiting for the list to be drawn again: a copy is held while the
// listener is reading the row, and a redraw that a finger on the list or a
// finished page skips must not leave the mark stale behind it.
function renderCachedBadge(episodeID) {
  const episode = findEpisode(episodeID);
  const cached = episode ? isEpisodeCached(episode) : false;
  // A row of a page and a row of the bookmark window both say whether this
  // device holds the copy, so the mark is written on both.
  for (const rows of [elements.episodeWrapper, elements.bookmarkEntries]) {
    if (!rows) continue;
    for (const row of rows.querySelectorAll(".episode-row")) {
      if (row.dataset.episodeId !== episodeID) continue;
      const badge = row.querySelector(".episode-cached");
      if (badge) badge.hidden = !cached;
    }
  }
}

// Whether this device is asked to keep the audio of an episode. A bookmarked
// one always is; a saved-for-later one is while its switch is on. Everything
// that hands out, keeps or drops a copy reads this one answer.
function holdsCopy(episode) {
  if (!episode) return false;
  return inBookmarks(episode.id) || (laterAutoCache && inListenLater(episode.id));
}

// Entering the page, or turning the save-for-later choice on, checks every list
// this device holds for: an episode it does not hold is fetched, and one that
// failed before is asked for again from scratch. Bookmarks are held whether
// that choice is on or not.
function cacheHeldEpisodes() {
  laterCacheFailures.clear();
  const held = [...bookmarkEpisodes()];
  if (laterAutoCache) held.push(...listenLaterEpisodes());
  for (const episode of held) queueLaterCaching(episode);
}

// One held episode: the address it has now decides whether there is anything
// to fetch, and an episode already queued or being fetched is left alone. An
// episode that has no audio yet is picked up by a later poll, once the download
// that gives it one has finished.
function queueLaterCaching(episode) {
  if (!holdsCopy(episode) || !episode.audioURL) return;
  if (isEpisodeCached(episode) || laterCacheWaiting.has(episode.id)) return;
  laterCacheWaiting.add(episode.id);
  laterCacheQueue.push(episode);
  runLaterCacheQueue();
}

function runLaterCacheQueue() {
  while (laterCacheRunning < LATER_CACHE_CONCURRENCY && laterCacheQueue.length > 0) {
    fetchSavedEpisode(laterCacheQueue.shift());
  }
}

function fetchSavedEpisode(episode) {
  laterCacheRunning += 1;
  storeEpisodeAudio(episode)
    .then(() => {
      laterCacheFailures.delete(episode.id);
      laterCacheWaiting.delete(episode.id);
    })
    .catch((error) => retrySavedEpisode(episode, error))
    .finally(() => {
      laterCacheRunning -= 1;
      runLaterCacheQueue();
    });
}

// A copy that could not be made is asked for again on the player's own
// schedule - after a second, three seconds and nine seconds - and then left to
// the media element, the way a lookahead copy is.
function retrySavedEpisode(episode, error) {
  const failures = (laterCacheFailures.get(episode.id) || 0) + 1;
  laterCacheFailures.set(episode.id, failures);
  logPlayback("warn", "held copy cache failed", {
    episode: episode.id,
    url: episode.audioURL,
    attempt: failures,
    reason: `${error?.name || "Error"}: ${error?.message || ""}`,
  });
  if (failures === 1) {
    // A media host that sends no CORS headers cannot be read from this page at
    // all, and that is the common case: the media element is given the episode
    // from the first failure on, so what holds the copy is the browser's own
    // cache rather than a file this page can read. The retries below keep
    // asking for the bytes in the meantime.
    logPlayback("info", "held copy via the media element", {
      episode: episode.id,
      url: episode.audioURL,
    });
    preloadViaAudioElement(episode);
  }
  if (failures > RETRY_BACKOFF_MS.length) {
    laterCacheWaiting.delete(episode.id);
    return;
  }
  // The episode stays claimed while the retry waits, so a poll that lands in
  // between does not jump the queue and ask for the file again straight away.
  window.setTimeout(() => {
    laterCacheWaiting.delete(episode.id);
    queueLaterCaching(episode);
  }, RETRY_BACKOFF_MS[failures - 1]);
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
  // A row says whether this device holds its audio, so the rows of this episode
  // follow the cache as well as the settings panel does.
  renderCachedBadge(episodeID);
}

function evictCachedEpisodes() {
  // The saved list holds its copies on purpose, so the rolling keep-limit only
  // counts the ones nothing asked to keep.
  const held = new Set(bookmarks.map((record) => record.id));
  if (laterAutoCache) for (const record of listenLater) held.add(record.id);
  const entries = Object.entries(audioCacheIndex)
    .filter(([episodeID]) => !held.has(episodeID))
    .sort((left, right) => (left[1]?.cachedAt || 0) - (right[1]?.cachedAt || 0));
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
  // A row that was marked as held is unmarked with the copy: the keep-limit
  // dropping the oldest one is as much a change to the rows as a fresh copy is.
  renderCachedBadge(episodeID);
}

// The copies the "Clear cache" control may drop: everything this device holds
// except the bookmarked ones, which are held to the end. The whole cache is
// never dropped in one go, because that would take them with it.
function clearableCacheIDs() {
  const bookmarked = new Set(bookmarks.map((record) => record.id));
  return Object.keys(audioCacheIndex).filter((episodeID) => !bookmarked.has(episodeID));
}

// Dropping the cache is not undone here: every list this device holds for is
// left alone until the page is entered again, which is when the copies are
// asked for afresh. Bookmarked copies are not visited at all.
function clearAudioCache() {
  const clearable = clearableCacheIDs();
  if (clearable.length === 0) {
    showToast(copy.cacheEmpty);
    return;
  }
  for (const episodeID of clearable) dropCachedEpisode(episodeID);
  // Dropping a copy only takes it out of the index in memory, so the sweep keeps
  // the stored one in step with it: a cache that came back on reload would say
  // this device still holds what it just let go.
  writeAudioCacheIndex();
  renderCacheSummary();
  renderEpisodeList();
  showToast(copy.cacheCleared);
}

// The panel asks before the cache is dropped, because what it holds is what
// plays back without a network. What is held for a bookmark is not counted, so
// a device holding nothing else has nothing to ask about.
function confirmClearAudioCache() {
  const count = clearableCacheIDs().length;
  if (count === 0) {
    showToast(copy.cacheEmpty);
    return;
  }
  openConfirmDialog({
    title: copy.clearCache,
    message: copy.cacheClearConfirmMessage(count),
    acceptLabel: copy.confirmClear,
    onAccept: clearAudioCache,
  });
}

// The audio of one entry is only ever used through an object URL, so the copy
// this page holds is used as it is and one that outlived the page is read back
// out of the browser's cache first. Either way the episode plays without
// asking the network for its bytes again.
async function audioSourceFor(episode) {
  const held = cachedBlobURLs.get(episode.audioURL);
  if (held) return held;
  return (await restoreEpisodeCopy(episode)) || episode.audioURL;
}

// The bytes a previous visit put into the browser's cache are turned back into
// an address the element can play. A copy that is no longer there is dropped
// instead: the row stops claiming it, and the saved list fetches it afresh.
async function restoreEpisodeCopy(episode) {
  const entry = audioCacheIndex[episode.id];
  // Only a copy whose bytes were read is worth looking for. A bare index entry
  // is what a host without CORS headers leaves behind, and those bytes are the
  // media element's own business.
  if (!entry?.url || entry.url !== episode.audioURL || !(Number(entry.bytes) > 0)) return "";
  if (typeof caches === "undefined" || !window.isSecureContext) return "";
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const response = await cache.match(entry.url);
    if (response) {
      const objectURL = URL.createObjectURL(await response.blob());
      cachedBlobURLs.set(entry.url, objectURL);
      return objectURL;
    }
  } catch {
    return "";
  }
  dropCachedEpisode(episode.id);
  renderCacheSummary();
  renderEpisodeList();
  // A stored list had asked for this copy to be held, so it is asked for again
  // rather than waiting for the next visit to the page.
  if (holdsCopy(episode)) queueLaterCaching(episode);
  return "";
}

function renderCacheSummary() {
  const summary = elements.cacheSummary;
  const clear = elements.cacheClear;
  if (!summary || !clear) return;
  const totals = cachedTotals();
  // Either choice can build the cache up, and a copy left behind by one that
  // was turned off is still worth reporting: the summary and the control that
  // drops it follow whatever this device holds.
  const holdsCopies = preloadNext || laterAutoCache || totals.count > 0;
  summary.hidden = !holdsCopies;
  clear.hidden = !holdsCopies;
  if (!holdsCopies) return;
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
  elements.laterCacheToggle?.addEventListener("click", () =>
    setPersonalFlag("laterAutoCache", !laterAutoCache),
  );
  elements.cacheClear?.addEventListener("click", () => confirmClearAudioCache());
  elements.laterListenedClear?.addEventListener("click", () => confirmClearListenedLater());
  elements.laterClear?.addEventListener("click", () => confirmClearListenLater());
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
  } else if (name === "laterAutoCache") {
    laterAutoCache = enabled;
    writeFlag(LATER_AUTO_CACHE_KEY, enabled);
    // Turning it on is a request for the whole saved list to be held, so the
    // copies are asked for right away rather than at the next poll.
    if (enabled) cacheHeldEpisodes();
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
  setSwitchState(elements.laterCacheToggle, laterAutoCache);
  renderCacheSummary();
}

function setSwitchState(element, enabled) {
  if (element) element.setAttribute("aria-checked", String(Boolean(enabled)));
}

// ---- Playback log ----

// A playback problem is the hardest one to report: a phone has no console, and
// an episode that dies on its first second leaves nothing on the screen. The
// player writes down what it asked the browser for and what came back, and the
// settings panel opens that record in a window of its own, so the reason - a
// refused play(), a source the browser cannot use, a stalled download - can be
// read where it happened and copied out in one piece.
const PLAYBACK_LOG_LEVELS = ["info", "warn", "error"];
// The names of the media element's error codes; the code alone is what says
// whether the file was refused, could not be fetched, or could not be decoded.
const MEDIA_ERROR_NAMES = {
  1: "MEDIA_ERR_ABORTED",
  2: "MEDIA_ERR_NETWORK",
  3: "MEDIA_ERR_DECODE",
  4: "MEDIA_ERR_SRC_NOT_SUPPORTED",
};
// A source the element refused, and a source it has run out of: the two states
// the source probe below is asked about.
const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;
const AUDIO_NETWORK_NO_SOURCE = 3;

function readPlaybackLog() {
  try {
    const value = JSON.parse(readStoredString(AUDIO_LOG_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((entry) => entry && typeof entry === "object").slice(-AUDIO_LOG_LIMIT);
  } catch {
    return [];
  }
}

// Every entry is one thing the player or the element did. A source that hiccups
// repeats itself within moments, so an immediate repeat collapses into the same
// line with a count instead of flooding the window.
function logPlayback(level, event, details = null) {
  const entry = {
    at: Date.now(),
    level,
    event,
    details: details ? describeLogDetails(details) : "",
    repeats: 1,
  };
  const last = playbackLog[playbackLog.length - 1];
  if (
    last &&
    last.level === entry.level &&
    last.event === entry.event &&
    last.details === entry.details &&
    entry.at - last.at < 1_000
  ) {
    last.repeats += 1;
    last.at = entry.at;
  } else {
    playbackLog.push(entry);
    while (playbackLog.length > AUDIO_LOG_LIMIT) playbackLog.shift();
  }
  writeStorage(AUDIO_LOG_KEY, JSON.stringify(playbackLog));
  if (elements.logDialog && !elements.logDialog.hidden) renderPlaybackLog();
  renderPlaybackLogSummary();
}

function describeLogDetails(details) {
  return Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" ");
}

// What the element knows about itself at the moment of a failure: the error
// code decides the fix, and the state around it says how far the audio got.
function audioDiagnostics() {
  const audio = elements.audio;
  if (!audio) return {};
  const error = audio.error;
  const source = audio.currentSrc || audio.src || "";
  const duration = audio.duration;
  return {
    episode: state.currentEpisodeID || "-",
    src: source,
    kind: source.startsWith("blob:") ? "blob" : source ? "remote" : "none",
    err: error ? MEDIA_ERROR_NAMES[error.code] || `MEDIA_ERR_${error.code}` : "",
    message: error?.message || "",
    ready: audio.readyState,
    network: audio.networkState,
    paused: audio.paused,
    ended: audio.ended,
    at: roundSeconds(audio.currentTime || 0),
    duration: Number.isFinite(duration) ? roundSeconds(duration) : "",
    buffered: roundSeconds(bufferedEndSeconds(audio)),
    // A pause the browser decided and a pause the source caused look the same
    // from the element alone; what the page was doing at the time is what tells
    // them apart on the next visit to the log, and the mute says whether this
    // player had asked for a silent start to get that far.
    visibility: document.hidden ? "hidden" : "visible",
    muted: audio.muted,
  };
}

function bufferedEndSeconds(audio) {
  const ranges = audio.buffered;
  if (!ranges || ranges.length === 0) return 0;
  return ranges.end(ranges.length - 1);
}

function roundSeconds(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function formatLogTime(at) {
  const date = new Date(at);
  if (!Number.isFinite(date.getTime())) return "-";
  const pad = (value, size = 2) => String(value).padStart(size, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
  );
}

function playbackLogEvent(entry) {
  const repeat = entry.repeats > 1 ? ` ×${entry.repeats}` : "";
  return `${entry.event}${repeat}${entry.details ? ` ${entry.details}` : ""}`;
}

function playbackLogLine(entry) {
  return `${formatLogTime(entry.at)} ${String(entry.level).toUpperCase()} ${playbackLogEvent(entry)}`;
}

function playbackLogText() {
  if (playbackLog.length === 0) return copy.playbackLogEmpty;
  return playbackLog.map(playbackLogLine).join("\n");
}

function createPlaybackLogLine(entry) {
  const level = PLAYBACK_LOG_LEVELS.includes(entry.level) ? entry.level : "info";
  const line = document.createElement("li");
  line.className = `log-line log-line-${level}`;
  const time = document.createElement("time");
  time.className = "log-time";
  time.textContent = formatLogTime(entry.at);
  const mark = document.createElement("span");
  mark.className = "log-level";
  mark.textContent = String(entry.level).toUpperCase();
  const text = document.createElement("span");
  text.className = "log-text";
  text.textContent = playbackLogEvent(entry);
  line.append(time, mark, text);
  return line;
}

// The record is one sequence in time, so a level filter only narrows what is on
// screen; nothing is ever dropped from the log itself.
function visibleLogEntries() {
  if (logLevelFilter === "all") return playbackLog;
  return playbackLog.filter((entry) => entry.level === logLevelFilter);
}

function renderLogLevelFilter() {
  for (const button of elements.logLevelButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.logLevel === logLevelFilter));
  }
}

function setLogLevelFilter(level) {
  if (level !== "all" && !PLAYBACK_LOG_LEVELS.includes(level)) return;
  logLevelFilter = level;
  renderLogLevelFilter();
  renderPlaybackLog({ scrollToEnd: true });
}

function renderPlaybackLog({ scrollToEnd = false } = {}) {
  if (!elements.logEntries) return;
  const list = elements.logEntries;
  const entries = visibleLogEntries();
  // An entry that arrives while the window is open must not pull a reader who
  // scrolled back up down again.
  const atEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 48;
  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "log-empty";
    // A level with nothing in it says so, because the record itself may well
    // hold events the filter is hiding.
    empty.textContent =
      playbackLog.length === 0 ? copy.playbackLogEmpty : copy.playbackLogFilterEmpty(logLevelFilter.toUpperCase());
    list.replaceChildren(empty);
  } else {
    list.replaceChildren(...entries.map(createPlaybackLogLine));
  }
  // The newest entry is the one being looked for, so the window opens at the end.
  if (scrollToEnd || atEnd) list.scrollTop = list.scrollHeight;
  renderPlaybackLogSummary();
}

function renderPlaybackLogSummary() {
  const failed = playbackLog.filter((entry) => entry.level === "error").length;
  const summary = playbackLog.length === 0 ? copy.playbackLogEmpty : copy.playbackLogCount(playbackLog.length, failed);
  if (elements.settingsLogSummary) elements.settingsLogSummary.textContent = summary;
  if (!elements.logSummary) return;
  // The window counts what the filter is showing; the panel keeps the size of
  // the whole record, which is what the listener opens the window for.
  const shown = visibleLogEntries().length;
  elements.logSummary.textContent =
    logLevelFilter === "all" || playbackLog.length === 0
      ? summary
      : copy.playbackLogFilterCount(shown, playbackLog.length);
}

function initPlaybackLog() {
  if (!elements.logDialog) return;
  elements.settingsLogOpen?.addEventListener("click", () => {
    // The window covers the panel it was opened from, so the panel folds away.
    closeSettings();
    openPlaybackLog();
  });
  elements.logClose?.addEventListener("click", () => closePlaybackLog({ focusToggle: true }));
  elements.logCopy?.addEventListener("click", () => copyPlaybackLog());
  elements.logClear?.addEventListener("click", () => clearPlaybackLog());
  for (const button of elements.logLevelButtons) {
    button.addEventListener("click", () => setLogLevelFilter(button.dataset.logLevel));
  }
  elements.logDialog.addEventListener("click", (event) => {
    // Only the backdrop closes it; a click inside the card belongs to the card.
    if (event.target === elements.logDialog) closePlaybackLog({ focusToggle: true });
  });
  // Escape is taken from the document rather than the window, because a click
  // on the log itself leaves the focus on the body.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || elements.logDialog.hidden) return;
    closePlaybackLog({ focusToggle: true });
  });
}

function openPlaybackLog() {
  elements.logDialog.hidden = false;
  renderPlaybackLog({ scrollToEnd: true });
  elements.logClose?.focus({ preventScroll: true });
}

function closePlaybackLog({ focusToggle = false } = {}) {
  elements.logDialog.hidden = true;
  if (focusToggle) elements.settingsToggle?.focus({ preventScroll: true });
}

async function copyPlaybackLog() {
  const text = playbackLogText();
  try {
    await navigator.clipboard.writeText(text);
    showToast(copy.playbackLogCopied);
  } catch {
    // A page without the clipboard API, or one served over plain http, still
    // has to be able to hand the record over.
    showToast(copyTextFallback(text) ? copy.playbackLogCopied : copy.playbackLogCopyFailed);
  }
}

function copyTextFallback(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "-1000px";
  document.body.append(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  area.remove();
  return copied;
}

function clearPlaybackLog() {
  playbackLog = [];
  removeStorage(AUDIO_LOG_KEY);
  renderPlaybackLog();
  showToast(copy.playbackLogCleared);
}

// ---- The confirmation window ----

// A choice that cannot be undone is asked about in a window of its own: it takes
// the question and the answer from the caller, so the action it runs is the one
// the caller handed over rather than one this window knows about.
let confirmAcceptHandler = null;

// ---- The bookmark window ----

// The bookmark list is a view of the same rows the page draws, which is why it
// lives in a window of its own rather than in the header: the date layout has no
// tab to carry it, and the entries are worth reading without leaving the player.
// Playback starts here exactly as it does from the page, and a long press opens
// the same row menu, so there is nothing new to learn.
function initBookmarkDialog() {
  if (!elements.bookmarkDialog) return;
  elements.bookmarkView?.addEventListener("click", () => {
    // The window covers the panel it was opened from, so the panel folds away.
    closeSettings();
    openBookmarks();
  });
  elements.bookmarkClear?.addEventListener("click", () => confirmClearBookmarks());
  elements.bookmarkClose?.addEventListener("click", () => closeBookmarks({ focusToggle: true }));
  elements.bookmarkDialog.addEventListener("click", (event) => {
    // Only the backdrop closes it; a click inside the card belongs to the card.
    if (event.target === elements.bookmarkDialog) closeBookmarks({ focusToggle: true });
  });
  // Escape is taken from the document rather than the window, because a click
  // inside it leaves the focus on the body. A row menu opened over the window is
  // the closer of the two, so it is left to close on its own first.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || elements.bookmarkDialog.hidden) return;
    if (!elements.popupMenu.hidden) return;
    closeBookmarks({ focusToggle: true });
  });
}

function openBookmarks() {
  elements.bookmarkDialog.hidden = false;
  renderBookmarks();
  elements.bookmarkClose?.focus({ preventScroll: true });
}

function closeBookmarks({ focusToggle = false } = {}) {
  elements.bookmarkDialog.hidden = true;
  if (focusToggle) elements.settingsToggle?.focus({ preventScroll: true });
}

// A row drawn here belongs to the stored list wherever the listener happens to
// be, so it names the feed an episode came from rather than the day.
function bookmarkRowSlot() {
  return { source: BOOKMARK_SLOT, date: "" };
}

// The window is only written while it is on screen: marking an episode from the
// page must not cost a list nobody is reading. The rows themselves are diffed
// rather than rebuilt, so a poll that lands while the window is open moves the
// row it is about without scrolling the list back to the top.
function renderBookmarks() {
  const list = elements.bookmarkEntries;
  if (!list || !elements.bookmarkEmpty || elements.bookmarkDialog.hidden) return;
  const episodes = bookmarkEpisodes();
  elements.bookmarkTitle.textContent = copy.bookmarkTitle;
  elements.bookmarkSummary.textContent =
    episodes.length === 0 ? "" : copy.episodeCount(episodes.length);
  elements.bookmarkEmpty.textContent = copy.emptyBookmarks;
  elements.bookmarkEmpty.hidden = episodes.length > 0;
  list.hidden = episodes.length === 0;
  if (episodes.length === 0) list.replaceChildren();
  else renderEpisodeRows(list, episodes, bookmarkRowSlot());
}

function initConfirmDialog() {
  if (!elements.confirmDialog) return;
  elements.confirmCancel?.addEventListener("click", () => closeConfirmDialog());
  elements.confirmAccept?.addEventListener("click", () => {
    const accept = confirmAcceptHandler;
    // The window closes before the action runs, so the action redraws the page
    // under an overlay that is already gone.
    closeConfirmDialog();
    accept?.();
  });
  elements.confirmDialog.addEventListener("click", (event) => {
    // Only the backdrop closes it; a click inside the card belongs to the card.
    if (event.target === elements.confirmDialog) closeConfirmDialog();
  });
  // Escape is taken from the document rather than the window, because a click
  // inside it leaves the focus on the body.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || elements.confirmDialog.hidden) return;
    closeConfirmDialog();
  });
}

function openConfirmDialog({ title, message, acceptLabel, onAccept }) {
  if (!elements.confirmDialog) return;
  confirmAcceptHandler = onAccept;
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  elements.confirmCancel.textContent = copy.confirmCancel;
  elements.confirmAccept.textContent = acceptLabel;
  elements.confirmDialog.hidden = false;
  // The answer is the last thing read, so it is where the focus starts.
  elements.confirmAccept.focus({ preventScroll: true });
}

function closeConfirmDialog() {
  if (!elements.confirmDialog) return;
  elements.confirmDialog.hidden = true;
  confirmAcceptHandler = null;
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
    play: () => requestPlayback(),
    pause: () => pausePlayback(),
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
  // Two rows carry the badge a source rule adds, so the demo shows the chip
  // without a deployment having to configure one.
  const tagged = (episode, tag) => ({ ...episode, tag });
  return {
    sources: [
      { id: "zhihu-daily", name: demoContent.sources[0] },
      { id: "v2ex-hot", name: demoContent.sources[1] },
      { id: "zhihu-topic", name: demoContent.sources[2] },
    ],
    episodes: [
      tagged(demoEpisode("demo-1", "zhihu-daily", demoContent.titles[0], at(today, 7, 30)), {
        en: "Long read",
        "zh-CN": "长文章",
      }),
      tagged(demoEpisode("demo-2", "v2ex-hot", demoContent.titles[1], at(today, 6, 45)), {
        en: "Long read",
        "zh-CN": "长文章",
      }),
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
    // The demo page has no feeds to open, so the article address points at the
    // project itself: it is there to show the entry rather than to be read.
    original_url: `https://github.com/synrise25/rss-pod#${id}`,
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
  elements.dateTabsRow.before(panel);
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
  if (visible) elements.dateTabsRow.before(panel);
  else document.querySelector(".app-shell").append(panel);
  for (const element of [elements.dateTabsRow, elements.sourceFilterSection, elements.episodeRegion, elements.playerDock]) element.hidden = !visible;
  document.querySelector("#admin-login").hidden = visible;
  document.querySelector("#admin-logout").hidden = !visible;
}
function showAdminLogin(message = "") {
  adminCSRF = "";
  window.clearInterval(adminSessionTimer);
  pausePlayback();
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
