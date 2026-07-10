// @name XXXFollow Mini Library

const XXXFOLLOW_BASE = 'https://www.xxxfollow.com';
const XXXFOLLOW_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
// 标签页项目可能不在首页 feed 中；保存已解析的直链，供详情页播放回调复用。
const XXXFOLLOW_VIDEO_CACHE = Object.create(null);
const XXXFOLLOW_TAGS = [
  ['asian', '亚洲'], ['bigass', '大屁股'], ['bigtits', '巨乳'], ['blowjob', '口交'],
  ['brunette', '棕发'], ['smalltits', '贫乳'], ['creampie', '内射'], ['ebony', '黑人'],
  ['latina', '拉丁'], ['milf', '人妻'], ['teen-18', '18岁'], ['anal', '肛交'],
  ['threesome', '3P'], ['squirt', '潮吹'], ['pov', '第一人称'], ['lesbian', '女同'],
  ['amateur', '素人'], ['cosplay', '角色扮演'], ['tattoo', '纹身'], ['redhead', '红发'],
  ['doggystyle', '后入'], ['cumshot', '颜射'], ['homemade', '自拍'], ['black', '黑人性爱'],
  ['trans', '变性'], ['bondage', '捆绑'], ['joi', '指令自慰'], ['missionary', '传教士'],
  ['outdoors', '户外'], ['stripchat', '直播']
];

const WidgetMetadata = {
  id: 'xxxfollow-mini-library', name: 'XXXFollow', title: 'XXXFollow', version: '1.0.0', author: 'EL',
  logo: XXXFOLLOW_BASE + '/favicon.ico', icon: XXXFOLLOW_BASE + '/favicon.ico', site: XXXFOLLOW_BASE,
  description: 'XXXFollow 短视频聚合自定义媒体库。'
};

function getManifest() {
  return {
    id: WidgetMetadata.id, name: WidgetMetadata.name, title: WidgetMetadata.title,
    version: WidgetMetadata.version, author: WidgetMetadata.author, logo: WidgetMetadata.logo,
    icon: WidgetMetadata.icon, site: WidgetMetadata.site, description: WidgetMetadata.description,
    capabilities: { home: true, category: true, detail: true, search: true, playback: true,
      resourceVersions: true, aggregation: true, playbackHistory: true, resourceMatching: false },
    aggregation: { search: true, playbackHistory: true, resourceMatching: false },
    parameters: [{ name: 'baseURL', title: '站点地址', type: 'input', defaultValue: XXXFOLLOW_BASE,
      value: XXXFOLLOW_BASE, required: true }]
  };
}

async function getHome(ctx) {
  let items = [];
  try { items = await loadFeed(ctx, '', 1); } catch (_) {}
  return {
    pageType: 'home', id: 'xxxfollow-home', title: 'XXXFollow', heroAspectRatio: '16:9', hero: items.slice(0, 8),
    sections: [
      { id: 'for-you', title: '推荐', style: 'discover.spotlight', moreAction: { type: 'category', pageId: 'for-you', title: '推荐', itemAspectRatio: '16:9' }, items: items.slice(0, 18) },
      { id: 'tags', title: '标签', style: 'discover.annualCategories', lazy: false, items: XXXFOLLOW_TAGS.slice(0, 16).map(function (tag) {
        return { id: 'tag-' + tag[0], title: tag[1], type: 'category', poster: '', action: { type: 'category', pageId: 'tag:' + tag[0], title: tag[1], itemAspectRatio: '16:9' } };
      }) }
    ]
  };
}

async function getHomeSection(ctx) {
  const id = stringValue(ctx && (ctx.sectionId || ctx.id));
  if (id === 'tags') return { id: 'tags', title: '标签', style: 'discover.annualCategories', lazy: false, items: XXXFOLLOW_TAGS.map(function (tag) { return { id: 'tag-' + tag[0], title: tag[1], type: 'category', action: { type: 'category', pageId: 'tag:' + tag[0], title: tag[1] } }; }) };
  try { return { id: 'for-you', title: '推荐', style: 'discover.spotlight', lazy: false, items: await loadFeed(ctx, '', 1) }; }
  catch (error) { return { id: id || 'for-you', title: '推荐', style: 'discover.spotlight', lazy: false, items: [], error: stringValue(error.message || error) }; }
}

async function getCategory(ctx) {
  const raw = stringValue(ctx && (ctx.pageId || ctx.id || ctx.category || ctx.genreId));
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  const tag = raw.indexOf('tag:') === 0 ? raw.slice(4) : '';
  const html = await fetchText(ctx, feedURL(ctx, tag, page));
  return { pageType: 'category', id: raw || 'for-you', title: tagTitle(tag) || '推荐', style: 'media.posterGrid', itemAspectRatio: '16:9', page: page, hasMore: /[?&]page=\d+|rel=["']next["']/i.test(html), items: parsePreloadItems(ctx, html) };
}

async function getDetail(ctx) {
  const item = await findItem(ctx);
  if (!item) throw new Error('XXXFollow 找不到视频详情');
  return detailObject(ctx, item);
}

async function getResourceVersions(ctx) {
  const item = await findItem(ctx);
  if (!item) return [];
  return resourceGroups(ctx, item);
}

async function resolvePlayback(ctx) {
  let url = directURL(ctx);
  let item;
  if (!url) {
    const cachedId = normalizeItemId(ctx);
    url = cachedId && XXXFOLLOW_VIDEO_CACHE[cachedId];
  }
  if (!url) { item = await findItem(ctx); url = item && item.videoUrl; }
  if (!url) throw new Error('没有解析到 XXXFollow 播放地址');
  return { url: decodeURL(url), container: /\.m3u8(?:$|[?#])/i.test(url) ? 'm3u8' : 'mp4', headers: mediaHeaders(ctx), startPositionSeconds: 0, isLive: false, streamKind: /\.m3u8(?:$|[?#])/i.test(url) ? 'hls' : 'file' };
}

async function search(ctx) {
  const query = clean(contextValue(ctx, 'query') || contextValue(ctx, 'keyword') || contextValue(ctx, 'text'));
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  if (!query) return { pageType: 'search', title: '搜索结果', keyword: '', page: page, hasMore: false, items: [] };
  const html = await fetchText(ctx, baseURL(ctx) + '/search/' + encodeURIComponent(query) + (page > 1 ? '?page=' + page : ''));
  return { pageType: 'search', title: query, keyword: query, style: 'media.posterGrid', itemAspectRatio: '16:9', page: page, hasMore: /rel=["']next["']/i.test(html), items: parsePreloadItems(ctx, html) };
}
function onSearch(ctx) { return search(ctx); }
function getSearch(ctx) { return search(ctx); }
function play(ctx) { return resolvePlayback(ctx); }
function getPlayback(ctx) { return resolvePlayback(ctx); }

async function findItem(ctx) {
  const givenURL = directURL(ctx);
  const id = normalizeItemId(ctx);
  const embedded = playbackPayload(rawPlaybackId(ctx));
  if (embedded.url) return {
    id: embedded.id || id,
    sourceId: embedded.id || id,
    videoUrl: embedded.url,
    poster: embedded.poster || stringValue(ctx && (ctx.poster || ctx.backdrop)),
    backdrop: embedded.poster || stringValue(ctx && (ctx.backdrop || ctx.poster)),
    title: embedded.title || stringValue(ctx && ctx.title) || id
  };
  if (id && XXXFOLLOW_VIDEO_CACHE[id]) return { id: id, videoUrl: XXXFOLLOW_VIDEO_CACHE[id], title: stringValue(ctx && ctx.title) || id };
  if (givenURL && id && !/^https?:\/\//i.test(id)) return { id: id, videoUrl: givenURL, title: stringValue(ctx.title) || id };
  const html = await fetchText(ctx, baseURL(ctx));
  const state = extractPreloadState(html);
  const found = findById(state, id);
  if (found) return found;
  if (givenURL) return { id: id || givenURL, videoUrl: givenURL, title: stringValue(ctx.title) || id || 'XXXFollow' };
  return null;
}

function detailObject(ctx, item) {
  const related = [];
  return { pageType: 'detail', id: item.id, title: item.title, type: 'movie', poster: item.poster, backdrop: item.backdrop,
    imageHeaders: mediaHeaders(ctx), posterHeaders: mediaHeaders(ctx), backdropHeaders: mediaHeaders(ctx), detailImageAspectRatio: '16:9',
    overview: item.overview || '', year: item.year, rating: item.rating, runtimeMinutes: item.duration ? Math.round(item.duration / 60) : undefined,
    genres: item.genres || [], resourceGroups: resourceGroups(ctx, item), recommendations: related.length ? [{ id: 'related', title: '相关推荐', style: 'discover.standard', items: related }] : [] };
}

function resourceGroups(ctx, item) {
  const sourceId = item.sourceId || playbackPayload(item.id).id || item.id;
  const payload = makePlaybackPayload(sourceId, item.videoUrl, item.poster || item.backdrop, item.title);
  return [{ id: 'online', title: '在线播放', versions: [{ id: payload, name: '默认线路', subtitle: item.videoUrl ? '高清直链' : '详情页解析', url: item.videoUrl || undefined, container: /\.m3u8/i.test(item.videoUrl || '') ? 'm3u8' : 'mp4', default: true, headers: mediaHeaders(ctx), action: { type: 'play', itemId: payload, versionId: payload, url: item.videoUrl || undefined, playUrl: item.videoUrl || undefined, videoUrl: item.videoUrl || undefined, title: item.title } }] }];
}

async function loadFeed(ctx, tag, page) { return parsePreloadItems(ctx, await fetchText(ctx, feedURL(ctx, tag, page))); }
function feedURL(ctx, tag, page) { let url = baseURL(ctx) + (tag ? '/tag/' + encodeURIComponent(tag) : '/'); if (page > 1) url += (url.indexOf('?') >= 0 ? '&' : '?') + 'page=' + page; return url; }
async function fetchText(ctx, url) { const response = await Widget.http.get(url, { headers: Object.assign({}, mediaHeaders(ctx), { Accept: 'text/html,application/xhtml+xml,application/json' }) }); const data = response && (response.data || response.body || response.text); if (!data) throw new Error('请求失败: ' + url); return String(data); }
function parsePreloadItems(ctx, html) { const state = extractPreloadState(html); return collectLists(state).map(function (entry) { return parseItem(ctx, entry); }).filter(Boolean); }

function extractPreloadState(html) {
  const marker = String(html || '').indexOf('__PRELOAD_STATE__'); if (marker < 0) return null;
  const start = String(html).indexOf('{', marker); if (start < 0) return null; let depth = 0, quote = false, escape = false;
  for (let i = start; i < html.length; i += 1) { const ch = html[i]; if (escape) { escape = false; continue; } if (ch === '\\' && quote) { escape = true; continue; } if (ch === '"') { quote = !quote; continue; } if (!quote) { if (ch === '{') depth += 1; else if (ch === '}' && --depth === 0) { try { return JSON.parse(html.slice(start, i + 1)); } catch (_) { return null; } } } }
  return null;
}
function collectLists(value, output) { output = output || []; if (!value || typeof value !== 'object') return output; if (Array.isArray(value)) { value.forEach(function (v) { collectLists(v, output); }); return output; } if (Array.isArray(value.list)) value.list.forEach(function (v) { if (v && v.post) output.push(v); }); Object.keys(value).forEach(function (key) { if (key !== 'list') collectLists(value[key], output); }); return output; }
function findById(state, id) { const wanted = stringValue(id); if (!wanted) return null; const list = collectLists(state); for (let i = 0; i < list.length; i += 1) { const post = list[i].post || {}; if (String(post.id) === wanted || post.slug === wanted) return parseItem({ }, list[i]); } return null; }
function parseItem(ctx, item) {
  if (!item || !item.post) return null; const post = item.post, media = Array.isArray(post.media) ? post.media : [], first = media[0] || {};
  const id = String(post.slug || post.id || ''); if (!id) return null; const video = first.fhd_url || first.uhd_url || first.url || first.sd_url || '';
  const poster = absolute(ctx, first.thumb_url || first.start_url || ''); const tags = Array.isArray(post.tags) ? post.tags : [];
  const genres = tags.map(function (t) { return clean(t && (t.display || t.tag)); }).filter(Boolean);
  const videoUrl = decodeURL(video);
  if (id && videoUrl) XXXFOLLOW_VIDEO_CACHE[id] = videoUrl;
  const payload = makePlaybackPayload(id, videoUrl, poster, clean(post.text || id));
  return { id: payload, sourceId: id, title: clean(post.text || 'Video ' + id).slice(0, 120), poster: poster, backdrop: poster, videoUrl: videoUrl, duration: Number(first.duration_in_second || 0), rating: Math.min(10, Math.round(Number(item.like_count || 0) / 2000)), genres: genres, overview: clean(post.text || ''), action: { type: 'detail', itemId: payload, id: payload, title: clean(post.text || id), url: videoUrl, playUrl: videoUrl, videoUrl: videoUrl } };
}

function normalizeItemId(ctx) {
  if (!ctx) return '';
  const raw = rawPlaybackId(ctx);
  if (raw && typeof raw === 'object') return playbackPayload(raw.itemId || raw.id || raw.slug || raw.videoId).id;
  return playbackPayload(raw).id;
}
function rawPlaybackId(ctx) {
  if (!ctx) return '';
  return contextValue(ctx, 'itemId') || contextValue(ctx, 'episodeId') || contextValue(ctx, 'id') || contextValue(ctx, 'link') || contextValue(ctx, 'videoId') || contextValue(ctx, 'versionId');
}
function makePlaybackPayload(id, url, poster, title) {
  if (!url) return stringValue(id);
  let payload = 'xxxfollow://play?id=' + encodeURIComponent(stringValue(id)) + '&url=' + encodeURIComponent(decodeURL(url));
  if (poster) payload += '&poster=' + encodeURIComponent(stringValue(poster));
  if (title) payload += '&title=' + encodeURIComponent(stringValue(title));
  return payload;
}
function playbackPayload(value) {
  const raw = stringValue(value).replace(/^default-/, '');
  if (raw.indexOf('xxxfollow://play?') !== 0) return { id: raw, url: '', poster: '', title: '' };
  const query = raw.slice(raw.indexOf('?') + 1).split('&');
  const result = { id: '', url: '', poster: '', title: '' };
  query.forEach(function (part) {
    const index = part.indexOf('=');
    if (index < 0) return;
    const key = part.slice(0, index);
    let value = part.slice(index + 1);
    try { value = decodeURIComponent(value); } catch (_) {}
    if (key === 'id') result.id = value;
    if (key === 'url') result.url = value;
    if (key === 'poster') result.poster = value;
    if (key === 'title') result.title = value;
  });
  return result;
}
function directURL(ctx) {
  const values = ctx ? [
    contextValue(ctx, 'playUrl'), contextValue(ctx, 'videoUrl'), contextValue(ctx, 'mediaUrl'),
    contextValue(ctx, 'streamUrl'), contextValue(ctx, 'url'), contextValue(ctx, 'src'),
    ctx.resource && (ctx.resource.url || ctx.resource.playUrl || ctx.resource.videoUrl),
    ctx.version && (ctx.version.url || ctx.version.playUrl || ctx.version.videoUrl),
    ctx.item && (ctx.item.url || ctx.item.playUrl || ctx.item.videoUrl),
    contextValue(ctx, 'itemId'), contextValue(ctx, 'episodeId'), contextValue(ctx, 'versionId'), contextValue(ctx, 'id')
  ] : [];
  for (let i = 0; i < values.length; i += 1) {
    const value = stringValue(values[i]);
    const embedded = playbackPayload(value).url;
    if (embedded) return embedded;
    if (/\.(?:mp4|m3u8|webm|mov)(?:$|[?#])/i.test(value)) return value;
  }
  return '';
}
function baseURL(ctx) { return stringValue(contextValue(ctx, 'baseURL') || XXXFOLLOW_BASE).replace(/\/+$/, '') || XXXFOLLOW_BASE; }
function absolute(ctx, url) { url = stringValue(url); if (!url) return ''; if (/^https?:\/\//i.test(url)) return url; if (url.indexOf('//') === 0) return 'https:' + url; return baseURL(ctx) + (url.charAt(0) === '/' ? url : '/' + url); }
function decodeURL(url) { return stringValue(url).replace(/\\\//g, '/').replace(/&amp;/g, '&'); }
function mediaHeaders(ctx) { return { Referer: baseURL(ctx) + '/', Origin: baseURL(ctx), 'User-Agent': XXXFOLLOW_UA }; }
function tagTitle(tag) { const found = XXXFOLLOW_TAGS.find(function (entry) { return entry[0] === tag; }); return found ? found[1] : tag; }
function contextValue(ctx, key) { if (!ctx) return ''; if (ctx[key] !== undefined && ctx[key] !== null) return ctx[key]; for (const bag of ['params', 'config', 'settings', 'parameters']) if (ctx[bag] && ctx[bag][key] !== undefined) return ctx[bag][key]; return ''; }
function positiveInt(value, fallback) { const n = parseInt(value, 10); return Number.isFinite(n) && n > 0 ? n : fallback; }
function stringValue(value) { return value === undefined || value === null ? '' : String(value).trim(); }
function clean(value) { return stringValue(value).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim(); }

const XXXFOLLOW_API = { getManifest, getHome, getHomeSection, getCategory, getDetail, getResourceVersions, resolvePlayback, search, onSearch, getSearch, play, getPlayback };
if (typeof globalThis !== 'undefined') Object.keys(XXXFOLLOW_API).forEach(function (key) { globalThis[key] = XXXFOLLOW_API[key]; });
if (typeof module !== 'undefined' && module.exports) module.exports = XXXFOLLOW_API;
