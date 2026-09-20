// @name SuperPorn Dreamby Mini Library

'use strict';

const SP_DEFAULT_BASE = 'https://cn.superporn.ws';
const SP_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const SP_LOGO = SP_DEFAULT_BASE + '/apple-touch-icon.png';
const SP_CATEGORIES = [
  { id: 'latest', title: '最新', path: '/', style: 'discover.standard' },
  { id: 'japanese', title: '日本', path: '/japanese', apiId: 88, style: 'discover.posterCompact' },
  { id: 'asian', title: '亚洲', path: '/asian', apiId: 21, style: 'discover.posterCompact' },
  { id: 'amateur', title: '业余', path: '/amateur', apiId: 2, style: 'discover.posterCompact' },
  { id: 'lesbian', title: '女同', path: '/lesbian', apiId: 14, style: 'discover.posterCompact' },
  { id: 'hentai', title: '成人动漫', path: '/hentai', apiId: 16, style: 'discover.posterCompact' },
  { id: 'milf', title: '成熟女性', path: '/milf', apiId: 17, style: 'discover.posterCompact' }
];

const WidgetMetadata = {
  id: 'superporn-mini-library',
  name: 'SuperPorn',
  title: 'SuperPorn',
  version: '1.0.4',
  requiredVersion: '0.0.1',
  author: 'Alan huang',
  site: SP_DEFAULT_BASE,
  logo: SP_LOGO,
  icon: SP_LOGO,
  description: 'SuperPorn Dreamby 自定义媒体库，支持首页、分类、分页、搜索、详情与播放时刷新签名。仅限年满18岁的用户使用。'
};

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
      defaultValue: SP_DEFAULT_BASE,
      value: SP_DEFAULT_BASE,
      required: true,
      description: 'SuperPorn 当前可访问域名。'
    }]
  };
}

async function getHome(ctx) {
  let latest = [];
  let latestError = '';
  try {
    latest = parseVideoCards(await fetchHTML(ctx, categoryURL(ctx, SP_CATEGORIES[0], 1)), ctx).slice(0, 24);
  } catch (error) {
    latestError = errorMessage(error);
  }
  return {
    pageType: 'home',
    id: 'superporn-home',
    title: WidgetMetadata.title,
    heroAspectRatio: '16:9',
    hero: latest.slice(0, 6).map(toHero),
    sections: [{
      id: 'latest',
      title: '最新更新',
      style: 'discover.standard',
      lazy: false,
      moreAction: categoryAction(SP_CATEGORIES[0]),
      items: latest,
      error: latestError || undefined
    }].concat(SP_CATEGORIES.slice(1).map(function (category) {
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
  const input = normalizeContext(ctx);
  const category = findCategory(value(input, ['sectionId', 'pageId', 'id'], 'latest'));
  try {
    const result = await fetchCategoryPage(input, category, 1);
    const items = result.items;
    return {
      id: category.id,
      title: category.title,
      style: category.style,
      lazy: false,
      moreAction: categoryAction(category),
      items: items
    };
  } catch (error) {
    return { id: category.id, title: category.title, style: category.style, lazy: false, items: [], error: errorMessage(error) };
  }
}

async function getCategory(ctx) {
  const input = normalizeContext(ctx);
  const page = positiveInt(value(input, ['page', 'pg', 'currentPage', 'pageNumber'], 1), 1);
  const rawId = stringValue(value(input, ['pageId', 'categoryId', 'id'], 'latest'));
  const knownCategory = exactCategory(rawId);
  const category = knownCategory || SP_CATEGORIES[0];
  const customPath = stringValue(value(input, ['path'], ''));
  const target = knownCategory || (customPath ? { id: rawId || 'custom', title: stringValue(value(input, ['title'], '视频')), path: customPath } : category);
  try {
    const result = await fetchCategoryPage(input, target, page);
    const items = result.items;
    const totalPages = result.totalPages;
    const hasMore = result.hasMore;
    return {
      pageType: 'category',
      id: target.id,
      title: target.title,
      style: 'media.posterGrid',
      itemAspectRatio: '16:9',
      page: page,
      nextPage: hasMore ? page + 1 : undefined,
      totalPages: totalPages || undefined,
      totalItems: result.totalItems || undefined,
      hasMore: hasMore,
      items: items
    };
  } catch (error) {
    return {
      pageType: 'category', id: target.id, title: target.title, style: 'media.posterGrid',
      itemAspectRatio: '16:9', page: page, hasMore: false, items: [], error: errorMessage(error)
    };
  }
}

async function fetchCategoryPage(ctx, category, page) {
  if (category && category.apiId) {
    const apiURL = 'https://api.superporn.ws/videos/category/latest/' + encodeURIComponent(String(category.apiId));
    const sourcePage = (page - 1) * 2 + 1;
    const payloads = await Promise.all([
      fetchCategoryPayload(ctx, apiURL, sourcePage),
      fetchCategoryPayload(ctx, apiURL, sourcePage + 1)
    ]);
    const first = payloads[0];
    const second = payloads[1];
    const items = dedupeItems(parseRelatedPayload(first, ctx).concat(parseRelatedPayload(second, ctx)));
    const totalItems = positiveInt(first.total || second.total, 0);
    return {
      items: items,
      totalItems: totalItems,
      totalPages: totalItems ? Math.ceil(totalItems / 48) : 0,
      hasMore: Boolean(second.showMore)
    };
  }
  const html = await fetchHTML(ctx, categoryURL(ctx, category, page));
  const items = parseVideoCards(html, ctx);
  const totalPages = parseTotalPages(html);
  return { items: items, totalItems: 0, totalPages: totalPages, hasMore: hasNextPage(html, page, totalPages, items.length) };
}

async function fetchCategoryPayload(ctx, apiURL, page) {
  const text = await fetchText(ctx, appendQuery(apiURL, { page: page }), pageHeaders(ctx));
  let payload;
  try { payload = JSON.parse(text); } catch (_) { throw new Error('分类接口返回了无效 JSON'); }
  if (!payload || payload.error || payload.result !== 'ok' || !Array.isArray(payload.videos)) {
    throw new Error('分类接口未返回有效视频');
  }
  return payload;
}

function dedupeItems(items) {
  const seen = {};
  return (items || []).filter(function (item) {
    if (!item || !item.id || seen[item.id]) return false;
    seen[item.id] = true;
    return true;
  });
}

async function search(ctx) {
  const input = normalizeContext(ctx);
  const query = stringValue(value(input, ['query', 'keyword', 'text'], '')).trim();
  const page = positiveInt(value(input, ['page', 'pg', 'currentPage', 'pageNumber'], 1), 1);
  if (!query) return { pageType: 'search', id: 'superporn-search', title: '搜索', query: '', keyword: '', page: page, hasMore: false, items: [] };
  try {
    const url = appendQuery(baseURL(input) + '/search', { q: query, page: page > 1 ? page : undefined });
    const html = await fetchHTML(input, url);
    const items = parseVideoCards(html, input);
    const totalPages = parseTotalPages(html);
    const hasMore = hasNextPage(html, page, totalPages, items.length);
    return {
      pageType: 'search',
      id: 'superporn-search-' + query,
      title: '搜索：' + query,
      query: query,
      keyword: query,
      page: page,
      nextPage: hasMore ? page + 1 : undefined,
      totalPages: totalPages || undefined,
      hasMore: hasMore,
      items: items
    };
  } catch (error) {
    return { pageType: 'search', id: 'superporn-search-' + query, title: '搜索：' + query, query: query, keyword: query, page: page, hasMore: false, items: [], error: errorMessage(error) };
  }
}

async function getDetail(ctx) {
  const input = normalizeContext(ctx);
  const url = detailURL(input);
  if (!url) throw new Error('SuperPorn 详情：缺少有效视频地址');
  const html = await fetchHTML(input, url);
  const title = cleanText(firstNonEmpty(
    metaContent(html, 'property', 'og:title'),
    firstMatch(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i),
    pageTitle(html),
    titleFromURL(url)
  )).replace(/\s*-\s*SuperPorn\s*$/i, '');
  const poster = absoluteURL(input, firstNonEmpty(
    metaContent(html, 'property', 'og:image'),
    firstMatch(html, /<video\b[^>]*\bposter=["']([^"']+)/i)
  ));
  const description = cleanText(firstNonEmpty(metaContent(html, 'property', 'og:description'), metaContent(html, 'name', 'description'))).replace(/\s*-\s*SuperPorn\s*$/i, '');
  const durationSeconds = positiveInt(firstNonEmpty(
    firstMatch(html, /<video\b[^>]*\bdata-video-duration=["'](\d+)/i),
    isoDurationSeconds(firstMatch(html, /["']duration["']\s*:\s*["']([^"']+)/i))
  ), 0);
  const genres = parseChipLinks(html, 'icon-folder-open-1').slice(0, 12);
  const castNames = parseInfoLinks(html, 'icon-star').slice(0, 12);
  let recommendations = [];
  const relatedURL = decodeHTML(firstMatch(html, /global_api_related_video\s*=\s*["']([^"']+)/i));
  if (relatedURL) {
    try {
      recommendations = parseRelatedResponse(await fetchText(input, relatedURL, pageHeaders(input)), input).filter(function (item) { return item.id !== url; }).slice(0, 18);
    } catch (_) {
      recommendations = [];
    }
  }
  const groups = playbackGroups(url, title);
  const detail = {
    pageType: 'detail',
    id: url,
    itemId: url,
    title: title,
    type: 'movie',
    poster: poster,
    backdrop: poster,
    detailImageAspectRatio: '16:9',
    imageHeaders: imageHeaders(url),
    posterHeaders: imageHeaders(url),
    backdropHeaders: imageHeaders(url),
    overview: description,
    runtimeMinutes: durationSeconds ? Math.max(1, Math.round(durationSeconds / 60)) : undefined,
    genres: genres,
    cast: castNames.map(function (name) { return { name: name, role: '演员' }; }),
    seasons: [],
    resourceGroups: groups,
    resourceSummary: { versionCount: 1, episodeCount: 0, defaultVersionId: 'source' },
    recommendations: recommendations.length ? [{ id: 'related', title: '相关推荐', style: 'discover.posterCompact', items: recommendations }] : [],
    providerIds: { source: WidgetMetadata.id, slug: videoSlug(url) }
  };
  return detail;
}

function getResourceVersions(ctx) {
  const input = normalizeContext(ctx);
  const url = detailURL(input);
  if (!url) throw new Error('SuperPorn 资源：缺少有效视频地址');
  return { itemId: url, groups: playbackGroups(url, stringValue(value(input, ['title'], ''))) };
}

async function resolvePlayback(ctx) {
  const input = normalizeContext(ctx);
  const detail = detailURL(input);
  if (!detail) throw new Error('SuperPorn 播放：缺少有效视频地址');
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const html = await fetchHTML(input, appendQuery(detail, { play: Date.now() + '-' + attempt }));
      const gateway = decodeHTML(firstNonEmpty(
        firstMatch(html, /<video\b[^>]*\bid=["']superporn_player["'][\s\S]{0,2500}?<source\b[^>]*\bsrc=["']([^"']+)["'][^>]*\btype=["']video\/mp4/i),
        firstMatch(html, /<source\b[^>]*\bsrc=["']([^"']+\.mp4[^"']*)["']/i)
      ));
      if (!/^https?:\/\//i.test(gateway)) throw new Error('详情页未提供 MP4 地址');
      const probe = await fetchResponse(gateway, playbackHeaders(detail), 12, 'HEAD');
      const status = responseStatus(probe);
      const finalURL = responseFinalURL(probe, gateway);
      if (status && (status < 200 || status >= 400)) throw new Error('MP4 网关返回 HTTP ' + status);
      if (!/^https?:\/\//i.test(finalURL)) throw new Error('网关没有返回有效视频地址');
      return {
        url: finalURL,
        container: 'mp4',
        headers: { 'User-Agent': SP_UA },
        startPositionSeconds: 0,
        isLive: false,
        streamKind: 'file'
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error('SuperPorn 播放解析：stage=refresh-and-resolve；两次刷新均失败；' + errorMessage(lastError));
}

function parseVideoCards(html, ctx) {
  const source = stringValue(html);
  const start = source.search(/<ul\b[^>]*\bid=["']videos-container["']/i);
  const scoped = start >= 0 ? source.slice(start, source.indexOf('</section>', start) > start ? source.indexOf('</section>', start) : source.length) : source;
  const marker = /<div\b[^>]*\bclass=["'][^"']*\bthumb-video\b[^"']*["'][^>]*>/gi;
  const hits = [];
  let match;
  while ((match = marker.exec(scoped))) hits.push(match.index);
  const items = [];
  const seen = {};
  hits.forEach(function (offset, index) {
    const block = scoped.slice(offset, index + 1 < hits.length ? hits[index + 1] : Math.min(scoped.length, offset + 14000));
    const href = decodeHTML(firstNonEmpty(
      firstMatch(block, /<a\b[^>]*\bclass=["'][^"']*\bthumb-duracion\b[^"']*["'][^>]*\bhref=["']([^"']+)/i),
      firstMatch(block, /<a\b[^>]*\bhref=["']([^"']+\/video\/[^"']+)["'][^>]*\bclass=["'][^"']*\bthumb-duracion\b/i)
    ));
    const url = absoluteURL(ctx, href);
    if (!/\/video\/[^/?#]+/i.test(url) || seen[url]) return;
    const title = cleanText(firstNonEmpty(
      firstMatch(block, /<a\b[^>]*\bclass=["'][^"']*\bthumb-video__description\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/i),
      firstMatch(block, /<img\b[^>]*\balt=["']([^"']+)/i),
      titleFromURL(url)
    ));
    const poster = absoluteURL(ctx, firstNonEmpty(
      firstMatch(block, /<img\b[^>]*\bdata-src=["']([^"']+)/i),
      firstMatch(block, /<img\b[^>]*\bsrc=["']([^"']+)/i)
    ));
    if (!title || !poster || /^data:/i.test(poster)) return;
    const duration = cleanText(firstMatch(block, /<span\b[^>]*\bclass=["'][^"']*\bduracion\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i));
    const series = cleanText(firstMatch(block, /<a\b[^>]*\bclass=["'][^"']*\binfo-uploader\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/i));
    const tags = parseInfoLinks(block, 'icon-folder-open-1').slice(0, 3);
    const item = {
      id: url,
      itemId: url,
      title: title,
      subtitle: series || tags.join(' · '),
      type: 'movie',
      poster: poster,
      backdrop: poster,
      aspectRatio: '16:9',
      metadataText: duration || undefined,
      badges: duration ? [duration] : [],
      imageHeaders: imageHeaders(url),
      posterHeaders: imageHeaders(url),
      backdropHeaders: imageHeaders(url),
      action: { type: 'detail', itemId: url }
    };
    seen[url] = true;
    items.push(item);
  });
  return items;
}

function parseRecommendationCards(html, ctx, currentURL) {
  const source = stringValue(html);
  const marker = source.search(/(?:Related videos|related-videos|global_api_related_video)/i);
  if (marker < 0) return [];
  return parseVideoCards(source.slice(Math.max(0, marker - 1000)), ctx).filter(function (item) { return item.id !== currentURL; });
}

function parseRelatedResponse(text, ctx) {
  let payload;
  try { payload = JSON.parse(stringValue(text)); } catch (_) { return []; }
  return parseRelatedPayload(payload, ctx);
}

function parseRelatedPayload(payload, ctx) {
  const videos = payload && Array.isArray(payload.videos) ? payload.videos : [];
  return videos.map(function (video) {
    const url = absoluteURL(ctx, video && video.url);
    const poster = absoluteURL(ctx, video && (video.thumb || video.sfwThumb));
    if (!url || !poster || !video.title) return null;
    return {
      id: url,
      itemId: url,
      title: cleanText(video.title),
      subtitle: video.series && video.series[0] ? cleanText(video.series[0].name) : '',
      type: 'movie',
      poster: poster,
      backdrop: poster,
      aspectRatio: '16:9',
      metadataText: cleanText(video.duration),
      badges: video.duration ? [cleanText(video.duration)] : [],
      imageHeaders: imageHeaders(url),
      posterHeaders: imageHeaders(url),
      backdropHeaders: imageHeaders(url),
      action: { type: 'detail', itemId: url }
    };
  }).filter(Boolean);
}

function parseChipLinks(html, iconClass) {
  const source = stringValue(html);
  const escaped = escapeRegExp(iconClass);
  const re = new RegExp("<a\\b[^>]*class=[\"'][^\"']*chip-link[^\"']*[\"'][^>]*>[\\s\\S]{0,300}?class=[\"'][^\"']*" + escaped + "[^\"']*[\"'][\\s\\S]{0,300}?<span\\b[^>]*>([\\s\\S]*?)<\\/span>[\\s\\S]*?<\\/a>", 'gi');
  const result = [];
  const seen = {};
  let match;
  while ((match = re.exec(source))) {
    const name = cleanText(match[1]);
    if (name && !seen[name]) { seen[name] = true; result.push(name); }
  }
  return result;
}

function parseInfoLinks(html, iconClass) {
  const source = stringValue(html);
  const escaped = escapeRegExp(iconClass);
  const re = new RegExp("<a\\b[^>]*>(?=[\\s\\S]{0,500}?class=[\"'][^\"']*" + escaped + ")[\\s\\S]{0,700}?<span\\b[^>]*class=[\"'][^\"']*thumb-video__info-name[^\"']*[\"'][^>]*>([\\s\\S]*?)<\\/span>[\\s\\S]*?<\\/a>", 'gi');
  const result = [];
  const seen = {};
  let match;
  while ((match = re.exec(source))) {
    const name = cleanText(match[1]);
    if (name && !seen[name]) { seen[name] = true; result.push(name); }
  }
  return result;
}

function playbackGroups(url, title) {
  return [{
    id: 'source',
    title: '原站线路',
    versions: [{
      id: 'source',
      versionId: 'source',
      name: '原画',
      title: '原画',
      subtitle: '播放时刷新签名',
      default: true,
      container: 'mp4',
      action: { type: 'play', itemId: url, versionId: 'source', title: title || undefined }
    }]
  }];
}

function categoryURL(ctx, category, page) {
  const path = stringValue(category && category.path, '/');
  const url = /^https?:\/\//i.test(path) ? path : baseURL(ctx) + (path.charAt(0) === '/' ? path : '/' + path);
  return appendQuery(url, { page: page > 1 ? page : undefined });
}

function categoryAction(category) { return { type: 'category', id: category.id, pageId: category.id, title: category.title, itemAspectRatio: '16:9' }; }
function exactCategory(id) { return SP_CATEGORIES.find(function (item) { return item.id === stringValue(id); }); }
function findCategory(id) { return exactCategory(id) || SP_CATEGORIES[0]; }
function toHero(item) { const hero = Object.assign({}, item); hero.action = { type: 'detail', itemId: item.id }; return hero; }

function parseTotalPages(html) {
  const source = stringValue(html);
  const re = /(?:[?&]page=|\/page\/)(\d+)/gi;
  let max = 0;
  let match;
  while ((match = re.exec(source))) max = Math.max(max, Number(match[1]) || 0);
  return max;
}

function hasNextPage(html, page, totalPages, itemCount) {
  if (totalPages) return page < totalPages;
  const source = stringValue(html);
  const next = page + 1;
  return new RegExp('(?:[?&]page=|/page/)' + next + '(?:[^0-9]|$)', 'i').test(source) || itemCount >= 24;
}

async function fetchHTML(ctx, url) {
  const response = await fetchResponse(url, pageHeaders(ctx), 15, 'GET');
  const text = await responseText(response);
  const status = responseStatus(response);
  if (status && (status < 200 || status >= 400)) throw new Error('站点返回 HTTP ' + status);
  if (!text) throw new Error('站点返回空内容');
  if (/Just a moment|cf-mitigated|Cloudflare Ray ID|captcha-container/i.test(text)) throw new Error('站点触发了人机验证');
  return text;
}

async function fetchText(ctx, url, headers) {
  const response = await fetchResponse(url, headers || pageHeaders(ctx), 15, 'GET');
  const text = await responseText(response);
  const status = responseStatus(response);
  if (status && (status < 200 || status >= 400)) throw new Error('站点返回 HTTP ' + status);
  if (!text) throw new Error('站点返回空内容');
  return text;
}

async function fetchResponse(url, headers, timeoutSeconds, method) {
  const verb = method || 'GET';
  const options = { headers: headers || {}, timeout: timeoutSeconds || 15 };
  if (typeof Widget !== 'undefined' && Widget && Widget.http) {
    if (verb === 'GET' && typeof Widget.http.get === 'function') return await Widget.http.get(url, options);
    if (typeof Widget.http.request === 'function') return await Widget.http.request({ url: url, method: verb, headers: options.headers, timeout: options.timeout });
    if (verb === 'HEAD' && typeof Widget.http.get === 'function') {
      return await Widget.http.get(url, { headers: withRangeProbe(options.headers), timeout: options.timeout });
    }
  }
  if (typeof $http !== 'undefined' && $http) {
    if (verb === 'GET' && typeof $http.get === 'function') return await $http.get(url, options);
    if (typeof $http.request === 'function') return await $http.request({ url: url, method: verb, headers: options.headers, timeout: options.timeout });
    if (verb === 'HEAD' && typeof $http.get === 'function') {
      return await $http.get(url, { headers: withRangeProbe(options.headers), timeout: options.timeout });
    }
  }
  if (typeof fetch === 'function') {
    const fetched = await fetch(url, { method: verb, headers: options.headers, redirect: 'follow' });
    return { data: verb === 'HEAD' ? '' : await fetched.text(), status: fetched.status, url: fetched.url, headers: fetched.headers };
  }
  throw new Error('当前环境没有可用的 HTTP 客户端');
}

function withRangeProbe(headers) {
  const result = {};
  Object.keys(headers || {}).forEach(function (key) { result[key] = headers[key]; });
  result.Range = 'bytes=0-1';
  return result;
}

async function responseText(response) {
  if (typeof response === 'string') return response;
  if (!response) return '';
  if (typeof response.text === 'function') { try { return await response.text(); } catch (_) {} }
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
    'User-Agent': SP_UA,
    Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
    Referer: baseURL(ctx) + '/enter'
  };
}

function playbackHeaders(referer) { return { 'User-Agent': SP_UA, Accept: 'video/mp4,*/*;q=0.8', Referer: referer }; }
function imageHeaders(referer) { return { 'User-Agent': SP_UA, Referer: referer || SP_DEFAULT_BASE + '/enter' }; }

function normalizeContext(ctx) {
  if (typeof ctx === 'string') { try { return JSON.parse(ctx); } catch (_) { return {}; } }
  return ctx && typeof ctx === 'object' ? ctx : {};
}

function value(ctx, names, fallback) {
  const input = normalizeContext(ctx);
  const pools = [input, input.params, input.config, input.settings, input.parameters, input.pagination, input.pageInfo].filter(function (item) { return item && typeof item === 'object'; });
  for (let i = 0; i < pools.length; i++) {
    for (let j = 0; j < names.length; j++) {
      const candidate = pools[i][names[j]];
      if (candidate !== undefined && candidate !== null && candidate !== '') return candidate;
    }
  }
  return fallback;
}

function baseURL(ctx) {
  const configured = stringValue(value(ctx, ['baseUrl', 'baseURL', 'siteUrl'], SP_DEFAULT_BASE)).trim();
  return (configured || SP_DEFAULT_BASE).replace(/\/+$/, '');
}

function detailURL(ctx) {
  const raw = stringValue(value(ctx, ['itemId', 'id', 'videoId', 'url'], '')).trim();
  if (!raw) return '';
  const url = absoluteURL(ctx, raw.indexOf('/video/') >= 0 ? raw : '/video/' + raw.replace(/^\/+/, ''));
  return /\/video\/[^/?#]+/i.test(url) ? url.split('#')[0].split('?')[0] : '';
}

function videoSlug(url) { return firstMatch(stringValue(url), /\/video\/([^/?#]+)/i); }

function absoluteURL(ctx, raw) {
  const value = decodeHTML(stringValue(raw)).trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (/^\/\//.test(value)) return 'https:' + value;
  const root = baseURL(ctx);
  return root + (value.charAt(0) === '/' ? value : '/' + value);
}

function appendQuery(url, params) {
  const pairs = [];
  Object.keys(params || {}).forEach(function (key) {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
  });
  if (!pairs.length) return url;
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + pairs.join('&');
}

function metaContent(html, attr, key) {
  const source = stringValue(html);
  const escaped = escapeRegExp(key);
  return decodeHTML(firstNonEmpty(
    firstMatch(source, new RegExp("<meta\\b[^>]*\\b" + attr + "=[\"']" + escaped + "[\"'][^>]*\\bcontent=[\"']([^\"']*)", 'i')),
    firstMatch(source, new RegExp("<meta\\b[^>]*\\bcontent=[\"']([^\"']*)[\"'][^>]*\\b" + attr + "=[\"']" + escaped + "[\"']", 'i'))
  ));
}

function pageTitle(html) { return cleanText(firstMatch(stringValue(html), /<title\b[^>]*>([\s\S]*?)<\/title>/i)); }
function titleFromURL(url) { return cleanText(decodeURIComponent(videoSlug(url) || '').replace(/[-_]+/g, ' ')); }
function firstMatch(text, regex) { const match = regex.exec(stringValue(text)); return match ? stringValue(match[1]) : ''; }
function firstNonEmpty() { for (let i = 0; i < arguments.length; i++) if (arguments[i] !== undefined && arguments[i] !== null && String(arguments[i]).trim()) return arguments[i]; return ''; }
function stringValue(value) { return value === undefined || value === null ? '' : String(value); }
function positiveInt(value, fallback) { const number = parseInt(value, 10); return Number.isFinite(number) && number >= 0 ? number : fallback; }
function escapeRegExp(value) { return stringValue(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function errorMessage(error) { return stringValue(error && (error.message || error.error || error)).replace(/\s+/g, ' ').trim() || '未知错误'; }

function cleanText(value) {
  return decodeHTML(stringValue(value).replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
}

function decodeHTML(value) {
  return stringValue(value)
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#(?:39|x27);/gi, "'")
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, function (_, number) { return String.fromCharCode(Number(number)); })
    .replace(/&#x([0-9a-f]+);/gi, function (_, number) { return String.fromCharCode(parseInt(number, 16)); });
}

function isoDurationSeconds(value) {
  const match = /^P(?:\d+D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i.exec(stringValue(value));
  if (!match) return 0;
  return (Number(match[1]) || 0) * 3600 + (Number(match[2]) || 0) * 60 + (Number(match[3]) || 0);
}

const exported = {
  WidgetMetadata: WidgetMetadata,
  getManifest: getManifest,
  getHome: getHome,
  getHomeSection: getHomeSection,
  getSection: getHomeSection,
  getCategory: getCategory,
  getDetail: getDetail,
  getResourceVersions: getResourceVersions,
  resolvePlayback: resolvePlayback,
  search: search,
  home: getHome,
  homeSection: getHomeSection,
  category: getCategory,
  detail: getDetail,
  versions: getResourceVersions,
  play: resolvePlayback,
  getPlayback: resolvePlayback,
  getPlayinfo: resolvePlayback,
  getSearch: search,
  quickSearch: search
};

Object.keys(exported).forEach(function (key) { try { globalThis[key] = exported[key]; } catch (_) {} });
if (typeof module !== 'undefined' && module && module.exports) module.exports = exported;
