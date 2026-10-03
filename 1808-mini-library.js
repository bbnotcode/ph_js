/**
 * 1808.online - Dreamby / baiPlay 自定义媒体库
 * 脚本版本：1.0.6（原地址兼容更新）
 */

const SITE = "https://1808.online";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";
const ICON = "https://js.f041dadd.shop/favicon.png";

const CATEGORIES = [
  { id: "latest", title: "最新发布", path: "/tags/latest.html", style: "discover.standard" },
  { id: "promote", title: "高清专区", path: "/tags/promote.html", style: "discover.spotlight" },
  { id: "hotest", title: "观看最多", path: "/tags/hotest.html", style: "discover.ranked" },
  { id: "index", title: "香港电影", path: "/tags/index.html", style: "discover.posterCompact" },
  { id: "lilizhen", title: "李丽珍电影", path: "/tags/lilizhen.html", style: "discover.posterCompact" },
  { id: "ribensanji", title: "日本经典电影", path: "/tags/ribensanji.html", style: "discover.posterCompact" },
  { id: "taiwan", title: "台湾经典电影", path: "/tags/taiwan.html", style: "discover.posterCompact" }
];

// iPhone 端偶尔会被源站 Cloudflare 拦截。首页必须始终有可点击条目，
// 这些条目来自 2026-07-18 已通过电脑端验证的源站“最新发布”页面。
const HOME_FALLBACK = [
  ["/movies/illicit_desire_1973.html", "风流韵事 / Illicit Desire 1973", "https://img.9bf85763.website/covers/illicit_desire_1973.jpg", 1973],
  ["/movies/possessed_1994.html", "閹夫奇案之情劫 / Possessed 1994", "https://img.9bf85763.website/covers/possessed_1994.jpg", 1994],
  ["/movies/an_erotic_tale_2017.html", "隐秘的故事 / An Erotic Tale 2017", "https://img.9bf85763.website/covers/an_erotic_tale_2017.jpg", 2017],
  ["/movies/fox_that_you_love_1987.html", "妲己传 / Fox That You Love 1987", "https://img.9bf85763.website/covers/fox_that_you_love_1987.jpg", 1987],
  ["/movies/black_magic_1993.html", "尸蛊艳谭 / Black Magic 1993", "https://img.9bf85763.website/covers/black_magic_1993.jpg", 1993],
  ["/movies/sex_is_zero_2002.html", "色即是空 / Sex Is Zero 2002", "https://img.9bf85763.website/covers/sex_is_zero_2002.jpg", 2002],
  ["/movies/the_imp_1996.html", "孽欲追击档案之邪杀 / The Imp 1996", "https://img.9bf85763.website/covers/the_imp_1996.jpg", 1996],
  ["/movies/red_to_kill_1994.html", "弱殺 / Red To Kill 1994", "https://img.9bf85763.website/covers/red_to_kill_1994.jpg", 1994],
  ["/movies/lotus_the_beauty_1992.html", "聊斋艳谭4荷花三娘子 / Lotus The Beauty 1992", "https://img.9bf85763.website/covers/lotus_the_beauty_1992.jpg", 1992],
  ["/movies/loving_girl_1999.html", "钱塘风流名妓苏小小 / Loving Girl 1999", "https://img.9bf85763.website/covers/loving_girl_1999.jpg", 1999],
  ["/movies/blood_ritual_1989.html", "血裸祭 / Blood Ritual 1989", "https://img.9bf85763.website/covers/blood_ritual_1989.jpg", 1989],
  ["/movies/the_33d_invader_2011.html", "蜜桃成熟时33D / The 33d Invader 2011", "https://img.9bf85763.website/covers/the_33d_invader_2011.jpg", 2011]
];

function parseCtx(ctx) {
  if (typeof ctx === "string") {
    try { return JSON.parse(ctx) || {}; } catch (_) { return {}; }
  }
  return ctx || {};
}

function value(ctx, names, fallback) {
  ctx = parseCtx(ctx);
  for (const name of names) {
    const found = ctx[name] ?? ctx.params?.[name] ?? ctx.config?.[name] ?? ctx.settings?.[name] ?? ctx.parameters?.[name];
    if (found !== undefined && found !== null && String(found).trim() !== "") return found;
  }
  return fallback;
}

function baseURL(ctx) {
  return String(value(ctx, ["baseURL", "baseUrl"], SITE)).replace(/\/+$/, "");
}

function absoluteURL(ctx, input) {
  if (!input) return "";
  if (/^https?:\/\//i.test(input)) return input;
  return `${baseURL(ctx)}/${String(input).replace(/^\.?\//, "")}`;
}

function decodeHTML(text) {
  return String(text || "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripHTML(text) {
  return decodeHTML(String(text || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, " "))
    .replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

function responseText(response) {
  const body = response?.data ?? response?.body ?? response;
  if (typeof body === "string") return body;
  if (body instanceof Uint8Array && typeof TextDecoder !== "undefined") return new TextDecoder().decode(body);
  return String(body || "");
}

function hasHTTPClient() {
  if (typeof Widget !== "undefined" && Widget.http &&
      (typeof Widget.http.get === "function" || typeof Widget.http.request === "function")) return true;
  if (typeof $http !== "undefined" &&
      (typeof $http.get === "function" || typeof $http.request === "function")) return true;
  return typeof fetch === "function";
}

async function fetchText(ctx, path, referer) {
  const url = absoluteURL(ctx, path);
  const headers = {
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "User-Agent": UA,
    Referer: referer || `${baseURL(ctx)}/`
  };
  const options = {
    headers, timeout: 30, timeoutSeconds: 30,
    useBrowserCookie: true, attachBrowserCookie: true,
    useBrowserFallback: true, browserFallback: true, allowBrowserFallback: true
  };
  let response;
  if (typeof Widget !== "undefined" && Widget.http && typeof Widget.http.get === "function") response = await Widget.http.get(url, options);
  else if (typeof Widget !== "undefined" && Widget.http && typeof Widget.http.request === "function") response = await Widget.http.request({ url, method: "GET", ...options });
  else if (typeof $http !== "undefined" && typeof $http.get === "function") response = await $http.get(url, options);
  else if (typeof $http !== "undefined" && typeof $http.request === "function") response = await $http.request({ url, method: "GET", ...options });
  else if (typeof fetch === "function") response = await fetch(url, { headers });
  else throw new Error("当前环境没有可用的 HTTP 客户端");
  if (Number(response && (response.status || response.statusCode)) >= 400) throw new Error('源站 HTTP ' + (response.status || response.statusCode));
  const html = response && typeof response.text === 'function' ? await response.text() : responseText(response);
  if (!html || /Just a moment|cf-mitigated|Cloudflare Ray ID/i.test(html)) throw new Error("站点返回空内容或 Cloudflare 验证页");
  return html;
}

function imageHeaders(ctx, referer) {
  return { "User-Agent": UA, Referer: referer || `${baseURL(ctx)}/` };
}

function fallbackItems(ctx) {
  return HOME_FALLBACK.map(([id, title, poster, year]) => ({
    id, title, subtitle: "历史推荐（2026-07-18）", badges: ["历史片单"], type: "movie", poster, year,
    imageHeaders: imageHeaders(ctx), posterHeaders: imageHeaders(ctx),
    action: { type: "detail", itemId: id }
  }));
}

function categoryMoreAction(category) {
  return {
    type: "category",
    pageId: category.id,
    id: category.id,
    title: category.title,
    itemAspectRatio: "2:3"
  };
}

function movieId(input) {
  const raw = String(input || "");
  const match = raw.match(/\/movies\/([^/?#]+\.html)/i);
  return match ? `/movies/${match[1]}` : raw.startsWith("/movies/") ? raw : "";
}

function movieSlug(id) {
  return movieId(id).match(/\/movies\/([^/]+)\.html$/i)?.[1] || "";
}





function parseMovieCards(ctx, html) {
  const cards = [];
  const seen = new Set();
  const blockRE = /<div[^>]+class=["'][^"']*vidoe-main-ow[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  let block;
  while ((block = blockRE.exec(html))) {
    const source = block[0];
    const href = source.match(/href=["']([^"']*\/movies\/[^"']+\.html)["']/i)?.[1];
    const id = movieId(href);
    if (!id || seen.has(id)) continue;
    const title = decodeHTML(source.match(/<a[^>]+class=["'][^"']*g-ellipsis[^"']*["'][^>]*>([\s\S]*?)<\/a>/i)?.[1]
      || source.match(/<a[^>]+title=["']([^"']+)["']/i)?.[1] || id);
    const poster = source.match(/(?:data-original|src)=["']([^"']+)["']/i)?.[1] || "";
    const runtime = stripHTML(source.match(/class=["'][^"']*runtime[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]);
    const year = Number(stripHTML(source.match(/class=["'][^"']*years-text[^"']*["'][^>]*>[\s\S]*?<b>(\d{4})<\/b>/i)?.[1])) || undefined;
    const actor = stripHTML(source.match(/class=["'][^"']*actor-m[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]);
    seen.add(id);
    cards.push({
      id, title: stripHTML(title), subtitle: [year, runtime, actor].filter(Boolean).join(" · "), type: "movie",
      poster: absoluteURL(ctx, poster), year, metadataText: runtime, remarks: /hd-text/i.test(source) ? "高清" : "",
      imageHeaders: imageHeaders(ctx), action: { type: "detail", itemId: id }
    });
  }
  return cards;
}

function parseMeta(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return decodeHTML(html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["']`, "i"))?.[1] || "");
}

function parseDetailPage(ctx, html, id) {
  const referer = absoluteURL(ctx, id);
  const fullTitle = parseMeta(html, "og:title").replace(/免费观看中\s*-\s*1808在线.*$/i, "").trim();
  const h1 = stripHTML(html.match(/<div[^>]+class=["'][^"']*li-title[^"']*["'][^>]*>[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
  const title = (h1 || fullTitle || id).replace(/免费观看中\s*-\s*1808在线.*$/i, "").trim();
  const poster = absoluteURL(ctx, parseMeta(html, "og:image") || html.match(/<video[^>]+poster=["']([^"']+)/i)?.[1]);
  const overview = parseMeta(html, "og:description") || stripHTML(html.match(/剧情简介：<\/span>\s*<div[^>]*>([\s\S]*?)<\/div>/i)?.[1]);
  const actorText = stripHTML(html.match(/演员：<\/span>\s*<div[^>]*>([\s\S]*?)<\/div>/i)?.[1]);
  const urls = [];
  const labels = { hd: "高清 720P", sd: "标清 360P", hd2: "高清 720P 线路2", sd2: "标清 360P 线路2", hd3: "高清 720P 线路3", sd3: "标清 360P 线路3", hdm: "高清 720P 移动线路", sdm: "标清 360P 移动线路" };
  const re = /data-video-url-(sd|hd|sd2|hd2|sd3|hd3|sdm|hdm)=["']([^"']+)["']/gi;
  let match;
  while ((match = re.exec(html))) {
    const url = decodeHTML(match[2]);
    if (url && !urls.some(v => v.url === url)) urls.push({ id: url, title: labels[match[1].toLowerCase()] || match[1], url, referer });
  }
  const related = parseMovieCards(ctx, html).filter(item => item.id !== id).slice(0, 12);
  return { title, poster, overview, actorText, urls, related, referer };
}

function getManifest() {
  return {
    id: "1808-online", name: "1808在线", title: "1808在线", version: "1.0.6", author: "Alan huang",
    logo: ICON, icon: ICON, site: SITE, adult: true,
    capabilities: { home: true, category: true, detail: true, search: false, resourceVersions: true, playback: true, resourceMatching: false },
    aggregation: { search: false, playbackHistory: true, resourceMatching: false },
    parameters: [{ name: "baseURL", title: "站点地址", type: "input", defaultValue: SITE, required: true }]
  };
}

async function loadCategory(ctx, id) {
  const category = CATEGORIES.find(v => v.id === id) || CATEGORIES[0];
  return { category, items: parseMovieCards(ctx, await fetchText(ctx, category.path)) };
}

async function getHome(ctx) {
  let latest = []; let error = '';
  try { latest = (await loadCategory(ctx, 'latest')).items.slice(0, 18); if (!latest.length) throw new Error('最新片单为空'); }
  catch (e) { error = String(e && e.message || e); latest = fallbackItems(ctx); }
  return {
    pageType: 'home', id: '1808-home', title: '1808在线', heroAspectRatio: '2:3', hero: latest.slice(0, 6), items: latest,
    sections: [{ ...CATEGORIES[0], title: error ? '历史推荐（2026-07-18，实时加载失败）' : CATEGORIES[0].title,
      lazy: false, items: latest, error: error || undefined, moreAction: categoryMoreAction(CATEGORIES[0]) }]
      .concat(CATEGORIES.slice(1).map(v => ({ ...v, lazy: true, items: [], moreAction: categoryMoreAction(v),
        loadAction: { type: 'custom', sectionId: v.id, id: v.id, title: v.title } })))
  };
}

async function getHomeSection(ctx) {
  const id = String(value(ctx, ['sectionId', 'pageId', 'id'], 'latest'));
  const category = CATEGORIES.find(v => v.id === id) || CATEGORIES[0];
  let items = []; let error = '';
  try { items = (await loadCategory(ctx, category.id)).items.slice(0, 18); }
  catch (e) { error = String(e && e.message || e); if (category.id === 'latest') items = fallbackItems(ctx); }
  return { id: category.id, title: error && items.length ? '历史推荐（2026-07-18，实时加载失败）' : category.title,
    style: category.style, lazy: false, items, error: error || undefined, moreAction: categoryMoreAction(category) };
}

async function getCategory(ctx) {
  const id = String(value(ctx, ['pageId', 'id'], 'latest'));
  const category = CATEGORIES.find(v => v.id === id) || CATEGORIES[0];
  let items = []; let error = '';
  try { items = (await loadCategory(ctx, category.id)).items; } catch (e) { error = String(e && e.message || e); }
  return { pageType: 'category', id: category.id, title: category.title, style: 'media.posterGrid', itemAspectRatio: '2:3', page: 1, hasMore: false, items, error: error || undefined };
}

async function getDetail(ctx) {
  const id = movieId(value(ctx, ['itemId', 'id', 'sourceId', 'path'], ''));
  if (!id) throw new Error('缺少有效的电影详情地址');
  const detail = parseDetailPage(ctx, await fetchText(ctx, id), id);
  if (!detail.urls.length) throw new Error('详情页没有返回真实播放线路，请刷新重试');
  const lines = detail.urls.slice().sort((a, b) => lineQuality(b) - lineQuality(a));
  const versions = lines.map((v, index) => ({ id: v.url, title: v.title, name: v.title, container: 'hls', default: index === 0,
    headers: playbackHeaders(v.referer), action: { type: 'play', itemId: id, versionId: v.url, referer: v.referer, title: v.title } }));
  return { pageType: 'detail', id, type: 'movie', title: detail.title, poster: detail.poster, backdrop: detail.poster,
    detailImageAspectRatio: '2:3', imageHeaders: imageHeaders(ctx, detail.referer), overview: detail.overview,
    year: Number(detail.title.match(/(?:19|20)\d{2}/)?.[0]) || undefined, genres: ['剧情'],
    cast: detail.actorText.split(/[，,、]/).filter(Boolean).slice(0, 20).map(name => ({ name: name.trim(), role: '演员' })),
    resourceGroups: [{ id: '1808-lines', title: '播放线路', versions }],
    recommendations: [{ id: 'related', title: '相关推荐', style: 'discover.posterCompact', items: detail.related }] };
}

async function getResourceVersions(ctx) {
  const detail = await getDetail(ctx);
  return { itemId: detail.id, groups: detail.resourceGroups };
}

function playbackHeaders(referer) {
  return { "User-Agent": UA, Referer: referer || `${SITE}/`, Origin: SITE };
}

async function resolvePlayback(ctx) {
  ctx = parseCtx(ctx);
  const id = movieId(value(ctx, ['itemId', 'id', 'sourceId'], ''));
  const requested = String(value(ctx, ['versionId', 'resourceId', 'url', 'path', 'playUrl', 'videoUrl'], ''));
  let url = requested; let referer = String(value(ctx, ['referer', 'detailUrl'], ''));
  if (id) {
    const detail = parseDetailPage(ctx, await fetchText(ctx, id), id);
    const lines = detail.urls.slice().sort((a, b) => lineQuality(b) - lineQuality(a));
    const quality = lineQuality({ url: requested });
    const selected = lines.find(v => v.url === requested) || (quality && lines.find(v => lineQuality(v) === quality)) || lines[0];
    if (!selected) throw new Error('源站没有返回可播放线路，请刷新重试');
    url = selected.url; referer = selected.referer || detail.referer;
  }
  if (!/^https?:\/\//i.test(url) || !/\.m3u8(?:[?#]|$)/i.test(url)) throw new Error('没有解析到真实 HLS 播放地址');
  if (!/#EXTM3U/.test(await fetchText(ctx, url, referer))) throw new Error('播放线路未返回有效 HLS 清单');
  return { url, container: 'hls', headers: playbackHeaders(referer), startPositionSeconds: 0, isLive: false, streamKind: 'vod' };
}

function lineQuality(line) {
  const m = String(line.title || '').match(/(\d{3,4})\s*p/i) || String(line.url || '').match(/(?:^|\/)(\d{3,4})(?:p|\/)/i);
  return m ? Number(m[1]) : 0;
}

const api = {
  getManifest, getHome, getHomeSection, getCategory, getDetail, getResourceVersions, resolvePlayback,
  home: getHome, homeSection: getHomeSection, getSection: getHomeSection, category: getCategory, detail: getDetail,
  getVersions: getResourceVersions, versions: getResourceVersions, resolvePlay: resolvePlayback, play: resolvePlayback, getPlayback: resolvePlayback
};

Object.assign(globalThis, api);
if (typeof module !== "undefined") module.exports = api;
