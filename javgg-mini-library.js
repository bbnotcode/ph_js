// @name JAVGG Mini Library

const JAVGG_DEFAULT_BASE = 'https://javgg.net';
const JAVGG_LOGO = 'https://javgg.net/javgg.png';
const JAVGG_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const JAVGG_PAYLOAD_PREFIX = 'javgg://';

const WidgetMetadata = {
  id: 'javgg-mini-library',
  name: 'JAVGG',
  title: 'JAVGG',
  version: '1.0.5',
  requiredVersion: '0.0.1',
  author: 'Alan huang',
  site: JAVGG_DEFAULT_BASE,
  logo: JAVGG_LOGO,
  icon: JAVGG_LOGO,
  description: 'JAVGG 自定义媒体库，支持首页、分类、搜索、详情和多线路动态播放。'
};

const JAVGG_SECTIONS = [
  { id: 'new-post', title: '最新发布', path: '/new-post/', style: 'discover.spotlight' },
  { id: 'popular-today', title: '今日热门', path: '/trending/?sort=today', style: 'discover.ranked' },
  { id: 'popular-weekly', title: '本周热门', path: '/trending/?sort=weekly', style: 'discover.ranked' },
  { id: 'featured', title: '精选影片', path: '/featured/', style: 'discover.posterCompact' },
  { id: 'english-subtitle', title: '英文字幕', path: '/tag/english-subtitle/', style: 'discover.posterCompact' },
  { id: 'chinese-subtitle', title: '中文字幕', path: '/tag/chinese-subtitle/', style: 'discover.posterCompact' },
  { id: 'uncensored-leak', title: '无码流出', path: '/tag/uncensored-leak/', style: 'discover.posterCompact' },
  { id: 'reduce-mosaic', title: '无码破解', path: '/tag/reduce-mosaic/', style: 'discover.posterCompact' },
  { id: 'censored', title: '有码影片', path: '/tag/censored/', style: 'discover.posterCompact' },
  { id: 'chinese-porn', title: '华语影片', path: '/tag/chinese-porn/', style: 'discover.posterCompact' }
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
      name: 'baseUrl',
      title: '站点地址',
      type: 'input',
      value: JAVGG_DEFAULT_BASE,
      defaultValue: JAVGG_DEFAULT_BASE,
      required: true,
      description: 'JAVGG 当前可访问域名，末尾斜杠可省略。'
    }]
  };
}

async function getHome(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  let immediate = [];
  try {
    immediate = parseCards(ctx, await fetchText(ctx, sectionURL(ctx, JAVGG_SECTIONS[0], 1))).slice(0, 18);
  } catch (error) {
    immediate = [diagnosticItem('首页加载失败', error)];
  }
  const browse = {
    id: 'javgg-browse',
    title: '分类浏览',
    style: 'discover.annualCategories',
    lazy: false,
    items: JAVGG_SECTIONS.map(categoryCard)
  };
  const first = sectionResult(JAVGG_SECTIONS[0], immediate);
  return {
    pageType: 'home',
    id: 'javgg-home',
    title: 'JAVGG',
    heroAspectRatio: '2:3',
    hero: immediate.filter(isMediaItem).slice(0, 5),
    sections: [browse, first].concat(JAVGG_SECTIONS.slice(1).map(sectionShell))
  };
}

async function getHomeSection(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const section = findSection(firstNonEmpty(ctx.sectionId, ctx.id, ctx.pageId)) || JAVGG_SECTIONS[0];
  try {
    const items = parseCards(ctx, await fetchText(ctx, sectionURL(ctx, section, 1))).slice(0, 18);
    return sectionResult(section, items.length ? items : [diagnosticItem(section.title + '暂无内容')]);
  } catch (error) {
    return sectionResult(section, [diagnosticItem(section.title + '加载失败', error)]);
  }
}

async function getCategory(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const page = positiveInt(contextValue(ctx, ['page', 'pg', 'currentPage', 'pageNumber', 'pageIndex']), 1);
  const pageId = firstNonEmpty(ctx.pageId, ctx.id, 'new-post');
  const section = findSection(pageId);
  const dynamicPath = decodeDynamicPageId(pageId);
  const title = cleanText(firstNonEmpty(ctx.title, section && section.title, dynamicPath && dynamicPath.title, 'JAVGG'));
  const url = section ? sectionURL(ctx, section, page) : pagedURL(baseURL(ctx) + (dynamicPath ? dynamicPath.path : '/new-post/'), page);
  try {
    const html = await fetchText(ctx, url);
    const items = parseCards(ctx, html);
    return {
      pageType: 'category',
      id: pageId,
      title: title,
      style: 'media.posterGrid',
      itemAspectRatio: '2:3',
      page: page,
      nextPage: page + 1,
      hasMore: hasNextPage(html, page, items),
      items: items
    };
  } catch (error) {
    return {
      pageType: 'category', id: pageId, title: title, style: 'media.posterGrid',
      itemAspectRatio: '2:3', page: page, hasMore: false,
      items: [diagnosticItem(title + '加载失败', error)]
    };
  }
}

async function search(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const query = cleanText(firstNonEmpty(ctx.query, ctx.keyword, ctx.text));
  const page = positiveInt(contextValue(ctx, ['page', 'pg', 'currentPage', 'pageNumber']), 1);
  if (!query) return { pageType: 'search', title: '搜索', keyword: '', page: page, hasMore: false, items: [] };
  const url = searchURL(ctx, query, page);
  try {
    const html = await fetchText(ctx, url);
    const items = parseCards(ctx, html);
    return {
      pageType: 'search', title: '搜索：' + query, keyword: query,
      style: 'media.posterGrid', itemAspectRatio: '2:3',
      page: page, nextPage: page + 1, hasMore: hasNextPage(html, page, items), items: items
    };
  } catch (error) {
    return {
      pageType: 'search', title: '搜索：' + query, keyword: query,
      page: page, hasMore: false, items: [diagnosticItem('搜索失败', error)]
    };
  }
}

async function getDetail(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const detailUrl = detailURLFromContext(ctx);
  if (!detailUrl) throw new Error('JAVGG 详情参数无效');
  const html = await fetchText(ctx, detailUrl);
  const title = cleanText(firstNonEmpty(
    metaContent(html, 'property', 'og:title'),
    firstMatch(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i),
    pageTitle(html)
  )).replace(/\s+(?:[–—]|-\s)\s*(?:JavGG|JAVGG)(?:\.net)?\s*$/i, '');
  const poster = absoluteURL(ctx, firstNonEmpty(
    metaContent(html, 'property', 'og:image'),
    firstMatch(html, /<div\b[^>]*class=["'][^"']*\bposter\b[^"']*["'][^>]*>[\s\S]*?<img\b[^>]*(?:data-lazy-src|data-src|src)=["']([^"']+)/i)
  ));
  const overview = cleanText(firstNonEmpty(
    metaContent(html, 'name', 'description'),
    metaContent(html, 'property', 'og:description'),
    descriptionBlock(html)
  ));
  const players = parsePlayers(html);
  const dateText = firstNonEmpty(
    firstMatch(html, /<span\b[^>]*class=["'][^"']*\bdate\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i),
    firstMatch(html, /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},\s+\d{4}/i)
  );
  const runtimeText = firstMatch(html, /(\d{1,4})\s*Min\./i);
  const castLinks = linkedTerms(html, /\/star\//i);
  const genres = unique(linkedTerms(html, /\/genre\//i).map(function (x) { return x.title; })
    .concat(linkedTerms(html, /\/tag\//i).map(function (x) { return x.title; }))).slice(0, 20);
  const related = parseCards(ctx, html).filter(function (item) {
    return detailURLFromId(item.id) !== detailUrl;
  }).slice(0, 18);
  return {
    pageType: 'detail',
    id: encodePayload({ kind: 'detail', detailUrl: detailUrl, title: title }),
    title: title || titleFromURL(detailUrl),
    originalTitle: extractCode(title),
    type: 'movie',
    poster: poster,
    backdrop: poster,
    detailImageAspectRatio: '2:3',
    imageHeaders: imageHeaders(detailUrl),
    posterHeaders: imageHeaders(detailUrl),
    backdropHeaders: imageHeaders(detailUrl),
    overview: overview,
    year: yearFromText(dateText),
    releaseDate: cleanText(dateText) || undefined,
    runtimeMinutes: positiveInt(runtimeText, undefined),
    genres: genres,
    cast: castLinks.map(function (actor) {
      return {
        id: actor.url, name: actor.title, role: '演员',
        action: { type: 'category', pageId: encodeDynamicPageId(actor.url, actor.title), title: actor.title, itemAspectRatio: '2:3' }
      };
    }),
    // 画质清单需要访问外部播放器并可能短时变化，交给 getResourceVersions 动态发现，
    // 避免把一次失败或过期的媒体 URL 缓存在详情页。
    resourceGroups: [],
    resourceSummary: {
      versionCount: 0,
      episodeCount: 0,
      defaultVersionId: ''
    },
    recommendations: related.length ? [{ id: 'related', title: '相关推荐', style: 'discover.posterCompact', items: related }] : []
  };
}

async function getResourceVersions(rawCtx) {
  return withPlaybackBudget(rawCtx, discoverResourceVersions, '画质发现');
}

async function resolvePlayback(input) {
  return withPlaybackBudget(input, resolvePlaybackWithinBudget);
}

function sectionShell(section) {
  return {
    id: section.id, title: section.title, style: section.style,
    lazy: true, items: [], moreAction: categoryAction(section)
  };
}

function sectionResult(section, items) {
  return {
    id: section.id, title: section.title, style: section.style,
    lazy: false, moreAction: categoryAction(section), items: items
  };
}

function categoryCard(section) {
  return {
    id: 'collection:' + section.id,
    title: section.title,
    type: 'collection',
    poster: JAVGG_LOGO,
    imageFit: 'fit',
    aspectRatio: '16:9',
    action: categoryAction(section)
  };
}

function categoryAction(section) {
  return { type: 'category', pageId: section.id, title: section.title, itemAspectRatio: '2:3' };
}

function parseCards(ctx, html) {
  const source = String(html || '');
  let blocks = source.match(/<article\b[^>]*class=["'][^"']*\bitem\b[^"']*\bmovies\b[^"']*["'][^>]*>[\s\S]*?<\/article>/gi) || [];
  if (!blocks.length) {
    blocks = (source.match(/<article\b[^>]*>[\s\S]*?<\/article>/gi) || []).filter(function (block) {
      return /href=["'][^"']*\/jav\//i.test(block);
    });
  }
  const seen = {};
  return blocks.map(function (block) {
    const href = absoluteURL(ctx, firstNonEmpty(
      firstMatch(block, /<h3\b[^>]*>[\s\S]*?<a\b[^>]*href=["']([^"']+)/i),
      firstMatch(block, /<a\b[^>]*href=["']([^"']+)["'][^>]*title=/i),
      firstMatch(block, /<a\b[^>]*href=["']([^"']*\/jav\/[^"']*)/i)
    ));
    if (!/\/jav\//i.test(href) || seen[href]) return null;
    seen[href] = true;
    const codeTitle = cleanText(firstNonEmpty(
      firstMatch(block, /<h3\b[^>]*>[\s\S]*?<a\b[^>]*>([\s\S]*?)<\/a>/i),
      firstMatch(block, /<div\b[^>]*class=["'][^"']*\btitle\b[^"']*["'][^>]*>[\s\S]*?<a\b[^>]*>([\s\S]*?)<\/a>/i),
      firstMatch(block, /<a\b[^>]*title=["']([^"']+)/i)
    ));
    const descriptive = cleanText(firstMatch(block, /<div\b[^>]*class=["'][^"']*\btitlecontent\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i));
    const poster = absoluteURL(ctx, firstNonEmpty(
      firstMatch(block, /<img\b[^>]*(?:data-lazy-src|data-src|src)=["']([^"']+)/i),
      metaContent(block, 'property', 'og:image')
    ));
    const badge = cleanText(firstMatch(block, /<div\b[^>]*class=["'][^"']*\bfeatu\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i));
    const date = cleanText(firstMatch(block, /<div\b[^>]*class=["'][^"']*\bdata\b[^"']*["'][^>]*>[\s\S]*?<span\b[^>]*>([\s\S]*?)<\/span>/i));
    const searchMeta = cleanText(firstMatch(block, /<div\b[^>]*class=["'][^"']*\bmeta\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i));
    return {
      id: encodePayload({ kind: 'detail', detailUrl: href, title: codeTitle }),
      title: codeTitle || titleFromURL(href),
      subtitle: descriptive || date || searchMeta,
      type: 'movie',
      poster: poster,
      backdrop: poster,
      aspectRatio: '2:3',
      badges: badge ? [badge] : [],
      remarks: badge || date || searchMeta,
      imageHeaders: imageHeaders(href),
      action: { type: 'detail', itemId: encodePayload({ kind: 'detail', detailUrl: href, title: codeTitle }) }
    };
  }).filter(Boolean);
}

function parsePlayers(html) {
  const text = String(html || '');
  const options = {};
  const optionPattern = /<li\b([^>]*)>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = optionPattern.exec(text))) {
    if (!/\bdooplay_player_option\b/i.test(attributeValue(match[1], 'class'))) continue;
    const number = attributeValue(match[1], 'data-nume');
    const server = firstMatch(match[2], /<span\b[^>]*class=["'][^"']*\bserver\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
    const title = firstMatch(match[2], /<span\b[^>]*class=["'][^"']*\btitle\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
    options[number] = cleanText(server || title) || ('线路 ' + number);
  }
  const results = [];
  // source-player-N matches data-nume=N, even if a frame is missing or reordered.
  const sourcePattern = /<div\b([^>]*\bid=["']source-player-\d+["'][^>]*)>([\s\S]*?)<\/div>/gi;
  while ((match = sourcePattern.exec(text))) {
    const id = attributeValue(match[1], 'id').match(/^source-player-(\d+)$/);
    if (!id) continue;
    const frame = firstMatch(match[2], /<iframe\b([^>]*)>/i);
    const url = iframeURL(frame);
    if (url) results.push({ lineId: id[1], line: options[id[1]] || ('线路 ' + id[1]), url: url });
  }
  if (!results.length) {
    const frames = text.match(/<iframe\b[^>]*>/gi) || [];
    const numbers = Object.keys(options);
    frames.forEach(function (frame) {
      const url = iframeURL(frame);
      if (!url) return;
      const number = numbers[results.length] || String(results.length + 1);
      results.push({ lineId: number, line: options[number] || ('线路 ' + number), url: url });
    });
  }
  return uniqueBy(results, function (player) { return player.url; });
}

function qualityGroup(detailUrl, title, player, qualities) {
  return {
    id: 'line-' + (player.lineId || player.line),
    title: player.line + ' 线路',
    versions: qualities.map(function (quality, index) {
      const payload = encodePayload({
        kind: 'play', detailUrl: detailUrl, playerUrl: player.url,
        line: player.line, lineId: player.lineId, height: quality.height || 0, title: title
      });
      return {
        id: payload,
        name: quality.name,
        title: quality.name,
        subtitle: '播放时刷新地址 · 切换时请稍候',
        default: index === 0,
        action: {
          type: 'play', itemId: payload, versionId: payload,
          playerUrl: player.url, title: title
        }
      };
    })
  };
}

async function discoverQualities(ctx, detailUrl, player, allowBrowser, captured) {
  const media = captured || await resolvePlayerMedia(ctx, player.url, detailUrl, allowBrowser);
  const result = { player: player, qualities: [], media: media.url ? media : null, stage: media.stage || 'player-media' };
  if (!media.url) return result;
  if (!/\.m3u8(?:$|[?#])/i.test(media.url)) {
    result.qualities = [{ name: 'MP4', height: 0 }];
    return result;
  }
  try {
    const playlist = await fetchPlaybackText(ctx, media.url, player.url, media.headers, 4, 'manifest-http');
    const variants = parseMasterPlaylist(media.url, playlist);
    if (variants.length) result.qualities = variants.map(function (variant) {
      return { name: variant.height ? variant.height + 'p' : 'HLS', height: variant.height || 0 };
    });
    else if (/#EXTINF/i.test(playlist)) result.qualities = [{ name: 'HLS 原始画质', height: 0 }];
    else result.stage = 'manifest-not-hls';
  } catch (error) { result.stage = error.stage || 'manifest-http'; }
  return result;
}

async function resolvePlayerMedia(ctx, playerUrl, detailUrl, allowBrowser) {
  let stage = 'player-media';
  try {
    const playable = extractPlayableURL(await fetchPlaybackText(ctx, playerUrl, detailUrl || playerUrl, null, 4, 'player-http'), playerUrl);
    if (playable) return { url: playable, headers: playbackHeaders(playerUrl) };
  } catch (error) { stage = error.stage || 'player-http'; }
  if (allowBrowser) {
    const captured = await extractFromBrowser(playerUrl, detailUrl, ctx, 10);
    if (captured) return captured;
  }
  return { url: '', stage: stage };
}

function parseMasterPlaylist(masterURL, text) {
  const source = String(text || '');
  if (!/#EXT-X-STREAM-INF/i.test(source)) return [];
  const lines = source.split(/\r?\n/);
  const variants = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!/#EXT-X-STREAM-INF/i.test(lines[index])) continue;
    const resolution = lines[index].match(/RESOLUTION=\d+x(\d+)/i);
    let next = index + 1;
    while (next < lines.length && (!lines[next].trim() || /^#/.test(lines[next].trim()))) next += 1;
    if (next >= lines.length) continue;
    variants.push({
      height: resolution ? Number(resolution[1]) : 0,
      url: resolveRelativeURL(masterURL, lines[next].trim())
    });
  }
  variants.sort(function (a, b) { return (b.height || 0) - (a.height || 0); });
  return uniqueBy(variants, function (item) { return String(item.height) + ':' + item.url; });
}

function resolveRelativeURL(base, value) {
  if (/^https?:\/\//i.test(value)) return value;
  if (String(value).indexOf('//') === 0) return 'https:' + value;
  const origin = originOf(base);
  if (String(value).indexOf('/') === 0) return origin + value;
  return String(base || '').replace(/[?#].*$/, '').replace(/\/[^/]*$/, '/') + value;
}

async function fetchText(ctx, url, referer) {
  const response = await httpGet(url, {
    headers: requestHeaders(referer || url),
    useBrowserCookie: false,
    attachBrowserCookie: false,
    useBrowserFallback: false,
    browserFallback: false
  });
  const text = responseText(response);
  if (!text) throw new Error('请求失败: ' + url);
  if (isVerificationPage(text, response && (response.status || response.statusCode))) {
    throw new Error('源站返回了浏览器验证页');
  }
  return text;
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
  throw new Error('当前环境没有可用的 HTTP 客户端');
}

// The user's working list/detail HTTP path above stays unchanged.
// Only resource discovery and playback use these bounded requests.
async function fetchPlaybackText(ctx, url, referer, headers, limit, stage) {
  const seconds = remainingPlaybackSeconds(ctx, limit || 4);
  stage = stage || 'playback-http';
  return runStage(ctx, stage, seconds, async function () {
    const response = await httpGet(url, {
      headers: headers || requestHeaders(referer || url),
      timeout: seconds, timeoutSeconds: seconds,
      useBrowserCookie: false, attachBrowserCookie: false,
      useBrowserFallback: false, browserFallback: false
    });
    const text = await playbackResponseText(response, 0);
    const status = Number(response && (response.statusCode || response.status));
    if (status >= 400) throw stageError(stage + '-' + status, '来源请求失败（HTTP ' + status + '）');
    if (/Just a moment|Checking(?:\s+your)?\s+browser|cf-browser-verification|cf-chl-/i.test(text.slice(0, 30000))) {
      throw stageError(stage + '-verification', '源站要求浏览器验证');
    }
    if (!text) throw stageError(stage + '-empty', '来源返回空内容');
    return text;
  });
}

async function playbackResponseText(response, depth) {
  if (depth > 4 || response == null) return '';
  response = await response;
  if (response == null) return '';
  if (typeof response === 'string') {
    if (/^\s*\{/.test(response)) {
      try { return await playbackResponseText(JSON.parse(response), depth + 1); } catch (error) { /* Not a JSON wrapper. */ }
    }
    return response;
  }
  if (typeof response.text === 'function') return String(await response.text());
  const keys = ['html', 'data', 'body', 'text', 'content'];
  for (let index = 0; index < keys.length; index++) {
    const text = await playbackResponseText(response[keys[index]], depth + 1);
    if (text) return text;
  }
  return '';
}

async function extractFromBrowser(url, referer, ctx, limit) {
  if (typeof Widget === 'undefined' || !Widget.browser || typeof Widget.browser.fetch !== 'function') return null;
  const seconds = playbackBrowserSeconds(ctx, limit || 10, 1);
  try {
    return await runStage(ctx, 'browser-media', seconds, async function () {
      const result = await Widget.browser.fetch(url, {
        visible: false, timeout: seconds, timeoutSeconds: seconds,
        waitAfterLoad: 1, waitForMediaSource: true,
        headers: requestHeaders(referer || url)
      });
      const captured = firstPlayableInBrowserResult(result);
      if (captured) return captured;
      const link = extractPlayableURL(await playbackResponseText(result, 0), url);
      if (link) return { url: link, headers: playbackHeaders(url) };
      const keys = Object.keys(result || {}).slice(0, 12).join(',');
      const blobOnly = /blob:https?:/.test(JSON.stringify((result && (result.mediaSources || result.capturedRequests || result.mediaRequests)) || []));
      throw stageError(blobOnly ? 'browser-blob-only' : 'browser-no-media', '浏览器未回传可用媒体；blobOnly=' + blobOnly + '；keys=' + keys);
    });
  } catch (error) {
    throw stageError(error.stage || 'browser-media', error.stage ? error.message.replace(/；stage=.*$/, '') : '浏览器媒体捕获失败');
  }
}

function firstPlayableInBrowserResult(result) {
  if (!result) return null;
  const arrays = [result.capturedRequests, result.mediaRequests, result.requests, result.responses, result.mediaSources, result.urls, [result]];
  for (let a = 0; a < arrays.length; a += 1) {
    if (!Array.isArray(arrays[a])) continue;
    for (let i = 0; i < arrays[a].length; i += 1) {
      const item = arrays[a][i];
      const url = typeof item === 'string' ? item : firstNonEmpty(item && item.url, item && item.src, item && item.responseURL, item && item.mediaURL, item && item.mediaUrl, item && item.videoURL, item && item.videoUrl, item && item.playURL, item && item.playUrl);
      if (isPlayableURL(url)) return { url: url, headers: capturedHeaders(item && (item.requestHeaders || item.headers)) };
    }
  }
  return null;
}

function extractPlayableURL(value, playerUrl) {
  const text = htmlDecode(responseText(value) + '\n' + unpackPlayerScripts(responseText(value)).join('\n')).replace(/\\\//g, '/');
  // Current Vidhide/Streamwish players select hls4 first. Generic URL matching
  // otherwise selects the signed hls2 CDN (including its creator's ASN).
  const gateway = text.match(/["']hls4["']\s*:\s*["']([^"']+)["']/i);
  if (gateway && playerUrl) return resolveRelativeURL(playerUrl, gateway[1]);
  const patterns = [
    /(?:urlPlay|file|src)\s*[:=]\s*["'](https?:\/\/[^"']+\.(?:m3u8|mp4)(?:\?[^"']*)?)/i,
    /(https?:\/\/[^\s"'<>\\]+\.(?:m3u8|mp4)(?:\?[^\s"'<>\\]*)?)/i
  ];
  for (let i = 0; i < patterns.length; i += 1) {
    const match = text.match(patterns[i]);
    if (match && isPlayableURL(match[1])) return match[1];
  }
  return '';
}

function requestHeaders(referer) {
  return {
    'User-Agent': JAVGG_UA,
    Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
    Referer: referer || JAVGG_DEFAULT_BASE + '/'
  };
}

function imageHeaders(referer) {
  return { 'User-Agent': JAVGG_UA, Referer: referer || JAVGG_DEFAULT_BASE + '/' };
}

function playbackHeaders(playerUrl) {
  const headers = { 'User-Agent': JAVGG_UA };
  // Observed on luluvdoo master, variant and segment requests (not the detail-page URL).
  if (/^https:\/\/luluvdoo\.com(?:\/|$)/i.test(String(playerUrl))) {
    headers.Referer = 'https://luluvdoo.com/';
    headers.Origin = 'https://luluvdoo.com';
  }
  return headers;
}

function baseURL(ctx) {
  return String(contextValue(ctx, 'baseUrl') || JAVGG_DEFAULT_BASE).trim().replace(/\/+$/, '');
}

function sectionURL(ctx, section, page) {
  return pagedURL(baseURL(ctx) + section.path, page);
}

function pagedURL(url, page) {
  if (page <= 1) return url;
  const parts = String(url).split('?');
  return parts[0].replace(/\/+$/, '') + '/page/' + page + '/' + (parts[1] ? '?' + parts.slice(1).join('?') : '');
}

function searchURL(ctx, query, page) {
  const root = page > 1 ? baseURL(ctx) + '/page/' + page + '/' : baseURL(ctx) + '/';
  return root + '?s=' + encodeURIComponent(query);
}

function hasNextPage(html, page, items) {
  const source = String(html || '');
  return new RegExp("/page/" + (page + 1) + "/(?:[?\"']|$)", 'i').test(source) ||
    /class=["'][^"']*\bnext\b[^"']*["']/i.test(source) ||
    false;
}

function detailURLFromContext(ctx) {
  const decoded = decodePayload(firstNonEmpty(ctx.itemId, ctx.id, ctx.versionId));
  const candidate = firstNonEmpty(ctx.detailUrl, decoded.detailUrl, ctx.url);
  return /https?:\/\/[^/]+\/jav\//i.test(candidate) ? candidate : '';
}

function detailURLFromId(id) {
  return decodePayload(id).detailUrl || '';
}

function findSection(id) {
  return JAVGG_SECTIONS.filter(function (x) { return x.id === id; })[0];
}

function encodeDynamicPageId(url, title) {
  const path = String(url || '').replace(/^https?:\/\/[^/]+/i, '');
  return 'dynamic:' + encodeURIComponent(JSON.stringify({ path: path, title: title }));
}

function decodeDynamicPageId(id) {
  if (String(id || '').indexOf('dynamic:') !== 0) return null;
  try { return JSON.parse(decodeURIComponent(String(id).slice(8))); } catch (error) { return null; }
}

function encodePayload(data) {
  return JAVGG_PAYLOAD_PREFIX + encodeURIComponent(JSON.stringify(data || {}));
}

function decodePayload(value) {
  const text = String(value || '');
  if (text.indexOf(JAVGG_PAYLOAD_PREFIX) !== 0) return {};
  try { return JSON.parse(decodeURIComponent(text.slice(JAVGG_PAYLOAD_PREFIX.length))); } catch (error) { return {}; }
}

function normalizeContext(value) {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (error) { return {}; }
  }
  return value && typeof value === 'object' ? value : {};
}

function contextValue(ctx, keys) {
  const list = Array.isArray(keys) ? keys : [keys];
  const bags = [ctx, ctx && ctx.params, ctx && ctx.config, ctx && ctx.settings, ctx && ctx.parameters, ctx && ctx.pagination, ctx && ctx.pageInfo];
  for (let b = 0; b < bags.length; b += 1) {
    const bag = bags[b];
    if (!bag) continue;
    for (let k = 0; k < list.length; k += 1) {
      const value = bag[list[k]];
      if (value !== undefined && value !== null && value !== '') return value;
    }
  }
  return '';
}

function responseText(response) {
  if (typeof response === 'string') return response;
  if (!response) return '';
  if (typeof response.data === 'string') return response.data;
  if (typeof response.body === 'string') return response.body;
  if (typeof response.text === 'string') return response.text;
  if (response.data && typeof response.data.html === 'string') return response.data.html;
  if (typeof response.html === 'string') return response.html;
  return '';
}

function isVerificationPage(html, status) {
  const text = String(html || '').slice(0, 30000);
  return Number(status) === 403 || /Just a moment|Checking your browser|cf-browser-verification|cf-chl-/i.test(text);
}

function absoluteURL(ctx, value) {
  const url = htmlDecode(String(value || '').trim());
  if (/^https?:\/\//i.test(url)) return url;
  if (url.indexOf('//') === 0) return 'https:' + url;
  return baseURL(ctx) + '/' + url.replace(/^\/+/, '');
}

function originOf(url) {
  const match = String(url || '').match(/^(https?:\/\/[^/]+)/i);
  return match ? match[1] : '';
}

function metaContent(html, attr, name) {
  const escaped = escapeRegExp(name);
  let match = String(html || '').match(new RegExp("<meta\\b[^>]*" + attr + "=[\"']" + escaped + "[\"'][^>]*content=[\"']([^\"']*)", 'i'));
  if (!match) match = String(html || '').match(new RegExp("<meta\\b[^>]*content=[\"']([^\"']*)[\"'][^>]*" + attr + "=[\"']" + escaped + "[\"']", 'i'));
  return htmlDecode(match ? match[1] : '');
}

function linkedTerms(html, pathPattern) {
  const results = [];
  const pattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(String(html || ''))) !== null) {
    if (!pathPattern.test(match[1])) continue;
    const title = cleanText(match[2]);
    if (title) results.push({ url: match[1], title: title });
  }
  return uniqueBy(results, function (x) { return x.url; });
}

function descriptionBlock(html) {
  return firstMatch(html, /<div\b[^>]*class=["'][^"']*(?:wp-content|description)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
}

function pageTitle(html) {
  return cleanText(firstMatch(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i));
}

function titleFromURL(url) {
  const part = String(url || '').split('?')[0].replace(/\/+$/, '').split('/').pop() || '';
  try { return decodeURIComponent(part).replace(/[-_]+/g, ' '); } catch (error) { return part; }
}

function extractCode(title) {
  const match = String(title || '').match(/\b[A-Z]{2,10}-\d{2,6}\b/i);
  return match ? match[0].toUpperCase() : undefined;
}

function yearFromText(text) {
  const match = String(text || '').match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
}

function diagnosticItem(title, error) {
  return {
    id: 'diagnostic:' + title,
    title: title,
    subtitle: error && error.message ? error.message : (error ? String(error) : '请稍后重试'),
    type: 'collection',
    poster: JAVGG_LOGO,
    imageFit: 'fit'
  };
}

function isMediaItem(item) {
  return item && item.type === 'movie' && item.action;
}

function isPlayableURL(url) {
  return /^https?:\/\/.+\.(?:m3u8|mp4)(?:$|[?#])/i.test(String(url || ''));
}

function cleanText(value) {
  return htmlDecode(String(value || '').replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ').trim();
}

function htmlDecode(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); })
    .replace(/&#x([0-9a-f]+);/gi, function (_, n) { return String.fromCharCode(parseInt(n, 16)); })
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&nbsp;/gi, ' ');
}

function firstMatch(value, pattern) {
  const match = String(value || '').match(pattern);
  return match ? (match[1] !== undefined ? match[1] : match[0]) : '';
}

function firstNonEmpty() {
  for (let i = 0; i < arguments.length; i += 1) {
    if (arguments[i] !== undefined && arguments[i] !== null && String(arguments[i]).trim() !== '') return arguments[i];
  }
  return '';
}

function positiveInt(value, fallback) {
  const number = parseInt(value, 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function unique(values) {
  const seen = {};
  return (values || []).filter(function (value) {
    const key = String(value || '').toLowerCase();
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function uniqueBy(values, keyFn) {
  const seen = {};
  return (values || []).filter(function (value) {
    const key = String(keyFn(value) || '');
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function discoverResourceVersions(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const directPayload = decodePayload(firstNonEmpty(ctx.versionId, ctx.itemId, ctx.id));
  const detailUrl = firstNonEmpty(directPayload.detailUrl, detailURLFromContext(ctx));
  if (!detailUrl) return [];
  const html = await fetchPlaybackText(ctx, detailUrl, detailUrl, null, 4, 'detail-http');
  const title = cleanText(firstNonEmpty(ctx.title, metaContent(html, 'property', 'og:title'), pageTitle(html)));
  const players = parsePlayers(html);
  if (!players.length) throw stageError('detail-players', '源站详情页当前没有可用播放线路');
  const attempts = await inspectPlayerQualities(ctx, detailUrl, players);
  const groups = attempts.filter(function (attempt) { return attempt.qualities.length; })
    .map(function (attempt) { return qualityGroup(detailUrl, title, attempt.player, attempt.qualities); });
  if (groups.length) return groups;
  // Browser execution is one fallback only when static discovery produced no usable line.
  const candidate = attempts.filter(function (attempt) { return !attempt.media; })[0];
  if (candidate && remainingPlaybackSeconds(ctx, 8) > 0.5) {
    const captured = await extractFromBrowser(candidate.player.url, detailUrl, ctx, 8);
    if (captured) {
      const retry = await discoverQualities(ctx, detailUrl, candidate.player, false, captured);
      if (retry.qualities.length) return [qualityGroup(detailUrl, title, retry.player, retry.qualities)];
      candidate.stage = retry.stage;
    }
  }
  const diagnostic = attempts.map(function (attempt) { return attempt.player.line + ':' + attempt.stage; }).join(', ');
  throw stageError('quality-discovery', '未发现可用画质；' + diagnostic + '；请稍后重试');
}

async function resolvePlaybackWithinBudget(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const payload = decodePayload(firstNonEmpty(ctx.versionId, ctx.itemId, ctx.id));
  let playerUrl = firstNonEmpty(ctx.playerUrl, payload.playerUrl);
  let detailUrl = firstNonEmpty(payload.detailUrl, detailURLFromContext(ctx));
  let line = firstNonEmpty(payload.line, ctx.line);
  const requestedHeight = positiveInt(firstNonEmpty(payload.height, ctx.height), 0);
  let media;
  if (detailUrl) {
    const players = parsePlayers(await fetchPlaybackText(ctx, detailUrl, detailUrl, null, 4, 'detail-http'));
    // Refresh saved iframe hosts; line numbers can change when a server retires.
    const byName = players.filter(function (item) {
      return line && normalizePlayerLine(item.line) === normalizePlayerLine(line);
    });
    const selected = byName.length ? byName : players.filter(function (item) {
      return !line && payload.lineId && item.lineId === payload.lineId;
    });
    playerUrl = '';
    // A selected version already specifies its line/quality. Refresh only its
    // player; probing every line and every master again delays native startup.
    if (selected.length) {
      playerUrl = selected[0].url;
      line = selected[0].line;
    }
    const attempts = playerUrl ? [] : await inspectPlayerQualities(ctx, detailUrl, players);
    const usable = attempts.filter(function (attempt) { return attempt.qualities.length; });
    usable.sort(function (a, b) {
      const aExact = a.qualities.some(function (q) { return q.height === requestedHeight && requestedHeight > 0; });
      const bExact = b.qualities.some(function (q) { return q.height === requestedHeight && requestedHeight > 0; });
      return Number(bExact) - Number(aExact) || (b.qualities[0].height || 0) - (a.qualities[0].height || 0);
    });
    const chosen = usable[0];
    const player = chosen ? chosen.player : (selected[0] || players[0]);
    playerUrl = player && player.url;
    line = player && player.line;
    media = chosen && chosen.media;
  }
  if (!playerUrl) throw stageError('detail-players', '未找到 JAVGG 播放器地址');
  if (!media) media = await resolvePlayerMedia(ctx, playerUrl, detailUrl, true);
  if (!media.url) throw stageError(media.stage || 'player-media', '线路 ' + (line || '') + ' 暂时无法解析，请切换其他线路');
  let playable = media.url;
  if (/\.m3u8(?:$|[?#])/i.test(playable)) {
    try {
      const playlist = await fetchPlaybackText(ctx, playable, playerUrl, media.headers, 4, 'manifest-http');
      if (!/#EXTM3U/i.test(playlist)) throw stageError('manifest-not-hls', '来源未返回 HLS 清单');
      const variants = parseMasterPlaylist(playable, playlist);
      const selected = variants.filter(function (item) { return item.height === requestedHeight; })[0] || variants[0];
      if (selected) playable = selected.url;
    } catch (error) {
      if (/-4\d\d$|verification$|not-hls$/.test(error.stage || '')) throw error;
      // Preserve the fresh real master only when probing fails transiently.
    }
  }
  return {
    url: playable,
    container: /\.m3u8(?:$|[?#])/i.test(playable) ? 'm3u8' : 'mp4',
    headers: media.headers,
    startPositionSeconds: 0,
    isLive: false,
    streamKind: /\.m3u8(?:$|[?#])/i.test(playable) ? 'hls' : 'file'
  };
}

function attributeValue(tag, name) {
  return htmlDecode(firstMatch(tag, new RegExp('\\b' + escapeRegExp(name) + '\\s*=\\s*["\']([^"\']*)', 'i')));
}

function normalizePlayerLine(line) {
  const value = String(line || '').toLowerCase();
  return value === 'vh' ? 'vidhide' : value === 'sw' ? 'streamwish' : value;
}

function iframeURL(tag) {
  const url = firstNonEmpty(attributeValue(tag, 'data-lazy-src'), attributeValue(tag, 'data-src'), attributeValue(tag, 'src'));
  return /^https?:\/\//i.test(url) && /earnvidjav|javggvideo|streamhgjav|\/embed\/|\/e\/|\/t\//i.test(url) ? url : '';
}

async function inspectPlayerQualities(ctx, detailUrl, players) {
  const attempts = new Array(players.length);
  let next = 0;
  async function worker() {
    while (next < players.length) {
      const index = next++;
      attempts[index] = await discoverQualities(ctx, detailUrl, players[index], false);
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  return attempts;
}

function capturedHeaders(input) {
  const headers = { 'User-Agent': JAVGG_UA };
  if (input && typeof input === 'object') Object.keys(input).forEach(function (key) {
    const canonical = { 'user-agent': 'User-Agent', referer: 'Referer', origin: 'Origin', cookie: 'Cookie' }[key.toLowerCase()];
    if (canonical) headers[canonical] = String(input[key]);
  });
  return headers;
}

function unpackPlayerScripts(value) {
  const text = String(value || '').slice(0, 500000);
  const pattern = /eval\(function\(p,a,c,k,e,[dr]\)[\s\S]*?\(\s*'((?:\\.|[^'\\])*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'((?:\\.|[^'\\])*)'\.split\('\|'\)/g;
  const output = [];
  let match;
  while (output.length < 4 && (match = pattern.exec(text))) {
    const radix = Number(match[2]), count = Number(match[3]);
    if (radix < 2 || radix > 62 || count < 1 || count > 2000 || match[1].length > 100000) continue;
    const words = decodePackedString(match[4]).split('|');
    const dictionary = Object.create(null);
    for (let index = 0; index < count; index += 1) if (words[index]) dictionary[baseEncode(index, radix)] = words[index];
    output.push(decodePackedString(match[1]).replace(/\b[0-9a-zA-Z]+\b/g, function (token) { return dictionary[token] || token; }));
  }
  return output;
}

function decodePackedString(text) {
  return String(text || '').replace(/\\(['"\\])/g, '$1').replace(/\\x([0-9a-f]{2})|\\u([0-9a-f]{4})/gi, function (_, x, u) { return String.fromCharCode(parseInt(x || u, 16)); });
}

function baseEncode(number, radix) {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (!number) return '0';
  let token = '';
  while (number > 0) { token = alphabet[number % radix] + token; number = Math.floor(number / radix); }
  return token;
}

function stageError(stage, message) {
  const error = new Error(message + '；stage=' + stage);
  error.stage = stage;
  return error;
}

async function runStage(ctx, stage, seconds, operation) {
  const budget = ctx && ctx.__playbackBudget;
  if (budget && budget.expired) throw stageError('total-deadline', '解析超时');
  let timer;
  try {
    const timeout = new Promise(function (_, reject) {
      timer = setTimeout(function () { reject(stageError(stage + '-timeout', '来源请求超时')); }, seconds * 1000);
    });
    return await Promise.race([Promise.resolve().then(operation), timeout]);
  } finally { clearTimeout(timer); }
}

async function withPlaybackBudget(input, operation, label) {
  const ctx = Object.assign({}, normalizeContext(input));
  const budget = { endAt: Date.now() + 28000, expired: false, browserCalls: 0 };
  ctx.__playbackBudget = budget;
  let timer;
  try {
    const timeout = new Promise(function (_, reject) {
      timer = setTimeout(function () { budget.expired = true; reject(stageError('total-deadline', (label || '播放解析') + '超时；请稍后重试')); }, 28000);
    });
    return await Promise.race([Promise.resolve().then(function () { return operation(ctx); }), timeout]);
  } finally { clearTimeout(timer); budget.expired = true; }
}

function remainingPlaybackSeconds(ctx, limit) {
  const budget = ctx && ctx.__playbackBudget;
  if (!budget) return limit;
  const remaining = (budget.endAt - Date.now()) / 1000;
  if (budget.expired || remaining <= 0) throw new Error('播放解析超时；stage=total-deadline');
  return Math.max(0.1, Math.min(limit, remaining));
}

function playbackBrowserSeconds(ctx, limit, maxCalls) {
  const timeout = remainingPlaybackSeconds(ctx, limit);
  const budget = ctx && ctx.__playbackBudget;
  if (budget && budget.browserCalls >= maxCalls) throw new Error('浏览器回退次数已用完；stage=browser-fallback-limit');
  if (budget) budget.browserCalls++;
  return timeout;
}

const exported = {
  WidgetMetadata: WidgetMetadata,
  getManifest: getManifest,
  getHome: getHome,
  getHomeSection: getHomeSection,
  getCategory: getCategory,
  getDetail: getDetail,
  getResourceVersions: getResourceVersions,
  resolvePlayback: resolvePlayback,
  search: search,
  home: getHome,
  homeSection: getHomeSection,
  getSection: getHomeSection,
  category: getCategory,
  detail: getDetail,
  versions: getResourceVersions,
  getVersions: getResourceVersions,
  play: resolvePlayback,
  resolvePlay: resolvePlayback,
  getPlayback: resolvePlayback,
  onSearch: search,
  getSearch: search,
  quickSearch: search
};

if (typeof globalThis !== 'undefined') {
  Object.keys(exported).forEach(function (key) { globalThis[key] = exported[key]; });
}
if (typeof module !== 'undefined' && module.exports) module.exports = exported;
