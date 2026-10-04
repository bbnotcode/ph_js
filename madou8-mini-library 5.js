// @name 麻豆视频 Mini Library

const MADOU8_DEFAULT_BASE = 'https://madou8.pw';
const MADOU8_ENTRY = '/asian/zh-CN';
const MADOU8_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const WidgetMetadata = {
  id: 'madou8-mini-library',
  name: '麻豆视频',
  title: '麻豆视频',
  version: '1.0.1',
  requiredVersion: '0.0.1',
  author: 'Alan huang',
  site: MADOU8_DEFAULT_BASE,
  logo: MADOU8_DEFAULT_BASE + '/favicon.ico',
  icon: MADOU8_DEFAULT_BASE + '/favicon.ico',
  description: '麻豆视频自定义媒体库，支持首页、分类、搜索、详情、画质选择和 HLS 播放。'
};

const SECTIONS = [
  { id: 'recent', title: '最近更新', path: 'videos/recent', style: 'discover.ranked' },
  { id: 'hot-month', title: '本月热门', path: 'videos/hot/month', style: 'discover.spotlight' },
  { id: 'new-releases', title: '新作上市', path: 'videos/new-releases', style: 'discover.posterCompact' },
  { id: '4k', title: '4K', path: 'videos/tag/4K', style: 'discover.posterCompact' },
  { id: 'collections', title: '合集', path: 'videos/tag/%E5%90%88%E9%9B%86', style: 'discover.posterCompact' }
];

function getManifest() {
  return {
    id: WidgetMetadata.id, name: WidgetMetadata.name, title: WidgetMetadata.title,
    version: WidgetMetadata.version, requiredVersion: WidgetMetadata.requiredVersion,
    author: WidgetMetadata.author, site: WidgetMetadata.site, logo: WidgetMetadata.logo,
    icon: WidgetMetadata.icon, description: WidgetMetadata.description,
    capabilities: { home: true, category: true, detail: true, search: true, resourceVersions: true, playback: true, aggregation: true, playbackHistory: true, resourceMatching: false },
    aggregation: { search: true, playbackHistory: true, resourceMatching: false },
    parameters: [{ name: 'baseUrl', title: '站点地址', type: 'input', value: MADOU8_DEFAULT_BASE, defaultValue: MADOU8_DEFAULT_BASE, required: true, description: '站点更换域名时可在此修改。' }]
  };
}

async function getHome(ctx) {
  let recent = [];
  try { recent = parseCards(await fetchText(ctx, listURL(ctx, SECTIONS[0], 1)), ctx).slice(0, 18); } catch (_) {}
  return {
    pageType: 'home', id: 'madou8-home', title: WidgetMetadata.title, heroAspectRatio: '16:9',
    hero: recent.slice(0, 6).map(wideItem),
    sections: [{ id: 'madou8-categories', title: '分类浏览', style: 'discover.annualCategories', lazy: false, items: SECTIONS.map(categoryCard) },
      { id: 'recent', title: '最近更新', style: 'discover.ranked', lazy: false, moreAction: categoryAction(SECTIONS[0]), items: ranked(recent) }
    ].concat(SECTIONS.slice(1).map(sectionShell))
  };
}

async function getHomeSection(ctx) {
  const section = findSection(ctx && (ctx.sectionId || ctx.id || ctx.pageId)) || SECTIONS[0];
  try {
    const items = parseCards(await fetchText(ctx, listURL(ctx, section, 1)), ctx).slice(0, 18);
    return { id: section.id, title: section.title, style: section.style, lazy: false, moreAction: categoryAction(section), items: section.style === 'discover.ranked' ? ranked(items) : items };
  } catch (error) { return emptySection(section, error); }
}

async function getCategory(ctx) {
  ctx = normalizeContext(ctx);
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  const section = findSection(ctx.pageId || ctx.id) || { id: String(ctx.pageId || ctx.id || 'recent'), title: ctx.title || '麻豆视频', path: ctx.path || 'videos/recent' };
  try {
    const html = await fetchText(ctx, listURL(ctx, section, page));
    return { pageType: 'category', id: section.id, title: section.title, style: 'media.posterGrid', itemAspectRatio: '16:9', page: page, hasMore: hasNextPage(html, page), items: parseCards(html, ctx) };
  } catch (error) {
    return { pageType: 'category', id: section.id, title: section.title, style: 'media.posterGrid', itemAspectRatio: '16:9', page: page, hasMore: false, items: [], error: errorMessage(error) };
  }
}

async function search(ctx) {
  ctx = normalizeContext(ctx);
  const query = String(ctx.query || ctx.keyword || ctx.text || '').trim();
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  if (!query) return { pageType: 'search', title: '搜索', query: '', page: page, hasMore: false, items: [] };
  const url = entryURL(ctx) + '/videos/search/' + encodeURIComponent(query) + (page > 1 ? '/page/' + page : '');
  const html = await fetchText(ctx, url);
  return { pageType: 'search', id: 'search:' + query, title: '搜索：' + query, query: query, page: page, hasMore: hasNextPage(html, page), itemAspectRatio: '16:9', items: parseCards(html, ctx) };
}

async function getDetail(ctx) {
  ctx = normalizeContext(ctx);
  const url = detailURL(ctx);
  if (!url) throw new Error('详情参数无效');
  const html = await fetchText(ctx, url);
  const slug = videoSlug(url);
  const title = cleanTitle(firstNonEmpty(metaContent(html, 'property', 'og:title'), firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i), slug));
  const poster = absoluteURL(ctx, firstNonEmpty(metaContent(html, 'property', 'og:image'), metaContent(html, 'name', 'twitter:image'), slug ? 'https://spic2-110.71352.men/' + slug + '/cover-n.jpg' : ''));
  const overview = cleanText(firstNonEmpty(metaContent(html, 'name', 'description'), metaContent(html, 'property', 'og:description')));
  const releaseDate = firstMatch(html, /(20\d{2}-\d{2}-\d{2})/);
  const tags = unique(extractLinks(html, /\/(?:tag|tags|genres)\//i).map(function (x) { return x.title; })).slice(0, 20);
  const videoUid = extractVideoUid(html);
  const groups = videoUid ? await buildPlaybackGroups(ctx, url, videoUid, title).catch(function () { return []; }) : [];
  const recommendations = parseCards(html, ctx).filter(function (x) { return videoSlugFromItem(x) !== slug; }).slice(0, 15);
  return {
    pageType: 'detail', id: slug, title: title || slug, originalTitle: slug ? slug.toUpperCase() : undefined, type: 'movie',
    poster: poster, backdrop: poster, detailImageAspectRatio: '16:9', imageHeaders: imageHeaders(ctx, url), posterHeaders: imageHeaders(ctx, url), backdropHeaders: imageHeaders(ctx, url),
    overview: overview, year: releaseDate ? Number(releaseDate.slice(0, 4)) : undefined, releaseDate: releaseDate || undefined, genres: tags,
    resourceGroups: groups, resourceSummary: { versionCount: groups[0] ? groups[0].versions.length : 0, episodeCount: 0, defaultVersionId: groups[0] && groups[0].versions[0] ? groups[0].versions[0].id : '' },
    recommendations: [{ id: 'related', title: '相似视频', style: 'discover.posterCompact', items: recommendations }],
    providerIds: { code: slug, videoUid: videoUid, source: WidgetMetadata.id }
  };
}

async function getResourceVersions(ctx) {
  ctx = normalizeContext(ctx);
  const url = detailURL(ctx);
  if (!url) return { groups: [] };
  const html = await fetchText(ctx, url);
  const uid = String(ctx.videoUid || extractVideoUid(html) || '');
  return { itemId: videoSlug(url), groups: uid ? await buildPlaybackGroups(ctx, url, uid, ctx.title || '') : [] };
}

async function resolvePlayback(ctx) {
  ctx = normalizeContext(ctx);
  const url = detailURL(ctx);
  if (!url) throw new Error('播放参数无效：缺少详情地址或视频 ID');
  const html = await fetchText(ctx, url);
  const uid = String(ctx.videoUid || extractVideoUid(html) || '');
  if (!uid) throw new Error('播放解析失败：详情页未找到 video_uid');
  const info = await fetchStreamInfo(ctx, uid, url);
  const requestedHeight = positiveInt(ctx.qualityId || decodeVersionId(ctx.versionId).height, 0);
  const chosen = await chooseStream(ctx, info.playlist || [], requestedHeight, url);
  if (!chosen || !chosen.url) throw new Error('播放解析失败：流接口未返回可播放的 M3U8');
  return { url: chosen.url, container: 'm3u8', headers: playbackHeaders(ctx, url), startPositionSeconds: 0, isLive: false, streamKind: 'vod' };
}

async function buildPlaybackGroups(ctx, detailUrl, uid, title) {
  const info = await fetchStreamInfo(ctx, uid, detailUrl);
  const variants = await discoverVariants(ctx, info.playlist || [], detailUrl);
  const qualities = variants.length ? variants : [{ height: 0, label: '自动' }];
  return [{ id: 'hls', title: '在线线路', versions: qualities.map(function (q, index) {
    const id = encodeVersionId({ url: detailUrl, uid: uid, height: q.height || 0 });
    return { id: id, name: q.height ? q.height + 'P' : q.label, subtitle: q.height ? '切换时请稍候' : '自动画质', container: 'm3u8', default: index === 0, headers: playbackHeaders(ctx, detailUrl), action: { type: 'play', itemId: videoSlug(detailUrl), detailUrl: detailUrl, videoUid: uid, qualityId: q.height || 0, versionId: id, title: title } };
  }) }];
}

async function fetchStreamInfo(ctx, uid, detailUrl) {
  const url = entryURL(ctx) + '/api/video/stream?video_uid=' + encodeURIComponent(uid);
  const text = await fetchText(ctx, url, playbackHeaders(ctx, detailUrl));
  const data = parseJSON(text);
  if (!data || !Array.isArray(data.playlist)) throw new Error('播放流 API 返回了无效数据');
  return data;
}

async function discoverVariants(ctx, playlist, detailUrl) {
  const discovered = [];
  for (let i = 0; i < Math.min(playlist.length, 4); i++) {
    const url = playlist[i] && playlist[i].url;
    if (!/^https?:\/\//i.test(String(url || ''))) continue;
    try {
      const body = await fetchHlsText(ctx, url, detailUrl);
      const variants = parseMaster(body, url);
      if (variants.length) {
        const checked = await Promise.all(variants.slice(0, 6).map(async function (variant) {
          return await verifyMediaStream(ctx, variant.url, detailUrl) ? variant : null;
        }));
        const healthy = checked.filter(Boolean).sort(function (a, b) { return b.height - a.height; });
        if (healthy.length) discovered.push.apply(discovered, healthy);
      } else if (/#EXTINF/i.test(body) && await probeFirstSegment(ctx, body, url, detailUrl)) {
        const inferred = inferQuality(url);
        if (inferred) discovered.push(inferred);
      }
    } catch (_) {}
  }
  return uniqueBy(discovered, function (x) { return x.height; }).sort(function (a, b) { return b.height - a.height; });
}

async function chooseStream(ctx, playlist, requestedHeight, detailUrl) {
  let fallback = null;
  for (let i = 0; i < Math.min(playlist.length, 4); i++) {
    const item = playlist[i];
    if (!item || !/^https?:\/\//i.test(String(item.url || ''))) continue;
    try {
      const body = await fetchHlsText(ctx, item.url, detailUrl);
      const variants = parseMaster(body, item.url).sort(function (a, b) { return b.height - a.height; });
      if (!variants.length) {
        if (!/#EXTINF/i.test(body) || !await probeFirstSegment(ctx, body, item.url, detailUrl)) continue;
        const inferred = inferQuality(item.url) || { url: item.url, height: 0 };
        inferred.url = item.url;
        if (!fallback) fallback = inferred;
        if (!requestedHeight || inferred.height === requestedHeight) return inferred;
      } else {
        const ordered = requestedHeight
          ? variants.filter(function (x) { return x.height === requestedHeight; }).concat(variants.filter(function (x) { return x.height !== requestedHeight; }))
          : variants;
        for (let j = 0; j < ordered.length; j++) {
          if (await verifyMediaStream(ctx, ordered[j].url, detailUrl)) return ordered[j];
        }
      }
    } catch (_) {}
  }
  if (fallback) return fallback;
  throw new Error('播放线路检查失败：所有清单或首个媒体分片均不可用');
}

async function fetchHlsText(ctx, url, detailUrl) {
  const body = await fetchText(ctx, url, playbackHeaders(ctx, detailUrl));
  if (!/^\s*#EXTM3U/i.test(body)) throw new Error('HLS 清单无效：' + url);
  return body;
}

async function verifyMediaStream(ctx, url, detailUrl) {
  try {
    const body = await fetchHlsText(ctx, url, detailUrl);
    return /#EXTINF/i.test(body) && await probeFirstSegment(ctx, body, url, detailUrl);
  } catch (_) { return false; }
}

async function probeFirstSegment(ctx, playlistText, playlistUrl, detailUrl) {
  const segment = firstMediaURI(playlistText, playlistUrl);
  if (!segment) return false;
  try {
    const response = await httpGet(segment, { headers: Object.assign({}, playbackHeaders(ctx, detailUrl), { Range: 'bytes=0-1023' }) });
    const status = responseStatus(response);
    return status === 0 || status === 200 || status === 206;
  } catch (_) { return false; }
}

function firstMediaURI(text, playlistUrl) {
  const lines = String(text || '').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && line.charAt(0) !== '#') return resolveURL(line, playlistUrl);
  }
  return '';
}

function responseStatus(response) {
  if (!response || typeof response !== 'object') return 0;
  const value = response.status != null ? response.status : response.statusCode != null ? response.statusCode : response.code;
  const number = Number(value);
  return isFinite(number) ? number : 0;
}

function inferQuality(url) {
  const value = String(url || '');
  let match = value.match(/(?:^|\/)(\d{3,4})x(\d{3,4})(?:\/|$)/i);
  if (match) return { width: Number(match[1]), height: Number(match[2]), url: value };
  match = value.match(/(?:^|\/)(\d{3,4})p(?:\/|$)/i);
  return match ? { width: 0, height: Number(match[1]), url: value } : null;
}

function parseMaster(text, masterUrl) {
  if (!/#EXT-X-STREAM-INF/i.test(String(text || ''))) return [];
  const lines = String(text).split(/\r?\n/); const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^#EXT-X-STREAM-INF:/i.test(lines[i])) continue;
    const r = lines[i].match(/RESOLUTION=(\d+)x(\d+)/i); let j = i + 1;
    while (j < lines.length && (!lines[j].trim() || lines[j].trim().charAt(0) === '#')) j++;
    if (j < lines.length) out.push({ width: r ? Number(r[1]) : 0, height: r ? Number(r[2]) : 0, url: resolveURL(lines[j].trim(), masterUrl) });
  }
  return uniqueBy(out.filter(function (x) { return x.url; }), function (x) { return x.height + '|' + x.url; });
}

function parseCards(html, ctx) {
  html = String(html || ''); const marker = /<div\b[^>]*class=["'][^"']*streamit-video-card\b[^"']*["'][^>]*>/gi; const starts = []; let m;
  while ((m = marker.exec(html))) starts.push(m.index);
  const items = [];
  for (let i = 0; i < starts.length; i++) {
    const block = html.slice(starts[i], starts[i + 1] || Math.min(html.length, starts[i] + 12000));
    const href = decodeHTML(firstMatch(block, /href=["']([^"']*\/video\/cid\/[^"'?#]+)["']/i));
    if (!href) continue;
    const id = videoSlug(href); const image = decodeHTML(firstNonEmpty(firstMatch(block, /<img\b[^>]*(?:src|data-src)=["']([^"']+)["']/i), id ? 'https://spic2-110.71352.men/' + id + '/cover-t.jpg' : ''));
    const title = cleanText(firstNonEmpty(firstMatch(block, /<img\b[^>]*alt=["']([^"']+)["']/i), firstMatch(block, /data-title=["']([^"']+)["']/i), firstMatch(block, /streamit-video-card__caption-link[^>]*>([\s\S]*?)<\/a>/i), id));
    const duration = cleanText(firstMatch(block, /streamit-video-card__time[\s\S]{0,500}?<p[^>]*>([\s\S]*?)<\/p>/i));
    if (!id || !title || items.some(function (x) { return x.id === id; })) continue;
    const detail = absoluteURL(ctx, href);
    items.push({ id: id, title: title, type: 'movie', poster: absoluteURL(ctx, image), backdrop: absoluteURL(ctx, image), aspectRatio: '16:9', imageHeaders: imageHeaders(ctx, detail), posterHeaders: imageHeaders(ctx, detail), backdropHeaders: imageHeaders(ctx, detail), metadataText: duration || undefined, remarks: duration || undefined, action: { type: 'detail', itemId: id, detailUrl: detail } });
  }
  return items;
}

function listURL(ctx, section, page) { return entryURL(ctx) + '/' + String(section.path || 'videos/recent').replace(/^\/+/, '') + (page > 1 ? '/page/' + page : ''); }
function detailURL(ctx) { const direct = firstNonEmpty(ctx && ctx.detailUrl, ctx && ctx.url); if (/^https?:\/\//i.test(direct)) return direct; const id = firstNonEmpty(ctx && ctx.itemId, ctx && ctx.id, decodeVersionId(ctx && ctx.versionId).slug); return id ? entryURL(ctx) + '/video/cid/' + encodeURIComponent(String(id).replace(/^.*\//, '')) : ''; }
function entryURL(ctx) { return baseURL(ctx) + MADOU8_ENTRY; }
function baseURL(ctx) { const raw = contextValue(normalizeContext(ctx), 'baseUrl') || MADOU8_DEFAULT_BASE; return String(raw).replace(/\/+$/, ''); }
function categoryAction(s) { return { type: 'category', pageId: s.id, title: s.title, path: s.path, itemAspectRatio: '16:9' }; }
function categoryCard(s) { return { id: s.id, title: s.title, type: 'category', subtitle: '浏览' + s.title, action: categoryAction(s) }; }
function sectionShell(s) { return { id: s.id, title: s.title, style: s.style, lazy: true, moreAction: categoryAction(s), items: [] }; }
function findSection(id) { id = String(id || ''); return SECTIONS.find(function (x) { return x.id === id || x.path === id; }); }
function ranked(items) { return items.map(function (x, i) { const y = Object.assign({}, x); y.rank = i + 1; return y; }); }
function wideItem(x) { const y = Object.assign({}, x); y.aspectRatio = '16:9'; return y; }
function emptySection(s, e) { return { id: s.id, title: s.title, style: s.style, lazy: false, items: [], subtitle: '加载失败：' + errorMessage(e), moreAction: categoryAction(s) }; }
function hasNextPage(html, page) { return new RegExp('/page/' + (page + 1) + '(?:["\'?#/]|$)', 'i').test(String(html || '')); }
function videoSlug(url) { const m = String(url || '').match(/\/video\/cid\/([^/?#"']+)/i); return m ? decodeURIComponent(m[1]) : ''; }
function videoSlugFromItem(x) { return x && (x.id || videoSlug(x.action && x.action.detailUrl)); }
function extractVideoUid(html) { return firstNonEmpty(firstMatch(html, /var\s+videoUid\s*=\s*["']([^"']+)["']/i), firstMatch(html, /data-video-uid=["']([^"']+)["']/i)); }
function extractLinks(html, pathPattern) { const out = [], re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi; let m; while ((m = re.exec(String(html || '')))) if (pathPattern.test(m[1])) out.push({ url: decodeHTML(m[1]), title: cleanText(m[2]) }); return out; }
function metaContent(html, attr, value) { const tags = String(html || '').match(/<meta\b[^>]*>/gi) || []; for (let i = 0; i < tags.length; i++) { const a = attribute(tags[i], attr); if (a.toLowerCase() === String(value).toLowerCase()) return decodeHTML(attribute(tags[i], 'content')); } return ''; }
function attribute(tag, name) { const m = String(tag).match(new RegExp('\\b' + name + '\\s*=\\s*(["\'])([\\s\\S]*?)\\1', 'i')); return m ? m[2] : ''; }
function imageHeaders(ctx, referer) { return { Referer: referer || entryURL(ctx) + '/', 'User-Agent': MADOU8_UA }; }
function playbackHeaders(ctx, referer) { return { Referer: referer || entryURL(ctx) + '/', 'User-Agent': MADOU8_UA, Accept: '*/*' }; }

async function fetchText(ctx, url, extraHeaders) { const response = await httpGet(url, { headers: Object.assign({ 'User-Agent': MADOU8_UA, Accept: 'text/html,application/xhtml+xml,application/json,application/vnd.apple.mpegurl,*/*;q=0.8', Referer: entryURL(ctx) + '/' }, extraHeaders || {}) }); const text = unwrapResponse(response); if (!text) throw new Error('HTTP 返回空内容：' + url); if (/Just a moment|cf-mitigated|Cloudflare Ray ID/i.test(text)) throw new Error('站点返回 Cloudflare 验证页'); return text; }
async function httpGet(url, options) {
  if (typeof Widget !== 'undefined' && Widget && Widget.http) { if (typeof Widget.http.get === 'function') return Widget.http.get(url, options || {}); if (typeof Widget.http.request === 'function') return Widget.http.request(Object.assign({ url: url, method: 'GET' }, options || {})); }
  if (typeof $http !== 'undefined' && $http) { if (typeof $http.get === 'function') return $http.get(url, options || {}); if (typeof $http.request === 'function') return $http.request(Object.assign({ url: url, method: 'GET' }, options || {})); }
  if (typeof fetch === 'function') return fetch(url, options || {});
  throw new Error('当前环境没有可用的 HTTP 客户端');
}
function unwrapResponse(value) { if (value == null) return ''; if (typeof value === 'string') return value; if (typeof value.text === 'function') return value.text(); if (typeof value.body === 'string') return value.body; if (typeof value.data === 'string') return value.data; if (value.data && typeof value.data.html === 'string') return value.data.html; if (typeof value.text === 'string') return value.text; return JSON.stringify(value.data || value.body || value); }
function normalizeContext(ctx) { if (typeof ctx === 'string') { try { return JSON.parse(ctx); } catch (_) { return {}; } } return ctx && typeof ctx === 'object' ? ctx : {}; }
function contextValue(ctx, key) { ctx = normalizeContext(ctx); const bags = [ctx, ctx.params, ctx.config, ctx.settings, ctx.parameters, ctx.pagination, ctx.pageInfo]; for (let i = 0; i < bags.length; i++) if (bags[i] && bags[i][key] != null && bags[i][key] !== '') return bags[i][key]; return ''; }
function parseJSON(s) { try { return JSON.parse(String(s || '')); } catch (_) { return null; } }
function encodeVersionId(x) { return 'madou8://' + encodeURIComponent(JSON.stringify({ slug: videoSlug(x.url), url: x.url, uid: x.uid, height: x.height || 0 })); }
function decodeVersionId(v) { const s = String(v || ''); if (s.indexOf('madou8://') !== 0) return {}; try { return JSON.parse(decodeURIComponent(s.slice(9))); } catch (_) { return {}; } }
function resolveURL(value, base) { try { return new URL(value, base).toString(); } catch (_) { if (/^https?:\/\//i.test(value)) return value; return ''; } }
function absoluteURL(ctx, value) { return resolveURL(decodeHTML(value), baseURL(ctx) + '/'); }
function firstMatch(s, re) { const m = String(s || '').match(re); return m ? m[1] || '' : ''; }
function firstNonEmpty() { for (let i = 0; i < arguments.length; i++) if (arguments[i] != null && String(arguments[i]).trim()) return String(arguments[i]).trim(); return ''; }
function decodeHTML(s) { return String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); }); }
function cleanText(s) { return decodeHTML(String(s || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function cleanTitle(s) { return cleanText(s).replace(/^\s*麻豆视频\s*[|\-] */i, '').replace(/\s*[|\-] *麻豆视频\s*$/i, '').trim(); }
function positiveInt(v, fallback) { const n = Number(v); return isFinite(n) && n > 0 ? Math.floor(n) : fallback; }
function unique(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }
function uniqueBy(a, key) { const seen = {}; return a.filter(function (x) { const k = key(x); if (seen[k]) return false; seen[k] = true; return true; }); }
function errorMessage(e) { return e && e.message ? e.message : String(e || '未知错误'); }

const exported = { WidgetMetadata: WidgetMetadata, getManifest: getManifest, getHome: getHome, getHomeSection: getHomeSection, getCategory: getCategory, getDetail: getDetail, getResourceVersions: getResourceVersions, resolvePlayback: resolvePlayback, search: search, home: getHome, homeSection: getHomeSection, category: getCategory, detail: getDetail, getVersions: getResourceVersions, versions: getResourceVersions, resolvePlay: resolvePlayback, play: resolvePlayback, getPlayinfo: resolvePlayback, quickSearch: search, getSearch: search, onSearch: search, __test: { parseCards: parseCards, parseMaster: parseMaster, extractVideoUid: extractVideoUid, hasNextPage: hasNextPage } };
if (typeof globalThis !== 'undefined') Object.keys(exported).forEach(function (k) { globalThis[k] = exported[k]; });
if (typeof module !== 'undefined' && module.exports) module.exports = exported;
