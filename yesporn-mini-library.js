// @name YesPorn Mini Library

const YP_BASE = 'https://cn.yesporn.ws';
const YP_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const YP_LOGO = 'https://simg-83.71352.men/15,jW0wJmHiaiFEnwM//static/images/favicon/favicon-192x192.png';
const YP_LIST_BLOCK = 'list_videos_most_recent_videos';
const YP_PAGE_SIZE = 20;

const WidgetMetadata = {
  id: 'yesporn-mini-library', name: 'YesPorn', title: 'YesPorn', version: '1.0.2',
  author: 'Alan huang', logo: YP_LOGO, icon: YP_LOGO, site: YP_BASE,
  description: 'YesPorn 自定义媒体库，支持最新、排行、频道、分类、搜索、详情、多清晰度和原生 MP4 播放。'
};

const YP_SECTIONS = [
  { id: 'latest', title: '最新视频', path: '/latest-updates/', pagination: 'path', style: 'discover.standard' },
  { id: 'viewed', title: '最多观看', path: '/most-popular/', pagination: 'path', style: 'discover.ranked' },
  { id: 'rated', title: '最佳评分', path: '/top-rated/', pagination: 'path', style: 'discover.standard' },
  { id: 'reality-kings', title: 'Reality Kings', path: '/channels/realitykings-ek5zii/', block: 'list_videos_common_videos_list', params: { sort_by: 'post_date' }, style: 'discover.spotlight' },
  { id: 'bangbros', title: 'Bangbros', path: '/channels/bangbros-ek5zii/', block: 'list_videos_common_videos_list', params: { sort_by: 'post_date' }, style: 'discover.standard' },
  { id: 'mofos', title: 'Mofos', path: '/channels/mofos-ek5zii/', block: 'list_videos_common_videos_list', params: { sort_by: 'post_date' }, style: 'discover.standard' },
  { id: 'japanese', title: 'Japanese', path: '/categories/japanese/', pagination: 'path', style: 'discover.standard' },
  { id: 'voyeur', title: 'Voyeur', path: '/categories/voyeur/', pagination: 'path', style: 'discover.standard' }
];

function getManifest() {
  return {
    id: WidgetMetadata.id, name: WidgetMetadata.name, title: WidgetMetadata.title,
    version: WidgetMetadata.version, author: WidgetMetadata.author, logo: WidgetMetadata.logo,
    icon: WidgetMetadata.icon, site: WidgetMetadata.site, description: WidgetMetadata.description,
    capabilities: { home: true, category: true, detail: true, search: true, playback: true, resourceVersions: true, aggregation: true, playbackHistory: true, resourceMatching: false },
    aggregation: { search: true, playbackHistory: true, resourceMatching: false },
    parameters: [{ name: 'baseURL', title: '站点地址', type: 'input', defaultValue: YP_BASE, value: YP_BASE, required: true }]
  };
}

async function getHome(ctx) {
  const input = normalizeContext(ctx);
  let latest = [];
  try { latest = (await loadItems(input, YP_SECTIONS[0], 1)).slice(0, 20); } catch (_) { latest = []; }
  return {
    pageType: 'home', id: 'yesporn-home', title: 'YesPorn', heroAspectRatio: '16:9', hero: latest.slice(0, 6),
    sections: YP_SECTIONS.map(function (section, index) {
      const items = index === 0 ? latest : [];
      return { id: section.id, title: section.title, style: section.style, lazy: index !== 0, items: items,
        loadAction: { type: 'custom', id: section.id, sectionId: section.id, title: section.title }, moreAction: categoryAction(section) };
    })
  };
}

async function getHomeSection(ctx) {
  const input = normalizeContext(ctx);
  const section = findSection(value(input, 'sectionId') || value(input, 'id')) || YP_SECTIONS[0];
  try {
    let items = (await loadItems(input, section, 1)).slice(0, 20);
    if (section.style === 'discover.ranked') items = items.map(withRank);
    return { id: section.id, title: section.title, style: section.style, lazy: false, items: items, moreAction: categoryAction(section) };
  } catch (error) {
    return { id: section.id, title: section.title, style: section.style, lazy: false, items: [], error: text(error && (error.message || error)) };
  }
}

async function getCategory(ctx) {
  const input = normalizeContext(ctx);
  const section = findSection(value(input, 'pageId') || value(input, 'id')) || YP_SECTIONS[0];
  const page = contextPage(input);
  const html = await fetchText(input, listURL(input, section, page));
  let items = parseList(input, html);
  if (section.style === 'discover.ranked') items = items.map(function (item, i) { return withRank(item, (page - 1) * 20 + i); });
  const more = items.length >= YP_PAGE_SIZE || (items.length > 0 && hasNext(html, page));
  return { pageType: 'category', id: section.id, title: section.title, style: 'media.posterGrid', itemAspectRatio: '16:9', page: page,
    hasMore: more, nextPage: more ? page + 1 : undefined, items: items };
}

async function getDetail(ctx) {
  const input = normalizeContext(ctx);
  const url = detailURL(input);
  if (!url) throw new Error('YesPorn 详情参数无效');
  const html = await fetchText(input, url);
  const detail = parseDetail(input, html, url);
  const related = parseList(input, html).filter(function (item) { return item.id !== url; }).slice(0, 18);
  return {
    pageType: 'detail', id: url, title: detail.title, type: 'movie', poster: detail.poster, backdrop: detail.poster,
    imageHeaders: imageHeaders(url), posterHeaders: imageHeaders(url), backdropHeaders: imageHeaders(url), detailImageAspectRatio: '16:9',
    overview: detail.overview, year: detail.year, runtimeMinutes: detail.runtimeMinutes, genres: detail.genres, cast: detail.cast,
    resourceGroups: detail.qualities.length ? automaticResourceGroup(url, detail.title, detail.qualities) : [],
    recommendations: related.length ? [{ id: 'related', title: '相关推荐', style: 'discover.standard', items: related }] : []
  };
}

async function getResourceVersions(ctx) {
  const input = normalizeContext(ctx), url = detailURL(input);
  if (!url) return [];
  const detail = parseDetail(input, await fetchText(input, url), url);
  if (!detail.qualities.length) throw new Error('详情页没有返回可播放清晰度');
  return automaticResourceGroup(url, detail.title, detail.qualities);
}

async function resolvePlayback(ctx) {
  const input = normalizeContext(ctx), url = detailURL(input);
  if (!url) throw new Error('播放参数缺少详情地址');
  if (typeof Widget === 'undefined' || !Widget.browser || typeof Widget.browser.fetch !== 'function') {
    throw new Error('YesPorn 播放需要 Dreamby 设备浏览器生成临时 MP4 地址');
  }
  const expectedId = videoNumericId(url);
  let result, candidates = [], lastError = '';
  for (let attempt = 0; attempt < 2 && !candidates.length; attempt += 1) {
    const playerURL = url + (url.indexOf('?') >= 0 ? '&' : '?') + '_dreamby=' + Date.now() + '-' + attempt;
    try {
      result = await Widget.browser.fetch(playerURL, {
        visible: false, timeout: 12, timeoutSeconds: 12, waitAfterLoad: attempt === 0 ? 7 : 4, headers: requestHeaders(url)
      });
      candidates = browserMediaCandidates(result, expectedId);
    } catch (error) {
      lastError = text(error && (error.message || error));
    }
  }
  const selected = candidates[0];
  if (!selected) {
    const keys = result && typeof result === 'object' ? Object.keys(result).join(',') : typeof result;
    throw new Error('YesPorn 浏览器未返回当前影片的正片 MP4；stage=media-capture；videoId=' + expectedId + '；resultKeys=' + keys +
      '；mediaCandidates=0；blobOnly=' + browserBlobOnly(result, expectedId) + (lastError ? '；reason=' + lastError : ''));
  }
  return { url: selected, container: 'mp4', headers: playbackHeaders(url, ''), startPositionSeconds: 0, isLive: false, streamKind: 'file' };
}

async function search(ctx) {
  const input = normalizeContext(ctx);
  const query = clean(value(input, 'query') || value(input, 'keyword') || value(input, 'text'));
  const page = contextPage(input);
  if (!query) return { pageType: 'search', title: '搜索结果', keyword: '', page: page, hasMore: false, items: [] };
  const root = baseURL(input) + '/search/' + encodeURIComponent(query) + '/';
  const url = page <= 1 ? root : asyncBlockURL(root, 'list_videos_videos_list_search_result', {
    q: query, category_ids: '', sort_by: '', from_videos: page, from_albums: page
  });
  const html = await fetchText(input, url);
  const items = parseList(input, html), more = items.length >= YP_PAGE_SIZE || (items.length > 0 && hasNext(html, page));
  return { pageType: 'search', title: query, keyword: query, style: 'media.posterGrid', itemAspectRatio: '16:9', page: page,
    hasMore: more, nextPage: more ? page + 1 : undefined, items: items };
}

function onSearch(ctx) { return search(ctx); }
function getSearch(ctx) { return search(ctx); }
function play(ctx) { return resolvePlayback(ctx); }
async function getPlayback(ctx) { const result = await resolvePlayback(ctx); return Object.assign({ videoUrl: result.url, protocol: 'mp4', mimeType: 'video/mp4', contentType: 'video/mp4' }, result); }

function parseList(ctx, html) {
  const out = [], seen = {};
  const re = /<a\b([^>]*href=["'][^"']*\/video\/\d+\/[^"']+["'][^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(html || '')) !== null) {
    const url = absolute(ctx, attr(match[1], 'href'));
    if (!url || seen[url]) continue;
    const block = match[2];
    const poster = absolute(ctx, attrFromTag(block, 'img', ['data-webp', 'data-original', 'data-src', 'src']));
    const title = clean(attr(match[1], 'title') || attrFromTag(block, 'img', ['alt']) || first(block, /class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/div>/i));
    if (!title || !poster || /^data:/i.test(poster)) continue;
    seen[url] = true;
    const duration = clean(first(block, /class=["'][^"']*time[^"']*["'][^>]*>([\s\S]*?)<\/div>/i));
    const quality = clean(first(block, /class=["'][^"']*qualtiy[^"']*["'][^>]*>([\s\S]*?)<\/div>/i));
    out.push({ id: url, title: title, subtitle: duration || undefined, remarks: quality || duration || undefined, type: 'movie',
      poster: poster, backdrop: poster, imageHeaders: imageHeaders(url), posterHeaders: imageHeaders(url), aspectRatio: '16:9',
      action: { type: 'detail', itemId: url, id: url, url: url, title: title } });
  }
  return out;
}

function parseDetail(ctx, html, url) {
  const title = clean(meta(html, 'property', 'og:title') || first(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || first(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const poster = absolute(ctx, meta(html, 'property', 'og:image'));
  const overview = clean(meta(html, 'name', 'description') || meta(html, 'property', 'og:description'));
  const tags = clean(first(html, /video_tags\s*:\s*'([^']*)'/i)).split(',').map(clean).filter(Boolean);
  const models = clean(first(html, /video_models\s*:\s*'([^']*)'/i)).split(',').map(clean).filter(Boolean);
  const titleInfo = first(html, /<div\b[^>]*class=["'][^"']*title-holder[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
  const durationText = clean(first(titleInfo, /(\d{1,2}:\d{2}(?::\d{2})?)/i) || first(html, /video_duration\s*:\s*'(\d+)'/i));
  const date = first(titleInfo, /\d{1,2}[\/-]\d{1,2}[\/-](20\d{2})/i) || first(titleInfo, /(20\d{2})[\/-]\d{1,2}[\/-]\d{1,2}/i);
  return { title: title || 'Untitled', poster: poster, overview: overview, year: date ? Number(date) : undefined,
    runtimeMinutes: durationMinutes(durationText), genres: tags.slice(0, 14), cast: models.map(function (name) { return { name: name }; }), qualities: parseQualities(html) };
}

function parseQualities(html) {
  const slots = {}, re = /\b(video_url|video_alt_url(\d*))\s*:\s*'([^']+)'[\s\S]{0,900}?\b\1_text\s*:\s*'([^']+)'/gi;
  let match;
  while ((match = re.exec(html || '')) !== null) {
    const url = decodeMedia(match[3]), label = clean(match[4]), height = parseInt(label, 10) || 0;
    if (!isMedia(url) || !height || /upgrade=true/i.test(url)) continue;
    slots[String(height)] = { id: String(height), title: label || height + 'P', height: height, url: url };
  }
  return Object.keys(slots).map(function (key) { return slots[key]; }).sort(function (a, b) { return b.height - a.height; });
}

function automaticResourceGroup(url, title, qualities) {
  const labels = qualities.map(function (q) { return q.title; }).join(' / ');
  return [{ id: 'automatic', title: '在线播放', versions: [{ id: 'auto', name: '自动', title: '自动',
    subtitle: labels ? '网页提供 ' + labels + '，播放时生成可用临时地址' : '播放时生成临时地址', container: 'mp4', default: true,
    action: { type: 'play', itemId: url, versionId: 'auto', qualityId: 'auto', title: title + ' · 自动' } }] }];
}

function browserMediaCandidates(result, expectedId) {
  const out = [], seen = {}, id = text(expectedId);
  function add(value) {
    value = text(value).replace(/&amp;/gi, '&').replace(/\\\//g, '/');
    const re = /https?:\/\/[^\s"'<>\\]+\.mp4\/?(?:\?[^\s"'<>\\]*)?/gi;
    let match;
    while ((match = re.exec(value)) !== null) {
      const url = match[0], prefix = value.slice(Math.max(0, match.index - 32), match.index);
      const decodedURL = decodeURIComponentSafe(url);
      const belongsToVideo = !id || new RegExp('(?:/|%2[fF])' + escapeRe(id) + '(?:/|%2[fF]|[^0-9])').test(decodedURL);
      if (!belongsToVideo || /function\/\d+\/$/i.test(prefix) || /preview|trailer|promo|advert|\bads?\b|vast/i.test(url) || seen[url]) continue;
      seen[url] = true;
      out.push({ url: url, score: mediaCandidateScore(url, id) });
    }
  }
  function walk(value, depth) {
    if (depth > 5 || value === null || value === undefined) return;
    if (typeof value === 'string') { add(value); return; }
    if (Array.isArray(value)) { value.forEach(function (item) { walk(item, depth + 1); }); return; }
    if (typeof value === 'object') Object.keys(value).forEach(function (key) { walk(value[key], depth + 1); });
  }
  walk(result, 0);
  return out.sort(function (a, b) { return b.score - a.score; }).map(function (item) { return item.url; });
}
function mediaCandidateScore(url, id) {
  const value = decodeURIComponentSafe(url);
  let score = 0;
  if (id && new RegExp('(?:/|%2[fF])' + escapeRe(id) + '(?:/|%2[fF]|[^0-9])').test(value)) score += 100;
  if (/_\d+p_trim\.mp4|_trim\.mp4/i.test(value)) score += 30;
  if (/remote_control\.php|\/get_file\//i.test(value)) score += 20;
  return score;
}
function videoNumericId(url) { return first(text(url), /\/video\/(\d+)\//i); }
function decodeURIComponentSafe(value) { try { return decodeURIComponent(text(value)); } catch (_) { return text(value); } }
function browserBlobOnly(result, expectedId) { const value = typeof result === 'string' ? result : JSON.stringify(result || {}); return /blob:/i.test(value) && browserMediaCandidates(result, expectedId).length === 0; }

async function loadItems(ctx, section, page) { return parseList(ctx, await fetchText(ctx, listURL(ctx, section, page))); }
function listURL(ctx, section, page) {
  const root = baseURL(ctx) + section.path;
  if (page <= 1) return queryURL(root, section.params || {});
  if (section.pagination === 'path') return root.replace(/\/+$/, '') + '/' + page + '/';
  const params = Object.assign({}, section.params || {}, { from: page });
  return asyncBlockURL(root, section.block || 'list_videos_common_videos_list', params);
}
function asyncBlockURL(root, block, params) { return queryURL(root, Object.assign({ mode: 'async', function: 'get_block', block_id: block }, params || {})); }
function queryURL(root, params) { const parts = []; Object.keys(params || {}).forEach(function (key) { if (params[key] !== undefined && params[key] !== '') parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key])); }); return root + (root.indexOf('?') >= 0 ? '&' : '?') + parts.join('&'); }

async function fetchText(ctx, url) { return (await fetchPage(ctx, url)).html; }
async function fetchPage(ctx, url) {
  const headers = requestHeaders(url), response = await httpGet(url, headers), body = unwrap(response);
  if (!body || /Just a moment|cf-mitigated|Cloudflare Ray ID/i.test(body)) throw new Error('页面请求失败或遇到 Cloudflare 验证: ' + url);
  return { html: body, cookie: responseCookies(response) };
}
async function httpGet(url, headers) {
  if (typeof Widget !== 'undefined' && Widget.http) {
    if (typeof Widget.http.get === 'function') return Widget.http.get(url, { headers: headers });
    if (typeof Widget.http.request === 'function') return Widget.http.request({ url: url, method: 'GET', headers: headers });
  }
  if (typeof $http !== 'undefined') {
    if (typeof $http.get === 'function') return $http.get(url, { headers: headers });
    if (typeof $http.request === 'function') return $http.request({ url: url, method: 'GET', headers: headers });
  }
  throw new Error('当前环境没有可用的 HTTP 客户端');
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
  let raw = typeof headers === 'object' ? headers['set-cookie'] || headers['Set-Cookie'] || '' : '';
  if (!raw && typeof response.cookies === 'string') raw = response.cookies;
  const list = Array.isArray(raw) ? raw : text(raw).split(/,(?=\s*[^;,=]+=[^;,]+)/);
  return list.map(function (line) { return text(line).split(';')[0]; }).filter(Boolean).join('; ');
}

function requestHeaders(referer) { return { Referer: referer || YP_BASE + '/enter', 'User-Agent': YP_UA, Accept: 'text/html,application/xhtml+xml', 'X-Requested-With': 'XMLHttpRequest' }; }
function imageHeaders(referer) { return { Referer: referer || YP_BASE + '/enter', 'User-Agent': YP_UA }; }
function playbackHeaders(referer, cookie) { const headers = { Referer: referer, 'User-Agent': YP_UA, Accept: '*/*' }; if (cookie) headers.Cookie = cookie; return headers; }
function baseURL(ctx) { return text(value(ctx, 'baseURL') || YP_BASE).replace(/\/+$/, '') || YP_BASE; }
function categoryAction(section) { return { type: 'category', id: section.id, pageId: section.id, title: section.title, itemAspectRatio: '16:9' }; }
function findSection(id) { id = text(id).replace(/^category-/, ''); return YP_SECTIONS.find(function (section) { return section.id === id; }) || null; }
function withRank(item, index) { const copy = Object.assign({}, item); copy.rank = Number(index) + 1; return copy; }
function detailURL(ctx) { const keys = ['itemId', 'detailURL', 'pageURL', 'id', 'episodeId']; for (let i = 0; i < keys.length; i += 1) { const v = text(value(ctx, keys[i])); if (/^https?:\/\/[^/]+\/video\/\d+\//i.test(v)) return v; if (/^\/video\/\d+\//i.test(v)) return baseURL(ctx) + v; } return ''; }
function qualityFromContext(ctx) { return text(value(ctx, 'qualityId') || value(ctx, 'versionId')).replace(/^quality:/, ''); }
function hasNext(html, page) {
  const n = page + 1;
  return new RegExp('data-parameters=["\'][^"\']*(?:from|from_videos\\+from_albums):' + n + '(?:[;"\'])', 'i').test(html || '') ||
    new RegExp('href=["\'][^"\']*/' + n + '/(?:[?#]?[^"\']*)?["\']', 'i').test(html || '') || /class=["'][^"']*next[^"']*["']/i.test(html || '');
}
function absolute(ctx, url) { url = decode(url); if (!url) return ''; if (/^https?:\/\//i.test(url)) return url; if (url.indexOf('//') === 0) return 'https:' + url; return baseURL(ctx) + (url.charAt(0) === '/' ? url : '/' + url); }
function decodeMedia(url) { return decode(url).replace(/^function\/\d+\//i, ''); }
function isMedia(url) { return /\.mp4\/(?:\?|$)|\.mp4(?:[?#]|$)/i.test(url || ''); }
function attr(source, name) {
  const key = escapeRe(name);
  return decode(first(source, new RegExp('(?:^|\\s)' + key + '="([^"]*)"', 'i')) || first(source, new RegExp("(?:^|\\s)" + key + "='([^']*)'", 'i')));
}
function attrFromTag(html, tag, names) { const match = new RegExp('<' + tag + '\\b([^>]*)>', 'i').exec(html || ''); if (!match) return ''; for (let i = 0; i < names.length; i += 1) { const value = attr(match[1], names[i]); if (value) return value; } return ''; }
function meta(html, key, name) { const a = escapeRe(key), n = escapeRe(name); return decode(first(html, new RegExp('<meta[^>]*' + a + '=["\\\']' + n + '["\\\'][^>]*content=["\\\']([^"\\\']*)', 'i')) || first(html, new RegExp('<meta[^>]*content=["\\\']([^"\\\']*)["\\\'][^>]*' + a + '=["\\\']' + n + '["\\\']', 'i'))); }
function durationMinutes(value) { const parts = text(value).split(':').map(Number); if (parts.some(function (n) { return !Number.isFinite(n); })) return undefined; if (parts.length === 3) return parts[0] * 60 + parts[1] + Math.round(parts[2] / 60); if (parts.length === 2) return parts[0] + Math.round(parts[1] / 60); const seconds = Number(value); return Number.isFinite(seconds) ? Math.round(seconds / 60) : undefined; }
function first(source, re) { const match = re.exec(source || ''); return match ? (match[1] || '') : ''; }
function decode(value) { return text(value).replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#0*39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/\\\//g, '/'); }
function clean(value) { return decode(text(value).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function normalizeContext(ctx) { if (typeof ctx === 'string') { try { return JSON.parse(ctx); } catch (_) { return {}; } } return ctx && typeof ctx === 'object' ? ctx : {}; }
function value(ctx, key) { if (!ctx) return ''; if (ctx[key] !== undefined && ctx[key] !== null) return ctx[key]; const bags = ['params', 'config', 'settings', 'parameters', 'pagination', 'pageInfo']; for (let i = 0; i < bags.length; i += 1) if (ctx[bags[i]] && ctx[bags[i]][key] !== undefined) return ctx[bags[i]][key]; return ''; }
function positiveInt(value, fallback) { const number = parseInt(value, 10); return Number.isFinite(number) && number > 0 ? number : fallback; }
function contextPage(ctx) { return positiveInt(value(ctx, 'page') || value(ctx, 'pg') || value(ctx, 'currentPage') || value(ctx, 'pageNumber') || value(ctx, 'pageIndex') || value(ctx, 'nextPage'), 1); }
function text(value) { return value === undefined || value === null ? '' : String(value).trim(); }
function escapeRe(value) { return text(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

const YP_API = { getManifest: getManifest, getHome: getHome, getHomeSection: getHomeSection, getCategory: getCategory, getDetail: getDetail,
  getResourceVersions: getResourceVersions, resolvePlayback: resolvePlayback, search: search, onSearch: onSearch, getSearch: getSearch, play: play, getPlayback: getPlayback,
  __test: { parseList: parseList, parseDetail: parseDetail, parseQualities: parseQualities, listURL: listURL } };
if (typeof globalThis !== 'undefined') Object.keys(YP_API).forEach(function (key) { globalThis[key] = YP_API[key]; });
if (typeof module !== 'undefined' && module.exports) module.exports = YP_API;
