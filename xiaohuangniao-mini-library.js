/**
 * 小黄鸟 - Dreamby / baiPlay 自定义媒体库
 * Source: https://xiaohuangniao.me/
 * Version: 1.1.0
 */

const XHN_SITE = "https://xiaohuangniao.me";
const XHN_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const XHN_LOGO = `${XHN_SITE}/logo.png`;
const XHN_PAGE_SIZE = 24;
const XHN_TWEETS = new Map();

const XHN_SECTIONS = [
  { id: "categories", title: "全部分类", mode: "categories", style: "discover.annualCategories" },
  { id: "latest", title: "最新视频", mode: "latest", style: "discover.standard" },
  { id: "popular", title: "热门长视频", mode: "popular", style: "discover.ranked" },
  { id: "fuliji", title: "福利姬", mode: "search", query: "福利姬", style: "discover.spotlight" },
  { id: "cos", title: "COS", mode: "search", query: "COS", style: "discover.standard" }
];

function parseContext(ctx) {
  if (typeof ctx === "string") { try { return JSON.parse(ctx); } catch (_) { return {}; } }
  return ctx || {};
}

function contextValue(ctx, names, fallback) {
  ctx = parseContext(ctx);
  const bags = [ctx, ctx.params, ctx.config, ctx.settings, ctx.parameters, ctx.pagination, ctx.pageInfo];
  for (const name of names) for (const bag of bags) {
    const value = bag && bag[name];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return fallback;
}

function runtimeWidget() {
  if (typeof Widget !== "undefined") return Widget;
  return typeof globalThis !== "undefined" ? globalThis.Widget : null;
}

function runtimeHttp() {
  if (typeof $http !== "undefined") return $http;
  return typeof globalThis !== "undefined" ? globalThis.$http : null;
}

function unwrapResponse(response) {
  let body = response && (response.data ?? response.body ?? response.text ?? response);
  if (typeof body === "string") { try { return JSON.parse(body); } catch (_) { return body; } }
  return body;
}

async function httpGet(url) {
  const headers = { Accept: "application/json, text/plain, */*", Referer: `${XHN_SITE}/`, "User-Agent": XHN_UA };
  const widget = runtimeWidget();
  const legacy = runtimeHttp();
  let response;
  if (widget?.http?.get) response = await widget.http.get(url, { headers, timeout: 20 });
  else if (widget?.http?.request) response = await widget.http.request({ url, method: "GET", headers, timeout: 20 });
  else if (legacy?.get) response = await legacy.get(url, { headers, timeout: 20 });
  else if (legacy?.request) response = await legacy.request({ url, method: "GET", headers, timeout: 20 });
  else if (typeof fetch === "function") response = await fetch(url, { headers });
  else throw new Error("当前运行环境没有可用的 HTTP 客户端");
  if (response && typeof response.json === "function") {
    if (!response.ok) throw new Error(`小黄鸟 HTTP ${response.status}`);
    return response.json();
  }
  return unwrapResponse(response);
}

async function httpGetText(url) {
  const headers = { Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", Referer: `${XHN_SITE}/`, "User-Agent": XHN_UA };
  const widget = runtimeWidget();
  const legacy = runtimeHttp();
  let response;
  if (widget?.http?.get) response = await widget.http.get(url, { headers, timeout: 20 });
  else if (widget?.http?.request) response = await widget.http.request({ url, method: "GET", headers, timeout: 20 });
  else if (legacy?.get) response = await legacy.get(url, { headers, timeout: 20 });
  else if (legacy?.request) response = await legacy.request({ url, method: "GET", headers, timeout: 20 });
  else if (typeof fetch === "function") response = await fetch(url, { headers });
  else throw new Error("当前运行环境没有可用的 HTTP 客户端");
  if (response && typeof response.text === "function") {
    if (!response.ok) throw new Error(`小黄鸟 HTTP ${response.status}`);
    return response.text();
  }
  const body = response?.data ?? response?.body ?? response?.text ?? response;
  return typeof body === "string" ? body : String(body || "");
}

function imageHeaders() { return { Referer: `${XHN_SITE}/`, "User-Agent": XHN_UA }; }
function mediaHeaders() { return { Referer: "https://x.com/", Origin: "https://x.com", "User-Agent": XHN_UA }; }
function compactText(value, max) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, max || 120); }
function numberText(value) { const n = Number(value || 0); return n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n); }

function decodeHTML(value) {
  return String(value || "").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function parseCategoriesHTML(html) {
  const results = [];
  const seen = new Set();
  const pattern = /<button\b[^>]*>[\s\S]*?<img\b[^>]*src="([^"]+)"[^>]*alt="([^"]+)"[^>]*>[\s\S]*?<p\b[^>]*>([^<]+)<\/p><p\b[^>]*>([\d,]+)(?:<!-- -->)?\s*热度<\/p>[\s\S]*?<\/button>/g;
  let match;
  while ((match = pattern.exec(String(html || "")))) {
    const keyword = decodeHTML(match[3] || match[2]).trim();
    if (!keyword || seen.has(keyword)) continue;
    seen.add(keyword);
    results.push({ keyword, poster: decodeHTML(match[1]), searchCount: Number(String(match[4]).replace(/,/g, "")) || 0 });
  }
  return results;
}

function categoryItem(category, rank) {
  const keyword = String(category?.keyword || "");
  const poster = String(category?.poster || "");
  return {
    id: `tag:${keyword}`, title: keyword, type: "category", rank: Number(rank) + 1,
    subtitle: `${Number(category?.searchCount || 0).toLocaleString("en-US")} 热度`, metadataText: numberText(category?.searchCount),
    poster, backdrop: poster, aspectRatio: "16:9", imageHeaders: imageHeaders(), posterHeaders: imageHeaders(), backdropHeaders: imageHeaders(),
    action: { type: "category", pageId: `tag:${keyword}`, title: keyword, itemAspectRatio: "16:9" }
  };
}

async function loadCategories() {
  const html = await httpGetText(`${XHN_SITE}/categories`);
  const categories = parseCategoriesHTML(html);
  if (!categories.length) throw new Error("分类页没有解析到分类数据");
  return categories;
}

function videoMedia(tweet) {
  return (tweet?.extendedEntities?.media || []).filter(media => Array.isArray(media?.video_info?.variants) && media.video_info.variants.some(v => /video\/mp4|mpegurl/i.test(v.content_type || "")));
}

function posterOf(tweet) {
  const media = tweet?.extendedEntities?.media?.[0];
  return media?.media_url_https || media?.media_url || tweet?.mediaUrls?.find(x => x.type === "photo")?.url || tweet?.author?.profilePicture || XHN_LOGO;
}

function aspectOf(tweet) {
  const ratio = videoMedia(tweet)[0]?.video_info?.aspect_ratio;
  return Array.isArray(ratio) && ratio[0] && ratio[1] ? `${ratio[0]}:${ratio[1]}` : "16:9";
}

function remember(tweet) {
  if (!tweet) return;
  const keys = [tweet.id, tweet.tweetId].filter(Boolean).map(String);
  keys.forEach(key => XHN_TWEETS.set(key, tweet));
  try {
    if (typeof $cache !== "undefined" && $cache?.set) keys.forEach(key => $cache.set(`xhn:${key}`, JSON.stringify(tweet)));
  } catch (_) {}
}

function tweetItem(tweet, rank) {
  remember(tweet);
  const media = videoMedia(tweet);
  const duration = Math.max(0, ...media.map(m => Number(m?.video_info?.duration_millis || 0)));
  const title = compactText(tweet.text, 70) || `${tweet?.author?.name || "小黄鸟"}的视频`;
  const poster = posterOf(tweet);
  return {
    id: String(tweet.tweetId || tweet.id), title, type: media.length > 1 ? "series" : "movie",
    subtitle: `@${tweet?.author?.userName || "unknown"} · ${numberText(tweet.viewCount)} 次观看`,
    poster, backdrop: poster, overview: String(tweet.text || ""), rank,
    year: Number(String(tweet.tweetCreatedAt || "").slice(0, 4)) || undefined,
    runtimeMinutes: duration ? Math.max(1, Math.round(duration / 60000)) : undefined,
    viewCountText: numberText(tweet.viewCount), metadataText: duration ? `${Math.round(duration / 60000)} 分钟` : "",
    aspectRatio: aspectOf(tweet), imageHeaders: imageHeaders(), posterHeaders: imageHeaders(), backdropHeaders: imageHeaders(),
    badges: media.length > 1 ? [`${media.length} 段`] : [], action: { type: "detail", itemId: String(tweet.tweetId || tweet.id) }
  };
}

function apiURL(mode, page, limit, query) {
  if (mode === "search") return `${XHN_SITE}/api/search/tweets?q=${encodeURIComponent(query || "")}&page=${page}&limit=${limit}`;
  const extras = mode === "popular" ? "&minViewCount=10000&minDuration=180000" : "";
  return `${XHN_SITE}/api/tweet?page=${page}&limit=${limit}${extras}`;
}

async function loadTweets(mode, page, limit, query) {
  const data = await httpGet(apiURL(mode, page, limit, query));
  const payload = data?.data || data;
  const tweets = Array.isArray(payload?.tweets) ? payload.tweets : [];
  const playable = tweets.filter(tweet => videoMedia(tweet).length > 0);
  playable.forEach(remember);
  const totalPages = Number(payload?.totalPages || 0);
  return { tweets: playable, items: playable.map((t, i) => tweetItem(t, (page - 1) * limit + i + 1)), page: Number(payload?.page || page), totalPages, total: Number(payload?.total || 0), hasMore: totalPages ? page < totalPages : tweets.length >= limit };
}

async function findTweet(id) {
  id = String(id || "");
  if (XHN_TWEETS.has(id)) return XHN_TWEETS.get(id);
  try {
    if (typeof $cache !== "undefined" && $cache?.get) {
      const cached = await $cache.get(`xhn:${id}`);
      if (cached) { const parsed = typeof cached === "string" ? JSON.parse(cached) : cached; remember(parsed); return parsed; }
    }
  } catch (_) {}
  const result = await loadTweets("search", 1, 20, id);
  const exact = result.tweets.find(t => String(t.tweetId) === id || String(t.id) === id);
  if (exact) return exact;
  throw new Error(`找不到内容 ${id}，请从列表重新打开`);
}

function variantsFor(tweet, mediaIndex) {
  const media = videoMedia(tweet)[mediaIndex];
  const variants = (media?.video_info?.variants || []).filter(v => /video\/mp4/i.test(v.content_type || "") && v.url);
  return variants.map(v => {
    const match = String(v.url).match(/\/(\d+)x(\d+)\//);
    const width = match ? Number(match[1]) : 0;
    const height = match ? Number(match[2]) : 0;
    return { url: v.url, bitrate: Number(v.bitrate || 0), width, height, quality: width && height ? Math.min(width, height) : 0 };
  }).sort((a, b) => b.quality - a.quality || b.bitrate - a.bitrate);
}

function versionGroups(tweet, selectedEpisode) {
  const medias = videoMedia(tweet);
  const indices = selectedEpisode && /^m\d+$/.test(selectedEpisode) ? [Number(selectedEpisode.slice(1))] : medias.map((_, i) => i);
  return indices.filter(i => medias[i]).map(i => {
    const variants = variantsFor(tweet, i);
    return {
      id: `media-${i}`, title: medias.length > 1 ? `第 ${i + 1} 段` : "播放画质",
      versions: variants.map((v, index) => ({
        id: `m${i}-q${v.quality}-b${v.bitrate}`, name: v.quality ? `${v.quality}P` : "MP4", subtitle: `${v.width}×${v.height}`,
        container: "mp4", default: index === 0, headers: mediaHeaders(),
        action: { type: "play", itemId: String(tweet.tweetId || tweet.id), episodeId: `m${i}`, versionId: `m${i}-q${v.quality}-b${v.bitrate}` }
      }))
    };
  });
}

function getManifest() {
  return {
    id: "xiaohuangniao-mini-library", name: "小黄鸟", title: "小黄鸟", version: "1.1.0", author: "Alan huang",
    logo: XHN_LOGO, icon: XHN_LOGO, site: XHN_SITE,
    description: "小黄鸟公开内容的原生媒体库适配器，支持列表、分类、搜索、详情、多段视频与真实 MP4 画质。仅供年满 18 岁的用户使用。",
    capabilities: { home: true, category: true, detail: true, search: true, resourceVersions: true, playback: true, resourceMatching: false },
    aggregation: { search: true, playbackHistory: true, resourceMatching: false },
    parameters: [{ name: "baseUrl", title: "站点地址", type: "input", value: XHN_SITE }]
  };
}

async function getHome() {
  const latest = await loadTweets("latest", 1, 16);
  return {
    pageType: "home", id: "xiaohuangniao-home", title: "小黄鸟", heroAspectRatio: "16:9", hero: latest.items.slice(0, 6),
    sections: [{ id: "latest", title: "最新视频", style: "discover.standard", lazy: false, items: latest.items,
      moreAction: { type: "category", pageId: "latest", title: "最新视频", itemAspectRatio: "16:9" } }].concat(XHN_SECTIONS.filter(s => s.id !== "latest").map(s => ({
        id: s.id, title: s.title, style: s.style, lazy: true, items: [],
        moreAction: { type: "category", pageId: s.id, title: s.title, itemAspectRatio: "16:9" }
      })))
  };
}

async function getHomeSection(ctx) {
  const id = String(contextValue(ctx, ["sectionId", "pageId", "id"], "latest"));
  const section = XHN_SECTIONS.find(s => s.id === id) || XHN_SECTIONS.find(s => s.id === "latest");
  try {
    if (section.mode === "categories") {
      const categories = await loadCategories();
      return { id: section.id, title: section.title, style: section.style, lazy: false, items: categories.map(categoryItem),
        moreAction: { type: "category", pageId: "categories", title: "全部分类", itemAspectRatio: "16:9" } };
    }
    const result = await loadTweets(section.mode, 1, 18, section.query);
    return { id: section.id, title: section.title, style: section.style, lazy: false, items: result.items,
      moreAction: { type: "category", pageId: section.id, title: section.title, itemAspectRatio: "16:9" } };
  } catch (error) {
    return { id: section.id, title: section.title, subtitle: error?.message || "加载失败", style: section.style, lazy: false, items: [] };
  }
}

async function getCategory(ctx) {
  const id = String(contextValue(ctx, ["pageId", "id"], "latest"));
  const page = Math.max(1, Number(contextValue(ctx, ["page", "pg", "currentPage", "pageNumber", "pageIndex"], 1)) || 1);
  if (id === "categories") {
    const categories = await loadCategories();
    return { pageType: "category", id, title: "全部分类", style: "discover.annualCategories", itemAspectRatio: "16:9",
      page: 1, hasMore: false, total: categories.length, items: categories.map(categoryItem) };
  }
  const section = XHN_SECTIONS.find(s => s.id === id);
  const query = section?.query || (id.startsWith("tag:") ? id.slice(4) : "");
  const mode = section?.mode || (query ? "search" : "latest");
  const result = await loadTweets(mode, page, XHN_PAGE_SIZE, query);
  return { pageType: "category", id, title: section?.title || query || "最新视频", style: "media.posterGrid", itemAspectRatio: "16:9",
    page: result.page, hasMore: result.hasMore, totalPages: result.totalPages, total: result.total, items: result.items };
}

async function getDetail(ctx) {
  const id = contextValue(ctx, ["itemId", "id", "tweetId"], "");
  const tweet = await findTweet(id);
  const item = tweetItem(tweet);
  const medias = videoMedia(tweet);
  const seasons = medias.length > 1 ? [{ id: "segments", title: "视频分段", seasonNumber: 1, episodes: medias.map((m, i) => ({
    id: `m${i}`, title: `第 ${i + 1} 段`, episodeNumber: i + 1,
    runtimeMinutes: m.video_info?.duration_millis ? Math.max(1, Math.round(m.video_info.duration_millis / 60000)) : undefined,
    still: m.media_url_https || m.media_url, stillHeaders: imageHeaders(), action: { type: "play", itemId: String(tweet.tweetId || tweet.id), episodeId: `m${i}` }
  })) }] : undefined;
  return { pageType: "detail", ...item, detailImageAspectRatio: aspectOf(tweet),
    cast: [{ name: tweet?.author?.name || "未知作者", role: `@${tweet?.author?.userName || "unknown"}`, avatar: tweet?.author?.profilePicture, avatarReferer: `${XHN_SITE}/` }],
    seasons, resourceGroups: versionGroups(tweet, medias.length === 1 ? "m0" : "") };
}

async function getResourceVersions(ctx) {
  const id = contextValue(ctx, ["itemId", "id", "tweetId"], "");
  const episodeId = String(contextValue(ctx, ["episodeId"], ""));
  const tweet = await findTweet(id);
  return { itemId: String(tweet.tweetId || tweet.id), episodeId, groups: versionGroups(tweet, episodeId) };
}

async function resolvePlayback(ctx) {
  const id = contextValue(ctx, ["itemId", "id", "tweetId"], "");
  const episodeId = String(contextValue(ctx, ["episodeId"], "m0"));
  const versionId = String(contextValue(ctx, ["versionId"], ""));
  const tweet = await findTweet(id);
  const requestedMedia = (versionId.match(/^m(\d+)-/) || episodeId.match(/^m(\d+)$/) || [])[1];
  const mediaIndex = requestedMedia === undefined ? 0 : Number(requestedMedia);
  const variants = variantsFor(tweet, mediaIndex);
  if (!variants.length) throw new Error(`第 ${mediaIndex + 1} 段没有可播放 MP4`);
  const spec = versionId.match(/-q(\d+)-b(\d+)$/);
  const selected = spec ? variants.find(v => v.quality === Number(spec[1]) && v.bitrate === Number(spec[2])) : variants[0];
  const stream = selected || variants[0];
  return { url: stream.url, container: "mp4", headers: mediaHeaders(), startPositionSeconds: 0, isLive: false, streamKind: "vod" };
}

async function search(ctx) {
  const query = String(contextValue(ctx, ["query", "keyword", "text"], "")).trim();
  const page = Math.max(1, Number(contextValue(ctx, ["page", "pg", "currentPage", "pageNumber", "pageIndex"], 1)) || 1);
  if (!query) {
    const categories = await loadCategories();
    return { pageType: "search", title: "搜索", keyword: "", page, hasMore: false, items: categories.map(categoryItem), suggestions: categories.map(x => x.keyword) };
  }
  const result = await loadTweets("search", page, XHN_PAGE_SIZE, query);
  return { pageType: "search", title: `搜索：${query}`, keyword: query, page: result.page, hasMore: result.hasMore,
    totalPages: result.totalPages, total: result.total, items: result.items };
}

const exported = { getManifest, getHome, getHomeSection, getCategory, getDetail, getResourceVersions, resolvePlayback, search };
if (typeof globalThis !== "undefined") Object.assign(globalThis, exported, { home: getHome, homeSection: getHomeSection, category: getCategory, detail: getDetail, versions: getResourceVersions, play: resolvePlayback, getSearch: search });
if (typeof module !== "undefined" && module.exports) module.exports = exported;
