/**
 * ASMRLIB - Dreamby / baiPlay 自定义媒体库
 * Source: https://asmrlib.com/
 * @author Alan huang
 * @version 1.2.4
 */

const ASMRLIB_BASE = 'https://asmrlib.com';
const ASMRLIB_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const ASMRLIB_LOGO = ASMRLIB_BASE + '/favicon.ico';
const ASMRLIB_CATEGORIES = [
  { id: 'latest', title: '最新更新', path: '/' },
  { id: 'ASMR', title: 'ASMR', path: '/tags/ASMR' },
  { id: 'Record', title: 'Record', path: '/tags/Record' },
  { id: 'R18', title: 'R18', path: '/tags/R18' },
  { id: 'yoonying', title: 'Yoonying', path: '/tags/yoonying' },
  { id: 'SOLY', title: 'SOLY', path: '/tags/SOLY' },
  { id: 'Puffin', title: 'Puffin', path: '/tags/Puffin' },
  { id: 'Maimy', title: 'Maimy', path: '/tags/Maimy' }
];

function asmrCtx(input) {
  if (typeof input === 'string') {
    try { input = JSON.parse(input); } catch (_) { return {}; }
  }
  return input && typeof input === 'object' ? input : {};
}

function asmrPick(input, names, fallback) {
  const ctx = asmrCtx(input);
  const roots = [ctx, ctx.params, ctx.config, ctx.settings, ctx.parameters, ctx.pagination, ctx.pageInfo];
  for (let r = 0; r < roots.length; r += 1) {
    const root = roots[r];
    if (!root) continue;
    for (let i = 0; i < names.length; i += 1) {
      const value = root[names[i]];
      if (value !== undefined && value !== null && String(value).trim() !== '') return value;
    }
  }
  return fallback;
}

function asmrText(value) { return value === undefined || value === null ? '' : String(value).trim(); }
function asmrPage(value) {
  const page = parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}
function asmrDecode(value) {
  return asmrText(value)
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); })
    .replace(/&#x([0-9a-f]+);/gi, function (_, n) { return String.fromCharCode(parseInt(n, 16)); });
}
function asmrStrip(value) {
  return asmrDecode(asmrText(value).replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
}
function asmrAttr(tag, name) {
  const match = asmrText(tag).match(new RegExp("\\b" + name + "\\s*=\\s*(['\"])([\\s\\S]*?)\\1", 'i'));
  return match ? asmrDecode(match[2]) : '';
}
function asmrAbsolute(value) {
  value = asmrDecode(value);
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (/^\/\//.test(value)) return 'https:' + value;
  return ASMRLIB_BASE + (value.charAt(0) === '/' ? '' : '/') + value;
}
function asmrHeaders(referer) {
  return {
    Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.7',
    Referer: referer || ASMRLIB_BASE + '/',
    'User-Agent': ASMRLIB_UA
  };
}
function asmrImageHeaders() { return { Referer: ASMRLIB_BASE + '/', 'User-Agent': ASMRLIB_UA }; }

function asmrResponseText(response) {
  if (response === undefined || response === null) return '';
  if (typeof response === 'string') return response;
  if (typeof response.text === 'string') return response.text;
  if (typeof response.data === 'string') return response.data;
  if (typeof response.body === 'string') return response.body;
  if (typeof response.html === 'string') return response.html;
  if (response.data && typeof response.data.html === 'string') return response.data.html;
  if (response.body && typeof response.body.html === 'string') return response.body.html;
  return '';
}

async function asmrHTTP(url, referer, seconds) {
  const headers = asmrHeaders(referer);
  const timeout = seconds || 30;
  let response;
  if (typeof Widget !== 'undefined' && Widget.http) {
    if (typeof Widget.http.get === 'function') response = await Widget.http.get(url, { headers: headers, timeout: timeout });
    else if (typeof Widget.http.request === 'function') response = await Widget.http.request({ url: url, method: 'GET', headers: headers, timeout: timeout });
  }
  if (response === undefined && typeof $http !== 'undefined' && $http) {
    if (typeof $http.get === 'function') response = await $http.get(url, { headers: headers, timeout: timeout });
    else if (typeof $http.request === 'function') response = await $http.request({ url: url, method: 'GET', headers: headers, timeout: timeout });
  }
  if (response === undefined && typeof fetch === 'function') {
    const nativeResponse = await fetch(url, { headers: headers });
    response = { status: nativeResponse.status, data: await nativeResponse.text() };
  }
  const body = asmrResponseText(response);
  if (!body) throw new Error('ASMRLIB 请求失败：' + url);
  if (/Just a moment|cf-mitigated|Cloudflare Ray ID/i.test(body)) throw new Error('ASMRLIB 返回了浏览器验证页');
  return body;
}

function asmrId(raw) {
  const value = asmrText(raw);
  const match = value.match(/(?:asmrlib(?:-page)?:\/\/post\/|\/posts\/)([a-f0-9]{32})/i);
  return match ? match[1] : (/^[a-f0-9]{32}$/i.test(value) ? value : '');
}
function asmrPayload(id) { return 'asmrlib://post/' + asmrId(id); }

function asmrCard(data, rank) {
  const payload = asmrPayload(data.id);
  return {
    id: payload,
    title: data.title || 'ASMRLIB 视频',
    subtitle: [data.date, data.tags && data.tags.join(' · ')].filter(Boolean).join(' · '),
    type: 'movie',
    poster: data.poster,
    backdrop: data.poster,
    overview: data.title || '',
    year: data.date ? parseInt(data.date.slice(0, 4), 10) : undefined,
    rank: rank || undefined,
    badges: (data.tags || []).slice(0, 3),
    remarks: data.date || '',
    aspectRatio: '16:9',
    imageFit: 'fill',
    imageHeaders: asmrImageHeaders(),
    action: { type: 'detail', itemId: payload }
  };
}

function asmrParseList(html) {
  const starts = [];
  const re = /<a\b[^>]*href=(["'])([^"']*\/posts\/([a-f0-9]{32}))\1[^>]*>/gi;
  let match;
  while ((match = re.exec(html))) {
    if (!starts.some(function (item) { return item.id === match[3]; })) starts.push({ index: match.index, id: match[3] });
  }
  const items = [];
  for (let i = 0; i < starts.length; i += 1) {
    const block = html.slice(starts[i].index, starts[i + 1] ? starts[i + 1].index : Math.min(html.length, starts[i].index + 5000));
    const imageTag = (block.match(/<img\b[^>]*>/i) || [])[0] || '';
    const heading = (block.match(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/i) || [])[1] || '';
    const title = asmrStrip(heading) || asmrAttr(imageTag, 'alt');
    const date = asmrAttr((block.match(/<time\b[^>]*>/i) || [])[0], 'datetime');
    const tags = [];
    const tagRe = /<a\b[^>]*href=(["'])[^"']*\/tags\/[^"']*\1[^>]*>([\s\S]*?)<\/a>/gi;
    let tag;
    while ((tag = tagRe.exec(block)) && tags.length < 6) {
      const value = asmrStrip(tag[2]);
      if (value && tags.indexOf(value) < 0) tags.push(value);
    }
    if (title && asmrAttr(imageTag, 'src')) {
      items.push(asmrCard({ id: starts[i].id, title: title, date: date, tags: tags, poster: asmrAbsolute(asmrAttr(imageTag, 'src')) }, items.length + 1));
    }
  }
  return items;
}

function asmrHasNext(html, page) {
  return new RegExp("(?:page=" + (page + 1) + "[^\"']*[\"']|aria-label=[\"']Next)", 'i').test(html);
}
function asmrTotalPages(html, fallback) {
  let max = fallback || 1;
  const re = /[?&]page=(\d+)/g;
  let match;
  while ((match = re.exec(html))) max = Math.max(max, parseInt(match[1], 10) || 1);
  return max;
}
function asmrCategoryMeta(id) {
  const value = asmrText(id) || 'latest';
  const known = ASMRLIB_CATEGORIES.find(function (item) { return item.id.toLowerCase() === value.toLowerCase(); });
  if (known) return known;
  return { id: value, title: value, path: '/tags/' + encodeURIComponent(value) };
}
function asmrPaged(path, page) {
  return ASMRLIB_BASE + path + (path.indexOf('?') >= 0 ? '&' : '?') + 'page=' + page;
}

function getManifest() {
  return {
    id: 'asmrlib',
    name: 'ASMRLIB',
    title: 'ASMRLIB',
    version: '1.2.4',
    author: 'Alan huang',
    logo: ASMRLIB_LOGO,
    icon: ASMRLIB_LOGO,
    capabilities: { search: true, aggregation: true, playbackHistory: true },
    aggregation: { search: true, playbackHistory: true },
    parameters: [
      { name: 'browserVisible', title: '允许显示播放验证页', type: 'boolean', value: true }
    ]
  };
}

async function getHome() {
  const html = await asmrHTTP(ASMRLIB_BASE + '/', ASMRLIB_BASE + '/');
  const latest = asmrParseList(html);
  const categoryItems = ASMRLIB_CATEGORIES.slice(1).map(function (category, index) {
    return {
      id: 'asmrlib-category-' + category.id,
      title: category.title,
      subtitle: '浏览 ' + category.title + ' 标签',
      type: 'collection',
      poster: latest[index % Math.max(latest.length, 1)] ? latest[index % latest.length].poster : ASMRLIB_LOGO,
      backdrop: latest[index % Math.max(latest.length, 1)] ? latest[index % latest.length].poster : ASMRLIB_LOGO,
      imageHeaders: asmrImageHeaders(),
      previewItems: latest.slice(index, index + 3),
      action: { type: 'category', pageId: category.id, title: category.title }
    };
  });
  return {
    pageType: 'home',
    id: 'asmrlib-home',
    title: 'ASMRLIB',
    heroAspectRatio: '16:9',
    hero: latest.slice(0, 6),
    sections: [
      { id: 'latest', title: '最新更新', style: 'discover.standard', lazy: false, items: latest, moreAction: { type: 'category', pageId: 'latest', title: '最新更新' } },
      { id: 'categories', title: '热门标签', style: 'discover.annualListPreview', lazy: false, items: categoryItems }
    ]
  };
}

async function getHomeSection(input) {
  const id = asmrText(asmrPick(input, ['sectionId', 'id'], 'latest'));
  if (id === 'categories') {
    const home = await getHome();
    return home.sections[1];
  }
  const page = await getCategory({ pageId: id, page: 1 });
  return { id: id, title: page.title, style: 'discover.standard', lazy: false, items: page.items || [] };
}

async function getCategory(input) {
  const page = asmrPage(asmrPick(input, ['page', 'pg', 'currentPage', 'pageNumber', 'pageIndex'], 1));
  const meta = asmrCategoryMeta(asmrPick(input, ['pageId', 'categoryId', 'id', 'tag'], 'latest'));
  const html = await asmrHTTP(asmrPaged(meta.path, page), ASMRLIB_BASE + '/');
  const items = asmrParseList(html);
  const totalPages = asmrTotalPages(html, page);
  return {
    pageType: 'category', id: meta.id, title: meta.title, style: 'media.posterGrid',
    itemAspectRatio: '16:9', items: items, page: page, nextPage: page + 1,
    totalPages: totalPages, pagecount: totalPages, hasMore: asmrHasNext(html, page)
  };
}

function asmrDetailData(html, id) {
  const title = asmrStrip((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]);
  const date = asmrAttr((html.match(/<time\b[^>]*>/i) || [])[0], 'datetime');
  const jsonPoster = (html.match(/"thumbnailUrl"\s*:\s*"([^"]+)"/i) || [])[1];
  const playerBlock = (html.match(/<div id="players"[\s\S]*?<div id="downloads"/i) || [])[0] || html;
  const versions = [];
  const buttonRe = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let button;
  while ((button = buttonRe.exec(playerBlock))) {
    const url = asmrAttr(button[0], 'data-url');
    if (!url) continue;
    const name = asmrStrip(button[2]) || asmrAttr(button[0], 'data-server') || '线路';
    if (!versions.some(function (item) { return item.playerUrl === url; })) versions.push({ name: name, playerUrl: url });
  }
  if (!versions.length) {
    const direct = (playerBlock.match(/loadPlayer\([^,]+,\s*["']([^"']+)["']/i) || [])[1];
    if (direct) versions.push({ name: '默认线路', playerUrl: direct });
  }
  const tags = [];
  const tagScope = (html.match(/<div class="my-1 pl-3 text-sm text-gray-500">([\s\S]*?)<div>\s*<header[^>]*>Related/i) || [])[1] || '';
  const tagRe = /href=(["'])[^"']*\/tags\/[^"']*\1[^>]*>([\s\S]*?)<\/a>/gi;
  let tag;
  while ((tag = tagRe.exec(tagScope))) {
    const value = asmrStrip(tag[2]);
    if (value && tags.indexOf(value) < 0) tags.push(value);
  }
  versions.sort(function (a, b) {
    const score = function (item) {
      if (/v\.upn\.one/i.test(item.playerUrl)) return 0;
      if (/bysetayico\.com/i.test(item.playerUrl)) return 1;
      return 2;
    };
    return score(a) - score(b);
  });
  return { id: id, title: title || 'ASMRLIB 视频', date: date, poster: asmrAbsolute(jsonPoster), tags: tags, versions: versions };
}

function asmrResourceGroups(detail) {
  // BI requires a user gesture; AB must retain the original iframe parent.
  // The page owns line selection; don't promise independently resolved lines.
  if (detail.versions.length && detail.versions.every(function (version) {
    return /https?:\/\/(?:bysetayico\.com|abyssplayer\.com)\//i.test(version.playerUrl);
  })) {
    const pageId = 'asmrlib-page://post/' + detail.id;
    return [{ id: 'online', title: '在线播放', versions: [{
      id: pageId, name: '验证后捕获播放源', default: true,
      subtitle: '必要时手动点击播放；捕获成功后返回播放器',
      action: { type: 'play', itemId: asmrPayload(detail.id), versionId: pageId, title: detail.title }
    }] }];
  }
  return [{
    id: 'online',
    title: '在线播放',
    versions: detail.versions.map(function (version, index) {
      const versionId = 'asmrlib-line://' + encodeURIComponent(version.name) + '/' + encodeURIComponent(version.playerUrl);
      return {
        id: versionId, name: version.name + ' 线路',
        subtitle: '播放时实时解析；失败不会缓存',
        default: index === 0,
        action: { type: 'play', itemId: asmrPayload(detail.id), versionId: versionId, title: detail.title }
      };
    })
  }];
}

async function getDetail(input) {
  const id = asmrId(asmrPick(input, ['itemId', 'id'], ''));
  if (!id) throw new Error('缺少 ASMRLIB 内容 ID');
  const url = ASMRLIB_BASE + '/posts/' + id;
  const html = await asmrHTTP(url, ASMRLIB_BASE + '/');
  const detail = asmrDetailData(html, id);
  const related = asmrParseList(html).filter(function (item) { return asmrId(item.id) !== id; });
  return {
    id: asmrPayload(id), title: detail.title, type: 'movie',
    poster: detail.poster, backdrop: detail.poster, detailImageAspectRatio: '16:9',
    imageHeaders: asmrImageHeaders(), posterHeaders: asmrImageHeaders(), backdropHeaders: asmrImageHeaders(),
    year: detail.date ? parseInt(detail.date.slice(0, 4), 10) : undefined,
    genres: detail.tags, overview: [detail.date, detail.tags.join(' · ')].filter(Boolean).join('\n'),
    resourceGroups: asmrResourceGroups(detail),
    recommendations: [{ id: 'related', title: '相关推荐', style: 'discover.standard', items: related.slice(0, 12) }]
  };
}

async function getResourceVersions(input) {
  const detail = await getDetail(input);
  return detail.resourceGroups;
}

function asmrPlayable(value) {
  return /^https?:\/\//i.test(asmrText(value)) && /\.(?:m3u8|mp4|mpd|m4v|mov|webm)(?:[?#]|$)/i.test(asmrText(value));
}
function asmrBrowserMedia(result) {
  return asmrCapturedMedia(result).url;
}
function asmrMediaHeaders(headers) {
  const output = {};
  const names = { referer: 'Referer', origin: 'Origin', 'user-agent': 'User-Agent', cookie: 'Cookie', authorization: 'Authorization' };
  Object.keys(headers || {}).forEach(function (key) {
    if (names[key.toLowerCase()] && typeof headers[key] === 'string') output[names[key.toLowerCase()]] = headers[key];
  });
  return output;
}
function asmrCapturedMedia(result) {
  const candidates = [];
  const seen = [];
  const add = function (url, headers) {
    if (asmrPlayable(url) && !/\/(?:ads?|advert|preview|trailer)(?:[\/_.-]|$)/i.test(url)) {
      candidates.push({ url: asmrDecode(url), headers: asmrMediaHeaders(headers) });
    }
  };
  const visit = function (value, depth, inheritedHeaders) {
    if (!value || depth > 5 || seen.length > 250) return;
    if (typeof value === 'string') {
      add(value, inheritedHeaders);
      if (/^\s*[\[{]/.test(value)) {
        try { visit(JSON.parse(value), depth + 1, inheritedHeaders); } catch (_) {}
      }
      return;
    }
    if (typeof value !== 'object' || seen.indexOf(value) >= 0) return;
    seen.push(value);
    if (Array.isArray(value)) {
      value.slice(0, 100).forEach(function (entry) { visit(entry, depth + 1, inheritedHeaders); });
      return;
    }
    const headers = value.requestHeaders || value.mediaHeaders || inheritedHeaders || {};
    const keys = ['url', 'mediaURL', 'mediaUrl', 'videoURL', 'videoUrl', 'playURL', 'playUrl', 'src', 'responseURL'];
    keys.forEach(function (key) { add(value[key], headers); });
    // Request records may use `headers`; response headers must not become native request headers.
    if (value.headers && !value.status && !value.statusCode && !value.responseHeaders) {
      keys.forEach(function (key) { add(value[key], value.headers); });
    }
    ['mediaSources', 'mediaRequests', 'capturedRequests', 'requests', 'responses', 'urls', 'data', 'body', 'result', 'frames', 'frameResults'].forEach(function (key) {
      visit(value[key], depth + 1, headers);
    });
  };
  visit(result, 0, null);
  candidates.sort(function (a, b) {
    const score = function (entry) { return (/\.m3u8(?:[?#]|$)/i.test(entry.url) ? 10 : 0) + Object.keys(entry.headers).length; };
    return score(b) - score(a);
  });
  // Do not scrape URLs from arbitrary page HTML: those may be ads or stale configs.
  return candidates[0] || { url: '', headers: {} };
}
function asmrVersionPlayerURL(input) {
  const versionId = asmrText(asmrPick(input, ['versionId', 'resourceId', 'lineId'], ''));
  const page = versionId.match(/^asmrlib-page:\/\/post\/([a-f0-9]{32})$/i);
  if (page) return ASMRLIB_BASE + '/posts/' + page[1];
  const match = versionId.match(/^asmrlib-line:\/\/[^/]+\/([\s\S]+)$/);
  if (match) {
    try { return decodeURIComponent(match[1]); } catch (_) { return match[1]; }
  }
  const url = asmrText(asmrPick(input, ['playerUrl', 'url', 'path', 'playUrl', 'videoUrl'], ''));
  return /^https?:\/\//i.test(url) ? url : '';
}

function asmrUPCode(playerUrl) {
  const match = asmrText(playerUrl).match(/^https?:\/\/v\.upn\.one\/#([a-z0-9]+)$/i);
  return match ? match[1] : '';
}

function asmrDecryptUP(cipherHex) {
  if (typeof $crypto === 'undefined' || !$crypto || typeof $crypto.aesDecrypt !== 'function') {
    throw new Error('当前 Dreamby 版本缺少 AES 解密能力');
  }
  const plain = $crypto.aesDecrypt(asmrText(cipherHex), 'kiemtienmua911ca', {
    iv: '1234567890oiuytr',
    mode: 'CBC',
    inputEncoding: 'hex',
    keyEncoding: 'utf8',
    outputEncoding: 'utf8',
    padding: 'pkcs7'
  });
  const text = asmrText(plain).replace(/\0+$/g, '');
  if (!text || text.charAt(0) !== '{') throw new Error('UP 播放 API 解密失败');
  try { return JSON.parse(text); } catch (_) { throw new Error('UP 播放 API返回格式异常'); }
}

async function asmrResolveUP(playerUrl) {
  const code = asmrUPCode(playerUrl);
  if (!code) return '';
  const api = 'https://v.upn.one/api/v1/video?id=' + encodeURIComponent(code) +
    '&w=390&h=844&r=' + encodeURIComponent(ASMRLIB_BASE);
  const encrypted = await asmrHTTP(api, ASMRLIB_BASE + '/', 4);
  const data = asmrDecryptUP(encrypted);
  const candidates = [data.source, data.cfNative];
  if (data.hlsVideoTiktok && data.streamingConfig) {
    try {
      const config = typeof data.streamingConfig === 'string' ? JSON.parse(data.streamingConfig) : data.streamingConfig;
      const tiktok = config && config.adjust && config.adjust.Tiktok;
      if (tiktok && tiktok.domain) {
        let path = asmrText(data.hlsVideoTiktok).replace(/^\/hls\//, '/');
        let tiktokURL = 'https://v.upn.one/hlsmod/' + tiktok.domain + path;
        const params = tiktok.params || {};
        const keys = Object.keys(params);
        if (keys.length) {
          tiktokURL += '?' + keys.map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
          }).join('&');
        }
        candidates.push(tiktokURL);
      }
    } catch (_) {}
  }
  for (let i = 0; i < candidates.length; i += 1) {
    if (asmrPlayable(candidates[i])) return candidates[i];
  }
  throw new Error('UP 播放 API没有返回可播放地址');
}

async function resolvePlayback(input) {
  const deadline = Date.now() + 28000;
  const direct = asmrText(asmrPick(input, ['url', 'path', 'playUrl', 'videoUrl'], ''));
  if (asmrPlayable(direct)) return asmrPlaybackResult(direct, asmrMediaHeaders(asmrPick(input, ['headers'], {})));
  let playerUrl = asmrVersionPlayerURL(input);
  const itemId = asmrId(asmrPick(input, ['itemId', 'id'], '')) ||
    asmrId(asmrPick(input, ['versionId'], '')) || asmrId(playerUrl);
  if (!itemId && !playerUrl) throw new Error('缺少 ASMRLIB 内容 ID；请重新打开影片详情');
  if (asmrUPCode(playerUrl)) {
    try {
      const media = await asmrBounded('up-api', 4, function () { return asmrResolveUP(playerUrl); });
      if (media) return asmrPlaybackResult(media, { Referer: playerUrl, 'User-Agent': ASMRLIB_UA });
    } catch (error) {
      if (!itemId) throw new Error('旧 UP 线路已无法解析；stage=up-api；请重新打开影片详情');
    }
  }
  if (typeof Widget === 'undefined' || !Widget.browser || typeof Widget.browser.fetch !== 'function') {
    throw new Error('当前 Dreamby 未提供设备浏览器；stage=browser-unavailable');
  }
  const requiresParent = /https?:\/\/(?:bysetayico\.com|abyssplayer\.com)\//i.test(playerUrl);
  if (requiresParent && !itemId) throw new Error('当前线路必须在原详情页内打开；请重新进入影片详情；stage=missing-parent');
  // Both current providers need the original iframe. Cached BI/AB IDs remain usable.
  const pageURL = itemId ? ASMRLIB_BASE + '/posts/' + itemId : playerUrl;
  const allowVisible = !/^(?:false|0|no|off)$/i.test(String(asmrPick(input, ['browserVisible'], true)));
  // These players need a real user gesture. A hidden load may hang before
  // verification opens, so use exactly one visible capture by default.
  const attempts = [allowVisible];
  let diagnosis = 'no-media';
  let keys = '';
  for (let i = 0; i < attempts.length; i += 1) {
    const seconds = Math.min(attempts[i] ? 18 : 8, (deadline - Date.now()) / 1000);
    if (seconds < 1) break;
    let result;
    try {
      result = await asmrBounded(attempts[i] ? 'visible-capture' : 'hidden-capture', seconds, function () {
        const options = {
          visible: attempts[i], timeout: seconds, waitAfterLoad: 1,
          headers: asmrHeaders(ASMRLIB_BASE + '/')
        };
        // Explicit hidden opt-out does not wait for an impossible human gesture.
        if (attempts[i]) options.waitForMediaSource = true;
        return Widget.browser.fetch(pageURL, options);
      });
    } catch (error) {
      // A timed-out native browser may still be open; never stack another session.
      throw error;
    }
    const media = asmrCapturedMedia(result);
    if (media.url) return asmrPlaybackResult(media.url, media.headers);
    keys = result && typeof result === 'object' ? Object.keys(result).slice(0, 12).join(',') : typeof result;
    let text = asmrResponseText(result);
    try { text += JSON.stringify(result || {}); } catch (_) {}
    diagnosis = /blob:/i.test(text) ? 'blob-only' :
      (/验证你是真人|verify.{0,30}human|captcha|turnstile/i.test(text) ? 'verification-required' : 'iframe-media-missing');
  }
  const reason = diagnosis === 'blob-only' ? '网页只回传了 blob，无法交给原生播放器' :
    (diagnosis === 'verification-required' ? '播放器仍要求手动验证' : '设备浏览器未回传 iframe 的最终媒体地址');
  throw new Error('ASMRLIB：' + reason + '；stage=' + diagnosis + '；keys=' + keys +
    (allowVisible ? '；如果网页已播放，说明当前宿主未暴露可用播放源；失败不会缓存' : '；可启用“允许显示播放验证页”后手动播放'));
}

async function asmrBounded(stage, seconds, operation) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise(function (_, reject) {
        timer = setTimeout(function () { reject(new Error('ASMRLIB 解析超时；stage=' + stage + '；请先关闭验证页再重试')); }, seconds * 1000);
      })
    ]);
  } catch (error) {
    if (/^ASMRLIB 解析超时/.test(String(error && error.message))) throw error;
    // Avoid exposing cookies or signed URLs in native errors.
    throw new Error('ASMRLIB 浏览器或请求执行失败；stage=' + stage + '；请检查网络和 Dreamby 浏览器组件');
  } finally { clearTimeout(timer); }
}

function asmrPlaybackResult(url, capturedHeaders) {
  const container = /\.m3u8(?:[?#]|$)/i.test(url) ? 'm3u8' : (/\.mpd(?:[?#]|$)/i.test(url) ? 'mpd' : 'mp4');
  return {
    url: url, container: container,
    headers: asmrMediaHeaders(capturedHeaders),
    startPositionSeconds: 0, isLive: false, streamKind: container === 'm3u8' ? 'hls' : 'file'
  };
}

async function search(input) {
  const query = asmrText(asmrPick(input, ['query', 'keyword', 'text', 'kw'], ''));
  const page = asmrPage(asmrPick(input, ['page', 'pg', 'currentPage', 'pageNumber', 'pageIndex'], 1));
  if (!query) return { pageType: 'search', title: '搜索结果', items: [], page: page, hasMore: false };
  const path = '/search/' + encodeURIComponent(query);
  const html = await asmrHTTP(asmrPaged(path, page), ASMRLIB_BASE + '/');
  const items = asmrParseList(html);
  const totalPages = asmrTotalPages(html, page);
  return {
    pageType: 'search', id: 'search-' + query, title: '搜索：' + query,
    itemAspectRatio: '16:9', items: items, page: page, nextPage: page + 1,
    totalPages: totalPages, pagecount: totalPages, hasMore: asmrHasNext(html, page)
  };
}

function onSearch(input) { return search(input); }

const ASMRLIB_EXPORTS = {
  getManifest: getManifest, getHome: getHome, getHomeSection: getHomeSection,
  getCategory: getCategory, getDetail: getDetail, getResourceVersions: getResourceVersions,
  resolvePlayback: resolvePlayback, search: search, onSearch: onSearch
};
if (typeof globalThis !== 'undefined') Object.keys(ASMRLIB_EXPORTS).forEach(function (key) { globalThis[key] = ASMRLIB_EXPORTS[key]; });
if (typeof module !== 'undefined' && module.exports) module.exports = ASMRLIB_EXPORTS;
