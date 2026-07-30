// @name 欧乐影院 Mini Library

const BASE = 'https://www.olevod.com';
const API = 'https://api.olelive.com';
const IMAGE = 'https://static.olelive.com';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const CATEGORIES = [
  { id: 1, title: '电影', type: 'movie' },
  { id: 14, title: '短剧', type: 'series' },
  { id: 2, title: '连续剧', type: 'series' },
  { id: 3, title: '综艺', type: 'series' },
  { id: 4, title: '动漫', type: 'series' },
  { id: 6, title: 'VIP蓝光影院', type: 'movie' }
];

// 首屏使用站点真实条目的稳定快照，避免 Dreamby 启动阶段等待网络后把首页覆盖为空。
// 所有实时内容仍通过后续懒加载 section 和分类页获取。
const HOME_BOOTSTRAP = [
  { id: 83129, typeId1: 1, name: '恶魔之口', pic: 'upload/vod/20260729-1/87b18fe768ee2ccf3c22db304cba5b84.jpg', actor: '凯瑟琳·纽顿', area: '美国', year: '2026', score: 7.2, remarks: '超清' },
  { id: 83086, typeId1: 1, name: '超级少女', pic: 'upload/vod/20260727-1/c18b74825978f63bac2f286e7a12662d.jpg', actor: '米莉·阿尔柯克', area: '美国', year: '2026', score: 6.0, remarks: '超清' },
  { id: 83079, typeId1: 1, name: '今晚正好', pic: 'upload/vod/20260726-1/62bbbbf1ca1dd71b21d40b189412f565.jpg', actor: '马思纯 / 陈昊森', area: '大陆', year: '2026', score: 8.3, remarks: '超清' },
  { id: 83052, typeId1: 1, name: '安昂传奇：最后的气宗', pic: 'upload/vod/20260725-1/bbd2dbe0208cd9beb7a248af914f6616.jpg', actor: '南允道 / 全迪翁', area: '美国', year: '2026', score: 7.6, remarks: '超清' },
  { id: 83016, typeId1: 1, name: '寒战1994', pic: 'upload/vod/20260724-1/9a93034b8837348a8a743e3d3842a114.jpg', actor: '吴彦祖 / 刘俊谦', area: '香港', year: '2026', score: 7.4, remarks: '超清' },
  { id: 83019, typeId1: 1, name: '终极调查', pic: 'upload/vod/20260724-1/c57f12c86a50562b22c960a4baed39eb.jpg', actor: '裴晟祐 / 郑家蓝', area: '韩国', year: '2026', score: 8.0, remarks: '超清' }
];

const CATEGORY_BOOTSTRAP = {
  1: HOME_BOOTSTRAP,
  14: [
    { id: 83178, typeId1: 14, name: '穿成黑月光，当然是要HE', pic: 'upload/vod/20260730-1/4c96079ac9b170dd3eae4ddb0ad2f7a0.jpg', area: '大陆', year: '2026', score: 8, remarks: '高清' },
    { id: 83177, typeId1: 14, name: '洪荒心域，共拓人道前路第二季', pic: 'upload/vod/20260730-1/4b22b2e42504011026c645ed5088ce3c.jpg', area: '大陆', year: '2026', score: 8, remarks: '高清' },
    { id: 83176, typeId1: 14, name: '古穿未：我靠修仙在星际暴富', pic: 'upload/vod/20260730-1/23f46d5b1038942e85b7e7679a13092e.jpg', area: '大陆', year: '2026', score: 8, remarks: '高清' },
    { id: 83175, typeId1: 14, name: '高冷总裁在线追星', pic: 'upload/vod/20260730-1/18ff4b505578f4e3aa083ff6ec76fd19.jpg', area: '大陆', year: '2026', score: 8, remarks: '高清' }
  ],
  2: [
    { id: 82897, typeId1: 2, name: '江海潮生', pic: 'upload/vod/20260720-1/8adc9fd2f20c63de4d7e0e8f0e2052a4.jpg_384x560.jpg', actor: '何冰/杨立新', area: '大陆', year: '2026', score: 7.4, remarks: '更新至第15集' },
    { id: 82733, typeId1: 2, name: '非份之罪【粤语】', pic: 'upload/vod/20260629-1/89cb6a337f8e58b665954d15c70a98a3.jpg_384x560.jpg', actor: '吴启华/朱敏瀚', area: '香港', year: '2026', score: 8.1, remarks: '更新至第24集' },
    { id: 82732, typeId1: 2, name: '非份之罪【国语】', pic: 'upload/vod/20260629-1/1f018eda1e801f0e1b82ded0997839c8.jpg_384x560.jpg', actor: '吴启华/朱敏瀚', area: '香港', year: '2026', score: 8, remarks: '更新至第24集' },
    { id: 82987, typeId1: 2, name: '兵自风中来', pic: 'upload/vod/20260723-1/79b51b47d3a25700c23fd4b62b82e958.jpg_384x560.jpg', actor: '欧豪/蓝盈莹', area: '大陆', year: '2026', score: 8, remarks: '更新至第18集' }
  ],
  3: [
    { id: 76220, typeId1: 3, name: '圆桌派 第八季', pic: 'upload/vod/20250916-1/dbdbd3af7a77401e9a9281ee886d333e.jpg_384x560.jpg', actor: '窦文涛/陈鲁豫', area: '大陆', year: '2025', score: 9, remarks: '更新至圆桌晚晴派下' },
    { id: 83122, typeId1: 3, name: '一饭封神2', pic: 'upload/vod/20260729-1/26b6ab3a3dfc9bf3eb5a2cfc0601e03e.jpg_384x560.jpg', actor: '谢霆锋/张勇', area: '大陆', year: '2026', score: 8.1, remarks: '更新至第20260730期下' },
    { id: 81780, typeId1: 3, name: '五十公里桃花坞6', pic: 'upload/vod/20260507-1/3c76ad1a6dfcdca6d8e6806141ed3c99.jpg_384x560.jpg', actor: '周涛/袁咏仪', area: '大陆', year: '2026', score: 7.9, remarks: '更新至夏日清凉特辑0730期' },
    { id: 82696, typeId1: 3, name: '脱口秀和Ta的朋友们 第三季', pic: 'upload/vod/20260625-1/597abd31a97fabf02869c479038fdcb8.jpg_384x560.jpg', actor: '陈鲁豫/大张伟/周深', area: '大陆', year: '2026', score: 5.7, remarks: '更新至第2期离场之后' }
  ],
  4: [
    { id: 26435, typeId1: 4, name: '完美世界', pic: 'upload/vod/20210423-1/425ec50ebcd798e29a42098a6c27be96.jpg_300x300.jpg', actor: '锦鲤/刘晴', area: '大陆', year: '2021', score: 7.1, remarks: '更新至第280集' },
    { id: 82844, typeId1: 4, name: '雷霆三人行', pic: 'upload/vod/20260709-1/d3085b39eb529b59bd2b17e62943b9f2.jpg_384x560.jpg', actor: '铃代纱弓/川井田夏海', area: '日本', year: '2026', score: 8, remarks: '更新至第04集' },
    { id: 81507, typeId1: 4, name: '将夜', pic: 'upload/vod/20260423-1/52fe2071426525bfef6f7a6ab38bddab.jpg_384x560.jpg', actor: '杨天翔/青泯邑', area: '大陆', year: '2026', score: 8, remarks: '更新至第16集' },
    { id: 82879, typeId1: 4, name: '东大高武学院', pic: 'upload/vod/20260716-1/5a87431b7c29eab6e3d343001752676a.jpg_384x560.jpg', actor: '秦雨', area: '大陆', year: '2026', score: 7.2, remarks: '更新至第04集' }
  ],
  6: [
    { id: 22048, typeId1: 6, name: '苏州河', pic: 'upload/vod/2020-10-08/202010081602151073.jpg', actor: '周迅/贾宏声', area: '大陆', year: '2000', score: 9.5, remarks: '超清' },
    { id: 35669, typeId1: 6, name: '无名女尸', pic: 'upload/vod/20220505-1/2d5e03de6dca80b47406b0055db1e022.jpg_384x560.jpg', actor: '埃米尔·赫斯基', area: '英国', year: '2016', score: 8, remarks: '超清' },
    { id: 14729, typeId1: 6, name: '东京攻略', pic: 'upload/vod/2019-12-20/201912201576865746.jpg', actor: '梁朝伟/郑伊健', area: '香港', year: '2000', score: 8, remarks: '超清' },
    { id: 15791, typeId1: 6, name: '玩具总动员4', pic: 'upload/vod/2020-02-11/202002111581444200.jpg', actor: '汤姆·汉克斯', area: '美国', year: '2019', score: 8, remarks: '超清' }
  ]
};

const WidgetMetadata = {
  id: 'baiplay_olevod_media_library',
  name: '欧乐影院',
  title: '欧乐影院',
  version: '1.0.7',
  author: 'Alan huang',
  site: BASE,
  logo: IMAGE + '/uploads/file/2ba1599ea6adbd319aeb2d9d77577ce2_20221229161103.png'
};

function getManifest() {
  return {
    ...WidgetMetadata,
    icon: WidgetMetadata.logo,
    description: '欧乐影院原生自定义媒体库；列表优先使用公开 API，详情和播放使用站点浏览器上下文。',
    capabilities: { home: true, category: true, detail: true, search: true, resourceVersions: true, playback: true, resourceMatching: false },
    aggregation: { search: true, playbackHistory: true, resourceMatching: false }
  };
}

function ctxObject(input) {
  if (!input) return {};
  if (typeof input === 'string') {
    try { return JSON.parse(input); } catch (_) { return {}; }
  }
  return input;
}

function pick(input, names, fallback) {
  const root = ctxObject(input);
  const bags = [root, root.params, root.config, root.settings, root.parameters, root.pagination, root.pageInfo];
  for (const bag of bags) {
    if (!bag) continue;
    for (const name of names) if (bag[name] !== undefined && bag[name] !== null && bag[name] !== '') return bag[name];
  }
  return fallback;
}

function text(value) { return value == null ? '' : String(value).trim(); }
function escapeRegExp(value) { return text(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function decode(value) {
  return text(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
}
function strip(value) {
  return decode(text(value).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
}
function absolute(value, root) {
  value = decode(value);
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//')) return 'https:' + value;
  return (root || BASE).replace(/\/+$/, '') + '/' + value.replace(/^\/+/, '');
}
function imageURL(value) { return absolute(value, IMAGE); }
function headers(referer) { return { 'User-Agent': UA, Referer: referer || BASE + '/', Accept: '*/*' }; }
function imageHeaders() { return headers(BASE + '/'); }

function unwrap(response) {
  if (response == null) return response;
  if (typeof response === 'string') {
    try { return JSON.parse(response); } catch (_) { return response; }
  }
  // 欧乐 API 自身也大量使用 data 字段；遇到明确的 API envelope
  // 时只剥一层，不能递归吞掉搜索 payload 内的 data 分组。
  if (response.code !== undefined && response.data !== undefined) return response.data;
  if (response.data !== undefined) return unwrap(response.data);
  if (response.body !== undefined) return unwrap(response.body);
  if (response.text !== undefined && typeof response.text !== 'function') return unwrap(response.text);
  return response;
}

async function httpGet(url) {
  let response;
  if (typeof Widget !== 'undefined' && Widget.http) {
    if (typeof Widget.http.get === 'function') response = await Widget.http.get(url, { headers: headers(BASE + '/'), timeout: 20 });
    else if (typeof Widget.http.request === 'function') response = await Widget.http.request({ url, method: 'GET', headers: headers(BASE + '/'), timeout: 20 });
  } else if (typeof $http !== 'undefined') {
    if (typeof $http.get === 'function') response = await $http.get(url, { headers: headers(BASE + '/'), timeout: 20 });
    else if (typeof $http.request === 'function') response = await $http.request({ url, method: 'GET', headers: headers(BASE + '/'), timeout: 20 });
  } else if (typeof fetch === 'function') {
    const result = await fetch(url, { headers: headers(BASE + '/') });
    response = await result.text();
  }
  if (response === undefined) throw new Error('当前环境没有可用的 HTTP 客户端');
  return unwrap(response);
}

async function browserPage(url, options) {
  if (typeof Widget === 'undefined' || !Widget.browser || typeof Widget.browser.fetch !== 'function') {
    throw new Error('当前 Dreamby 版本不支持站点浏览器请求');
  }
  return Widget.browser.fetch(url, Object.assign({
    visible: false, timeout: 15, timeoutSeconds: 15, waitAfterLoad: 2,
    waitForAny: true, captureRequests: true, headers: headers(BASE + '/')
  }, options || {}));
}

function browserHTML(result) {
  const value = result && (result.data ?? result.html ?? result.body ?? result.text);
  return typeof value === 'string' ? value : '';
}

function detailParts(raw) {
  const value = text(raw);
  let match = value.match(/details-(\d+)-(\d+)\.html/i);
  if (match) return { typeId: Number(match[1]), id: Number(match[2]) };
  match = value.match(/^(\d+):(\d+)$/);
  if (match) return { typeId: Number(match[1]), id: Number(match[2]) };
  match = value.match(/(\d+)/);
  return { typeId: Number(pick({}, [], 0)) || 0, id: match ? Number(match[1]) : 0 };
}

function categoryById(id) { return CATEGORIES.find(item => Number(item.id) === Number(id)) || CATEGORIES[0]; }

function mediaItem(item, forcedType) {
  const typeId = Number(item.typeId1 || item.pid || item.categoryId || 0);
  const category = categoryById(typeId);
  const id = Number(item.id || item.vodId);
  const poster = imageURL(item.picThumb || item.pic || item.poster);
  return {
    id: typeId + ':' + id,
    title: text(item.name || item.title),
    subtitle: [item.year, item.area, item.actor].filter(Boolean).join(' · '),
    overview: text(item.blurb || item.content),
    type: forcedType || category.type,
    poster, backdrop: imageURL(item.picSlide || item.pic || item.picThumb),
    year: Number(item.year) || undefined,
    rating: Number(item.score) || undefined,
    remarks: text(item.remarks || item.version),
    badges: [item.version || item.remarks, item.new ? '最新' : ''].filter(Boolean),
    aspectRatio: '2:3',
    imageHeaders: imageHeaders(), posterHeaders: imageHeaders(), backdropHeaders: imageHeaders(),
    action: { type: 'detail', itemId: typeId + ':' + id }
  };
}

async function homeList(categoryId) {
  const result = await httpGet(API + '/v1/pub/index/vod/data/' + categoryId);
  const payload = result && result.code !== undefined ? result.data : result;
  return Array.isArray(payload && payload.list) ? payload.list : [];
}

function getHome() {
  const first = HOME_BOOTSTRAP.map(item => mediaItem(item, 'movie'));
  return {
    pageType: 'home', id: 'olevod-home', title: '欧乐影院',
    heroAspectRatio: '16:9', hero: first.slice(0, 6).map(item => ({ ...item, aspectRatio: '16:9' })),
    sections: [{
      id: 'olevod-bootstrap', title: '首页精选', style: 'discover.standard', contentType: 'movie',
      lazy: false, isLazy: false, items: first,
      moreAction: { type: 'category', id: '1', pageId: '1', title: '电影', itemAspectRatio: '2:3' }
    }].concat(CATEGORIES.map(category => ({
      id: 'olevod-' + category.id, title: category.title, style: 'discover.posterCompact', contentType: category.type,
      lazy: false, isLazy: false,
      items: (CATEGORY_BOOTSTRAP[category.id] || []).map(item => mediaItem(item, category.type)),
      moreAction: { type: 'category', id: String(category.id), pageId: String(category.id), title: category.title, itemAspectRatio: '2:3' }
    })))
  };
}

async function getHomeSection(input) {
  const sectionId = text(pick(input, ['sectionId', 'id'], 'olevod-1'));
  const id = Number((sectionId.match(/\d+/) || [1])[0]);
  const category = categoryById(id);
  try {
    const items = (await homeList(id)).map(item => mediaItem(item, category.type));
    return {
      id: sectionId, title: category.title, lazy: false,
      isLazy: false, contentType: category.type,
      style: text(pick(input, ['style'], 'discover.posterCompact')),
      items: items.map((item, rank) => text(pick(input, ['style'], '')).includes('ranked') ? ({ ...item, rank: rank + 1 }) : item),
      moreAction: { type: 'category', pageId: String(id), title: category.title, itemAspectRatio: '2:3' }
    };
  } catch (error) {
    return { id: sectionId, title: category.title, lazy: false, isLazy: false, contentType: category.type, style: 'discover.standard', subtitle: '加载失败：' + error.message, items: [] };
  }
}

function parseRenderedCards(html, forcedTypeId) {
  const items = [];
  const seen = {};
  const pattern = /<a\b[^>]*href=["']([^"']*details-(\d+)-(\d+)\.html[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const typeId = Number(match[2] || forcedTypeId);
    const id = Number(match[3]);
    if (seen[id]) continue;
    const block = match[4];
    const img = (block.match(/(?:src|data-src|data-original)=["']([^"']+)["']/i) || [])[1] || '';
    const alt = (block.match(/alt=["']([^"']+)["']/i) || [])[1] || '';
    const title = alt || strip(block).replace(/^\d+\s*/, '').split(/\s{2,}|高清|超清|最新/)[0];
    if (!title) continue;
    seen[id] = true;
    items.push(mediaItem({ id, typeId1: typeId, name: title, pic: img }, categoryById(typeId).type));
  }
  return items;
}

function navURL(typeId, page) {
  return BASE + '/nav/vod/all/all/' + typeId + '/all/all/update?page=' + page;
}

function capturedURL(result, predicate) {
  const urls = [];
  const seen = [];
  function walk(value) {
    if (value == null || seen.length > 500) return;
    if (typeof value === 'string') {
      const normalized = value.replace(/\\u002F/gi, '/').replace(/\\\//g, '/').replace(/&amp;/gi, '&');
      const matches = normalized.match(/https?:\/\/[^\s"'<>\\]+/gi) || [];
      matches.forEach(url => {
        url = url.replace(/[),;\]}]+$/, '');
        if (predicate(url) && !urls.includes(url)) urls.push(url);
      });
      return;
    }
    if (typeof value !== 'object' || seen.includes(value)) return;
    seen.push(value);
    if (Array.isArray(value)) return value.forEach(walk);
    Object.keys(value).forEach(key => walk(value[key]));
  }
  walk(result);
  try { walk(JSON.stringify(result)); } catch (_) {}
  return urls[0] || '';
}

function rewritePagedURL(url, page, pageSize) {
  const parts = text(url).split('?');
  const path = parts[0].replace(/\/\d+\/\d+$/, '/' + page + '/' + pageSize);
  return path + (parts[1] ? '?' + parts[1] : '');
}

async function categoryPage(categoryId, page, pageSize) {
  const browserResult = await browserPage(BASE + '/tabs-' + categoryId + '.html?_dreamby=' + Date.now(), {
    timeout: 12, timeoutSeconds: 12, waitAfterLoad: 2.5
  });
  const signedList = capturedURL(browserResult, url =>
    url.includes('/v1/pub/vod/list/') && url.includes('/' + categoryId + '/0/0/')
  ) || capturedURL(browserResult, url => url.includes('/v1/pub/vod/list/'));
  if (!signedList) throw new Error('分类页没有返回已签名列表请求');
  const payload = await httpGet(rewritePagedURL(signedList, page, pageSize));
  const data = payload && payload.list !== undefined ? payload : (payload && payload.data) || {};
  const list = Array.isArray(data.list) ? data.list : [];
  return {
    items: list.map(item => mediaItem(item, categoryById(categoryId).type)),
    total: Number(data.total) || 0,
    page: Number(data.page) || page,
    pageSize: Number(data.pageSize) || pageSize
  };
}

async function getCategory(input) {
  const id = Number(pick(input, ['pageId', 'categoryId', 'id'], 1));
  const page = Math.max(1, Number(pick(input, ['page', 'pg', 'currentPage', 'pageNumber', 'pageIndex'], 1)) || 1);
  const category = categoryById(id);
  const pageSize = 24;
  let result;
  try {
    result = await categoryPage(id, page, pageSize);
  } catch (error) {
    if (page !== 1) throw new Error(category.title + '第 ' + page + ' 页加载失败：' + error.message);
    const items = (await homeList(id)).map(item => mediaItem(item, category.type));
    result = { items, total: items.length + 1, page: 1, pageSize: items.length };
  }
  const hasMore = result.total
    ? result.page * result.pageSize < result.total
    : result.items.length >= result.pageSize;
  return {
    pageType: 'category', id: String(id), title: category.title, style: 'media.posterGrid',
    itemAspectRatio: '2:3', page: result.page, currentPage: result.page,
    pageSize: result.pageSize, limit: result.pageSize, total: result.total,
    nextPage: result.page + 1, hasMore, items: result.items
  };
}

function labelValue(html, label) {
  const match = strip(html).match(new RegExp(escapeRegExp(label) + '[:：]\\s*([^\\n]+?)(?=\\s+(?:年份|地区|类型|清晰度|状态|导演|主演|简介)[:：]|$)', 'i'));
  return match ? text(match[1]) : '';
}

async function getDetail(input) {
  const rawId = text(pick(input, ['itemId', 'id'], ''));
  const parts = detailParts(rawId);
  if (!parts.id) throw new Error('缺少欧乐影片 ID');
  const typeId = parts.typeId || Number(pick(input, ['typeId', 'categoryId'], 1));
  const url = BASE + '/details-' + typeId + '-' + parts.id + '.html';
  const result = await browserPage(url, { waitAfterLoad: 2.5 });
  const html = browserHTML(result);
  const title = decode(((html.match(/<title>([^<]+)/i) || [])[1] || '').split(' - ')[0]) || ('影片 ' + parts.id);
  const poster = imageURL((html.match(/(?:src|data-src)=["']([^"']*upload\/vod\/[^"']+)["']/i) || [])[1] || '');
  const plain = strip(html);
  const overview = (plain.match(/简介[:：]\s*([\s\S]*?)(?=立刻播放|播放列表|猜你喜欢|$)/i) || [])[1] || '';
  const episodePattern = new RegExp('/player/vod/' + typeId + '-' + parts.id + '-(\\d+)\\.html', 'gi');
  const episodeIds = []; let em;
  while ((em = episodePattern.exec(html))) if (!episodeIds.includes(Number(em[1]))) episodeIds.push(Number(em[1]));
  const renderedEpisodeTitles = [];
  const episodeBlockPattern = /class=["'][^"']*list-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  while ((em = episodeBlockPattern.exec(html))) {
    const episodeTitle = strip(em[1]).replace(/^新\s*/, '');
    if (episodeTitle && !renderedEpisodeTitles.includes(episodeTitle)) renderedEpisodeTitles.push(episodeTitle);
  }
  if (!episodeIds.length && renderedEpisodeTitles.length) {
    renderedEpisodeTitles.forEach((episodeTitle, position) => {
      const number = (episodeTitle.match(/(\d+)/) || [])[1];
      const index = Number(number) || position + 1;
      if (!episodeIds.includes(index)) episodeIds.push(index);
    });
  }
  if (!episodeIds.length) episodeIds.push(1);
  const episodes = episodeIds.map((index, position) => ({
    id: typeId + ':' + parts.id + ':' + index,
    title: renderedEpisodeTitles[position] || (episodeIds.length === 1 ? '立即播放' : ('第 ' + (position + 1) + ' 集')),
    episodeNumber: position + 1, action: { type: 'play', itemId: typeId + ':' + parts.id, episodeId: String(index), versionId: String(index), title }
  }));
  const category = categoryById(typeId);
  const detail = {
    pageType: 'detail', id: typeId + ':' + parts.id, type: category.type, title,
    poster, backdrop: poster, detailImageAspectRatio: '2:3',
    imageHeaders: imageHeaders(), posterHeaders: imageHeaders(), backdropHeaders: imageHeaders(),
    overview: text(overview), year: Number(labelValue(html, '年份')) || undefined,
    rating: Number((plain.match(/\b(\d+(?:\.\d+)?)\s*分?\s+年份/) || [])[1]) || undefined,
    genres: labelValue(html, '类型').split(/[、,/]/).filter(Boolean),
    cast: labelValue(html, '主演').split(/[、/]/).filter(Boolean).map(name => ({ name: text(name) })),
    director: labelValue(html, '导演')
  };
  if (episodeIds.length > 1 || category.type === 'series') {
    detail.seasons = [{ id: 'season-1', title: '播放列表', seasonNumber: 1, episodes }];
  }
  detail.resourceGroups = [{ id: 'olevod-line', title: '欧乐线路', versions: episodes.map((episode, index) => ({
    id: String(episodeIds[index]), title: episode.title, default: index === episodes.length - 1,
    action: episode.action
  })) }];
  return detail;
}

async function getResourceVersions(input) {
  const detail = await getDetail(input);
  return { itemId: detail.id, groups: detail.resourceGroups || [] };
}

function mediaCandidates(result) {
  const found = [];
  const seenObjects = [];
  function normalizeURL(value) {
    return text(value)
      .replace(/\\u002F/gi, '/')
      .replace(/\\\//g, '/')
      .replace(/&amp;/gi, '&')
      .replace(/^["']|["']$/g, '');
  }
  function playable(value) {
    return /^https?:\/\//i.test(value) &&
      /\.(?:m3u8|mp4|mpd|m4v|mov|webm)(?:[?#]|$)/i.test(value) &&
      !/^blob:/i.test(value);
  }
  function push(value) {
    const url = normalizeURL(value);
    if (playable(url) && !found.includes(url)) found.push(url);
  }
  function add(value) {
    if (!value) return;
    if (typeof value === 'string') {
      const normalized = normalizeURL(value);
      push(normalized);
      const matches = normalized.match(/https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mp4|mpd|m4v|mov|webm)(?:[?#][^\s"'<>\\]*)?/gi) || [];
      for (const url of matches) push(url);
      return;
    }
    if (typeof value !== 'object' || seenObjects.includes(value) || seenObjects.length > 500) return;
    seenObjects.push(value);
    if (Array.isArray(value)) {
      value.forEach(add);
      return;
    }
    // Dreamby 不同版本会把媒体 URL 放在 url、request.url、
    // responseURL、mediaSources 或 capturedRequests 的任意嵌套层。
    Object.keys(value).forEach(key => add(value[key]));
  }
  add(result);
  try { add(JSON.stringify(result)); } catch (_) {}
  found.sort((a, b) => (/master\.m3u8/i.test(b) ? 2 : /\.m3u8/i.test(b) ? 1 : 0) - (/master\.m3u8/i.test(a) ? 2 : /\.m3u8/i.test(a) ? 1 : 0));
  return found;
}

function signedDetailURL(result, itemId) {
  const found = [];
  const seen = [];
  function walk(value) {
    if (value == null || seen.length > 500) return;
    if (typeof value === 'string') {
      const normalized = value.replace(/\\u002F/gi, '/').replace(/\\\//g, '/').replace(/&amp;/gi, '&');
      const pattern = new RegExp("https?://[^\\s\"'<>\\\\]+/v1/pub/vod/detail/" + Number(itemId) + "/true\\?[^\\s\"'<>\\\\]+", 'gi');
      const matches = normalized.match(pattern) || [];
      matches.forEach(url => {
        url = url.replace(/[),;\]}]+$/, '');
        if (!found.includes(url)) found.push(url);
      });
      return;
    }
    if (typeof value !== 'object' || seen.includes(value)) return;
    seen.push(value);
    if (Array.isArray(value)) return value.forEach(walk);
    Object.keys(value).forEach(key => walk(value[key]));
  }
  walk(result);
  try { walk(JSON.stringify(result)); } catch (_) {}
  return found[0] || '';
}

function detailLineCandidates(payload, episode, preference) {
  const root = payload && payload.data !== undefined ? payload.data : payload;
  const lines = root && Array.isArray(root.urls) ? root.urls : [];
  const selected = lines.find((line, index) =>
    Number(line && line.index) === Number(episode) || index + 1 === Number(episode)
  ) || lines[0] || {};
  const normal = mediaCandidates(selected.url || selected.play_url || '');
  const vip = mediaCandidates(selected.vip_urls || []);
  if (preference === 'normal') return normal.concat(vip.filter(url => !normal.includes(url)));
  return vip.concat(normal.filter(url => !vip.includes(url)));
}

async function resolvePlayback(input) {
  const rawId = text(pick(input, ['itemId', 'id'], ''));
  const parts = detailParts(rawId);
  if (!parts.id) throw new Error('播放解析失败：缺少影片 ID');
  const typeId = parts.typeId || Number(pick(input, ['typeId', 'categoryId'], 1));
  const requestedVersion = text(pick(input, ['versionId', 'resourceId', 'lineId'], ''));
  const episode = Number(pick(input, ['episodeId'], requestedVersion.replace(/^(?:vip|normal):/i, '') || 1)) || 1;
  const preference = /^normal:/i.test(requestedVersion) ? 'normal' : 'vip';
  const player = BASE + '/player/vod/' + typeId + '-' + parts.id + '-' + episode + '.html?_dreamby=' + Date.now();
  const result = await browserPage(player, {
    timeout: 15, timeoutSeconds: 15, waitAfterLoad: 4,
    waitForAny: false, waitForMediaSource: false,
    captureMedia: true, captureRequests: true
  });
  let candidates = mediaCandidates(result);
  const signedDetail = signedDetailURL(result, parts.id);
  if (signedDetail) {
    try {
      const signedPayload = await httpGet(signedDetail);
      const detailCandidates = detailLineCandidates(signedPayload, episode, preference);
      candidates = detailCandidates.concat(candidates.filter(url => !detailCandidates.includes(url)));
    } catch (_) {}
  }
  const url = candidates[0];
  if (!url) {
    const keys = result && typeof result === 'object' ? Object.keys(result).join(',') : typeof result;
    throw new Error('播放解析失败：浏览器和签名详情均未返回最终媒体地址；player=' + player + '；resultKeys=' + keys + '；signedDetail=' + (signedDetail ? 'yes' : 'no') + '；mediaCandidates=0');
  }
  const isHls = /\.m3u8(?:[?#]|$)/i.test(url);
  const origin = (url.match(/^(https?:\/\/[^/]+)/i) || [])[1] || BASE;
  return {
    url, container: isHls ? 'm3u8' : 'mp4',
    headers: { 'User-Agent': UA, Referer: player, Origin: origin, Accept: '*/*' },
    startPositionSeconds: 0, isLive: false, streamKind: isHls ? 'hls' : 'file'
  };
}

async function search(input) {
  const query = text(pick(input, ['query', 'keyword', 'text', 'q', 'searchText'], ''));
  const page = Math.max(1, Number(pick(input, ['page', 'pg', 'currentPage', 'pageNumber'], 1)) || 1);
  const pageSize = 20;
  if (!query) return { pageType: 'search', id: 'search', title: '搜索', query, keyword: query, page, hasMore: false, items: [] };
  const pageURL = BASE + '/search?q=' + encodeURIComponent(query) + '&_dreamby=' + Date.now();
  const browserResult = await browserPage(pageURL, { timeout: 12, timeoutSeconds: 12, waitAfterLoad: 2.5 });
  const signedSearch = capturedURL(browserResult, url => url.includes('/v1/pub/index/search/'));
  if (!signedSearch) throw new Error('欧乐搜索没有返回已签名请求');
  const parts = signedSearch.split('?');
  const encodedQuery = encodeURIComponent(query);
  const apiURL = API + '/v1/pub/index/search/' + encodedQuery + '/vod/0/' + page + '/' + pageSize +
    (parts[1] ? '?' + parts[1] : '');
  const payload = await httpGet(apiURL);
  const groups = Array.isArray(payload && payload.data) ? payload.data : [];
  const vod = groups.find(group => group && group.type === 'vod') || {};
  const list = Array.isArray(vod.list) ? vod.list : [];
  const total = Number(vod.total || (payload && payload.total)) || list.length;
  const actualPage = Number(vod.page) || page;
  const actualPageSize = Number(vod.pageSize) || pageSize;
  const items = list.map(item => mediaItem(item, categoryById(item.typeId1).type));
  return {
    pageType: 'search', id: 'search:' + query, title: '搜索：' + query,
    query, keyword: query, searchText: query, itemAspectRatio: '2:3',
    page: actualPage, currentPage: actualPage, pageSize: actualPageSize, limit: actualPageSize,
    total, nextPage: actualPage + 1, hasMore: actualPage * actualPageSize < total, items
  };
}

globalThis.WidgetMetadata = WidgetMetadata;
globalThis.getManifest = getManifest;
globalThis.getHome = getHome;
globalThis.getHomeSection = getHomeSection;
globalThis.getCategory = getCategory;
globalThis.getDetail = getDetail;
globalThis.getResourceVersions = getResourceVersions;
globalThis.resolvePlayback = resolvePlayback;
globalThis.search = search;
globalThis.quickSearch = search;
globalThis.getSearch = search;
globalThis.onSearch = search;
globalThis.home = getHome;
globalThis.homeSection = getHomeSection;
globalThis.category = getCategory;
globalThis.detail = getDetail;
globalThis.getVersions = getResourceVersions;
globalThis.play = resolvePlayback;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WidgetMetadata, getManifest, getHome, getHomeSection, getCategory, getDetail, getResourceVersions, resolvePlayback, search };
}
