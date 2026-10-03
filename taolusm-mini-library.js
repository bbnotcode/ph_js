// @name TaoluSM Mini Library

const TAOLUSM_DEFAULT_BASE = 'https://taolusm.com';
const TAOLUSM_LOGO = 'https://taolusm.com/favicon.ico';
const TAOLUSM_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15';

const WidgetMetadata = {
  id: 'taolusm-mini-library',
  name: '套路SM',
  title: '套路SM',
  version: '1.0.2',
  author: 'Alan huang',
  logo: TAOLUSM_LOGO,
  icon: TAOLUSM_LOGO,
  site: TAOLUSM_DEFAULT_BASE,
  description: '套路SM 自定义媒体库，支持首页、分类、搜索、详情和播放解析。'
};

const TAOLUSM_SECTIONS = [
  { id: 'latest', title: '最新视频', path: '/', style: 'discover.spotlight' },
  { id: 'zhibo', title: '直播回放', path: '/zhibo', style: 'discover.ranked' },
  { id: 'juqing', title: '剧情调教', path: '/juqing', style: 'discover.posterCompact' },
  { id: 'japanese-korean', title: '日韩视频', path: '/japanese-korean', style: 'discover.posterCompact' },
  { id: 'western', title: '欧美视频', path: '/western', style: 'discover.posterCompact' },
  { id: 'free', title: '免费试看', path: '/free', style: 'discover.posterCompact' }
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
      resourceMatching: false,
      resourceMatch: {
        enabled: false,
        parameters: ['title', 'alternativeTitles', 'mediaType']
      }
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
        defaultValue: TAOLUSM_DEFAULT_BASE,
        required: true,
        description: '套路SM 当前可访问域名。'
      }
    ]
  };
}

async function getHome(ctx) {
  ctx = normalizeRuntimeContext(ctx);
  let latestItems = [];
  try {
    const html = await fetchText(ctx, categoryURL(ctx, '/'));
    latestItems = parseListHtml(ctx, html).slice(0, 18);
  } catch (error) {
    latestItems = [];
  }

  return {
    pageType: 'home',
    id: 'taolusm-home',
    title: '套路SM',
    heroAspectRatio: '16:9',
    hero: latestItems.slice(0, 8).map(toWideItem),
    sections: [
      {
        id: 'taolusm-categories',
        title: '分类',
        style: 'discover.annualCategories',
        lazy: false,
        items: TAOLUSM_SECTIONS.map(function (section) {
          return categoryCard(ctx, section);
        })
      },
      {
        id: 'latest',
        title: '最新视频',
        style: 'discover.spotlight',
        lazy: false,
        moreAction: categoryAction(ctx, TAOLUSM_SECTIONS[0]),
        items: latestItems
      }
    ].concat(TAOLUSM_SECTIONS.slice(1).map(function (section) {
      return sectionShell(ctx, section);
    }))
  };
}

async function getHomeSection(ctx) {
  ctx = normalizeRuntimeContext(ctx);
  const sectionId = stringValue(ctx && (ctx.sectionId || ctx.id));
  const section = findSection(sectionId) || TAOLUSM_SECTIONS[0];
  try {
    const html = await fetchText(ctx, categoryURL(ctx, section.path));
    return {
      id: section.id,
      title: section.title,
      style: section.style,
      lazy: false,
      moreAction: categoryAction(ctx, section),
      items: parseListHtml(ctx, html).slice(0, 18)
    };
  } catch (error) {
    return emptySection(section.id, section.title, section.style, error);
  }
}

async function getCategory(ctx) {
  ctx = normalizeRuntimeContext(ctx);
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  const pageId = normalizePageId(ctx && (ctx.pageId || ctx.id || ctx.category || ctx.genreId));
  const section = findSection(pageId) || TAOLUSM_SECTIONS[0];
  const url = pagedURL(categoryURL(ctx, section.path), page);
  const html = await fetchText(ctx, url);
  const items = parseListHtml(ctx, html);

  return {
    pageType: 'category',
    id: section.id,
    title: section.title,
    style: 'media.posterGrid',
    itemAspectRatio: '16:9',
    items: items,
    page: page,
    hasMore: hasNextPage(html, page)
  };
}

async function getDetail(ctx) {
  ctx = normalizeRuntimeContext(ctx);
  const id = itemIdFromContext(ctx);
  if (!id) throw new Error('套路SM 详情参数无效');

  const detailURL = baseURL(ctx) + '/v/' + encodeURIComponent(id);
  const html = await fetchText(ctx, detailURL);
  const title = cleanTitle(firstNonEmpty(
    metaContent(html, 'property', 'og:title'),
    pageTitle(html),
    id
  ));
  const poster = absoluteURL(ctx, firstNonEmpty(
    metaContent(html, 'property', 'og:image'),
    metaContent(html, 'name', 'twitter:image'),
    pickImageForId(html, id),
    pickImage(html)
  ));
  const overview = cleanText(firstNonEmpty(
    metaContent(html, 'name', 'description'),
    metaContent(html, 'property', 'og:description')
  ));
  const recommendations = parseListHtml(ctx, html)
    .filter(function (item) { return item.id !== id; })
    .slice(0, 18);
  const headers = mediaHeaders(ctx);
  const source = parsePlaybackSource(html, id);

  return {
    id: id,
    title: title,
    type: 'movie',
    poster: poster,
    backdrop: poster,
    imageHeaders: headers,
    posterHeaders: headers,
    backdropHeaders: headers,
    detailImageAspectRatio: '16:9',
    overview: [source.preview ? '公开预览；完整影片需要站点登录及观看权限。' : '', overview].filter(Boolean).join('\n'),
    resourceGroups: resourceGroupsFor(ctx, id, title, source),
    recommendations: recommendations.length ? [
      {
        id: 'related',
        title: '相关推荐',
        style: 'discover.standard',
        items: recommendations
      }
    ] : []
  };
}

async function getResourceVersions(ctx) {
  ctx = normalizeRuntimeContext(ctx);
  const id = itemIdFromContext(ctx);
  if (!id) return [];
  const html = await fetchText(ctx, baseURL(ctx) + '/v/' + encodeURIComponent(id));
  const source = parsePlaybackSource(html, id);
  if (!source.url) throw new Error('套路SM 当前页面未提供可播放的影片，可能需要登录及观看权限');
  return resourceGroupsFor(ctx, id, stringValue(ctx.title) || '在线播放', source);
}

async function resolvePlayback(ctx) {
  ctx = normalizeRuntimeContext(ctx);
  const id = itemIdFromContext(ctx);
  if (!id) throw new Error('套路SM 播放参数无效');
  const html = await fetchText(ctx, baseURL(ctx) + '/v/' + encodeURIComponent(id));
  const source = parsePlaybackSource(html, id);
  if (!source.url) throw new Error('套路SM 当前页面未提供媒体地址；完整影片需站点登录及观看权限');
  if (source.preview && (/^download-/.test(stringValue(ctx.versionId)) || /\/download\//.test(stringValue(ctx.url)))) {
    throw new Error('旧下载线路需要站点登录及观看权限；当前公开页面仅提供预览，请重新打开详情并选择“公开预览”');
  }
  const hls = /\.m3u8(?:$|[?#])/i.test(source.url);
  if (hls) {
    const body = await fetchText(ctx, source.url);
    if (!/^\s*#EXTM3U/i.test(body)) throw new Error('套路SM 当前播放线路没有返回有效 HLS');
  }
  return { url: source.url, container: hls ? 'm3u8' : 'mp4', headers: mediaHeaders(ctx), startPositionSeconds: 0, isLive: false, streamKind: hls ? 'hls' : 'file' };
}

function parsePlaybackSource(html, id) {
  const scripts = String(html || '').match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const script of scripts) {
    const owner = firstMatch(script, /const\s+video_id\s*=\s*['"]([^'"]+)['"]/);
    if (owner !== String(id)) continue;
    const url = decodeEntities(firstMatch(script, /const\s+source\s*=\s*['"]([^'"]+)['"]/));
    if (!/^https?:\/\//i.test(url) || !/\.(?:mp4|m3u8)(?:$|[?#])/i.test(url)) continue;
    return { url: url, preview: /\/preview_mp4\//i.test(url) || /正在播放预览/.test(html) };
  }
  return { url: '', preview: false };
}

async function search(ctx) {
  ctx = normalizeRuntimeContext(ctx);
  const query = cleanText(contextValue(ctx, 'query') || contextValue(ctx, 'keyword') || contextValue(ctx, 'text'));
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  if (!query) {
    return {
      pageType: 'search',
      title: '搜索结果',
      items: [],
      page: page,
      hasMore: false
    };
  }

  const url = pagedURL(baseURL(ctx) + '/search/' + encodeURIComponent(query), page);
  const html = await fetchText(ctx, url);
  const items = parseListHtml(ctx, html);
  return {
    pageType: 'search',
    title: query,
    style: 'media.posterGrid',
    itemAspectRatio: '16:9',
    items: items,
    page: page,
    hasMore: hasNextPage(html, page)
  };
}

function onSearch(ctx) {
  return search(ctx);
}

function parseListHtml(ctx, html) {
  const items = [];
  const seen = {};
  const cardRegex = /<a\b[^>]*href=["']([^"']*\/v\/(\d+)[^"']*)["'][^>]*title=["']([^"']*)["'][^>]*>[\s\S]*?<\/a>/gi;
  let match;
  while ((match = cardRegex.exec(html || '')) !== null) {
    const block = match[0];
    const id = match[2];
    if (!id || seen[id]) continue;
    seen[id] = true;

    const title = decodeEntities(match[3]).trim() || id;
    const thumb = absoluteURL(ctx, firstNonEmpty(
      firstMatch(block, /data-src=["']([^"']*covers\/\d+\.webp[^"']*)["']/i),
      firstMatch(block, /src=["']([^"']*covers\/\d+\.webp[^"']*)["']/i),
      firstMatch(block, /data-src=["']([^"']+)["']/i),
      firstMatch(block, /src=["']([^"']+)["']/i)
    ));
    const duration = firstMatch(block, /right-1[^>]*>\s*(\d+:\d+(?::\d+)?)\s*</i);
    const views = firstMatch(block, /left-1[^>]*>[\s\S]*?<\/svg>\s*<span>\s*([\d.]+[KMk]?)\s*<\/span>/i);
    const subtitleParts = [];
    if (duration) subtitleParts.push(duration);
    if (views) subtitleParts.push('观看 ' + views);

    items.push({
      id: id,
      title: title,
      subtitle: subtitleParts.join(' · '),
      type: 'movie',
      poster: thumb,
      backdrop: thumb,
      imageHeaders: mediaHeaders(ctx),
      aspectRatio: '16:9',
      durationText: duration || undefined,
      remarks: duration || undefined,
      metadataText: views ? '观看 ' + views : undefined,
      action: {
        type: 'detail',
        itemId: id,
        id: id,
        title: title
      }
    });
  }
  return items;
}

function resourceGroupsFor(ctx, id, title, source) {
  if (!source || !source.url) return [];
  const versionId = (source.preview ? 'preview-' : 'source-') + id;
  return [{ id: source.preview ? 'preview' : 'online', title: source.preview ? '公开预览' : '网页播放线路', versions: [{
    id: versionId, name: source.preview ? '公开预览（非完整影片）' : '当前网页线路', title: title,
    subtitle: source.preview ? '完整影片需要站点登录及观看权限' : '播放时重新读取网页地址',
    container: /\.m3u8(?:$|[?#])/i.test(source.url) ? 'm3u8' : 'mp4', default: true,
    action: { type: 'play', itemId: id, versionId: versionId, title: title }
  }] }];
}

function categoryCard(ctx, section) {
  return {
    id: 'category-' + section.id,
    title: section.title,
    type: 'category',
    aspectRatio: '16:9',
    action: categoryAction(ctx, section)
  };
}

function categoryAction(ctx, section) {
  return {
    type: 'category',
    id: section.id,
    pageId: section.id,
    title: section.title,
    url: categoryURL(ctx, section.path),
    itemAspectRatio: '16:9'
  };
}

function sectionShell(ctx, section) {
  return {
    id: section.id,
    title: section.title,
    style: section.style,
    lazy: true,
    loadAction: {
      type: 'custom',
      id: section.id,
      sectionId: section.id,
      title: section.title
    },
    moreAction: categoryAction(ctx, section),
    items: []
  };
}

function emptySection(id, title, style, error) {
  return {
    id: id,
    title: title,
    style: style || 'discover.standard',
    lazy: false,
    items: [],
    error: stringValue(error && (error.message || error))
  };
}

function toWideItem(item) {
  const copy = {};
  Object.keys(item).forEach(function (key) {
    copy[key] = item[key];
  });
  copy.aspectRatio = '16:9';
  return copy;
}

async function fetchText(ctx, url) {
  let timer;
  try {
    return await Promise.race([Promise.resolve().then(async function () {
      const options = { headers: mediaHeaders(ctx), timeout: 8, timeoutSeconds: 8, browserFallback: false };
      let response;
      if (typeof Widget !== 'undefined' && Widget.http && typeof Widget.http.get === 'function') response = await Widget.http.get(url, options);
      else if (typeof Widget !== 'undefined' && Widget.http && typeof Widget.http.request === 'function') response = await Widget.http.request(Object.assign({ url: url, method: 'GET' }, options));
      else if (typeof $http !== 'undefined' && typeof $http.get === 'function') response = await $http.get(url, options);
      else throw new Error('当前环境没有 HTTP 客户端');
      const status = Number(response && (response.statusCode || response.status) || 200);
      if (status >= 400) throw new Error('套路SM HTTP ' + status);
      const final = response && (response.finalURL || response.urlEffective || response.responseURL || response.url);
      if (/\/login(?:[/?#]|$)/i.test(String(final || ''))) throw new Error('套路SM 此入口需要站点登录及观看权限');
      let text = '';
      if (typeof response === 'string') text = response;
      else if (response && typeof response.text === 'function') text = await response.text();
      else if (response) for (const value of [response.data, response.body, response.html, response.text]) { if (typeof value === 'string') { text = value; break; } if (value && typeof value.html === 'string') { text = value.html; break; } }
      if (!text) throw new Error('套路SM 返回空内容');
      if (/Just a moment|Checking (?:your )?browser|cf-chl-/i.test(text)) throw new Error('套路SM 返回验证页');
      return String(text);
    }), new Promise(function (_, reject) { timer = setTimeout(function () { reject(new Error('套路SM HTTP 等待超时（8 秒）')); }, 8000); })]);
  } finally { clearTimeout(timer); }
}

function mediaHeaders(ctx) {
  return {
    Referer: baseURL(ctx) + '/',
    'User-Agent': TAOLUSM_UA
  };
}

function baseURL(ctx) {
  const value = stringValue(contextValue(ctx, 'baseURL') || TAOLUSM_DEFAULT_BASE).replace(/\/+$/, '');
  return value || TAOLUSM_DEFAULT_BASE;
}

function categoryURL(ctx, path) {
  if (/^https?:\/\//i.test(path || '')) return path;
  const normalized = path && path.charAt(0) === '/' ? path : '/' + (path || '');
  return baseURL(ctx) + normalized;
}

function downloadURL(ctx, id) {
  return baseURL(ctx) + '/download/' + encodeURIComponent(id);
}

function pagedURL(url, page) {
  if (page <= 1) return url;
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'page=' + encodeURIComponent(page);
}

function findSection(id) {
  const normalized = normalizePageId(id);
  for (let i = 0; i < TAOLUSM_SECTIONS.length; i += 1) {
    if (TAOLUSM_SECTIONS[i].id === normalized) return TAOLUSM_SECTIONS[i];
  }
  return null;
}

function normalizePageId(id) {
  const value = stringValue(id);
  if (value === 'japaneseKorean') return 'japanese-korean';
  return value.replace(/^category-/, '') || 'latest';
}

function itemIdFromContext(ctx) {
  for (const value of [ctx.itemId, ctx.id, ctx.link, ctx.vid, ctx.videoId, ctx.versionId, ctx.url]) {
    const text = stringValue(value);
    if (/^\d+$/.test(text)) return text;
    const match = text.match(/^(?:download|preview|source)-(\d+)$/) || text.match(/\/(?:v|download)\/(\d+)(?:[/?#]|$)/);
    if (match) return match[1];
  }
  return '';
}

function hasNextPage(html, page) {
  if (!html) return false;
  const nextPage = page + 1;
  const escaped = String(nextPage).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp('[?&]page=' + escaped + '(["\'&<#\\s])', 'i'),
    new RegExp('>\\s*' + escaped + '\\s*<', 'i'),
    /rel=["']next["']/i
  ];
  return patterns.some(function (pattern) { return pattern.test(html); });
}

function metaContent(html, attr, value) {
  const re = new RegExp("<meta[^>]*" + attr + "=[\"']" + escapeRegExp(value) + "[\"'][^>]*content=[\"']([^\"']*)[\"'][^>]*>", 'i');
  const reversed = new RegExp("<meta[^>]*content=[\"']([^\"']*)[\"'][^>]*" + attr + "=[\"']" + escapeRegExp(value) + "[\"'][^>]*>", 'i');
  return decodeEntities(firstMatch(html, re) || firstMatch(html, reversed));
}

function pageTitle(html) {
  return decodeEntities(firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
}

function pickImageForId(html, id) {
  return firstMatch(html, new RegExp("(?:data-src|src)=[\"']([^\"']*covers/" + escapeRegExp(id) + "\\.webp[^\"']*)[\"']", 'i'));
}

function pickImage(html) {
  return firstMatch(html, /(?:data-src|src)=["']([^"']+\.(?:webp|jpg|jpeg|png)[^"']*)["']/i);
}

function firstMatch(text, pattern) {
  const match = pattern.exec(text || '');
  return match ? match[1] || '' : '';
}

function firstNonEmpty() {
  for (let i = 0; i < arguments.length; i += 1) {
    const value = stringValue(arguments[i]);
    if (value) return value;
  }
  return '';
}

function cleanTitle(text) {
  return cleanText(text).replace(/\s*-\s*.*$/, '').trim();
}

function cleanText(text) {
  return decodeEntities(stripTags(stringValue(text))).replace(/\s+/g, ' ').trim();
}

function stripTags(text) {
  return stringValue(text).replace(/<[^>]+>/g, ' ');
}

function decodeEntities(text) {
  return stringValue(text)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, function (_, code) {
      return String.fromCharCode(Number(code));
    });
}

function absoluteURL(ctx, url) {
  const value = stringValue(url);
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.indexOf('//') === 0) return 'https:' + value;
  if (value.charAt(0) === '/') return baseURL(ctx) + value;
  return baseURL(ctx) + '/' + value;
}

function contextValue(ctx, key) {
  if (!ctx || !key) return '';
  if (ctx[key] !== undefined && ctx[key] !== null) return ctx[key];
  if (ctx.params && ctx.params[key] !== undefined && ctx.params[key] !== null) return ctx.params[key];
  if (ctx.parameters && ctx.parameters[key] !== undefined && ctx.parameters[key] !== null) return ctx.parameters[key];
  return '';
}

function positiveInt(value, fallback) {
  const number = parseInt(value, 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function stringValue(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function escapeRegExp(text) {
  return stringValue(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
