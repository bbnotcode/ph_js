/**
 * EPORNER - Dreamby / baiPlay 自定义媒体库
 * Source: https://www.eporner.com/
 * Version: 1.0.8
 */

const EP_SITE = "https://www.eporner.com";
const EP_API = `${EP_SITE}/api/v2/video`;
const EP_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const EP_LOGO = "https://www.eporner.com/favicon.ico";

const EP_SECTIONS = [
  { id: "latest-4k", title: "最新 4K", order: "latest", query: "4k", style: "discover.standard" },
  { id: "popular-4k", title: "最多观看 4K", order: "most-popular", query: "4k", style: "discover.ranked" },
  { id: "weekly-4k", title: "本周更新 4K", order: "latest", query: "4k", windowDays: 7, style: "discover.spotlight" },
  { id: "monthly-4k", title: "本月更新 4K", order: "latest", query: "4k", windowDays: 30, style: "discover.standard" }
];

// 真实 API 条目的启动快照。getHome() 同步返回这些条目，避免 Dreamby 等待网络时把首页判空。
// 最新内容仍由 getHomeSection() 和 getCategory() 实时加载。
const EP_BOOTSTRAP_VIDEOS = [
  { id: "SX9UQBEn9w2", title: "Kenzie Taylor, Lilly Bell - Bellesa Films 4K", added: "2026-07-18 12:22:59", length_sec: 1999, length_min: "33:19", views: 1515, rate: "5.00", keywords: "4K, Bellesa Films", default_thumb: { src: "https://static-ca-cdn.eporner.com/thumbs/static4/1/17/177/17707948/15_360.jpg" } },
  { id: "vBo1bCVy9Qv", title: "Innocent Dildoer [4K]", added: "2026-07-19 09:51:41", length_sec: 758, length_min: "12:38", views: 147, rate: "5.00", keywords: "4K", default_thumb: { src: "https://static-ca-cdn.eporner.com/thumbs/static4/1/17/177/17714589/15_360.jpg" } },
  { id: "eFOlKwsZ3d0", title: "Ivy Wolfe, Kazumi - Bellesa Films 4K", added: "2026-07-18 12:44:18", length_sec: 2465, length_min: "41:05", views: 989, rate: "4.38", keywords: "4K, Bellesa Films", default_thumb: { src: "https://static-ca-cdn.eporner.com/thumbs/static4/1/17/177/17708597/11_360.jpg" } },
  { id: "DgW1ynyb4Yg", title: "Blake Blossom, Angel Youngs - Bellesa Films 4K", added: "2026-07-18 11:34:47", length_sec: 1406, length_min: "23:26", views: 1186, rate: "4.62", keywords: "4K, Bellesa Films", default_thumb: { src: "https://static-ca-cdn.eporner.com/thumbs/static4/1/17/177/17706002/4_360.jpg" } },
  { id: "Z8emfgbfoGw", title: "Glass Penetrators [4K]", added: "2026-07-17 10:06:53", length_sec: 1394, length_min: "23:14", views: 276, rate: "5.00", keywords: "4K", default_thumb: { src: "https://static-ca-cdn.eporner.com/thumbs/static4/1/17/177/17700564/14_360.jpg" } },
  { id: "4wMaZ91M9EG", title: "Kali Roses - Bellesa Films 4K", added: "2026-07-18 11:54:49", length_sec: 1599, length_min: "26:39", views: 1706, rate: "5.00", keywords: "4K, Bellesa Films", default_thumb: { src: "https://static-ca-cdn.eporner.com/thumbs/static4/1/17/177/17707789/15_360.jpg" } }
];

function parseContext(ctx) {
  if (typeof ctx === "string") {
    try { return JSON.parse(ctx); } catch (_) { return {}; }
  }
  return ctx || {};
}

function contextValue(ctx, names, fallback) {
  ctx = parseContext(ctx);
  for (const name of names) {
    const value = ctx[name] ?? ctx.params?.[name] ?? ctx.config?.[name] ?? ctx.settings?.[name] ?? ctx.parameters?.[name];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return fallback;
}

function unwrapResponse(response) {
  let body = response?.data ?? response?.body ?? response;
  if (typeof ArrayBuffer !== "undefined" && typeof TextDecoder !== "undefined") {
    if (body instanceof ArrayBuffer) body = new TextDecoder("utf-8").decode(new Uint8Array(body));
    if (ArrayBuffer.isView(body)) body = new TextDecoder("utf-8").decode(new Uint8Array(body.buffer, body.byteOffset, body.byteLength));
  }
  if (typeof body === "string") {
    try { return JSON.parse(body); } catch (_) { return body; }
  }
  return body;
}

function widgetRuntime() {
  if (typeof Widget !== "undefined") return Widget;
  return globalThis && globalThis.Widget ? globalThis.Widget : null;
}

function legacyHttpRuntime() {
  if (typeof $http !== "undefined") return $http;
  return globalThis && globalThis.$http ? globalThis.$http : null;
}

function queryString(values) {
  return Object.keys(values).map(function (key) {
    const value = values[key] === undefined || values[key] === null ? "" : String(values[key]);
    return encodeURIComponent(key) + "=" + encodeURIComponent(value);
  }).join("&");
}

async function httpGet(url, referer) {
  const headers = {
    Accept: url.includes("/api/") ? "application/json, text/plain, */*" : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "User-Agent": EP_UA,
    Referer: referer || `${EP_SITE}/`
  };
  const widget = widgetRuntime();
  const legacyHttp = legacyHttpRuntime();
  let response;
  let requestError;
  try {
    if (widget && widget.http && typeof widget.http.get === "function") response = await widget.http.get(url, { headers, timeout: 30 });
    else if (widget && widget.http && typeof widget.http.request === "function") response = await widget.http.request({ url, method: "GET", headers, timeout: 30 });
    else if (legacyHttp && typeof legacyHttp.get === "function") response = await legacyHttp.get(url, { headers, timeout: 30 });
    else if (legacyHttp && typeof legacyHttp.request === "function") response = await legacyHttp.request({ url, method: "GET", headers, timeout: 30 });
    else if (typeof fetch === "function") response = await fetch(url, { method: "GET", headers });
    else throw new Error("当前运行环境没有可用的 HTTP 客户端");
  } catch (error) {
    requestError = error;
  }

  if (requestError && url.includes("/api/") && widget && widget.browser && typeof widget.browser.fetch === "function") {
    try {
      const browserResult = await widget.browser.fetch(url, {
        visible: false, timeout: 45, waitAfterLoad: 1, waitForAny: true, headers
      });
      const browserBody = unwrapResponse(browserResult?.data ?? browserResult?.body ?? browserResult?.text ?? browserResult?.html ?? browserResult);
      if (browserBody && typeof browserBody === "object") return browserBody;
    } catch (_) {}
  }
  if (requestError) throw requestError;

  if (response && typeof response.text === "function") {
    if (!response.ok) throw new Error(`EPORNER HTTP ${response.status}`);
    const text = await response.text();
    if (url.includes("/api/") || /^\s*[\[{]/.test(text)) {
      try { return JSON.parse(text); } catch (_) {}
    }
    return text;
  }
  return unwrapResponse(response);
}

function imageHeaders() {
  return { Referer: `${EP_SITE}/`, "User-Agent": EP_UA };
}

function normalizeId(raw) {
  raw = String(raw || "").trim();
  if (!raw) return "";
  try { raw = decodeURIComponent(raw); } catch (_) {}
  const match = raw.match(/(?:video-|hd-porn\/|embed\/|eporner:\/\/)?([A-Za-z0-9]{8,16})(?:\/|$|\?|#|\|)/);
  if (match) return match[1];
  return /^[A-Za-z0-9]{8,16}$/.test(raw) ? raw : "";
}

function videoItem(video) {
  const id = String(video?.id || "");
  const poster = video?.default_thumb?.src || video?.thumbs?.[0]?.src || "";
  const rating = Number(video?.rate);
  return {
    id,
    title: String(video?.title || "未命名视频"),
    subtitle: [video?.length_min, video?.added?.slice(0, 10)].filter(Boolean).join(" · "),
    type: "movie",
    poster,
    backdrop: poster,
    overview: String(video?.keywords || ""),
    added: String(video?.added || ""),
    rating: Number.isFinite(rating) ? rating * 2 : undefined,
    runtimeMinutes: video?.length_sec ? Math.round(Number(video.length_sec) / 60) : undefined,
    viewCountText: video?.views === undefined ? "" : Number(video.views).toLocaleString("en-US"),
    metadataText: video?.length_min || "",
    aspectRatio: "16:9",
    imageHeaders: imageHeaders(),
    action: { type: "detail", itemId: id }
  };
}

function searchURL(query, page, order, perPage) {
  const params = queryString({
    query: query || "all",
    per_page: String(perPage || 24),
    page: String(page || 1),
    thumbsize: "big",
    order: order || "latest",
    gay: "0",
    lq: "0",
    format: "json"
  });
  return `${EP_API}/search/?${params}`;
}

async function loadVideos(query, page, order, perPage) {
  const data = await httpGet(searchURL(query, page, order, perPage));
  if (!data || !Array.isArray(data.videos)) throw new Error("EPORNER 列表 API 返回格式异常");
  const videos = data.videos.filter(is4KCandidate);
  return {
    items: videos.map(videoItem),
    hasMore: Number(data.page || page) < Number(data.total_pages || 0),
    total: Number(data.total_count || 0)
  };
}

function is4KCandidate(video) {
  const text = `${video?.title || ""} ${video?.keywords || ""}`;
  return /(?:\b4k\b|2160p|ultra\s*hd)/i.test(text);
}

function withinDays(added, days) {
  if (!days) return true;
  const parsed = new Date(String(added || "").replace(" ", "T") + "Z").getTime();
  if (!Number.isFinite(parsed)) return false;
  return Date.now() - parsed <= Number(days) * 86400000;
}

function getManifest() {
  return {
    id: "eporner-mini-library",
    name: "EPORNER",
    title: "EPORNER",
    version: "1.0.8",
    author: "Codex",
    logo: EP_LOGO,
    icon: EP_LOGO,
    site: EP_SITE,
    description: "EPORNER Dreamby 自定义媒体库，支持首页、分类、搜索、详情和 MP4 播放。仅供年满 18 岁的用户使用。",
    capabilities: { home: true, category: true, detail: true, search: true, resourceVersions: true, playback: true, resourceMatching: false },
    aggregation: { search: true, playbackHistory: true, resourceMatching: false }
  };
}

function getHome() {
  const bootstrap = EP_BOOTSTRAP_VIDEOS.map(videoItem);
  return {
    pageType: "home",
    id: "eporner-home",
    title: "EPORNER",
    heroAspectRatio: "16:9",
    hero: bootstrap,
    sections: [{
      id: "bootstrap", title: "推荐视频", style: "discover.standard", contentType: "movie",
      lazy: false, isLazy: false, items: bootstrap,
      moreAction: { type: "category", pageId: "latest-4k", title: "最新 4K", itemAspectRatio: "16:9" }
    }].concat(EP_SECTIONS.map(section => ({
      id: section.id, title: section.title, style: section.style, contentType: "movie",
      lazy: true, isLazy: true, items: [],
      loadAction: { type: "custom", id: section.id, sectionId: section.id, title: section.title },
      moreAction: { type: "category", id: section.id, pageId: section.id, title: section.title, itemAspectRatio: "16:9" }
    })))
  };
}

async function getHomeSection(ctx) {
  const sectionId = String(contextValue(ctx, ["sectionId", "pageId", "id"], "latest-4k"));
  const section = EP_SECTIONS.find(item => item.id === sectionId) || EP_SECTIONS[0];
  try {
    const result = await loadVideos(section.query, 1, section.order, 18);
    const items = section.windowDays ? result.items.filter(function (item) { return withinDays(item.added, section.windowDays); }) : result.items;
    return {
      id: section.id, title: section.title, style: section.style, contentType: "movie",
      lazy: false, isLazy: false, items,
      moreAction: { type: "category", id: section.id, pageId: section.id, title: section.title, itemAspectRatio: "16:9" }
    };
  } catch (error) {
    return {
      id: section.id, title: section.title, subtitle: error?.message || "加载失败", style: section.style,
      contentType: "movie", lazy: false, isLazy: false, items: [],
      moreAction: { type: "category", id: section.id, pageId: section.id, title: section.title, itemAspectRatio: "16:9" }
    };
  }
}

async function getCategory(ctx) {
  const pageId = String(contextValue(ctx, ["pageId", "id"], "latest-4k"));
  const section = EP_SECTIONS.find(item => item.id === pageId) || EP_SECTIONS[0];
  const page = Math.max(1, Number(contextValue(ctx, ["page"], 1)) || 1);
  const selectedOrder = String(contextValue(ctx, ["sort", "sortBy", "sort_by", "selectedSortValue"], section.order));
  const result = await loadVideos("4k", page, selectedOrder, 24);
  const items = section.windowDays ? result.items.filter(function (item) { return withinDays(item.added, section.windowDays); }) : result.items;
  return {
    pageType: "category", id: section.id, title: section.title, style: "media.posterGrid", itemAspectRatio: "16:9",
    page, hasMore: result.hasMore, items, selectedSortValue: selectedOrder,
    sort: [
      { id: "latest", title: "最新 4K", value: "latest" },
      { id: "most-popular", title: "最多观看 4K", value: "most-popular" }
    ]
  };
}

async function getVideo(id) {
  const data = await httpGet(`${EP_API}/id/?id=${encodeURIComponent(id)}`);
  if (!data?.id) throw new Error("EPORNER 详情 API 未返回有效视频");
  return data;
}

async function getDetail(ctx) {
  const id = normalizeId(contextValue(ctx, ["itemId", "id", "videoId", "sourceId"], ""));
  if (!id) throw new Error("缺少有效的 EPORNER 视频 ID");
  const video = await getVideo(id);
  const item = videoItem(video);
  const keywords = String(video.keywords || "").split(",").map(value => value.trim()).filter(Boolean);
  const versions = buildVersions(id, await getSignedSources(id));
  return {
    pageType: "detail", id, type: "movie", title: video.title, poster: item.poster, backdrop: item.backdrop,
    detailImageAspectRatio: "16:9", imageHeaders: imageHeaders(), posterHeaders: imageHeaders(), backdropHeaders: imageHeaders(),
    overview: keywords.join(" · "), rating: item.rating, runtimeMinutes: item.runtimeMinutes, viewCountText: item.viewCountText,
    genres: keywords.slice(0, 16), resourceGroups: [{ id: "eporner", title: "选择画质", versions, resources: versions }]
  };
}

async function getResourceVersions(ctx) {
  const id = normalizeId(contextValue(ctx, ["itemId", "videoId", "id", "episodeId", "versionId", "resourceId", "url", "path"], ""));
  if (!id) return { groups: [] };
  const versions = buildVersions(id, await getSignedSources(id));
  return { itemId: id, groups: [{ id: "eporner", title: "选择画质", versions }] };
}

function resolutionNumber(label) {
  const match = String(label || "").match(/(\d{3,4})p/i);
  return match ? Number(match[1]) : 0;
}

function buildVersions(id, sourceData) {
  const mp4Entries = Object.entries(sourceData?.sources?.mp4 || {}).sort(function (left, right) {
    const leftHeight = resolutionNumber(left[1]?.labelShort || left[0]);
    const rightHeight = resolutionNumber(right[1]?.labelShort || right[0]);
    return rightHeight - leftHeight;
  }).filter(function (entry) { return resolutionNumber(entry[1]?.labelShort || entry[0]) >= 2160; });
  const hasHLS = !!sourceData?.sources?.hls?.auto?.src;
  const versions = mp4Entries.map(function (entry, index) {
    const key = entry[0];
    const source = entry[1] || {};
    const title = source.labelShort || key;
    const height = resolutionNumber(title);
    const sourceKey = hasHLS && height ? `quality:${height}:${key}` : `mp4:${key}`;
    return makeVersion(id, sourceKey, title, hasHLS && height ? "m3u8" : "mp4", index === 0);
  });
  if (!versions.length) throw new Error("该视频没有可用的 4K（2160p）播放源");
  return versions;
}

function absoluteMediaURL(baseURL, value) {
  value = String(value || "").trim();
  if (/^https?:\/\//i.test(value)) return value;
  const origin = String(baseURL || "").match(/^(https?:\/\/[^/]+)/i)?.[1] || EP_SITE;
  if (value.startsWith("/")) return origin + value;
  return String(baseURL || "").replace(/[^/]*(?:\?.*)?$/, "") + value;
}

function selectHLSVariant(master, masterURL, requestedHeight) {
  const lines = String(master || "").split(/\r?\n/);
  const variants = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^#EXT-X-STREAM-INF:/i.test(lines[index])) continue;
    const height = Number(lines[index].match(/RESOLUTION=\d+x(\d+)/i)?.[1] || 0);
    let url = "";
    for (let next = index + 1; next < lines.length; next += 1) {
      const candidate = lines[next].trim();
      if (!candidate || candidate.startsWith("#")) continue;
      url = absoluteMediaURL(masterURL, candidate);
      break;
    }
    if (url) variants.push({ height, url });
  }
  variants.sort(function (left, right) { return right.height - left.height; });
  return variants.find(function (item) { return item.height === Number(requestedHeight); }) ||
    variants.find(function (item) { return item.height <= Number(requestedHeight); }) || variants[0] || null;
}

function makeVersion(id, sourceKey, title, container, isDefault) {
  const versionId = `eporner://${id}|${encodeURIComponent(sourceKey)}`;
  return {
    id: versionId, title, name: title, container, sourceName: "EPORNER", default: !!isDefault,
    action: { type: "play", itemId: id, videoId: id, versionId }
  };
}

function compactHash(hash) {
  if (!/^[a-f0-9]{32}$/i.test(String(hash || ""))) return "";
  return [0, 8, 16, 24].map(index => parseInt(hash.slice(index, index + 8), 16).toString(36)).join("");
}

async function getSignedSources(id) {
  const embedURL = `${EP_SITE}/embed/${id}/`;
  const html = String(await httpGet(embedURL, `${EP_SITE}/`));
  const hash = html.match(/EP\.video\.player\.hash\s*=\s*['"]([a-f0-9]{32})['"]/i)?.[1];
  const token = compactHash(hash);
  if (!token) throw new Error("EPORNER 播放页没有返回有效 hash");
  const params = queryString({
    hash: token, domain: "www.eporner.com", pixelRatio: "1", playerWidth: "390", playerHeight: "844",
    fallback: "false", embed: "true", supportedFormats: "hls,mp4", _: String(Date.now())
  });
  const data = await httpGet(`${EP_SITE}/xhr/video/${id}?${params}`, embedURL);
  if (!data?.available || !data?.sources) throw new Error(data?.message || "EPORNER 没有返回可用播放源");
  return data;
}

function playbackDescriptor(ctx) {
  const raw = String(contextValue(ctx, ["versionId", "resourceId", "episodeId", "itemId", "videoId", "id", "url", "path"], ""));
  const id = normalizeId(raw) || normalizeId(contextValue(ctx, ["itemId", "videoId", "id"], ""));
  const encodedKey = raw.includes("|") ? raw.slice(raw.indexOf("|") + 1) : "highest";
  let sourceKey = "highest";
  try { sourceKey = decodeURIComponent(encodedKey || "highest"); } catch (_) {}
  return { id, sourceKey };
}

async function resolvePlayback(ctx) {
  ctx = parseContext(ctx);
  const direct = String(contextValue(ctx, ["playUrl", "videoUrl", "mediaUrl", "src"], ""));
  if (/^https?:\/\/[^\s]+\.mp4(?:\?|$)/i.test(direct)) {
    return { url: direct, container: "mp4", headers: { Referer: `${EP_SITE}/`, "User-Agent": EP_UA }, startPositionSeconds: 0, isLive: false, streamKind: "vod" };
  }
  const descriptor = playbackDescriptor(ctx);
  const id = descriptor.id;
  if (!id) throw new Error("没有解析到 EPORNER 视频 ID");
  const embedURL = `${EP_SITE}/embed/${id}/`;
  const sourceData = await getSignedSources(id);
  const sortedMP4 = Object.entries(sourceData.sources?.mp4 || {}).sort(function (left, right) {
    return resolutionNumber(right[1]?.labelShort || right[0]) - resolutionNumber(left[1]?.labelShort || left[0]);
  }).filter(function (entry) { return resolutionNumber(entry[1]?.labelShort || entry[0]) >= 2160; });
  if (!sortedMP4.length) throw new Error("该视频没有可用的 4K（2160p）播放源");
  let source;
  if (descriptor.sourceKey === "hls") source = sourceData.sources?.hls?.auto;
  else if (descriptor.sourceKey.startsWith("mp4:")) source = sourceData.sources?.mp4?.[descriptor.sourceKey.slice(4)];
  else if (descriptor.sourceKey.startsWith("quality:") || descriptor.sourceKey === "highest") {
    const parts = descriptor.sourceKey.split(":");
    const requestedHeight = descriptor.sourceKey === "highest" ? resolutionNumber(sortedMP4[0]?.[1]?.labelShort || sortedMP4[0]?.[0]) : Number(parts[1] || 0);
    const fallbackKey = parts.slice(2).join(":");
    const hlsMaster = sourceData.sources?.hls?.auto;
    if (hlsMaster?.src) {
      try {
        const variant = selectHLSVariant(await httpGet(hlsMaster.src, embedURL), hlsMaster.src, requestedHeight);
        if (variant?.url) source = { src: variant.url, type: "application/x-mpegURL" };
      } catch (_) {}
    }
    if (!source?.src && fallbackKey) source = sourceData.sources?.mp4?.[fallbackKey];
    if (!source?.src) source = sortedMP4.find(function (entry) { return resolutionNumber(entry[1]?.labelShort || entry[0]) === requestedHeight; })?.[1];
  }
  if (!source?.src) source = sortedMP4[0]?.[1];
  const url = source?.src || "";
  if (!url) throw new Error("没有解析到 EPORNER 播放地址");
  const isHLS = /\.m3u8(?:\?|$)/i.test(url) || /mpegurl/i.test(source?.type || "");
  return {
    url, videoUrl: url, container: isHLS ? "m3u8" : "mp4",
    headers: { Referer: embedURL, Origin: EP_SITE, "User-Agent": EP_UA },
    startPositionSeconds: 0, isLive: false, streamKind: "vod"
  };
}

async function search(ctx) {
  const query = String(contextValue(ctx, ["query", "keyword", "text"], "")).trim();
  const page = Math.max(1, Number(contextValue(ctx, ["page"], 1)) || 1);
  if (!query) return { pageType: "search", title: "搜索", query, keyword: query, page, hasMore: false, items: [] };
  const result = await loadVideos(`${query} 4k`, page, "latest", 24);
  return { pageType: "search", title: `搜索：${query}`, query, keyword: query, page, hasMore: result.hasMore, items: result.items };
}

const api = {
  getManifest, getHome, getHomeSection, getCategory, getDetail, getResourceVersions, resolvePlayback, search,
  home: getHome, homeSection: getHomeSection, getSection: getHomeSection, category: getCategory, detail: getDetail,
  getVersions: getResourceVersions, versions: getResourceVersions, resolvePlay: resolvePlayback, play: resolvePlayback,
  getPlayback: resolvePlayback, getPlayinfo: resolvePlayback, quickSearch: search, getSearch: search, onSearch: search
};

Object.assign(globalThis, api);
if (typeof module !== "undefined" && module.exports) module.exports = api;
