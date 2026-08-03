// @name PimpBunny Mini Library

const PB_BASE = 'https://pimpbunny.com';
const PB_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';
const PB_LOGO = PB_BASE + '/static/v2/images/favicon/favicon-192x192.png';

const WidgetMetadata = {
  id: 'pimpbunny-mini-library', name: 'PimpBunny', title: 'PimpBunny', version: '1.0.0',
  author: 'Alan huang', logo: PB_LOGO, icon: PB_LOGO, site: PB_BASE,
  description: 'PimpBunny 自定义媒体库，支持视频列表、分类、搜索、详情、多清晰度和原生 MP4 播放。'
};

const PB_SECTIONS = [
  { id: 'latest', title: '最新视频', path: '/videos/', style: 'discover.standard' },
  { id: 'viewed', title: '最多观看', path: '/videos/?sort_by=video_viewed', style: 'discover.ranked' },
  { id: 'rated', title: '最佳评分', path: '/videos/?sort_by=rating', style: 'discover.standard' },
  { id: 'exclusive', title: '独家视频', path: '/categories/exclusive/', style: 'discover.standard' },
  { id: '4k', title: '4K 标记', path: '/categories/4k/', style: 'discover.standard' }
];

function getManifest() {
  return {
    id: WidgetMetadata.id, name: WidgetMetadata.name, title: WidgetMetadata.title,
    version: WidgetMetadata.version, author: WidgetMetadata.author, logo: WidgetMetadata.logo,
    icon: WidgetMetadata.icon, site: WidgetMetadata.site, description: WidgetMetadata.description,
    capabilities: { home: true, category: true, detail: true, search: true, playback: true, resourceVersions: true, aggregation: true, playbackHistory: true, resourceMatching: false },
    aggregation: { search: true, playbackHistory: true, resourceMatching: false },
    parameters: [{ name: 'baseURL', title: '站点地址', type: 'input', defaultValue: PB_BASE, value: PB_BASE, required: true }]
  };
}

async function getHome(ctx) {
  const home = normalizeContext(ctx);
  let latest = [];
  try { latest = (await loadItems(home, PB_SECTIONS[0], 1)).slice(0, 18); } catch (_) { latest = []; }
  return {
    pageType: 'home', id: 'pimpbunny-home', title: 'PimpBunny', heroAspectRatio: '16:9', hero: latest.slice(0, 6),
    sections: PB_SECTIONS.map(function (section, index) {
      const items = index === 0 ? latest.map(function (item, i) { return section.id === 'viewed' ? withRank(item, i) : item; }) : [];
      return { id: section.id, title: section.title, style: section.style, lazy: index !== 0, items: items,
        loadAction: { type: 'custom', id: section.id, sectionId: section.id, title: section.title }, moreAction: categoryAction(section) };
    })
  };
}

async function getHomeSection(ctx) {
  const input = normalizeContext(ctx);
  const section = findSection(value(input, 'sectionId') || value(input, 'id')) || PB_SECTIONS[0];
  try {
    let items = (await loadItems(input, section, 1)).slice(0, 18);
    if (section.style === 'discover.ranked') items = items.map(withRank);
    return { id: section.id, title: section.title, style: section.style, lazy: false, items: items, moreAction: categoryAction(section) };
  } catch (error) {
    return { id: section.id, title: section.title, style: section.style, lazy: false, items: [], error: text(error && (error.message || error)) };
  }
}

async function getCategory(ctx) {
  const input = normalizeContext(ctx);
  const section = findSection(value(input, 'pageId') || value(input, 'id')) || PB_SECTIONS[0];
  const page = positiveInt(value(input, 'page') || value(input, 'pg') || value(input, 'currentPage'), 1);
  const html = await fetchText(input, pageURL(baseURL(input) + section.path, page));
  let items = parseList(input, html);
  if (section.style === 'discover.ranked') items = items.map(function (item, i) { return withRank(item, (page - 1) * 28 + i); });
  return { pageType: 'category', id: section.id, title: section.title, style: 'media.posterGrid', itemAspectRatio: '16:9', page: page,
    hasMore: hasNext(html, page), nextPage: hasNext(html, page) ? page + 1 : undefined, items: items };
}

async function getDetail(ctx) {
  const input = normalizeContext(ctx);
  const url = detailURL(input);
  if (!url) throw new Error('PimpBunny 详情参数无效');
  const html = await fetchText(input, url);
  const detail = parseDetail(input, html, url);
  const related = parseList(input, html).filter(function (item) { return item.id !== url; }).slice(0, 18);
  return {
    pageType: 'detail', id: url, title: detail.title, type: 'movie', poster: detail.poster, backdrop: detail.poster,
    imageHeaders: imageHeaders(url), posterHeaders: imageHeaders(url), backdropHeaders: imageHeaders(url), detailImageAspectRatio: '16:9',
    overview: detail.overview, runtimeMinutes: detail.runtimeMinutes, genres: detail.genres, cast: detail.cast,
    resourceGroups: detail.qualities.length ? resourceGroups(url, detail.title, detail.qualities) : [],
    recommendations: related.length ? [{ id: 'related', title: '相关推荐', style: 'discover.standard', items: related }] : []
  };
}

async function getResourceVersions(ctx) {
  const input = normalizeContext(ctx);
  const url = detailURL(input);
  if (!url) return [];
  const detail = parseDetail(input, await fetchText(input, url), url);
  if (!detail.qualities.length) throw new Error('详情页没有返回可播放清晰度');
  return resourceGroups(url, detail.title, detail.qualities);
}

async function resolvePlayback(ctx) {
  const input = normalizeContext(ctx);
  const url = detailURL(input);
  if (!url) throw new Error('播放参数缺少详情地址');
  const requested = qualityFromContext(input);
  const page = await fetchPage(input, url);
  const detail = parseDetail(input, page.html, url);
  if (!detail.qualities.length) throw new Error('详情页没有返回公开可播放 MP4');
  const selected = detail.qualities.find(function (q) { return q.id === requested; }) || detail.qualities[0];
  return { url: selected.url, container: 'mp4', headers: playbackHeaders(url, page.cookie), startPositionSeconds: 0, isLive: false, streamKind: 'file' };
}

async function search(ctx) {
  const input = normalizeContext(ctx);
  const query = clean(value(input, 'query') || value(input, 'keyword') || value(input, 'text'));
  const page = positiveInt(value(input, 'page') || value(input, 'pg'), 1);
  if (!query) return { pageType: 'search', title: '搜索结果', keyword: '', page: page, hasMore: false, items: [] };
  const root = baseURL(input) + '/search/' + encodeURIComponent(query) + '/';
  const html = await fetchText(input, pageURL(root, page));
  return { pageType: 'search', title: query, keyword: query, style: 'media.posterGrid', itemAspectRatio: '16:9', page: page,
    hasMore: hasNext(html, page), nextPage: hasNext(html, page) ? page + 1 : undefined, items: parseList(input, html) };
}

function onSearch(ctx) { return search(ctx); }
function getSearch(ctx) { return search(ctx); }
function play(ctx) { return resolvePlayback(ctx); }
function getPlayback(ctx) { return resolvePlayback(ctx); }

function parseList(ctx, html) {
  const out = [], seen = {};
  const re = /<a\b[^>]*class=["'][^"']*ui-card-link[^"']*["'][^>]*href=["']([^"']*\/videos\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(html || '')) !== null) {
    const url = absolute(ctx, match[1]);
    if (!url || seen[url] || /\/videos\/(?:\d+\/)?$/i.test(url)) continue;
    const block = match[2];
    const poster = absolute(ctx, first(block, /<img\b[^>]*(?:data-original|data-webp|data-src)=["']([^"']+)["']/i) || first(block, /<img\b[^>]*src=["']([^"']+)["']/i));
    const title = clean(first(block, /<img\b[^>]*alt=["']([^"']+)["']/i) || first(block, /ui-card-title[^>]*>([\s\S]*?)<\/div>/i));
    if (!title || !poster || /^data:/i.test(poster)) continue;
    seen[url] = true;
    const duration = clean(first(block, /ui-card-duration[^>]*>([\s\S]*?)<\/div>/i)).replace(/4K/gi, '').trim();
    const marked4k = /ui-card-pbn-4k/i.test(block);
    out.push({ id: url, title: title, subtitle: duration || undefined, remarks: marked4k ? '4K 标记' : duration || undefined, type: 'movie',
      poster: poster, backdrop: poster, imageHeaders: imageHeaders(url), aspectRatio: '16:9',
      action: { type: 'detail', itemId: url, id: url, url: url, title: title } });
  }
  return out;
}

function parseDetail(ctx, html, url) {
  const title = clean(meta(html, 'property', 'og:title') || first(html, /<title[^>]*>([\s\S]*?)<\/title>/i)).replace(/\s*\|\s*PimpBunny\s*$/i, '');
  const poster = absolute(ctx, meta(html, 'property', 'og:image') || first(html, /"thumbnailUrl"\s*:\s*"([^"]+)"/i));
  const overview = clean(meta(html, 'name', 'description') || meta(html, 'property', 'og:description'));
  const duration = first(html, /"duration"\s*:\s*"PT(?:(\d+)H)?(?:(\d+)M)?/i, true);
  const runtimeMinutes = duration ? Number(duration[1] || 0) * 60 + Number(duration[2] || 0) : undefined;
  const tags = clean(first(html, /video_tags\s*:\s*'([^']*)'/i)).split(',').map(clean).filter(Boolean);
  const models = clean(first(html, /video_models\s*:\s*'([^']*)'/i)).split(',').map(clean).filter(Boolean);
  return { title: title || 'Untitled', poster: poster, overview: overview, runtimeMinutes: runtimeMinutes,
    genres: tags.slice(0, 12), cast: models.map(function (name) { return { name: name }; }), qualities: parseQualities(html) };
}

function parseQualities(html) {
  const candidates = [], slots = {};
  const pair = /\b(video_url|video_alt_url(\d*))\s*:\s*'([^']+)'[\s\S]{0,900}?\b\1_text\s*:\s*'([^']+)'/gi;
  let m;
  while ((m = pair.exec(html || '')) !== null) {
    const url = decode(m[3]), label = clean(m[4]), height = parseInt(label, 10) || 0;
    if (!isMedia(url) || !height || /upgrade=true/i.test(url)) continue;
    slots[label] = { id: String(height), title: label, height: height, url: url };
  }
  Object.keys(slots).forEach(function (key) { candidates.push(slots[key]); });
  return candidates.sort(function (a, b) { return b.height - a.height; });
}

function resourceGroups(url, title, qualities) {
  return [{ id: 'quality', title: '播放清晰度', versions: qualities.map(function (q, index) {
    return { id: q.id, name: q.title, title: q.title, subtitle: '播放时刷新临时地址', default: index === 0,
      action: { type: 'play', itemId: url, versionId: q.id, qualityId: q.id, title: title + ' · ' + q.title } };
  }) }];
}

async function loadItems(ctx, section, page) { return parseList(ctx, await fetchText(ctx, pageURL(baseURL(ctx) + section.path, page))); }

async function fetchText(ctx, url) {
  return (await fetchPage(ctx, url)).html;
}

async function fetchPage(ctx, url) {
  const headers = requestHeaders(url);
  let response;
  if (typeof Widget !== 'undefined' && Widget.http) {
    if (typeof Widget.http.get === 'function') response = await Widget.http.get(url, { headers: headers });
    else if (typeof Widget.http.request === 'function') response = await Widget.http.request({ url: url, method: 'GET', headers: headers });
  } else if (typeof $http !== 'undefined') {
    if (typeof $http.get === 'function') response = await $http.get(url, { headers: headers });
    else if (typeof $http.request === 'function') response = await $http.request({ url: url, method: 'GET', headers: headers });
  }
  const body = unwrap(response);
  if (!body || /Just a moment|cf-mitigated|Cloudflare Ray ID/i.test(body)) throw new Error('页面请求失败或遇到 Cloudflare 验证: ' + url);
  return { html: body, cookie: responseCookies(response) };
}

function unwrap(response) {
  if (typeof response === 'string') return response;
  if (!response) return '';
  let data = response.data !== undefined ? response.data : response.body !== undefined ? response.body : response.text;
  if (data && typeof data === 'object') data = data.html !== undefined ? data.html : data.data !== undefined ? data.data : data.body;
  return typeof data === 'string' ? data : '';
}

function responseCookies(response) {
  if (!response || typeof response !== 'object') return '';
  const headers = response.headers || response.header || response.responseHeaders || {};
  let raw = '';
  if (typeof headers === 'object') raw = headers['set-cookie'] || headers['Set-Cookie'] || '';
  if (!raw && typeof response.cookies === 'string') raw = response.cookies;
  const list = Array.isArray(raw) ? raw : text(raw).split(/,(?=\s*[^;,=]+=[^;,]+)/);
  return list.map(function (line) { return text(line).split(';')[0]; }).filter(Boolean).join('; ');
}

function requestHeaders(referer) { return { Referer: referer || PB_BASE + '/videos/', 'User-Agent': PB_UA, Accept: 'text/html,application/xhtml+xml' }; }
function imageHeaders(referer) { return { Referer: referer || PB_BASE + '/videos/', 'User-Agent': PB_UA }; }
function playbackHeaders(referer, cookie) {
  const headers = { Referer: referer, Origin: PB_BASE, 'User-Agent': PB_UA, Accept: '*/*' };
  if (cookie) headers.Cookie = cookie;
  return headers;
}
function baseURL(ctx) { return text(value(ctx, 'baseURL') || PB_BASE).replace(/\/+$/, '') || PB_BASE; }
function pageURL(url, page) {
  if (page <= 1) return url;
  const parts = String(url).split('?'), root = parts[0].replace(/\/+$/, '') + '/' + page + '/', query = parts[1];
  return root + (query ? '?' + query : '');
}
function hasNext(html, page) { const n = page + 1; return new RegExp('href=["\'][^"\']*/' + n + '/(?:[?"\'])', 'i').test(html || '') || /rel=["']next["']/i.test(html || ''); }
function categoryAction(s) { return { type: 'category', id: s.id, pageId: s.id, title: s.title, itemAspectRatio: '16:9' }; }
function findSection(id) { id = text(id).replace(/^category-/, ''); return PB_SECTIONS.find(function (s) { return s.id === id; }) || null; }
function withRank(item, index) { const copy = Object.assign({}, item); copy.rank = Number(index) + 1; return copy; }
function detailURL(ctx) {
  const keys = ['itemId', 'detailURL', 'pageURL', 'id', 'episodeId'];
  for (let i = 0; i < keys.length; i += 1) { const v = text(value(ctx, keys[i])); if (/^https?:\/\/[^/]+\/videos\/[^?#]+/i.test(v)) return v; if (/^\/videos\//i.test(v)) return baseURL(ctx) + v; }
  return '';
}
function qualityFromContext(ctx) { return text(value(ctx, 'qualityId') || value(ctx, 'versionId')).replace(/^quality:/, ''); }
function absolute(ctx, url) { url = decode(url); if (!url) return ''; if (/^https?:\/\//i.test(url)) return url; if (url.indexOf('//') === 0) return 'https:' + url; return baseURL(ctx) + (url.charAt(0) === '/' ? url : '/' + url); }
function isMedia(url) { return /\.mp4\/(?:\?|$)|\.mp4(?:[?#]|$)/i.test(url || ''); }
function first(s, re, raw) { const m = re.exec(s || ''); return raw ? m : m ? (m[1] || '') : ''; }
function meta(html, attr, name) { const a = escapeRe(attr), n = escapeRe(name); return decode(first(html, new RegExp('<meta[^>]*' + a + '=["\\\']' + n + '["\\\'][^>]*content=["\\\']([^"\\\']*)', 'i')) || first(html, new RegExp('<meta[^>]*content=["\\\']([^"\\\']*)["\\\'][^>]*' + a + '=["\\\']' + n + '["\\\']', 'i'))); }
function decode(v) { return text(v).replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#0*39;|&apos;/gi, "'").replace(/\\\//g, '/'); }
function clean(v) { return decode(text(v).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function normalizeContext(ctx) { if (typeof ctx === 'string') { try { return JSON.parse(ctx); } catch (_) { return {}; } } return ctx && typeof ctx === 'object' ? ctx : {}; }
function value(ctx, key) { if (!ctx) return ''; if (ctx[key] !== undefined && ctx[key] !== null) return ctx[key]; const bags = ['params', 'config', 'settings', 'parameters', 'pagination', 'pageInfo']; for (let i = 0; i < bags.length; i += 1) if (ctx[bags[i]] && ctx[bags[i]][key] !== undefined) return ctx[bags[i]][key]; return ''; }
function positiveInt(v, fallback) { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : fallback; }
function text(v) { return v === undefined || v === null ? '' : String(v).trim(); }
function escapeRe(v) { return text(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

const PB_API = { getManifest: getManifest, getHome: getHome, getHomeSection: getHomeSection, getCategory: getCategory, getDetail: getDetail,
  getResourceVersions: getResourceVersions, resolvePlayback: resolvePlayback, search: search, onSearch: onSearch, getSearch: getSearch, play: play, getPlayback: getPlayback,
  __test: { parseList: parseList, parseDetail: parseDetail, parseQualities: parseQualities, pageURL: pageURL } };
if (typeof globalThis !== 'undefined') Object.keys(PB_API).forEach(function (key) { globalThis[key] = PB_API[key]; });
if (typeof module !== 'undefined' && module.exports) module.exports = PB_API;
