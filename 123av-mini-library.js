// @name 123AV Mini Library

const AV123_DEFAULT_BASE = 'https://123av.com';
const AV123_SURRIT_BASE = 'https://surrit.store';
const AV123_LOGO = 'https://123av.com/assets/123av/favicon.png';
const AV123_PAYLOAD_PREFIX = '123av://detail?';
const AV123_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15';

const WidgetMetadata = {
  id: '123av-mini-library',
  name: '123AV',
  title: '123AV',
  version: '1.0.0',
  requiredVersion: '0.0.1',
  author: 'EL / Codex',
  site: AV123_DEFAULT_BASE,
  logo: AV123_LOGO,
  icon: AV123_LOGO,
  description: '123AV 自定义媒体库，支持首页、分类、搜索、详情和 surrit.store 播放解析。'
};

const AV123_SECTIONS = [
  { id: 'new', title: '最新视频', endpoint: 'new', style: 'discover.spotlight' },
  { id: 'hot', title: '热门视频', endpoint: 'hot', style: 'discover.ranked', defaultSort: 'hot' },
  { id: 'recent', title: '最近更新', endpoint: 'recent', style: 'discover.posterCompact' },
  { id: 'censored', title: '有码', endpoint: 'censored', style: 'discover.posterCompact', defaultSort: 'release_date' },
  { id: 'uncensored', title: '无码', endpoint: 'uncensored', style: 'discover.posterCompact', defaultSort: 'release_date' },
  { id: 'uncensored-leaked', title: '无码流出', endpoint: 'uncensored-leaked', style: 'discover.posterCompact', defaultSort: 'release_date' }
];

const AV123_SORTS = [
  { id: 'hot', title: '热门', value: 'hot' },
  { id: 'release_date', title: '发行日期', value: 'release_date' },
  { id: 'recent', title: '最近添加', value: 'recent' },
  { id: 'today', title: '今日浏览', value: 'today' },
  { id: 'week', title: '本周浏览', value: 'week' },
  { id: 'month', title: '本月浏览', value: 'month' },
  { id: 'views', title: '最多观看', value: 'views' },
  { id: 'follows', title: '最多收藏', value: 'follows' },
  { id: 'longest', title: '最长时长', value: 'longest' }
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
    aggregation: {
      search: true,
      playbackHistory: true,
      resourceMatching: false
    },
    parameters: [
      {
        name: 'baseUrl',
        title: '站点地址',
        type: 'input',
        defaultValue: AV123_DEFAULT_BASE,
        value: AV123_DEFAULT_BASE,
        required: true,
        description: '123AV 当前可访问域名。'
      },
      {
        name: 'surritBaseUrl',
        title: '播放 API 地址',
        type: 'input',
        defaultValue: AV123_SURRIT_BASE,
        value: AV123_SURRIT_BASE,
        required: true,
        description: '默认使用 surrit.store 的 /stream?id= 接口。'
      }
    ]
  };
}

async function getHome(ctx) {
  const browseSection = {
    id: '123av-browse',
    title: '分类浏览',
    style: 'discover.annualCategories',
    lazy: false,
    items: AV123_SECTIONS.map(function (section) {
      return categoryCard(section);
    })
  };
  const sections = AV123_SECTIONS.map(function (section) {
    return sectionShell(ctx, section);
  });
  return {
    pageType: 'home',
    id: '123av-home',
    title: '123AV',
    heroAspectRatio: '16:9',
    hero: [],
    sections: [browseSection].concat(sections)
  };
}

async function getHomeSection(ctx) {
  const sectionId = stringValue(ctx && (ctx.sectionId || ctx.id || ctx.pageId));
  const section = findSection(sectionId) || AV123_SECTIONS[0];
  try {
    const html = await fetchText(ctx, categoryURL(ctx, section.endpoint, 1, section.defaultSort));
    return {
      id: section.id,
      title: section.title,
      style: section.style,
      lazy: false,
      moreAction: categoryAction(section),
      items: parseCards(ctx, html).slice(0, 18)
    };
  } catch (error) {
    return emptySection(section.id, section.title, section.style, error);
  }
}

async function getCategory(ctx) {
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  const pageId = normalizePageId(ctx && (ctx.pageId || ctx.id), 'new');
  const section = findSection(pageId);
  const sortValue = stringValue(contextValue(ctx, 'sort') || contextValue(ctx, 'sort_by') || contextValue(ctx, 'sortBy') || (section && section.defaultSort));
  try {
    const url = routeURL(ctx, pageId, page, sortValue);
    const html = await fetchText(ctx, url);
    const items = parseCards(ctx, html);
    return {
      pageType: 'category',
      id: pageId,
      title: (ctx && ctx.title) || (section && section.title) || pageTitle(html) || '123AV',
      style: 'media.posterGrid',
      itemAspectRatio: '16:9',
      page: page,
      hasMore: hasNextPage(html, page, items),
      selectedSortValue: sortValue || '',
      sort: supportsSort(pageId) ? AV123_SORTS : undefined,
      items: items
    };
  } catch (error) {
    return emptyCategory(pageId, (ctx && ctx.title) || (section && section.title) || '123AV', page, sortValue, error);
  }
}

async function getDetail(ctx) {
  const detailUrl = detailURLFromContext(ctx);
  if (!detailUrl) throw new Error('123AV 详情参数无效');

  const html = await fetchText(ctx, detailUrl);
  const parsedPlayer = parsePlayerData(ctx, html);
  const title = cleanText(
    firstNonEmpty(
      metaContent(html, 'property', 'og:title'),
      firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i),
      pageTitle(html),
      titleFromURL(detailUrl)
    )
  ).replace(/\s*(?:—|-)\s*123AV\s*$/i, '');
  const poster = absoluteURL(ctx, firstNonEmpty(parsedPlayer.poster, metaContent(html, 'property', 'og:image'), pickImage(html)));
  const description = cleanText(firstNonEmpty(metaContent(html, 'name', 'description'), metaContent(html, 'property', 'og:description')));
  const code = cleanText(labeledValue(html, 'Code')) || extractCode(title) || titleFromURL(detailUrl);
  const releaseDate = cleanText(labeledValue(html, 'Release date'));
  const durationText = cleanText(labeledValue(html, 'Duration'));
  const typeText = cleanText(labeledValue(html, 'Type'));
  const maker = cleanText(labeledLinkedValue(html, 'Maker'));
  const genres = extractChips(html, '/en/genres/').map(function (item) { return item.title; });
  const actors = extractChips(html, '/en/actresses/');
  const recommendations = parseCards(ctx, html).filter(function (item) {
    return detailURLFromItem(item) !== detailUrl;
  }).slice(0, 12);
  const resourceGroups = playbackGroups(detailUrl, title || code, parsedPlayer.surritCode, parsedPlayer.playUrl, ctx);

  return {
    pageType: 'detail',
    id: encodeDetailPayload({ url: detailUrl, title: title, surritCode: parsedPlayer.surritCode, playUrl: parsedPlayer.playUrl }),
    title: title || code,
    originalTitle: code && title && code !== title ? code : undefined,
    type: 'movie',
    poster: poster,
    backdrop: poster,
    detailImageAspectRatio: '16:9',
    imageHeaders: imageHeaders(ctx, detailUrl),
    posterHeaders: imageHeaders(ctx, detailUrl),
    backdropHeaders: imageHeaders(ctx, detailUrl),
    overview: description,
    year: releaseDate ? Number(String(releaseDate).slice(0, 4)) : undefined,
    runtimeMinutes: runtimeMinutes(durationText),
    genres: unique(genres.concat(maker ? [maker] : []).concat(typeText ? [typeText] : [])),
    cast: actors.map(function (actor) {
      return {
        id: actor.id,
        name: actor.title,
        role: 'actor',
        action: {
          type: 'category',
          pageId: 'actor:' + actor.id,
          title: actor.title,
          itemAspectRatio: '16:9'
        }
      };
    }),
    releaseDate: releaseDate || undefined,
    remarks: durationText || code,
    resourceGroups: resourceGroups,
    resourceSummary: {
      versionCount: resourceGroups[0] ? resourceGroups[0].versions.length : 0,
      episodeCount: 0,
      defaultVersionId: resourceGroups[0] && resourceGroups[0].versions[0] ? resourceGroups[0].versions[0].id : ''
    },
    recommendations: [
      {
        id: 'related',
        title: '相关推荐',
        style: 'discover.posterCompact',
        items: recommendations
      }
    ],
    providerIds: {
      code: code,
      source: WidgetMetadata.id
    }
  };
}

async function getResourceVersions(ctx) {
  const direct = stringValue(ctx && (ctx.playUrl || ctx.url || ctx.videoUrl));
  if (isPlayableURL(direct)) {
    return playbackGroups('', ctx && ctx.title, ctx && ctx.surritCode, direct, ctx);
  }
  const detailUrl = detailURLFromContext(ctx);
  if (!detailUrl) return playbackGroups('', ctx && ctx.title, ctx && ctx.surritCode, '', ctx);
  try {
    const html = await fetchText(ctx, detailUrl);
    const parsedPlayer = parsePlayerData(ctx, html);
    return playbackGroups(detailUrl, ctx && ctx.title, parsedPlayer.surritCode, parsedPlayer.playUrl, ctx);
  } catch (error) {
    return playbackGroups(detailUrl, ctx && ctx.title, ctx && ctx.surritCode, '', ctx);
  }
}

async function resolvePlayback(ctx) {
  const direct = firstNonEmpty(ctx && ctx.playUrl, ctx && ctx.url, ctx && ctx.videoUrl);
  if (isPlayableURL(direct) && !isDetailURL(direct)) {
    return playbackResult(ctx, direct);
  }

  let surritCode = stringValue(ctx && ctx.surritCode);
  let detailUrl = detailURLFromContext(ctx);
  if (!surritCode && detailUrl) {
    const html = await fetchText(ctx, detailUrl);
    const parsedPlayer = parsePlayerData(ctx, html);
    surritCode = parsedPlayer.surritCode;
    if (parsedPlayer.playUrl) return playbackResult(ctx, parsedPlayer.playUrl);
  }
  const playUrl = await getPlayableURL(ctx, surritCode);
  if (!playUrl) throw new Error('未能解析到 123AV 播放地址。源站播放器或 surrit.store 接口可能已变化。');
  return playbackResult(ctx, playUrl);
}

async function search(ctx) {
  const query = stringValue(ctx && (ctx.query || ctx.keyword || ctx.text));
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  if (!query) {
    return { pageType: 'search', title: '搜索结果', keyword: '', page: page, hasMore: false, items: [] };
  }

  let items = [];
  try {
    const searchUrl = baseURL(ctx) + '/en/search?q=' + encodeURIComponent(query) + '&page=' + page;
    const html = await fetchText(ctx, searchUrl);
    items = parseCards(ctx, html);
  } catch (error) {
    items = [];
  }

  if (!items.length && page === 1) {
    const fallback = await searchByDirectCode(ctx, query);
    if (fallback) items = [fallback];
  }

  return {
    pageType: 'search',
    title: '搜索结果',
    keyword: query,
    page: page,
    hasMore: items.length >= 18,
    items: items
  };
}

async function onSearch(ctx) {
  return search(ctx || {});
}

async function getSearch(ctx) {
  return search(ctx || {});
}

async function getPlayback(ctx) {
  const playback = await resolvePlayback(ctx || {});
  return {
    id: (ctx && (ctx.versionId || ctx.id || ctx.itemId)) || playback.url,
    title: (ctx && (ctx.title || ctx.name)) || '123AV HLS',
    url: playback.url,
    videoUrl: playback.url,
    playUrl: playback.url,
    container: playback.container,
    protocol: playback.container === 'm3u8' ? 'hls' : playback.container,
    mimeType: playback.mimeType,
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
  const input = typeof flagOrInput === 'object' && flagOrInput ? flagOrInput : { id: id || flagOrInput };
  const playback = await getPlayback(input);
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
    container: playback.container
  };
}

function sectionShell(ctx, section) {
  return {
    id: section.id,
    title: section.title,
    style: section.style,
    lazy: true,
    promotesToHero: section.id === 'new',
    moreAction: categoryAction(section),
    loadAction: { type: 'custom', id: section.id, title: section.title },
    items: []
  };
}

function categoryCard(section) {
  return {
    id: 'category-' + section.id,
    title: section.title,
    subtitle: section.defaultSort ? '可切换排序' : '分页浏览',
    type: 'category',
    aspectRatio: '16:9',
    imageFit: 'fit',
    previewItems: [],
    action: categoryAction(section)
  };
}

function categoryAction(section) {
  return {
    type: 'category',
    pageId: section.id,
    title: section.title,
    itemAspectRatio: '16:9',
    sort: supportsSort(section.id) ? AV123_SORTS : undefined,
    selectedSortValue: section.defaultSort || ''
  };
}

function parseCards(ctx, html) {
  const source = String(html || '');
  const blocks = [];
  const cardPattern = /<div\b[^>]*class=["'][^"']*\bcard\b[^"']*["'][^>]*>[\s\S]*?(?=<div\b[^>]*class=["'][^"']*\bcard\b|<nav\b|<\/main>|<\/section>|$)/gi;
  let cardMatch;
  while ((cardMatch = cardPattern.exec(source))) blocks.push(cardMatch[0]);
  if (!blocks.length) {
    const linkPattern = /<a\b[^>]*href=["']\/en\/v\/[^"']+["'][\s\S]*?<\/a>/gi;
    while ((cardMatch = linkPattern.exec(source))) blocks.push(cardMatch[0]);
  }

  const items = [];
  blocks.forEach(function (block, index) {
    const href = firstMatch(block, /href=["'](\/en\/v\/[^"']+)["']/i);
    if (!href) return;
    const detailUrl = absoluteURL(ctx, href);
    const slug = href.split('/').pop();
    const image = absoluteURL(ctx, firstNonEmpty(
      firstMatch(block, /<img\b[^>]*class=["'][^"']*card__img[^"']*["'][^>]*\bsrc=["']([^"']+)["']/i),
      firstMatch(block, /<img\b[^>]*\bdata-src=["']([^"']+)["']/i),
      firstMatch(block, /<img\b[^>]*\bsrc=["']([^"']+)["']/i)
    ));
    const title = cleanText(firstNonEmpty(
      firstMatch(block, /card__title[^>]*>[\s\S]*?<a\b[^>]*>([\s\S]*?)<\/a>/i),
      firstMatch(block, /card__link[^>]*>([\s\S]*?)<\/a>/i),
      firstMatch(block, /<img\b[^>]*\balt=["']([^"']+)["']/i),
      slug
    ));
    const duration = cleanText(firstMatch(block, /card__dur[^>]*>([\s\S]*?)<\/[^>]+>/i));
    const views = cleanText(firstMatch(block, /card__views[^>]*>[\s\S]*?<\/svg>\s*([^<\s][^<]*)/i));
    const code = extractCode(slug) || extractCode(title) || slug;
    const payload = encodeDetailPayload({ url: detailUrl, slug: slug, title: title });
    items.push({
      id: payload,
      title: title || slug,
      type: 'movie',
      poster: image,
      backdrop: image,
      aspectRatio: '16:9',
      imageHeaders: imageHeaders(ctx, detailUrl),
      posterHeaders: imageHeaders(ctx, detailUrl),
      backdropHeaders: imageHeaders(ctx, detailUrl),
      remarks: duration || code,
      metadataText: views ? views + ' 观看' : code,
      rank: index + 1,
      providerIds: { code: code, source: WidgetMetadata.id },
      action: { type: 'detail', itemId: payload }
    });
  });
  return uniqueBy(items, function (item) { return item.id; });
}

function parsePlayerData(ctx, html) {
  const source = String(html || '');
  const raw = firstMatch(source, /x-data=["']player\(JSON\.parse\('([^']+)'\)/i);
  const result = { surritCode: '', poster: '', playUrl: '' };
  if (!raw) return result;
  try {
    const jsonText = decodeEscapes(raw);
    const parsed = JSON.parse(jsonText);
    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    const embedUrl = first && first.url ? String(first.url) : '';
    const poster = firstNonEmpty(
      first && first.poster,
      firstMatch(embedUrl, /[?&]poster=([^&]+)/i)
    );
    result.poster = poster ? absoluteURL(ctx, decodeURIComponentSafe(poster)) : '';
    result.surritCode = firstMatch(embedUrl, /\/e\/([a-z0-9_]+)/i);
    result.playUrl = isPlayableURL(embedUrl) ? embedUrl : '';
  } catch (error) {
    return result;
  }
  return result;
}

async function getPlayableURL(ctx, surritCode) {
  if (!surritCode) return '';
  const apiUrl = surritBaseURL(ctx) + '/stream?id=' + encodeURIComponent(surritCode);
  const response = await httpGet(apiUrl, {
    headers: {
      'User-Agent': AV123_UA,
      Referer: surritBaseURL(ctx) + '/e/' + surritCode
    }
  });
  const data = responseData(response);
  const parsed = typeof data === 'string' ? JSON.parse(data) : data;
  return parsed && parsed.status === 'ok' && parsed.media && parsed.media.stream ? parsed.media.stream : '';
}

function playbackGroups(detailUrl, title, surritCode, playUrl, ctx) {
  const payload = {
    url: detailUrl || '',
    title: title || '123AV HLS',
    surritCode: surritCode || '',
    playUrl: playUrl || ''
  };
  return [
    {
      id: 'online',
      title: '在线播放',
      versions: [
        {
          id: encodeDetailPayload(payload),
          name: '123AV HLS',
          displayName: '123AV HLS',
          subtitle: surritCode ? 'surrit.store' : '详情页解析',
          container: 'm3u8',
          protocol: 'hls',
          url: playUrl || '',
          headers: playbackHeaders(ctx),
          action: {
            type: 'play',
            itemId: encodeDetailPayload(payload),
            versionId: encodeDetailPayload(payload),
            title: title || '123AV HLS',
            url: playUrl || undefined,
            surritCode: surritCode || undefined
          }
        }
      ]
    }
  ];
}

function playbackResult(ctx, url) {
  return {
    url: url,
    container: /\.m3u8(?:[?#]|$)/i.test(url) ? 'm3u8' : 'mp4',
    mimeType: /\.m3u8(?:[?#]|$)/i.test(url) ? 'application/vnd.apple.mpegurl' : 'video/mp4',
    headers: playbackHeaders(ctx),
    startPositionSeconds: 0,
    isLive: false,
    streamKind: 'vod'
  };
}

async function searchByDirectCode(ctx, query) {
  const code = query.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (!code) return null;
  const detailUrl = baseURL(ctx) + '/en/v/' + encodeURIComponent(code.toLowerCase());
  try {
    const html = await fetchText(ctx, detailUrl);
    if (html.indexOf('x-data="player') < 0 && html.indexOf("x-data='player") < 0) return null;
    const title = cleanText(metaContent(html, 'property', 'og:title')).replace(/\s*(?:—|-)\s*123AV\s*$/i, '') || code;
    const poster = absoluteURL(ctx, firstNonEmpty(metaContent(html, 'property', 'og:image'), pickImage(html)));
    const payload = encodeDetailPayload({ url: detailUrl, slug: code.toLowerCase(), title: title });
    return {
      id: payload,
      title: title,
      type: 'movie',
      poster: poster,
      backdrop: poster,
      aspectRatio: '16:9',
      imageHeaders: imageHeaders(ctx, detailUrl),
      remarks: code,
      action: { type: 'detail', itemId: payload }
    };
  } catch (error) {
    return null;
  }
}

function routeURL(ctx, pageId, page, sortValue) {
  if (pageId.indexOf('actor:') === 0) return categoryURL(ctx, 'actresses/' + pageId.slice(6), page, sortValue);
  if (pageId.indexOf('genre:') === 0) return categoryURL(ctx, 'genres/' + pageId.slice(6), page, sortValue);
  const section = findSection(pageId);
  return categoryURL(ctx, section ? section.endpoint : pageId, page, sortValue);
}

function categoryURL(ctx, endpoint, page, sortValue) {
  let url = baseURL(ctx) + '/en/' + String(endpoint || 'new').replace(/^\/+/, '');
  if (page && page > 1) url += '?page=' + page;
  if (sortValue) url += (url.indexOf('?') >= 0 ? '&' : '?') + 'sort=' + encodeURIComponent(sortValue);
  return url;
}

function detailURLFromContext(ctx) {
  if (!ctx) return '';
  const decoded = decodeDetailPayload(ctx.itemId || ctx.id || ctx.versionId || ctx.url || ctx.link);
  const direct = firstNonEmpty(decoded.url, ctx.detailUrl, ctx.detailURL, ctx.pageUrl, ctx.link);
  if (direct && isDetailURL(direct)) return direct;
  const slug = firstNonEmpty(decoded.slug, ctx.slug, ctx.itemId, ctx.id);
  if (slug && !String(slug).match(/^123av:\/\//i) && !String(slug).match(/^https?:\/\//i)) {
    return baseURL(ctx) + '/en/v/' + encodeURIComponent(String(slug).replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase());
  }
  return '';
}

function detailURLFromItem(item) {
  const decoded = decodeDetailPayload(item && item.id);
  return decoded.url || '';
}

function encodeDetailPayload(payload) {
  return AV123_PAYLOAD_PREFIX + encodeURIComponent(JSON.stringify(payload || {}));
}

function decodeDetailPayload(value) {
  const text = stringValue(value);
  if (!text || text.indexOf(AV123_PAYLOAD_PREFIX) !== 0) return {};
  try {
    return JSON.parse(decodeURIComponent(text.slice(AV123_PAYLOAD_PREFIX.length)));
  } catch (error) {
    return {};
  }
}

function findSection(id) {
  const normalized = normalizePageId(id, '');
  for (let index = 0; index < AV123_SECTIONS.length; index += 1) {
    if (AV123_SECTIONS[index].id === normalized || AV123_SECTIONS[index].endpoint === normalized) return AV123_SECTIONS[index];
  }
  return null;
}

function normalizePageId(value, fallback) {
  return stringValue(value || fallback || '').replace(/^category-/, '').replace(/^\/?en\//, '').replace(/^\/+/, '');
}

function supportsSort(pageId) {
  return ['hot', 'censored', 'uncensored', 'uncensored-leaked'].indexOf(normalizePageId(pageId, '')) >= 0 ||
    normalizePageId(pageId, '').indexOf('actor:') === 0 ||
    normalizePageId(pageId, '').indexOf('genre:') === 0;
}

function extractChips(html, hrefPrefix) {
  const items = [];
  const pattern = new RegExp('<a\\b[^>]*class=["\'][^"\']*chip[^"\']*["\'][^>]*href=["\']' + escapeRegExp(hrefPrefix) + '([^"\']+)["\'][^>]*>([\\s\\S]*?)<\\/a>', 'gi');
  let match;
  while ((match = pattern.exec(String(html || '')))) {
    items.push({ id: decodeURIComponentSafe(match[1]), title: cleanText(match[2]) });
  }
  return uniqueBy(items, function (item) { return item.id; });
}

function labeledValue(html, label) {
  return firstMatch(html, new RegExp('<dt[^>]*>\\s*' + escapeRegExp(label) + '\\s*<\\/dt>\\s*<dd[^>]*>([\\s\\S]*?)<\\/dd>', 'i'));
}

function labeledLinkedValue(html, label) {
  return firstMatch(labeledValue(html, label), /<a\b[^>]*>([\s\S]*?)<\/a>/i) || labeledValue(html, label);
}

function hasNextPage(html, page, items) {
  const source = String(html || '');
  return new RegExp('[?&]page=' + (page + 1) + '\\b').test(source) ||
    source.indexOf('rel="next"') >= 0 ||
    (items && items.length >= 24);
}

function toWideItem(item) {
  const copy = Object.assign({}, item);
  copy.aspectRatio = '16:9';
  return copy;
}

function baseURL(ctx) {
  return (stringValue(contextValue(ctx, 'baseUrl') || contextValue(ctx, 'baseURL')) || AV123_DEFAULT_BASE).replace(/\/+$/, '');
}

function surritBaseURL(ctx) {
  return (stringValue(contextValue(ctx, 'surritBaseUrl') || contextValue(ctx, 'surritBaseURL')) || AV123_SURRIT_BASE).replace(/\/+$/, '');
}

function requestHeaders(ctx, referer) {
  return {
    'User-Agent': AV123_UA,
    Referer: referer || baseURL(ctx) + '/'
  };
}

function imageHeaders(ctx, referer) {
  return requestHeaders(ctx, referer || baseURL(ctx) + '/');
}

function playbackHeaders(ctx) {
  return {
    'User-Agent': AV123_UA,
    Referer: surritBaseURL(ctx) + '/'
  };
}

async function fetchText(ctx, url) {
  const response = await httpGet(url, {
    headers: requestHeaders(ctx, url),
    useBrowserCookie: false,
    attachBrowserCookie: false,
    useBrowserFallback: false,
    browserFallback: false,
    allowBrowserFallback: false
  });
  const text = responseText(response);
  if (!text) throw new Error('请求失败: ' + url);
  if (isVerificationPage(text, response && response.status)) {
    throw new Error('源站返回浏览器验证页，已阻止跳转。请稍后重试或更换可访问域名。');
  }
  return text;
}

async function httpGet(url, options) {
  if (typeof Widget !== 'undefined' && Widget.http && typeof Widget.http.get === 'function') {
    return Widget.http.get(url, options || {});
  }
  if (typeof $http !== 'undefined' && $http && typeof $http.get === 'function') {
    return $http.get(url, options || {});
  }
  if (typeof fetch === 'function') {
    const response = await fetch(url, { headers: (options && options.headers) || {} });
    return { status: response.status, headers: response.headers, data: await response.text() };
  }
  throw new Error('当前环境不支持 HTTP 请求');
}

function responseText(response) {
  const data = responseData(response);
  if (typeof data === 'string') return data;
  if (data === undefined || data === null) return '';
  return JSON.stringify(data);
}

function responseData(response) {
  if (!response) return '';
  if (response.data !== undefined) return response.data;
  if (response.body !== undefined) return response.body;
  if (response.text !== undefined) return response.text;
  return response;
}

function isVerificationPage(html, status) {
  const text = String(html || '').slice(0, 20000);
  return status === 403 ||
    /正在进行验证，完成后会自动返回/i.test(text) ||
    /Just a moment|Checking your browser|cf-browser-verification|cf-chl|cloudflare/i.test(text);
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

function absoluteURL(ctx, url) {
  const value = stringValue(url);
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.indexOf('//') === 0) return 'https:' + value;
  if (typeof $utils !== 'undefined' && $utils && typeof $utils.absoluteURL === 'function') {
    return $utils.absoluteURL(baseURL(ctx), value);
  }
  return baseURL(ctx) + '/' + value.replace(/^\/+/, '');
}

function metaContent(html, attr, name) {
  const quote = '["\\\']';
  const pattern = new RegExp('<meta\\b[^>]*' + attr + '=' + quote + escapeRegExp(name) + quote + '[^>]*content=' + quote + '([^"\\\']*)' + quote + '[^>]*>', 'i');
  return htmlDecode(firstMatch(html, pattern));
}

function pageTitle(html) {
  return cleanText(firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
}

function pickImage(html) {
  return firstMatch(html, /<img\b[^>]*\bsrc=["']([^"']+)["']/i);
}

function titleFromURL(url) {
  const value = String(url || '').split('?')[0].replace(/\/+$/, '').split('/').pop() || '';
  return decodeURIComponentSafe(value).replace(/[-_]+/g, ' ').trim();
}

function extractCode(value) {
  return stringValue(value).match(/([A-Z]{2,10}[-_ ]?\d{2,6})/i)?.[1].replace(/[_ ]/g, '-').toUpperCase() || '';
}

function runtimeMinutes(value) {
  const text = stringValue(value);
  const hm = text.match(/(\d+)\s*h(?:ours?)?\s*(\d+)?\s*m?/i);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2] || 0);
  const min = text.match(/(\d+)\s*(?:min|分钟|分)/i);
  if (min) return Number(min[1]);
  const clock = text.match(/(?:(\d+):)?(\d{1,2}):(\d{2})/);
  if (clock) return Number(clock[1] || 0) * 60 + Number(clock[2] || 0);
  return undefined;
}

function isPlayableURL(url) {
  return /^https?:\/\/.+\.(?:m3u8|mp4)(?:[?#].*)?$/i.test(stringValue(url));
}

function isDetailURL(url) {
  return /^https?:\/\/[^/]+\/en\/v\/[^/?#]+/i.test(stringValue(url));
}

function firstMatch(value, pattern) {
  const match = pattern.exec(String(value || ''));
  return match ? match[1] || '' : '';
}

function firstNonEmpty() {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = stringValue(arguments[index]);
    if (value) return value;
  }
  return '';
}

function stringValue(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function cleanText(value) {
  return htmlDecode(String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
}

function htmlDecode(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, function (_, hex) { return String.fromCharCode(parseInt(hex, 16)); })
    .replace(/&#(\d+);/g, function (_, num) { return String.fromCharCode(parseInt(num, 10)); });
}

function decodeEscapes(value) {
  return htmlDecode(String(value || ''))
    .replace(/\\u0022/g, '"')
    .replace(/\\u0026/g, '&')
    .replace(/\\u003d/g, '=')
    .replace(/\\u0027/g, "'")
    .replace(/\\\//g, '/')
    .replace(/\\\\\//g, '/');
}

function decodeURIComponentSafe(value) {
  try {
    return decodeURIComponent(String(value || ''));
  } catch (error) {
    return String(value || '');
  }
}

function positiveInt(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function unique(values) {
  const seen = {};
  return (values || []).filter(function (value) {
    const key = stringValue(value);
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function uniqueBy(items, keyFn) {
  const seen = {};
  return (items || []).filter(function (item) {
    const key = keyFn(item);
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function emptySection(id, title, style, error) {
  return {
    id: id || 'empty',
    title: title || '内容',
    subtitle: error && error.message ? error.message : '加载失败',
    style: style || 'discover.standard',
    lazy: false,
    items: []
  };
}

function emptyCategory(id, title, page, sortValue, error) {
  return {
    pageType: 'category',
    id: id || 'empty',
    title: title || '123AV',
    subtitle: error && error.message ? error.message : '加载失败',
    style: 'media.posterGrid',
    itemAspectRatio: '16:9',
    page: page || 1,
    hasMore: false,
    selectedSortValue: sortValue || '',
    sort: supportsSort(id) ? AV123_SORTS : undefined,
    items: []
  };
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const exported = {
  WidgetMetadata,
  getManifest,
  getHome,
  getHomeSection,
  getCategory,
  getDetail,
  getResourceVersions,
  resolvePlayback,
  getPlayback,
  play,
  search,
  onSearch,
  getSearch
};

if (typeof globalThis !== 'undefined') {
  Object.keys(exported).forEach(function (key) {
    globalThis[key] = exported[key];
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exported;
}
