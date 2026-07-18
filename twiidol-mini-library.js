/**
 * TwiIdol - Dreamby / baiPlay 自定义媒体库
 * Source: https://www.twiidol.com/zh-cn
 */

const SITE = "https://www.twiidol.com";
const LOCALE = "/zh-cn";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36";
const LOGO = `${SITE}/icon.png`;

const SECTIONS = [
  { id: "latest", title: "最新视频", style: "discover.standard" },
  { id: "views-24h", title: "24 小时浏览榜", style: "discover.ranked" },
  { id: "downloads-1w", title: "本周下载榜", style: "discover.ranked" },
  { id: "likes-1m", title: "本月点赞榜", style: "discover.ranked" },
  { id: "popular-users", title: "热门人物", style: "discover.annualWidePreview" }
];

function parseContext(ctx) {
  if (typeof ctx === "string") {
    try { return JSON.parse(ctx); } catch (_) { return {}; }
  }
  return ctx || {};
}

function value(ctx, names, fallback) {
  ctx = parseContext(ctx);
  for (const name of names) {
    const v = ctx[name] ?? ctx.params?.[name] ?? ctx.config?.[name] ?? ctx.settings?.[name] ?? ctx.parameters?.[name];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return fallback;
}

function asText(v) { return v === undefined || v === null ? "" : String(v).trim(); }
function positiveInt(v, fallback) { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : fallback; }

function unwrap(response) {
  let body = response?.data ?? response?.body ?? response?.text ?? response;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (_) { throw new Error("TwiIdol 返回了非 JSON 数据"); }
  }
  if (!body || body.ok === false) throw new Error(body?.error || body?.message || "TwiIdol 请求失败");
  return body;
}

async function request(path) {
  const url = /^https?:\/\//i.test(path) ? path : `${SITE}${path}`;
  const headers = {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "User-Agent": UA,
    Referer: `${SITE}${LOCALE}/`
  };
  let httpError;
  try {
    let response;
    if (typeof Widget !== "undefined" && Widget.http && typeof Widget.http.get === "function") response = await Widget.http.get(url, { headers, timeout: 30 });
    else if (typeof Widget !== "undefined" && Widget.http && typeof Widget.http.request === "function") response = await Widget.http.request({ url, method: "GET", headers, timeout: 30 });
    else if (typeof $http !== "undefined" && typeof $http.get === "function") response = await $http.get(url, { headers, timeout: 30 });
    else if (typeof $http !== "undefined" && typeof $http.request === "function") response = await $http.request({ url, method: "GET", headers, timeout: 30 });
    else if (typeof fetch === "function") {
      response = await fetch(url, { headers });
      response = await response.json();
    } else throw new Error("当前环境没有可用的 HTTP 客户端");
    return unwrap(response);
  } catch (error) { httpError = error; }

  const browserData = await browserRequestJson(url, headers);
  if (browserData) return unwrap(browserData);
  throw httpError || new Error("TwiIdol 请求失败");
}

async function browserRequestJson(url, headers) {
  if (typeof Widget === "undefined" || !Widget.browser || typeof Widget.browser.fetch !== "function") return null;
  try {
    const result = await Widget.browser.fetch(url, {
      visible: false,
      timeout: 45,
      waitAfterLoad: 1,
      waitForAny: true,
      headers
    });
    let raw = result?.data ?? result?.body ?? result?.text ?? result?.html ?? result;
    if (raw && typeof raw === "object") return raw;
    raw = asText(raw)
      .replace(/^\s*<pre[^>]*>/i, "")
      .replace(/<\/pre>\s*$/i, "")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&#39;|&apos;/g, "'")
      .trim();
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function encodePayload(item) {
  const data = {
    id: asText(item?.mediaKey || item?.tweetId),
    tweetId: asText(item?.tweetId || item?.mediaKey),
    url: asText(item?.bestVideoUrl),
    poster: asText(item?.thumbnailUrl),
    userName: asText(item?.userName || item?.userId),
    userDisplayName: asText(item?.userDisplayName),
    count: Number(item?.count) || 0,
    ts: item?.ts || item?.createdAt || item?.updatedAt || ""
  };
  return `twiidol://${encodeURIComponent(JSON.stringify(data))}`;
}

function decodePayload(raw) {
  raw = asText(raw);
  if (!raw.startsWith("twiidol://")) return {};
  try { return JSON.parse(decodeURIComponent(raw.slice(10))); } catch (_) { return {}; }
}

function imageHeaders() { return { Referer: `${SITE}/`, "User-Agent": UA }; }
function playbackHeaders() { return { Referer: "https://x.com/", Origin: "https://x.com", "User-Agent": UA, Accept: "video/mp4,video/*;q=0.9,*/*;q=0.8" }; }

function timeText(item) {
  const raw = item?.ts || item?.createdAt || item?.updatedAt;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : "";
}

function mediaItem(item, rank) {
  const id = asText(item?.mediaKey || item?.tweetId);
  const payload = encodePayload(item);
  const owner = asText(item?.userDisplayName || item?.userName || "TwiIdol 视频");
  const count = Number(item?.count) || 0;
  return {
    id: id || payload,
    title: owner,
    subtitle: [timeText(item), count ? `${Math.round(count)} 次` : "Twitter / X"].filter(Boolean).join(" · "),
    type: "movie",
    poster: asText(item?.thumbnailUrl),
    backdrop: asText(item?.thumbnailUrl),
    overview: `来自 @${asText(item?.userName || item?.userId || "unknown")} 的 Twitter（X）视频。`,
    rank: rank || undefined,
    remarks: "MP4",
    badges: ["原画", "MP4"],
    url: asText(item?.bestVideoUrl),
    videoUrl: asText(item?.bestVideoUrl),
    aspectRatio: "2:3",
    imageFit: "fill",
    imageHeaders: imageHeaders(),
    action: { type: "detail", itemId: payload }
  };
}

function userItem(user, previews) {
  const userName = asText(user?.userName || user?.userId);
  const name = asText(user?.userDisplayName || userName);
  const previewItems = (previews || []).slice(0, 6).map(mediaItem);
  return {
    id: `user:${userName}`,
    title: name,
    subtitle: `@${userName}${user?.count ? ` · ${Math.round(Number(user.count))} 热度` : ""}`,
    type: "collection",
    poster: previewItems[0]?.poster || "",
    backdrop: previewItems[0]?.backdrop || "",
    previewItems,
    imageHeaders: imageHeaders(),
    action: { type: "category", pageId: `user:${userName}`, title: name, itemAspectRatio: "2:3" }
  };
}

function getManifest() {
  return {
    id: "twiidol-twitter-video",
    name: "TwiIdol",
    title: "TwiIdol Twitter 视频",
    version: "1.0.3",
    author: "Codex",
    site: `${SITE}${LOCALE}`,
    logo: LOGO,
    icon: LOGO,
    description: "TwiIdol Twitter（X）偶像视频、排行榜与热门人物。",
    capabilities: { home: true, category: true, detail: true, search: true, resourceVersions: true, playback: true, resourceMatching: false },
    aggregation: { search: true, playbackHistory: true, resourceMatching: false }
  };
}

async function getHome() {
  let recent = [], ranking = [], loadError = "";
  try {
    const data = await request("/api/home");
    recent = (data.recent || []).map(mediaItem);
    ranking = (data.ranking24h || []).slice(0, 6).map((item, index) => mediaItem(item, index + 1));
  } catch (error) { loadError = error?.message || "首页接口加载失败"; }
  if (!recent.length) {
    try {
      const history = await request("/api/history?limit=20&sort=latest&unique=0");
      recent = (history.items || []).map(mediaItem);
      if (recent.length) loadError = "";
    } catch (error) {
      loadError = [loadError, error?.message || "历史接口加载失败"].filter(Boolean).join("；");
    }
  }
  if (!recent.length) {
    recent = [mediaItem({
      mediaKey: "2078161140757283153",
      tweetId: "2078161140757283153",
      bestVideoUrl: "https://video.twimg.com/amplify_video/2078161093000851457/vid/avc1/1080x1920/uNU6gwIumK4sjgEm.mp4?tag=29",
      thumbnailUrl: "https://pbs.twimg.com/amplify_video_thumb/2078161093000851457/img/pTbNx8WhMoD_vmY9.jpg",
      userName: "rin_asahina7",
      userDisplayName: "朝比奈凛【TwiIdol 连接诊断】"
    })];
    loadError = `网络请求失败，当前显示诊断视频：${loadError || "未知错误"}`;
  }
  if (!ranking.length) ranking = recent.slice(0, 6);
  const firstSection = { ...SECTIONS[0], lazy: false, subtitle: loadError, items: recent, moreAction: categoryAction(SECTIONS[0]) };
  return {
    pageType: "home", id: "twiidol-home", title: "TwiIdol", heroAspectRatio: "2:3",
    hero: ranking,
    carousel: ranking,
    items: recent,
    sections: [firstSection]
      .concat(SECTIONS.slice(1).map(s => ({ ...s, lazy: true, items: [], moreAction: categoryAction(s) })))
  };
}

function categoryAction(section) {
  return { type: "category", pageId: section.id, title: section.title, itemAspectRatio: "2:3" };
}

function rankingSpec(id) {
  const match = /^(downloads|views|likes)-(24h|1w|1m|1y)$/.exec(asText(id));
  return match ? { metric: match[1], range: match[2] } : null;
}

async function loadSection(id, limit) {
  if (id === "latest") return (await request(`/api/history?limit=${limit}&sort=latest&unique=0`)).items || [];
  if (id === "popular-users") {
    const data = await request(`/api/home`);
    const map = data.popularItemsByUser || {};
    return (data.popularUsers || []).map(user => userItem(user, map[user.userId] || map[user.userName] || []));
  }
  const spec = rankingSpec(id) || { metric: "views", range: "24h" };
  return (await request(`/api/ranking?metric=${spec.metric}&range=${spec.range}&limit=${limit}`)).items || [];
}

async function getHomeSection(ctx) {
  const id = asText(value(ctx, ["sectionId", "id", "pageId"], "latest"));
  const meta = SECTIONS.find(s => s.id === id) || { id, title: asText(value(ctx, ["title"], id)), style: "discover.standard" };
  try {
    const raw = await loadSection(id, 18);
    const items = id === "popular-users" ? raw : raw.map((item, index) => mediaItem(item, meta.style === "discover.ranked" ? index + 1 : 0));
    return { id, title: meta.title, style: meta.style, lazy: false, items, moreAction: categoryAction(meta) };
  } catch (error) {
    return { id, title: meta.title, subtitle: error?.message || "加载失败", style: meta.style, lazy: false, items: [] };
  }
}

async function getCategory(ctx) {
  const pageId = asText(value(ctx, ["pageId", "id"], "latest"));
  const page = positiveInt(value(ctx, ["page"], 1), 1);
  const limit = 24;
  const cursor = (page - 1) * limit;
  let title = asText(value(ctx, ["title"], "TwiIdol 视频"));
  let items = [], nextCursor = null;

  if (pageId === "popular-users") {
    const data = await request(`/api/users/popular?range=1y&limit=50`);
    const users = data.items || data.users || data.popularUsers || [];
    items = users.slice(cursor, cursor + limit).map(user => userItem(user, []));
    title = title || "热门人物";
  } else if (pageId.startsWith("user:")) {
    const userName = pageId.slice(5);
    const data = await request(`/api/ranking?metric=views&range=1y&limit=${limit}&userName=${encodeURIComponent(userName)}&cursor=${cursor}`);
    items = (data.items || []).map(mediaItem);
    nextCursor = data.nextCursor;
    title = title || `@${userName}`;
  } else if (pageId === "random") {
    const seed = Date.now() + page;
    const data = await request(`/api/history?limit=${limit}&sort=latest&random=1&unique=0&seed=${seed}`);
    items = (data.items || []).map(mediaItem);
    nextCursor = data.nextCursor;
  } else if (pageId === "latest") {
    const data = await request(`/api/history?limit=${limit}&sort=latest&unique=0&cursor=${cursor}`);
    items = (data.items || []).map(mediaItem);
    nextCursor = data.nextCursor;
  } else {
    const spec = rankingSpec(pageId) || { metric: "views", range: "24h" };
    const data = await request(`/api/ranking?metric=${spec.metric}&range=${spec.range}&limit=${limit}&cursor=${cursor}`);
    items = (data.items || []).map((item, index) => mediaItem(item, cursor + index + 1));
    nextCursor = data.nextCursor;
  }

  return { pageType: "category", id: pageId, title, style: "media.posterGrid", itemAspectRatio: "2:3", page, hasMore: nextCursor !== null && nextCursor !== undefined && items.length >= limit, items };
}

function payloadFromContext(ctx) {
  ctx = parseContext(ctx);
  for (const key of ["versionId", "resourceId", "episodeId", "itemId", "id"]) {
    const decoded = decodePayload(ctx[key]);
    if (decoded.url || decoded.id) return decoded;
  }
  return {};
}

async function getDetail(ctx) {
  const p = payloadFromContext(ctx);
  if (!p.id || !p.url) throw new Error("TwiIdol 详情参数无效");
  const title = p.userDisplayName || (p.userName ? `@${p.userName}` : `Twitter 视频 ${p.id}`);
  const versionId = `twiidol://${encodeURIComponent(JSON.stringify(p))}`;
  return {
    pageType: "detail", id: versionId, type: "movie", title,
    originalTitle: p.userName ? `@${p.userName}` : "", poster: p.poster || "", backdrop: p.poster || "",
    detailImageAspectRatio: "2:3", imageHeaders: imageHeaders(),
    overview: `Twitter（X）原始视频。推文 ID：${p.tweetId || p.id}`,
    viewCountText: p.count ? String(Math.round(p.count)) : "",
    genres: ["Twitter", "短视频"],
    cast: p.userName ? [{ name: title, role: `@${p.userName}`, action: { type: "category", pageId: `user:${p.userName}`, title } }] : [],
    resourceGroups: [{ id: "twitter", title: "Twitter 原始视频", versions: [{ id: versionId, title: "原画 MP4", name: "原画 MP4", url: p.url, container: "mp4", headers: playbackHeaders(), default: true, action: { type: "play", itemId: versionId, versionId, url: p.url, title } }] }]
  };
}

async function getResourceVersions(ctx) {
  const p = payloadFromContext(ctx);
  const direct = asText(value(ctx, ["url", "playUrl", "videoUrl", "path"], ""));
  const url = p.url || (/^https?:\/\//i.test(direct) ? direct : "");
  if (!url) throw new Error("没有解析到 TwiIdol 视频地址");
  const versionId = p.url ? `twiidol://${encodeURIComponent(JSON.stringify(p))}` : url;
  return { groups: [{ id: "twitter", title: "Twitter 原始视频", versions: [{ id: versionId, title: "原画 MP4", name: "原画 MP4", url, container: "mp4", headers: playbackHeaders(), default: true }] }] };
}

async function resolvePlayback(ctx) {
  ctx = parseContext(ctx);
  const p = payloadFromContext(ctx);
  let url = p.url;
  if (!url) {
    for (const key of ["url", "playUrl", "videoUrl", "path", "versionId", "resourceId", "episodeId", "itemId", "id"]) {
      const candidate = asText(ctx[key]);
      if (/^https?:\/\//i.test(candidate) && /\.mp4(?:[?#]|$)/i.test(candidate)) { url = candidate; break; }
    }
  }
  if (!/^https?:\/\//i.test(asText(url))) throw new Error("没有解析到 TwiIdol 播放地址");
  return { url, container: "mp4", headers: playbackHeaders(), startPositionSeconds: 0, isLive: false, streamKind: "vod" };
}

async function search(ctx) {
  const query = asText(value(ctx, ["query", "keyword", "text"], "")).replace(/^@/, "").toLowerCase();
  if (!query) return { pageType: "search", title: "搜索人物", keyword: query, page: 1, hasMore: false, items: [] };
  const data = await request("/api/users/popular?range=1y&limit=100");
  const users = data.items || data.users || data.popularUsers || [];
  const matched = users.filter(user => `${user.userName || ""} ${user.userDisplayName || ""}`.toLowerCase().includes(query));
  return { pageType: "search", title: "搜索人物", keyword: query, page: 1, hasMore: false, items: matched.map(user => userItem(user, [])) };
}

const api = {
  getManifest, getHome, getHomeSection, getCategory, getDetail, getResourceVersions, resolvePlayback, search,
  home: getHome, homeSection: getHomeSection, getSection: getHomeSection, category: getCategory, detail: getDetail,
  versions: getResourceVersions, getVersions: getResourceVersions, play: resolvePlayback, resolvePlay: resolvePlayback,
  getPlayback: resolvePlayback, getSearch: search, onSearch: search
};

Object.assign(globalThis, api);
if (typeof module !== "undefined") module.exports = api;
