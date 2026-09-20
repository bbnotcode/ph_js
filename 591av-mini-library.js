// @name 591AV / PPP.Porn Mini Library

const AV591_DEFAULT_BASE = 'https://591av.ws';
const AV591_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const AV591_LOGO = AV591_DEFAULT_BASE + '/favicon.ico';

const WidgetMetadata = {
  id: '591av-mini-library',
  name: '591AV',
  title: '591AV',
  version: '1.3.1',
  requiredVersion: '0.0.1',
  author: 'Alan huang',
  site: AV591_DEFAULT_BASE,
  logo: AV591_LOGO,
  icon: AV591_LOGO,
  description: '591AV（PPP.Porn）自定义媒体库，支持首页、分类、搜索、详情与原生 HLS 播放。'
};

const AV591_SECTIONS = [
  { id: 'new', title: '最新上架', path: '/new/', style: 'discover.spotlight' },
  { id: 'china-av', title: '中国 AV', path: '/categories/china-av/', style: 'discover.standard' },
  { id: 'japan-producer', title: '日本片商', path: '/categories/japan-producer/', style: 'discover.posterCompact' },
  { id: 'hot', title: '近期热门', path: '/pp1/hot/', style: 'discover.ranked', sort: 'video_viewed' }
];

const AV591_BROWSE = [
  { id: 'released', title: '流出' },
  { id: 'taiwan', title: '台湾' },
  { id: 'korea', title: '韩国' },
  { id: 'lesbian', title: '百合' },
  { id: 'first-person-pov', title: '主观视角' },
  { id: 'hongkong', title: '香港' },
  { id: 'dolfin-shorts', title: '真理裤' },
  { id: '91-tanhua', title: '探花' },
  { id: 'yoga-pants', title: '瑜伽裤' }
];

const AV591_SORTS = [
  { id: 'post_date', title: '最新', value: 'post_date' },
  { id: 'video_viewed', title: '最多观看', value: 'video_viewed' },
  { id: 'rating', title: '最多点赞', value: 'rating' },
  { id: 'duration', title: '最长时长', value: 'duration' }
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
      home: true, category: true, detail: true, search: true,
      resourceVersions: true, playback: true, aggregation: true,
      playbackHistory: true, resourceMatching: false
    },
    aggregation: { search: true, playbackHistory: true, resourceMatching: false },
    parameters: [{
      name: 'baseUrl', title: '站点地址', type: 'input',
      defaultValue: AV591_DEFAULT_BASE, value: AV591_DEFAULT_BASE, required: true,
      description: '591AV 当前可访问域名，例如 https://591av.ws。'
    }]
  };
}

async function getHome(ctx) {
  let latest = [];
  let latestError = '';
  try {
    latest = parseCards(await fetchText(ctx, listingURL(ctx, AV591_SECTIONS[0], 1, 'post_date')), ctx).slice(0, 20);
  } catch (error) {
    latestError = errorMessage(error);
  }
  return {
    pageType: 'home', id: '591av-home', title: WidgetMetadata.title,
    heroAspectRatio: '16:9', hero: latest.slice(0, 6),
    sections: [{
      id: 'browse', title: '分类浏览', style: 'discover.annualPosterStack', lazy: false,
      items: await buildBrowseCards(ctx, latest)
    }, {
      id: 'new', title: '最新上架', style: 'discover.spotlight', lazy: false,
      moreAction: categoryAction(AV591_SECTIONS[0]), items: latest,
      error: latestError || undefined
    }].concat(AV591_SECTIONS.slice(1).map(function (section) {
      return {
        id: section.id, title: section.title, style: section.style, lazy: true,
        loadAction: { type: 'custom', id: section.id, sectionId: section.id, title: section.title },
        moreAction: categoryAction(section), items: []
      };
    }))
  };
}

async function buildBrowseCards(ctx, fallbackItems) {
  const selected = AV591_BROWSE.slice(0, 6);
  const cards = [];
  for (let i = 0; i < selected.length; i += 1) {
    const category = selected[i];
    let previews = [];
    try {
      previews = parseCards(await fetchText(ctx, listingURL(ctx, category, 1, 'post_date')), ctx).slice(0, 3);
    } catch (_) {}
    if (!previews.length) continue;
    const lead = previews[0];
    cards.push({
      id: category.id, title: category.title, type: 'collection',
      poster: lead.poster, backdrop: lead.backdrop || lead.poster,
      imageHeaders: lead.imageHeaders, posterHeaders: lead.posterHeaders,
      backdropHeaders: lead.backdropHeaders, previewItems: previews,
      action: {
        type: 'category', id: category.id, pageId: category.id, title: category.title,
        page: 1, currentPage: 1, itemAspectRatio: '16:9'
      }
    });
  }
  return cards;
}

async function getHomeSection(ctx) {
  const section = findSection(value(ctx, ['sectionId', 'pageId', 'id'], 'new')) || AV591_SECTIONS[0];
  try {
    const items = parseCards(await fetchText(ctx, listingURL(ctx, section, 1, section.sort || 'post_date')), ctx).slice(0, 20);
    return {
      id: section.id, title: section.title, style: section.style, lazy: false,
      moreAction: categoryAction(section),
      items: section.style === 'discover.ranked' ? rankItems(items, 1) : items
    };
  } catch (error) {
    return { id: section.id, title: section.title, style: section.style, lazy: false, items: [], error: errorMessage(error) };
  }
}

async function getCategory(ctx) {
  const id = normalizeCategoryId(value(ctx, ['pageId', 'categoryId', 'id'], 'new'));
  const section = findSection(id);
  const category = section || { id: id, title: cleanText(ctx && ctx.title) || categoryTitle(id), path: categoryPath(id), style: 'discover.standard' };
  const page = pageFromContext(ctx, 1);
  const sort = stringValue(value(ctx, ['sort', 'sortBy', 'sortValue', 'sort_by'], category.sort || 'post_date'));
  try {
    const sourcePage = (page - 1) * 2 + 1;
    const payloads = await Promise.all([
      fetchText(ctx, listingURL(ctx, category, sourcePage, sort, true)).catch(function () { return ''; }),
      fetchText(ctx, listingURL(ctx, category, sourcePage + 1, sort, true)).catch(function () { return ''; })
    ]);
    const firstHTML = payloads[0];
    const secondHTML = payloads[1];
    if (!firstHTML && !secondHTML) throw new Error('源站没有返回第 ' + page + ' 页内容');
    let items = dedupeItems(parseCards(firstHTML, ctx).concat(parseCards(secondHTML, ctx)));
    if (category.style === 'discover.ranked') items = rankItems(items, page);
    const sourceTotalPages = Math.max(parseTotalPages(firstHTML), parseTotalPages(secondHTML));
    const total = Math.max(parseTotalItems(firstHTML), parseTotalItems(secondHTML));
    const pageSize = 48;
    const totalPages = total ? Math.ceil(total / pageSize) : (sourceTotalPages ? Math.ceil(sourceTotalPages / 2) : 0);
    const more = total ? page * pageSize < total : (totalPages ? page < totalPages : items.length >= 24);
    return {
      pageType: 'category', id: id, title: category.title, style: 'media.posterGrid',
      contentType: 'movie', lazy: false, isLazy: false,
      itemAspectRatio: '16:9', page: page, currentPage: page, pageNumber: page, pageIndex: page,
      nextPage: more ? page + 1 : null,
      totalPages: totalPages || undefined, pagecount: totalPages || undefined,
      total: total || undefined, limit: pageSize, pageSize: pageSize,
      hasMore: more, hasNextPage: more, canLoadMore: more,
      pagination: {
        page: page, currentPage: page, pageNumber: page, pageIndex: page,
        nextPage: more ? page + 1 : null, hasMore: more,
        totalPages: totalPages || undefined, pagecount: totalPages || undefined,
        total: total || undefined, limit: pageSize, pageSize: pageSize
      },
      selectedSortValue: sort,
      sort: AV591_SORTS, items: items
    };
  } catch (error) {
    return {
      pageType: 'category', id: id, title: category.title, style: 'media.posterGrid',
      itemAspectRatio: '16:9', page: page, hasMore: false,
      selectedSortValue: sort, sort: AV591_SORTS, items: [], error: errorMessage(error)
    };
  }
}

async function getDetail(ctx) {
  const id = videoSlug(value(ctx, ['itemId', 'id', 'videoId'], ''));
  if (!id) throw new Error('591AV：缺少有效影片 ID');
  const url = baseURL(ctx) + '/v/' + encodeURIComponent(id) + '/';
  const html = await fetchText(ctx, url);
  const title = cleanText(firstNonEmpty(metaContent(html, 'property', 'og:title'), firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i), id));
  const poster = absoluteURL(ctx, firstNonEmpty(metaContent(html, 'property', 'og:image'), pickImage(html)));
  const durationSeconds = positiveInt(metaContent(html, 'property', 'video:duration'), 0);
  const date = metaContent(html, 'property', 'video:release_date');
  const genres = metaContents(html, 'property', 'video:tag').map(cleanText).filter(Boolean);
  const stream = parseStream(html);
  const groups = stream ? playbackGroups(id, title) : [];
  const recommendations = parseCards(recommendationHTML(html), ctx).filter(function (item) { return videoSlug(item.id) !== id; }).slice(0, 16);
  return {
    pageType: 'detail', id: itemId(id), title: title, type: 'movie',
    poster: poster, backdrop: poster, detailImageAspectRatio: '16:9',
    imageHeaders: imageHeaders(ctx, url), posterHeaders: imageHeaders(ctx, url), backdropHeaders: imageHeaders(ctx, url),
    overview: cleanText(metaContent(html, 'property', 'og:description') || metaContent(html, 'name', 'description')),
    year: date ? positiveInt(String(date).slice(0, 4), 0) || undefined : undefined,
    runtimeMinutes: durationSeconds ? Math.ceil(durationSeconds / 60) : undefined,
    genres: genres, resourceGroups: groups,
    resourceSummary: { versionCount: groups.length ? 1 : 0, episodeCount: 0, defaultVersionId: groups.length ? 'source' : '' },
    recommendations: recommendations.length ? [{ id: 'related', title: '猜你喜欢', style: 'discover.posterCompact', items: recommendations }] : [],
    providerIds: { source: WidgetMetadata.id, videoId: id }
  };
}

function getResourceVersions(ctx) {
  const id = videoSlug(value(ctx, ['itemId', 'id', 'videoId'], ''));
  return id ? playbackGroups(id, stringValue(value(ctx, ['title'], ''))) : [];
}

async function resolvePlayback(ctx) {
  const id = videoSlug(value(ctx, ['itemId', 'id', 'videoId'], ''));
  if (!id) throw new Error('591AV 播放：缺少有效影片 ID');
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const detailURL = baseURL(ctx) + '/v/' + encodeURIComponent(id) + '/?play=' + Date.now() + '-' + attempt;
      const html = await fetchText(ctx, detailURL, { noCache: true });
      const stream = parseStream(html);
      if (!stream) throw new Error('详情页没有提供 HLS 地址');
      // 591AV 与 PB365 一样会生成一次性 HLS 线路。这里绝不能预请求清单，
      // 否则原生播放器的第二次访问会被替换成约 5 秒的 x99dh 引流片。
      const headers = playbackHeaders(ctx, detailURL);
      return {
        url: stream, container: 'm3u8', headers: headers,
        startPositionSeconds: 0, isLive: false, streamKind: 'vod'
      };
    } catch (error) { lastError = error; }
  }
  throw new Error('591AV 播放解析失败：' + errorMessage(lastError));
}

async function search(ctx) {
  const keyword = cleanText(value(ctx, ['query', 'keyword', 'text', 'q'], ''));
  const page = pageFromContext(ctx, 1);
  if (!keyword) return { pageType: 'search', title: '搜索', keyword: '', page: page, hasMore: false, items: [] };
  try {
    const html = await fetchText(ctx, searchURL(ctx, keyword, page));
    const items = parseCards(html, ctx);
    const totalPages = parseTotalPages(html);
    const total = parseTotalItems(html);
    const pageSize = 24;
    const more = totalPages ? page < totalPages : items.length >= 12;
    return {
      pageType: 'search', id: '591av-search', title: '搜索：' + keyword,
      query: keyword, keyword: keyword, style: 'media.posterGrid', itemAspectRatio: '16:9',
      page: page, currentPage: page, pageNumber: page, pageIndex: page,
      nextPage: more ? page + 1 : null,
      totalPages: totalPages || undefined, pagecount: totalPages || undefined,
      total: total || undefined, limit: pageSize, pageSize: pageSize,
      hasMore: more, items: items
    };
  } catch (error) {
    return { pageType: 'search', title: '搜索：' + keyword, keyword: keyword, page: page, hasMore: false, items: [], error: errorMessage(error) };
  }
}

function playbackGroups(id, title) {
  return [{
    id: 'online', title: '在线播放',
    versions: [{
      id: 'source', name: '源站线路', subtitle: '播放时生成一次性线路，请勿缓存', default: true,
      action: { type: 'play', itemId: itemId(id), versionId: 'source', title: title || undefined }
    }]
  }];
}

function parseCards(html, ctx) {
  const chunks = String(html || '').split(/class=["']item\s+card-video\b/i).slice(1);
  const seen = {};
  return chunks.map(function (chunk) {
    const href = decodeHTML(firstMatch(chunk, /href=["']([^"']*\/v\/[a-z0-9]+\/)["']/i));
    const id = videoSlug(href);
    if (!id || seen[id]) return null;
    seen[id] = true;
    const title = cleanText(firstNonEmpty(
      firstMatch(chunk, /<h[1-6][^>]*card-video__title[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i),
      attribute(firstMatch(chunk, /<img\b[\s\S]*?>/i), 'alt'), id
    ));
    const imageTag = firstMatch(chunk, /(<img\b[\s\S]*?>)/i);
    const poster = absoluteURL(ctx, firstNonEmpty(attribute(imageTag, 'data-src'), attribute(imageTag, 'data-original'), attribute(imageTag, 'src')));
    const duration = cleanText(firstMatch(chunk, /card-video__duration[^>]*>([\s\S]*?)<\//i));
    const views = cleanText(firstMatch(chunk, /card-video__stats[\s\S]*?<span[^>]*>\s*<span[^>]*class=["']num["'][^>]*>([\s\S]*?)<\/span>/i));
    const headers = imageHeaders(ctx, href);
    return {
      id: itemId(id), title: title, subtitle: [duration, views ? views + ' 观看' : ''].filter(Boolean).join(' · '),
      type: 'movie', poster: poster, backdrop: poster, aspectRatio: '16:9', remarks: duration || undefined,
      metadataText: views ? views + ' 观看' : undefined,
      imageHeaders: headers, posterHeaders: headers, backdropHeaders: headers,
      action: { type: 'detail', itemId: itemId(id), videoId: id }
    };
  }).filter(Boolean);
}

function dedupeItems(items) {
  const seen = {};
  return (items || []).filter(function (item) {
    const id = item && item.id;
    if (!id || seen[id]) return false;
    seen[id] = true;
    return true;
  });
}

function listingURL(ctx, category, page, sort, forceAsync) {
  const base = baseURL(ctx);
  const path = category.path || categoryPath(category.id);
  if (positiveInt(page, 1) <= 1 && !(forceAsync && category.id === 'new')) return base + path;
  const block = category.id === 'new'
    ? 'list_videos_latest_videos_list'
    : (category.id === 'watching' ? 'list_videos_being_watched_videos' : 'list_videos_common_videos_list');
  return base + path + '?mode=async&function=get_block&block_id=' + block + '&sort_by=' + encodeURIComponent(sort || 'post_date') + '&from=' + page;
}

function searchURL(ctx, keyword, page) {
  const encoded = encodeURIComponent(keyword);
  return baseURL(ctx) + '/search/' + encoded + '/?mode=async&function=get_block&block_id=list_videos_videos_list_search_result&q=' + encoded + '&from=' + page;
}

function categoryPath(id) {
  if (id === 'new') return '/new/';
  if (id === 'hot') return '/pp1/hot/';
  return '/categories/' + encodeURIComponent(id) + '/';
}

function categoryAction(category) {
  return {
    type: 'category', id: category.id, pageId: category.id, title: category.title,
    page: 1, currentPage: 1, itemAspectRatio: '16:9'
  };
}

function findSection(id) {
  return AV591_SECTIONS.filter(function (entry) { return entry.id === normalizeCategoryId(id); })[0];
}

function normalizeCategoryId(valueToNormalize) {
  const raw = stringValue(valueToNormalize).replace(/^category:/, '');
  return raw.replace(/^\/+|\/+$/g, '').split('/').pop() || 'new';
}

function categoryTitle(id) {
  const found = AV591_BROWSE.filter(function (entry) { return entry.id === id; })[0];
  return found ? found.title : id;
}

function itemId(id) { return '591av:' + videoSlug(id); }

function videoSlug(valueToParse) {
  const raw = stringValue(valueToParse);
  const match = raw.match(/\/v\/([a-z0-9]+)\/?/i) || raw.match(/^591av(?:-play)?:([a-z0-9]+)$/i) || raw.match(/^([a-z0-9]{6})$/i);
  return match ? match[1].toLowerCase() : '';
}

function parseStream(html) {
  return decodeHTML(firstNonEmpty(
    firstMatch(html, /\bvar\s+stream\s*=\s*['"]([^'"]+)['"]/i),
    firstMatch(html, /\bstream\s*:\s*['"]([^'"]+\.m3u8[^'"]*)['"]/i)
  ));
}

function recommendationHTML(html) {
  const marker = String(html || '').search(/猜你喜欢|相关推荐|更多精选/i);
  return marker >= 0 ? String(html).slice(marker) : String(html || '');
}

function hasMore(html, page, items) {
  if (!items.length) return false;
  const max = positiveInt(firstMatch(html, /data-max-queries=["'](\d+)/i), 0);
  if (max) return page < max;
  return items.length >= 12;
}

function parseTotalPages(html) {
  const source = String(html || '');
  let max = positiveInt(firstMatch(source, /data-max-queries=["'](\d+)/i), 0);
  const patterns = [/[?&](?:from|page)=(\d+)/gi, /data-parameters=["'][^"']*from:(\d+)/gi];
  for (let i = 0; i < patterns.length; i += 1) {
    let match;
    while ((match = patterns[i].exec(source))) max = Math.max(max, Number(match[1]) || 0);
  }
  return max;
}

function parseTotalItems(html) {
  const source = String(html || '');
  let max = 0;
  const re = /([\d,]+)\s*(?:影片|视频)/gi;
  let match;
  while ((match = re.exec(source))) max = Math.max(max, Number(String(match[1]).replace(/,/g, '')) || 0);
  return max;
}

function rankItems(items, page) {
  return items.map(function (item, index) {
    const copy = Object.assign({}, item);
    copy.rank = (positiveInt(page, 1) - 1) * Math.max(items.length, 1) + index + 1;
    return copy;
  });
}

function imageHeaders(ctx, referer) {
  return { 'User-Agent': AV591_UA, Referer: referer || baseURL(ctx) + '/' };
}

function playbackHeaders(ctx, referer) {
  return {
    'User-Agent': AV591_UA,
    Accept: 'application/vnd.apple.mpegurl,application/x-mpegURL,*/*',
    Referer: referer || baseURL(ctx) + '/enter'
  };
}

async function fetchText(ctx, url, options) {
  const response = await fetchResponse(url, requestHeaders(ctx, options), 15);
  const status = responseStatus(response);
  const text = await responseText(response);
  if (status && (status < 200 || status >= 400)) throw new Error('HTTP ' + status + '：' + url);
  if (/Just a moment|cf-mitigated|Cloudflare Ray ID/i.test(text)) throw new Error('源站返回 Cloudflare 验证页');
  if (!text) throw new Error('源站返回空内容');
  return text;
}

function requestHeaders(ctx, options) {
  const headers = { 'User-Agent': AV591_UA, Accept: 'text/html,application/xhtml+xml,application/vnd.apple.mpegurl,*/*;q=0.8', 'Accept-Language': 'zh-CN,zh;q=0.9', Referer: baseURL(ctx) + '/' };
  if (options && options.noCache) { headers['Cache-Control'] = 'no-cache'; headers.Pragma = 'no-cache'; }
  return headers;
}

async function fetchResponse(url, headers, timeoutSeconds) {
  const opts = { headers: headers || {}, timeout: timeoutSeconds || 15 };
  if (typeof $http !== 'undefined') {
    if (typeof $http.get === 'function') return await $http.get(url, opts);
    if (typeof $http.request === 'function') return await $http.request(Object.assign({ url: url, method: 'GET' }, opts));
  }
  if (typeof Widget !== 'undefined' && Widget.http) {
    if (typeof Widget.http.get === 'function') return await Widget.http.get(url, opts);
    if (typeof Widget.http.request === 'function') return await Widget.http.request(Object.assign({ url: url, method: 'GET' }, opts));
  }
  if (typeof fetch === 'function') return await fetch(url, { method: 'GET', headers: headers || {}, redirect: 'follow' });
  throw new Error('当前环境没有可用的 HTTP 客户端');
}

async function responseText(response) {
  if (response == null) return '';
  if (typeof response === 'string') return response;
  if (typeof response.text === 'function') return await response.text();
  if (typeof response.body === 'string') return response.body;
  if (typeof response.data === 'string') return response.data;
  if (response.data && typeof response.data.html === 'string') return response.data.html;
  if (response.data && typeof response.data.body === 'string') return response.data.body;
  return '';
}

function responseStatus(response) {
  return positiveInt(response && (response.status || response.statusCode || (response.response && response.response.status)), 0);
}

function responseFinalURL(response, fallback) {
  return stringValue(response && (response.finalURL || response.urlEffective || response.responseURL || response.url || (response.response && response.response.url))) || fallback;
}

function baseURL(ctx) {
  let raw = stringValue(value(ctx, ['baseUrl'], AV591_DEFAULT_BASE)) || AV591_DEFAULT_BASE;
  raw = raw.replace(/\/+$/, '');
  return /^https?:\/\//i.test(raw) ? raw : AV591_DEFAULT_BASE;
}

function value(ctx, keys, fallback) {
  const source = normalizeContext(ctx);
  const containers = [source, source.params, source.config, source.settings, source.parameters, source.pagination, source.pageInfo].filter(Boolean);
  for (let i = 0; i < containers.length; i += 1) {
    for (let j = 0; j < keys.length; j += 1) {
      const found = containers[i][keys[j]];
      if (found !== undefined && found !== null && found !== '') return found;
    }
  }
  return fallback;
}

function pageFromContext(ctx, fallback) {
  const source = normalizeContext(ctx);
  const boxes = [source.pagination, source.pageInfo, source, source.params, source.config, source.settings, source.parameters].filter(Boolean);
  const keys = ['page', 'pg', 'currentPage', 'pageNumber', 'nextPage', 'from', 'pageIndex'];
  let page = 0;
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = 0; j < keys.length; j += 1) {
      const candidate = Math.floor(Number(boxes[i][keys[j]]));
      if (Number.isFinite(candidate) && candidate > page) page = candidate;
    }
  }
  return page > 0 ? page : fallback;
}

function normalizeContext(ctx) {
  if (typeof ctx === 'string') { try { return JSON.parse(ctx); } catch (_) { return {}; } }
  return ctx && typeof ctx === 'object' ? ctx : {};
}

function metaContent(html, attr, name) {
  const escaped = escapeRegExp(name);
  return decodeHTML(firstNonEmpty(
    firstMatch(html, new RegExp('<meta[^>]*' + attr + '=["\\\']' + escaped + '["\\\'][^>]*content=["\\\']([^"\\\']*)', 'i')),
    firstMatch(html, new RegExp('<meta[^>]*content=["\\\']([^"\\\']*)["\\\'][^>]*' + attr + '=["\\\']' + escaped + '["\\\']', 'i'))
  ));
}

function metaContents(html, attr, name) {
  const tags = String(html || '').match(/<meta\b[^>]*>/gi) || [];
  return tags.filter(function (tag) { return attribute(tag, attr) === name; }).map(function (tag) { return decodeHTML(attribute(tag, 'content')); });
}

function pickImage(html) {
  const tag = firstMatch(html, /(<img\b[^>]*(?:data-src|src)=["'][^"']+["'][^>]*>)/i);
  return firstNonEmpty(attribute(tag, 'data-src'), attribute(tag, 'src'));
}

function attribute(tag, name) {
  if (!tag) return '';
  const match = String(tag).match(new RegExp('\\b' + escapeRegExp(name) + '\\s*=\\s*["\\\']([^"\\\']*)["\\\']', 'i'));
  return match ? decodeHTML(match[1]) : '';
}

function firstMatch(text, regex) { const match = String(text || '').match(regex); return match ? (match[1] || '') : ''; }
function firstNonEmpty() { for (let i = 0; i < arguments.length; i += 1) if (arguments[i] !== undefined && arguments[i] !== null && String(arguments[i]).trim()) return String(arguments[i]); return ''; }
function stringValue(valueToString) { return valueToString == null ? '' : String(valueToString).trim(); }
function positiveInt(valueToParse, fallback) { const number = parseInt(valueToParse, 10); return Number.isFinite(number) && number > 0 ? number : fallback; }
function cleanText(valueToClean) { return decodeHTML(String(valueToClean || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()); }
function decodeHTML(valueToDecode) { return String(valueToDecode || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); }); }
function absoluteURL(ctx, url) { const valueToResolve = decodeHTML(url); if (!valueToResolve) return ''; if (/^https?:\/\//i.test(valueToResolve)) return valueToResolve; if (/^\/\//.test(valueToResolve)) return 'https:' + valueToResolve; return baseURL(ctx) + (valueToResolve.charAt(0) === '/' ? '' : '/') + valueToResolve; }
function escapeRegExp(valueToEscape) { return String(valueToEscape).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function errorMessage(error) { return error && error.message ? error.message : String(error || '未知错误'); }

const api = { getManifest, getHome, getHomeSection, getCategory, getDetail, getResourceVersions, resolvePlayback, search };
Object.assign(globalThis, api);
if (typeof module !== 'undefined') module.exports = Object.assign({
  _test: { parseCards, parseStream, parseTotalPages, parseTotalItems, listingURL, searchURL, videoSlug }
}, api);
