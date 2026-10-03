// @name HSEX Mini Library
// Dreamby / baiPlay native-data adapter. Signed URLs are refreshed at play time.

const HSEX_BASE = 'https://hsex.icu';
const HSEX_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const WidgetMetadata = {
  id: 'hsex-mini-library', name: '好色TV', title: '好色TV', version: '1.0.1',
  author: 'Alan huang', site: HSEX_BASE,
  logo: HSEX_BASE + '/static/img/logo.png', icon: HSEX_BASE + '/static/img/logo.png',
  description: '原生首页、榜单、时长分类、搜索、详情和 HLS 播放。'
};
const HSEX_SECTIONS = [
  { id: 'latest', title: '最新视频', prefix: 'list-', style: 'discover.spotlight' },
  { id: 'weekly', title: '周榜', prefix: 'top7_list-', style: 'discover.ranked' },
  { id: 'monthly', title: '月榜', prefix: 'top_list-', style: 'discover.ranked' },
  { id: 'five-minutes', title: '五分钟以上', prefix: '5min_list-', style: 'discover.standard' },
  { id: 'long', title: '十分钟以上', prefix: 'long_list-', style: 'discover.standard' }
];
// These host substitutions are explicitly implemented by the site's fastest_cdn.js.
const HSEX_LINES = [
  { id: 'cdn', title: '线路 1', host: 'cdn.hdcdn.store' },
  { id: 'shark', title: '线路 2 · Shark', host: 'shark.hdcdn.store' },
  { id: 'fdc', title: '线路 3 · FDC', host: 'fdc.hdcdn.store' }
];

function getManifest() {
  return Object.assign({}, WidgetMetadata, {
    capabilities: { home: true, category: true, detail: true, search: true,
      resourceVersions: true, playback: true, playbackHistory: true, resourceMatching: false },
    aggregation: { search: true, playbackHistory: true, resourceMatching: false },
    parameters: [{ name: 'baseUrl', title: '站点地址', type: 'input',
      value: HSEX_BASE, defaultValue: HSEX_BASE, required: true }]
  });
}

async function getHome(ctx) {
  const latest = await getHomeSection(Object.assign({}, context(ctx), { sectionId: 'latest' }));
  return { pageType: 'home', id: 'hsex-home', title: WidgetMetadata.title,
    heroAspectRatio: '16:9', hero: latest.items.slice(0, 6),
    sections: [latest].concat(HSEX_SECTIONS.slice(1).map(function (section) {
      return sectionShell(section, [], true);
    })) };
}

async function getHomeSection(ctx) {
  const section = findSection(value(ctx, ['sectionId', 'pageId', 'id'], 'latest'));
  try {
    const result = await getCategory(Object.assign({}, context(ctx), { pageId: section.id, page: 1, pagination: { page: 1 }, pageInfo: { page: 1 } }));
    return sectionShell(section, result.items.slice(0, 18), false);
  } catch (error) {
    const result = sectionShell(section, [], false);
    result.subtitle = '加载失败：' + message(error);
    return result;
  }
}

function sectionShell(section, items, lazy) {
  return { id: section.id, title: section.title, style: section.style,
    itemAspectRatio: '16:9', lazy: lazy, items: items,
    loadAction: { type: 'custom', id: section.id, name: 'loadSection', sectionId: section.id },
    moreAction: { type: 'category', pageId: section.id, title: section.title, itemAspectRatio: '16:9' } };
}

async function getCategory(ctx) {
  const section = findSection(value(ctx, ['pageId', 'categoryId', 'category', 'id'], 'latest'));
  const page = pageNumber(ctx);
  const sort = value(ctx, ['sortBy', 'sort_by', 'selectedSortValue', 'sort'], 'new') === 'hot' ? 'hot' : 'new';
  const url = baseURL(ctx) + '/' + section.prefix + page + '.htm' + (section.id === 'latest' ? '?sort=' + sort : '');
  const response = await pageResponse(url);
  const items = parseCards(ctx, response.text);
  if (!items.length && /class=["'][^"']*thumbnail/.test(response.text)) throw new Error('列表结构已改变，未能读取视频条目');
  if (section.style === 'discover.ranked') items.forEach(function (item, index) { item.rank = (page - 1) * 24 + index + 1; });
  const paging = pagination(response.text, section.prefix, page);
  const result = Object.assign({ pageType: 'category', id: section.id, title: section.title,
    style: 'media.posterGrid', itemAspectRatio: '16:9', items: items, page: page, limit: 24 }, paging);
  // Only the latest list exposes this sort selector in the verified source.
  if (section.id === 'latest') {
    result.sort = [{ id: 'new', value: 'new', title: '最新' }, { id: 'hot', value: 'hot', title: '最热' }];
    result.selectedSortValue = sort;
  }
  return result;
}

async function search(ctx) {
  const query = text(value(ctx, ['query', 'keyword', 'text', 'search'], ''));
  const page = pageNumber(ctx);
  const sort = value(ctx, ['sortBy', 'sort_by', 'selectedSortValue', 'sort'], 'new') === 'hot' ? 'hot' : 'new';
  const result = { pageType: 'search', id: 'hsex-search', title: '搜索', query: query, keyword: query,
    page: page, hasMore: false, items: [], itemAspectRatio: '16:9', limit: 20,
    selectedSortValue: sort, sort: [{ id: 'new', value: 'new', title: '最新' }, { id: 'hot', value: 'hot', title: '最热' }] };
  if (!query) return result;
  const url = baseURL(ctx) + '/search-' + page + '.htm?search=' + encodeURIComponent(query) + '&sort=' + sort;
  const response = await pageResponse(url);
  result.items = parseCards(ctx, response.text);
  return Object.assign(result, pagination(response.text, 'search-', page));
}

async function getDetail(ctx) {
  const id = itemId(ctx);
  const response = await loadDetail(ctx, id);
  const html = response.text;
  const video = first(html, /(<video\b[\s\S]*?<\/video>)/i);
  const poster = absolute(baseURL(ctx) + '/', attribute(first(video, /(<video\b(?:"[^"]*"|'[^']*'|[^'">])*?>)/i), 'poster') || meta(html, 'og:image'));
  const duration = seconds(meta(html, 'video:duration') || first(html, /时长[：:]\s*([\d:]+)/));
  const author = meta(html, 'og:video:actor');
  const recommendations = parseCards(ctx, html).filter(function (item) { return item.id !== id; });
  const result = { pageType: 'detail', id: id, title: meta(html, 'og:title') || clean(first(html, /<h3\b[^>]*class=["']panel-title["'][^>]*>([\s\S]*?)<\/h3>/i)) || ('视频 ' + id),
    type: 'movie', poster: poster, backdrop: poster, detailImageAspectRatio: '16:9',
    overview: meta(html, 'og:description') || meta(html, 'description'),
    runtimeMinutes: duration ? duration / 60 : undefined, genres: [], seasons: [],
    cast: author ? [{ name: author, role: '上传者' }] : [],
    recommendations: recommendations.length ? [{ id: 'related', title: '相关推荐', style: 'discover.standard', items: recommendations }] : [] };
  try {
    parseSource(response.text, response.url);
    result.resourceGroups = resourceGroups(id);
  } catch (error) {
    // A missing source is an explicit failure, never a cacheable fallback version.
    result.overview += '\n资源暂未加载：' + message(error) + '；可重新打开资源版本';
  }
  return result;
}

async function getResourceVersions(ctx) {
  const id = itemId(ctx);
  const response = await loadDetail(ctx, id);
  parseSource(response.text, response.url);
  return { itemId: id, groups: resourceGroups(id) };
}

function resourceGroups(id) {
  return HSEX_LINES.map(function (line, lineIndex) {
    const versionId = ['hsex', id, line.id, 'source'].join('|');
    return { id: line.id, title: line.title, versions: [{ id: versionId, name: '原始画质',
        subtitle: line.title + ' · 播放时刷新地址', container: 'm3u8',
        default: lineIndex === 0,
        action: { type: 'play', itemId: id, versionId: versionId, lineId: line.id, qualityId: 'source' } }] };
  });
}

async function resolvePlayback(ctx) {
  const id = itemId(ctx);
  const version = decodeVersion(value(ctx, ['versionId'], ''));
  const requestedLine = text(value(ctx, ['lineId'], version.lineId || 'cdn'));
  const line = HSEX_LINES.find(function (item) { return item.id === requestedLine; }) || HSEX_LINES[0];
  let detail;
  try { detail = await loadDetail(ctx, id); }
  catch (error) {
    throw new Error('播放详情获取失败（视频 ' + (id || '未知') + '）：' + message(error));
  }
  let source;
  try { source = parseSource(detail.text, detail.url); }
  catch (error) { throw new Error('播放地址解析失败（视频 ' + id + '）：' + message(error)); }
  // <source> is already the final HLS URL, not a redirecting player/API gateway.
  // All five inspected videos expose media playlists. Do not make the script HTTP
  // bridge fetch the CDN before native playback; let the player request the stream.
  return { url: changeHost(source, line.host), container: 'm3u8', headers: {}, isLive: false, streamKind: 'vod',
    startPositionSeconds: Math.max(0, Number(value(ctx, ['startPositionSeconds'], 0)) || 0) };
}

async function loadDetail(ctx, id) {
  if (!id) throw new Error('缺少有效的视频编号');
  // Refresh the public page; never cache its signed <source> URL.
  return await pageResponse(baseURL(ctx) + '/video-' + id + '.htm?_=' + Date.now(), true);
}

function parseSource(html, url) {
  const video = first(html, /(<video\b[\s\S]*?<\/video>)/i);
  const tags = video.match(/<source\b(?:"[^"]*"|'[^']*'|[^'">])*?>/gi) || [];
  for (let i = 0; i < tags.length; i += 1) {
    const src = attribute(tags[i], 'src');
    if (src && (/m3u8(?:[?#]|$)/i.test(src) || /mpegurl/i.test(attribute(tags[i], 'type')))) return absolute(url, src);
  }
  throw new Error('详情页没有返回 HLS 播放地址，可能是源站限制或视频已移除');
}

function parseCards(ctx, html) {
  const parts = String(html).split(/<div\b[^>]*class=["'][^"']*\bthumbnail\b[^"']*["'][^>]*>/i);
  const seen = {}, items = [];
  for (let i = 1; i < parts.length; i += 1) {
    // Bound to this card, excluding subsequent navigation and unrelated anchors.
    const block = parts[i].split(/<\/p>/i)[0];
    const id = first(block, /href=["'](?:[^"']*\/)?video-(\d+)\.htm(?:[^"']*)["']/i);
    if (!id || seen[id]) continue;
    const caption = first(block, /<h5\b[^>]*>([\s\S]*?)<\/h5>/i);
    const imageTag = first(block, /(<div\b(?:"[^"]*"|'[^']*'|[^'">])*?class=["'][^"']*\bimage\b[^"']*["'](?:"[^"]*"|'[^']*'|[^'">])*?>)/i);
    const poster = absolute(baseURL(ctx) + '/', first(attribute(imageTag, 'style'), /background-image\s*:\s*url\(\s*["']?([^"')\s]+)/i));
    const title = clean(caption) || attribute(imageTag, 'title');
    if (!title || !poster) continue;
    const duration = clean(first(block, /<var\b[^>]*class=["']duration["'][^>]*>([\s\S]*?)<\/var>/i));
    const info = clean(first(block, /<div\b[^>]*class=["']info["'][^>]*>([\s\S]*?)<\/div>/i));
    seen[id] = true;
    items.push({ id: id, title: title, type: 'movie', poster: poster, backdrop: poster,
      aspectRatio: '16:9', subtitle: duration, metadataText: info,
      runtimeMinutes: duration ? seconds(duration) / 60 : undefined,
      action: { type: 'detail', itemId: id } });
  }
  return items;
}

function pagination(html, prefix, page) {
  // Navigation links alone are excluded; inspect only the real pager containers.
  const pagers = String(html).match(/<ul\b[^>]*class=["'][^"']*pagination[^"']*["'][^>]*>[\s\S]*?<\/ul>/gi) || [];
  let total = page;
  const pattern = new RegExp('(?:^|/)' + escapeRE(prefix) + '(\\d+)\\.htm(?:[?#]|$)');
  pagers.forEach(function (block) {
    const anchors = block.match(/<a\b(?:"[^"]*"|'[^']*'|[^'">])*?>/gi) || [];
    anchors.forEach(function (tag) { const match = attribute(tag, 'href').match(pattern); if (match) total = Math.max(total, Number(match[1])); });
  });
  return { hasMore: total > page, nextPage: total > page ? page + 1 : undefined, totalPages: total, pagecount: total };
}

async function pageResponse(url, fresh) {
  const headers = { 'User-Agent': HSEX_UA, Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' };
  if (fresh) { headers['Cache-Control'] = 'no-cache'; headers.Pragma = 'no-cache'; }
  const response = await readResponse(url, headers, 8);
  if (/你搜索的太快|搜索过于频繁/.test(response.text)) throw new Error('源站搜索限频，请稍后再试');
  if (/Just a moment|cf-mitigated|Cloudflare Ray ID|Access denied.*Cloudflare/i.test(response.text)) throw new Error('源站返回 Cloudflare 验证或访问限制，请稍后重试');
  if (!response.text.trim()) throw new Error('源站返回空页面');
  return response;
}

async function readResponse(url, headers, timeout, redirected) {
  const response = await request(url, headers, timeout);
  const status = Number(response && (response.statusCode || response.status || (response.response && response.response.status))) || 0;
  const location = response && response.headers && (response.headers.Location || response.headers.location || (typeof response.headers.get === 'function' && response.headers.get('location')));
  if (status >= 300 && status < 400 && location && !redirected) return await readResponse(absolute(url, location), headers, timeout, true);
  if (status === 429) throw new Error('源站请求限频（HTTP 429），请稍后重试');
  if (status && (status < 200 || status >= 400)) throw new Error('HTTP ' + status + '：' + url.replace(/\?.*$/, ''));
  const effective = response && (response.finalURL || response.urlEffective || response.responseURL || response.url || (response.response && response.response.url));
  return { text: await responseText(response), url: effective || url };
}

async function request(url, headers, timeout) {
  const options = { headers: headers, timeout: timeout };
  let pending;
  if (typeof $http !== 'undefined' && typeof $http.get === 'function') pending = $http.get(url, options);
  else if (typeof $http !== 'undefined' && typeof $http.request === 'function') pending = $http.request(Object.assign({ url: url, method: 'GET' }, options));
  else if (typeof Widget !== 'undefined' && Widget.http && typeof Widget.http.get === 'function') pending = Widget.http.get(url, options);
  else if (typeof Widget !== 'undefined' && Widget.http && typeof Widget.http.request === 'function') pending = Widget.http.request(Object.assign({ url: url, method: 'GET' }, options));
  else if (typeof fetch === 'function') pending = fetch(url, { method: 'GET', headers: headers, redirect: 'follow',
    signal: typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(timeout * 1000) : undefined }).then(async function (response) {
    return { status: response.status, finalURL: response.url, headers: response.headers, body: await response.text() };
  });
  else throw new Error('当前环境没有可用的 HTTP 客户端');
  // Use the host's request timeout. JSCore timer shims are not required here.
  return await pending;
}

async function responseText(response) {
  if (typeof response === 'string') return response;
  if (!response) return '';
  if (typeof response.text === 'function') return await response.text();
  const candidates = [response.data, response.body, response.text, response.html,
    response.data && response.data.html, response.data && response.data.body,
    response.data && response.data.text];
  for (let i = 0; i < candidates.length; i += 1) if (typeof candidates[i] === 'string') return candidates[i];
  return '';
}

function context(ctx) {
  if (typeof ctx === 'string') { try { const parsed = JSON.parse(ctx); return parsed && typeof parsed === 'object' ? parsed : {}; } catch (_) { return {}; } }
  return ctx && typeof ctx === 'object' ? ctx : {};
}
function value(ctx, names, fallback) {
  const c = context(ctx), boxes = [c, c.params, c.config, c.settings, c.parameters, c.pagination, c.pageInfo, c.action, c.payload];
  for (let i = 0; i < boxes.length; i += 1) for (let j = 0; boxes[i] && j < names.length; j += 1) {
    const result = boxes[i][names[j]];
    if (result !== undefined && result !== null && result !== '') return result;
  }
  return fallback;
}
function pageNumber(ctx) {
  const c = context(ctx);
  const n = value(Object.assign({}, c.pagination, c.pageInfo, c), ['page', 'pg', 'currentPage', 'pageNumber', 'pageIndex'], 1);
  return Math.max(1, Math.floor(Number(n)) || 1);
}
function baseURL(ctx) {
  const url = text(value(ctx, ['baseUrl', 'baseURL'], HSEX_BASE)).replace(/\/+$/, '');
  return /^https?:\/\/[^\s/?#]+$/i.test(url) ? url : HSEX_BASE;
}
function findSection(id) { return HSEX_SECTIONS.find(function (section) { return section.id === id; }) || HSEX_SECTIONS[0]; }
function decodeVersion(id) {
  const parts = text(id).split('|');
  return parts.length === 4 && parts[0] === 'hsex' && /^\d+$/.test(parts[1]) ? { itemId: parts[1], lineId: parts[2], qualityId: parts[3] } : {};
}
function itemId(ctx) {
  const candidate = text(value(ctx, ['itemId', 'id', 'url', 'path', 'playUrl', 'videoUrl'], ''));
  return /^\d+$/.test(candidate) ? candidate : first(candidate, /video-(\d+)\.htm/i) || decodeVersion(value(ctx, ['versionId'], '')).itemId || '';
}
function changeHost(url, host) {
  // Never rewrite an unrelated external source host.
  if (!/^https:\/\/(?:cdn|shark|fdc|shark-v6)\.hdcdn\.store\//i.test(url)) return url;
  return url.replace(/^https:\/\/[^/]+/, 'https://' + host);
}
function absolute(base, path) {
  const p = decodeHTML(text(path));
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  if (/^\/\//.test(p)) return 'https:' + p;
  if (typeof URL !== 'undefined') return new URL(p, base).href;
  const origin = first(base, /^(https?:\/\/[^/]+)/i);
  if (p.charAt(0) === '/') return origin + p;
  const cleanBase = base.replace(/[?#].*$/, '');
  if (p.charAt(0) === '?') return cleanBase + p;
  const full = cleanBase.replace(/[^/]*$/, '') + p;
  const rest = full.slice(origin.length).split('/'), parts = [];
  rest.forEach(function (part) { if (part === '..') parts.pop(); else if (part !== '.') parts.push(part); });
  return origin + parts.join('/');
}
function attribute(tag, name) {
  return decodeHTML(first(tag, new RegExp('(?:^|\\s)' + escapeRE(name) + '\\s*=\\s*(?:"([^"]*)"|\x27([^\x27]*)\x27|([^\\s>]+))', 'i')));
}
function meta(html, name) {
  const tags = String(html).match(/<meta\b(?:"[^"]*"|'[^']*'|[^'">])*?>/gi) || [];
  for (let i = 0; i < tags.length; i += 1) if (attribute(tags[i], 'property') === name || attribute(tags[i], 'name') === name) return attribute(tags[i], 'content');
  return '';
}
function first(input, regex) { const match = String(input || '').match(regex); if (!match) return ''; for (let i = 1; i < match.length; i += 1) if (match[i] !== undefined) return match[i]; return ''; }
function escapeRE(input) { return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function text(input) { return input == null ? '' : String(input).trim(); }
function clean(input) { return decodeHTML(String(input || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function seconds(input) { return text(input).split(':').reduce(function (total, part) { return total * 60 + (Number(part) || 0); }, 0); }
function decodeHTML(input) {
  return String(input || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(x[0-9a-f]+|\d+);/gi, function (_, code) { const n = code.charAt(0).toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code); return n >= 0 && n <= 65535 ? String.fromCharCode(n) : ''; });
}
function message(error) { return error && error.message ? error.message : String(error); }
async function onAction(ctx) { return await getHomeSection(ctx); }
async function getPlayback(ctx) {
  const result = await resolvePlayback(ctx);
  return Object.assign({}, result, { videoUrl: result.url, protocol: 'hls', mimeType: 'application/vnd.apple.mpegurl', contentType: 'application/vnd.apple.mpegurl' });
}
const HSEX_API = { getManifest: getManifest, getHome: getHome, getHomeSection: getHomeSection,
  getCategory: getCategory, getDetail: getDetail, getResourceVersions: getResourceVersions,
  resolvePlayback: resolvePlayback, search: search, onAction: onAction, getPlayback: getPlayback };
if (typeof globalThis !== 'undefined') Object.assign(globalThis, HSEX_API);
if (typeof module !== 'undefined' && module.exports) module.exports = HSEX_API;
