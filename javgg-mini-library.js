// @name JAVGG Mini Library

const JAVGG_DEFAULT_BASE = 'https://javgg.net';
const JAVGG_LOGO = 'https://javgg.net/javgg.png';
const JAVGG_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const JAVGG_PAYLOAD_PREFIX = 'javgg://';

const WidgetMetadata = {
  id: 'javgg-mini-library',
  name: 'JAVGG',
  title: 'JAVGG',
  version: '1.0.0',
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
  const ctx = normalizeContext(rawCtx);
  const directPayload = decodePayload(firstNonEmpty(ctx.versionId, ctx.itemId, ctx.id));
  const detailUrl = firstNonEmpty(directPayload.detailUrl, detailURLFromContext(ctx));
  if (!detailUrl) return [];
  const html = await fetchText(ctx, detailUrl);
  const title = cleanText(firstNonEmpty(ctx.title, metaContent(html, 'property', 'og:title'), pageTitle(html)));
  const players = parsePlayers(html);
  if (!players.length) throw new Error('源站详情页当前没有可用播放线路');
  const groups = [];
  for (let index = 0; index < players.length; index += 1) {
    const qualities = await discoverQualities(ctx, detailUrl, players[index]);
    if (qualities.length) groups.push(qualityGroup(detailUrl, title, players[index], qualities));
  }
  if (!groups.length) throw new Error('暂时无法发现可用画质，请稍后重试');
  return groups;
}

async function resolvePlayback(rawCtx) {
  const ctx = normalizeContext(rawCtx);
  const payload = decodePayload(firstNonEmpty(ctx.versionId, ctx.itemId, ctx.id));
  let playerUrl = firstNonEmpty(ctx.playerUrl, payload.playerUrl);
  let detailUrl = firstNonEmpty(payload.detailUrl, detailURLFromContext(ctx));
  let line = firstNonEmpty(payload.line, ctx.line);
  if (!playerUrl && detailUrl) {
    const players = parsePlayers(await fetchText(ctx, detailUrl));
    const selected = players.filter(function (item) { return !line || item.line === line; })[0] || players[0];
    playerUrl = selected && selected.url;
    line = selected && selected.line;
  }
  if (!playerUrl) throw new Error('未找到 JAVGG 播放器地址');

  let playable = await resolvePlayerMedia(ctx, playerUrl, detailUrl);
  if (!playable) throw new Error('线路 ' + (line || '') + ' 暂时无法解析，请切换其他线路');
  const requestedHeight = positiveInt(firstNonEmpty(payload.height, ctx.height), 0);
  if (requestedHeight && /\.m3u8(?:$|[?#])/i.test(playable)) {
    try {
      const playlist = await fetchText(ctx, playable, playerUrl);
      const variants = parseMasterPlaylist(playable, playlist);
      const selected = variants.filter(function (item) { return item.height === requestedHeight; })[0];
      if (selected) playable = selected.url;
    } catch (error) {
      // The master itself remains a valid highest/automatic fallback.
    }
  }
  return {
    url: playable,
    container: /\.m3u8(?:$|[?#])/i.test(playable) ? 'm3u8' : 'mp4',
    headers: playbackHeaders(playerUrl),
    startPositionSeconds: 0,
    isLive: false,
    streamKind: /\.m3u8(?:$|[?#])/i.test(playable) ? 'hls' : 'file'
  };
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
  const results = [];
  const iframeURLs = [];
  const iframePattern = /<iframe\b[^>]*(?:data-lazy-src|data-src|src)=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = iframePattern.exec(text))) {
    const url = htmlDecode(match[1]);
    if (/earnvidjav|javggvideo|streamhgjav|\/embed\/|\/e\/|\/t\//i.test(url)) iframeURLs.push(url);
  }
  const optionPattern = /<li\b[^>]*class=["'][^"']*\bdooplay_player_option\b[^"']*["'][^>]*data-post=["']([^"']+)["'][^>]*data-nume=["']([^"']+)["'][^>]*>[\s\S]*?(?:<span[^>]*class=["'][^"']*\btitle\b[^"']*["'][^>]*>([\s\S]*?)<\/span>|Server[\s\S]*?([A-Z]{1,5}))[\s\S]*?<\/li>/gi;
  const labels = [];
  while ((match = optionPattern.exec(text))) labels.push(cleanText(match[3] || match[4]));
  iframeURLs.forEach(function (url, index) {
    const line = labels[index] || ['VH', 'TB', 'SW'][index] || ('线路 ' + (index + 1));
    results.push({ line: line, url: url });
  });
  return uniqueBy(results, function (x) { return x.url; });
}

function qualityGroup(detailUrl, title, player, qualities) {
  return {
    id: 'line-' + player.line,
    title: player.line + ' 线路',
    versions: qualities.map(function (quality, index) {
      const payload = encodePayload({
        kind: 'play', detailUrl: detailUrl, playerUrl: player.url,
        line: player.line, height: quality.height || 0, title: title
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

async function discoverQualities(ctx, detailUrl, player) {
  const mediaURL = await resolvePlayerMedia(ctx, player.url, detailUrl);
  if (!mediaURL) return [];
  if (!/\.m3u8(?:$|[?#])/i.test(mediaURL)) return [{ name: 'MP4', height: 0 }];
  try {
    const playlist = await fetchText(ctx, mediaURL, player.url);
    const variants = parseMasterPlaylist(mediaURL, playlist);
    if (variants.length) {
      return variants.map(function (variant) {
        return { name: variant.height ? variant.height + 'p' : 'HLS', height: variant.height || 0 };
      });
    }
    if (/#EXTINF/i.test(playlist)) return [{ name: 'HLS 原始画质', height: 0 }];
  } catch (error) {
    return [];
  }
  return [];
}

async function resolvePlayerMedia(ctx, playerUrl, detailUrl) {
  let playable = '';
  try {
    playable = extractPlayableURL(await fetchText(ctx, playerUrl, detailUrl || playerUrl));
  } catch (error) {
    playable = '';
  }
  if (!playable) playable = await extractFromBrowser(playerUrl, detailUrl);
  return playable;
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

async function extractFromBrowser(url, referer) {
  if (typeof Widget === 'undefined' || !Widget.browser || typeof Widget.browser.fetch !== 'function') return '';
  try {
    const result = await Widget.browser.fetch(url, {
      visible: false,
      timeout: 70,
      waitAfterLoad: 4,
      waitForAny: true,
      waitForMediaSource: true,
      headers: requestHeaders(referer || url)
    });
    return firstPlayableInBrowserResult(result) ||
      extractPlayableURL(responseText(result)) ||
      extractPlayableURL(result && result.html);
  } catch (error) {
    return '';
  }
}

function firstPlayableInBrowserResult(result) {
  if (!result) return '';
  const keys = ['url', 'mediaURL', 'mediaUrl', 'videoURL', 'videoUrl', 'playURL', 'playUrl', 'src'];
  for (let i = 0; i < keys.length; i += 1) {
    if (isPlayableURL(result[keys[i]])) return result[keys[i]];
  }
  const arrays = [result.mediaSources, result.mediaRequests, result.requests, result.responses, result.urls];
  for (let a = 0; a < arrays.length; a += 1) {
    if (!Array.isArray(arrays[a])) continue;
    for (let i = 0; i < arrays[a].length; i += 1) {
      const item = arrays[a][i];
      const value = typeof item === 'string' ? item : firstNonEmpty(item && item.url, item && item.src, item && item.responseURL);
      if (isPlayableURL(value) && !/^blob:/i.test(value)) return value;
    }
  }
  return '';
}

function extractPlayableURL(value) {
  let text = htmlDecode(responseText(value)).replace(/\\\//g, '/');
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
  return {
    'User-Agent': JAVGG_UA,
    Referer: playerUrl,
    Origin: originOf(playerUrl)
  };
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
