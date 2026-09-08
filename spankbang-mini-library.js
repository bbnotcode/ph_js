// @name SpankBang Dreamby Mini Library

'use strict';

const SB_BASE_URL = 'https://spankbang.com';
const SB_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const SB_LOGO = 'https://spankbang.com/favicon.ico';
const SB_QUALITIES = ['4k', '1080p', '720p', '480p', '320p', '240p'];
const SB_SECTIONS = [
  { id: 'new', title: '最新', path: '/new_videos/', style: 'discover.spotlight' },
  { id: 'trending', title: '趋势', path: '/trending_videos/', style: 'discover.ranked' },
  { id: 'japanese', title: '日本', path: '/s/japanese/', style: 'discover.posterCompact' },
  { id: 'asian', title: '亚洲', path: '/s/asian/', style: 'discover.posterCompact' },
  { id: 'amateur', title: '素人', path: '/s/amateur/', style: 'discover.posterCompact' },
  { id: 'hentai', title: '动漫', path: '/s/hentai/', style: 'discover.posterCompact' }
];

const WidgetMetadata = {
  id: 'spankbang-dreamby',
  name: 'SpankBang',
  title: 'SpankBang',
  version: '1.0.0',
  author: 'Alan huang',
  logo: SB_LOGO,
  icon: SB_LOGO,
  site: SB_BASE_URL,
  description: 'SpankBang Dreamby 自定义媒体库，支持首页、分类、搜索、详情、多画质和播放时刷新签名。'
};

function getManifest() {
  return {
    id: WidgetMetadata.id,
    name: WidgetMetadata.name,
    title: WidgetMetadata.title,
    version: WidgetMetadata.version,
    author: WidgetMetadata.author,
    logo: WidgetMetadata.logo,
    icon: WidgetMetadata.icon,
    site: WidgetMetadata.site,
    description: WidgetMetadata.description,
    capabilities: {
      home: true,
      category: true,
      detail: true,
      search: true,
      resourceVersions: true,
      playback: true,
      aggregation: true,
      playbackHistory: true,
      resourceMatching: false
    },
    aggregation: { search: true, playbackHistory: true, resourceMatching: false },
    parameters: [
      { name: 'baseUrl', title: '站点地址', type: 'input', defaultValue: SB_BASE_URL, value: SB_BASE_URL, required: true },
      { name: 'visibleVerification', title: '遇到 Cloudflare 时显示验证页', type: 'boolean', defaultValue: true, value: true }
    ]
  };
}

async function getHome(ctx) {
  const first = SB_SECTIONS[0];
  let latest = [];
  try {
    latest = parseCards(await fetchText(ctx, pageURL(ctx, first.path, 1)), ctx).slice(0, 18);
  } catch (_) {
    latest = [];
  }
  return {
    pageType: 'home',
    id: 'spankbang-home',
    title: WidgetMetadata.title,
    heroAspectRatio: '16:9',
    hero: latest.slice(0, 8).map(toHero),
    sections: [
      { id: first.id, title: first.title, style: first.style, lazy: false, items: latest, moreAction: categoryAction(first) }
    ].concat(SB_SECTIONS.slice(1).map(function (section) {
      return { id: section.id, title: section.title, style: section.style, lazy: true, items: [], moreAction: categoryAction(section) };
    }))
  };
}

async function getHomeSection(ctx) {
  const input = normalizeContext(ctx);
  const section = findSection(input.sectionId || input.id || input.pageId) || SB_SECTIONS[0];
  try {
    const items = parseCards(await fetchText(input, pageURL(input, section.path, 1)), input).slice(0, 18);
    if (section.style === 'discover.ranked') items.forEach(function (item, index) { item.rank = index + 1; });
    return { id: section.id, title: section.title, style: section.style, lazy: false, items: items, moreAction: categoryAction(section) };
  } catch (error) {
    return { id: section.id, title: section.title, style: section.style, lazy: false, items: [], subtitle: errorMessage(error) };
  }
}

async function getCategory(ctx) {
  const input = normalizeContext(ctx);
  const page = positiveInt(contextValue(input, 'page') || contextValue(input, 'pg') || contextValue(input, 'pageNumber'), 1);
  const rawId = contextValue(input, 'pageId') || contextValue(input, 'id') || 'new';
  const section = findSection(rawId);
  const customPath = contextValue(input, 'path') || contextValue(input, 'url');
  const path = customPath || (section && section.path) || decodePageId(rawId) || SB_SECTIONS[0].path;
  const url = pageURL(input, path, page);
  const html = await fetchText(input, url);
  return {
    pageType: 'category',
    id: String(rawId),
    title: (section && section.title) || cleanText(pageTitle(html)) || '视频',
    style: 'media.posterGrid',
    itemAspectRatio: '16:9',
    items: parseCards(html, input),
    page: page,
    nextPage: hasNextPage(html, page) ? page + 1 : undefined,
    hasMore: hasNextPage(html, page)
  };
}

async function search(ctx) {
  const input = normalizeContext(ctx);
  const query = String(contextValue(input, 'query') || contextValue(input, 'keyword') || contextValue(input, 'text') || '').trim();
  const page = positiveInt(contextValue(input, 'page') || contextValue(input, 'pg'), 1);
  if (!query) return { pageType: 'search', title: '搜索', keyword: '', page: page, hasMore: false, items: [] };
  const path = '/s/' + encodeURIComponent(query).replace(/%20/g, '+') + '/';
  const html = await fetchText(input, pageURL(input, path, page));
  return {
    pageType: 'search',
    id: 'search-' + query,
    title: '搜索：' + query,
    keyword: query,
    page: page,
    nextPage: hasNextPage(html, page) ? page + 1 : undefined,
    hasMore: hasNextPage(html, page),
    items: parseCards(html, input)
  };
}

async function getDetail(ctx) {
  const input = normalizeContext(ctx);
  const url = detailURL(input);
  if (!url) throw new Error('SpankBang 详情参数无效');
  const html = await fetchText(input, url);
  const streams = parseStreamData(html);
  const title = cleanText(firstNonEmpty(
    firstMatch(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i),
    metaContent(html, 'property', 'og:title'),
    pageTitle(html),
    titleFromURL(url)
  )).replace(/\s*:\s*Porn\s*-\s*SpankBang\s*$/i, '');
  const poster = absoluteURL(input, firstNonEmpty(streams.cover_image, streams.thumbnail, metaContent(html, 'property', 'og:image'), pickImage(html)));
  const description = cleanText(firstNonEmpty(metaContent(html, 'name', 'description'), metaContent(html, 'property', 'og:description')));
  const genres = parseTagLinks(html);
  const duration = positiveInt(streams.length, durationFromHTML(html));
  const detail = {
    id: url,
    itemId: url,
    title: title,
    type: 'movie',
    poster: poster,
    backdrop: poster,
    detailImageAspectRatio: '16:9',
    overview: description,
    runtimeMinutes: duration ? Math.max(1, Math.round(duration / 60)) : undefined,
    genres: genres,
    seasons: [],
    recommendations: parseRecommendations(html, input, url),
    resourceGroups: buildResourceGroups(url, streams)
  };
  attachImageHeaders(detail, url);
  return detail;
}

async function getResourceVersions(ctx) {
  const input = normalizeContext(ctx);
  const url = detailURL(input);
  if (!url) throw new Error('SpankBang 资源参数无效');
  const streams = parseStreamData(await fetchText(input, addCacheBust(url)));
  const groups = buildResourceGroups(url, streams);
  if (!groups.length) throw new Error('SpankBang 资源版本：详情页未返回可播画质');
  return { itemId: url, groups: groups };
}

async function resolvePlayback(ctx) {
  const input = normalizeContext(ctx);
  const url = detailURL(input);
  if (!url) throw new Error('SpankBang 播放参数无效');
  const requested = normalizeQuality(contextValue(input, 'versionId') || contextValue(input, 'qualityId') || contextValue(input, 'quality'));
  const html = await fetchText(input, addCacheBust(url));
  const streams = parseStreamData(html);
  const available = availableQualities(streams);
  if (!available.length) throw new Error('SpankBang 播放解析：stage=detail-stream-data；页面未返回有效 MP4/HLS 地址');
  const selected = available.indexOf(requested) >= 0 ? requested : available[0];
  const hls = firstArrayValue(streams['m3u8_' + selected]);
  const mp4 = firstArrayValue(streams[selected]);
  const master = firstArrayValue(streams.m3u8);
  const playURL = hls || mp4 || master || firstArrayValue(streams.main);
  if (!isPlayableURL(playURL)) throw new Error('SpankBang 播放解析：stage=quality-select；quality=' + selected);
  const container = /\.m3u8(?:\?|$)/i.test(playURL) ? 'm3u8' : 'mp4';
  return {
    url: playURL,
    container: container,
    headers: playbackHeaders(url),
    startPositionSeconds: 0,
    isLive: false,
    streamKind: container === 'm3u8' ? 'hls' : 'file'
  };
}

function parseCards(html, ctx) {
  const source = String(html || '');
  const heading = source.search(/<h1\b/i);
  const scoped = heading >= 0 ? source.slice(heading) : source;
  const marker = /<div\b[^>]*data-testid=["']video-item["'][^>]*data-id=["'](\d+)["'][^>]*>/gi;
  const hits = [];
  let match;
  while ((match = marker.exec(scoped))) hits.push({ id: match[1], start: match.index });
  const items = [];
  const seen = {};
  hits.forEach(function (hit, index) {
    const block = scoped.slice(hit.start, index + 1 < hits.length ? hits[index + 1].start : Math.min(scoped.length, hit.start + 12000));
    const href = firstMatch(block, /<a\b[^>]*href=["']([^"']+\/video\/[^"']+)["']/i);
    if (!href) return;
    const detail = absoluteURL(ctx, decodeHTML(href));
    if (!detail || seen[detail]) return;
    const title = cleanText(firstNonEmpty(
      firstMatch(block, /<img\b[^>]*\balt=["']([^"']+)["']/i),
      firstMatch(block, /<p\b[^>]*>[\s\S]*?<a\b[^>]*href=["'][^"']+\/video\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/i),
      titleFromURL(detail)
    ));
    const image = absoluteURL(ctx, decodeHTML(firstNonEmpty(
      firstMatch(block, /<img\b[^>]*\bsrc=["']([^"']+)["']/i),
      firstMatch(block, /<img\b[^>]*\bdata-src=["']([^"']+)["']/i)
    )));
    const quality = cleanText(firstMatch(block, /data-testid=["']video-item-resolution["'][^>]*>([\s\S]*?)<\/div>/i));
    const length = cleanText(firstMatch(block, /data-testid=["']video-item-length["'][^>]*>([\s\S]*?)<\/div>/i));
    const views = cleanText(firstMatch(block, /data-testid=["']views["'][^>]*>([\s\S]*?)<\/span>\s*<\/span>/i));
    const item = {
      id: detail,
      title: title,
      type: 'movie',
      poster: image,
      backdrop: image,
      aspectRatio: '16:9',
      imageFit: 'fill',
      subtitle: [quality, length, views].filter(Boolean).join(' · '),
      metadataText: length,
      badges: quality ? [quality] : [],
      action: { type: 'detail', itemId: detail }
    };
    attachImageHeaders(item, detail);
    seen[detail] = true;
    items.push(item);
  });
  return items;
}

function parseStreamData(html) {
  const source = String(html || '');
  const match = source.match(/\bvar\s+stream_data\s*=\s*\{([\s\S]*?)\}\s*;/i);
  if (!match) return {};
  const body = match[1];
  const result = {};
  const pair = /["']([^"']+)["']\s*:\s*(\[[\s\S]*?\]|["'][\s\S]*?["']|\d+)/g;
  let found;
  while ((found = pair.exec(body))) {
    const key = found[1];
    const raw = found[2];
    if (raw[0] === '[') {
      result[key] = [];
      raw.replace(/["'](https?:\/\/[^"']+)["']/g, function (_, value) {
        result[key].push(decodeEscapes(value));
        return _;
      });
    } else if (/^\d+$/.test(raw)) {
      result[key] = Number(raw);
    } else {
      result[key] = decodeEscapes(raw.slice(1, -1));
    }
  }
  return result;
}

function buildResourceGroups(itemId, streams) {
  const qualities = availableQualities(streams);
  if (!qualities.length) return [];
  return [{
    id: 'spankbang-quality',
    title: '画质',
    versions: qualities.map(function (quality, index) {
      const hls = firstArrayValue(streams['m3u8_' + quality]);
      const mp4 = firstArrayValue(streams[quality]);
      return {
        id: quality,
        name: qualityLabel(quality),
        title: qualityLabel(quality),
        subtitle: (hls ? 'HLS' : 'MP4') + ' · 播放时刷新签名',
        container: hls ? 'm3u8' : 'mp4',
        default: index === 0,
        action: { type: 'play', itemId: itemId, versionId: quality }
      };
    })
  }];
}

function availableQualities(streams) {
  return SB_QUALITIES.filter(function (quality) {
    return isPlayableURL(firstArrayValue(streams['m3u8_' + quality])) || isPlayableURL(firstArrayValue(streams[quality]));
  });
}

function parseRecommendations(html, ctx, currentURL) {
  const items = parseCards(html, ctx).filter(function (item) { return item.id !== currentURL; }).slice(0, 18);
  return items.length ? [{ id: 'related', title: '相关推荐', style: 'discover.standard', items: items }] : [];
}

function parseTagLinks(html) {
  const result = [];
  const seen = {};
  String(html || '').replace(/<a\b[^>]*href=["'][^"']*\/s\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/gi, function (_, label) {
    const value = cleanText(label);
    if (value && value.length < 40 && !seen[value]) { seen[value] = true; result.push(value); }
    return _;
  });
  return result.slice(0, 20);
}

async function fetchText(ctx, url) {
  let text = '';
  let httpError = null;
  try {
    text = responseText(await httpGet(url, {
      headers: requestHeaders(url), timeout: 25,
      useBrowserCookie: true, attachBrowserCookie: true,
      useBrowserFallback: false, browserFallback: false
    }));
  } catch (error) { httpError = error; }
  if (isUsableHTML(text)) return text;
  const hidden = await browserHTML(url, false);
  if (isUsableHTML(hidden)) return hidden;
  if (boolValue(contextValue(normalizeContext(ctx), 'visibleVerification'), true)) {
    const visible = await browserHTML(url, true);
    if (isUsableHTML(visible)) return visible;
  }
  throw new Error('SpankBang 页面读取失败：Cloudflare 验证未完成或 Dreamby 未提供站点浏览器。' + (httpError ? ' HTTP=' + errorMessage(httpError) : ''));
}

function httpGet(url, options) {
  if (typeof Widget !== 'undefined' && Widget.http) {
    if (typeof Widget.http.get === 'function') return Widget.http.get(url, options || {});
    if (typeof Widget.http.request === 'function') return Widget.http.request(Object.assign({ url: url, method: 'GET' }, options || {}));
  }
  if (typeof $http !== 'undefined') {
    if (typeof $http.get === 'function') return $http.get(url, options || {});
    if (typeof $http.request === 'function') return $http.request(Object.assign({ url: url, method: 'GET' }, options || {}));
  }
  throw new Error('当前运行环境没有可用 HTTP 客户端');
}

async function browserHTML(url, visible) {
  if (typeof Widget === 'undefined' || !Widget.browser || typeof Widget.browser.fetch !== 'function') return '';
  try {
    const timeout = visible ? 20 : 12;
    const result = await Widget.browser.fetch(url, {
      visible: !!visible,
      timeout: timeout,
      timeoutSeconds: timeout,
      waitAfterLoad: visible ? 2 : 2.5,
      headers: requestHeaders(url)
    });
    return responseText(result && result.html ? { data: result.html } : result);
  } catch (_) { return ''; }
}

function responseText(response) {
  if (typeof response === 'string') return response;
  if (!response) return '';
  if (typeof response.data === 'string') return response.data;
  if (response.data && typeof response.data.html === 'string') return response.data.html;
  if (typeof response.body === 'string') return response.body;
  if (typeof response.text === 'string') return response.text;
  if (typeof response.responseBody === 'string') return response.responseBody;
  if (typeof response.html === 'string') return response.html;
  return '';
}

function isUsableHTML(html) {
  const text = String(html || '');
  const challenged = /Just a moment|cf-mitigated|challenge-platform|cf-chl-|security verification|安全验证|请验证您是真人/i.test(text);
  const hasPageData = /data-testid=["']video-item["']|\bvar\s+stream_data\s*=|<h1\b|<title\b/i.test(text);
  return !challenged && (text.length > 1000 || hasPageData);
}

function hasNextPage(html, page) {
  const next = page + 1;
  return new RegExp("href=[\"'][^\"']*/" + next + "/?(?:[?\"'])", 'i').test(String(html || ''));
}

function pageURL(ctx, path, page) {
  let url = /^https?:\/\//i.test(String(path || '')) ? String(path) : baseURL(ctx) + '/' + String(path || '').replace(/^\/+/, '');
  url = url.replace(/\/+$/, '') + '/';
  if (page > 1) url += page + '/';
  return url;
}

function detailURL(ctx) {
  const candidates = [contextValue(ctx, 'itemId'), contextValue(ctx, 'url'), contextValue(ctx, 'id'), contextValue(ctx, 'path'), contextValue(ctx, 'playUrl')];
  for (let index = 0; index < candidates.length; index += 1) {
    const value = String(candidates[index] || '');
    if (/\/video\//i.test(value)) return absoluteURL(ctx, value.split('#')[0]);
  }
  return '';
}

function findSection(id) {
  const value = String(id || '');
  return SB_SECTIONS.filter(function (section) { return section.id === value || section.path === value; })[0];
}

function categoryAction(section) {
  return { type: 'category', pageId: section.id, title: section.title, path: section.path, itemAspectRatio: '16:9' };
}

function toHero(item) {
  const copy = Object.assign({}, item);
  copy.aspectRatio = '16:9';
  return copy;
}

function normalizeContext(ctx) {
  if (typeof ctx === 'string') {
    try { return JSON.parse(ctx); } catch (_) { return {}; }
  }
  return ctx && typeof ctx === 'object' ? ctx : {};
}

function contextValue(ctx, key) {
  const input = normalizeContext(ctx);
  const containers = [input, input.params, input.config, input.settings, input.parameters, input.pagination, input.pageInfo, input.payload, input.action];
  for (let index = 0; index < containers.length; index += 1) {
    const container = containers[index];
    if (container && container[key] !== undefined && container[key] !== null && container[key] !== '') return container[key];
  }
  return undefined;
}

function baseURL(ctx) {
  return String(contextValue(ctx, 'baseUrl') || contextValue(ctx, 'baseURL') || SB_BASE_URL).replace(/\/+$/, '');
}

function requestHeaders(referer) {
  return { 'User-Agent': SB_UA, Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8', Referer: referer || SB_BASE_URL + '/' };
}

function playbackHeaders(referer) {
  return { 'User-Agent': SB_UA, Referer: referer || SB_BASE_URL + '/' };
}

function attachImageHeaders(item, referer) {
  const headers = playbackHeaders(referer);
  item.imageHeaders = headers;
  item.posterHeaders = headers;
  item.backdropHeaders = headers;
  return item;
}

function absoluteURL(ctx, value) {
  const input = decodeHTML(String(value || '').trim());
  if (!input) return '';
  if (/^https?:\/\//i.test(input)) return input;
  if (/^\/\//.test(input)) return 'https:' + input;
  return baseURL(ctx) + '/' + input.replace(/^\/+/, '');
}

function metaContent(html, attribute, key) {
  const escaped = escapeRegExp(key);
  return decodeHTML(firstNonEmpty(
    firstMatch(html, new RegExp("<meta\\b[^>]*" + attribute + "=[\"']" + escaped + "[\"'][^>]*content=[\"']([^\"']*)[\"']", 'i')),
    firstMatch(html, new RegExp("<meta\\b[^>]*content=[\"']([^\"']*)[\"'][^>]*" + attribute + "=[\"']" + escaped + "[\"']", 'i'))
  ));
}

function pickImage(html) {
  return decodeHTML(firstMatch(html, /<video\b[^>]*poster=["']([^"']+)["']/i) || firstMatch(html, /<img\b[^>]*src=["']([^"']+)["']/i));
}

function pageTitle(html) {
  return cleanText(firstMatch(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i)).replace(/\s*-\s*SpankBang\s*$/i, '');
}

function durationFromHTML(html) {
  const text = cleanText(html);
  const match = text.match(/\b(\d{1,3})\s*(?:min|minutes|m)\b/i);
  return match ? Number(match[1]) * 60 : 0;
}

function titleFromURL(url) {
  try {
    const path = decodeURIComponent(String(url).split('?')[0]);
    const value = path.split('/').filter(Boolean).pop() || '';
    return value.replace(/\+/g, ' ').replace(/[-_]+/g, ' ');
  } catch (_) { return String(url || ''); }
}

function decodePageId(id) {
  const value = String(id || '');
  if (/^https?:\/\//i.test(value) || value[0] === '/') return value;
  return '';
}

function normalizeQuality(value) {
  const input = String(value || '').toLowerCase().replace(/\s+/g, '');
  if (input === '2160p' || input === '4k') return '4k';
  const match = input.match(/(1080p|720p|480p|320p|240p)/);
  return match ? match[1] : '';
}

function qualityLabel(quality) { return quality === '4k' ? '4K' : String(quality).toUpperCase(); }
function firstArrayValue(value) { return Array.isArray(value) && value.length ? value[0] : ''; }
function isPlayableURL(value) { return /^https?:\/\/.+\.(?:m3u8|mp4|mpd)(?:\?|$)/i.test(String(value || '')); }
function addCacheBust(url) { return url + (url.indexOf('?') >= 0 ? '&' : '?') + '_dreamby=' + Date.now(); }
function positiveInt(value, fallback) { const number = parseInt(value, 10); return number > 0 ? number : fallback; }
function boolValue(value, fallback) { if (value === undefined || value === null || value === '') return fallback; if (typeof value === 'boolean') return value; return !/^(0|false|no|off)$/i.test(String(value)); }
function firstNonEmpty() { for (let i = 0; i < arguments.length; i += 1) if (arguments[i] !== undefined && arguments[i] !== null && String(arguments[i]).trim()) return arguments[i]; return ''; }
function firstMatch(value, regex) { const match = String(value || '').match(regex); return match ? match[1] || '' : ''; }
function escapeRegExp(value) { return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function decodeEscapes(value) { return decodeHTML(String(value || '').replace(/\\\//g, '/').replace(/\\u0026/gi, '&').replace(/\\x26/gi, '&')) }
function decodeHTML(value) { return String(value || '').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); }); }
function cleanText(value) { return decodeHTML(String(value || '').replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()); }
function errorMessage(error) { return String(error && error.message ? error.message : error || '加载失败'); }

const exported = { WidgetMetadata, getManifest, getHome, getHomeSection, getCategory, getDetail, getResourceVersions, resolvePlayback, search, parseCards, parseStreamData };
if (typeof globalThis !== 'undefined') Object.keys(exported).forEach(function (key) { globalThis[key] = exported[key]; });
if (typeof module !== 'undefined' && module.exports) module.exports = exported;
