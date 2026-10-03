// @name girigirilove baiPlay Mini Library

const GIRI_DEFAULT_SITE = 'https://ani.girigirilove.com';
const GIRI_ICON = 'https://ani.girigirilove.com/upload/anime.girigirilove.com_.png';
const GIRI_PAYLOAD_PREFIX = 'girigiri://item?';
const GIRI_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const WidgetMetadata = {
  id: 'girigirilove-mini-library',
  name: '爱动漫',
  title: '爱动漫',
  version: '1.0.1',
  author: 'Alan huang',
  logo: GIRI_ICON,
  icon: GIRI_ICON,
  site: GIRI_DEFAULT_SITE,
  description: 'ギリギリ愛动漫 baiPlay 自定义媒体库，支持首页、分类、搜索、详情、剧集和播放解析。'
};

const GIRI_CATEGORIES = [
  { id: 'latest', title: '最新更新', path: '/', style: 'discover.spotlight' },
  { id: 'japanese', title: '日番', cat: '2', style: 'discover.posterCompact' },
  { id: 'movie', title: '剧场版', cat: '21', style: 'discover.posterCompact' },
  { id: 'american', title: '美番', cat: '3', style: 'discover.posterCompact' }
];

const GIRI_SORTS = [
  { id: 'latest', title: '最新', value: 'latest' },
  { id: 'hot', title: '最热', value: 'hot' },
  { id: 'score', title: '评分', value: 'score' }
];

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
      resourceMatching: false
    },
    aggregation: {
      search: true,
      playbackHistory: true,
      resourceMatching: false
    },
    parameters: [
      {
        name: 'baseURL',
        title: '站点地址',
        type: 'input',
        defaultValue: GIRI_DEFAULT_SITE,
        required: true,
        description: '默认使用 ani.girigirilove.com。'
      },
      {
        name: 'cacheMinutes',
        title: '页面缓存分钟',
        type: 'number',
        defaultValue: 10,
        required: false,
        description: '短期缓存列表、详情和播放页，减少重复请求。'
      }
    ]
  };
}

async function getHome(ctx) {
  ctx = normalizeRuntimeContext(ctx);
  const sections = GIRI_CATEGORIES.map(function (category) {
    return {
      id: category.id,
      title: category.title,
      style: category.style,
      lazy: true,
      items: [],
      moreAction: categoryAction(ctx, category),
      loadAction: { type: 'custom', sectionId: category.id, id: category.id, title: category.title }
    };
  });
  return {
    pageType: 'home',
    id: 'girigiri-home',
    title: '爱动漫',
    heroAspectRatio: '2:3',
    hero: [],
    sections: sections
  };
}

async function getHomeSection(ctx) {
  ctx = normalizeRuntimeContext(ctx);
  const section = findCategory(ctx && (ctx.sectionId || ctx.id)) || GIRI_CATEGORIES[0];
  try {
    const page = await fetchCategoryPage(ctx, section, 1, 'latest');
    return {
      id: section.id,
      title: section.title,
      style: section.style,
      lazy: false,
      moreAction: categoryAction(ctx, section),
      items: page.items.slice(0, 18)
    };
  } catch (error) {
    return sectionError(section, error);
  }
}

async function getCategory(ctx) {
  ctx = normalizeRuntimeContext(ctx);
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  const pageId = stringValue(ctx && (ctx.pageId || ctx.id)) || 'latest';
  const section = findCategory(pageId) || GIRI_CATEGORIES[0];
  const sort = stringValue(contextValue(ctx, 'sort') || contextValue(ctx, 'sortBy') || contextValue(ctx, 'sort_by') || 'latest');
  const result = await fetchCategoryPage(ctx, section, page, sort);
  return {
    pageType: 'category',
    id: section.id,
    title: section.title,
    style: 'media.posterGrid',
    itemAspectRatio: '2:3',
    items: result.items,
    page: page,
    hasMore: result.hasMore,
    selectedSortValue: sort,
    sort: section.id === 'latest' ? [] : GIRI_SORTS
  };
}

async function getDetail(ctx) {
  ctx = normalizeRuntimeContext(ctx);
  const payload = decodePayload(ctx && (ctx.itemId || ctx.id || ctx.sourceId));
  const id = firstNonEmpty(payload && payload.id, ctx && ctx.itemId, ctx && ctx.id);
  if (!id) throw new Error('爱动漫详情参数无效');
  if (isPlayId(id)) return playDetail(ctx, id);

  const detailUrl = siteURL(ctx, '/' + trimSlashes(id) + '/');
  const html = await fetchText(ctx, detailUrl);
  const detail = parseDetail(ctx, html, id);
  const firstEpisode = detail.episodes[0];
  const resourceGroups = firstEpisode ? [{
    id: 'girigiri-episodes',
    title: '在线播放',
    versions: detail.episodes.map(function (episode, index) {
      const versionId = encodePayload({ id: episode.id, title: detail.title, episodeTitle: episode.title });
      const episodePageURL = siteURL(ctx, '/' + trimSlashes(episode.id) + '/');
      return {
        id: versionId,
        title: episode.title,
        name: episode.title,
        url: episodePageURL,
        path: episodePageURL,
        playUrl: '',
        default: index === 0,
        container: 'm3u8',
        sourceName: '爱动漫',
        action: {
          type: 'play',
          itemId: encodePayload({ id: id, title: detail.title, poster: detail.poster }),
          episodeId: versionId,
          versionId: versionId,
          url: episodePageURL,
          title: episode.title
        }
      };
    })
  }] : [];

  return {
    pageType: 'detail',
    id: encodePayload({ id: id, title: detail.title, poster: detail.poster }),
    title: detail.title,
    type: detail.isSeries ? 'series' : 'movie',
    poster: detail.poster,
    backdrop: detail.poster,
    detailImageAspectRatio: '2:3',
    imageHeaders: imageHeaders(ctx),
    posterHeaders: imageHeaders(ctx),
    backdropHeaders: imageHeaders(ctx),
    overview: detail.overview,
    rating: detail.rating,
    remarks: detail.remarks,
    seasons: detail.isSeries && detail.episodes.length ? [{
      id: 'season-1',
      title: '播放列表',
      seasonNumber: 1,
      episodes: detail.episodes.map(function (episode, index) {
        const episodeId = encodePayload({ id: episode.id, title: detail.title, episodeTitle: episode.title });
        const episodePageURL = siteURL(ctx, '/' + trimSlashes(episode.id) + '/');
        return {
          id: episodeId,
          title: episode.title,
          episodeNumber: index + 1,
          action: {
            type: 'play',
            itemId: encodePayload({ id: id, title: detail.title, poster: detail.poster }),
            episodeId: episodeId,
            versionId: episodeId,
            url: episodePageURL,
            title: episode.title
          }
        };
      })
    }] : [],
    resourceGroups: resourceGroups,
    recommendations: [{
      id: 'related',
      title: '相关推荐',
      style: 'discover.posterCompact',
      items: detail.related.slice(0, 12)
    }],
    providerIds: {
      girigiri: id,
      source: WidgetMetadata.id
    }
  };
}

async function getResourceVersions(ctx) {
  ctx = normalizeRuntimeContext(ctx);
  const selected = firstNonEmpty(ctx && ctx.episodeId, ctx && ctx.versionId);
  const selectedPayload = decodePayload(selected);
  const selectedId = firstNonEmpty(selectedPayload && selectedPayload.id, selected);
  const payload = decodePayload(isPlayId(selectedId) ? selected : ctx && (ctx.itemId || ctx.id));
  const id = firstNonEmpty(payload && payload.id, ctx && ctx.itemId, ctx && ctx.id);
  if (!id) return [];
  if (isPlayId(id)) {
    const title = firstNonEmpty(payload && payload.title, ctx && ctx.title, '爱动漫');
    const episodeTitle = firstNonEmpty(payload && payload.episodeTitle, ctx && ctx.name, '默认线路');
    return [{
      id: 'girigiri-play',
      title: '在线播放',
      versions: [{
        id: encodePayload({ id: id, title: title, episodeTitle: episodeTitle }),
        title: episodeTitle,
        name: episodeTitle,
        url: siteURL(ctx, '/' + trimSlashes(id) + '/'),
        path: siteURL(ctx, '/' + trimSlashes(id) + '/'),
        playUrl: '',
        default: true,
        container: 'm3u8',
        sourceName: '爱动漫'
      }]
    }];
  }
  const detail = await getDetail({ itemId: encodePayload({ id: id }), params: ctx && ctx.params, config: ctx && ctx.config, settings: ctx && ctx.settings });
  return detail.resourceGroups || [];
}

async function resolvePlayback(ctx) {
  ctx = normalizeRuntimeContext(ctx);
  const direct = firstPlayable(ctx && ctx.playUrl, ctx && ctx.videoUrl, ctx && ctx.mediaUrl, ctx && ctx.src);
  const resolved = direct ? { url: direct, referer: ctx && ctx.referer } : await resolveFirstPlayable(ctx);
  const url = resolved && resolved.url;
  if (!url) throw new Error('未能解析到爱动漫播放地址：没有拿到有效播放页，或播放页未包含 player_aaaa');
  const container = containerOf(url);
  return {
    url: url,
    videoUrl: url,
    playUrl: url,
    path: url,
    type: container === 'm3u8' ? 'hls' : container,
    protocol: container === 'm3u8' ? 'hls' : '',
    container: container,
    mimeType: container === 'm3u8' ? 'application/vnd.apple.mpegurl' : '',
    headers: playbackHeaders(ctx, resolved && resolved.referer),
    header: playbackHeaders(ctx, resolved && resolved.referer),
    Header: playbackHeaders(ctx, resolved && resolved.referer),
    customHeaders: playbackHeaders(ctx, resolved && resolved.referer),
    subtitles: [],
    startPositionSeconds: 0,
    isLive: false,
    streamKind: container === 'm3u8' ? 'hls' : 'file'
  };
}

async function resolveFirstPlayable(ctx) {
  const candidates = playbackCandidates(ctx);
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    if (!candidate) continue;
    if (isPlayableURL(candidate)) return { url: candidate, referer: ctx && ctx.referer };
    try {
      if (isPlayId(candidate) || /^https?:\/\/[^/]+\/play/i.test(candidate)) {
        const resolved = await resolvePlayPage(ctx, candidate);
        if (isPlayableURL(resolved.url || resolved)) return typeof resolved === 'string' ? { url: resolved, referer: playPageURL(ctx, candidate) } : resolved;
      } else if (isDetailId(candidate)) {
        const detailURL = siteURL(ctx, '/' + trimSlashes(candidate) + '/');
        const html = await fetchText(ctx, detailURL);
        const detail = parseDetail(ctx, html, candidate);
        if (detail.episodes && detail.episodes.length) {
          const resolved = await resolvePlayPage(ctx, detail.episodes[0].id);
          if (isPlayableURL(resolved.url || resolved)) return typeof resolved === 'string' ? { url: resolved, referer: playPageURL(ctx, detail.episodes[0].id) } : resolved;
        }
      }
    } catch (error) {
      // Try the next candidate; baiPlay may pass different context shapes.
    }
  }
  return null;
}

function playbackCandidates(ctx) {
  const values = [];
  ['versionId', 'episodeId', 'itemId', 'id', 'url', 'path', 'playUrl', 'videoUrl'].forEach(function (key) {
    const value = ctx && ctx[key];
    const payload = decodePayload(value);
    if (payload && payload.playUrl) values.push(payload.playUrl);
    if (payload && payload.id) values.push(payload.id);
    if (value) values.push(value);
  });
  const output = [];
  values.forEach(function (value) {
    const cleaned = normalizePlaybackId(value);
    if (cleaned && output.indexOf(cleaned) < 0) output.push(cleaned);
  });
  return output;
}

async function getPlayback(ctx) {
  return resolvePlayback(ctx || {});
}

async function play(flagOrInput, id) {
  const input = typeof flagOrInput === 'object' && flagOrInput ? flagOrInput : { id: id || flagOrInput };
  const playback = await resolvePlayback(input);
  return {
    parse: 0,
    jx: 0,
    url: playback.url,
    playUrl: playback.url,
    videoUrl: playback.url,
    header: playback.headers,
    headers: playback.headers,
    Header: playback.headers,
    customHeaders: playback.headers,
    contentType: playback.mimeType,
    type: playback.type,
    container: playback.container
  };
}

async function search(ctx) {
  ctx = normalizeRuntimeContext(ctx);
  const query = stringValue(ctx && (ctx.query || ctx.keyword || ctx.text));
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  if (!query) return { pageType: 'search', title: '搜索结果', items: [], page: page, hasMore: false };
  const url = siteURL(ctx, '/search/-------------' + (page > 1 ? page : '') + '---/');
  const html = await postText(ctx, url, 'wd=' + encodeURIComponent(query));
  const items = parseCards(ctx, html);
  return {
    pageType: 'search',
    title: '搜索结果',
    items: items,
    page: page,
    hasMore: hasNextPage(html, page)
  };
}

async function onSearch(ctx) {
  return search(ctx || {});
}

async function getSearch(ctx) {
  return search(ctx || {});
}

async function matchResources(ctx) {
  ctx = normalizeRuntimeContext(ctx);
  const query = stringValue(ctx && (ctx.title || ctx.name || ctx.query || ctx.keyword));
  if (!query) return { results: [] };
  const results = await search({ query: query, params: ctx && ctx.params, config: ctx && ctx.config });
  return { results: (results.items || []).slice(0, 8) };
}

async function fetchCategoryPage(ctx, section, page, sort) {
  const url = categoryURL(ctx, section, page, sort);
  const html = await fetchText(ctx, url);
  return {
    items: parseCards(ctx, html),
    hasMore: hasNextPage(html, page)
  };
}

function categoryURL(ctx, section, page, sort) {
  if (section.id === 'latest') return page > 1 ? siteURL(ctx, '/show/2--------' + page + '---/') : siteURL(ctx, '/');
  const sortValue = sortParam(sort);
  return siteURL(ctx, '/show/' + section.cat + '--' + sortValue + '------' + page + '---/');
}

function sortParam(sort) {
  if (sort === 'hot') return 'hits';
  if (sort === 'score') return 'score';
  return '';
}

async function fetchText(ctx, url) {
  const cached = getCached(ctx, url);
  if (cached) return cached;
  const response = await httpGet(url, { headers: requestHeaders(ctx, url) });
  const text = responseText(response);
  const status = Number(response && (response.status || response.statusCode)) || 200;
  if (status >= 400) throw new Error('爱动漫源站 HTTP ' + status);
  if (!text || /Just a moment|cf-mitigated|Cloudflare Ray ID|<title>\s*(?:Service Unavailable|Bad Gateway|Error)/i.test(text)) throw new Error('空响应、错误页或浏览器验证页');
  setCached(ctx, url, text);
  return text;
}

async function postText(ctx, url, body) {
  const response = await httpPost(url, body, {
    headers: Object.assign({}, requestHeaders(ctx, url), {
      'Content-Type': 'application/x-www-form-urlencoded'
    })
  });
  return responseText(response);
}

function httpGet(url, options) {
  if (typeof Widget !== 'undefined' && Widget.http && typeof Widget.http.get === 'function') {
    return Widget.http.get(url, options || {});
  }
  if (typeof $http !== 'undefined' && typeof $http.get === 'function') {
    return $http.get(url, options || {});
  }
  throw new Error('当前运行环境没有可用 HTTP 客户端');
}

function httpPost(url, body, options) {
  if (typeof Widget !== 'undefined' && Widget.http && typeof Widget.http.post === 'function') {
    return Widget.http.post(url, body, options || {});
  }
  if (typeof $http !== 'undefined' && typeof $http.post === 'function') {
    return $http.post(url, body, options || {});
  }
  throw new Error('当前运行环境没有可用 HTTP 客户端');
}

function parseCards(ctx, html) {
  const items = [];
  const seen = {};
  const source = String(html || '');
  const pattern = /<a\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(source))) {
    const attrs = match[1] || '';
    if (!/\bpublic-list-exp\b/.test(attr(attrs, 'class'))) continue;
    const block = match[0];
    const href = attr(attrs, 'href');
    const title = cleanText(attr(attrs, 'title') || firstMatch(block, /alt=["']([^"']+)["']/i));
    const id = cleanId(href);
    if (!id || !title || seen[id]) continue;
    seen[id] = true;
    const poster = absoluteURL(ctx, firstNonEmpty(
      attr(block, 'data-src'),
      attr(block, 'data-original'),
      attr(block, 'src')
    ));
    const remarks = cleanText(firstMatch(block, /<span[^>]*class=["'][^"']*public-list-prb[^"']*["'][^>]*>([\s\S]*?)<\/span>/i));
    const rating = cleanText(firstMatch(block, /<span[^>]*class=["'][^"']*public-prt[^"']*["'][^>]*>([\s\S]*?)<\/span>/i));
    items.push({
      id: encodePayload({ id: id, title: title, poster: poster }),
      title: title,
      name: title,
      type: 'series',
      poster: poster,
      backdrop: poster,
      thumbnailURL: poster,
      posterPath: poster,
      coverUrl: poster,
      imageHeaders: imageHeaders(ctx),
      subtitle: remarks || rating,
      remarks: remarks,
      rating: numericRating(rating),
      aspectRatio: '2:3',
      providerIds: { girigiri: id, source: WidgetMetadata.id },
      action: {
        type: 'detail',
        id: encodePayload({ id: id, title: title, poster: poster }),
        itemId: encodePayload({ id: id, title: title, poster: poster }),
        url: siteURL(ctx, '/' + id + '/')
      }
    });
  }
  return items;
}

function parseDetail(ctx, html, id) {
  const source = String(html || '');
  const title = cleanText(firstNonEmpty(
    firstMatch(source, /<[^>]*class=["'][^"']*slide-info-title[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i),
    firstMatch(source, /<h[123][^>]*>([\s\S]*?)<\/h[123]>/i),
    titleFromId(id)
  ));
  const poster = absoluteURL(ctx, firstNonEmpty(
    firstMatch(source, /<img[^>]*class=["'][^"']*lazy[^"']*["'][^>]*(?:data-src|src)=["']([^"']+)["']/i),
    firstMatch(source, /(?:data-src|src)=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i)
  ));
  const overview = cleanText(firstNonEmpty(
    firstMatch(source, /<div[^>]*class=["'][^"']*text[^"']*cor3[^"']*["'][^>]*>([\s\S]*?)<\/div>/i),
    metaContent(source, 'description')
  ));
  const remarks = cleanText(firstMatch(source, /<[^>]*class=["'][^"']*slide-info-remarks[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i));
  const rating = numericRating(cleanText(firstMatch(source, /<div[^>]*class=["'][^"']*fraction[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)));
  const group = bestEpisodeGroup(source);
  const episodes = parseEpisodes(group);
  const related = parseRelated(ctx, source);
  return {
    title: title,
    poster: poster,
    overview: overview,
    remarks: remarks,
    rating: rating,
    episodes: episodes,
    isSeries: /(?:更新至|全)\s*\d+\s*集|连载|TV动画|电视剧/.test(remarks) || episodes.length > 1,
    related: related
  };
}

function bestEpisodeGroup(html) {
  const source = String(html || '');
  const groups = giriElementBlocks(source, 'anthology-list-box');
  if (!groups.length) return '';
  const tabs = []; const pattern = /<a\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/a>/gi; let match;
  const tabBlock = giriElementBlocks(source, 'anthology-tab').join('');
  while ((match = pattern.exec(tabBlock))) if (/\bswiper-slide\b/.test(attr(match[1], 'class'))) tabs.push(cleanText(match[2]));
  for (let index = 0; index < tabs.length; index++) if (tabs[index].indexOf('简中') >= 0 && groups[index]) return groups[index];
  return groups.find(group => /\/play[^"']+-2-\d+\/?/i.test(group)) || groups[0];
}

function parseEpisodes(html) {
  const episodes = []; const seen = {};
  const pattern = /<a\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(String(html || '')))) {
    const id = cleanId(attr(match[1], 'href')); const raw = cleanText(match[2]);
    if (!id || !isPlayId(id) || !raw || seen[id]) continue;
    seen[id] = true;
    episodes.push({ id, title: /^\d+$/.test(raw) && Number(raw) <= 100 ? '第' + Number(raw) + '集' : raw });
  }
  return episodes;
}

function parseRelated(ctx, html) {
  const relatedBlock = firstMatch(html, /<[^>]*class=["'][^"']*related[^"']*["'][^>]*>([\s\S]*)/i);
  return parseCards(ctx, relatedBlock || html).slice(0, 12);
}

async function playDetail(ctx, id) {
  const resolved = await resolvePlayPage(ctx, id);
  const url = resolved && resolved.url;
  return {
    pageType: 'detail',
    id: encodePayload({ id: id, playUrl: url }),
    title: '播放',
    type: 'movie',
    overview: '',
    resourceGroups: [{
      id: 'girigiri-play',
      title: '在线播放',
      versions: [{
        id: encodePayload({ id: id, playUrl: url }),
        title: '默认线路',
        name: '默认线路',
        url: url,
        playUrl: url,
        default: true,
        container: containerOf(url)
      }]
    }]
  };
}

async function resolvePlayPage(ctx, playId) {
  const playUrl = playPageURL(ctx, playId);
  const html = await fetchText(ctx, playUrl);
  return { url: resolvePlayUrl(html), referer: playUrl };
}

function resolvePlayUrl(html) {
  const source = String(html || '');
  const match = source.match(/player_aaaa\s*=\s*({[\s\S]*?})\s*(?:;?\s*<\/script>|;)/i);
  if (!match) return '';
  try {
    const data = JSON.parse(match[1]);
    let url = data && data.url ? String(data.url) : '';
    if (Number(data.encrypt) === 2) url = decodeURIComponent(base64decode(url));
    if (Number(data.encrypt) === 1) url = decodeURIComponent(url);
    if (url.indexOf('//') === 0) url = 'https:' + url;
    return url;
  } catch (error) {
    const rawURL = firstMatch(source, /["']url["']\s*:\s*["']([^"']+)["']/i);
    const encrypt = Number(firstMatch(source, /["']encrypt["']\s*:\s*(\d+)/i));
    return decodePlayerURL(rawURL, encrypt);
  }
}

function decodePlayerURL(value, encrypt) {
  let url = String(value || '');
  if (!url) return '';
  try {
    if (Number(encrypt) === 2) url = decodeURIComponent(base64decode(url));
    if (Number(encrypt) === 1) url = decodeURIComponent(url);
  } catch (error) {
    return '';
  }
  if (url.indexOf('//') === 0) url = 'https:' + url;
  return url;
}

function base64decode(str) {
  if (typeof atob === 'function') return atob(str);
  if (typeof Buffer !== 'undefined') return Buffer.from(String(str || ''), 'base64').toString('binary');
  return '';
}

function requestHeaders(ctx, referer) {
  return {
    Referer: referer || baseURL(ctx) + '/',
    Origin: baseURL(ctx),
    'User-Agent': GIRI_UA,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
  };
}

function imageHeaders(ctx) {
  return {
    Referer: baseURL(ctx) + '/',
    'User-Agent': GIRI_UA
  };
}

function playbackHeaders(ctx, referer) {
  return {
    Referer: referer || baseURL(ctx) + '/',
    Origin: baseURL(ctx),
    'User-Agent': GIRI_UA
  };
}

function categoryAction(ctx, category) {
  return {
    type: 'category',
    id: category.id,
    pageId: category.id,
    title: category.title,
    itemAspectRatio: '2:3',
    url: categoryURL(ctx, category, 1, 'latest')
  };
}

function sectionError(section, error) {
  return {
    id: section.id,
    title: section.title,
    style: section.style,
    lazy: false,
    items: [{
      id: section.id + '-error',
      title: '加载失败',
      subtitle: cleanText(error && error.message) || '请稍后重试',
      type: 'collection',
      action: { type: 'category', pageId: section.id, title: section.title }
    }]
  };
}

function contextValue(ctx, key) {
  if (!ctx || !key) return '';
  if (ctx[key] !== undefined && ctx[key] !== null && ctx[key] !== '') return ctx[key];
  const bags = [ctx.params, ctx.config, ctx.settings, ctx.parameters];
  for (let index = 0; index < bags.length; index += 1) {
    const bag = bags[index];
    if (bag && bag[key] !== undefined && bag[key] !== null && bag[key] !== '') return bag[key];
  }
  return '';
}

function baseURL(ctx) {
  return (stringValue(contextValue(ctx, 'baseURL') || contextValue(ctx, 'baseUrl')) || GIRI_DEFAULT_SITE).replace(/\/+$/, '');
}

function siteURL(ctx, path) {
  const value = stringValue(path);
  if (/^https?:\/\//i.test(value)) return value;
  return baseURL(ctx) + (value[0] === '/' ? value : '/' + value);
}

function findCategory(id) {
  const value = stringValue(id);
  return GIRI_CATEGORIES.find(function (category) {
    return category.id === value || category.title === value || category.cat === value;
  });
}

function cleanId(value) {
  return trimSlashes(String(value || '').replace(/^https?:\/\/[^/]+/i, ''));
}

function normalizePlaybackId(value) {
  const payload = decodePayload(value);
  if (payload && payload.id) return payload.id;
  const text = stringValue(value);
  if (!text) return '';
  if (/^https?:\/\//i.test(text)) {
    const match = text.match(/^https?:\/\/[^/]+\/([^?#]+)/i);
    return match ? trimSlashes(match[1]) : text;
  }
  return trimSlashes(text);
}

function playPageURL(ctx, playId) {
  const text = stringValue(playId);
  if (/^https?:\/\//i.test(text)) return text;
  return siteURL(ctx, '/' + trimSlashes(text) + '/');
}

function trimSlashes(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '');
}

function encodePayload(data) {
  const parts = [];
  Object.keys(data || {}).forEach(function (key) {
    const value = data[key];
    if (value === undefined || value === null || value === '') return;
    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
  });
  return GIRI_PAYLOAD_PREFIX + parts.join('&');
}

function decodePayload(value) {
  const text = stringValue(value);
  if (text.indexOf(GIRI_PAYLOAD_PREFIX) !== 0) return null;
  const result = {};
  text.slice(GIRI_PAYLOAD_PREFIX.length).split('&').forEach(function (part) {
    const index = part.indexOf('=');
    const key = index >= 0 ? part.slice(0, index) : part;
    const raw = index >= 0 ? part.slice(index + 1) : '';
    try {
      result[decodeURIComponent(key)] = decodeURIComponent(raw);
    } catch (error) {
      result[key] = raw;
    }
  });
  return result.id ? result : null;
}

function getCached(ctx, url) {
  const ttl = positiveInt(contextValue(ctx, 'cacheMinutes'), 10) * 60 * 1000;
  const key = 'girigiri:html:' + url;
  const now = Date.now();
  if (typeof globalThis !== 'undefined' && globalThis.__GIRI_CACHE__ && globalThis.__GIRI_CACHE__[key] && globalThis.__GIRI_CACHE__[key].expiresAt > now) {
    return globalThis.__GIRI_CACHE__[key].text;
  }
  return '';
}

function setCached(ctx, url, text) {
  const ttl = positiveInt(contextValue(ctx, 'cacheMinutes'), 10) * 60 * 1000;
  if (!ttl || !text) return;
  if (typeof globalThis === 'undefined') return;
  if (!globalThis.__GIRI_CACHE__) globalThis.__GIRI_CACHE__ = {};
  globalThis.__GIRI_CACHE__['girigiri:html:' + url] = { text: text, expiresAt: Date.now() + ttl };
}

function responseText(response) {
  if (typeof response === 'string') return response;
  if (!response) return '';
  if (typeof response.data === 'string') return response.data;
  if (typeof response.body === 'string') return response.body;
  return String(response.data || response.body || '');
}

function attr(block, name) {
  const pattern = new RegExp(name + '\\s*=\\s*(?:"([^"]*)"|\\\'([^\\\']*)\\\'|([^\\s>]+))', 'i');
  const match = pattern.exec(String(block || ''));
  return match ? decodeEntities(match[1] || match[2] || match[3] || '') : '';
}

function metaContent(html, name) {
  const pattern = new RegExp('<meta[^>]+name=["\\\']' + name + '["\\\'][^>]+content=["\\\']([^"\\\']*)["\\\']', 'i');
  const match = pattern.exec(String(html || ''));
  return match ? match[1] : '';
}

function absoluteURL(ctx, url) {
  const value = decodeEntities(String(url || '').trim());
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.indexOf('//') === 0) return 'https:' + value;
  return siteURL(ctx, value);
}

function hasNextPage(html, page) {
  if (new RegExp('>' + (page + 1) + '<').test(String(html || ''))) return true;
  return /下一页|Next|next/i.test(cleanText(html));
}

function titleFromId(id) {
  const parts = trimSlashes(id).split('/');
  return decodeURIComponentSafe(parts[parts.length - 1] || '爱动漫').replace(/[-_]+/g, ' ');
}

function decodeURIComponentSafe(value) {
  try {
    return decodeURIComponent(String(value || ''));
  } catch (error) {
    return String(value || '');
  }
}

function isPlayId(id) {
  return /^play(?:\/|[A-Za-z0-9])/i.test(trimSlashes(id));
}

function isDetailId(id) {
  return /^GV\d+$/i.test(trimSlashes(id));
}

function isPlayableURL(url) {
  return /^https?:\/\//i.test(String(url || '')) && /\.(?:m3u8|mp4|mpd|m4v|mov|webm|mkv|ts)(?:[?#]|$)/i.test(String(url || ''));
}

function firstPlayable() {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = arguments[index];
    if (isPlayableURL(value)) return value;
  }
  return '';
}

function containerOf(url) {
  const match = String(url || '').match(/\.(m3u8|mpd|mp4|m4v|mov|webm|mkv|ts)(?:[?#]|$)/i);
  if (!match) return 'm3u8';
  return match[1].toLowerCase();
}

function numericRating(value) {
  const number = Number(String(value || '').match(/\d+(?:\.\d+)?/) || '');
  return Number.isFinite(number) ? number : undefined;
}

function firstMatch(value, regex) {
  const match = regex.exec(String(value || ''));
  if (!match) return '';
  for (let index = 1; index < match.length; index += 1) {
    if (match[index]) return match[index];
  }
  return match[0] || '';
}

function firstNonEmpty() {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = arguments[index];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
}

function stripTags(value) {
  return String(value || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&#x([0-9a-f]+);/gi, function (_, hex) { return String.fromCharCode(parseInt(hex, 16)); })
    .replace(/&#(\d+);/g, function (_, num) { return String.fromCharCode(parseInt(num, 10)); })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function cleanText(value) {
  return decodeEntities(stripTags(value)).replace(/\s+/g, ' ').trim();
}

function stringValue(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function positiveInt(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

const GirigiriLoveMiniLibrary = {
  metadata: WidgetMetadata,
  getManifest: getManifest,
  getHome: getHome,
  getHomeSection: getHomeSection,
  getCategory: getCategory,
  getDetail: getDetail,
  getResourceVersions: getResourceVersions,
  resolvePlayback: resolvePlayback,
  getPlayback: getPlayback,
  play: play,
  search: search,
  onSearch: onSearch,
  getSearch: getSearch,
  matchResources: matchResources,
  matchMovie: matchResources
};

function __jsEvalReturn() {
  return GirigiriLoveMiniLibrary;
}

if (typeof globalThis !== 'undefined') {
  globalThis.WidgetMetadata = WidgetMetadata;
  globalThis.GirigiriLoveMiniLibrary = GirigiriLoveMiniLibrary;
  globalThis.getManifest = getManifest;
  globalThis.getHome = getHome;
  globalThis.getHomeSection = getHomeSection;
  globalThis.getCategory = getCategory;
  globalThis.getDetail = getDetail;
  globalThis.getResourceVersions = getResourceVersions;
  globalThis.resolvePlayback = resolvePlayback;
  globalThis.getPlayback = getPlayback;
  globalThis.play = play;
  globalThis.search = search;
  globalThis.onSearch = onSearch;
  globalThis.getSearch = getSearch;
  globalThis.matchResources = matchResources;
  globalThis.matchMovie = matchResources;
  globalThis.__jsEvalReturn = __jsEvalReturn;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GirigiriLoveMiniLibrary;
}

function normalizeRuntimeContext(input) {
  let ctx = input;
  if (typeof ctx === 'string') { try { ctx = JSON.parse(ctx); } catch (_) { ctx = {}; } }
  if (!ctx || typeof ctx !== 'object' || Array.isArray(ctx)) return {};
  const nested = {};
  ['params', 'config', 'settings', 'parameters', 'pagination', 'pageInfo'].forEach(function (key) {
    let bag = ctx[key];
    if (typeof bag === 'string') { try { bag = JSON.parse(bag); } catch (_) { bag = null; } }
    if (bag && typeof bag === 'object' && !Array.isArray(bag)) Object.keys(bag).forEach(function (name) { if (nested[name] === undefined) nested[name] = bag[name]; });
  });
  return Object.assign(nested, ctx);
}

function giriElementBlocks(html, className) {
  const source = String(html || ''); const blocks = [];
  const opening = /<([a-z][a-z0-9-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
  let match;
  while ((match = opening.exec(source))) {
    if ((' ' + attr(match[2], 'class') + ' ').indexOf(' ' + className + ' ') < 0) continue;
    const name = match[1].toLowerCase(); const start = opening.lastIndex;
    const tags = /<\/?([a-z][a-z0-9-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
    tags.lastIndex = start; let depth = 1; let tag;
    while ((tag = tags.exec(source))) {
      if (tag[1].toLowerCase() !== name) continue;
      if (tag[0][1] === '/') depth--; else if (!/\/\s*>$/.test(tag[0])) depth++;
      if (!depth) { blocks.push(source.slice(start, tag.index)); opening.lastIndex = tags.lastIndex; break; }
    }
  }
  return blocks;
}
