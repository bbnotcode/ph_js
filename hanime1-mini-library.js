// @name Hanime1 Mini Library

const H1_BASE = 'https://hanime1.me';
const H1_LOGO = 'https://hanime1.me/favicon.ico';
const H1_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

const WidgetMetadata = {
  id: 'hanime1-mini-library',
  name: 'Hanime1',
  title: 'Hanime1',
  version: '1.1.0',
  requiredVersion: '0.0.1',
  author: 'Alan huang',
  site: H1_BASE,
  logo: H1_LOGO,
  icon: H1_LOGO,
  description: 'Hanime1 自定义媒体库，支持首页、分类、搜索、详情、多画质 MP4 播放。'
};

const H1_SECTIONS = [
  { id: 'latest-release', title: '最新上市', query: 'sort=最新上市', style: 'discover.spotlight' },
  { id: 'latest-upload', title: '最新上传', query: 'sort=最新上傳', style: 'discover.ranked' },
  { id: 'hentai', title: '里番', query: 'genre=裏番', style: 'discover.posterCompact' },
  { id: 'short', title: '泡面番', query: 'genre=泡麵番&sort=最新上傳', style: 'discover.posterCompact' },
  { id: 'motion', title: 'Motion Anime', query: 'genre=Motion Anime', style: 'discover.posterCompact' },
  { id: 'cg3d', title: '3DCG', query: 'genre=3DCG', style: 'discover.posterCompact' },
  { id: 'cg25d', title: '2.5D', query: 'genre=2.5D', style: 'discover.posterCompact' },
  { id: 'animation2d', title: '2D 动画', query: 'genre=2D動畫', style: 'discover.posterCompact' },
  { id: 'ai', title: 'AI 生成', query: 'genre=AI生成', style: 'discover.posterCompact' },
  { id: 'mmd', title: 'MMD', query: 'genre=MMD', style: 'discover.posterCompact' },
  { id: 'cosplay', title: 'Cosplay', query: 'genre=Cosplay', style: 'discover.posterCompact' }
];

const H1_SORTS = [
  { id: 'latest-release', title: '最新上市', value: '最新上市' },
  { id: 'latest-upload', title: '最新上传', value: '最新上傳' },
  { id: 'most-viewed', title: '最多观看', value: '最多觀看' },
  { id: 'monthly', title: '本月热门', value: '本月熱門' }
];

function getManifest() {
  return {
    id: WidgetMetadata.id, name: WidgetMetadata.name, title: WidgetMetadata.title,
    version: WidgetMetadata.version, requiredVersion: WidgetMetadata.requiredVersion,
    author: WidgetMetadata.author, site: WidgetMetadata.site,
    logo: WidgetMetadata.logo, icon: WidgetMetadata.icon, description: WidgetMetadata.description,
    capabilities: {
      home: true, category: true, detail: true, search: true,
      resourceVersions: true, playback: true, aggregation: true,
      playbackHistory: true, resourceMatching: false
    },
    aggregation: { search: true, playbackHistory: true, resourceMatching: false },
    parameters: [{
      name: 'baseUrl', title: '站点地址', type: 'input',
      defaultValue: H1_BASE, value: H1_BASE, required: true,
      description: 'Hanime1 当前可访问域名。'
    }]
  };
}

async function getHome(ctx) {
  const first = H1_SECTIONS[0];
  let immediate = [];
  try {
    immediate = parseCards(ctx, await fetchText(ctx, searchURL(ctx, first.query, 1)));
  } catch (_) {}
  const browseItems = await loadCategoryCards(ctx, immediate);
  return {
    pageType: 'home', id: 'hanime1-home', title: 'Hanime1',
    heroAspectRatio: '16:9', hero: immediate.slice(0, 6),
    sections: [{
      id: 'browse', title: '分类浏览', style: 'discover.annualPosterStack',
      lazy: false, items: browseItems
    }, {
      id: first.id, title: first.title, style: first.style, lazy: false,
      moreAction: categoryAction(first), items: immediate.slice(0, 18)
    }].concat(H1_SECTIONS.slice(1).map(function (section) {
      return {
        id: section.id, title: section.title, style: section.style, lazy: true,
        loadAction: { type: 'custom', id: section.id, sectionId: section.id, title: section.title },
        moreAction: categoryAction(section), items: []
      };
    }))
  };
}

async function getHomeSection(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const section = findSection(ctx.sectionId || ctx.id || ctx.pageId) || H1_SECTIONS[0];
  try {
    return {
      id: section.id, title: section.title, style: section.style, lazy: false,
      moreAction: categoryAction(section),
      items: parseCards(ctx, await fetchText(ctx, searchURL(ctx, section.query, 1))).slice(0, 18)
    };
  } catch (error) {
    return { id: section.id, title: section.title, subtitle: error.message, style: section.style, lazy: false, items: [] };
  }
}

async function getCategory(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const page = positiveInt(contextValue(ctx, 'page') || contextValue(ctx, 'pg') || contextValue(ctx, 'pageNumber'), 1);
  const pageId = stringValue(ctx.pageId || ctx.id || 'latest-release');
  const section = findSection(pageId);
  let query = section ? section.query : decodePayload(pageId).query;
  const sort = stringValue(contextValue(ctx, 'sort') || contextValue(ctx, 'sortBy') || contextValue(ctx, 'sort_by'));
  if (sort) query = setQueryValue(query, 'sort', sort);
  try {
    const html = await fetchText(ctx, searchURL(ctx, query, page));
    const items = parseCards(ctx, html);
    return {
      pageType: 'category', id: pageId, title: ctx.title || (section && section.title) || 'Hanime1',
      style: 'media.posterGrid', itemAspectRatio: '16:9', page: page,
      hasMore: hasNext(html, page, items), selectedSortValue: sort || queryValue(query, 'sort'),
      sort: H1_SORTS, items: items
    };
  } catch (error) {
    return {
      pageType: 'category', id: pageId, title: ctx.title || (section && section.title) || 'Hanime1',
      subtitle: error.message, style: 'media.posterGrid', itemAspectRatio: '16:9',
      page: page, hasMore: false, sort: H1_SORTS, items: []
    };
  }
}

async function getDetail(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const id = videoId(ctx.itemId || ctx.id || ctx.url);
  if (!id) throw new Error('Hanime1 详情参数无效');
  const url = baseURL(ctx) + '/watch?v=' + encodeURIComponent(id);
  const html = await fetchText(ctx, url);
  const title = cleanText(firstNonEmpty(
    metaContent(html, 'property', 'og:title'),
    firstMatch(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i),
    pageTitle(html)
  )).replace(/\s*-\s*Hanime1(?:\.me)?\s*$/i, '');
  const poster = absoluteURL(ctx, metaContent(html, 'property', 'og:image'));
  const overview = cleanText(firstNonEmpty(
    metaContent(html, 'name', 'description'),
    metaContent(html, 'property', 'og:description')
  ));
  const durationSeconds = Number(metaContent(html, 'property', 'og:video:duration')) || 0;
  const genres = unique((metaContent(html, 'name', 'keywords') || '').split(/[,，]\s*/).map(cleanText));
  const qualities = parseSources(html, id);
  const related = parseCards(ctx, html).filter(function (item) { return videoId(item.id) !== id; }).slice(0, 16);
  return {
    pageType: 'detail', id: id, type: 'movie', title: title || ('视频 ' + id),
    poster: poster, backdrop: poster, detailImageAspectRatio: '16:9',
    imageHeaders: imageHeaders(ctx, url), posterHeaders: imageHeaders(ctx, url), backdropHeaders: imageHeaders(ctx, url),
    overview: overview, year: extractYear(overview), runtimeMinutes: durationSeconds ? Math.ceil(durationSeconds / 60) : undefined,
    genres: genres, remarks: durationSeconds ? formatDuration(durationSeconds) : undefined,
    resourceGroups: qualities.length ? resourceGroups(id, title, qualities) : [],
    recommendations: [{ id: 'related', title: '相关影片', style: 'discover.posterCompact', items: related }]
  };
}

async function getResourceVersions(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const id = videoId(ctx.itemId || ctx.id || ctx.versionId || ctx.url);
  if (!id) throw new Error('缺少视频编号');
  const html = await fetchText(ctx, baseURL(ctx) + '/watch?v=' + encodeURIComponent(id));
  const qualities = parseSources(html, id);
  if (!qualities.length) throw new Error('没有解析到可用画质，请稍后重试');
  return resourceGroups(id, ctx.title || '', qualities);
}

async function resolvePlayback(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const payload = decodePayload(ctx.versionId || ctx.itemId || ctx.id);
  const id = videoId(payload.id || ctx.itemId || ctx.id || ctx.url);
  const requested = Number(payload.quality || contextValue(ctx, 'quality')) || 0;
  if (!id) throw new Error('缺少视频编号');
  const referer = baseURL(ctx) + '/watch?v=' + encodeURIComponent(id);
  const qualities = parseSources(await fetchText(ctx, referer), id);
  if (!qualities.length) throw new Error('没有解析到播放地址');
  const selected = qualities.filter(function (item) { return item.quality === requested; })[0] || qualities[0];
  return {
    url: selected.url, container: 'mp4', headers: playbackHeaders(ctx, referer),
    startPositionSeconds: Number(ctx.startPositionSeconds || 0) || 0,
    isLive: false, streamKind: 'vod'
  };
}

async function search(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const query = stringValue(ctx.query || ctx.keyword || ctx.text);
  const page = positiveInt(ctx.page || ctx.pg || ctx.pageNumber, 1);
  if (!query) return { pageType: 'search', title: '搜索', query: '', page: page, hasMore: false, items: [] };
  try {
    const html = await fetchText(ctx, searchURL(ctx, 'query=' + encodeURIComponent(query), page));
    const items = parseCards(ctx, html);
    return { pageType: 'search', title: '搜索：' + query, query: query, page: page, hasMore: hasNext(html, page, items), items: items };
  } catch (error) {
    return { pageType: 'search', title: '搜索：' + query, subtitle: error.message, query: query, page: page, hasMore: false, items: [] };
  }
}

function parseCards(ctx, html) {
  const source = String(html || '');
  const pattern = /<a\b[^>]*href=["']([^"']*\/watch\?v=([^"'&]+)[^"']*)["'][^>]*class=["'][^"']*\bvideo-link\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  const items = [];
  let match;
  while ((match = pattern.exec(source))) {
    const block = match[3];
    const id = decodeURIComponentSafe(match[2]);
    const poster = absoluteURL(ctx, firstNonEmpty(
      firstMatch(block, /<img\b[^>]*\bsrc=["']([^"']+)["']/i),
      firstMatch(block, /<img\b[^>]*\bdata-src=["']([^"']+)["']/i)
    ));
    const title = cleanText(firstNonEmpty(
      firstMatch(block, /class=["'][^"']*\btitle\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i),
      firstMatch(block, /<img\b[^>]*\balt=["']([^"']+)["']/i)
    ));
    if (!id || !title) continue;
    const duration = cleanText(firstMatch(block, /class=["'][^"']*\bduration\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i));
    const stats = cleanText(firstMatch(block, /class=["'][^"']*\bstats-container\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i));
    items.push({
      id: id, title: title, type: 'movie', poster: poster, backdrop: poster,
      aspectRatio: '16:9', imageHeaders: imageHeaders(ctx, baseURL(ctx) + '/'),
      remarks: duration, metadataText: stats, rank: items.length + 1,
      action: { type: 'detail', itemId: id }
    });
  }
  return uniqueBy(items, function (item) { return item.id; });
}

function parseSources(html, id) {
  const pattern = /<source\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  const result = [];
  let match;
  while ((match = pattern.exec(String(html || '')))) {
    const tag = match[0];
    const url = htmlDecode(match[1]);
    if (!/^https?:\/\/.+\.mp4(?:\?|$)/i.test(url)) continue;
    const quality = Number(firstNonEmpty(
      firstMatch(tag, /\bsize=["']?(\d+)/i),
      firstMatch(url, /-(\d+)p\.mp4/i)
    )) || 0;
    result.push({ id: id, quality: quality, url: url });
  }
  return uniqueBy(result.sort(function (a, b) { return b.quality - a.quality; }), function (item) { return String(item.quality || item.url); });
}

function resourceGroups(id, title, qualities) {
  return [{
    id: 'online', title: '在线播放',
    versions: qualities.map(function (item, index) {
      return {
        id: encodePayload({ id: id, quality: item.quality }),
        name: item.quality ? item.quality + 'P' : '默认画质',
        subtitle: 'MP4 直连 · 播放时刷新地址',
        default: index === 0,
        action: { type: 'play', itemId: id, versionId: encodePayload({ id: id, quality: item.quality }), title: title }
      };
    })
  }];
}

async function loadCategoryCards(ctx, firstItems) {
  const previews = {};
  previews[H1_SECTIONS[0].id] = (firstItems || []).slice(0, 3);
  await mapWithConcurrency(H1_SECTIONS.slice(1), 3, async function (section) {
    try {
      const html = await fetchText(ctx, searchURL(ctx, section.query, 1));
      previews[section.id] = parseCards(ctx, html).slice(0, 3);
    } catch (_) {
      previews[section.id] = [];
    }
  });
  return H1_SECTIONS.map(function (section) {
    return categoryCard(section, previews[section.id] || []);
  }).filter(function (item) {
    return item.previewItems.length > 0;
  });
}

async function mapWithConcurrency(items, limit, iterator) {
  let cursor = 0;
  const workers = [];
  const count = Math.min(Math.max(1, limit || 1), items.length);
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await iterator(items[index], index);
    }
  }
  for (let i = 0; i < count; i += 1) workers.push(worker());
  await Promise.all(workers);
}

function categoryCard(section, previewItems) {
  const previews = (previewItems || []).slice(0, 3);
  const artwork = previews[0] && (previews[0].backdrop || previews[0].poster);
  return {
    id: section.id, title: section.title,
    subtitle: previews.map(function (item) { return item.title; }).join(' · '),
    type: 'collection', poster: artwork, backdrop: artwork,
    imageHeaders: previews[0] && previews[0].imageHeaders,
    posterHeaders: previews[0] && previews[0].imageHeaders,
    backdropHeaders: previews[0] && previews[0].imageHeaders,
    aspectRatio: '16:9', imageFit: 'fill',
    previewItems: previews,
    metadataText: 'TOP ' + previews.length + ' 预览',
    badges: ['分类榜单'],
    action: categoryAction(section)
  };
}

function categoryAction(section) {
  return { type: 'category', pageId: section.id, title: section.title, itemAspectRatio: '16:9' };
}

function findSection(id) {
  return H1_SECTIONS.filter(function (item) { return item.id === id; })[0];
}

function searchURL(ctx, query, page) {
  const tail = String(query || '').replace(/^[?&]+/, '');
  return baseURL(ctx) + '/search?' + tail + (tail ? '&' : '') + 'page=' + positiveInt(page, 1);
}

function setQueryValue(query, key, value) {
  const parts = String(query || '').split('&').filter(Boolean).filter(function (part) {
    return decodeURIComponentSafe(part.split('=')[0]) !== key;
  });
  parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
  return parts.join('&');
}

function queryValue(query, key) {
  const parts = String(query || '').split('&');
  for (let i = 0; i < parts.length; i += 1) {
    const pair = parts[i].split('=');
    if (decodeURIComponentSafe(pair.shift()) === key) return decodeURIComponentSafe(pair.join('='));
  }
  return '';
}

function hasNext(html, page, items) {
  const next = positiveInt(page, 1) + 1;
  return new RegExp('[?&]page=' + next + '(?:[&#"\\\'])', 'i').test(String(html || '')) || items.length >= 18;
}

function baseURL(ctx) {
  return (stringValue(contextValue(ctx, 'baseUrl') || contextValue(ctx, 'baseURL')) || H1_BASE).replace(/\/+$/, '');
}

function requestHeaders(ctx, referer) {
  return {
    'User-Agent': H1_UA,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.7',
    Referer: referer || baseURL(ctx) + '/'
  };
}

function imageHeaders(ctx, referer) { return requestHeaders(ctx, referer); }
function playbackHeaders(ctx, referer) {
  return { 'User-Agent': H1_UA, Referer: referer, Origin: baseURL(ctx) };
}

async function fetchText(ctx, url) {
  let text = '';
  try {
    const response = await httpGet(url, { headers: requestHeaders(ctx, url), useBrowserFallback: false, browserFallback: false });
    text = responseText(response);
  } catch (_) {}
  if (isBlockedPage(text) || !isUsefulPage(text, url)) {
    const browserText = await browserHTML(ctx, url);
    if (isUsefulPage(browserText, url) && !isBlockedPage(browserText)) return browserText;
  }
  if (!text) throw new Error('请求失败: ' + url);
  if (isBlockedPage(text)) throw new Error('源站拒绝普通 HTTP 请求，且设备内浏览器验证失败');
  return text;
}

function isBlockedPage(text) {
  return /Just a moment|cf-browser-verification|cf-chl|Checking your browser|Sorry,\s*you have been blocked|Cloudflare Ray ID/i.test(String(text || ''));
}

function isUsefulPage(text, url) {
  const html = String(text || '');
  if (html.length < 1000) return false;
  if (/\/watch\?v=/i.test(String(url || ''))) return /<video\b|<source\b/i.test(html);
  return /class=["'][^"']*\bvideo-link\b/i.test(html);
}

async function browserHTML(ctx, url) {
  if (typeof Widget === 'undefined' || !Widget.browser || typeof Widget.browser.fetch !== 'function') return '';
  try {
    const result = await Widget.browser.fetch(url, {
      visible: false, timeout: 35, timeoutSeconds: 35, waitAfterLoad: 2,
      waitForAny: true, headers: requestHeaders(ctx, url)
    });
    return responseText(result && result.html ? { data: result.html } : result);
  } catch (_) {
    return '';
  }
}

async function httpGet(url, options) {
  if (typeof Widget !== 'undefined' && Widget.http) {
    if (typeof Widget.http.get === 'function') return Widget.http.get(url, options || {});
    if (typeof Widget.http.request === 'function') return Widget.http.request(Object.assign({ url: url, method: 'GET' }, options || {}));
  }
  if (typeof $http !== 'undefined' && $http) {
    if (typeof $http.get === 'function') return $http.get(url, options || {});
    if (typeof $http.request === 'function') return $http.request(Object.assign({ url: url, method: 'GET' }, options || {}));
  }
  if (typeof fetch === 'function') {
    const response = await fetch(url, { headers: (options && options.headers) || {} });
    return { status: response.status, data: await response.text() };
  }
  throw new Error('当前环境不支持 HTTP 请求');
}

function responseText(response) {
  if (typeof response === 'string') return response;
  if (!response) return '';
  let data = response.data !== undefined ? response.data : (response.body !== undefined ? response.body : response.text);
  if (data && typeof data === 'object' && data.html !== undefined) data = data.html;
  if (typeof data === 'string') return data;
  return data === undefined || data === null ? '' : JSON.stringify(data);
}

function normalizeContext(ctx) {
  if (typeof ctx !== 'string') return ctx || {};
  try { return JSON.parse(ctx); } catch (_) { return {}; }
}

function contextValue(ctx, key) {
  ctx = normalizeContext(ctx);
  if (ctx[key] !== undefined && ctx[key] !== null && ctx[key] !== '') return ctx[key];
  const bags = [ctx.params, ctx.config, ctx.settings, ctx.parameters, ctx.pagination, ctx.pageInfo];
  for (let i = 0; i < bags.length; i += 1) {
    if (bags[i] && bags[i][key] !== undefined && bags[i][key] !== null && bags[i][key] !== '') return bags[i][key];
  }
  return '';
}

function absoluteURL(ctx, value) {
  const url = stringValue(value);
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.indexOf('//') === 0) return 'https:' + url;
  return baseURL(ctx) + '/' + url.replace(/^\/+/, '');
}

function videoId(value) {
  const text = stringValue(value);
  const decoded = decodePayload(text);
  if (decoded.id) return stringValue(decoded.id);
  const match = text.match(/[?&]v=([^&#]+)/i);
  if (match) return decodeURIComponentSafe(match[1]);
  return /^[a-z0-9_-]+$/i.test(text) ? text : '';
}

function encodePayload(value) { return 'hanime1://' + encodeURIComponent(JSON.stringify(value || {})); }
function decodePayload(value) {
  const text = stringValue(value);
  if (text.indexOf('hanime1://') !== 0) return {};
  try { return JSON.parse(decodeURIComponent(text.slice(10))); } catch (_) { return {}; }
}

function metaContent(html, attr, name) {
  const source = String(html || '');
  const tags = source.match(/<meta\b[^>]*>/gi) || [];
  for (let i = 0; i < tags.length; i += 1) {
    const key = firstMatch(tags[i], new RegExp('\\b' + attr + '=[\"\\\']([^\"\\\']+)[\"\\\']', 'i'));
    if (key !== name) continue;
    return htmlDecode(firstMatch(tags[i], /\bcontent=["']([^"']*)["']/i));
  }
  return '';
}

function pageTitle(html) { return cleanText(firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i)); }
function extractYear(value) {
  const match = String(value || '').match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
}
function formatDuration(seconds) {
  const value = Number(seconds) || 0;
  const h = Math.floor(value / 3600), m = Math.floor((value % 3600) / 60), s = value % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(s).padStart(2, '0');
}
function firstMatch(value, pattern) { const match = pattern.exec(String(value || '')); return match ? (match[1] || '') : ''; }
function firstNonEmpty() {
  for (let i = 0; i < arguments.length; i += 1) if (stringValue(arguments[i])) return arguments[i];
  return '';
}
function stringValue(value) { return value === undefined || value === null ? '' : String(value).trim(); }
function cleanText(value) { return htmlDecode(String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim(); }
function htmlDecode(value) {
  return String(value || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, function (_, hex) { return String.fromCharCode(parseInt(hex, 16)); })
    .replace(/&#(\d+);/g, function (_, num) { return String.fromCharCode(parseInt(num, 10)); });
}
function decodeURIComponentSafe(value) { try { return decodeURIComponent(String(value || '')); } catch (_) { return String(value || ''); } }
function positiveInt(value, fallback) { const n = Number(value); return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback; }
function unique(values) {
  const seen = {};
  return (values || []).filter(function (value) { const key = stringValue(value); if (!key || seen[key]) return false; seen[key] = true; return true; });
}
function uniqueBy(items, keyFn) {
  const seen = {};
  return (items || []).filter(function (item) { const key = keyFn(item); if (!key || seen[key]) return false; seen[key] = true; return true; });
}

const getPlayback = resolvePlayback;
const play = resolvePlayback;
const home = getHome;
const homeSection = getHomeSection;
const category = getCategory;
const detail = getDetail;
const versions = getResourceVersions;
const onSearch = search;
const getSearch = search;

const exported = {
  WidgetMetadata, getManifest, getHome, home, getHomeSection, homeSection,
  getCategory, category, getDetail, detail, getResourceVersions, versions,
  resolvePlayback, getPlayback, play, search, onSearch, getSearch
};

if (typeof globalThis !== 'undefined') Object.keys(exported).forEach(function (key) { globalThis[key] = exported[key]; });
if (typeof module !== 'undefined' && module.exports) module.exports = exported;
