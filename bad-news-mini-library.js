/**
 * bad.news - Dreamby / baiPlay 自定义媒体库
 * Native adapter for short videos, long videos and H animation.
 */

const SITE = "https://bad.news";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";
const LOGO = "https://bad.news/favicon.ico";

const SECTIONS = [
  { id: "porn", title: "短视频", path: "/tag/porn", style: "discover.standard" },
  { id: "long-porn", title: "长视频", path: "/tag/long-porn", style: "discover.standard" },
  { id: "dm", title: "H 动漫", path: "/dm", style: "discover.posterCompact" }
];

// Keep the first screen renderable even when the site's first request is blocked,
// challenged or returned in a host-specific response wrapper.
const BOOTSTRAP_VIDEOS = [
  { id: "6371067", title: "Bad News 精选视频 01", poster: "https://pbs.twimg.com/amplify_video_thumb/2080296985719111680/img/7nh69dvQ0zR640D9.jpg", author: "18+精选视频", duration: "00:13:52", container: "m3u8" },
  { id: "6371646", title: "Bad News 精选视频 02", poster: "https://pbs.twimg.com/amplify_video_thumb/2080154540062720000/img/tq_tOn7Ojd6IS2wf.jpg", author: "Bad News", duration: "01:45:11", container: "m3u8" },
  { id: "6371820", title: "Bad News 精选视频 03", poster: "https://pbs.twimg.com/amplify_video_thumb/2080175029816623104/img/RVuk0--HQuwSc-io.jpg", author: "Bad News", duration: "00:00:44", container: "m3u8" },
  { id: "6371194", title: "Bad News 精选视频 04", poster: "https://pbs.twimg.com/amplify_video_thumb/2079953777155776512/img/3IJ5EYwlVk6Ymdrg.jpg", author: "Bad News", duration: "00:20:01", container: "m3u8" },
  { id: "6370850", title: "Bad News 精选视频 05", poster: "https://pbs.twimg.com/amplify_video_thumb/2080195020242776064/img/7vHJH7JwIacy-l_z.jpg", author: "Bad News", duration: "00:15:06", container: "m3u8" },
  { id: "6371585", title: "Bad News 精选视频 06", poster: "https://pbs.twimg.com/amplify_video_thumb/2080670828136673281/img/Nwah_u6Y4uoPRDNC.jpg", author: "Bad News", duration: "00:13:01", container: "m3u8" },
  { id: "6371871", title: "Bad News 精选视频 07", poster: "https://pbs.twimg.com/amplify_video_thumb/2080595578153762816/img/e9leZvA4bCjrkfoL.jpg", author: "Bad News", duration: "00:17:51", container: "m3u8" },
  { id: "6370848", title: "Bad News 精选视频 08", poster: "https://pbs.twimg.com/amplify_video_thumb/2080549514302423041/img/FcWW4u--VNYRC1iM.jpg", author: "Bad News", duration: "00:38:41", container: "m3u8" },
  { id: "6370775", title: "Bad News 精选视频 09", poster: "https://pbs.twimg.com/amplify_video_thumb/2080507739978211328/img/R2IKSt6JkouJA9Qy.jpg", author: "Bad News", duration: "00:04:45", container: "m3u8" },
  { id: "6371617", title: "Bad News 精选视频 10", poster: "https://pbs.twimg.com/amplify_video_thumb/2072712763433177088/img/3DPkb__eENqi1Tqp.jpg", author: "Bad News", duration: "00:28:10", container: "m3u8" },
  { id: "6371084", title: "Bad News 精选视频 11", poster: "https://pbs.twimg.com/amplify_video_thumb/2080627254821015552/img/y2A4PfWasval-VME.jpg", author: "Bad News", duration: "00:00:37", container: "m3u8" },
  { id: "6370958", title: "Bad News 精选视频 12", poster: "https://pbs.twimg.com/amplify_video_thumb/2080619757624291328/img/Cp4_SKs4C3TBLC9S.jpg", author: "Bad News", duration: "00:25:38", container: "m3u8" }
];

const BOOTSTRAP_LONG = [
  { id: "6372167", title: "Bad News 长视频 01", poster: "https://pbs.twimg.com/amplify_video_thumb/2080514836312850433/img/bmn2TZsTkv-VQ8Yy.jpg", container: "m3u8" },
  { id: "6372166", title: "Bad News 长视频 02", poster: "https://pbs.twimg.com/amplify_video_thumb/2079984533324304384/img/ggLalJpzN0qxKFob.jpg", container: "m3u8" },
  { id: "6372165", title: "Bad News 长视频 03", poster: "https://pbs.twimg.com/amplify_video_thumb/2079984435513143296/img/iu6nAp41eMIt1PVy.jpg", container: "m3u8" },
  { id: "6372164", title: "Bad News 长视频 04", poster: "https://pbs.twimg.com/amplify_video_thumb/2080683550194692096/img/cFOk47cB5iK5CPZp.jpg", container: "m3u8" },
  { id: "6372163", title: "Bad News 长视频 05", poster: "https://pbs.twimg.com/amplify_video_thumb/2080684900479635456/img/S7V6PNHG3IsEvGw5.jpg", container: "m3u8" },
  { id: "6372162", title: "Bad News 长视频 06", poster: "https://pbs.twimg.com/amplify_video_thumb/2080694348568788992/img/fPL6naWkWVjZ67m-.jpg", container: "m3u8" }
];

const BOOTSTRAP_DM = [
  { id: "11680", title: "完全堕落×被睡走了的家人 1", poster: "https://static.bad.news/images/dm/a292dcbc8c2a64d583d7730f5608690a.jpg" },
  { id: "2683", title: "僕の性処理系はイジメッ子ギャル 2", poster: "https://static.bad.news/images/dm/dab84ae363d5baaa51c491f35333bca1.jpg" },
  { id: "2256", title: "义姐是不良妈妈授乳中 2", poster: "https://static.bad.news/images/dm/47b37aec05092e8ed890712b715f5f3e.jpg" },
  { id: "3893", title: "うたた寝～友达の姉ちゃんは爆乳モデル～", poster: "https://static.bad.news/images/dm/62e0223648f768bc5f3d4d86ce0de150.jpg" },
  { id: "15913", title: "Lewd Dreams – Hu Tao Part 1&2", poster: "https://static.bad.news/images/dm/0609cd078f1ebd180b281cd5e5c05e6d.jpg" },
  { id: "8887", title: "直葉 危険日中出しオフパコ", poster: "https://static.bad.news/images/dm/fcaf504468c16ce8673859f0e045375f.jpg" }
];

function fallbackItems(id) {
  if (id === "dm") return BOOTSTRAP_DM.map(dmItem);
  if (id === "long-porn") return BOOTSTRAP_LONG.map(videoItem);
  return BOOTSTRAP_VIDEOS.map(videoItem);
}

function ctxObject(ctx) {
  if (typeof ctx === "string") {
    try { return JSON.parse(ctx); } catch (_) { return {}; }
  }
  return ctx || {};
}

function pick(ctx, names, fallback) {
  ctx = ctxObject(ctx);
  for (const name of names) {
    const v = ctx[name] ?? ctx.pagination?.[name] ?? ctx.pageInfo?.[name] ?? ctx.params?.[name] ?? ctx.config?.[name] ?? ctx.settings?.[name] ?? ctx.parameters?.[name];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return fallback;
}

function text(v) { return v === undefined || v === null ? "" : String(v).trim(); }
function pageNumber(v) { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : 1; }
function stripTags(v) { return decodeEntities(text(v).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")); }
function decodeEntities(v) {
  return text(v)
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}
function absolute(v) {
  v = decodeEntities(v);
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `${SITE}${v.startsWith("/") ? "" : "/"}${v}`;
}
function attr(html, name) {
  const m = text(html).match(new RegExp(`\\b${name}\\s*=\\s*(['"])([\\s\\S]*?)\\1`, "i"));
  return m ? decodeEntities(m[2]) : "";
}
function meta(html, property) {
  const tags = text(html).match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (attr(tag, "property") === property || attr(tag, "name") === property) return attr(tag, "content");
  }
  return "";
}
function requestHeaders(referer) {
  return { Accept: "text/html,application/xhtml+xml", "Accept-Language": "zh-CN,zh;q=0.9", Referer: referer || `${SITE}/`, "User-Agent": UA };
}
function imageHeaders(referer) { return { Referer: referer || `${SITE}/`, "User-Agent": UA }; }

async function getHtml(path) {
  const url = absolute(path);
  const headers = requestHeaders(`${SITE}/`);
  let response, body = "", httpError;
  try {
    if (typeof Widget !== "undefined" && Widget.http && typeof Widget.http.get === "function") response = await Widget.http.get(url, { headers, timeout: 30 });
    else if (typeof Widget !== "undefined" && Widget.http && typeof Widget.http.request === "function") response = await Widget.http.request({ url, method: "GET", headers, timeout: 30 });
    else if (typeof $http !== "undefined" && typeof $http.get === "function") response = await $http.get(url, { headers, timeout: 30 });
    else if (typeof $http !== "undefined" && typeof $http.request === "function") response = await $http.request({ url, method: "GET", headers, timeout: 30 });
    else if (typeof fetch === "function") response = await fetch(url, { headers });
    else throw new Error("当前环境没有可用的 HTTP 客户端");
    if (response && typeof response.text === "function") body = await response.text();
    else {
      body = response?.data ?? response?.body ?? response?.text ?? response;
      if (body && typeof body === "object") body = body.data ?? body.body ?? body.html ?? body.text ?? body;
      body = typeof body === "string" ? body : JSON.stringify(body || "");
    }
    if (looksUsableHtml(body)) return body;
  } catch (error) { httpError = error; }
  const browserBody = await browserHtml(url, headers);
  if (browserBody) return browserBody;
  if (body) return body;
  throw httpError || new Error("bad.news 请求失败");
}

function looksUsableHtml(body) {
  body = text(body);
  return /data-tid="\d+"/i.test(body) || /\/dm\/play\/id-\d+/i.test(body) || /data-source=['"][^'"]+/i.test(body);
}

async function browserHtml(url, headers) {
  if (typeof Widget === "undefined" || !Widget.browser || typeof Widget.browser.fetch !== "function") return "";
  try {
    const result = await Widget.browser.fetch(url, { visible: false, timeout: 45, waitAfterLoad: 1, waitForAny: true, headers });
    const body = result?.data ?? result?.body ?? result?.text ?? result?.html ?? result;
    return typeof body === "string" ? body : "";
  } catch (_) { return ""; }
}

function payload(kind, id) { return `badnews://${kind}/${encodeURIComponent(text(id))}`; }
function unpayload(raw) {
  raw = text(raw);
  const m = raw.match(/^badnews:\/\/([^/]+)\/([\s\S]+)$/);
  if (m) return { kind: m[1], id: decodeURIComponent(m[2]) };
  if (/^\d+$/.test(raw)) return { kind: "topic", id: raw };
  return { kind: "", id: raw };
}

function videoItem(data, rank) {
  const detailId = payload("topic", data.id);
  return {
    id: detailId,
    title: data.title || `视频 ${data.id}`,
    subtitle: [data.author, data.time, data.duration].filter(Boolean).join(" · "),
    type: "movie",
    poster: data.poster,
    backdrop: data.poster,
    overview: data.title || "",
    rank: rank || undefined,
    remarks: (data.container || "").toUpperCase(),
    badges: [data.container ? data.container.toUpperCase() : "视频"].filter(Boolean),
    aspectRatio: "16:9",
    imageFit: "fill",
    imageHeaders: imageHeaders(`${SITE}/t/${data.id}`),
    action: { type: "detail", itemId: detailId }
  };
}

function parseTopicList(html) {
  const starts = [];
  const re = /<div\b(?=[^>]*class="[^"]*\blink\b[^"]*")(?=[^>]*data-tid="(\d+)")[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) starts.push({ index: m.index, id: m[1] });
  const items = [];
  for (let i = 0; i < starts.length; i++) {
    const block = html.slice(starts[i].index, starts[i + 1]?.index || html.length);
    const video = block.match(/<video\b[\s\S]*?<\/video>/i)?.[0] || "";
    const source = attr(video, "data-source");
    if (!source) continue;
    const mobileTitle = stripTags(block.match(/<a\b[^>]*class="[^"]*\bnm\b[^"]*"[^>]*>([\s\S]*?)<\/a>/i)?.[1]);
    const desktopTitles = [...block.matchAll(/<a\b[^>]*class="title"[^>]*>([\s\S]*?)<\/a>/gi)].map(x => stripTags(x[1]));
    const title = (mobileTitle && !/^Watch video$/i.test(mobileTitle) ? mobileTitle : "") ||
      desktopTitles.find(x => x && !/^Watch video$/i.test(x)) || mobileTitle || desktopTitles[0] || `视频 ${starts[i].id}`;
    const author = stripTags(block.match(/<a\b[^>]*class="author"[^>]*>([\s\S]*?)<\/a>/i)?.[1]) ||
      stripTags(block.match(/<span\b[^>]*class="time"[^>]*>([\s\S]*?)<\/span>/i)?.[1]);
    const time = stripTags(block.match(/<time\b[^>]*>([\s\S]*?)<\/time>/i)?.[1]);
    const duration = stripTags(block.match(/class="ct-time"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i)?.[1]);
    items.push(videoItem({
      id: starts[i].id, title, author, time, duration, poster: absolute(attr(video, "poster")),
      url: absolute(source), container: attr(video, "data-type") || (/\.m3u8/i.test(source) ? "m3u8" : "mp4")
    }, items.length + 1));
  }
  return items;
}

function dmItem(data) {
  const detailId = payload("dm", data.id);
  return {
    id: detailId, title: data.title || `动漫 ${data.id}`, type: "movie",
    poster: data.poster, backdrop: data.poster, aspectRatio: "2:3", imageFit: "fill",
    imageHeaders: imageHeaders(`${SITE}/dm/`), badges: ["动漫"],
    action: { type: "detail", itemId: detailId }
  };
}

function parseDmList(html) {
  const items = [];
  const blocks = (html.match(/<article\b[\s\S]*?<\/article>/gi) || [])
    .concat(html.match(/<li\b[\s\S]*?<\/li>/gi) || []);
  for (const block of blocks) {
    const link = block.match(/href="\/dm\/play\/id-(\d+)"/i);
    if (!link) continue;
    const image = block.match(/<img\b[^>]*(?:data-echo|src)="[^"]*"[^>]*>/i)?.[0] || "";
    const thumb = block.match(/<a\b[^>]*href="\/dm\/play\/id-\d+"[^>]*>/i)?.[0] || "";
    const poster = attr(image, "data-echo") || attr(image, "src") ||
      attr(thumb, "data-echo-background") || attr(thumb, "data-original") || attr(thumb, "data-src");
    const title = attr(image, "alt") || attr(thumb, "title") ||
      attr(block.match(/<a\b[^>]*class="title[^"]*"[^>]*>/i)?.[0], "title");
    items.push(dmItem({ id: link[1], title: decodeEntities(title), poster: absolute(poster) }));
  }
  return items;
}

function hasNext(html) { return /class="[^"]*next-page/i.test(html) || />下一页</.test(html); }
function pageCount(html, fallback) {
  const m = text(html).match(/href="[^"]*\/page-(\d+)"[^>]*class="last-page"/i) ||
    text(html).match(/class="last-page"[^>]*href="[^"]*\/page-(\d+)"/i);
  const n = m ? parseInt(m[1], 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
function sectionMeta(id) { return SECTIONS.find(s => s.id === id) || SECTIONS[0]; }
function categoryPath(id, page) {
  const meta = sectionMeta(id);
  return page > 1 ? `${meta.path}/page-${page}` : meta.path;
}

function getManifest() {
  return {
    id: "bad-news-media", name: "Bad News", title: "Bad News 视频",
    version: "1.0.3", author: "Codex", site: SITE, logo: LOGO, icon: LOGO,
    description: "bad.news 短视频、长视频与 H 动漫原生媒体库。",
    capabilities: { home: true, category: true, detail: true, search: true, resourceVersions: true, playback: true, resourceMatching: false },
    aggregation: { search: true, playbackHistory: true, resourceMatching: false }
  };
}

async function loadCategory(id, page) {
  const path = categoryPath(id, page);
  let html = await getHtml(path);
  let items = id === "dm" ? parseDmList(html) : parseTopicList(html);
  if (!items.length) {
    const browserBody = await browserHtml(absolute(path), requestHeaders(`${SITE}/`));
    if (browserBody) {
      const browserItems = id === "dm" ? parseDmList(browserBody) : parseTopicList(browserBody);
      if (browserItems.length) {
        html = browserBody;
        items = browserItems;
      }
    }
  }
  return { html, items };
}

async function getHome() {
  const results = await Promise.all(SECTIONS.map(async s => {
    try {
      const remote = (await loadCategory(s.id, 1)).items.slice(0, 18);
      return { items: remote.length ? remote : fallbackItems(s.id), error: remote.length ? "" : "当前显示内置条目" };
    } catch (e) { return { items: fallbackItems(s.id), error: e?.message || "当前显示内置条目" }; }
  }));
  const lead = results[0].items;
  const sections = SECTIONS.map((s, index) => ({
    id: s.id, title: s.title, style: s.style, contentType: "movie",
    lazy: false, isLazy: false,
    subtitle: results[index].error, items: results[index].items,
    moreAction: { type: "category", id: s.id, pageId: s.id, title: s.title, page: 1, itemAspectRatio: s.id === "dm" ? "2:3" : "16:9" }
  }));
  return {
    pageType: "home", id: "bad-news-home", title: "Bad News", heroAspectRatio: "16:9",
    hero: lead.slice(0, 6), carousel: lead.slice(0, 6), items: lead, sections
  };
}

async function getHomeSection(ctx) {
  const id = text(pick(ctx, ["sectionId", "id", "pageId"], "porn"));
  const meta = sectionMeta(id);
  try {
    const result = await loadCategory(id, 1);
    return { id, title: meta.title, style: meta.style, contentType: "movie", lazy: false, isLazy: false, items: result.items.slice(0, 18), moreAction: { type: "category", id, pageId: id, title: meta.title, page: 1, itemAspectRatio: id === "dm" ? "2:3" : "16:9" } };
  } catch (e) {
    const fallback = fallbackItems(id);
    return { id, title: meta.title, subtitle: e?.message || "加载失败", style: meta.style, contentType: "movie", lazy: false, isLazy: false, items: fallback };
  }
}

async function getCategory(ctx) {
  const id = text(pick(ctx, ["pageId", "id"], "porn"));
  const page = pageNumber(pick(ctx, ["page", "currentPage", "pageNumber", "pageIndex", "pg", "from"], 1));
  const meta = sectionMeta(id);
  let result;
  try { result = await loadCategory(id, page); }
  catch (e) { result = { html: "", items: page === 1 ? fallbackItems(id) : [], error: e?.message || "加载失败", fallback: page === 1 }; }
  if (!result.items.length && page === 1) {
    result.items = fallbackItems(id);
    result.fallback = true;
  }
  const sourcePageCount = pageCount(result.html, id === "dm" ? 619 : 400);
  const limit = result.items.length || (id === "porn" ? 12 : 6);
  const hasMore = result.items.length > 0 && page < sourcePageCount &&
    (result.fallback || hasNext(result.html) || (!result.error && result.items.length >= 18));
  return {
    pageType: "category", id, title: text(pick(ctx, ["title"], meta.title)), page,
    currentPage: page, pageNumber: page, pageIndex: page,
    pagecount: hasMore ? Math.max(sourcePageCount, page + 1) : page,
    totalPages: hasMore ? sourcePageCount : page,
    limit, pageSize: limit,
    total: hasMore ? sourcePageCount * limit : (page - 1) * limit + result.items.length,
    hasMore, nextPage: hasMore ? page + 1 : null,
    style: "media.posterGrid",
    itemAspectRatio: id === "dm" ? "2:3" : "16:9", subtitle: result.error || "", items: result.items
  };
}

function parseDetail(html, data) {
  const video = html.match(/<video\b[^>]*data-source=[\s\S]*?<\/video>/i)?.[0] || "";
  const title = meta(html, "og:title") || stripTags(html.match(/<h[12]\b[^>]*class="title"[^>]*>([\s\S]*?)<\/h[12]>/i)?.[1]) || `${data.kind === "dm" ? "动漫" : "视频"} ${data.id}`;
  const poster = absolute(meta(html, "og:image") || attr(video, "poster"));
  const source = absolute(attr(video, "data-source"));
  const container = attr(video, "data-type") || (/\.m3u8/i.test(source) ? "m3u8" : "mp4");
  const tags = [...html.matchAll(/href="\/(?:dm\/)?tag\/[^"]+"[^>]*>([\s\S]*?)<\/a>/gi)].map(x => stripTags(x[1])).filter(Boolean).slice(0, 12);
  return { ...data, title: decodeEntities(title), poster, source, container, tags };
}

async function detailData(raw) {
  const data = unpayload(raw);
  if (!data.id) throw new Error("缺少视频 ID");
  const path = data.kind === "dm" ? `/dm/play/id-${encodeURIComponent(data.id)}` : `/t/${encodeURIComponent(data.id)}`;
  return parseDetail(await getHtml(path), data);
}

async function getDetail(ctx) {
  const raw = pick(ctx, ["itemId", "id"], "");
  const data = await detailData(raw);
  return {
    pageType: "detail", id: payload(data.kind, data.id), type: "movie", title: data.title,
    poster: data.poster, backdrop: data.poster, detailImageAspectRatio: data.kind === "dm" ? "2:3" : "16:9",
    imageHeaders: imageHeaders(data.kind === "dm" ? `${SITE}/dm/` : `${SITE}/t/${data.id}`),
    overview: data.title, genres: data.tags, resourceGroups: data.source ? [{
      id: "source", title: "播放线路", versions: [{
        id: "original", name: "原始画质", subtitle: data.container.toUpperCase(), container: data.container,
        action: { type: "play", itemId: payload(data.kind, data.id), versionId: "original" }
      }]
    }] : []
  };
}

async function getResourceVersions(ctx) {
  const raw = pick(ctx, ["itemId", "id"], "");
  const data = await detailData(raw);
  return {
    itemId: payload(data.kind, data.id), groups: data.source ? [{
      id: "source", title: "播放线路", versions: [{
        id: "original", name: "原始画质", subtitle: data.container.toUpperCase(), container: data.container,
        action: { type: "play", itemId: payload(data.kind, data.id), versionId: "original" }
      }]
    }] : []
  };
}

async function resolvePlayback(ctx) {
  const raw = pick(ctx, ["itemId", "id"], "");
  const data = await detailData(raw);
  if (!data.source) throw new Error("详情页没有解析到播放地址");
  const isTwitter = /(?:video|pbs)\.twimg\.com/i.test(data.source);
  return {
    url: data.source, container: data.container,
    headers: { Referer: isTwitter ? "https://x.com/" : `${SITE}/`, "User-Agent": UA },
    startPositionSeconds: 0, isLive: false, streamKind: "vod"
  };
}

async function search(ctx) {
  const keyword = text(pick(ctx, ["query", "keyword", "text"], ""));
  const page = pageNumber(pick(ctx, ["page"], 1));
  if (!keyword) return { pageType: "search", title: "搜索", keyword, page, hasMore: false, items: [] };
  const encoded = encodeURIComponent(keyword);
  const path = `/search/q-${encoded}/type-porn${page > 1 ? `/page-${page}` : ""}`;
  const html = await getHtml(path);
  return { pageType: "search", title: `搜索：${keyword}`, keyword, page, hasMore: hasNext(html), itemAspectRatio: "16:9", items: parseTopicList(html) };
}

const exported = {
  getManifest, getHome, getHomeSection, getCategory, getDetail, getResourceVersions, resolvePlayback, search,
  home: getHome, homeSection: getHomeSection, getSection: getHomeSection,
  category: getCategory, catalog: getCategory, list: getCategory,
  detail: getDetail, getVersions: getResourceVersions, versions: getResourceVersions,
  resolvePlay: resolvePlayback, play: resolvePlayback, getPlayinfo: resolvePlayback,
  quickSearch: search, getSearch: search, onSearch: search
};
if (typeof globalThis !== "undefined") Object.assign(globalThis, exported);
if (typeof module !== "undefined" && module.exports) module.exports = exported;
