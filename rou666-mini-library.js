// @name 肉视频 Mini Library

const ROU_DEFAULT_BASE = 'https://rou666.cc';
const ROU_DEFAULT_PROXY_BASE = 'https://rou666-hls-rewrite.douyin-skip-community.workers.dev';
const ROU_LOGO = ROU_DEFAULT_BASE + '/android-chrome-192x192.png';
const ROU_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

const WidgetMetadata = {
  id: 'rou666-mini-library',
  name: '肉视频',
  title: '肉视频',
  version: '1.3.0',
  requiredVersion: '0.0.1',
  author: 'Alan huang',
  site: ROU_DEFAULT_BASE,
  logo: ROU_LOGO,
  icon: ROU_LOGO,
  description: '肉视频自定义媒体库，支持站内分类、视频、AI短剧、搜索、详情和原生 HLS 播放。'
};

const ROU_SECTIONS = [
  { id: 'videos', title: '最新视频', kind: 'videos', style: 'discover.spotlight' },
  { id: 'series', title: '最新剧集', kind: 'series', style: 'discover.posterCompact', query: { f: 'fresh' } },
  { id: 'tag:國產AV', title: '国产AV', kind: 'tag', tag: '國產AV', style: 'discover.posterCompact' },
  { id: 'tag:探花', title: '探花', kind: 'tag', tag: '探花', style: 'discover.posterCompact' },
  { id: 'tag:自拍流出', title: '自拍流出', kind: 'tag', tag: '自拍流出', style: 'discover.posterCompact' },
  { id: 'tag:OnlyFans', title: 'OnlyFans', kind: 'tag', tag: 'OnlyFans', style: 'discover.posterCompact' },
  { id: 'tag:日本', title: '日本', kind: 'tag', tag: '日本', style: 'discover.posterCompact' }
];

const ROU_VIDEO_SORTS = [
  { id: 'createdAt', title: '最新发布', value: 'createdAt' },
  { id: 'viewCount', title: '最多观看', value: 'viewCount' },
  { id: 'likeCount', title: '最多喜欢', value: 'likeCount' }
];

const ROU_SERIES_SORTS = [
  { id: 'updated', title: '最新更新', value: 'updated' },
  { id: 'hot', title: '最多观看', value: 'hot' },
  { id: 'likes', title: '最多喜欢', value: 'likes' },
  { id: 'most', title: '集数最多', value: 'most' }
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
    parameters: [
      {
        name: 'baseUrl',
        title: '站点地址',
        type: 'input',
        defaultValue: ROU_DEFAULT_BASE,
        value: ROU_DEFAULT_BASE,
        required: true,
        description: '肉视频当前可访问域名。'
      },
      {
        name: 'proxyBaseUrl',
        title: '播放修复服务',
        type: 'input',
        defaultValue: ROU_DEFAULT_PROXY_BASE,
        value: ROU_DEFAULT_PROXY_BASE,
        required: true,
        description: '把源站伪装的 .png HLS 分片转换为播放器可识别的 .m3u8/.ts 路径。'
      }
    ]
  };
}

async function getHome(ctx) {
  let latest = [];
  try {
    latest = parseVideoCards(await fetchText(ctx, routeURL(ctx, ROU_SECTIONS[0], 1, 'createdAt')), ctx).slice(0, 12);
  } catch (_) {}
  const browseItems = await loadCategoryCards(ctx, latest);
  return {
    pageType: 'home',
    id: 'rou666-home',
    title: '肉视频',
    heroAspectRatio: '16:10',
    hero: latest.slice(0, 5),
    sections: [
      {
        id: 'browse',
        title: '分类浏览',
        style: 'discover.annualPosterStack',
        lazy: false,
        items: browseItems
      },
      {
        id: 'videos',
        title: '最新视频',
        style: 'discover.spotlight',
        lazy: false,
        moreAction: categoryAction(ROU_SECTIONS[0]),
        items: latest
      }
    ].concat(ROU_SECTIONS.slice(1).map(sectionShell))
  };
}

async function getHomeSection(ctx) {
  const id = stringValue(contextValue(ctx, 'sectionId') || contextValue(ctx, 'id') || contextValue(ctx, 'pageId'));
  const section = findSection(id) || ROU_SECTIONS[0];
  try {
    const html = await fetchText(ctx, routeURL(ctx, section, 1, defaultSort(section)));
    const items = parseRouteItems(html, section, ctx).slice(0, 18);
    return {
      id: section.id,
      title: section.title,
      style: section.style,
      lazy: false,
      moreAction: categoryAction(section),
      items: items
    };
  } catch (error) {
    return emptySection(section, error);
  }
}

async function getCategory(ctx) {
  const id = normalizePageId(contextValue(ctx, 'pageId') || contextValue(ctx, 'id') || 'videos');
  const section = findSection(id) || sectionFromPageId(id);
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  const sortValue = stringValue(contextValue(ctx, 'sort') || contextValue(ctx, 'sortBy') || contextValue(ctx, 'sort_by') || defaultSort(section));
  try {
    const html = await fetchText(ctx, routeURL(ctx, section, page, sortValue));
    const items = parseRouteItems(html, section, ctx);
    const totalPages = parseTotalPages(html);
    return {
      pageType: 'category',
      id: section.id,
      title: stringValue(contextValue(ctx, 'title')) || section.title,
      style: 'media.posterGrid',
      itemAspectRatio: section.kind === 'series' ? '2:3' : '16:10',
      page: page,
      hasMore: totalPages ? page < totalPages : items.length >= 20,
      nextPage: totalPages && page < totalPages ? page + 1 : undefined,
      totalPages: totalPages || undefined,
      selectedSortValue: sortValue,
      sort: section.kind === 'series' ? ROU_SERIES_SORTS : ROU_VIDEO_SORTS,
      items: items
    };
  } catch (error) {
    return {
      pageType: 'category', id: section.id, title: section.title, style: 'media.posterGrid',
      itemAspectRatio: section.kind === 'series' ? '2:3' : '16:10', page: page, hasMore: false,
      selectedSortValue: sortValue, sort: section.kind === 'series' ? ROU_SERIES_SORTS : ROU_VIDEO_SORTS,
      items: [], error: errorMessage(error)
    };
  }
}

async function getDetail(ctx) {
  const decoded = decodeItem(contextValue(ctx, 'itemId') || contextValue(ctx, 'id'));
  if (!decoded.id) throw new Error('肉视频详情参数无效');
  if (decoded.kind === 'series') return getSeriesDetail(ctx, decoded.id);
  return getVideoDetail(ctx, decoded.id);
}

async function getVideoDetail(ctx, videoId) {
  const url = baseURL(ctx) + '/v/' + encodeURIComponent(videoId);
  const html = await fetchText(ctx, url);
  const title = cleanText(firstNonEmpty(metaContent(html, 'property', 'og:title'), firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i), pageTitle(html))).replace(/\s*[-–—]\s*肉視頻.*$/i, '');
  const poster = absoluteURL(ctx, firstNonEmpty(metaContent(html, 'property', 'og:image'), imageNearVideo(html, videoId)));
  const description = cleanText(firstNonEmpty(metaContent(html, 'name', 'description'), metaContent(html, 'property', 'og:description')));
  const duration = numberField(html, 'duration');
  const views = numberField(html, 'viewCount');
  const episode = numberField(html, 'episode');
  const seriesId = nullableStringField(html, 'seriesId');
  const seriesName = nullableStringField(html, 'seriesName');
  const resolutions = sourceResolutions(html);
  const tags = parseTagLinks(html);
  const recommendations = parseVideoCards(html, ctx).filter(function (item) { return decodeItem(item.id).id !== videoId; }).slice(0, 12);
  const resources = playbackGroups(videoId, title, resolutions);
  return {
    pageType: 'detail',
    id: encodeItem('video', videoId),
    title: title || videoId,
    originalTitle: stringField(html, 'vid') || undefined,
    type: 'movie',
    poster: poster,
    backdrop: poster,
    detailImageAspectRatio: '16:10',
    imageHeaders: imageHeaders(ctx, url), posterHeaders: imageHeaders(ctx, url), backdropHeaders: imageHeaders(ctx, url),
    overview: description,
    runtimeMinutes: duration ? Math.max(1, Math.round(duration / 60)) : undefined,
    viewCountText: views ? formatCount(views) + ' 次观看' : undefined,
    genres: tags,
    remarks: resolutions.length ? Math.max.apply(Math, resolutions) + 'P' : undefined,
    episodeNumber: episode || undefined,
    seriesTitle: seriesName || undefined,
    resourceGroups: resources.groups,
    resourceSummary: { versionCount: 1, episodeCount: 0, defaultVersionId: 'fixed' },
    recommendations: [{ id: 'related', title: '相关推荐', style: 'discover.posterCompact', items: recommendations }],
    providerIds: { source: WidgetMetadata.id, videoId: videoId, seriesId: seriesId || undefined }
  };
}

async function getSeriesDetail(ctx, seriesId) {
  const url = baseURL(ctx) + '/s/' + encodeURIComponent(seriesId);
  const html = await fetchText(ctx, url);
  const title = cleanText(firstNonEmpty(metaContent(html, 'property', 'og:title'), firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i), pageTitle(html))).replace(/\s*[-–—]\s*肉視頻.*$/i, '');
  const poster = absoluteURL(ctx, firstNonEmpty(metaContent(html, 'property', 'og:image'), imageNearSeries(html, seriesId)));
  const description = cleanText(firstNonEmpty(metaContent(html, 'name', 'description'), metaContent(html, 'property', 'og:description'), stringField(html, 'description')));
  const episodes = parseSeriesEpisodes(html, ctx, seriesId);
  const moreSeries = parseSeriesCards(html, ctx).filter(function (item) { return decodeItem(item.id).id !== seriesId; }).slice(0, 12);
  const tags = parseTagLinks(html);
  return {
    pageType: 'detail',
    id: encodeItem('series', seriesId),
    title: title || seriesId,
    type: 'series',
    poster: poster,
    backdrop: poster,
    detailImageAspectRatio: '2:3',
    imageHeaders: imageHeaders(ctx, url), posterHeaders: imageHeaders(ctx, url), backdropHeaders: imageHeaders(ctx, url),
    overview: description,
    genres: tags,
    seasons: [{ id: 'season-1', title: '全集', seasonNumber: 1, episodes: episodes }],
    resourceGroups: [],
    resourceSummary: { versionCount: 0, episodeCount: episodes.length },
    recommendations: [{ id: 'related-series', title: '更多剧集', style: 'discover.posterCompact', items: moreSeries }],
    providerIds: { source: WidgetMetadata.id, seriesId: seriesId }
  };
}

async function getResourceVersions(ctx) {
  const videoId = playbackVideoId(ctx);
  if (!videoId) return { groups: [] };
  return playbackGroups(videoId, stringValue(contextValue(ctx, 'title')), []);
}

async function resolvePlayback(ctx) {
  const videoId = playbackVideoId(ctx);
  if (!videoId) throw new Error('肉视频播放参数缺少影片 ID');
  return playbackDescription(proxyBaseURL(ctx) + '/hls/' + encodeURIComponent(videoId) + '/index.m3u8', {});
}

async function getPlayback(ctx) {
  const input = contextObject(ctx);
  const playback = await resolvePlayback(input);
  return {
    id: stringValue(input.versionId || input.episodeId || input.itemId || input.id) || playback.url,
    title: stringValue(input.title || input.name) || '肉视频 HLS',
    url: playback.url,
    videoUrl: playback.url,
    playUrl: playback.url,
    type: 'hls',
    protocol: 'hls',
    container: 'm3u8',
    mimeType: 'application/vnd.apple.mpegurl',
    contentType: 'application/vnd.apple.mpegurl',
    headers: playback.headers,
    header: playback.headers,
    Header: playback.headers,
    customHeaders: playback.headers,
    startPositionSeconds: 0,
    isLive: false,
    streamKind: 'vod'
  };
}

async function play(flagOrInput, id) {
  const input = flagOrInput && typeof flagOrInput === 'object' ? flagOrInput : { id: id || flagOrInput };
  const playback = await getPlayback(input);
  return {
    parse: 0,
    jx: 0,
    url: playback.url,
    playUrl: playback.url,
    videoUrl: playback.url,
    type: playback.type,
    protocol: playback.protocol,
    container: playback.container,
    mimeType: playback.mimeType,
    contentType: playback.mimeType,
    headers: playback.headers,
    header: playback.headers,
    Header: playback.headers,
    customHeaders: playback.headers,
    isLive: false
  };
}

function playbackDescription(url, headers) {
  return {
    url: url,
    container: 'm3u8',
    protocol: 'hls',
    mimeType: 'application/vnd.apple.mpegurl',
    contentType: 'application/vnd.apple.mpegurl',
    headers: headers || {},
    startPositionSeconds: 0,
    isLive: false,
    streamKind: 'vod'
  };
}

async function search(ctx) {
  const query = stringValue(contextValue(ctx, 'query') || contextValue(ctx, 'keyword') || contextValue(ctx, 'text') || contextValue(ctx, 'q')).trim();
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  if (!query) return { pageType: 'search', query: '', page: 1, hasMore: false, items: [] };
  const url = buildURL(baseURL(ctx) + '/search', { q: query, page: page });
  const html = await fetchText(ctx, url);
  const videos = parseVideoCards(html, ctx);
  const series = parseSeriesCards(html, ctx);
  const items = uniqueItems(videos.concat(series));
  const totalPages = parseTotalPages(html);
  return { pageType: 'search', query: query, page: page, hasMore: totalPages ? page < totalPages : items.length >= 20, totalPages: totalPages || undefined, items: items };
}

function playbackGroups(videoId, title, resolutions) {
  const highest = resolutions.length ? Math.max.apply(Math, resolutions) : 0;
  const subtitle = highest ? highest + 'P · 站点自动选择最高可用画质' : '站点自动选择最高可用画质';
  return {
    itemId: encodeItem('video', videoId),
    groups: [{
      id: 'rou666-line', title: '肉视频线路',
      versions: [{
        id: 'fixed', name: '兼容播放线路', subtitle: subtitle + ' · 已修复伪装分片格式', container: 'm3u8', default: true,
        protocol: 'hls', mimeType: 'application/vnd.apple.mpegurl',
        action: { type: 'play', itemId: encodeItem('video', videoId), episodeId: videoId, versionId: 'fixed', title: title || videoId }
      }]
    }]
  };
}

function parseRouteItems(html, section, ctx) {
  return section.kind === 'series' ? parseSeriesCards(html, ctx) : parseVideoCards(html, ctx);
}

function parseVideoCards(html, ctx) {
  return uniqueItems(anchorBlocks(html, '/v/').map(function (block) {
    const id = firstMatch(block, /href=["']\/v\/([A-Za-z0-9_-]+)/i);
    if (!id) return null;
    const title = cleanText(firstNonEmpty(firstMatch(block, /<h[23][^>]*>([\s\S]*?)<\/h[23]>/i), attrValue(block, 'img', 'alt')));
    const poster = absoluteURL(ctx, firstNonEmpty(imageWithAlt(block), attrValue(block, 'img', 'src')));
    if (!title || !poster) return null;
    const quality = cleanText(firstMatch(block, />(\d{3,4})\s*(?:<!--.*?-->)?\s*P</i));
    const duration = cleanText(firstMatch(block, />(\d+(?:小時|分|秒)[^<]{0,18})<\/span>/i));
    return {
      id: encodeItem('video', id), title: title, type: 'movie', poster: poster, backdrop: poster,
      aspectRatio: '16:10', imageHeaders: imageHeaders(ctx, baseURL(ctx) + '/v/' + id),
      posterHeaders: imageHeaders(ctx, baseURL(ctx) + '/v/' + id), badges: quality ? [quality + 'P'] : [],
      remarks: duration || (quality ? quality + 'P' : undefined), action: { type: 'detail', itemId: encodeItem('video', id) }
    };
  }).filter(Boolean));
}

function parseSeriesCards(html, ctx) {
  return uniqueItems(anchorBlocks(html, '/s/').map(function (block) {
    const id = firstMatch(block, /href=["']\/s\/([A-Za-z0-9_-]+)/i);
    if (!id) return null;
    const title = cleanText(firstNonEmpty(firstMatch(block, /<h[23][^>]*>([\s\S]*?)<\/h[23]>/i), attrValue(block, 'img', 'alt')));
    const poster = absoluteURL(ctx, firstNonEmpty(imageWithAlt(block), attrValue(block, 'img', 'src')));
    if (!title || !poster) return null;
    const count = cleanText(firstMatch(block, />(全\s*\d+\s*集)<\/span>/i));
    return {
      id: encodeItem('series', id), title: title, type: 'series', poster: poster, backdrop: poster,
      aspectRatio: '2:3', imageHeaders: imageHeaders(ctx, baseURL(ctx) + '/s/' + id),
      posterHeaders: imageHeaders(ctx, baseURL(ctx) + '/s/' + id), remarks: count || 'AI短剧', badges: count ? [count] : [],
      action: { type: 'detail', itemId: encodeItem('series', id) }
    };
  }).filter(Boolean));
}

function parseSeriesEpisodes(html, ctx, seriesId) {
  const seen = {};
  const out = [];
  const start = stringValue(html).search(/episodes:\$R\[\d+\]=\[/);
  const end = start >= 0 ? stringValue(html).indexOf(',more:', start) : -1;
  const hydration = start >= 0 ? stringValue(html).slice(start, end > start ? end : start + 50000) : '';
  const dataRe = /\{id:"([A-Za-z0-9_-]+)",name:"((?:\\.|[^"\\])*)",episode:(\d+),duration:([\d.]+)[\s\S]{0,900}?coverImageUrl:"((?:\\.|[^"\\])*)"/g;
  let dataMatch;
  while ((dataMatch = dataRe.exec(hydration))) {
    const id = dataMatch[1];
    if (seen[id]) continue;
    seen[id] = true;
    const number = positiveInt(dataMatch[3], out.length + 1);
    const title = decodeJSString(dataMatch[2]) || '第 ' + number + ' 集';
    const still = decodeJSString(dataMatch[5]);
    out.push({
      id: id, title: title, seasonNumber: 1, episodeNumber: number, number: number,
      runtimeMinutes: Math.max(1, Math.round(Number(dataMatch[4]) / 60)), still: still || undefined,
      imageHeaders: still ? imageHeaders(ctx, baseURL(ctx) + '/v/' + id) : undefined,
      action: { type: 'play', itemId: encodeItem('series', seriesId), episodeId: id, versionId: 'device', title: title }
    });
  }
  const re = /<a\b[^>]*href=["']\/v\/([A-Za-z0-9_-]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(html))) {
    const id = match[1];
    const block = match[0];
    const explicit = firstMatch(block, /第\s*(\d+)\s*集/i);
    if (!explicit || seen[id]) continue;
    seen[id] = true;
    const number = positiveInt(explicit, out.length + 1);
    const title = cleanText(firstNonEmpty(firstMatch(block, /<h[234][^>]*>([\s\S]*?)<\/h[234]>/i), attrValue(block, 'img', 'alt'), '第 ' + number + ' 集'));
    const still = absoluteURL(ctx, firstNonEmpty(imageWithAlt(block), attrValue(block, 'img', 'src')));
    out.push({
      id: id, title: title, seasonNumber: 1, episodeNumber: number, number: number, still: still || undefined,
      imageHeaders: still ? imageHeaders(ctx, baseURL(ctx) + '/v/' + id) : undefined,
      action: { type: 'play', itemId: encodeItem('series', seriesId), episodeId: id, versionId: 'device', title: title }
    });
  }
  return out.sort(function (a, b) { return a.episodeNumber - b.episodeNumber; });
}

function anchorBlocks(html, prefix) {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp("<a\\b[^>]*href=[\"']" + escaped + "[^\"']+[\"'][^>]*>[\\s\\S]*?<\\/a>", 'gi');
  return stringValue(html).match(re) || [];
}

function categoryCard(section) {
  return categoryCardWithPreviews(section, []);
}

async function loadCategoryCards(ctx, firstItems) {
  const previews = {};
  previews[ROU_SECTIONS[0].id] = (firstItems || []).slice(0, 3);
  await mapWithConcurrency(ROU_SECTIONS.slice(1), 3, async function (section) {
    try {
      const html = await fetchText(ctx, routeURL(ctx, section, 1, defaultSort(section)));
      previews[section.id] = parseRouteItems(html, section, ctx).slice(0, 3);
    } catch (_) {
      previews[section.id] = [];
    }
  });
  return ROU_SECTIONS.map(function (section) {
    return categoryCardWithPreviews(section, previews[section.id] || []);
  }).filter(function (item) {
    return item.previewItems.length > 0 && (item.poster || item.backdrop);
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
  for (let i = 0; i < count; i++) workers.push(worker());
  await Promise.all(workers);
}

function categoryCardWithPreviews(section, previewItems) {
  const previews = (previewItems || []).slice(0, 3);
  const first = previews[0] || {};
  const artwork = first.backdrop || first.poster || '';
  const headers = first.backdropHeaders || first.posterHeaders || first.imageHeaders;
  return {
    id: section.id,
    title: section.title,
    subtitle: previews.map(function (item) { return item.title; }).join(' · '),
    type: 'collection',
    poster: artwork,
    backdrop: artwork,
    imageHeaders: headers,
    posterHeaders: headers,
    backdropHeaders: headers,
    aspectRatio: section.kind === 'series' ? '2:3' : '16:10',
    imageFit: 'fill',
    previewItems: previews,
    metadataText: previews.length + ' 项预览',
    action: categoryAction(section)
  };
}

function categoryAction(section) {
  return { type: 'category', pageId: section.id, title: section.title, itemAspectRatio: section.kind === 'series' ? '2:3' : '16:10' };
}

function sectionShell(section) {
  return { id: section.id, title: section.title, style: section.style, lazy: true, moreAction: categoryAction(section), items: [] };
}

function emptySection(section, error) {
  return { id: section.id, title: section.title, style: section.style, lazy: false, moreAction: categoryAction(section), items: [], error: errorMessage(error), subtitle: '加载失败，可稍后重试' };
}

function findSection(id) {
  for (let i = 0; i < ROU_SECTIONS.length; i++) if (ROU_SECTIONS[i].id === id) return ROU_SECTIONS[i];
  return null;
}

function sectionFromPageId(id) {
  if (id.indexOf('tag:') === 0) return { id: id, title: id.slice(4), kind: 'tag', tag: id.slice(4), style: 'discover.posterCompact' };
  if (id === 'series') return ROU_SECTIONS[1];
  return ROU_SECTIONS[0];
}

function defaultSort(section) { return section.kind === 'series' ? 'updated' : 'createdAt'; }

function routeURL(ctx, section, page, sort) {
  let path = '/v';
  if (section.kind === 'series') path = '/series';
  else if (section.kind === 'tag') path = '/t/' + encodeURIComponent(section.tag);
  const query = Object.assign({}, section.query || {});
  if (page > 1) query.page = page;
  if (sort && sort !== defaultSort(section)) query.order = sort;
  if (section.kind === 'series' && sort) query.sort = sort;
  return buildURL(baseURL(ctx) + path, query);
}

function sourceResolutions(html) {
  const out = [];
  const re = /resolution:(\d{3,4})/g;
  let match;
  while ((match = re.exec(stringValue(html)))) out.push(Number(match[1]));
  return uniqueNumbers(out);
}

function parseTotalPages(html) {
  return positiveInt(firstNonEmpty(firstMatch(html, /totalPage:(\d+)/), firstMatch(html, /共\s*(\d+)\s*頁/i)), 0);
}

function parseTagLinks(html) {
  const out = [];
  const re = /<a\b[^>]*href=["']\/t\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(stringValue(html))) && out.length < 24) {
    const value = cleanText(match[1]);
    if (value && value.length < 30) out.push(value);
  }
  return uniqueStrings(out);
}

function playbackVideoId(ctx) {
  const episode = stringValue(contextValue(ctx, 'episodeId'));
  if (/^[A-Za-z0-9_-]{12,}$/.test(episode)) return episode;
  const decoded = decodeItem(contextValue(ctx, 'itemId') || contextValue(ctx, 'id'));
  return decoded.kind === 'video' ? decoded.id : '';
}

function encodeItem(kind, id) { return 'rou666://' + kind + '/' + stringValue(id); }

function decodeItem(value) {
  const text = stringValue(value);
  const match = text.match(/^rou666:\/\/(video|series)\/([A-Za-z0-9_-]+)$/);
  if (match) return { kind: match[1], id: match[2] };
  if (/^[A-Za-z0-9_-]{12,}$/.test(text)) return { kind: 'video', id: text };
  return { kind: '', id: '' };
}

function normalizePageId(value) { return stringValue(value) || 'videos'; }

function contextObject(ctx) {
  if (typeof ctx === 'string') { try { return JSON.parse(ctx); } catch (_) { return {}; } }
  return ctx && typeof ctx === 'object' ? ctx : {};
}

function contextValue(ctx, key) {
  const root = contextObject(ctx);
  const boxes = [root, root.params, root.config, root.settings, root.parameters, root.pagination, root.pageInfo];
  for (let i = 0; i < boxes.length; i++) if (boxes[i] && boxes[i][key] !== undefined && boxes[i][key] !== null) return boxes[i][key];
  return undefined;
}

function baseURL(ctx) { return stringValue(contextValue(ctx, 'baseUrl') || ROU_DEFAULT_BASE).replace(/\/+$/, ''); }
function proxyBaseURL(ctx) { return stringValue(contextValue(ctx, 'proxyBaseUrl') || ROU_DEFAULT_PROXY_BASE).replace(/\/+$/, ''); }

async function fetchText(ctx, url) {
  const headers = { 'User-Agent': ROU_UA, Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8', Referer: baseURL(ctx) + '/' };
  let response;
  if (typeof Widget !== 'undefined' && Widget && Widget.http) {
    if (typeof Widget.http.get === 'function') response = await Widget.http.get(url, { headers: headers });
    else if (typeof Widget.http.request === 'function') response = await Widget.http.request({ url: url, method: 'GET', headers: headers });
  } else if (typeof $http !== 'undefined' && $http) {
    if (typeof $http.get === 'function') response = await $http.get(url, { headers: headers });
    else if (typeof $http.request === 'function') response = await $http.request({ url: url, method: 'GET', headers: headers });
  } else if (typeof fetch === 'function') {
    response = await fetch(url, { method: 'GET', headers: headers, redirect: 'follow' });
  } else throw new Error('当前环境没有可用的 HTTP 客户端');
  const text = await unwrapText(response);
  if (!text) throw new Error('站点返回空内容');
  if (/Just a moment|cf-mitigated|Cloudflare Ray ID/i.test(text)) throw new Error('站点触发 Cloudflare 验证');
  return text;
}

async function fetchPlaybackManifest(url, headers) {
  const first = await rawHTTPGet(url, headers);
  const location = responseHeader(first, 'location');
  if (location && responseStatus(first) >= 300 && responseStatus(first) < 400) {
    const secondURL = absoluteFrom(url, location);
    const second = await rawHTTPGet(secondURL, { 'User-Agent': ROU_UA });
    return {
      text: await unwrapText(second),
      finalURL: responseFinalURL(second, secondURL),
      status: responseStatus(second)
    };
  }
  const text = await unwrapText(first);
  const finalURL = responseFinalURL(first, url);
  const status = responseStatus(first);
  if (status && (status < 200 || status >= 400)) throw new Error('播放解析失败：HTTP ' + status);
  return { text: text, finalURL: finalURL, status: status };
}

async function rawHTTPGet(url, headers) {
  if (typeof Widget !== 'undefined' && Widget && Widget.http) {
    if (typeof Widget.http.get === 'function') return await Widget.http.get(url, { headers: headers || {}, timeout: 12 });
    if (typeof Widget.http.request === 'function') return await Widget.http.request({ url: url, method: 'GET', headers: headers || {}, timeout: 12 });
  }
  if (typeof $http !== 'undefined' && $http) {
    if (typeof $http.get === 'function') return await $http.get(url, { headers: headers || {}, timeout: 12 });
    if (typeof $http.request === 'function') return await $http.request({ url: url, method: 'GET', headers: headers || {}, timeout: 12 });
  }
  if (typeof fetch === 'function') {
    const fetched = await fetch(url, { method: 'GET', headers: headers || {}, redirect: 'follow' });
    return { data: await fetched.text(), status: fetched.status, url: fetched.url, headers: fetched.headers };
  }
  throw new Error('当前环境没有可用的 HTTP 客户端');
}

function responseFinalURL(response, fallback) {
  return stringValue(response && (
    response.finalURL || response.urlEffective || response.responseURL || response.url ||
    (response.response && (response.response.finalURL || response.response.url))
  )) || fallback;
}

function responseStatus(response) {
  if (typeof response === 'string') return 200;
  const value = Number(response && (response.status || response.statusCode || (response.response && response.response.status)) || 0);
  return Number.isFinite(value) ? value : 0;
}

function responseHeader(response, name) {
  const headers = response && (response.headers || response.respHeaders || (response.response && response.response.headers));
  if (!headers) return '';
  if (typeof headers.get === 'function') return stringValue(headers.get(name));
  const target = stringValue(name).toLowerCase();
  const keys = Object.keys(headers);
  for (let i = 0; i < keys.length; i++) if (keys[i].toLowerCase() === target) return stringValue(headers[keys[i]]);
  return '';
}

function absoluteFrom(base, value) {
  if (/^https?:\/\//i.test(value)) return value;
  const match = stringValue(base).match(/^(https?:\/\/[^/]+)/i);
  if (stringValue(value).charAt(0) === '/') return (match ? match[1] : '') + value;
  return stringValue(base).replace(/[^/]*$/, '') + value;
}

async function unwrapText(response) {
  if (typeof response === 'string') return response;
  if (!response) return '';
  if (typeof response.text === 'function') return await response.text();
  if (typeof response.data === 'string') return response.data;
  if (response.data && typeof response.data.html === 'string') return response.data.html;
  if (response.data && typeof response.data.text === 'string') return response.data.text;
  if (typeof response.body === 'string') return response.body;
  if (typeof response.text === 'string') return response.text;
  return '';
}

function buildURL(url, params) {
  const pairs = [];
  Object.keys(params || {}).forEach(function (key) { if (params[key] !== undefined && params[key] !== null && params[key] !== '') pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key])); });
  return pairs.length ? url + (url.indexOf('?') >= 0 ? '&' : '?') + pairs.join('&') : url;
}

function absoluteURL(ctx, value) {
  const text = decodeEntities(stringValue(value));
  if (!text) return '';
  if (/^https?:\/\//i.test(text)) return text;
  if (text.indexOf('//') === 0) return 'https:' + text;
  return baseURL(ctx) + (text.charAt(0) === '/' ? text : '/' + text);
}

function imageHeaders(ctx, referer) { return { 'User-Agent': ROU_UA, Referer: referer || baseURL(ctx) + '/' }; }

function imageWithAlt(block) {
  const re = /<img\b([^>]*)>/gi;
  let match;
  while ((match = re.exec(block))) {
    const attrs = match[1];
    if (cleanText(attrFromText(attrs, 'alt'))) return firstNonEmpty(attrFromText(attrs, 'src'), attrFromText(attrs, 'data-src'));
  }
  return '';
}

function imageNearVideo(html, id) {
  const index = stringValue(html).indexOf('/v/' + id);
  return index >= 0 ? firstNonEmpty(attrValue(html.slice(Math.max(0, index - 1200), index + 3000), 'img', 'src')) : '';
}

function imageNearSeries(html, id) {
  const index = stringValue(html).indexOf('/s/' + id);
  return index >= 0 ? firstNonEmpty(attrValue(html.slice(Math.max(0, index - 1200), index + 3000), 'img', 'src')) : '';
}

function attrValue(html, tag, name) {
  const match = stringValue(html).match(new RegExp('<' + tag + '\\b([^>]*)>', 'i'));
  return match ? attrFromText(match[1], name) : '';
}

function attrFromText(text, name) {
  const match = stringValue(text).match(new RegExp("(?:^|\\s)" + name + "=[\"']([^\"']*)[\"']", 'i'));
  return match ? match[1] : '';
}

function metaContent(html, key, value) {
  const tags = stringValue(html).match(/<meta\b[^>]*>/gi) || [];
  for (let i = 0; i < tags.length; i++) if (attrFromText(tags[i], key) === value) return attrFromText(tags[i], 'content');
  return '';
}

function pageTitle(html) { return cleanText(firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i)); }
function numberField(html, key) { return Number(firstMatch(html, new RegExp('(?:^|[,\\{])' + key + ':(-?\\d+(?:\\.\\d+)?)'))) || 0; }
function stringField(html, key) { return decodeJSString(firstMatch(html, new RegExp('(?:^|[,\\{])' + key + ':"((?:\\\\.|[^"\\\\])*)"'))); }
function nullableStringField(html, key) { return stringField(html, key); }
function firstMatch(text, re) { const match = stringValue(text).match(re); return match ? stringValue(match[1]) : ''; }
function firstNonEmpty() { for (let i = 0; i < arguments.length; i++) if (stringValue(arguments[i])) return stringValue(arguments[i]); return ''; }
function positiveInt(value, fallback) { const number = parseInt(value, 10); return Number.isFinite(number) && number > 0 ? number : fallback; }
function stringValue(value) { return value === undefined || value === null ? '' : String(value); }
function cleanText(value) { return decodeEntities(stringValue(value).replace(/<[^>]+>/g, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/\s+/g, ' ').trim()); }
function decodeEntities(value) { return stringValue(value).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x2F;/gi, '/'); }
function decodeJSString(value) { try { return JSON.parse('"' + stringValue(value).replace(/"/g, '\\"') + '"'); } catch (_) { return stringValue(value); } }
function formatCount(value) { const number = Number(value) || 0; return number >= 10000 ? (Math.round(number / 1000) / 10) + '万' : String(number); }
function errorMessage(error) { return error && error.message ? error.message : stringValue(error) || '未知错误'; }
function uniqueStrings(values) { const seen = {}; return values.filter(function (value) { if (!value || seen[value]) return false; seen[value] = true; return true; }); }
function uniqueNumbers(values) { const seen = {}; return values.filter(function (value) { if (!value || seen[value]) return false; seen[value] = true; return true; }).sort(function (a, b) { return b - a; }); }
function uniqueItems(items) { const seen = {}; return items.filter(function (item) { if (!item || !item.id || seen[item.id]) return false; seen[item.id] = true; return true; }); }

const exported = {
  WidgetMetadata, getManifest, getHome, getHomeSection, getCategory, getDetail,
  getResourceVersions, resolvePlayback, search,
  home: getHome, homeSection: getHomeSection, getSection: getHomeSection,
  category: getCategory, catalog: getCategory, list: getCategory, detail: getDetail,
  getVersions: getResourceVersions, versions: getResourceVersions,
  resolvePlay: resolvePlayback, play: play, getPlayback: getPlayback, getPlayinfo: getPlayback,
  quickSearch: search, getSearch: search, onSearch: search
};
Object.keys(exported).forEach(function (key) { if (typeof globalThis !== 'undefined') globalThis[key] = exported[key]; });
if (typeof module !== 'undefined' && module.exports) module.exports = exported;
