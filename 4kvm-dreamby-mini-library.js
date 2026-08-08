// @name 4K影视

const KVM_BASE = 'https://www.4kvm.net';
const KVM_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const KVM_LOGO = 'https://4kvm.staticimgjs.org/uploads/2026/03/c4b7f67bdfbd37.png';
const KVM_HEADERS = { 'User-Agent': KVM_UA, Accept: 'text/html,application/xhtml+xml' };
const KVM_IMAGE_HEADERS = { 'User-Agent': KVM_UA, Referer: KVM_BASE + '/', Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' };

function kvmContext(input) {
  if (typeof input === 'string') { try { return JSON.parse(input); } catch (_) { return {}; } }
  return input && typeof input === 'object' ? input : {};
}
function kvmPick(input, keys, fallback) {
  const ctx = kvmContext(input); const roots = [ctx, ctx.params, ctx.config, ctx.settings, ctx.parameters, ctx.pagination, ctx.pageInfo];
  for (const root of roots) for (const key of keys) if (root && root[key] !== undefined && root[key] !== null && root[key] !== '') return root[key];
  return fallback;
}
function kvmText(value) { return value === undefined || value === null ? '' : String(value); }
function kvmDecode(value) {
  return kvmText(value).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/\s+/g, ' ').trim();
}
function kvmStrip(value) { return kvmDecode(kvmText(value).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')); }
function kvmAbsolute(url) { const s = kvmDecode(url); return !s ? '' : /^https?:\/\//i.test(s) ? s : s.startsWith('//') ? 'https:' + s : KVM_BASE + (s.startsWith('/') ? s : '/' + s); }
function kvmBody(response) {
  if (typeof response === 'string') return response;
  if (!response) return '';
  if (typeof response.body === 'string') return response.body;
  if (typeof response.text === 'string') return response.text;
  if (typeof response.data === 'string') return response.data;
  if (response.data && typeof response.data.html === 'string') return response.data.html;
  return '';
}
async function kvmHTTP(url) {
  let client = typeof Widget !== 'undefined' && Widget.http ? Widget.http : (typeof $http !== 'undefined' ? $http : null);
  if (!client) throw new Error('4K影视：当前环境没有可用的 HTTP 客户端');
  let response;
  if (typeof client.get === 'function') response = await client.get(url, { headers: KVM_HEADERS });
  else if (typeof client.request === 'function') response = await client.request({ url, method: 'GET', headers: KVM_HEADERS });
  else throw new Error('4K影视：HTTP 客户端不支持 get/request');
  const body = kvmBody(response);
  if (!body || /Just a moment|cf-mitigated|Cloudflare Ray ID/i.test(body)) throw new Error('4K影视：页面被验证页拦截');
  return body;
}
async function kvmJSON(url) {
  const client = typeof Widget !== 'undefined' && Widget.http ? Widget.http : (typeof $http !== 'undefined' ? $http : null);
  if (!client) throw new Error('4K影视：当前环境没有可用的 HTTP 客户端');
  const headers = { 'User-Agent': KVM_UA, Accept: 'application/json' };
  let response;
  if (typeof client.get === 'function') response = await client.get(url, { headers });
  else if (typeof client.request === 'function') response = await client.request({ url, method: 'GET', headers });
  else throw new Error('4K影视：HTTP 客户端不支持 get/request');
  let data = response && response.data !== undefined ? response.data : response;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch (_) { throw new Error('4K影视：片单接口返回了无效数据'); } }
  if (!data || typeof data !== 'object') throw new Error('4K影视：片单接口没有返回数据');
  return data;
}

function kvmMeta(html, key) {
  const safe = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const a = html.match(new RegExp('<meta[^>]+(?:property|name)=["\\\']' + safe + '["\\\'][^>]+content=["\\\']([^"\\\']*)', 'i'));
  const b = html.match(new RegExp('<meta[^>]+content=["\\\']([^"\\\']*)["\\\'][^>]+(?:property|name)=["\\\']' + safe + '["\\\']', 'i'));
  return kvmDecode((a || b || [])[1]);
}
function kvmImageFrom(block, landscape) {
  const imgs = [...block.matchAll(/<img\b[^>]*>/gi)].map(m => {
    const tag = m[0];
    return kvmAbsolute((tag.match(/(?:data-src|data-original)=["']([^"']+)/i) || tag.match(/src=["']([^"']+)/i) || [])[1]);
  }).filter(x => x && !/placeholder/i.test(x));
  if (!imgs.length) return '';
  return landscape ? (imgs.find(x => /w500|w780|w1280|landscape|original/i.test(x)) || imgs[1] || imgs[0]) : imgs[0];
}
function kvmItemFromBlock(block, type) {
  const id = ((block.match(/data-vod-id=["']([^"']+)/i) || block.match(/href=["']\/play\/([^"']+)/i) || [])[1] || '').trim();
  if (!id) return null;
  const title = kvmDecode((block.match(/<img\b[^>]*alt=["']([^"']+)/i) || block.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i) || [])[1]);
  if (!title) return null;
  const poster = kvmImageFrom(block, false); const backdrop = kvmImageFrom(block, true) || poster;
  const year = Number((kvmStrip(block).match(/(?:^|\s)((?:19|20)\d{2})(?:\s|$)/) || [])[1]) || undefined;
  const rating = Number((block.match(/text-(?:green|yellow)-\d+[^>]*>\s*([0-9]+(?:\.[0-9]+)?)/i) || [])[1]) || undefined;
  const overview = kvmDecode((block.match(/<p[^>]*line-clamp[^>]*>([\s\S]*?)<\/p>/i) || [])[1]);
  return { id, title, type: type || 'movie', poster, backdrop, year, rating, overview, imageHeaders: KVM_IMAGE_HEADERS, posterHeaders: KVM_IMAGE_HEADERS, backdropHeaders: KVM_IMAGE_HEADERS, aspectRatio: '2:3', action: { type: 'detail', itemId: id } };
}
function kvmBlocks(html) {
  const starts = [...html.matchAll(/<(?:div|article)\b[^>]*(?:data-vod-id=["'][^"']+|class=["'][^"']*movie-card[^"']*)[^>]*>/gi)];
  const out = [];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i].index; const end = i + 1 < starts.length ? starts[i + 1].index : Math.min(html.length, start + 14000);
    out.push(html.slice(start, Math.min(end, start + 14000)));
  }
  return out;
}
function kvmParseList(html, type) {
  const seen = {}; const items = [];
  for (const block of kvmBlocks(html)) { const item = kvmItemFromBlock(block, type); if (item && !seen[item.id]) { seen[item.id] = true; items.push(item); } }
  if (items.length) return items;
  for (const m of html.matchAll(/<a\b[^>]*href=["']\/play\/([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const item = kvmItemFromBlock('<div data-vod-id="' + m[1] + '">' + m[2] + '</div>', type); if (item && !seen[item.id]) { seen[item.id] = true; items.push(item); }
  }
  return items;
}
function kvmPlaylistMovie(item) {
  const movie = item && item.movie ? item.movie : item;
  if (!movie || !movie.title) return null;
  const playPath = kvmText(movie.play_url); const id = ((playPath.match(/\/play\/([^/?#]+)/i) || [])[1] || movie.id || '').toString();
  if (!id) return null;
  const poster = kvmAbsolute(movie.cover || movie.poster); const backdrop = kvmAbsolute(movie.poster || movie.cover) || poster;
  const isSeries = Number(movie.updated_episodes) > 1 || Number(movie.vod_total) > 1;
  return { id, title: kvmText(movie.title), type: isSeries ? 'series' : 'movie', poster, backdrop,
    year: Number(movie.year) || undefined, rating: Number(movie.rating) || undefined, overview: kvmStrip(movie.description),
    badges: Number(movie.isvip) ? ['VIP'] : [], imageHeaders: KVM_IMAGE_HEADERS, posterHeaders: KVM_IMAGE_HEADERS,
    backdropHeaders: KVM_IMAGE_HEADERS, aspectRatio: '2:3', action: { type: 'detail', itemId: id } };
}
function kvmParsePlaylistData(payload) {
  const data = payload && payload.data && typeof payload.data === 'object' ? payload.data : payload;
  if (!data || !Array.isArray(data.items)) throw new Error(kvmText(payload && payload.message) || '4K影视：片单数据格式异常');
  const seen = {}; const items = [];
  data.items.forEach(raw => { const item = kvmPlaylistMovie(raw); if (item && !seen[item.id]) { seen[item.id] = true; items.push(item); } });
  return { items, page: Number(data.page) || 1, total: Number(data.total) || items.length, totalPages: Number(data.total_pages) || 1, perPage: Number(data.per_page) || 24 };
}
const KVM_HOME_GROUPS = {
  'today-hot': { title: '今天热播', start: '今天热播', end: '榜单排行', type: 'movie', style: 'discover.spotlight' },
  'popularity-ranking': { title: '人气排行榜', start: '榜单排行', end: '最近更新', type: 'movie', style: 'discover.ranked', ranked: true },
  'recent-updates': { title: '最近更新', start: '最近更新', end: '人气排行榜', type: 'movie', style: 'discover.posterCompact' },
  'latest-releases': { title: '最新上架', start: '最新上架', end: '近期热播剧', type: 'movie', style: 'discover.posterCompact' },
  'hot-tv': { title: '近期热播剧', start: '近期热播剧', end: 'vip影片', type: 'series', style: 'discover.posterCompact' },
  'vip-movies': { title: 'VIP影片', start: 'vip影片', end: '推荐片单', type: 'movie', style: 'discover.spotlight' },
  'recommended-playlists': { title: '推荐片单', start: '推荐片单', end: '本季跟播新番', type: 'collection', style: 'discover.annualWidePreview', playlists: true },
  'seasonal-anime': { title: '本季跟播新番', start: '本季跟播新番', end: '即将上映', type: 'series', style: 'discover.posterCompact' }
};
const KVM_HOME_ORDER = ['today-hot', 'popularity-ranking', 'recent-updates', 'latest-releases', 'hot-tv', 'vip-movies', 'recommended-playlists', 'seasonal-anime'];
function kvmCategory(id) {
  const group = KVM_HOME_GROUPS[id];
  if (group) return [group.title, group.type];
  return ({ movie: ['电影', 'movie'], tv: ['电视剧', 'series'], anime: ['动漫', 'series'] })[id] || ['影视', 'movie'];
}
function kvmHomeSlice(html, id) {
  const group = KVM_HOME_GROUPS[id]; if (!group) return '';
  const start = html.indexOf(group.start); if (start < 0) return '';
  const end = html.indexOf(group.end, start + group.start.length);
  return html.slice(start, end > start ? end : Math.min(html.length, start + 300000));
}
function kvmParseRanking(html) {
  const items = [], seen = {};
  for (const m of html.matchAll(/<a\b[^>]*href=["']\/play\/([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const id = m[1]; if (seen[id]) continue; const block = m[2]; const text = kvmStrip(block);
    const rank = Number((text.match(/^\s*(\d{1,2})(?:\s|$)/) || [])[1]) || items.length + 1;
    const title = kvmDecode((block.match(/<img\b[^>]*alt=["']([^"']+)/i) || block.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i) || [])[1]) || text.replace(/^\d+\s*/, '').replace(/\s+(?:4k\s+)?\d(?:\.\d+)?\s*$/i, '');
    const poster = kvmImageFrom(block, false); const rating = Number((text.match(/(\d(?:\.\d+)?)\s*$/) || [])[1]) || undefined;
    if (!title) continue; seen[id] = true;
    items.push({ id, title, type: 'movie', poster, backdrop: kvmImageFrom(block, true) || poster, rating, rank, badges: /\b4k\b/i.test(text) ? ['4K'] : [], imageHeaders: KVM_IMAGE_HEADERS, posterHeaders: KVM_IMAGE_HEADERS, backdropHeaders: KVM_IMAGE_HEADERS, aspectRatio: '2:3', action: { type: 'detail', itemId: id } });
  }
  return items.sort((a, b) => a.rank - b.rank);
}
function kvmParsePlaylists(html) {
  const items = [], seen = {};
  for (const m of html.matchAll(/<a\b[^>]*href=["']\/playlist\/([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const id = m[1]; if (seen[id]) continue; const block = m[2];
    const title = kvmDecode((block.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i) || [])[1]) || kvmStrip(block).replace(/^\d+\s*部\s*/, '').split(/\s{2,}/)[0];
    const imageTags = [...block.matchAll(/<img\b[^>]*>/gi)]; const images = imageTags.map(tag => kvmAbsolute((tag[0].match(/(?:data-src|data-original)=["']([^"']+)/i) || tag[0].match(/src=["']([^"']+)/i) || [])[1])).filter(x => x && !/placeholder/i.test(x));
    if (!title || !images.length) continue; seen[id] = true;
    const previewItems = images.slice(0, 4).map((image, index) => ({ id: 'playlist-' + id + '-preview-' + index, title, type: 'movie', poster: image, backdrop: image, imageHeaders: KVM_IMAGE_HEADERS, aspectRatio: '2:3' }));
    items.push({ id: 'playlist:' + id, title, type: 'collection', poster: images[0], backdrop: images[0], imageHeaders: KVM_IMAGE_HEADERS, posterHeaders: KVM_IMAGE_HEADERS, backdropHeaders: KVM_IMAGE_HEADERS, previewItems, action: { type: 'category', pageId: 'playlist:' + id, title, itemAspectRatio: '2:3' } });
  }
  return items;
}
function kvmHomeGroupItems(html, id) {
  const group = KVM_HOME_GROUPS[id]; if (!group) return [];
  const slice = kvmHomeSlice(html, id); return group.ranked ? kvmParseRanking(slice) : group.playlists ? kvmParsePlaylists(slice) : kvmParseList(slice, group.type);
}

function getManifest() {
  return { id: '4kvm-dreamby', name: '4K影视', title: '4K影视', version: '1.10.0', author: 'Alan huang', logo: KVM_LOGO,
    capabilities: { search: true, aggregation: true, playbackHistory: true }, aggregation: { search: true, playbackHistory: true } };
}
const WidgetMetadata = getManifest();
async function getHome() {
  const html = await kvmHTTP(KVM_BASE + '/');
  const groups = {}; KVM_HOME_ORDER.forEach(id => { groups[id] = kvmHomeGroupItems(html, id); }); const hero = groups['today-hot'].slice(0, 8);
  return { pageType: 'home', id: '4kvm-home', title: '4K影视', heroAspectRatio: '16:9', hero,
    sections: KVM_HOME_ORDER.map(id => { const meta = KVM_HOME_GROUPS[id]; return { id, title: meta.title, style: meta.style, lazy: false, items: groups[id], moreAction: { type: 'category', pageId: id, title: meta.title, itemAspectRatio: '2:3' } }; }).filter(section => section.items.length) };
}
async function getHomeSection(input) {
  const id = kvmText(kvmPick(input, ['sectionId', 'id', 'pageId'], 'today-hot')); const c = kvmCategory(id); const group = KVM_HOME_GROUPS[id];
  try {
    const html = await kvmHTTP(KVM_BASE + (group ? '/' : '/' + id)); const items = group ? kvmHomeGroupItems(html, id) : kvmParseList(html, c[1]);
    return { id, title: c[0], style: group ? group.style : 'media.posterGrid', lazy: false, items, moreAction: { type: 'category', pageId: id, title: c[0] } };
  } catch (error) { return { id, title: c[0], style: group ? group.style : 'media.posterGrid', lazy: false, items: [], error: kvmText(error && error.message || error) }; }
}
async function getCategory(input) {
  const id = kvmText(kvmPick(input, ['pageId', 'id', 'categoryId'], 'movie')); const c = kvmCategory(id);
  if (id.indexOf('playlist:') === 0) {
    const playlistId = id.slice('playlist:'.length); const requestedPage = Math.max(1, Number(kvmPick(input, ['page', 'pg', 'currentPage', 'pageNumber', 'pageIndex'], 1)) || 1);
    const payload = await kvmJSON(KVM_BASE + '/api/playlists/detail?id=' + encodeURIComponent(playlistId) + '&page=' + requestedPage + '&per_page=24');
    if (Number(payload.code) && Number(payload.code) !== 200) throw new Error(kvmText(payload.message) || '4K影视：片单加载失败');
    const parsed = kvmParsePlaylistData(payload); const title = kvmText(kvmPick(input, ['title'], '')) || kvmText(payload.data && payload.data.playlist && payload.data.playlist.title) || '推荐片单';
    return { pageType: 'category', id, title, style: 'discover.posterCompact', itemAspectRatio: '2:3', items: parsed.items,
      page: parsed.page, hasMore: parsed.page < parsed.totalPages, nextPage: parsed.page < parsed.totalPages ? parsed.page + 1 : undefined,
      pagecount: parsed.totalPages, totalPages: parsed.totalPages, limit: parsed.perPage, total: parsed.total };
  }
  const group = KVM_HOME_GROUPS[id]; const html = await kvmHTTP(KVM_BASE + (group ? '/' : '/' + id)); const items = group ? kvmHomeGroupItems(html, id) : kvmParseList(html, c[1]);
  return { pageType: 'category', id, title: c[0], style: group ? group.style : 'discover.posterCompact', itemAspectRatio: '2:3', items, page: 1, hasMore: false, total: items.length };
}
function kvmEpisodes(html, defaultVersion, parentId) {
  const out = [], seen = {};
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    // The source's raw x-effect attribute contains an unescaped `=>`. A normal
    // `[^>]*` opening-tag regex therefore ends before the class attribute, so
    // inspect the complete anchor block while still requiring the source's
    // dedicated episode-link marker and data-episode value.
    const anchor = m[0];
    if (!/class=["'][^"']*\bepisode-link\b[^"']*["']/i.test(anchor)) continue;
    const id = ((anchor.match(/href=["']\/play\/([^"']+)["']/i) || [])[1] || '').trim();
    const n = Number((anchor.match(/data-episode=["'](\d+)["']/i) || [])[1]);
    if (!id || !n || seen[id]) continue;
    seen[id] = true; out.push({ id, type: 'episode', episodeId: id, number: n, episodeNumber: n, title: '第 ' + n + ' 集',
      action: { type: 'play', itemId: parentId || id, episodeId: id, versionId: defaultVersion || 'public-1080' } });
  }
  return out.sort((a, b) => a.number - b.number);
}
function kvmHasEpisodeSelector(html) {
  return /<h[1-4][^>]*>\s*选集\s*<\/h[1-4]>/i.test(html) || /更新至\s*\d+\s*\/\s*\d+\s*集/i.test(kvmStrip(html));
}
function kvmHas4K(html) {
  const text = kvmStrip(html);
  return /(?:^|\s)4k\s*(?:加入片单|评分|收藏)/i.test(text) || /(?:badge|tag)[^>]*>\s*4k\s*</i.test(html);
}
function kvmVersions(id) {
  return [{ id: 'public-1080', name: '1080P 超清', subtitle: '默认线路；解析时请稍候', default: true,
    action: { type: 'play', itemId: id, versionId: 'public-1080', qualityId: '1080' } }];
}
async function getDetail(input) {
  const id = kvmText(kvmPick(input, ['itemId', 'id', 'episodeId'], '')); if (!id) throw new Error('4K影视详情：缺少内容 ID');
  const html = await kvmHTTP(KVM_BASE + '/play/' + encodeURIComponent(id)); const episodes = kvmEpisodes(html, 'public-1080', id);
  const title = (kvmMeta(html, 'og:title') || kvmStrip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]) || id).replace(/\s*-\s*第\d+集.*$/, '');
  const poster = kvmMeta(html, 'og:image') || kvmAbsolute((html.match(/data-poster=["']([^"']+)/i) || [])[1]);
  const overview = kvmMeta(html, 'og:description') || kvmMeta(html, 'description');
  const keywords = kvmMeta(html, 'keywords');
  const year = Number((keywords.match(/(?:^|,)\s*((?:19|20)\d{2})(?:\s*,|$)/) || kvmStrip(html).match(/(?:^|\s)((?:19|20)\d{2})(?:\s|$)/) || [])[1]) || undefined;
  const rating = Number((kvmStrip(html).match(/\b([0-9]\.[0-9])\s*(?:评分|加入片单)/) || [])[1]) || undefined;
  const isSeries = kvmHasEpisodeSelector(html) || episodes.length > 1;
  const versions = kvmVersions(id);
  return { pageType: 'detail', id, title, type: isSeries ? 'series' : 'movie', poster, backdrop: kvmAbsolute((html.match(/data-poster=["']([^"']+)/i) || [])[1]) || poster,
    imageHeaders: KVM_IMAGE_HEADERS, posterHeaders: KVM_IMAGE_HEADERS, backdropHeaders: KVM_IMAGE_HEADERS, detailImageAspectRatio: '2:3', overview, year, rating,
    seasons: isSeries ? [{ id: 'season-1', type: 'season', number: 1, seasonNumber: 1, title: '选集', episodes }] : [], resourceGroups: [{ id: 'public', title: '在线播放', versions }], recommendations: [] };
}
async function getResourceVersions(input) {
  const id = kvmText(kvmPick(input, ['itemId', 'id', 'episodeId'], '')); if (!id) throw new Error('4K影视资源：缺少内容 ID');
  return [{ id: 'online', title: '在线播放', versions: kvmVersions(id) }];
}
function kvmMediaCandidates(result) {
  const found = [], seen = [];
  function walk(value) {
    if (typeof value === 'string') { for (const m of value.matchAll(/https?:\\?\/\\?\/[^\s"'<>]+(?:\.m3u8|\.mp4)(?:\?[^\s"'<>]*)?/gi)) { const u = m[0].replace(/\\\//g, '/').replace(/[),;\]}]+$/, ''); if (!found.includes(u) && !/static\/|placeholder/i.test(u)) found.push(u); } return; }
    if (!value || typeof value !== 'object' || seen.includes(value)) return; seen.push(value); if (Array.isArray(value)) return value.forEach(walk); Object.keys(value).forEach(k => walk(value[k]));
  }
  walk(result); try { walk(JSON.stringify(result)); } catch (_) {} return found;
}
function kvmQualityCandidates(result) {
  const out = [], seen = [];
  function add(entry) {
    if (!entry || typeof entry !== 'object') return;
    const url = kvmText(entry.url || entry.play_url || entry.playUrl);
    const title = kvmText(entry.title || entry.name || entry.description);
    if ((/\.m3u8|\.mp4/i.test(url) || url === '1') && (/4k|2160|1080|蓝光|超清/i.test(title) || entry.isvip !== undefined || entry.locked !== undefined)) out.push({ url, title, isvip: !!entry.isvip, locked: !!entry.locked || url === '1' });
  }
  function walk(value) {
    if (typeof value === 'string') { try { const parsed = JSON.parse(value); if (parsed && typeof parsed === 'object') walk(parsed); } catch (_) {} return; }
    if (!value || typeof value !== 'object' || seen.includes(value)) return; seen.push(value); if (Array.isArray(value)) return value.forEach(walk); add(value); Object.keys(value).forEach(k => walk(value[k]));
  }
  walk(result); return out;
}
async function resolvePlayback(input) {
  const id = kvmText(kvmPick(input, ['episodeId', 'itemId', 'id'], '')); if (!id) throw new Error('4K影视播放：缺少选集 ID');
  if (typeof Widget === 'undefined' || !Widget.browser || typeof Widget.browser.fetch !== 'function') throw new Error('4K影视播放：当前 Dreamby 版本不支持设备浏览器媒体捕获');
  const page = KVM_BASE + '/play/' + encodeURIComponent(id) + '?_dreamby=' + Date.now();
  let result;
  try {
    result = await Widget.browser.fetch(page, { visible: false, timeout: 15, timeoutSeconds: 15, waitAfterLoad: 2.5, waitForAny: true, captureRequests: true, headers: KVM_HEADERS });
  } catch (error) {
    throw new Error('4K影视播放：1080P 浏览器解析失败；stage=browser-fetch；reason=' + kvmText(error && error.message || error));
  }
  const qualities = kvmQualityCandidates(result); const media = kvmMediaCandidates(result);
  const playable = qualities.filter(q => !q.locked && /\.m3u8|\.mp4/i.test(q.url));
  const real1080 = playable.find(q => /1080|超清/i.test(q.title));
  const media1080 = media.find(url => /1080(?:p)?(?:[^0-9]|$)/i.test(url));
  const url = real1080 && real1080.url || media1080 || media[media.length - 1] || media[0];
  if (!url) { const keys = result && typeof result === 'object' ? Object.keys(result).join(',') : typeof result; throw new Error('4K影视播放：浏览器未返回最终媒体地址；stage=media-capture；page=' + page + '；resultKeys=' + keys + '；mediaCandidates=0；blobOnly=true'); }
  const hls = /\.m3u8(?:[?#]|$)/i.test(url);
  // This source's HLS playlist and its segments live on different CDNs. The
  // real web player sends neither Referer nor a forged CDN Origin; adding
  // those headers can make the segment CDN reject native playback with 403.
  return { url, container: hls ? 'm3u8' : 'mp4', headers: { 'User-Agent': KVM_UA, Accept: '*/*' }, startPositionSeconds: 0, isLive: false, streamKind: 'vod' };
}
async function search(input) {
  const query = kvmText(kvmPick(input, ['query', 'keyword', 'text', 'q'], '')).trim(); if (!query) return { pageType: 'search', id: 'search', title: '搜索', items: [], page: 1, hasMore: false };
  const items = kvmParseList(await kvmHTTP(KVM_BASE + '/search?q=' + encodeURIComponent(query)), 'movie');
  return { pageType: 'search', id: 'search:' + query, title: '搜索：' + query, query, keyword: query, itemAspectRatio: '2:3', items, page: 1, hasMore: false, total: items.length };
}
const KVM_EXPORTS = { WidgetMetadata, getManifest, getHome, getHomeSection, getCategory, getDetail, getResourceVersions, resolvePlayback, search };
if (typeof globalThis !== 'undefined') Object.keys(KVM_EXPORTS).forEach(k => { globalThis[k] = KVM_EXPORTS[k]; });
if (typeof module !== 'undefined' && module.exports) module.exports = KVM_EXPORTS;
