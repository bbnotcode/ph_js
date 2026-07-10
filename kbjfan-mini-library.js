// @name KBJFan Mini Library

const KBJFAN_DEFAULT_BASE = 'https://www.kbjfan.com';
const KBJFAN_LOGO = 'https://www.kbjfan.com/favicon.ico';
const KBJFAN_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';

const WidgetMetadata = {
  id: 'kbjfan-mini-library',
  name: 'KBJFan',
  title: 'KBJFan',
  version: '1.0.0',
  author: 'EL',
  logo: KBJFAN_LOGO,
  icon: KBJFAN_LOGO,
  site: KBJFAN_DEFAULT_BASE,
  description: 'KBJFan baiPlay 自定义媒体库，支持舞蹈、Nude 分类、搜索、详情和播放解析。'
};

const KBJFAN_SECTIONS = [
  { id: 'dance', title: 'Korean BJ Dance', path: '/koreanbjdance/', style: 'discover.spotlight' },
  { id: 'nude', title: 'Korean BJ Nude', path: '/koreanbjnude/', style: 'discover.posterCompact' }
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
      playback: true,
      resourceVersions: true,
      aggregation: true,
      playbackHistory: true,
      resourceMatching: false
    },
    aggregation: { search: true, playbackHistory: true, resourceMatching: false },
    parameters: [
      {
        name: 'baseURL',
        title: '站点地址',
        type: 'input',
        defaultValue: KBJFAN_DEFAULT_BASE,
        value: KBJFAN_DEFAULT_BASE,
        required: true,
        description: 'KBJFan 当前可访问域名，可在域名变化时修改。'
      }
    ]
  };
}

async function getHome(ctx) {
  let hero = [];
  try {
    hero = (await loadSectionItems(ctx, KBJFAN_SECTIONS[0], 1)).slice(0, 8);
  } catch (_) {
    hero = [];
  }
  return {
    pageType: 'home',
    id: 'kbjfan-home',
    title: 'KBJFan',
    heroAspectRatio: '16:9',
    hero: hero,
    sections: KBJFAN_SECTIONS.map(function (section, index) {
      return {
        id: section.id,
        title: section.title,
        style: section.style,
        lazy: index !== 0,
        loadAction: { type: 'custom', id: section.id, sectionId: section.id, title: section.title },
        moreAction: categoryAction(section),
        items: index === 0 ? hero : []
      };
    })
  };
}

async function getHomeSection(ctx) {
  const section = findSection(ctx && (ctx.sectionId || ctx.id)) || KBJFAN_SECTIONS[0];
  try {
    return {
      id: section.id,
      title: section.title,
      style: section.style,
      lazy: false,
      moreAction: categoryAction(section),
      items: (await loadSectionItems(ctx, section, 1)).slice(0, 18)
    };
  } catch (error) {
    return {
      id: section.id,
      title: section.title,
      style: section.style,
      lazy: false,
      items: [],
      error: stringValue(error && (error.message || error))
    };
  }
}

async function getCategory(ctx) {
  const section = findSection(ctx && (ctx.pageId || ctx.id || ctx.category || ctx.genreId)) || KBJFAN_SECTIONS[0];
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  const html = await fetchText(ctx, categoryURL(ctx, section, page));
  return {
    pageType: 'category',
    id: section.id,
    title: section.title,
    style: 'media.posterGrid',
    itemAspectRatio: '16:9',
    page: page,
    hasMore: hasNextPage(html, page),
    items: parseListHtml(ctx, html)
  };
}

async function getDetail(ctx) {
  const detailURL = detailURLFromContext(ctx);
  if (!detailURL) throw new Error('KBJFan 详情参数无效');
  const html = await fetchText(ctx, detailURL);
  const detail = parseDetailHtml(ctx, html, detailURL);
  const related = parseListHtml(ctx, html).filter(function (item) { return item.id !== detailURL; }).slice(0, 18);
  return {
    pageType: 'detail',
    id: detailURL,
    title: detail.title,
    type: 'movie',
    poster: detail.poster,
    backdrop: detail.poster,
    imageHeaders: imageHeaders(ctx, detailURL),
    posterHeaders: imageHeaders(ctx, detailURL),
    backdropHeaders: imageHeaders(ctx, detailURL),
    detailImageAspectRatio: '16:9',
    overview: detail.overview,
    resourceGroups: resourceGroupsFor(ctx, detailURL, detail.title, detail.videoURL),
    recommendations: related.length ? [{ id: 'related', title: '相关推荐', style: 'discover.standard', items: related }] : []
  };
}

async function getResourceVersions(ctx) {
  const detailURL = detailURLFromContext(ctx);
  if (!detailURL) return [];
  let videoURL = directMediaURLFromContext(ctx);
  let title = stringValue(ctx && ctx.title) || '默认线路';
  if (!videoURL) {
    const html = await fetchText(ctx, detailURL);
    const detail = parseDetailHtml(ctx, html, detailURL);
    videoURL = detail.videoURL;
    title = detail.title || title;
  }
  return resourceGroupsFor(ctx, detailURL, title, videoURL);
}

async function resolvePlayback(ctx) {
  let detailURL = detailURLFromContext(ctx);
  let videoURL = directMediaURLFromContext(ctx);
  if (!videoURL && detailURL) {
    const html = await fetchText(ctx, detailURL);
    videoURL = parseDetailHtml(ctx, html, detailURL).videoURL;
  }
  if (!videoURL) throw new Error('没有解析到 KBJFan 播放地址');
  videoURL = absoluteURL(ctx, decodePlayerValue(videoURL));
  return {
    url: videoURL,
    container: mediaContainer(videoURL),
    headers: playbackHeaders(ctx, detailURL),
    startPositionSeconds: 0,
    isLive: false,
    streamKind: /\.m3u8(?:$|[?#])/i.test(videoURL) ? 'hls' : 'file'
  };
}

async function search(ctx) {
  const query = cleanText(contextValue(ctx, 'query') || contextValue(ctx, 'keyword') || contextValue(ctx, 'text'));
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  if (!query) return { pageType: 'search', title: '搜索结果', keyword: '', page: page, hasMore: false, items: [] };
  let url = baseURL(ctx) + '/?s=' + encodeURIComponent(query);
  if (page > 1) url += '&paged=' + page;
  const html = await fetchText(ctx, url);
  return {
    pageType: 'search',
    title: query,
    keyword: query,
    style: 'media.posterGrid',
    itemAspectRatio: '16:9',
    page: page,
    hasMore: hasNextPage(html, page),
    items: parseListHtml(ctx, html)
  };
}

function onSearch(ctx) { return search(ctx); }
function getSearch(ctx) { return search(ctx); }
function play(ctx) { return resolvePlayback(ctx); }
function getPlayback(ctx) { return resolvePlayback(ctx); }

function parseListHtml(ctx, html) {
  const items = [];
  const seen = {};
  const marker = /<posts\b[^>]*class=["'][^"']*posts-item[^"']*["'][^>]*>/gi;
  const starts = [];
  let match;
  while ((match = marker.exec(html || '')) !== null) starts.push(match.index);
  for (let i = 0; i < starts.length; i += 1) {
    const block = String(html).slice(starts[i], starts[i + 1] || String(html).length);
    const heading = firstMatch(block, /<h2\b[^>]*class=["'][^"']*item-heading[^"']*["'][^>]*>[\s\S]*?<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    const href = absoluteURL(ctx, heading[0]);
    if (!href || seen[href]) continue;
    seen[href] = true;
    const title = cleanText(heading[1]) || cleanText(firstMatch(block, /<img\b[^>]*alt=["']([^"']+)["']/i)[0]) || 'Untitled';
    const poster = absoluteURL(ctx, firstNonEmpty(
      firstMatch(block, /<img\b[^>]*data-src=["']([^"']+)["']/i)[0],
      firstMatch(block, /<img\b[^>]*src=["']([^"']+)["']/i)[0]
    ));
    const date = firstMatch(block, /<span\b[^>]*>\s*(\d{4}-\d{2}-\d{2})\s*<\/span>/i)[0];
    const views = firstMatch(block, /meta-view[^>]*>\s*([0-9.,]+[KMBkmb]?)/i)[0];
    items.push({
      id: href,
      title: title,
      subtitle: [date, views ? views + ' 次观看' : ''].filter(Boolean).join(' · '),
      type: 'movie',
      poster: poster,
      backdrop: poster,
      imageHeaders: imageHeaders(ctx, href),
      aspectRatio: '16:9',
      remarks: views || undefined,
      action: { type: 'detail', itemId: href, id: href, url: href, title: title }
    });
  }
  return items;
}

function parseDetailHtml(ctx, html, detailURL) {
  const title = cleanText(firstNonEmpty(
    metaContent(html, 'property', 'og:title'),
    firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i)[0]
  )).replace(/\s*[-–|]\s*KBJFan\s*$/i, '');
  const poster = absoluteURL(ctx, decodePlayerValue(firstNonEmpty(
    attributeValue(html, 'video-pic'),
    metaContent(html, 'property', 'og:image'),
    firstMatch(html, /dplayer-initial-img[^>]*(?:data-src|src)=["']([^"']+)["']/i)[0]
  )));
  const videoURL = absoluteURL(ctx, decodePlayerValue(firstNonEmpty(
    attributeValue(html, 'video-url'),
    attributeValue(html, 'data-video-url'),
    firstMatch(html, /(?:url|src)\s*:\s*["'](https?:\\?\/\\?\/[^"']+(?:m3u8|mp4)[^"']*)["']/i)[0],
    metaContent(html, 'property', 'og:video')
  )));
  const overview = cleanText(firstNonEmpty(metaContent(html, 'name', 'description'), metaContent(html, 'property', 'og:description')));
  return { title: title || 'Untitled', poster: poster, videoURL: videoURL, overview: overview, detailURL: detailURL };
}

function resourceGroupsFor(ctx, detailURL, title, videoURL) {
  return [{
    id: 'online',
    title: '在线播放',
    versions: [{
      id: detailURL,
      name: '默认线路',
      title: title || '默认线路',
      subtitle: videoURL ? 'DPlayer 直链' : '进入详情页解析',
      url: videoURL || undefined,
      container: mediaContainer(videoURL),
      default: true,
      headers: playbackHeaders(ctx, detailURL),
      action: { type: 'play', itemId: detailURL, versionId: detailURL, url: videoURL || undefined, title: title }
    }]
  }];
}

async function loadSectionItems(ctx, section, page) {
  return parseListHtml(ctx, await fetchText(ctx, categoryURL(ctx, section, page)));
}

async function fetchText(ctx, url) {
  const response = await Widget.http.get(url, { headers: requestHeaders(ctx, url) });
  const data = response && (response.data || response.body || response.text);
  if (!data) throw new Error('请求失败: ' + url);
  return String(data);
}

function requestHeaders(ctx, referer) {
  return { Referer: referer || baseURL(ctx) + '/', 'User-Agent': KBJFAN_UA, Accept: 'text/html,application/xhtml+xml' };
}
function imageHeaders(ctx, referer) { return { Referer: referer || baseURL(ctx) + '/', 'User-Agent': KBJFAN_UA }; }
function playbackHeaders(ctx, referer) { return { Referer: referer || baseURL(ctx) + '/', Origin: baseURL(ctx), 'User-Agent': KBJFAN_UA }; }

function baseURL(ctx) {
  const value = stringValue(contextValue(ctx, 'baseURL') || KBJFAN_DEFAULT_BASE).replace(/\/+$/, '');
  return value || KBJFAN_DEFAULT_BASE;
}
function categoryURL(ctx, section, page) {
  let url = baseURL(ctx) + section.path;
  if (page > 1) url += 'page/' + page + '/';
  return url;
}
function categoryAction(section) {
  return { type: 'category', id: section.id, pageId: section.id, title: section.title, itemAspectRatio: '16:9' };
}
function findSection(value) {
  const id = stringValue(value).replace(/^category-/, '');
  return KBJFAN_SECTIONS.find(function (section) { return section.id === id || section.path.indexOf(id) >= 0; }) || null;
}

function detailURLFromContext(ctx) {
  const candidates = ctx ? [ctx.itemId, ctx.episodeId, ctx.versionId, ctx.id, ctx.link, ctx.path, ctx.detailURL, ctx.pageURL] : [];
  for (let i = 0; i < candidates.length; i += 1) {
    const value = stringValue(candidates[i]);
    if (/^https?:\/\//i.test(value) && !isMediaURL(value)) return value;
    if (value && value.charAt(0) === '/' && !isMediaURL(value)) return baseURL(ctx) + value;
  }
  return '';
}
function directMediaURLFromContext(ctx) {
  const candidates = ctx ? [ctx.playUrl, ctx.videoUrl, ctx.mediaUrl, ctx.streamUrl, ctx.url, ctx.src] : [];
  for (let i = 0; i < candidates.length; i += 1) {
    const value = decodePlayerValue(candidates[i]);
    if (isMediaURL(value)) return value;
  }
  return '';
}
function isMediaURL(value) { return /(?:\.m3u8|\.mp4|\.m4v|\.mov|\.webm)(?:$|[?#])/i.test(stringValue(value)); }
function mediaContainer(url) { return /\.m3u8(?:$|[?#])/i.test(url || '') ? 'm3u8' : 'mp4'; }
function decodePlayerValue(value) {
  return decodeEntities(stringValue(value))
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .replace(/^['"]|['"]$/g, '');
}
function absoluteURL(ctx, value) {
  const url = stringValue(value);
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.indexOf('//') === 0) return 'https:' + url;
  return baseURL(ctx) + (url.charAt(0) === '/' ? url : '/' + url);
}
function hasNextPage(html, page) {
  const next = page + 1;
  return new RegExp('(?:/page/' + next + '/|[?&]paged?=' + next + ')(?:["\'&#<\\s/]|$)', 'i').test(html || '') || /rel=["']next["']/i.test(html || '');
}
function attributeValue(html, name) {
  const escaped = escapeRegExp(name);
  return firstNonEmpty(
    firstMatch(html, new RegExp('\\b' + escaped + '=["\\\']([^"\\\']+)["\\\']', 'i'))[0],
    firstMatch(html, new RegExp('\\b' + escaped + '=([^\\s>]+)', 'i'))[0]
  );
}
function metaContent(html, attr, value) {
  const a = escapeRegExp(attr), v = escapeRegExp(value);
  return decodeEntities(firstNonEmpty(
    firstMatch(html, new RegExp('<meta[^>]*' + a + '=["\\\']' + v + '["\\\'][^>]*content=["\\\']([^"\\\']*)', 'i'))[0],
    firstMatch(html, new RegExp('<meta[^>]*content=["\\\']([^"\\\']*)["\\\'][^>]*' + a + '=["\\\']' + v + '["\\\']', 'i'))[0]
  ));
}
function firstMatch(text, pattern) { const match = pattern.exec(text || ''); return match ? match.slice(1) : []; }
function firstNonEmpty() { for (let i = 0; i < arguments.length; i += 1) if (stringValue(arguments[i])) return stringValue(arguments[i]); return ''; }
function cleanText(value) { return decodeEntities(stringValue(value).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function decodeEntities(value) {
  return stringValue(value).replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#(\d+);/g, function (_, code) { return String.fromCharCode(Number(code)); });
}
function contextValue(ctx, key) {
  if (!ctx) return '';
  if (ctx[key] !== undefined && ctx[key] !== null) return ctx[key];
  for (const bag of ['params', 'config', 'settings', 'parameters']) if (ctx[bag] && ctx[bag][key] !== undefined) return ctx[bag][key];
  return '';
}
function positiveInt(value, fallback) { const number = parseInt(value, 10); return Number.isFinite(number) && number > 0 ? number : fallback; }
function stringValue(value) { return value === undefined || value === null ? '' : String(value).trim(); }
function escapeRegExp(value) { return stringValue(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

const KBJFAN_API = { getManifest, getHome, getHomeSection, getCategory, getDetail, getResourceVersions, resolvePlayback, search, onSearch, getSearch, play, getPlayback };
if (typeof globalThis !== 'undefined') Object.keys(KBJFAN_API).forEach(function (key) { globalThis[key] = KBJFAN_API[key]; });
if (typeof module !== 'undefined' && module.exports) module.exports = KBJFAN_API;
