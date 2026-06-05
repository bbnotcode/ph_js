/*
 * Pornhub custom media library source for baiPlay.
 *
 * This adapter only consumes Pornhub's public pages. Availability depends on
 * the user's region, age-verification status, network, and the site's markup.
 */

const PORNHUB_BASE_URL = "https://www.pornhub.com";
const PORNHUB_PAGE_LIMIT = 36;
const PORNHUB_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const PORNHUB_HEADERS = {
  "User-Agent": PORNHUB_USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const PORNHUB_CATEGORIES = [
  {
    id: "hottest",
    title: "热门",
    path: "/video?o=ht",
    style: "discover.ranked",
  },
  {
    id: "most-viewed",
    title: "最多观看",
    path: "/video?o=mv",
    style: "discover.standard",
  },
  {
    id: "top-rated",
    title: "最高评分",
    path: "/video?o=tr",
    style: "discover.spotlight",
  },
  {
    id: "newest",
    title: "最新",
    path: "/video?o=cm",
    style: "discover.posterCompact",
  },
];

var WidgetMetadata = {
  id: "baiplay_pornhub_media_library",
  title: "Pornhub",
  description: "Pornhub custom media library source for baiPlay",
  author: "community",
  site: PORNHUB_BASE_URL,
  version: "1.0.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 60,
};

async function init(cfg = {}) {
  return {
    ok: true,
    source: WidgetMetadata.id,
    site: PORNHUB_BASE_URL,
    config: cfg || {},
  };
}

function getManifest() {
  return {
    id: WidgetMetadata.id,
    name: "Pornhub",
    title: "Pornhub",
    version: WidgetMetadata.version,
    author: WidgetMetadata.author,
    description: WidgetMetadata.description,
    site: PORNHUB_BASE_URL,
    capabilities: {
      home: true,
      category: true,
      detail: true,
      search: true,
      resourceVersions: true,
      playback: true,
      resourceMatching: true,
      resourceMatch: {
        enabled: true,
        parameters: ["title", "originalTitle", "alternativeTitles", "year", "runtimeMinutes", "mediaType"],
      },
    },
    aggregation: {
      search: true,
      playbackHistory: true,
      resourceMatching: true,
    },
  };
}

async function getHome(ctx = {}) {
  const args = argsify(ctx);
  const page = normalizePage(args.page || 1);
  const sections = [
    {
      id: "pornhub-categories",
      title: "分类",
      style: "discover.watchProviders",
      items: PORNHUB_CATEGORIES.map((category) => ({
        id: category.id,
        title: category.title,
        subtitle: "Pornhub",
        type: "category",
        action: {
          type: "category",
          id: category.id,
          pageId: category.id,
          title: category.title,
        },
      })),
    },
  ];
  let hero = [];
  let firstError = null;

  for (const category of PORNHUB_CATEGORIES) {
    try {
      const items = await loadCategoryItems(category, page);
      if (!items.length) continue;
      if (!hero.length) hero = items.slice(0, 6);
      const moreAction = {
        type: "category",
        id: category.id,
        pageId: category.id,
        title: category.title,
      };
      sections.push({
        id: category.id,
        title: category.title,
        style: category.style,
        contentType: "movie",
        more: moreAction,
        moreAction,
        items: items.slice(0, PORNHUB_PAGE_LIMIT),
      });
    } catch (error) {
      if (!firstError) firstError = error;
      logInfo("Pornhub home section skipped: " + category.id + " - " + errorMessage(error));
    }
  }

  if (!hero.length && firstError) throw firstError;
  return {
    pageType: "home",
    title: "Pornhub",
    hero,
    sections,
  };
}

async function getCategory(ctx = {}) {
  const args = argsify(ctx);
  const category = findCategory(args.pageId || args.categoryId || args.id || args.tid);
  const page = normalizePage(args.page || args.pg || args.from || 1);
  const items = await loadCategoryItems(category, page);

  return {
    pageType: "category",
    id: category.id,
    title: args.title || category.title,
    style: "media.posterGrid",
    page,
    hasMore: items.length >= PORNHUB_PAGE_LIMIT,
    sort: PORNHUB_CATEGORIES.map((item) => ({
      id: item.id,
      title: item.title,
      value: item.id,
    })),
    items,
  };
}

async function search(ctx = {}) {
  const args = argsify(ctx);
  const keyword = cleanText(args.keyword || args.query || args.text || args.wd || "");
  const page = normalizePage(args.page || args.pg || args.from || 1);
  const items = keyword ? await searchItems(keyword, page) : [];

  return {
    pageType: "search",
    keyword,
    title: keyword ? `搜索结果: ${keyword}` : "搜索结果",
    page,
    hasMore: items.length >= PORNHUB_PAGE_LIMIT,
    items,
  };
}

async function getDetail(ctx = {}) {
  const args = argsify(ctx);
  const itemId = firstNonEmpty(args.itemId, args.id, args.url, args.link, typeof ctx === "string" ? ctx : "");
  const pageUrl = normalizeVideoUrl(itemId);
  if (!isPornhubVideoUrl(pageUrl)) {
    throw new Error("Pornhub detail requires a valid video URL or viewkey.");
  }

  const detail = await loadDetail(pageUrl);
  return toDetailPage(detail);
}

async function getResourceVersions(ctx = {}) {
  const args = argsify(ctx);
  const pageUrl = normalizeVideoUrl(firstNonEmpty(args.itemId, args.id, args.url, args.link));
  if (!isPornhubVideoUrl(pageUrl)) {
    return { itemId: pageUrl, groups: [] };
  }

  const detail = await loadDetail(pageUrl);
  return {
    itemId: pageUrl,
    groups: buildResourceGroups(detail),
  };
}

async function resolvePlayback(ctx = {}) {
  const args = argsify(ctx);
  const directUrl = firstNonEmpty(args.url, args.playUrl, args.videoUrl);
  if (isMediaUrl(directUrl)) {
    return playbackResult(directUrl, args.itemId || args.referer || PORNHUB_BASE_URL + "/");
  }

  const pageUrl = normalizeVideoUrl(firstNonEmpty(args.itemId, args.id, args.link, directUrl));
  if (!isPornhubVideoUrl(pageUrl)) {
    throw new Error("Pornhub playback requires a valid itemId or direct media URL.");
  }

  // Signed media URLs are short-lived, so always refresh the detail page here.
  const detail = await loadDetail(pageUrl);
  const versionId = firstNonEmpty(args.versionId, args.resourceId);
  const source = selectMediaSource(detail.mediaSources, versionId);
  if (!source || !source.url) {
    throw new Error("No playable Pornhub media source was found.");
  }
  return playbackResult(source.url, pageUrl, source);
}

async function matchResources(ctx = {}) {
  const args = argsify(ctx);
  const titles = unique(
    []
      .concat(args.keyword || args.query || [])
      .concat(args.title || args.name || [])
      .concat(args.originalTitle || args.originalName || [])
      .concat(args.alternativeTitles || [])
      .concat(args.searchTitles || [])
      .concat(args.titles || [])
  ).slice(0, 3);

  const results = [];
  const seen = {};
  for (const title of titles) {
    const items = await searchItems(title, 1);
    for (const item of items) {
      if (seen[item.id]) continue;
      const score = titleScore(item.title, title);
      if (score < 0.35) continue;
      seen[item.id] = true;
      results.push({ ...item, score, matchReason: "title-search" });
      if (results.length >= 8) return { results };
    }
  }
  return { results };
}

async function matchMovie(ctx = {}) {
  return matchResources(ctx);
}

async function matchEpisode(ctx = {}) {
  return matchResources(ctx);
}

async function home(ctx = {}) {
  return getHome(ctx);
}

async function category(ctx = {}) {
  return getCategory(ctx);
}

async function detail(ctx = {}) {
  return getDetail(ctx);
}

async function play(ctx = {}) {
  return resolvePlayback(ctx);
}

async function getVersions(ctx = {}) {
  return getResourceVersions(ctx);
}

async function onSearch(ctx = {}) {
  return search(ctx);
}

async function loadCategoryItems(category, page) {
  const url = setQueryParam(absolutizeUrl(category.path), "page", page);
  const html = await requestPage(url);
  return parseVideoCards(html).map((item, index) =>
    toMediaCard(item, (page - 1) * PORNHUB_PAGE_LIMIT + index + 1, category.title)
  );
}

async function searchItems(keyword, page) {
  let url = `${PORNHUB_BASE_URL}/video/search?search=${encodeURIComponent(keyword)}`;
  url = setQueryParam(url, "page", page);
  const html = await requestPage(url);
  return parseVideoCards(html).map((item, index) =>
    toMediaCard(item, (page - 1) * PORNHUB_PAGE_LIMIT + index + 1, "搜索")
  );
}

async function loadDetail(pageUrl) {
  let html = await requestPage(pageUrl, {
    headers: {
      ...PORNHUB_HEADERS,
      Referer: PORNHUB_BASE_URL + "/",
    },
  });
  let detail = parseDetailPage(html, pageUrl);

  if (!detail.mediaSources.length && canUseBrowser()) {
    const browserResult = await browserFetch(pageUrl, {
      visible: false,
      timeout: 45,
      waitAfterLoad: 1,
      waitForMediaSource: true,
      headers: {
        "User-Agent": PORNHUB_USER_AGENT,
        Referer: PORNHUB_BASE_URL + "/",
      },
    });
    html = getResponseText(browserResult) || html;
    detail = parseDetailPage(html, browserResult.currentURL || pageUrl);
    detail.mediaSources = mergeMediaSources(
      detail.mediaSources,
      normalizeBrowserMediaSources(browserResult)
    );
  }

  if (!detail.title) {
    throw new Error("Unable to parse the Pornhub detail page.");
  }
  return detail;
}

async function requestPage(url, options = {}) {
  const response = await httpGet(url, options);
  const html = getResponseText(response);
  if (!html) throw new Error("Pornhub returned an empty response.");
  if (looksBlocked(html)) {
    throw new Error("Pornhub is unavailable in this region or requires age/browser verification.");
  }
  return html;
}

function parseVideoCards(html) {
  const source = String(html || "");
  const cards = [];
  const blockRegex =
    /<li\b[^>]*class=["'][^"']*(?:pcVideoListItem|videoblock|videoBox)[^"']*["'][^>]*>[\s\S]*?<\/li>/gi;
  let match;

  while ((match = blockRegex.exec(source))) {
    const block = match[0];
    const viewkey = firstNonEmpty(
      extractAttr(block, /\bdata-video-vkey=["']([^"']+)["']/i),
      extractMatch(block, /viewkey=([^"'&\s]+)/i)
    );
    if (!viewkey) continue;

    const anchor = extractMatch(
      block,
      /<a\b[^>]*href=["'][^"']*view_video\.php\?viewkey=[^"']+["'][^>]*>/i
    );
    const image = extractMatch(block, /<img\b[^>]*(?:js-videoThumb|thumb)[^>]*>/i) ||
      extractMatch(block, /<img\b[^>]*>/i);
    const title = cleanText(
      firstNonEmpty(
        extractAttr(anchor, /\btitle=["']([^"']+)["']/i),
        extractAttr(image, /\balt=["']([^"']+)["']/i),
        stripTags(extractMatch(block, /<span[^>]*class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/span>/i))
      )
    );
    const poster = firstNonEmpty(
      extractAttr(image, /\bdata-image=["']([^"']+)["']/i),
      extractAttr(image, /\bdata-thumb_url=["']([^"']+)["']/i),
      extractAttr(image, /\bdata-src=["']([^"']+)["']/i),
      extractAttr(image, /\bsrc=["']([^"']+)["']/i)
    );
    const duration = cleanText(
      stripTags(extractMatch(block, /<(?:var|span)[^>]*class=["'][^"']*duration[^"']*["'][^>]*>([\s\S]*?)<\/(?:var|span)>/i))
    );
    const views = cleanText(
      stripTags(extractMatch(block, /<span[^>]*class=["'][^"']*views[^"']*["'][^>]*>([\s\S]*?)<\/span>/i))
    );
    const added = cleanText(
      stripTags(extractMatch(block, /<(?:var|span)[^>]*class=["'][^"']*added[^"']*["'][^>]*>([\s\S]*?)<\/(?:var|span)>/i))
    );

    if (!title || !poster) continue;
    cards.push({
      id: viewkey,
      viewkey,
      title,
      poster: absolutizeUrl(poster),
      duration,
      views,
      added,
      url: `${PORNHUB_BASE_URL}/view_video.php?viewkey=${encodeURIComponent(viewkey)}`,
    });
  }

  return dedupeById(cards);
}

function parseDetailPage(html, pageUrl) {
  const jsonLd = parseJsonLd(html);
  const definitions = parseMediaDefinitions(html);
  const title = cleanText(
    firstNonEmpty(
      jsonLd.name,
      extractMeta(html, "property", "og:title"),
      stripTags(extractMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i))
    )
  ).replace(/\s*-\s*Pornhub\.com\s*$/i, "");
  const poster = absolutizeUrl(
    firstNonEmpty(jsonLd.thumbnailUrl, extractMeta(html, "property", "og:image")),
    pageUrl
  );
  const description = cleanText(
    firstNonEmpty(jsonLd.description, extractMeta(html, "property", "og:description"))
  );
  const tags = unique(extractAnchorTexts(html, /(?:\/categories\/|\/video\?c=)/i)).slice(0, 16);
  const actors = unique(extractAnchorTexts(html, /\/pornstar\//i)).slice(0, 16);
  const uploadDate = firstNonEmpty(jsonLd.uploadDate);
  const durationSeconds = isoDurationToSeconds(jsonLd.duration);
  const viewkey = extractViewkey(pageUrl);

  return {
    id: pageUrl,
    viewkey,
    type: "movie",
    title,
    poster,
    backdrop: poster,
    overview: description,
    description,
    year: uploadDate ? Number(uploadDate.slice(0, 4)) || undefined : undefined,
    uploadDate,
    runtime: durationSeconds ? Math.round(durationSeconds / 60) : undefined,
    durationSeconds,
    durationText: durationSeconds ? formatDuration(durationSeconds) : "",
    genres: tags,
    actors,
    author: cleanText(jsonLd.author || ""),
    mediaSources: definitions,
    pageUrl,
  };
}

function toMediaCard(item, rank, categoryTitle) {
  return {
    id: item.url,
    title: item.title,
    subtitle: firstNonEmpty(item.views, item.added, categoryTitle),
    type: "movie",
    poster: item.poster,
    backdrop: item.poster,
    rank,
    remarks: item.duration,
    badges: [categoryTitle].filter(Boolean),
    providerIds: {
      pornhub: item.viewkey,
      source: WidgetMetadata.id,
    },
    action: {
      type: "detail",
      id: item.url,
      itemId: item.url,
    },
  };
}

function toDetailPage(detail) {
  const resourceGroups = buildResourceGroups(detail);
  return {
    pageType: "detail",
    id: detail.pageUrl,
    type: "movie",
    title: detail.title,
    name: detail.title,
    year: detail.year,
    poster: detail.poster,
    backdrop: detail.backdrop,
    overview: detail.overview,
    runtime: detail.runtime,
    genres: detail.genres,
    cast: detail.actors.map((name) => ({ id: name, name })),
    studio: detail.author,
    providerIds: {
      pornhub: detail.viewkey,
      source: WidgetMetadata.id,
    },
    resourceGroups,
    resourceSummary: {
      versionCount: detail.mediaSources.length,
      episodeCount: 0,
      defaultVersionId: defaultVersionId(detail.mediaSources),
    },
    recommendations: [],
  };
}

function buildResourceGroups(detail) {
  if (!detail || !detail.mediaSources || !detail.mediaSources.length) return [];
  return [
    {
      id: "online",
      title: "在线播放",
      versions: detail.mediaSources.map((source) => ({
        id: source.id,
        title: source.title,
        name: source.title,
        quality: source.quality ? `${source.quality}P` : "",
        sourceName: "Pornhub",
        availability: "requiresResolve",
        container: source.container,
        default: !!source.default,
        ext: {
          itemId: detail.pageUrl,
          quality: source.quality,
          format: source.format,
        },
        action: {
          type: "play",
          itemId: detail.pageUrl,
          versionId: source.id,
          title: detail.title,
        },
      })),
    },
  ];
}

function parseMediaDefinitions(html) {
  const arrayText = extractJsonArrayAfter(String(html || ""), '"mediaDefinitions":');
  if (!arrayText) return [];
  try {
    const definitions = JSON.parse(arrayText);
    return normalizeMediaDefinitions(definitions);
  } catch (error) {
    logInfo("Pornhub mediaDefinitions parse failed: " + errorMessage(error));
    return [];
  }
}

function normalizeMediaDefinitions(definitions) {
  const sources = [];
  for (const item of Array.isArray(definitions) ? definitions : []) {
    const url = decodeJsonUrl(item && item.videoUrl);
    const format = cleanText(item && item.format).toLowerCase();
    if (!url || !isMediaUrl(url)) continue;
    const quality = normalizeQuality(item.quality || item.height);
    const container = inferContainer(url, format);
    sources.push({
      id: mediaSourceId(quality, format || container),
      title: quality ? `${quality}P ${format.toUpperCase() || container.toUpperCase()}` : "自动画质",
      quality,
      format: format || container,
      container,
      url,
      default: !!item.defaultQuality,
    });
  }
  return sortMediaSources(mergeMediaSources([], sources));
}

function normalizeBrowserMediaSources(result) {
  const values = []
    .concat((result && result.mediaSources) || [])
    .concat((result && result.capturedRequests) || []);
  const sources = [];
  for (const value of values) {
    const url = typeof value === "string"
      ? value
      : firstNonEmpty(value.url, value.requestURL, value.href);
    if (!isMediaUrl(url)) continue;
    const quality = normalizeQuality(
      firstNonEmpty(value.quality, extractMatch(url, /(?:^|[\/_-])(\d{3,4})P?(?:[\/_.-]|$)/i))
    );
    const container = inferContainer(url);
    sources.push({
      id: mediaSourceId(quality, container),
      title: quality ? `${quality}P ${container.toUpperCase()}` : container.toUpperCase(),
      quality,
      format: container === "m3u8" ? "hls" : container,
      container,
      url,
      default: false,
    });
  }
  return sources;
}

function selectMediaSource(sources, versionId) {
  const list = sortMediaSources(sources || []);
  if (!list.length) return null;
  if (versionId) {
    const exact = list.find((source) => source.id === versionId);
    if (exact) return exact;
    const requestedQuality = normalizeQuality(versionId);
    if (requestedQuality) {
      const qualityMatch = list.find((source) => source.quality === requestedQuality);
      if (qualityMatch) return qualityMatch;
    }
  }
  return list.find((source) => source.default) || list[0];
}

function playbackResult(url, referer, source = {}) {
  const container = inferContainer(url, source.format);
  return {
    url,
    videoUrl: url,
    container,
    headers: {
      "User-Agent": PORNHUB_USER_AGENT,
      Referer: normalizeVideoUrl(referer) || PORNHUB_BASE_URL + "/",
      Origin: PORNHUB_BASE_URL,
    },
    subtitles: [],
    danmaku: null,
    startPosition: 0,
    preferDirectAVPlayer: ["m3u8", "m3u", "mpd", "ts"].includes(container),
  };
}

function parseJsonLd(html) {
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(String(html || "")))) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const values = Array.isArray(parsed) ? parsed : [parsed];
      const video = values.find((item) => item && item["@type"] === "VideoObject");
      if (video) return video;
    } catch (error) {
      // Keep looking; pages can contain unrelated malformed JSON-LD blocks.
    }
  }
  return {};
}

function extractJsonArrayAfter(text, marker) {
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) return "";
  const start = text.indexOf("[", markerIndex + marker.length);
  if (start < 0) return "";

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return "";
}

async function httpGet(url, options = {}) {
  const headers = { ...PORNHUB_HEADERS, ...(options.headers || {}) };
  if (typeof Widget !== "undefined" && Widget.http && typeof Widget.http.get === "function") {
    return Widget.http.get(url, { ...options, headers });
  }
  if (typeof $http !== "undefined" && $http && typeof $http.get === "function") {
    return $http.get(url, { ...options, headers });
  }
  if (typeof fetch === "function") {
    const response = await fetch(url, { method: "GET", headers });
    return {
      data: await response.text(),
      status: response.status,
      headers: response.headers,
    };
  }
  throw new Error("No HTTP client is available in this JavaScript runtime.");
}

async function browserFetch(url, options = {}) {
  if (typeof Widget !== "undefined" && Widget.browser && typeof Widget.browser.fetch === "function") {
    return Widget.browser.fetch(url, options);
  }
  if (typeof $browser !== "undefined" && $browser && typeof $browser.fetch === "function") {
    return $browser.fetch(url, options);
  }
  throw new Error("Browser fetch is not available.");
}

function canUseBrowser() {
  return !!(
    (typeof Widget !== "undefined" && Widget.browser && typeof Widget.browser.fetch === "function") ||
    (typeof $browser !== "undefined" && $browser && typeof $browser.fetch === "function")
  );
}

function getResponseText(response) {
  if (typeof response === "string") return response;
  if (!response) return "";
  return firstNonEmpty(response.data, response.html, response.body, response.text);
}

function looksBlocked(html) {
  const text = String(html || "").toLowerCase();
  return (
    text.length < 500 &&
    /access denied|not available in your (?:country|region)|age verification|verify your age|captcha|turnstile/.test(text)
  );
}

function findCategory(id) {
  return PORNHUB_CATEGORIES.find((item) => item.id === id) || PORNHUB_CATEGORIES[0];
}

function normalizeVideoUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^[a-z0-9]+$/i.test(text) && !/^https?/i.test(text)) {
    return `${PORNHUB_BASE_URL}/view_video.php?viewkey=${encodeURIComponent(text)}`;
  }
  return absolutizeUrl(text);
}

function isPornhubVideoUrl(url) {
  return /^https?:\/\/(?:(?:www|[a-z]{2})\.)?pornhub\.(?:com|org)\/view_video\.php\?[^#]*\bviewkey=/i.test(
    String(url || "")
  );
}

function extractViewkey(url) {
  return decodeURIComponent(extractMatch(url, /[?&]viewkey=([^&#]+)/i));
}

function isMediaUrl(url) {
  const text = decodeJsonUrl(url);
  return (
    /^https?:\/\//i.test(text) &&
    (/\/video\/get_media\?/i.test(text) || /\.(?:m3u8?|mpd|mp4|m4v|mov|webm|ts)(?:[?#]|$)/i.test(text))
  );
}

function inferContainer(url, format = "") {
  const pathname = String(url || "").split("?")[0].toLowerCase();
  const extension = extractMatch(pathname, /\.([a-z0-9]+)$/i).toLowerCase();
  if (extension === "m3u" || extension === "m3u8" || String(format).toLowerCase() === "hls") return "m3u8";
  if (extension) return extension;
  return String(format || "").toLowerCase() === "hls" ? "m3u8" : "mp4";
}

function defaultVersionId(sources) {
  const source = selectMediaSource(sources, "");
  return source ? source.id : "";
}

function mediaSourceId(quality, format) {
  return `ph-${quality || "auto"}-${format || "video"}`;
}

function normalizeQuality(value) {
  const match = String(value || "").match(/\b(240|360|480|540|720|1080|1440|2160)\b/);
  return match ? Number(match[1]) : 0;
}

function sortMediaSources(sources) {
  return (sources || []).slice().sort((a, b) => {
    if (!!a.default !== !!b.default) return a.default ? -1 : 1;
    return (b.quality || 0) - (a.quality || 0);
  });
}

function mergeMediaSources(left, right) {
  const seen = {};
  const result = [];
  for (const source of [].concat(left || []).concat(right || [])) {
    if (!source || !source.url) continue;
    const key = source.id || `${source.quality}|${source.format}|${source.url}`;
    if (seen[key]) continue;
    seen[key] = true;
    result.push(source);
  }
  return result;
}

function extractMeta(html, key, value) {
  const tags = String(html || "").match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrValue = extractAttr(tag, new RegExp(`\\b${escapeRegex(key)}=["']([^"']+)["']`, "i"));
    if (attrValue.toLowerCase() !== String(value).toLowerCase()) continue;
    return extractAttr(tag, /\bcontent=["']([^"']*)["']/i);
  }
  return "";
}

function extractAnchorTexts(html, hrefPattern) {
  const values = [];
  const regex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(String(html || "")))) {
    if (!hrefPattern.test(match[1] || "")) continue;
    const text = cleanText(stripTags(match[2]));
    if (text) values.push(text);
  }
  return values;
}

function isoDurationToSeconds(value) {
  const match = String(value || "").match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;
}

function titleScore(left, right) {
  const a = normalizeTitle(left);
  const b = normalizeTitle(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;
  const tokens = b.split(" ").filter((token) => token.length > 2);
  if (!tokens.length) return 0;
  return tokens.filter((token) => a.includes(token)).length / tokens.length;
}

function normalizeTitle(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[._\-:：/\\()[\]{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function argsify(ctx) {
  if (!ctx) return {};
  if (typeof ctx === "object" && !Array.isArray(ctx)) return ctx;
  if (typeof ctx !== "string") return {};
  const value = ctx.trim();
  if (!value || value[0] !== "{") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

function normalizePage(value) {
  const page = Number(value || 1);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function absolutizeUrl(url, base = PORNHUB_BASE_URL) {
  const value = decodeJsonUrl(url).trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) {
    const origin = extractMatch(base, /^(https?:\/\/[^/]+)/i) || PORNHUB_BASE_URL;
    return `${origin}${value}`;
  }
  return `${String(base).replace(/[?#].*$/, "").replace(/\/[^/]*$/, "/")}${value}`;
}

function setQueryParam(url, name, value) {
  const hashParts = String(url || "").split("#");
  const hash = hashParts.length > 1 ? hashParts.slice(1).join("#") : "";
  const queryParts = hashParts[0].split("?");
  const base = queryParts[0];
  const params = (queryParts[1] || "")
    .split("&")
    .filter(Boolean)
    .filter((part) => decodeURIComponent(part.split("=")[0]) !== name);
  params.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
  return `${base}?${params.join("&")}${hash ? `#${hash}` : ""}`;
}

function decodeJsonUrl(value) {
  return String(value || "").replace(/\\\//g, "/").replace(/\\u0026/gi, "&");
}

function extractMatch(value, regex) {
  const match = String(value || "").match(regex);
  return match ? match[1] || match[0] || "" : "";
}

function extractAttr(value, regex) {
  return decodeHtml(extractMatch(value, regex));
}

function stripTags(value) {
  return String(value || "").replace(/<[^>]*>/g, " ");
}

function cleanText(value) {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&period;/g, ".")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}

function unique(values) {
  return [...new Set((values || []).map((value) => cleanText(value)).filter(Boolean))];
}

function dedupeById(items) {
  const seen = {};
  return (items || []).filter((item) => {
    if (!item || !item.id || seen[item.id]) return false;
    seen[item.id] = true;
    return true;
  });
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function errorMessage(error) {
  return error && error.message ? error.message : String(error || "Unknown error");
}

function logInfo(value) {
  if (typeof $log !== "undefined" && $log && typeof $log.info === "function") {
    $log.info(value);
  } else if (typeof console !== "undefined" && console && typeof console.log === "function") {
    console.log(value);
  }
}

const PornhubMediaLibrary = {
  metadata: WidgetMetadata,
  categories: PORNHUB_CATEGORIES,
  init,
  getManifest,
  getHome,
  getCategory,
  getDetail,
  getResourceVersions,
  resolvePlayback,
  search,
  matchResources,
  matchMovie,
  matchEpisode,
  home,
  category,
  detail,
  play,
  getVersions,
  onSearch,
  _internals: {
    parseVideoCards,
    parseDetailPage,
    parseMediaDefinitions,
  },
};

function __jsEvalReturn() {
  return PornhubMediaLibrary;
}

if (typeof globalThis !== "undefined") {
  globalThis.PornhubMediaLibrary = PornhubMediaLibrary;
  globalThis.WidgetMetadata = WidgetMetadata;
  globalThis.init = init;
  globalThis.getManifest = getManifest;
  globalThis.getHome = getHome;
  globalThis.getCategory = getCategory;
  globalThis.getDetail = getDetail;
  globalThis.getResourceVersions = getResourceVersions;
  globalThis.resolvePlayback = resolvePlayback;
  globalThis.search = search;
  globalThis.getSearch = search;
  globalThis.onSearch = onSearch;
  globalThis.matchResources = matchResources;
  globalThis.matchMovie = matchMovie;
  globalThis.matchEpisode = matchEpisode;
  globalThis.home = home;
  globalThis.category = category;
  globalThis.detail = detail;
  globalThis.play = play;
  globalThis.getVersions = getVersions;
  globalThis.__jsEvalReturn = __jsEvalReturn;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = PornhubMediaLibrary;
}
