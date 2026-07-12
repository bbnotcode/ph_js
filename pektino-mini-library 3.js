// @name Pektino DreamBy Mini Library

const PEKTINO_BASE = 'https://pektino.com';
const PEKTINO_LOCALE = '/zh-CN';
const PEKTINO_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const WidgetMetadata = {
  id: 'pektino-twitter-video',
  name: 'Twitter 视频排行榜',
  title: 'Twitter 视频排行榜',
  version: '1.0.2',
  author: 'Codex',
  site: PEKTINO_BASE + PEKTINO_LOCALE,
  description: 'Pektino X(Twitter) 视频排行榜 DreamBy 自定义媒体库。'
};

const RANKS = [
  { id: 'daily', title: '每日', path: '/', style: 'discover.ranked' },
  { id: 'weekly', title: '每周', path: '/weekly', style: 'discover.ranked' },
  { id: 'monthly', title: '每月', path: '/monthly', style: 'discover.ranked' },
  { id: 'all', title: '所有时间', path: '/all', style: 'discover.ranked' },
  { id: 'favorite', title: '我所喜爱的', path: '/favorite', style: 'discover.standard' }
];

const SORTS = [
  { id: 'favorite', title: '按点赞', value: 'favorite' },
  { id: 'pv', title: '按观看数', value: 'pv' },
  { id: 'time', title: '按时长', value: 'time' },
  { id: 'created', title: '最近添加', value: 'created' }
];

function getManifest() {
  return {
    ...WidgetMetadata,
    capabilities: { home: true, category: true, detail: true, search: false, resourceVersions: true, playback: true, resourceMatching: false },
    aggregation: { search: false, playbackHistory: true, resourceMatching: false },
    parameters: [
      { name: 'baseURL', title: '站点地址', type: 'input', defaultValue: PEKTINO_BASE, required: true },
      { name: 'cookie', title: '网站 Cookie（收藏可选）', type: 'password', defaultValue: '', required: false, description: '如需同步 Pektino 网页端收藏，可填写该网站会话 Cookie。' }
    ]
  };
}

async function getHome() {
  return {
    pageType: 'home', id: 'pektino-home', title: WidgetMetadata.title, heroAspectRatio: '16:9', hero: [],
    sections: RANKS.map(r => ({ id: r.id, title: r.title, style: r.style, lazy: true, items: [], moreAction: categoryAction(r) }))
  };
}

async function getHomeSection(ctx) {
  const rank = rankOf(ctx && (ctx.sectionId || ctx.id));
  try {
    const result = await fetchRank(ctx, rank, 1, 'favorite');
    return { id: rank.id, title: rank.title, style: rank.style, lazy: false, items: result.items.slice(0, 18), moreAction: categoryAction(rank) };
  } catch (error) {
    return { id: rank.id, title: rank.title, style: rank.style, lazy: false, items: [], subtitle: errorMessage(error) };
  }
}

async function getCategory(ctx) {
  const rank = rankOf(ctx && (ctx.pageId || ctx.id));
  const page = positiveInt(value(ctx, 'page'), 1);
  const sort = normalizeSort(first(
    value(ctx, 'sort'),
    value(ctx, 'sortValue'),
    value(ctx, 'selectedSortValue'),
    value(ctx, 'sortBy'),
    value(ctx, 'sort_by'),
    'favorite'
  ));
  const result = await fetchRank(ctx, rank, page, sort);
  return {
    pageType: 'category', id: rank.id, title: rank.title, style: 'media.posterGrid', itemAspectRatio: '16:9',
    items: result.items, page, hasMore: result.hasMore, selectedSortValue: sort, sort: SORTS
  };
}

async function getDetail(ctx) {
  const id = movieId(ctx);
  if (!id) throw new Error('Pektino 详情参数无效');
  const url = movieURL(ctx, id);
  const html = await fetchText(ctx, url);
  const data = parseDetail(html, id, ctx);
  const versionId = encode({ id, url: data.playURL, title: data.title, poster: data.poster, referer: url });
  return {
    pageType: 'detail', id, type: 'movie', title: data.title, poster: data.poster, backdrop: data.poster,
    detailImageAspectRatio: data.portrait ? '2:3' : '16:9', imageHeaders: imageHeaders(), posterHeaders: imageHeaders(), backdropHeaders: imageHeaders(),
    overview: data.overview, viewCountText: data.views, favoriteCountText: data.favorites,
    resourceGroups: [{ id: 'direct', title: 'Twitter 原始视频', versions: [{ id: versionId, title: '原画 MP4', name: '原画 MP4', url: data.playURL, container: 'mp4', headers: playbackHeaders(), default: true, action: { type: 'play', itemId: id, versionId, url: data.playURL, title: data.title } }] }],
    recommendations: [{ id: 'related', title: '相关视频', style: 'discover.standard', items: data.related }]
  };
}

async function getResourceVersions(ctx) {
  const payload = decode(ctx && (ctx.versionId || ctx.episodeId));
  const id = first(payload.id, movieId(ctx));
  let playURL = first(payload.url, directURL(ctx));
  let title = first(payload.title, ctx && ctx.title, id);
  let poster = payload.poster;
  let referer = first(payload.referer, id && movieURL(ctx, id));
  if (!playURL && id) {
    const data = parseDetail(await fetchText(ctx, movieURL(ctx, id)), id, ctx);
    playURL = data.playURL; title = data.title; poster = data.poster;
  }
  if (!playURL) return [];
  const versionId = encode({ id, url: playURL, title, poster, referer });
  return [{ id: 'direct', title: 'Twitter 原始视频', versions: [{ id: versionId, title: '原画 MP4', name: '原画 MP4', url: playURL, container: containerOf(playURL), headers: playbackHeaders(), default: true }] }];
}

async function resolvePlayback(ctx) {
  const payload = decode(first(ctx && ctx.versionId, ctx && ctx.episodeId, ctx && ctx.itemId, ctx && ctx.id));
  const id = first(payload.id, movieId(ctx));
  let url = first(payload.url, directURL(ctx));
  if (!url && id) url = parseDetail(await fetchText(ctx, movieURL(ctx, id)), id, ctx).playURL;
  if (!/^https?:\/\//i.test(string(url))) throw new Error('未解析到 Pektino 播放地址');
  return { url, container: containerOf(url), headers: playbackHeaders(), startPositionSeconds: 0, isLive: false, streamKind: 'vod' };
}

async function fetchRank(ctx, rank, page, sort) {
  const params = ['sort=' + encodeURIComponent(sort), 'page=' + page];
  const url = site(ctx) + PEKTINO_LOCALE + rank.path + '?' + params.join('&');
  const html = await fetchText(ctx, url);
  const items = parseCards(html, ctx);
  return { items, hasMore: hasNext(html, page) };
}

function parseCards(html, ctx) {
  const out = [], seen = new Set();
  const re = /<a\b[^>]*href=["']([^"']*\/movie\/([^"'/?#]+))[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const id = decodeHTML(m[2]);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const body = m[3];
    const poster = absolute(ctx, attr(body, 'img', 'src'));
    const alt = attr(body, 'img', 'alt');
    const duration = stripTags((body.match(/bottom[^>]*>([\s\S]*?)<\/div>/i) || [])[1] || '');
    const portrait = /padding-bottom:\s*177/i.test(body);
    out.push({ id, title: cleanTitle(alt, id), subtitle: duration || 'Twitter 视频', type: 'movie', poster, backdrop: poster, aspectRatio: portrait ? '2:3' : '16:9', imageHeaders: imageHeaders(), badges: duration ? [duration] : [], action: { type: 'detail', itemId: id } });
  }
  return out;
}

function parseDetail(html, id, ctx) {
  const mp4 = firstMatch(html, /https:\/\/video\.twimg\.com\/[^"'<>\\]+?\.mp4(?:\?[^"'<>\\]*)?/i);
  const videoSrc = firstMatch(html, /<(?:video|source)\b[^>]*\bsrc=["']([^"']+)/i);
  const poster = absolute(ctx, first(attr(html, 'video', 'poster'), firstMatch(html, /<img\b[^>]*alt=["'][^"']*adult video[^"']*["'][^>]*src=["']([^"']+)/i)));
  const titleRaw = stripTags((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
  const playURL = decodeHTML(first(mp4, videoSrc));
  if (!playURL) throw new Error('Pektino 详情页未提供视频地址');
  const relatedBlock = (html.match(/相关视频[\s\S]*?(?:评论|如何保存|<footer)/i) || [''])[0];
  return { id, title: cleanTitle(titleRaw, id), poster, playURL, portrait: /padding-bottom:\s*177/i.test(html), views: '', favorites: '', overview: '来自 Pektino 的 X(Twitter) 视频。', related: parseCards(relatedBlock, ctx).slice(0, 18) };
}

async function fetchText(ctx, url) {
  const headers = requestHeaders(ctx, url);
  let response;
  if (typeof Widget !== 'undefined' && Widget.http && typeof Widget.http.get === 'function') response = await Widget.http.get(url, { headers });
  else if (typeof $http !== 'undefined' && typeof $http.get === 'function') response = await $http.get(url, { headers });
  else throw new Error('当前环境没有可用的 HTTP 请求接口');
  const body = response && (response.data !== undefined ? response.data : response.body !== undefined ? response.body : response);
  return typeof body === 'string' ? body : JSON.stringify(body || '');
}

function requestHeaders(ctx, referer) { const h = { 'User-Agent': PEKTINO_UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'zh-CN,zh;q=0.9', Referer: referer || site(ctx) + PEKTINO_LOCALE + '/' }; const c = string(value(ctx, 'cookie')); if (c) h.Cookie = c; return h; }
function imageHeaders() { return { Referer: 'https://pektino.com/', 'User-Agent': PEKTINO_UA }; }
function playbackHeaders() { return { Referer: 'https://x.com/', Origin: 'https://x.com', 'User-Agent': PEKTINO_UA, Accept: 'video/avc,video/mp4,video/*;q=0.9,*/*;q=0.8' }; }
function rankOf(id) { return RANKS.find(r => r.id === string(id)) || RANKS[0]; }
function normalizeSort(sort) {
  const aliases = { view: 'pv', views: 'pv', duration: 'time', latest: 'created', favorite: 'favorite', pv: 'pv', time: 'time', created: 'created' };
  return aliases[string(sort)] || 'favorite';
}
function categoryAction(r) { return { type: 'category', pageId: r.id, title: r.title, itemAspectRatio: '16:9' }; }
function site(ctx) { return string(value(ctx, 'baseURL') || PEKTINO_BASE).replace(/\/+$/, ''); }
function movieURL(ctx, id) { return site(ctx) + PEKTINO_LOCALE + '/movie/' + encodeURIComponent(id); }
function movieId(ctx) { const raw = first(ctx && ctx.itemId, ctx && ctx.id, ctx && ctx.sourceId); const p = decode(raw); return first(p.id, string(raw).match(/\/movie\/([^/?#]+)/) && string(raw).match(/\/movie\/([^/?#]+)/)[1], /^[\w-]+$/.test(string(raw)) ? raw : ''); }
function directURL(ctx) { for (const k of ['url','playUrl','videoUrl','path']) { const v = ctx && ctx[k]; if (/^https?:\/\//i.test(string(v)) && /\.(?:mp4|m3u8|mpd)(?:[?#]|$)/i.test(string(v))) return v; } return ''; }
function containerOf(url) { if (/\.m3u8(?:[?#]|$)/i.test(url)) return 'm3u8'; if (/\.mpd(?:[?#]|$)/i.test(url)) return 'mpd'; return 'mp4'; }
function hasNext(html, page) { return new RegExp('[?&]page=' + (page + 1) + '(?:[&"\'])', 'i').test(html); }
function attr(html, tag, name) { const tagMatch = new RegExp('<' + tag + '\\b[^>]*>', 'i').exec(html || ''); if (!tagMatch) return ''; const m = new RegExp('\\b' + name + '=["\\\']([^"\\\']*)', 'i').exec(tagMatch[0]); return m ? decodeHTML(m[1]) : ''; }
function firstMatch(text, re) { const m = re.exec(text || ''); return m ? (m[1] || m[0]) : ''; }
function absolute(ctx, url) { if (!url) return ''; if (/^https?:\/\//i.test(url)) return url; return site(ctx) + (url.startsWith('/') ? url : '/' + url); }
function cleanTitle(text, id) { return string(text).replace(/^X\s*\(Twitter\)\s*adult video\s*/i, '').replace(/\s*-\s*免费视频。?$/i, '').trim() || id; }
function stripTags(v) { return decodeHTML(string(v).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()); }
function decodeHTML(v) { return string(v).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>'); }
function value(ctx, key) { return first(ctx && ctx[key], ctx && ctx.params && ctx.params[key], ctx && ctx.config && ctx.config[key], ctx && ctx.settings && ctx.settings[key], ctx && ctx.parameters && ctx.parameters[key]); }
function first() { for (let i = 0; i < arguments.length; i++) if (arguments[i] !== undefined && arguments[i] !== null && string(arguments[i]) !== '') return arguments[i]; return ''; }
function string(v) { return v === undefined || v === null ? '' : String(v).trim(); }
function positiveInt(v, fallback) { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : fallback; }
function encode(obj) { try { return 'pektino://' + encodeURIComponent(JSON.stringify(obj)); } catch (_) { return ''; } }
function decode(v) { const s = string(v); if (!s.startsWith('pektino://')) return {}; try { return JSON.parse(decodeURIComponent(s.slice(10))); } catch (_) { return {}; } }
function errorMessage(e) { return e && e.message ? e.message : string(e) || '加载失败'; }

const api = { WidgetMetadata, getManifest, getHome, getHomeSection, getCategory, getDetail, getResourceVersions, resolvePlayback, play: resolvePlayback, getPlayback: resolvePlayback };
if (typeof globalThis !== 'undefined') Object.assign(globalThis, api);
if (typeof module !== 'undefined' && module.exports) module.exports = api;
