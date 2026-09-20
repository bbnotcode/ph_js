// @name 片吧365 Tv

const PB365_DEFAULT_BASE = 'https://pb365.nl';
const PB365_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const PB365_LOGO = PB365_DEFAULT_BASE + '/android-chrome-192x192.png';

const WidgetMetadata = {
  id: 'pb365-mini-library',
  name: '片吧365 Tv',
  title: '片吧365 Tv',
  version: '1.0.1',
  requiredVersion: '0.0.1',
  author: 'Alan huang',
  site: PB365_DEFAULT_BASE,
  logo: PB365_LOGO,
  icon: PB365_LOGO,
  description: '片吧365 Tv 自定义媒体库，支持榜单、时长分类、搜索、详情与原生 HLS 播放。'
};

const PB365_CATEGORIES = [
  { id: 'latest', title: '最新', prefix: 'list', style: 'discover.standard' },
  { id: 'weekly', title: '周榜', prefix: 'top7_list', style: 'discover.ranked' },
  { id: 'monthly', title: '月榜', prefix: 'top_list', style: 'discover.ranked' },
  { id: 'hot', title: '最热', prefix: 'hot_list', style: 'discover.posterCompact' },
  { id: 'five-minutes', title: '5 分钟以上', prefix: '5min_list', style: 'discover.posterCompact' },
  { id: 'ten-minutes', title: '10 分钟以上', prefix: 'long_list', style: 'discover.posterCompact' }
];

const PB365_SORTS = [
  { id: 'new', title: '最新', value: 'new' },
  { id: 'hot', title: '最热', value: 'hot' }
];

function getManifest() {
  return {
    id: WidgetMetadata.id,
    name: WidgetMetadata.name,
    title: WidgetMetadata.title,
    version: WidgetMetadata.version,
    requiredVersion: WidgetMetadata.requiredVersion,
    author: WidgetMetadata.author,
    site: WidgetMetadata.site,
    logo: WidgetMetadata.logo,
    icon: WidgetMetadata.icon,
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
    parameters: [{
      name: 'baseUrl',
      title: '站点地址',
      type: 'input',
      defaultValue: PB365_DEFAULT_BASE,
      value: PB365_DEFAULT_BASE,
      required: true,
      description: '片吧365 当前可访问域名。'
    }]
  };
}

async function getHome(ctx) {
  let latest = [];
  let latestError = '';
  try {
    latest = parseVideoCards(await fetchHTML(ctx, categoryURL(ctx, PB365_CATEGORIES[0], 1, 'new')), ctx).slice(0, 20);
  } catch (error) {
    latestError = errorMessage(error);
  }
  return {
    pageType: 'home',
    id: 'pb365-home',
    title: WidgetMetadata.title,
    heroAspectRatio: '16:9',
    hero: latest.slice(0, 6),
    sections: [{
      id: 'latest',
      title: '最新发布',
      style: 'discover.standard',
      lazy: false,
      moreAction: categoryAction(PB365_CATEGORIES[0]),
      items: latest,
      error: latestError || undefined
    }].concat(PB365_CATEGORIES.slice(1).map(function (category) {
      return {
        id: category.id,
        title: category.title,
        style: category.style,
        lazy: true,
        loadAction: { type: 'custom', id: category.id, sectionId: category.id, title: category.title },
        moreAction: categoryAction(category),
        items: []
      };
    }))
  };
}

async function getHomeSection(ctx) {
  const category = findCategory(value(ctx, ['sectionId', 'pageId', 'id'], 'latest'));
  try {
    const items = parseVideoCards(await fetchHTML(ctx, categoryURL(ctx, category, 1, defaultSort(category))), ctx).slice(0, 20);
    return {
      id: category.id,
      title: category.title,
      style: category.style,
      lazy: false,
      moreAction: categoryAction(category),
      items: ranked(items, category)
    };
  } catch (error) {
    return { id: category.id, title: category.title, style: category.style, lazy: false, items: [], error: errorMessage(error) };
  }
}

async function getCategory(ctx) {
  const category = findCategory(value(ctx, ['pageId', 'categoryId', 'id'], 'latest'));
  const page = positiveInt(value(ctx, ['page', 'pg', 'currentPage', 'pageNumber'], 1), 1);
  const sort = stringValue(value(ctx, ['sort', 'sortBy', 'sortValue'], defaultSort(category)));
  try {
    const html = await fetchHTML(ctx, categoryURL(ctx, category, page, sort));
    const items = ranked(parseVideoCards(html, ctx), category, page);
    const totalPages = parseTotalPages(html, category.prefix);
    return {
      pageType: 'category',
      id: category.id,
      title: category.title,
      style: 'media.posterGrid',
      itemAspectRatio: '16:9',
      page: page,
      nextPage: page < totalPages ? page + 1 : undefined,
      totalPages: totalPages || undefined,
      hasMore: totalPages ? page < totalPages : items.length >= 20,
      selectedSortValue: sort,
      sort: PB365_SORTS,
      items: items
    };
  } catch (error) {
    return {
      pageType: 'category', id: category.id, title: category.title, style: 'media.posterGrid',
      itemAspectRatio: '16:9', page: page, hasMore: false, selectedSortValue: sort,
      sort: PB365_SORTS, items: [], error: errorMessage(error)
    };
  }
}

async function getDetail(ctx) {
  const id = videoId(value(ctx, ['itemId', 'id', 'videoId'], ''));
  if (!id) throw new Error('片吧365：缺少有效影片 ID');
  const detailURL = baseURL(ctx) + '/video-' + id + '.htm';
  const html = await fetchHTML(ctx, detailURL);
  const title = cleanText(firstNonEmpty(
    metaContent(html, 'property', 'og:title'),
    metaContent(html, 'name', 'description'),
    firstMatch(html, /<h3[^>]*class=["'][^"']*panel-title[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i),
    '影片 ' + id
  )).replace(/\s*-\s*片吧365\s*Tv\s*$/i, '');
  const poster = absoluteURL(ctx, firstNonEmpty(
    metaContent(html, 'property', 'og:image'),
    decodeURLValue(firstMatch(html, /poster_url=([^&"']+)/i))
  ));
  const durationText = cleanText(firstNonEmpty(
    metaContent(html, 'property', 'video:duration'),
    metaContent(html, 'itemprop', 'duration'),
    firstMatch(html, /时长\s*[：:]\s*([^<]+)/i)
  ));
  const author = cleanText(firstNonEmpty(
    metaContent(html, 'property', 'og:video:actor'),
    firstMatch(html, /作者\s*[：:][\s\S]{0,100}?<a[^>]*>([\s\S]*?)<\/a>/i)
  ));
  const category = cleanText(metaContent(html, 'property', 'og:video:class'));
  const area = cleanText(metaContent(html, 'property', 'og:video:area'));
  const overview = cleanText(firstNonEmpty(metaContent(html, 'property', 'og:description'), metaContent(html, 'name', 'description')));
  const recommendations = parseVideoCards(recommendationHTML(html), ctx).filter(function (item) { return videoId(item.id) !== id; }).slice(0, 16);
  const resourceGroups = playbackGroups(id, title);
  return {
    pageType: 'detail',
    id: itemId(id),
    title: title,
    type: 'movie',
    poster: poster,
    backdrop: poster,
    detailImageAspectRatio: '16:9',
    imageHeaders: imageHeaders(ctx),
    posterHeaders: imageHeaders(ctx),
    backdropHeaders: imageHeaders(ctx),
    overview: overview,
    runtimeMinutes: durationMinutes(durationText),
    genres: [category, area].filter(Boolean),
    cast: author ? [{ id: 'author:' + author, name: author, role: '作者' }] : [],
    resourceGroups: resourceGroups,
    resourceSummary: { versionCount: 1, episodeCount: 0, defaultVersionId: 'source' },
    recommendations: recommendations.length ? [{ id: 'related', title: '相关推荐', style: 'discover.posterCompact', items: recommendations }] : [],
    providerIds: { source: WidgetMetadata.id, videoId: id }
  };
}

function getResourceVersions(ctx) {
  const id = videoId(value(ctx, ['itemId', 'id', 'videoId'], ''));
  if (!id) return [];
  return playbackGroups(id, stringValue(value(ctx, ['title'], '')));
}

async function resolvePlayback(ctx) {
  const id = videoId(value(ctx, ['itemId', 'id', 'videoId'], ''));
  if (!id) throw new Error('片吧365播放：缺少影片 ID');
  const referer = baseURL(ctx) + '/video-' + id + '.htm';
  const html = await fetchHTML(ctx, referer + '?play=' + Date.now());
  const gateway = decodeURLValue(firstMatch(html, /video_url=([^&"']+)/i));
  if (!gateway || !/^https?:\/\//i.test(gateway)) throw new Error('片吧365播放：详情页未提供 HLS 地址');
  // 此站的 HLS 令牌只能完整读取一次。不能在这里预请求清单，否则原生播放器
  // 第二次访问时会收到 player.centercdn.top/tip.ts 引流短片。
  return {
    url: gateway,
    container: 'm3u8',
    headers: playbackHeaders(ctx, referer),
    startPositionSeconds: 0,
    isLive: false,
    streamKind: 'vod'
  };
}

async function search(ctx) {
  const query = stringValue(value(ctx, ['query', 'keyword', 'text'], '')).trim();
  const page = positiveInt(value(ctx, ['page', 'pg', 'currentPage', 'pageNumber'], 1), 1);
  const sort = stringValue(value(ctx, ['sort', 'sortBy', 'sortValue'], 'new'));
  if (!query) return { pageType: 'search', id: 'pb365-search', title: '搜索', query: '', keyword: '', page: page, hasMore: false, items: [] };
  try {
    const path = page > 1 ? '/search-' + page + '.htm' : '/search.htm';
    const url = baseURL(ctx) + path + '?search=' + encodeURIComponent(query) + '&sort=' + encodeURIComponent(sort);
    const html = await fetchHTML(ctx, url);
    const items = parseVideoCards(html, ctx);
    const totalPages = parseTotalPages(html, 'search');
    return {
      pageType: 'search', id: 'pb365-search', title: '搜索：' + query,
      query: query, keyword: query, style: 'media.posterGrid', itemAspectRatio: '16:9',
      page: page, nextPage: page < totalPages ? page + 1 : undefined,
      totalPages: totalPages || undefined, hasMore: totalPages ? page < totalPages : items.length >= 20,
      selectedSortValue: sort, sort: PB365_SORTS, items: items
    };
  } catch (error) {
    return { pageType: 'search', id: 'pb365-search', title: '搜索：' + query, query: query, keyword: query, page: page, hasMore: false, items: [], error: errorMessage(error) };
  }
}

function playbackGroups(id, title) {
  return [{
    id: 'online',
    title: '在线播放',
    versions: [{
      id: 'source',
      name: '源站线路',
      subtitle: '播放时生成一次性线路，请勿缓存',
      default: true,
      action: { type: 'play', itemId: itemId(id), versionId: 'source', title: title || undefined }
    }]
  }];
}

function parseVideoCards(html, ctx) {
  const source = stringValue(html);
  const cards = [];
  const seen = {};
  const re = /<div[^>]*class=["'][^"']*thumbnail[^"']*["'][^>]*>([\s\S]*?)(?=<div[^>]*class=["'][^"']*thumbnail[^"']*["']|<nav\b|<\/body>|$)/gi;
  let match;
  while ((match = re.exec(source))) {
    const block = match[1];
    const href = firstMatch(block, /href=["'](?:\.\/|\/)?video-(\d+)\.htm(?:\?[^"']*)?["']/i);
    if (!href || seen[href]) continue;
    const image = firstNonEmpty(
      firstMatch(block, /background-image\s*:\s*url\(\s*["']?([^"')]+)["']?\s*\)/i),
      firstMatch(block, /<img[^>]+(?:data-src|data-original|src)=["']([^"']+)["']/i)
    );
    const title = cleanText(firstNonEmpty(
      firstMatch(block, /class=["'][^"']*image[^"']*["'][^>]*title=["']([^"']+)["']/i),
      firstMatch(block, /<h[1-6][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i)
    ));
    if (!title || !image) continue;
    const duration = cleanText(firstMatch(block, /<var[^>]*class=["'][^"']*duration[^"']*["'][^>]*>([\s\S]*?)<\/var>/i));
    const info = cleanText(firstMatch(block, /<div[^>]*class=["'][^"']*info[^"']*["'][^>]*>([\s\S]*?)<\/div>/i));
    const author = cleanText(firstMatch(block, /user\.htm\?author=[^"']+["'][^>]*>([\s\S]*?)<\/a>/i));
    const hd = /hd-thumbnail/i.test(block);
    seen[href] = true;
    cards.push({
      id: itemId(href),
      title: title,
      subtitle: [author, duration].filter(Boolean).join(' · '),
      type: 'movie',
      poster: absoluteURL(ctx, image),
      backdrop: absoluteURL(ctx, image),
      imageHeaders: imageHeaders(ctx),
      remarks: hd ? 'HD' : duration || undefined,
      badges: hd ? ['HD'] : [],
      metadataText: info || undefined,
      aspectRatio: '16:9',
      action: { type: 'detail', itemId: itemId(href) }
    });
  }
  return cards;
}

function recommendationHTML(html) {
  const marker = stringValue(html).search(/<h4[^>]*>\s*推荐视频\s*<\/h4>/i);
  if (marker < 0) return '';
  const end = stringValue(html).search(/<h4[^>]*>\s*作者视频\s*<\/h4>/i);
  return stringValue(html).slice(marker, end > marker ? end : undefined);
}

function ranked(items, category, page) {
  if (!category || (category.id !== 'weekly' && category.id !== 'monthly')) return items;
  const offset = (positiveInt(page, 1) - 1) * Math.max(items.length, 20);
  return items.map(function (item, index) { item.rank = offset + index + 1; return item; });
}

function categoryURL(ctx, category, page, sort) {
  return baseURL(ctx) + '/' + category.prefix + '-' + positiveInt(page, 1) + '.htm?sort=' + encodeURIComponent(sort || defaultSort(category));
}

function categoryAction(category) { return { type: 'category', pageId: category.id, title: category.title }; }
function defaultSort(category) { return category && (category.id === 'weekly' || category.id === 'monthly' || category.id === 'hot') ? 'hot' : 'new'; }
function findCategory(id) { return PB365_CATEGORIES.find(function (item) { return item.id === stringValue(id); }) || PB365_CATEGORIES[0]; }

function parseTotalPages(html, prefix) {
  const source = stringValue(html);
  const escaped = String(prefix || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(?:' + escaped + '|search)-(\\d+)\\.htm', 'gi');
  let max = 0;
  let match;
  while ((match = re.exec(source))) max = Math.max(max, Number(match[1]) || 0);
  return max;
}

async function fetchHTML(ctx, url) {
  const response = await fetchResponse(url, pageHeaders(ctx), 15);
  const text = await responseText(response);
  const status = responseStatus(response);
  if (status && (status < 200 || status >= 400)) throw new Error('站点返回 HTTP ' + status);
  if (!text) throw new Error('站点返回空内容');
  if (/Just a moment|cf-mitigated|Cloudflare Ray ID/i.test(text)) throw new Error('站点触发 Cloudflare 验证');
  return text;
}

async function fetchResponse(url, headers, timeoutSeconds) {
  const options = { headers: headers || {}, timeout: timeoutSeconds || 15 };
  if (typeof Widget !== 'undefined' && Widget && Widget.http) {
    if (typeof Widget.http.get === 'function') return await Widget.http.get(url, options);
    if (typeof Widget.http.request === 'function') return await Widget.http.request({ url: url, method: 'GET', headers: options.headers, timeout: options.timeout });
  }
  if (typeof $http !== 'undefined' && $http) {
    if (typeof $http.get === 'function') return await $http.get(url, options);
    if (typeof $http.request === 'function') return await $http.request({ url: url, method: 'GET', headers: options.headers, timeout: options.timeout });
  }
  if (typeof fetch === 'function') {
    const fetched = await fetch(url, { method: 'GET', headers: options.headers, redirect: 'follow' });
    return { data: await fetched.text(), status: fetched.status, url: fetched.url, headers: fetched.headers };
  }
  throw new Error('当前环境没有可用的 HTTP 客户端');
}

async function responseText(response) {
  if (typeof response === 'string') return response;
  if (!response) return '';
  const candidates = [response.data, response.body, response.text, response.responseBody, response.response && response.response.data];
  for (let i = 0; i < candidates.length; i++) {
    const entry = candidates[i];
    if (typeof entry === 'string') return entry;
    if (entry && typeof entry === 'object') { try { return JSON.stringify(entry); } catch (_) {} }
  }
  return '';
}

function responseStatus(response) {
  if (typeof response === 'string') return 200;
  return Number(response && (response.status || response.statusCode || (response.response && response.response.status)) || 0);
}

function responseFinalURL(response, fallback) {
  return stringValue(response && (
    response.finalURL || response.urlEffective || response.responseURL || response.url ||
    (response.response && (response.response.finalURL || response.response.url))
  )) || fallback;
}

function pageHeaders(ctx) {
  return {
    'User-Agent': PB365_UA,
    Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
    Referer: baseURL(ctx) + '/enter'
  };
}

function playbackHeaders(ctx, referer) {
  return { 'User-Agent': PB365_UA, Accept: 'application/vnd.apple.mpegurl,application/x-mpegURL,*/*', Referer: referer || baseURL(ctx) + '/enter' };
}

function imageHeaders() { return { 'User-Agent': PB365_UA }; }

function contextObject(ctx) {
  if (typeof ctx === 'string') { try { return JSON.parse(ctx); } catch (_) { return {}; } }
  return ctx && typeof ctx === 'object' ? ctx : {};
}

function value(ctx, keys, fallback) {
  const root = contextObject(ctx);
  const boxes = [root, root.params, root.config, root.settings, root.parameters, root.pagination, root.pageInfo].filter(Boolean);
  for (let i = 0; i < boxes.length; i++) {
    for (let j = 0; j < keys.length; j++) {
      const found = boxes[i][keys[j]];
      if (found !== undefined && found !== null && found !== '') return found;
    }
  }
  return fallback;
}

function baseURL(ctx) { return stringValue(value(ctx, ['baseUrl'], PB365_DEFAULT_BASE)).replace(/\/+$/, ''); }
function itemId(id) { return 'pb365://video/' + videoId(id); }
function videoId(input) { const match = stringValue(input).match(/(?:pb365:\/\/video\/|video-)?(\d{4,})(?:\.htm)?/i); return match ? match[1] : ''; }
function positiveInt(value, fallback) { const number = Math.floor(Number(value)); return Number.isFinite(number) && number > 0 ? number : fallback; }
function stringValue(value) { return value === undefined || value === null ? '' : String(value); }
function firstNonEmpty() { for (let i = 0; i < arguments.length; i++) if (stringValue(arguments[i]).trim()) return arguments[i]; return ''; }
function firstMatch(text, regex) { const match = stringValue(text).match(regex); return match ? stringValue(match[1]) : ''; }
function decodeURLValue(value) { try { return decodeURIComponent(stringValue(value).replace(/&amp;/g, '&')); } catch (_) { return stringValue(value); } }

function metaContent(html, attribute, name) {
  const escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return decodeEntities(firstNonEmpty(
    firstMatch(html, new RegExp("<meta[^>]*" + attribute + "=[\"']" + escaped + "[\"'][^>]*content=[\"']([^\"']*)[\"']", 'i')),
    firstMatch(html, new RegExp("<meta[^>]*content=[\"']([^\"']*)[\"'][^>]*" + attribute + "=[\"']" + escaped + "[\"']", 'i'))
  ));
}

function decodeEntities(text) {
  return stringValue(text)
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, function (_, code) { return String.fromCharCode(Number(code)); });
}

function cleanText(text) { return decodeEntities(stringValue(text).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function absoluteURL(ctx, url) { const value = decodeEntities(stringValue(url).trim()); if (!value) return ''; if (/^https?:\/\//i.test(value)) return value; if (/^\/\//.test(value)) return 'https:' + value; return baseURL(ctx) + (value.charAt(0) === '/' ? value : '/' + value); }
function durationMinutes(text) { const parts = stringValue(text).match(/(\d{1,2}):([0-5]\d)(?::([0-5]\d))?/); if (!parts) return undefined; const seconds = parts[3] === undefined ? Number(parts[1]) * 60 + Number(parts[2]) : Number(parts[1]) * 3600 + Number(parts[2]) * 60 + Number(parts[3]); return Math.max(1, Math.round(seconds / 60)); }
function errorMessage(error) { return stringValue(error && error.message || error || '未知错误'); }

const api = { getManifest, getHome, getHomeSection, getCategory, getDetail, getResourceVersions, resolvePlayback, search };
Object.assign(globalThis, api);
if (typeof module !== 'undefined') module.exports = Object.assign({ _test: { parseVideoCards, parseTotalPages, videoId, durationMinutes, metaContent, recommendationHTML } }, api);
