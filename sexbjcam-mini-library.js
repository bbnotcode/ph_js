// @name SexBJCam Mini Library

const SEXBJCAM_DEFAULT_BASE = 'https://sexbjcam.com';
const SEXBJCAM_LOGO = 'https://sexbjcam.com/wp-content/uploads/2024/04/cropped-sexbjcam-logo-192x192.png';
const SEXBJCAM_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';

const WidgetMetadata = {
  id: 'sexbjcam-mini-library',
  name: 'SexBJCam',
  title: 'SexBJCam',
  version: '1.1.7',
  author: 'Alan huang',
  logo: SEXBJCAM_LOGO,
  icon: SEXBJCAM_LOGO,
  site: SEXBJCAM_DEFAULT_BASE,
  description: 'SexBJCam 自定义媒体库，支持最新、最多观看、分类、搜索、详情与动态 HLS 播放解析。'
};

const SEXBJCAM_SECTIONS = [
  { id: 'latest', title: '最近更新', path: '/?filter=latest', style: 'discover.spotlight' },
  { id: 'most-viewed', title: '最多观看', path: '/?filter=most-viewed', style: 'discover.ranked' },
  { id: 'korean-bj', title: 'Korean BJ', path: '/category/korean-bj/', style: 'discover.standard' },
  { id: 'chinese-girl', title: 'Chinese Girl', path: '/category/chinese-gril/', style: 'discover.standard' }
];
let SEXBJCAM_REQUEST_NONCE = 0;
const SEXBJCAM_QUALITY_CACHE = {};
const SEXBJCAM_QUALITY_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

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
      home: true, category: true, detail: true, search: true,
      resourceVersions: true, playback: true, resourceMatching: false
    },
    aggregation: { search: true, playbackHistory: true, resourceMatching: false },
    parameters: [{
      name: 'baseURL',
      title: '站点地址',
      type: 'input',
      defaultValue: SEXBJCAM_DEFAULT_BASE,
      value: SEXBJCAM_DEFAULT_BASE,
      required: true,
      description: '网站更换域名后可在这里修改。'
    }]
  };
}

async function getHome(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  let immediate = [];
  try { immediate = (await loadSectionItems(ctx, SEXBJCAM_SECTIONS[0], 1)).slice(0, 20); } catch (_) {}
  return {
    pageType: 'home',
    id: 'sexbjcam-home',
    title: WidgetMetadata.title,
    heroAspectRatio: '16:9',
    hero: immediate.slice(0, 8),
    sections: SEXBJCAM_SECTIONS.map(function (section, index) {
      return {
        id: section.id,
        title: section.title,
        style: section.style,
        lazy: index !== 0,
        loadAction: { type: 'custom', id: section.id, sectionId: section.id, title: section.title },
        moreAction: categoryAction(section),
        items: index === 0 ? immediate : []
      };
    })
  };
}

async function getHomeSection(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const section = findSection(contextValue(ctx, 'sectionId') || contextValue(ctx, 'id')) || SEXBJCAM_SECTIONS[0];
  try {
    return {
      id: section.id, title: section.title, style: section.style, lazy: false,
      moreAction: categoryAction(section),
      items: (await loadSectionItems(ctx, section, 1)).slice(0, 20)
    };
  } catch (error) {
    return {
      id: section.id, title: section.title, style: section.style, lazy: false, items: [],
      error: stringValue(error && (error.message || error))
    };
  }
}

async function getCategory(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const section = findSection(contextValue(ctx, 'pageId') || contextValue(ctx, 'id')) || SEXBJCAM_SECTIONS[0];
  const page = positiveInt(pageValue(ctx), 1);
  const html = await fetchText(ctx, categoryURL(ctx, section, page), requestHeaders(ctx, baseURL(ctx) + '/'));
  const parsedItems = parseListHtml(ctx, html);
  const items = page > 1 && parsedItems.length >= 30 ? parsedItems.slice(10) : parsedItems;
  return {
    pageType: 'category', id: section.id, title: section.title,
    style: 'media.posterGrid', itemAspectRatio: '16:9',
    page: page, nextPage: page + 1, hasMore: items.length > 0 && hasNextPage(html, page),
    items: items
  };
}

async function getDetail(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const detailURL = detailURLFromContext(ctx);
  if (!detailURL) throw new Error('SexBJCam 详情参数无效');
  const html = await fetchText(ctx, detailURL, requestHeaders(ctx, baseURL(ctx) + '/'));
  const detail = parseDetailHtml(ctx, html, detailURL);
  const related = parseListHtml(ctx, html).filter(function (item) { return item.id !== detailURL; }).slice(0, 18);
  let qualityVersions = [];
  let qualityDiscoveryFailed = false;
  if (detail.embedURL) {
    try {
      qualityVersions = await loadQualityVersions(ctx, detailURL, detail.title, detail.embedURL);
    } catch (_) {
      qualityDiscoveryFailed = true;
    }
  }
  const resourceGroups = qualityVersions.length
    ? [{ id: 'quality', title: '画质', versions: qualityVersions }]
    : (qualityDiscoveryFailed ? [] : resourceGroupsFor(ctx, detailURL, detail.title, detail.embedURL));
  return {
    pageType: 'detail', id: detailURL, type: 'movie', title: detail.title,
    poster: detail.poster, backdrop: detail.poster, detailImageAspectRatio: '16:9',
    imageHeaders: imageHeaders(ctx, detailURL),
    posterHeaders: imageHeaders(ctx, detailURL),
    backdropHeaders: imageHeaders(ctx, detailURL),
    overview: detail.overview,
    runtimeMinutes: isoDurationMinutes(detail.duration),
    genres: detail.categories,
    cast: detail.actor ? [{
      name: detail.actor, role: '主播',
      action: detail.actorURL ? { type: 'category', pageId: 'url:' + detail.actorURL, title: detail.actor, itemAspectRatio: '16:9' } : undefined
    }] : [],
    resourceGroups: resourceGroups,
    recommendations: related.length ? [{ id: 'related', title: '相关推荐', style: 'discover.standard', items: related }] : []
  };
}

async function getResourceVersions(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const detailURL = detailURLFromContext(ctx);
  if (!detailURL) return { itemId: '', groups: [] };
  let embedURL = embedURLFromContext(ctx);
  let title = stringValue(contextValue(ctx, 'title')) || '默认线路';
  if (!embedURL) {
    const detail = parseDetailHtml(ctx, await fetchText(ctx, detailURL, requestHeaders(ctx, baseURL(ctx) + '/')), detailURL);
    embedURL = detail.embedURL;
    title = detail.title || title;
  }
  let versions = [];
  if (embedURL) {
    versions = await loadQualityVersions(ctx, detailURL, title, embedURL);
  }
  return {
    itemId: detailURL,
    groups: versions.length ? [{ id: 'quality', title: '画质', versions: versions }] :
      resourceGroupsFor(ctx, detailURL, title, embedURL)
  };
}

async function resolvePlayback(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const detailURL = detailURLFromContext(ctx);
  let embedURL = embedURLFromContext(ctx);
  if (!embedURL && detailURL) {
    const detail = parseDetailHtml(ctx, await fetchText(ctx, detailURL, requestHeaders(ctx, baseURL(ctx) + '/')), detailURL);
    embedURL = detail.embedURL;
  }
  if (!embedURL) throw new Error('没有解析到 SexBJCam 播放器地址');
  const html = await fetchPlayerText(ctx, embedURL);
  const masterURL = extractMediaURL(html, embedURL);
  if (!masterURL) throw new Error('没有解析到 SexBJCam HLS 地址');
  const origin = urlOrigin(embedURL);
  const headers = { Referer: embedURL, Origin: origin, 'User-Agent': SEXBJCAM_UA };
  const quality = qualityFromContext(ctx);
  let mediaURL = masterURL;
  if (/\.m3u8(?:$|[?#])/i.test(masterURL)) {
    try {
      const manifest = await fetchSignedManifestText(ctx, masterURL, headers);
      const variants = parseHlsVariants(manifest, masterURL);
      const selected = selectVariant(variants, quality);
      if (selected && selected.url) mediaURL = selected.url;
    } catch (_) {}
  }
  return {
    url: mediaURL, container: mediaContainer(mediaURL),
    headers: headers,
    startPositionSeconds: 0, isLive: false,
    streamKind: /\.m3u8(?:$|[?#])/i.test(mediaURL) ? 'hls' : 'file'
  };
}

async function search(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const query = cleanText(contextValue(ctx, 'query') || contextValue(ctx, 'keyword') || contextValue(ctx, 'text'));
  const page = positiveInt(pageValue(ctx), 1);
  if (!query) return { pageType: 'search', title: '搜索', keyword: '', page: page, hasMore: false, items: [] };
  let url = baseURL(ctx) + '/?s=' + encodeURIComponent(query);
  if (page > 1) url = baseURL(ctx) + '/page/' + page + '/?s=' + encodeURIComponent(query);
  const html = await fetchText(ctx, url, requestHeaders(ctx, baseURL(ctx) + '/'));
  const parsedItems = parseListHtml(ctx, html);
  const items = page > 1 && parsedItems.length >= 30 ? parsedItems.slice(10) : parsedItems;
  return {
    pageType: 'search', title: '搜索：' + query, keyword: query,
    style: 'media.posterGrid', itemAspectRatio: '16:9',
    page: page, nextPage: page + 1, hasMore: items.length > 0 && hasNextPage(html, page), items: items
  };
}

function parseListHtml(ctx, html) {
  const fullSource = String(html || '');
  const listStart = fullSource.search(/<div\b[^>]*class=["'][^"']*\bvideos-list\b[^"']*["'][^>]*>/i);
  const listTail = listStart >= 0 ? fullSource.slice(listStart) : fullSource;
  const listEnd = listTail.search(/<div\b[^>]*class=["'][^"']*\bpagination\b[^"']*["'][^>]*>/i);
  const source = listEnd > 0 ? listTail.slice(0, listEnd) : listTail;
  const items = [], seen = {};
  const starts = [], articlePattern = /<article\b[^>]*class=["'][^"']*\bloop-video\b[^"']*["'][^>]*>/gi;
  let marker;
  while ((marker = articlePattern.exec(source)) !== null) starts.push(marker.index);
  for (let index = 0; index < starts.length; index += 1) {
    const block = source.slice(starts[index], starts[index + 1] || source.length);
    const openingTag = firstMatch(block, /^(<article\b[^>]*>)/i)[0];
    if (/\bsticky\b/i.test(openingTag)) continue;
    const link = firstMatch(block, /<a\b[^>]*href=["']([^"']*\/\d{4}\/\d{2}\/\d{2}\/[^"']+)["'][^>]*>/i)[0];
    const href = absoluteURL(ctx, decodeEntities(link));
    if (!href || seen[href]) continue;
    const imgTag = firstMatch(block, /<img\b([^>]*)>/i)[0];
    if (!imgTag) continue;
    const poster = absoluteURL(ctx, firstNonEmpty(
      attributeFromTag(imgTag, 'data-src'), attributeFromTag(imgTag, 'data-original'),
      attributeFromTag(imgTag, 'data-lazy-src'), attributeFromTag(imgTag, 'src')
    ));
    const title = cleanText(firstNonEmpty(
      attributeFromTag(imgTag, 'alt'),
      firstMatch(block, /class=["'][^"']*(?:title|video-title)[^"']*["'][^>]*>([\s\S]*?)<\//i)[0],
      block
    )).replace(/^\d{1,2}:\d{2}(?::\d{2})?\s*/, '');
    if (!poster || !title) continue;
    seen[href] = true;
    const duration = cleanText(firstMatch(block, /(\d{1,2}:\d{2}(?::\d{2})?)/i)[0]);
    items.push({
      id: href, title: title, subtitle: duration || undefined, metadataText: duration || undefined,
      type: 'movie', poster: poster, backdrop: poster, aspectRatio: '16:9',
      imageHeaders: imageHeaders(ctx, href),
      action: { type: 'detail', itemId: href, id: href, url: href, title: title }
    });
  }
  return items;
}

function parseDetailHtml(ctx, html, detailURL) {
  const article = firstMatch(html, /(<article\b[^>]*\bitemprop=["']video["'][^>]*>[\s\S]*?<\/article>)/i)[0] || String(html || '');
  const title = cleanText(firstNonEmpty(
    metaItemContent(article, 'name'), metaContent(html, 'property', 'og:title'),
    firstMatch(article, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i)[0],
    firstMatch(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i)[0]
  )).replace(/\s*[–|-]\s*sexbjcam\s*$/i, '');
  const poster = absoluteURL(ctx, firstNonEmpty(
    metaItemContent(article, 'thumbnailUrl'), metaContent(html, 'name', 'twitter:image'),
    metaContent(html, 'property', 'og:image')
  ));
  const embedURL = absoluteExternalURL(detailURL, firstNonEmpty(
    metaItemContent(article, 'embedURL'),
    firstMatch(article, /<iframe\b[^>]*src=["']([^"']+)["']/i)[0]
  ));
  const actorMatch = firstMatch(article, /id=["']video-actors["'][\s\S]*?<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
  const categories = [], categorySeen = {};
  const categoryPattern = /<a\b[^>]*href=["'][^"']*\/category\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/gi;
  let categoryMatch;
  while ((categoryMatch = categoryPattern.exec(article)) !== null) {
    const value = cleanText(categoryMatch[1]);
    if (value && !categorySeen[value]) { categorySeen[value] = true; categories.push(value); }
  }
  return {
    title: title || 'Untitled', poster: poster, embedURL: embedURL,
    duration: metaItemContent(article, 'duration'),
    overview: cleanText(firstNonEmpty(metaItemContent(article, 'description'), metaContent(html, 'name', 'description'))),
    actorURL: absoluteURL(ctx, actorMatch[0]), actor: cleanText(actorMatch[1]), categories: categories,
    detailURL: detailURL
  };
}

function resourceGroupsFor(ctx, detailURL, title, embedURL) {
  return [{
    id: 'online', title: '在线播放',
    versions: [{
      id: detailURL, name: '默认线路', title: title || '默认线路',
      subtitle: '动态解析 HLS', container: 'm3u8', default: true,
      action: {
        type: 'play', itemId: detailURL, versionId: detailURL,
        embedURL: embedURL || undefined, title: title || '默认线路'
      }
    }]
  }];
}

async function loadQualityVersions(ctx, detailURL, title, embedURL) {
  let variants = [];
  let lastError = null;
  let manifestResolved = false;
  let headers = { Referer: embedURL, Origin: urlOrigin(embedURL), 'User-Agent': SEXBJCAM_UA };
  for (let attempt = 0; attempt < 3 && !variants.length; attempt += 1) {
    try {
      const playerHTML = await fetchPlayerText(ctx, embedURL);
      const masterURL = extractMediaURL(playerHTML, embedURL);
      if (!masterURL) throw new Error('播放器没有返回 HLS 地址');
      const manifest = await fetchSignedManifestText(ctx, masterURL, headers);
      if (!/^\s*#EXTM3U/i.test(manifest)) throw new Error('播放器没有返回有效 HLS 清单');
      manifestResolved = true;
      variants = parseHlsVariants(manifest, masterURL);
    } catch (error) {
      lastError = error;
      variants = [];
    }
  }
  if (variants.length) {
    writeQualityMetadata(embedURL, variants.map(function (variant) {
      return { height: variant.height, bandwidth: variant.bandwidth || 0 };
    }));
  } else {
    variants = readQualityMetadata(embedURL);
  }
  if (!variants.length && !manifestResolved) {
    const reason = lastError && lastError.message ? '：' + lastError.message : '';
    throw new Error('画质加载失败，请检查网络后重新打开资源列表' + reason);
  }
  if (!variants.length) return [];
  return buildQualityVersions(detailURL, title, embedURL, headers, variants);
}

function readQualityMetadata(embedURL) {
  const key = qualityCacheKey(embedURL);
  const memory = normalizeQualityCacheEntry(SEXBJCAM_QUALITY_CACHE[key]);
  if (memory.length) return memory;
  const stores = qualityStores();
  for (let i = 0; i < stores.length; i += 1) {
    try {
      const cached = normalizeQualityCacheEntry(stores[i].get(key));
      if (cached.length) {
        SEXBJCAM_QUALITY_CACHE[key] = { time: Date.now(), variants: cached };
        return cached;
      }
    } catch (_) {}
  }
  return [];
}

function writeQualityMetadata(embedURL, variants) {
  const key = qualityCacheKey(embedURL);
  const stable = normalizeQualityMetadata(variants);
  if (!stable.length) return;
  const entry = { time: Date.now(), variants: stable };
  SEXBJCAM_QUALITY_CACHE[key] = entry;
  const stores = qualityStores();
  for (let i = 0; i < stores.length; i += 1) {
    try { stores[i].set(key, entry); } catch (_) {}
  }
}

function normalizeQualityCacheEntry(entry) {
  if (!entry) return [];
  if (Array.isArray(entry)) return normalizeQualityMetadata(entry);
  const time = Number(entry.time || 0);
  if (!time || Date.now() - time > SEXBJCAM_QUALITY_CACHE_TTL_MS) return [];
  return normalizeQualityMetadata(entry.variants);
}

function normalizeQualityMetadata(variants) {
  const values = Array.isArray(variants) ? variants : [];
  const stable = [], seen = {};
  for (let i = 0; i < values.length; i += 1) {
    const height = Number(values[i] && values[i].height || 0);
    if (!height || seen[height]) continue;
    seen[height] = true;
    stable.push({ height: height, bandwidth: Number(values[i].bandwidth || 0) });
  }
  return stable.sort(function (a, b) { return b.height - a.height || b.bandwidth - a.bandwidth; });
}

function qualityStores() {
  const stores = [];
  const widget = typeof Widget !== 'undefined' ? Widget : null;
  const cache = typeof $cache !== 'undefined' ? $cache : null;
  if (widget && widget.storage && typeof widget.storage.get === 'function' && typeof widget.storage.set === 'function') {
    stores.push(widget.storage);
  }
  if (cache && typeof cache.get === 'function' && typeof cache.set === 'function') stores.push(cache);
  return stores;
}

function qualityCacheKey(embedURL) {
  const value = stringValue(embedURL).replace(/[?#].*$/, '');
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
  return 'sexbjcam:qualities:v1:' + (hash >>> 0).toString(16);
}

function buildQualityVersions(detailURL, title, embedURL, headers, variants) {
  return variants.map(function (variant, index) {
    const qualityId = 'quality:' + variant.height;
    return {
      id: qualityId,
      name: variant.height + 'P',
      title: variant.height + 'P',
      subtitle: index === 0
        ? '最高画质 · 默认 · 切换时请稍候'
        : [variant.bandwidth ? formatBitrate(variant.bandwidth) : '', '切换时请稍候'].filter(Boolean).join(' · '),
      quality: variant.height + 'P',
      container: 'm3u8',
      default: index === 0,
      headers: headers,
      action: {
        type: 'play', itemId: detailURL, versionId: qualityId,
        quality: variant.height, embedURL: embedURL, title: title || variant.height + 'P'
      }
    };
  });
}

function parseHlsVariants(manifest, masterURL) {
  const lines = String(manifest || '').replace(/\r/g, '').split('\n');
  const variants = [], seen = {};
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].indexOf('#EXT-X-STREAM-INF:') !== 0) continue;
    const info = lines[i];
    let uri = '';
    for (let next = i + 1; next < lines.length; next += 1) {
      const candidate = lines[next].trim();
      if (!candidate) continue;
      if (candidate.charAt(0) !== '#') uri = candidate;
      break;
    }
    const resolution = /RESOLUTION=\d+x(\d+)/i.exec(info);
    const bandwidth = /(?:AVERAGE-)?BANDWIDTH=(\d+)/i.exec(info);
    const height = resolution ? Number(resolution[1]) : inferHeight(info + ' ' + uri);
    if (!uri || !height || seen[height]) continue;
    seen[height] = true;
    variants.push({
      height: height,
      bandwidth: bandwidth ? Number(bandwidth[1]) : 0,
      url: resolveURL(masterURL, uri)
    });
  }
  return variants.sort(function (a, b) { return b.height - a.height || b.bandwidth - a.bandwidth; });
}

function selectVariant(variants, requestedHeight) {
  if (!variants || !variants.length) return null;
  if (!requestedHeight) return variants[0];
  for (let i = 0; i < variants.length; i += 1) if (variants[i].height === requestedHeight) return variants[i];
  return variants.reduce(function (best, item) {
    return Math.abs(item.height - requestedHeight) < Math.abs(best.height - requestedHeight) ? item : best;
  }, variants[0]);
}

function qualityFromContext(ctx) {
  const raw = firstNonEmpty(
    contextValue(ctx, 'quality'), contextValue(ctx, 'height'),
    contextValue(ctx, 'versionId'), contextValue(ctx, 'version')
  );
  const match = /(?:quality:)?(\d{3,4})p?/i.exec(raw);
  return match ? Number(match[1]) : 0;
}

function inferHeight(value) {
  const match = /(?:^|[^\d])(2160|1440|1080|720|540|480|360|240)p?(?:[^\d]|$)/i.exec(String(value || ''));
  return match ? Number(match[1]) : 0;
}

function resolveURL(base, value) {
  const url = stringValue(value);
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.indexOf('//') === 0) return 'https:' + url;
  const origin = urlOrigin(base);
  if (url.charAt(0) === '/') return origin + url;
  return String(base).replace(/[?#].*$/, '').replace(/\/[^/]*$/, '/') + url;
}

function formatBitrate(value) {
  const number = Number(value || 0);
  return number >= 1000000 ? (Math.round(number / 100000) / 10) + ' Mbps' :
    number >= 1000 ? Math.round(number / 1000) + ' Kbps' : '';
}

async function loadSectionItems(ctx, section, page) {
  const html = await fetchText(ctx, categoryURL(ctx, section, page), requestHeaders(ctx, baseURL(ctx) + '/'));
  return parseListHtml(ctx, html);
}

async function fetchText(ctx, url, headers) {
  const response = await httpRequest(url, headers || requestHeaders(ctx, url));
  const text = unwrapText(response);
  if (!text) throw new Error('请求失败: ' + url);
  return text;
}

async function fetchPlayerText(ctx, url) {
  const referer = detailURLFromContext(ctx) || baseURL(ctx) + '/';
  const freshHeaders = {
    Referer: referer,
    'User-Agent': SEXBJCAM_UA,
    Accept: 'text/html,application/xhtml+xml',
    'Cache-Control': 'no-cache, no-store, max-age=0',
    Pragma: 'no-cache'
  };
  const widget = typeof Widget !== 'undefined' ? Widget : null;
  if (widget && widget.browser && typeof widget.browser.fetch === 'function') {
    try {
      const result = await widget.browser.fetch(cacheBustedURL(url), {
        visible: false,
        timeout: 60,
        waitAfterLoad: 3,
        waitForAny: true,
        waitForMediaSource: true,
        headers: freshHeaders
      });
      const browserText = unwrapText(result);
      if (browserText && extractMediaURL(browserText, url)) return browserText;
      const mediaURL = mediaURLFromBrowserResult(result);
      if (mediaURL) return mediaURL;
    } catch (_) {}
  }
  let normalError = null;
  try {
    const text = await fetchText(ctx, cacheBustedURL(url), freshHeaders);
    if (extractMediaURL(text, url)) return text;
    normalError = new Error('播放器页面未包含媒体配置');
  } catch (error) {
    normalError = error;
  }
  throw normalError || new Error('播放器页面请求失败');
}

async function fetchSignedManifestText(ctx, url, headers) {
  const widget = typeof Widget !== 'undefined' ? Widget : null;
  if (widget && widget.browser && typeof widget.browser.fetch === 'function') {
    try {
      const result = await widget.browser.fetch(url, {
        visible: false,
        timeout: 30,
        waitAfterLoad: 1,
        waitForAny: true,
        headers: headers
      });
      const browserText = unwrapText(result);
      if (/^\s*#EXTM3U/i.test(browserText)) return browserText;
    } catch (_) {}
  }
  return fetchText(ctx, url, headers);
}

function mediaURLFromBrowserResult(result) {
  if (!result) return '';
  const candidates = [];
  const directKeys = ['mediaURL', 'mediaUrl', 'videoURL', 'videoUrl', 'playURL', 'playUrl', 'src', 'url'];
  for (let i = 0; i < directKeys.length; i += 1) {
    const direct = stringValue(result[directKeys[i]]);
    if (isMediaURL(direct) && !/^blob:/i.test(direct)) candidates.push(direct);
  }
  const arrays = [result.mediaSources, result.mediaRequests, result.requests, result.responses, result.urls];
  for (let a = 0; a < arrays.length; a += 1) {
    const values = arrays[a];
    if (!Array.isArray(values)) continue;
    for (let i = values.length - 1; i >= 0; i -= 1) {
      const item = values[i];
      const candidate = typeof item === 'string' ? item : firstNonEmpty(
        item && item.url, item && item.src, item && item.responseURL,
        item && item.requestURL, item && item.mediaURL
      );
      if (isMediaURL(candidate) && !/^blob:/i.test(candidate)) candidates.push(stringValue(candidate));
    }
  }
  for (let i = 0; i < candidates.length; i += 1) if (/\/master\.m3u8(?:$|[?#])/i.test(candidates[i])) return candidates[i];
  for (let i = 0; i < candidates.length; i += 1) {
    const masterURL = masterURLFromVariant(candidates[i]);
    if (masterURL) return masterURL;
  }
  return candidates[0] || '';
}

function masterURLFromVariant(url) {
  const value = stringValue(url);
  if (!/\/index-[^/?#]+\.m3u8(?:$|[?#])/i.test(value)) return '';
  return value.replace(/\/index-[^/?#]+\.m3u8(?=[$?#])/i, '/master.m3u8');
}

function cacheBustedURL(url) {
  SEXBJCAM_REQUEST_NONCE += 1;
  const separator = String(url || '').indexOf('?') >= 0 ? '&' : '?';
  return String(url || '') + separator + '_dreamby_refresh=' + Date.now() + '-' + SEXBJCAM_REQUEST_NONCE;
}

async function httpRequest(url, headers) {
  const widget = typeof Widget !== 'undefined' ? Widget : null;
  const dollar = typeof $http !== 'undefined' ? $http : null;
  const client = (widget && widget.http) || dollar;
  if (!client) throw new Error('当前环境没有可用的 HTTP 客户端');
  if (typeof client.get === 'function') return client.get(url, { headers: headers });
  if (typeof client.request === 'function') return client.request({ url: url, method: 'GET', headers: headers });
  throw new Error('当前 HTTP 客户端不支持 GET');
}

function extractMediaURL(html, embedURL) {
  let source = String(html || '').replace(/&amp;/gi, '&').replace(/\\\//g, '/');
  const unpacked = unpackPacker(source);
  if (unpacked) source += '\n' + unpacked.replace(/\\\//g, '/');
  const urls = source.match(/https?:\/\/[^\s"'<>\\]+?\.m3u8(?:\?[^\s"'<>\\]*)?/gi) || [];
  if (urls.length) return urls[urls.length - 1];
  const relative = firstMatch(source, /(["'])(\/[^"'\\\s]+\.m3u8(?:\?[^"'\\\s]*)?)\1/i);
  return relative[1] ? absoluteExternalURL(embedURL, relative[1]) : '';
}

function unpackPacker(source) {
  const marker = 'eval(function(p,a,c,k,e,d)';
  const start = source.indexOf(marker);
  if (start < 0) return '';
  const tail = source.slice(start);
  const argsStart = tail.indexOf("}('");
  if (argsStart < 0) return '';
  let cursor = argsStart + 3;
  const payloadRead = readQuoted(tail, cursor, "'");
  if (!payloadRead) return '';
  cursor = payloadRead.end;
  const numberMatch = /^,(\d+),(\d+),'/.exec(tail.slice(cursor));
  if (!numberMatch) return '';
  const radix = Number(numberMatch[1]);
  const count = Number(numberMatch[2]);
  cursor += numberMatch[0].length;
  const keysRead = readQuoted(tail, cursor, "'");
  if (!keysRead) return '';
  const keys = decodeJsString(keysRead.value).split('|');
  let payload = decodeJsString(payloadRead.value);
  for (let index = count - 1; index >= 0; index -= 1) {
    if (!keys[index]) continue;
    payload = payload.replace(new RegExp('\\b' + encodeBase(index, radix) + '\\b', 'g'), keys[index]);
  }
  return payload;
}

function readQuoted(text, start, quote) {
  let value = '', escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text.charAt(i);
    if (escaped) { value += '\\' + ch; escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === quote) return { value: value, end: i + 1 };
    value += ch;
  }
  return null;
}

function decodeJsString(value) {
  return String(value || '').replace(/\\(['"\\\/])/g, '$1')
    .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
}

function encodeBase(number, radix) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  if (number < radix) return chars.charAt(number);
  return encodeBase(Math.floor(number / radix), radix) + chars.charAt(number % radix);
}

function requestHeaders(ctx, referer) {
  return { Referer: referer || baseURL(ctx) + '/', 'User-Agent': SEXBJCAM_UA, Accept: 'text/html,application/xhtml+xml' };
}
function imageHeaders(ctx, referer) { return { Referer: referer || baseURL(ctx) + '/', 'User-Agent': SEXBJCAM_UA }; }
function baseURL(ctx) {
  const value = stringValue(contextValue(ctx, 'baseURL') || SEXBJCAM_DEFAULT_BASE).replace(/\/+$/, '');
  return value || SEXBJCAM_DEFAULT_BASE;
}
function categoryURL(ctx, section, page) {
  if (section.id.indexOf('url:') === 0) {
    const direct = section.id.slice(4).replace(/\/+$/, '') + '/';
    return page > 1 ? direct + 'page/' + page + '/' : direct;
  }
  if (section.id === 'latest' || section.id === 'most-viewed') {
    const filter = section.id === 'latest' ? 'latest' : 'most-viewed';
    return baseURL(ctx) + (page > 1 ? '/page/' + page + '/' : '/') + '?filter=' + filter;
  }
  const root = baseURL(ctx) + section.path;
  return page > 1 ? root.replace(/\/+$/, '') + '/page/' + page + '/' : root;
}
function categoryAction(section) {
  return { type: 'category', id: section.id, pageId: section.id, title: section.title, itemAspectRatio: '16:9' };
}
function findSection(value) {
  const id = stringValue(value).replace(/^category-/, '');
  if (id.indexOf('url:') === 0) return { id: id, title: '主播作品', style: 'discover.standard' };
  return SEXBJCAM_SECTIONS.find(function (section) { return section.id === id; }) || null;
}
function detailURLFromContext(ctx) {
  const candidates = contextCandidates(ctx, ['itemId', 'episodeId', 'versionId', 'id', 'link', 'path', 'detailURL', 'pageURL']);
  for (let i = 0; i < candidates.length; i += 1) {
    const value = stringValue(candidates[i]);
    if (/^https?:\/\//i.test(value) && !isMediaURL(value) && !/\/embed\//i.test(value)) return value;
    if (value.charAt(0) === '/' && !isMediaURL(value)) return baseURL(ctx) + value;
  }
  return '';
}
function embedURLFromContext(ctx) {
  const candidates = contextCandidates(ctx, ['embedURL', 'embedUrl', 'playerURL', 'playerUrl']);
  for (let i = 0; i < candidates.length; i += 1) if (/^https?:\/\//i.test(stringValue(candidates[i]))) return stringValue(candidates[i]);
  return '';
}
function contextCandidates(ctx, keys) {
  const values = [];
  const bags = [ctx, ctx && ctx.params, ctx && ctx.config, ctx && ctx.settings, ctx && ctx.parameters];
  bags.forEach(function (bag) { if (bag) keys.forEach(function (key) { if (bag[key] !== undefined) values.push(bag[key]); }); });
  return values;
}
function pageValue(ctx) {
  return contextValue(ctx, 'page') || contextValue(ctx, 'pg') || contextValue(ctx, 'currentPage') ||
    contextValue(ctx, 'pageNumber') || contextValue(ctx, 'pageIndex') || 1;
}
function normalizeContext(ctx) {
  if (typeof ctx === 'string') { try { return JSON.parse(ctx); } catch (_) { return {}; } }
  return ctx && typeof ctx === 'object' ? ctx : {};
}
function contextValue(ctx, key) {
  if (!ctx) return '';
  if (ctx[key] !== undefined && ctx[key] !== null) return ctx[key];
  const bags = ['params', 'config', 'settings', 'parameters', 'pagination', 'pageInfo'];
  for (let i = 0; i < bags.length; i += 1) if (ctx[bags[i]] && ctx[bags[i]][key] !== undefined) return ctx[bags[i]][key];
  return '';
}
function unwrapText(response) {
  let value = response;
  for (let i = 0; i < 5 && value && typeof value === 'object'; i += 1) {
    if (typeof value.text === 'function') return value.text();
    if (value.data !== undefined) value = value.data;
    else if (value.body !== undefined) value = value.body;
    else if (value.text !== undefined) value = value.text;
    else if (value.html !== undefined) value = value.html;
    else break;
  }
  return typeof value === 'string' ? value : '';
}
function metaItemContent(html, itemprop) {
  return decodeEntities(firstNonEmpty(
    firstMatch(html, new RegExp('<meta[^>]*itemprop=["\\\']' + escapeRegExp(itemprop) + '["\\\'][^>]*content=["\\\']([^"\\\']*)', 'i'))[0],
    firstMatch(html, new RegExp('<meta[^>]*content=["\\\']([^"\\\']*)["\\\'][^>]*itemprop=["\\\']' + escapeRegExp(itemprop) + '["\\\']', 'i'))[0]
  ));
}
function metaContent(html, attr, value) {
  const a = escapeRegExp(attr), v = escapeRegExp(value);
  return decodeEntities(firstNonEmpty(
    firstMatch(html, new RegExp('<meta[^>]*' + a + '=["\\\']' + v + '["\\\'][^>]*content=["\\\']([^"\\\']*)', 'i'))[0],
    firstMatch(html, new RegExp('<meta[^>]*content=["\\\']([^"\\\']*)["\\\'][^>]*' + a + '=["\\\']' + v + '["\\\']', 'i'))[0]
  ));
}
function attributeFromTag(tag, name) {
  return decodeEntities(firstMatch(tag, new RegExp('\\b' + escapeRegExp(name) + '=["\\\']([^"\\\']*)["\\\']', 'i'))[0]);
}
function absoluteURL(ctx, value) {
  const url = stringValue(value);
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.indexOf('//') === 0) return 'https:' + url;
  return baseURL(ctx) + (url.charAt(0) === '/' ? url : '/' + url);
}
function absoluteExternalURL(base, value) {
  const url = stringValue(value);
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.indexOf('//') === 0) return 'https:' + url;
  const origin = urlOrigin(base);
  return origin + (url.charAt(0) === '/' ? url : '/' + url);
}
function urlOrigin(url) { const match = /^(https?:\/\/[^/]+)/i.exec(stringValue(url)); return match ? match[1] : ''; }
function hasNextPage(html, page) {
  const next = page + 1;
  return new RegExp('(?:/page/' + next + '/|[?&](?:paged?|pg)=' + next + ')(?:[?"\\\'&#<\\s/]|$)', 'i').test(html || '') ||
    /rel=["']next["']/i.test(html || '');
}
function isoDurationMinutes(value) {
  const match = /^P(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(stringValue(value));
  return match ? Number(match[1] || 0) * 60 + Number(match[2] || 0) + (Number(match[3] || 0) >= 30 ? 1 : 0) : undefined;
}
function isMediaURL(value) { return /(?:\.m3u8|\.mp4|\.m4v|\.mov|\.webm)(?:$|[?#])/i.test(stringValue(value)); }
function mediaContainer(url) { return /\.m3u8(?:$|[?#])/i.test(url || '') ? 'm3u8' : 'mp4'; }
function firstMatch(text, pattern) { const match = pattern.exec(text || ''); return match ? match.slice(1) : []; }
function firstNonEmpty() { for (let i = 0; i < arguments.length; i += 1) if (stringValue(arguments[i])) return stringValue(arguments[i]); return ''; }
function cleanText(value) { return decodeEntities(stringValue(value).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function decodeEntities(value) {
  return stringValue(value).replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#(\d+);/g, function (_, code) { return String.fromCharCode(Number(code)); });
}
function positiveInt(value, fallback) { const number = parseInt(value, 10); return Number.isFinite(number) && number > 0 ? number : fallback; }
function stringValue(value) { return value === undefined || value === null ? '' : String(value).trim(); }
function escapeRegExp(value) { return stringValue(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

const SEXBJCAM_API = {
  WidgetMetadata, getManifest, getHome, getHomeSection, getCategory, getDetail,
  getResourceVersions, resolvePlayback, search,
  home: getHome, homeSection: getHomeSection, getSection: getHomeSection,
  category: getCategory, catalog: getCategory, list: getCategory, detail: getDetail,
  getVersions: getResourceVersions, versions: getResourceVersions,
  resolvePlay: resolvePlayback, play: resolvePlayback, getPlayback: resolvePlayback, getPlayinfo: resolvePlayback,
  quickSearch: search, getSearch: search, onSearch: search,
  _test: {
    parseListHtml, parseDetailHtml, extractMediaURL, unpackPacker, categoryURL,
    parseHlsVariants, selectVariant, qualityFromContext, cacheBustedURL, mediaURLFromBrowserResult
  }
};
if (typeof globalThis !== 'undefined') Object.keys(SEXBJCAM_API).forEach(function (key) { globalThis[key] = SEXBJCAM_API[key]; });
if (typeof module !== 'undefined' && module.exports) module.exports = SEXBJCAM_API;
