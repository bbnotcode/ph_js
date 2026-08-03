/**
 * Stripchat 直播 - Dreamby / baiPlay 自定义媒体库
 *
 * Source adapter migrated from Forward Widgets 5.2.1.
 * Source API: Stripchat current front API.
 * Playback: Stripchat HLS CDN master/media playlists.
 *
 * 说明：直播地址、pkey 和可用画质在播放/资源版本请求时重新探测，
 * 不把短时 URL 写入静态详情或长期缓存。
 */

const CURRENT_API_BASES = [
  "https://zh.stripchat.global",
  "https://stripchat.com",
];
const SITE_URL = "https://stripchat.com/";
const API_REFERER = "https://zh.stripchat.global/";
const PAGE_SIZE = 30;
const CATEGORY_PAGE_SIZE = 12;
const FALLBACK_IMAGE = "https://assets.vvebo.vip/scripts/icon.png";
const SOURCE_USER_AGENT = "Mozilla/5.0 (Linux; Android 15; 2407FRK8EC Build/AP3A.240617.008; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.127 Mobile Safari/537.36";

const API_HEADERS_BASE = {
  "User-Agent": SOURCE_USER_AGENT,
  Referer: API_REFERER,
  Origin: API_REFERER.replace(/\/$/, ""),
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
  "X-Requested-With": "XMLHttpRequest",
};

const HLS_HEADERS_BASE = {
  "User-Agent": SOURCE_USER_AGENT,
  Referer: API_REFERER,
  Origin: API_REFERER.replace(/\/$/, ""),
  Accept: "application/vnd.apple.mpegurl, application/x-mpegURL, */*",
  "Accept-Language": "en,zh-CN;q=0.9,zh;q=0.8",
};

const GENDER_LABELS = {
  female: "女性",
  male: "男性",
  maleFemale: "男女",
  femaleTranny: "女性变性人",
  maleTranny: "男性变性人",
  group: "群体",
  tranny: "变性人",
  trannies: "多个变性人",
};

const CATEGORIES = [
  { id: "girls_cn", tag: "girls/chinese", title: "🇨🇳 中国女孩", group: "girls" },
  { id: "girls_jp", tag: "girls/japanese", title: "🇯🇵 日本女孩", group: "girls" },
  { id: "girls_kr", tag: "girls/korean", title: "🇰🇷 韩国女孩", group: "girls" },
  { id: "girls_vn", tag: "girls/vietnamese", title: "🇻🇳 越南女孩", group: "girls" },
  { id: "girls_ua", tag: "girls/ukrainian", title: "🇺🇦 乌克兰女孩", group: "girls" },
  { id: "girls_ru", tag: "girls/russian", title: "🇷🇺 俄罗斯女孩", group: "girls" },
  { id: "girls_us", tag: "girls/american", title: "🇺🇸 美国女孩", group: "girls" },
  { id: "girls_co", tag: "girls/colombian", title: "🇨🇴 哥伦比亚女孩", group: "girls" },
  { id: "girls_de", tag: "girls/german", title: "🇩🇪 德国女孩", group: "girls" },
  { id: "girls_fr", tag: "girls/french", title: "🇫🇷 法国女孩", group: "girls" },
  { id: "girls_uk", tag: "girls/uk-models", title: "🇬🇧 英国女孩", group: "girls" },
  { id: "girls_ca", tag: "girls/canadian", title: "🇨🇦 加拿大女孩", group: "girls" },
  { id: "girls_mx", tag: "girls/mexican", title: "🇲🇽 墨西哥女孩", group: "girls" },
  { id: "girls_in", tag: "girls/indian", title: "🇮🇳 印度女孩", group: "girls" },
  { id: "girls_ve", tag: "girls/venezuelan", title: "🇻🇪 委内瑞拉女孩", group: "girls" },
  { id: "girls_ro", tag: "girls/romanian", title: "🇷🇴 罗马尼亚女孩", group: "girls" },
  { id: "girls_af", tag: "girls/african", title: "🌍 非洲女孩", group: "girls" },
  { id: "girls_es", tag: "girls/spanish-speaking", title: "🇪🇸 西班牙语地区", group: "girls" },
  { id: "girls_ar", tag: "girls/arab", title: "🇸🇦 阿拉伯女孩", group: "girls" },
  { id: "girls_ke", tag: "girls/kenyan", title: "🇰🇪 肯尼亚女孩", group: "girls" },
  { id: "girls_za", tag: "girls/south-african", title: "🇿🇦 南非女孩", group: "girls" },
  { id: "girls_br", tag: "girls/brazilian", title: "🇧🇷 巴西女孩", group: "girls" },
  { id: "girls_th", tag: "girls/thai", title: "🇹🇭 泰国女孩", group: "girls" },
  { id: "girls_it", tag: "girls/italian", title: "🇮🇹 意大利女孩", group: "girls" },
  { id: "girls_teens", tag: "girls/teens", title: "少女 18+", group: "girls" },
  { id: "girls_young", tag: "girls/young", title: "鲜嫩青年 22+", group: "girls" },
  { id: "girls_milfs", tag: "girls/milfs", title: "熟女", group: "girls" },
  { id: "girls_mature", tag: "girls/mature", title: "成熟", group: "girls" },
  { id: "girls_grannies", tag: "girls/grannies", title: "老奶奶", group: "girls" },
  { id: "girls_white", tag: "girls/white", title: "白人", group: "girls" },
  { id: "girls_asian", tag: "girls/asian", title: "亚洲人", group: "girls" },
  { id: "girls_latin", tag: "girls/latin", title: "拉丁人", group: "girls" },
  { id: "girls_ebony", tag: "girls/ebony", title: "黑珍珠", group: "girls" },
  { id: "girls_new", tag: "girls/new", title: "最新女主播", group: "girls" },
  { id: "girls_all", tag: "girls", title: "全部女主播", group: "girls" },
  { id: "couples_cn", tag: "couples/chinese", title: "中国情侣", group: "couples" },
  { id: "couples_hot", tag: "couples/popular", title: "热门情侣", group: "couples" },
  { id: "couples_new", tag: "couples/new", title: "最新情侣", group: "couples" },
  { id: "couples_all", tag: "couples", title: "全部情侣", group: "couples" },
  { id: "men_hot", tag: "men/popular", title: "最受欢迎男主播", group: "men" },
  { id: "men_couple", tag: "men/gay-couples", title: "男同伴侣", group: "men" },
  { id: "men_gay", tag: "men/gays", title: "男同聊天", group: "men" },
  { id: "men_straight", tag: "men/straight", title: "直男", group: "men" },
  { id: "men_all", tag: "men", title: "全部男主播", group: "men" },
];

const CATEGORY_BY_ID = {};
const CATEGORY_BY_TAG = {};
CATEGORIES.forEach((category) => {
  CATEGORY_BY_ID[category.id] = category;
  CATEGORY_BY_TAG[category.tag] = category;
});

const HOME_SECTION_DEFS = [
  { id: "home:hot", title: "热门女主播", kind: "media", tag: "girls", pageId: "tag:girls" },
  { id: "home:girls-index", title: "女主播分类", kind: "categories", group: "girls", pageId: "index:girls" },
  { id: "home:couples", title: "情侣直播", kind: "media", tag: "couples/popular", pageId: "tag:couples%2Fpopular" },
  { id: "home:couples-index", title: "情侣分类", kind: "categories", group: "couples", pageId: "index:couples" },
  { id: "home:men", title: "男主播", kind: "media", tag: "men/popular", pageId: "tag:men%2Fpopular" },
  { id: "home:men-index", title: "男主播分类", kind: "categories", group: "men", pageId: "index:men" },
  { id: "home:new", title: "最新女主播", kind: "media", tag: "girls/new", pageId: "tag:girls%2Fnew" },
];

const WidgetMetadata = {
  id: "forward.stripchat",
  name: "Stripchat 直播",
  title: "Stripchat 直播",
  version: "5.3.0",
  author: "Alan huang",
  site: SITE_URL,
  logo: FALLBACK_IMAGE,
  icon: FALLBACK_IMAGE,
  description: "Stripchat Dreamby 自定义媒体库，支持主播分类、搜索、直播详情、多 CDN HLS 和画质切换。仅供年满 18 岁的用户使用。",
};

function parseContext(ctx) {
  if (typeof ctx === "string") {
    try { return JSON.parse(ctx) || {}; } catch (_) { return {}; }
  }
  return ctx && typeof ctx === "object" ? ctx : {};
}

function contextValue(ctx, names, fallback) {
  const parsed = parseContext(ctx);
  const containers = [
    parsed,
    parsed.params,
    parsed.config,
    parsed.settings,
    parsed.parameters,
    parsed.pagination,
    parsed.pageInfo,
    parsed.action,
    parsed.payload,
    parsed.request,
    parsed.query,
    parsed.loadAction,
    parsed.item,
    parsed.resource,
    parsed.version,
    parsed.userParameters,
    parsed.userConfig,
  ];
  for (const name of names) {
    for (const container of containers) {
      if (!container || typeof container !== "object") continue;
      const value = container[name];
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
  }
  return fallback;
}

function pageNumber(ctx, fallback) {
  const raw = contextValue(ctx, ["page", "pg", "currentPage", "pageNumber", "pageIndex"], fallback || 1);
  const number = Number(raw);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : (fallback || 1);
}

function boundedInteger(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(number)));
}

function widgetRuntime() {
  if (typeof Widget !== "undefined") return Widget;
  if (typeof globalThis !== "undefined" && globalThis.Widget) return globalThis.Widget;
  return null;
}

function legacyHttpRuntime() {
  if (typeof $http !== "undefined") return $http;
  if (typeof globalThis !== "undefined" && globalThis.$http) return globalThis.$http;
  return null;
}

function copyHeaders(base, cookie) {
  const headers = {};
  Object.keys(base || {}).forEach((key) => { headers[key] = base[key]; });
  if (cookie) headers.Cookie = cookie;
  return headers;
}

function normalizeCookie(value) {
  return String(value || "").trim().replace(/^cookie\s*:\s*/i, "");
}

function readConfig(ctx) {
  return {
    cookie: normalizeCookie(contextValue(ctx, ["cookie", "stripchatCookie", "cookieString", "sessionCookie", "Cookie"], "")),
  };
}

function apiHeaders(config) {
  return copyHeaders(API_HEADERS_BASE, config && config.cookie);
}

function hlsHeaders(config) {
  return copyHeaders(HLS_HEADERS_BASE, config && config.cookie);
}

function imageHeaders() {
  return {
    Referer: API_REFERER,
    "User-Agent": SOURCE_USER_AGENT,
  };
}

function unwrapResponse(response) {
  let body = response;
  if (response && typeof response === "object") {
    if (Object.prototype.hasOwnProperty.call(response, "data")) body = response.data;
    else if (Object.prototype.hasOwnProperty.call(response, "body")) body = response.body;
    else if (Object.prototype.hasOwnProperty.call(response, "text")) body = response.text;
  }
  if (typeof body === "string") {
    try { return JSON.parse(body); } catch (_) { return body; }
  }
  return body;
}

function responseStatus(response) {
  const status = Number(response && response.status ? response.status : 0);
  return Number.isFinite(status) ? status : 0;
}

function looksLikeBlockedPage(value) {
  const text = typeof value === "string" ? value : "";
  return /<html[\s>]|attention required|cloudflare|cf-chl-|just a moment|access denied/i.test(text);
}

function parseBrowserBody(value) {
  let body = value;
  if (body && typeof body === "object") {
    body = body.data !== undefined ? body.data
      : body.body !== undefined ? body.body
        : body.text !== undefined ? body.text
          : body.html !== undefined ? body.html
            : body;
  }
  if (typeof body === "string") {
    const text = body.replace(/^\s*<pre[^>]*>/i, "").replace(/<\/pre>\s*$/i, "").trim();
    if (looksLikeBlockedPage(text)) throw new Error("Stripchat 返回了 Cloudflare/访问拦截页");
    try { return JSON.parse(text); } catch (_) { return text; }
  }
  return body;
}

function requestOptions(headers, timeout) {
  const seconds = timeout || 20;
  return {
    headers: headers || {},
    timeout: seconds,
    timeoutSeconds: seconds,
    useBrowserCookie: true,
    attachBrowserCookie: true,
    useBrowserFallback: true,
    browserFallback: true,
    allowBrowserFallback: true,
    cache: "no-store",
  };
}

async function browserGet(url, headers, timeout) {
  const widget = widgetRuntime();
  if (!widget || !widget.browser || typeof widget.browser.fetch !== "function") {
    throw new Error("当前运行环境没有可用的浏览器会话");
  }
  const seconds = Math.max(25, Number(timeout) || 20);
  const result = await widget.browser.fetch(url, {
    visible: false,
    timeout: seconds,
    timeoutSeconds: seconds,
    waitAfterLoad: 1,
    waitForAny: true,
    headers: headers || {},
    useBrowserCookie: true,
    attachBrowserCookie: true,
  });
  const status = responseStatus(result);
  if (status >= 400) throw new Error(`浏览器请求 HTTP ${status}`);
  return parseBrowserBody(result);
}

async function httpGet(url, headers, timeout) {
  const options = requestOptions(headers, timeout);
  const widget = widgetRuntime();
  const legacyHttp = legacyHttpRuntime();
  let response;
  let requestError;

  try {
    if (widget && widget.http && typeof widget.http.get === "function") {
      response = await widget.http.get(url, options);
    } else if (widget && widget.http && typeof widget.http.request === "function") {
      response = await widget.http.request({ url, method: "GET", ...options });
    } else if (legacyHttp && typeof legacyHttp.get === "function") {
      response = await legacyHttp.get(url, options);
    } else if (legacyHttp && typeof legacyHttp.request === "function") {
      response = await legacyHttp.request({ url, method: "GET", ...options });
    } else if (typeof fetch === "function") {
      response = await fetch(url, { method: "GET", headers: options.headers });
    } else {
      throw new Error("当前运行环境没有可用的 HTTP 客户端");
    }
    const status = responseStatus(response);
    if (status >= 400) throw new Error(`HTTP ${status}`);
    if (response && typeof response.text === "function") {
      if (response.ok === false) throw new Error(`HTTP ${response.status || 0}`);
      const text = await response.text();
      return parseBrowserBody(text);
    }
    const body = unwrapResponse(response);
    if (looksLikeBlockedPage(body)) throw new Error("Stripchat 返回了 Cloudflare/访问拦截页");
    return body;
  } catch (error) {
    requestError = error;
  }

  // Stripchat's API is frequently challenged outside a real browser. Only API
  // calls use this fallback; HLS probing still stays on the normal HTTP path.
  if (/\/api\//i.test(String(url || ""))) {
    try {
      return await browserGet(url, headers, timeout);
    } catch (browserError) {
      const first = requestError && requestError.message ? requestError.message : String(requestError || "");
      const second = browserError && browserError.message ? browserError.message : String(browserError || "");
      throw new Error([first, second].filter(Boolean).join("；") || "Stripchat API 请求失败");
    }
  }
  if (requestError) throw requestError;
  throw new Error("Stripchat 请求失败");
}

function modelPayload(value) {
  if (Array.isArray(value)) return { models: value };
  if (!value || typeof value !== "object") return {};
  if (Array.isArray(value.models)) return value;
  if (value.data !== undefined) return modelPayload(value.data);
  if (value.body !== undefined) return modelPayload(value.body);
  if (value.result !== undefined) return modelPayload(value.result);
  return value;
}

function normalizeModelNode(model) {
  if (!model || typeof model !== "object" || Array.isArray(model)) return model;
  const nested = model.user && model.user.user && typeof model.user.user === "object"
    ? model.user.user
    : model.model && typeof model.model === "object" ? model.model : null;
  if (!nested) return model;
  return { ...model, ...nested };
}

function modelList(value) {
  const payload = modelPayload(value);
  if (!payload || typeof payload !== "object") return { payload: {}, models: [] };
  const arrays = [payload.models, payload.items, payload.users, payload.results, payload.data && payload.data.models];
  const models = arrays.find((candidate) => Array.isArray(candidate)) || [];
  return {
    payload,
    models: models.map(normalizeModelNode).filter(Boolean),
  };
}


const MODEL_BLOCK_CACHE = {};

function primaryTagFromTag(tag) {
  const value = String(tag || "girls").split("/")[0].toLowerCase();
  return ["girls", "couples", "men", "trans"].includes(value) ? value : "girls";
}

function publicLiveModel(model) {
  const status = String(model && model.status || "").toLowerCase();
  if (status && status !== "public") return false;
  if (model && model.isLive === false) return false;
  if (model && model.isOnline === false) return false;
  return true;
}

async function currentAPI(path, config, timeout) {
  let lastError = "";
  for (const base of CURRENT_API_BASES) {
    try {
      return await httpGet(`${base}${path}`, apiHeaders(config), timeout || 15);
    } catch (error) {
      lastError = error && error.message ? error.message : String(error);
    }
  }
  throw new Error(lastError || "Stripchat 当前 API 请求失败");
}

async function fetchModelBlocks(primaryTag, config) {
  const group = primaryTagFromTag(primaryTag);
  const cacheKey = `${group}:${config && config.cookie ? "auth" : "public"}`;
  const cached = MODEL_BLOCK_CACHE[cacheKey];
  if (cached && Date.now() - cached.time < 60000) return cached.blocks;
  const path = "/api/front/v2/models"
    + `?primaryTag=${encodeURIComponent(group)}`
    + "&limit=24&topLimit=61&favoritesLimit=24&msBlock=true"
    + "&byw=false&flags=0&srwm=false&rcmGrp=N&rbCnGr=true"
    + "&iem=true&decMb=true&ctryTop=true&mlfv=false&rectf=false"
    + "&eab=false&sac=false&nic=true&removeShows=true"
    + `&uniq=${Date.now().toString(36)}`;
  const payload = modelPayload(await currentAPI(path, config, 15));
  const blocks = Array.isArray(payload.blocks) ? payload.blocks : [];
  MODEL_BLOCK_CACHE[cacheKey] = { time: Date.now(), blocks };
  return blocks;
}

async function tagDescriptor(tag, config) {
  const value = String(tag || "girls");
  if (!value.includes("/")) return null;
  const blocks = await fetchModelBlocks(primaryTagFromTag(value), config);
  const block = blocks.find((entry) => String(entry && entry.url || "") === value);
  if (!block) return null;
  const tagId = String(block.tagId || "");
  return {
    tagKey: tagId.includes(".") ? tagId.split(".").pop() : tagId,
    block,
  };
}

async function fetchModels(tag, page, search, config) {
  const currentPage = Math.max(1, Number(page) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const primaryTag = primaryTagFromTag(tag);
  const descriptor = await tagDescriptor(tag, config);
  const parts = [
    "removeShows=true",
    "recInFeatured=false",
    `limit=${PAGE_SIZE}`,
    `offset=${offset}`,
    `primaryTag=${encodeURIComponent(primaryTag)}`,
    "sortBy=stripRanking",
    "userRole=user",
    "nic=true",
    "byw=false",
    "rcmGrp=N",
    "rbCnGr=true",
    "iem=true",
    "decMb=true",
    "ctryTop=true",
    "mlfv=false",
    "rectf=false",
    "eab=false",
    "sac=false",
  ];
  if (descriptor && descriptor.tagKey) {
    parts.push(`filterGroupTags=${encodeURIComponent(JSON.stringify([[descriptor.tagKey]]))}`);
    parts.push(`parentTag=${encodeURIComponent(descriptor.tagKey)}`);
  }
  parts.push(`uniq=${Date.now().toString(36)}`);
  const parsed = modelList(await currentAPI(`/api/front/models?${parts.join("&")}`, config, 15));
  let models = parsed.models.filter(publicLiveModel);
  const keyword = String(search || "").trim().toLowerCase();
  if (keyword) {
    models = models.filter((model) => String(model.username || model.name || "").toLowerCase().includes(keyword));
  }
  const total = Number(parsed.payload.filteredCount || parsed.payload.totalCount || parsed.payload.total || 0) || undefined;
  return {
    models,
    page: currentPage,
    hasMore: keyword ? false : (total ? offset + PAGE_SIZE < total : parsed.models.length >= PAGE_SIZE),
    total,
  };
}

function normalizeImage(value) {
  const text = String(value || "").trim();
  if (text.startsWith("//")) return `https:${text}`;
  return text;
}

function valueString(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String).join(", ");
  if (value === undefined || value === null) return "";
  return String(value);
}

function encodePart(value) {
  return encodeURIComponent(value === undefined || value === null ? "" : String(value));
}

function decodePart(value) {
  try { return decodeURIComponent(String(value || "")); } catch (_) { return String(value || ""); }
}

function makeItemId(model, tag) {
  const modelId = model && (model.id !== undefined ? model.id : model.modelId);
  const username = model && (model.username || model.name || model.nickname || "");
  return `sc|${encodePart(modelId)}|${encodePart(username)}|${encodePart(tag || "")}`;
}

function parseItemRef(value) {
  if (value && typeof value === "object") {
    const nested = value.itemId || value.videoId || value.mediaId || value.modelId || value.id
      || value.username || value.url || value.path;
    if (nested !== undefined && nested !== value) return parseItemRef(nested);
  }
  const text = String(value || "").trim();
  if (!text) return { modelId: "", username: "", tag: "" };

  if (text.startsWith("sc|")) {
    const parts = text.split("|");
    return {
      modelId: decodePart(parts[1]),
      username: decodePart(parts[2]),
      tag: decodePart(parts[3]),
    };
  }

  if (text.startsWith("sc:")) {
    const parts = text.slice(3).split(":");
    return {
      modelId: decodePart(parts[0]),
      username: decodePart(parts[1]),
      tag: decodePart(parts[2]),
    };
  }

  if (text.startsWith("sc_")) return { modelId: text.slice(3), username: "", tag: "" };

  if (text.startsWith("stripchat:")) {
    const parts = text.slice("stripchat:".length).split(":");
    return {
      modelId: parts.length > 1 ? parts[parts.length - 1] : "",
      username: parts[0] || "",
      tag: "",
    };
  }

  if (/^\d+$/.test(text)) return { modelId: text, username: "", tag: "" };
  return { modelId: "", username: text, tag: "" };
}

function genderLabel(model) {
  return GENDER_LABELS[model && model.gender] || valueString(model && model.gender);
}

function modelPoster(model) {
  return normalizeImage(model && (model.snapshotUrl || model.previewUrlThumbBig || model.previewUrlThumbSmall || model.avatarUrl || model.previewUrl || model.image));
}

function modelBackdrop(model) {
  return normalizeImage(model && (model.previewUrlThumbBig || model.previewUrlThumbSmall || model.snapshotUrl || model.avatarUrl || model.previewUrl || model.image));
}

function viewerText(model) {
  const value = model && (model.viewersCount !== undefined ? model.viewersCount : model.viewers);
  return value === undefined || value === null ? "" : Number(value).toLocaleString("en-US");
}

function modelDescription(model) {
  const parts = [];
  const gender = genderLabel(model);
  const viewers = viewerText(model);
  const status = valueString(model && model.status);
  const languages = valueString(model && model.languages);
  if (gender) parts.push(gender);
  if (viewers) parts.push(`观众 ${viewers}`);
  if (status) parts.push(status);
  if (languages) parts.push(`语言 ${languages}`);
  return parts.join(" · ");
}

function modelBadges(model) {
  const badges = ["直播"];
  const status = valueString(model && model.status);
  if (status) badges.push(status);
  const viewers = viewerText(model);
  if (viewers) badges.push(`${viewers} 人观看`);
  return badges;
}

function modelKeywords(model) {
  const values = [];
  const gender = genderLabel(model);
  if (gender) values.push(gender);
  if (Array.isArray(model && model.languages)) values.push(...model.languages.map(String));
  if (Array.isArray(model && model.tags)) {
    model.tags.forEach((tag) => values.push(typeof tag === "object" ? (tag.title || tag.name || "") : String(tag)));
  }
  return values.filter(Boolean).slice(0, 20);
}

function formatModel(model, tag, rank) {
  const modelId = model && (model.id !== undefined ? model.id : model.modelId);
  const username = model && (model.username || model.name || model.nickname || "未命名主播");
  const poster = modelPoster(model) || FALLBACK_IMAGE;
  const backdrop = modelBackdrop(model) || poster;
  const itemId = makeItemId({ id: modelId, username }, tag);
  const description = modelDescription(model);
  const item = {
    id: itemId,
    title: username,
    subtitle: description,
    type: "live",
    poster,
    backdrop,
    overview: description || "Stripchat 在线直播",
    metadataText: description,
    badges: modelBadges(model),
    aspectRatio: "16:9",
    imageFit: "fill",
    imageHeaders: imageHeaders(),
    posterHeaders: imageHeaders(),
    backdropHeaders: imageHeaders(),
    action: {
      type: "play",
      itemId,
      versionId: "live",
      title: username,
    },
    providerIds: {
      StripchatModelId: modelId === undefined || modelId === null ? "" : String(modelId),
      StripchatUsername: String(username),
      StripchatTag: String(tag || ""),
      StripchatStatus: valueString(model && model.status),
    },
  };
  if (rank !== undefined && rank !== null) item.rank = Number(rank) || 0;
  return item;
}

function errorItem(id, title, error) {
  const message = error && error.message ? error.message : String(error || "加载失败");
  return {
    id: `error:${id}`,
    title: title || "Stripchat",
    subtitle: "加载失败",
    type: "collection",
    poster: FALLBACK_IMAGE,
    backdrop: FALLBACK_IMAGE,
    imageHeaders: imageHeaders(),
    overview: message,
    metadataText: "请稍后重试",
    badges: ["错误"],
    aspectRatio: "16:9",
    action: { type: "none" },
  };
}

function pageAction(pageId, title) {
  return {
    type: "category",
    pageId,
    title,
    itemAspectRatio: "16:9",
  };
}

function sectionTemplate(definition) {
  const isCategory = definition.kind === "categories";
  return {
    id: definition.id,
    title: definition.title,
    style: isCategory ? "discover.annualWidePreview" : "discover.standard",
    contentType: isCategory ? "category" : "live",
    lazy: true,
    isLazy: true,
    moreAction: pageAction(definition.pageId, definition.title),
    loadAction: pageAction(definition.pageId, definition.title),
    items: [],
  };
}

function findHomeSection(id) {
  return HOME_SECTION_DEFS.find((definition) => definition.id === id) || null;
}

async function getHome(ctx) {
  const config = readConfig(ctx);
  const hotDefinition = HOME_SECTION_DEFS[0];
  let hotItems = [];
  let loadingError = null;
  try {
    const result = await fetchModels(hotDefinition.tag, 1, "", config);
    hotItems = result.models.map((model, index) => formatModel(model, hotDefinition.tag, index + 1));
  } catch (error) {
    loadingError = error;
  }

  const immediateSection = {
    ...sectionTemplate(hotDefinition),
    lazy: false,
    isLazy: false,
    subtitle: hotItems.length ? `${hotItems.length} 个在线主播` : "热门主播暂时加载失败",
    items: hotItems.length ? hotItems : [errorItem("home-hot", "热门女主播", loadingError)],
  };

  return {
    pageType: "home",
    id: "stripchat-home",
    title: WidgetMetadata.title,
    heroAspectRatio: "16:9",
    hero: hotItems.slice(0, 6),
    sections: [immediateSection].concat(HOME_SECTION_DEFS.slice(1).map(sectionTemplate)),
  };
}

async function getHomeSection(ctx) {
  const parsed = parseContext(ctx);
  const sectionId = String(contextValue(parsed, ["sectionId", "sectionID", "moduleId", "pageId", "id", "key"], "home:hot"));
  const definition = findHomeSection(sectionId) || {
    id: sectionId,
    title: String(contextValue(parsed, ["title"], "Stripchat")),
    kind: sectionId.startsWith("index:") ? "categories" : "media",
    group: sectionId.startsWith("index:") ? sectionId.slice("index:".length) : "",
    tag: sectionId.startsWith("tag:") ? decodePart(sectionId.slice("tag:".length)) : "girls",
    pageId: sectionId.startsWith("index:") || sectionId.startsWith("tag:") ? sectionId : "tag:girls",
  };
  const base = sectionTemplate(definition);

  try {
    if (definition.kind === "categories") {
      const result = await getCategory({
        ...parsed,
        pageId: `index:${definition.group}`,
        page: 1,
        previewLimit: definition.group === "girls" ? 8 : 6,
      });
      return {
        ...base,
        lazy: false,
        isLazy: false,
        subtitle: result.items.length ? `${result.items.length} 个分类` : "分类预览暂时加载失败",
        items: result.items.length ? result.items : [errorItem(sectionId, definition.title, "没有返回可用的分类预览")],
      };
    }

    const config = readConfig(parsed);
    const result = await fetchModels(definition.tag || "girls", 1, "", config);
    const items = result.models.map((model, index) => formatModel(model, definition.tag, index + 1));
    return {
      ...base,
      lazy: false,
      isLazy: false,
      subtitle: items.length ? `${items.length} 个在线主播` : "暂无在线主播",
      items,
    };
  } catch (error) {
    return {
      ...base,
      lazy: false,
      isLazy: false,
      subtitle: `加载失败：${error && error.message ? error.message : String(error)}`,
      items: [errorItem(sectionId, definition.title, error)],
    };
  }
}

function categoryFromPageId(pageId) {
  const text = String(pageId || "").trim();
  if (text.startsWith("cat:")) return CATEGORY_BY_ID[text.slice(4)] || null;
  if (CATEGORY_BY_ID[text]) return CATEGORY_BY_ID[text];
  return null;
}

function tagFromPageId(pageId) {
  const text = String(pageId || "").trim();
  if (text.startsWith("tag:")) return decodePart(text.slice(4));
  if (text === "hot" || text === "girls") return "girls";
  if (text === "couples") return "couples";
  if (text === "men") return "men";
  return "";
}

function groupFromIndexPageId(pageId) {
  const text = String(pageId || "").trim();
  return text.startsWith("index:") ? text.slice(6) : "";
}

function streamNameFromModel(model) {
  const values = [
    model && model.streamName,
    model && model.stream_name,
    model && model.cam && model.cam.streamName,
    model && model.cam && model.cam.stream_name,
    model && model.stream && model.stream.streamName,
    model && model.stream && model.stream.stream_name,
    model && model.broadcast && model.broadcast.streamName,
  ];
  return values.map((value) => String(value || "").trim()).find(Boolean) || "";
}

function currentCamModel(value, username) {
  const root = modelPayload(value);
  const user = root && root.user && root.user.user && typeof root.user.user === "object"
    ? root.user.user
    : root && root.user && typeof root.user === "object" ? root.user
      : root && root.model && typeof root.model === "object" ? root.model : null;
  const cam = root && root.cam && typeof root.cam === "object" ? root.cam : null;
  if (!user && !cam) return { model: null, cam: null, raw: root };
  const model = normalizeModelNode({ ...(cam || {}), ...(user || {}) });
  if (!model.username) model.username = String(username || root && root.username || "");
  if (cam) {
    model.cam = cam;
    model.stream = model.stream || cam;
    if (!model.streamName && cam.streamName) model.streamName = cam.streamName;
  }
  return { model, cam, raw: root };
}

async function fetchCurrentCam(username, config) {
  const name = String(username || "").trim();
  if (!name) throw new Error("缺少主播用户名");
  let lastError = "";
  for (const base of CURRENT_API_BASES) {
    const url = `${base}/api/front/v2/models/username/${encodeURIComponent(name)}/cam`
      + `?triggerRequest=loadCam&uniq=${Date.now().toString(36)}`;
    try {
      const result = currentCamModel(await httpGet(url, apiHeaders(config), 20), name);
      if (result.model) return result;
      const message = result.raw && (result.raw.error || result.raw.message);
      lastError = String(message || "当前接口没有返回主播信息");
    } catch (error) {
      lastError = error && error.message ? error.message : String(error);
    }
  }
  throw new Error(lastError || "当前接口没有返回主播信息");
}


async function categoryCards(group, page, config, previewLimit) {
  const blocks = await fetchModelBlocks(group, config);
  const categories = blocks.map((block, index) => {
    const tag = String(block && block.url || "");
    const known = CATEGORY_BY_TAG[tag];
    return {
      id: known ? known.id : `${group}_${index + 1}`,
      tag,
      title: known ? known.title : String(block && (block.title || block.tagId || block.id) || tag),
      group,
      models: Array.isArray(block && block.models) ? block.models.filter(publicLiveModel) : [],
    };
  }).filter((category) => category.tag && category.models.length && modelPoster(category.models[0]));
  const pageSize = boundedInteger(previewLimit || CATEGORY_PAGE_SIZE, CATEGORY_PAGE_SIZE, 1, CATEGORY_PAGE_SIZE);
  const start = (page - 1) * pageSize;
  const pageCategories = categories.slice(start, start + pageSize);
  const cards = pageCategories.map((category, index) => {
    const previewItems = category.models.slice(0, 5).map((model, modelIndex) => formatModel(model, category.tag, modelIndex + 1));
    const first = previewItems[0];
    return {
      id: `tag:${encodePart(category.tag)}`,
      title: category.title,
      subtitle: `${category.models.length} 个在线主播`,
      type: "category",
      poster: first.poster,
      backdrop: first.backdrop,
      imageHeaders: first.imageHeaders,
      posterHeaders: first.posterHeaders,
      backdropHeaders: first.backdropHeaders,
      overview: `浏览 ${category.title} 下的在线直播。`,
      metadataText: "直播分类",
      badges: ["直播", "分类"],
      rank: start + index + 1,
      aspectRatio: "16:9",
      imageFit: "fill",
      previewItems: previewItems.slice(0, 3),
      action: pageAction(`tag:${encodePart(category.tag)}`, category.title),
    };
  });
  return {
    items: cards,
    page,
    hasMore: start + pageSize < categories.length,
    total: categories.length,
  };
}

async function getCategory(ctx) {
  const parsed = parseContext(ctx);
  const pageId = String(contextValue(parsed, ["pageId", "pageID", "categoryId", "categoryID", "moduleId", "id", "key"], "cat:girls_all"));
  const page = pageNumber(parsed, 1);
  const config = readConfig(parsed);

  const indexGroup = groupFromIndexPageId(pageId);
  if (indexGroup) {
    const result = await categoryCards(indexGroup, page, config, contextValue(parsed, ["previewLimit"], CATEGORY_PAGE_SIZE));
    return {
      pageType: "category",
      id: pageId,
      title: `${indexGroup === "girls" ? "女主播" : indexGroup === "couples" ? "情侣" : "男主播"}分类`,
      style: "discover.annualWidePreview",
      itemAspectRatio: "16:9",
      page,
      hasMore: result.hasMore,
      total: result.total,
      subtitle: `${result.items.length} 个分类`,
      items: result.items,
    };
  }

  const category = categoryFromPageId(pageId);
  const tag = category ? category.tag : tagFromPageId(pageId);
  const title = category ? category.title : String(contextValue(parsed, ["title"], tag || "Stripchat 直播"));
  if (!tag) {
    return {
      pageType: "category",
      id: pageId,
      title,
      style: "media.posterGrid",
      itemAspectRatio: "16:9",
      page,
      hasMore: false,
      items: [errorItem(pageId, title, "没有识别到 Stripchat 分类")],
    };
  }

  try {
    const result = await fetchModels(tag, page, "", config);
    return {
      pageType: "category",
      id: pageId,
      title,
      style: "media.posterGrid",
      contentType: "live",
      itemAspectRatio: "16:9",
      page,
      hasMore: result.hasMore,
      total: result.total,
      items: result.models.map((model, index) => formatModel(model, tag, (page - 1) * PAGE_SIZE + index + 1)),
    };
  } catch (error) {
    return {
      pageType: "category",
      id: pageId,
      title,
      style: "media.posterGrid",
      itemAspectRatio: "16:9",
      page,
      hasMore: false,
      items: [errorItem(pageId, title, error)],
      error: error && error.message ? error.message : String(error),
    };
  }
}

function candidateTags(ref) {
  const values = [];
  if (ref && ref.tag) values.push(ref.tag);
  ["girls", "couples", "men"].forEach((tag) => { if (!values.includes(tag)) values.push(tag); });
  return values;
}

async function findModel(ref, config) {
  const username = String(ref && ref.username || "").trim();
  const modelId = String(ref && ref.modelId || "").trim();
  if (!username && !modelId) return { model: null, tag: "", error: "缺少主播 ID 或用户名" };

  let lastError = "";
  if (username) {
    try {
      const current = await fetchCurrentCam(username, config);
      if (current.model) return { model: current.model, tag: ref && ref.tag || "", error: "" };
    } catch (error) {
      lastError = error && error.message ? error.message : String(error);
    }
  }
  for (const tag of candidateTags(ref || {})) {
    try {
      const result = await fetchModels(tag, 1, username, config);
      const match = result.models.find((model) => {
        const id = String(model && (model.id !== undefined ? model.id : model.modelId) || "");
        const name = String(model && (model.username || model.name || model.nickname) || "");
        return (modelId && id === modelId) || (username && name.toLowerCase() === username.toLowerCase());
      });
      if (match) return { model: match, tag, error: "" };
    } catch (error) {
      lastError = error && error.message ? error.message : String(error);
    }
  }
  return { model: null, tag: ref && ref.tag || "", error: lastError || "没有找到对应主播" };
}

function detailFromModel(model, tag) {
  const item = formatModel(model, tag);
  const toys = valueString(model && model.broadcastInteractiveToy);
  const languages = valueString(model && model.languages);
  const tags = modelKeywords(model);
  if (toys) tags.push(`互动玩具: ${toys}`);
  if (languages && !tags.includes(languages)) tags.push(`语言: ${languages}`);
  const description = modelDescription(model);
  return {
    pageType: "detail",
    id: item.id,
    type: "live",
    title: item.title,
    poster: item.poster,
    backdrop: item.backdrop,
    detailImageAspectRatio: "16:9",
    imageHeaders: item.imageHeaders,
    posterHeaders: item.posterHeaders,
    backdropHeaders: item.backdropHeaders,
    overview: description || "Stripchat 在线直播",
    viewCountText: viewerText(model),
    genres: tags.slice(0, 20),
    badges: item.badges,
    providerIds: item.providerIds,
    action: item.action,
    resourceGroups: [],
  };
}

function fallbackDetail(ref, error) {
  const title = ref.username || (ref.modelId ? `主播 ${ref.modelId}` : "Stripchat 主播");
  const itemId = ref.modelId || ref.username ? `sc|${encodePart(ref.modelId)}|${encodePart(ref.username)}|${encodePart(ref.tag)}` : "";
  return {
    pageType: "detail",
    id: itemId || title,
    type: "live",
    title,
    poster: FALLBACK_IMAGE,
    backdrop: FALLBACK_IMAGE,
    detailImageAspectRatio: "16:9",
    imageHeaders: imageHeaders(),
    overview: `主播详情暂时无法加载：${error || "未找到在线主播"}`,
    genres: ["Stripchat", "直播"],
    action: itemId ? { type: "play", itemId, title } : { type: "none" },
    resourceGroups: [],
  };
}

async function getDetail(ctx) {
  const parsed = parseContext(ctx);
  const raw = contextValue(parsed, ["itemId", "itemID", "mediaId", "videoId", "modelId", "id", "url", "path", "link"], "");
  let ref = parseItemRef(raw);
  const config = readConfig(parsed);
  const found = await findModel(ref, config);
  if (found.model) {
    const detail = detailFromModel(found.model, found.tag || ref.tag);
    try {
      const resources = await getResourceVersions({ ...parsed, itemId: detail.id });
      detail.resourceGroups = resources.groups || [];
    } catch (_) {
      // Transient live discovery must not be cached as a fake default line.
      detail.resourceGroups = [];
    }
    return detail;
  }
  return fallbackDetail(ref, found.error);
}


function joinURL(baseURL, relative) {
  const value = String(relative || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  const base = String(baseURL || "");
  const originMatch = base.match(/^(https?:\/\/[^/]+)/i);
  const origin = originMatch ? originMatch[1] : "";
  if (value.startsWith("/")) return origin + value;
  const directory = base.replace(/[^/]*(?:\?.*)?$/, "");
  return directory + value;
}

function parseMasterVariants(text, baseURL) {
  const lines = String(text || "").split(/\r?\n/);
  const variants = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!/^#EXT-X-STREAM-INF:/i.test(line)) continue;
    const bandwidth = Number(line.match(/BANDWIDTH=(\d+)/i)?.[1] || 0);
    const name = line.match(/NAME="([^"]+)"/i)?.[1] || line.match(/NAME=([^,]+)/i)?.[1] || "";
    const resolution = line.match(/RESOLUTION=(\d+)x(\d+)/i);
    const width = Number(resolution?.[1] || 0);
    const height = Number(resolution?.[2] || 0);
    let uri = "";
    for (let next = index + 1; next < lines.length; next += 1) {
      const candidate = lines[next].trim();
      if (!candidate || candidate.startsWith("#")) continue;
      uri = joinURL(baseURL, candidate);
      break;
    }
    if (!uri || /blurred/i.test(name)) continue;
    variants.push({ bandwidth, name, width, height, url: uri });
  }
  return variants;
}

function isMasterPlaylist(text) {
  return /#EXT-X-STREAM-INF:/i.test(String(text || ""));
}

function isLiveMediaPlaylist(text) {
  const value = String(text || "");
  if (!/#EXTM3U/i.test(value) || !/#EXTINF/i.test(value)) return false;
  if (/#EXT-X-MOUFLON-ADVERT|cpa\/v2\//i.test(value)) return false;
  if (/#EXT-X-PLAYLIST-TYPE:\s*VOD/i.test(value)) return false;
  return true;
}

function extractMouflonPkey(text) {
  const match = String(text || "").match(/#EXT-X-MOUFLON:PSCH:v2:([^\r\n]+)/i);
  return match ? String(match[1]).trim().split(/\s+/)[0] : "";
}

function hasQueryParameter(url, name) {
  return new RegExp(`[?&]${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=`, "i").test(String(url || ""));
}

function appendQueryParameter(url, name, value) {
  const separator = String(url).includes("?") ? "&" : "?";
  return `${url}${separator}${name}=${value}`;
}

function liveURL(url, pkey) {
  let value = String(url || "");
  if (!value) return value;
  if (!hasQueryParameter(value, "playlistType")) value = appendQueryParameter(value, "playlistType", "lowLatency");
  if (pkey && !hasQueryParameter(value, "pkey")) {
    if (!hasQueryParameter(value, "psch")) value = appendQueryParameter(value, "psch", "v2");
    value = appendQueryParameter(value, "pkey", pkey);
  }
  return value;
}

function rewriteGrowMediaURL(input) {
  if (!input) return "";
  return String(input).trim().replace(
    /https?:\/\/media-hls\.doppiocdn\.(?:org|com|net)\/b-hls-\d+\//i,
    "https://media-hls.growcdnssedge.com/b-hls-10/"
  );
}


function qualityInfo(label, height, bandwidth) {
  const raw = String(label || "").trim();
  const lower = raw.toLowerCase();
  let numericHeight = Number(height) || 0;
  if (!numericHeight) numericHeight = Number(raw.match(/(\d{3,4})\s*p/i)?.[1] || 0);
  if (/^(source|orig|original|best)$/i.test(raw) || /(?:^|[_ -])(source|orig|original)(?:$|[_ -])/i.test(lower)) {
    return { id: "source", label: "原画", height: Math.max(numericHeight, 2160), bandwidth: Number(bandwidth) || 0 };
  }
  if (numericHeight > 0) {
    return { id: `${numericHeight}p`, label: `${numericHeight}p`, height: numericHeight, bandwidth: Number(bandwidth) || 0 };
  }
  const compact = lower.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36);
  const id = compact || "auto";
  return { id, label: id === "auto" ? "自动" : raw, height: 0, bandwidth: Number(bandwidth) || 0 };
}

function candidateRank(candidate) {
  const height = Number(candidate && candidate.height) || 0;
  if (candidate && candidate.qualityId === "source") return 1000000000000 + (Number(candidate.bandwidth) || 0);
  if (height > 0) return height * 1000000 + (Number(candidate.bandwidth) || 0);
  if (candidate && candidate.qualityId === "auto") return 1;
  return Number(candidate && candidate.bandwidth) || 0;
}

function candidateBetter(left, right) {
  if (!right) return true;
  if (!!left.verified !== !!right.verified) return !!left.verified;
  return candidateRank(left) > candidateRank(right);
}

function dedupeQualityCandidates(candidates) {
  const best = {};
  (candidates || []).forEach((candidate) => {
    if (!candidate || !candidate.url || !candidate.qualityId) return;
    const current = best[candidate.qualityId];
    if (!current || candidateBetter(candidate, current)) best[candidate.qualityId] = candidate;
  });
  return Object.keys(best).map((key) => best[key]).sort((left, right) => candidateRank(right) - candidateRank(left));
}


// Protocol-compliant live path (v5.3): discover only the two source-proven
// master endpoints, preserve real variants, and resolve to Grow CDN at play
// time so native HLS receives ordinary segment URLs instead of MOUFLON tags.
function provenMasterURLs(streamName) {
  const id = String(streamName || "").trim();
  return [
    `https://edge-hls.doppiocdn.org/hls/${id}/master/${id}_auto.m3u8`,
    `https://edge-hls.doppiocdn.com/hls/${id}/master/${id}_auto.m3u8`,
  ];
}

async function discoverMasterCandidates(streamName, config) {
  const errors = [];
  for (const masterURL of provenMasterURLs(streamName)) {
    try {
      const text = String(await httpGet(masterURL, hlsHeaders(config), 8) || "");
      if (!isMasterPlaylist(text)) {
        if (isLiveMediaPlaylist(text) && !/#EXT-X-MOUFLON:URI/i.test(text)) {
          return {
            candidates: [{
              url: masterURL,
              qualityId: "auto",
              qualityLabel: "自动",
              height: 0,
              bandwidth: 0,
              lineId: "direct-media",
              lineTitle: "直播媒体列表",
              source: "variant-only",
              verified: true,
            }],
            masterURL,
            pkey: "",
            errors,
          };
        }
        throw new Error("返回内容不是有效 HLS master/media");
      }
      const pkey = extractMouflonPkey(text);
      if (!pkey) throw new Error("master 没有返回实时 pkey");
      const variants = parseMasterVariants(text, masterURL);
      const candidates = variants.map((variant) => {
        const info = qualityInfo(variant.name, variant.height, variant.bandwidth);
        return {
          url: liveURL(rewriteGrowMediaURL(variant.url), pkey),
          qualityId: info.id,
          qualityLabel: info.label,
          height: info.height,
          bandwidth: info.bandwidth,
          lineId: "grow-live",
          lineTitle: "Grow CDN",
          source: "master-variant",
          verified: false,
        };
      }).filter((candidate) => candidate.url);
      const selected = dedupeQualityCandidates(candidates);
      if (!selected.length) throw new Error("master 没有可用的画质变体");
      return { candidates: selected, masterURL, pkey, errors };
    } catch (error) {
      const host = String(masterURL).match(/^https?:\/\/([^/]+)/i)?.[1] || "unknown";
      errors.push(`master ${host}: ${error && error.message ? error.message : String(error)}`);
    }
  }
  throw new Error(errors.join("；") || "无法获取 Stripchat master HLS");
}

async function discoverLiveCandidates(ref, config) {
  const modelId = String(ref && ref.modelId || "").trim();
  if (!modelId) throw new Error("播放阶段[item]：没有解析到主播 ID");
  try {
    return await discoverMasterCandidates(modelId, config);
  } catch (firstError) {
    const username = String(ref && ref.username || "").trim();
    if (!username) throw new Error(`播放阶段[master]：${firstError.message || firstError}`);
    try {
      const current = await fetchCurrentCam(username, config);
      const streamName = streamNameFromModel(current.model);
      if (!streamName || streamName === modelId) throw firstError;
      return await discoverMasterCandidates(streamName, config);
    } catch (fallbackError) {
      throw new Error(`播放阶段[master/cam]：${fallbackError && fallbackError.message ? fallbackError.message : String(fallbackError)}`);
    }
  }
}

async function verifyLiveCandidate(candidate, config) {
  const text = String(await httpGet(candidate.url, hlsHeaders(config), 8) || "");
  if (!isLiveMediaPlaylist(text)) throw new Error("不是实时媒体列表");
  if (/#EXT-X-MOUFLON:URI/i.test(text)) throw new Error("媒体列表仍包含原生播放器不支持的 MOUFLON URI");
  return { ...candidate, verified: true };
}

function makeVersionId(modelId, lineId, qualityId) {
  return `scv:${encodePart(modelId)}:${encodePart(lineId)}:${encodePart(qualityId)}`;
}

function parseVersionId(value) {
  const text = String(value || "");
  if (!text.startsWith("scv:")) return { modelId: "", lineId: "", qualityId: "" };
  const parts = text.slice(4).split(":");
  return {
    modelId: decodePart(parts[0]),
    lineId: decodePart(parts[1]),
    qualityId: decodePart(parts[2]),
  };
}

function versionTitle(candidate) {
  return candidate.qualityLabel || (candidate.qualityId === "source" ? "原画" : candidate.qualityId || "自动");
}

function buildVersion(modelId, itemId, candidate, index, config) {
  const versionId = makeVersionId(modelId, candidate.lineId, candidate.qualityId);
  return {
    id: versionId,
    title: versionTitle(candidate),
    name: versionTitle(candidate),
    subtitle: `${candidate.lineTitle || "直播线路"} · 切换时请稍候`,
    container: "m3u8",
    sourceName: "Stripchat",
    default: index === 0,
    headers: hlsHeaders(config),
    action: {
      type: "play",
      itemId,
      versionId,
      title: versionTitle(candidate),
    },
  };
}

async function ensureReference(ref, config) {
  if (ref && ref.modelId) return ref;
  const found = await findModel(ref || {}, config);
  if (!found.model) return ref || { modelId: "", username: "", tag: "" };
  return {
    modelId: String(found.model.id !== undefined ? found.model.id : found.model.modelId),
    username: String(found.model.username || found.model.name || found.model.nickname || ""),
    tag: found.tag || ref && ref.tag || "",
  };
}

async function getResourceVersions(ctx) {
  const parsed = parseContext(ctx);
  const rawItem = contextValue(parsed, ["itemId", "videoId", "id", "url", "path"], "");
  const rawVersion = contextValue(parsed, ["versionId", "resourceId", "qualityId", "quality"], "");
  const config = readConfig(parsed);
  let ref = parseItemRef(rawItem);
  const versionRef = parseVersionId(rawVersion);
  if (!ref.modelId && versionRef.modelId) ref = { modelId: versionRef.modelId, username: "", tag: "" };
  ref = await ensureReference(ref, config);
  if (!ref.modelId) return { itemId: rawItem, groups: [] };

  const resolved = await discoverLiveCandidates(ref, config);
  const versions = resolved.candidates.map((candidate, index) => buildVersion(
    ref.modelId,
    rawItem || `sc|${encodePart(ref.modelId)}|${encodePart(ref.username)}|${encodePart(ref.tag)}`,
    candidate,
    index,
    config
  ));
  if (!versions.length) {
    throw new Error("资源阶段[master]：没有发现可用的 Stripchat HLS 画质");
  }
  return {
    itemId: rawItem || `sc|${encodePart(ref.modelId)}|${encodePart(ref.username)}|${encodePart(ref.tag)}`,
    groups: [{ id: "stripchat-quality", title: "直播画质", versions }],
  };
}

function directHLSURL(value) {
  const text = String(value || "").trim();
  return /^https?:\/\/[^\s]+(?:\.m3u8|m3u8)(?:[?#].*)?$/i.test(text) ? text : "";
}

async function resolvePlayback(ctx) {
  const parsed = parseContext(ctx);
  const rawItem = contextValue(parsed, ["itemId", "videoId", "id", "path"], "");
  const rawVersion = contextValue(parsed, ["versionId", "resourceId", "qualityId", "quality"], "");
  const directURL = directHLSURL(contextValue(parsed, ["url", "playUrl", "videoUrl", "mediaUrl", "src"], ""));
  const config = readConfig(parsed);
  if (directURL) {
    return {
      url: directURL,
      container: "m3u8",
      headers: hlsHeaders(config),
      startPositionSeconds: 0,
      isLive: true,
      streamKind: "live",
    };
  }

  const versionRef = parseVersionId(rawVersion);
  let ref = parseItemRef(rawItem);
  if (!ref.modelId && versionRef.modelId) ref = { modelId: versionRef.modelId, username: "", tag: "" };
  ref = await ensureReference(ref, config);
  if (!ref.modelId) throw new Error("没有解析到 Stripchat 主播 ID");

  const resolved = await discoverLiveCandidates(ref, config);
  if (!resolved.candidates.length) {
    throw new Error("播放阶段[master]：Stripchat 没有返回可播放的 HLS 直播流");
  }

  const wantedQuality = versionRef.qualityId || String(contextValue(parsed, ["qualityId", "quality", "resolution"], "")).trim();
  const selected = resolved.candidates.find((candidate) => candidate.qualityId === wantedQuality) || resolved.candidates[0];
  const fallback = selected === resolved.candidates[0] ? resolved.candidates[1] : resolved.candidates[0];
  let playable;
  let firstError = "";
  try {
    playable = await verifyLiveCandidate(selected, config);
  } catch (error) {
    firstError = error && error.message ? error.message : String(error);
  }
  if (!playable && fallback) {
    try {
      playable = await verifyLiveCandidate(fallback, config);
    } catch (error) {
      const secondError = error && error.message ? error.message : String(error);
      throw new Error(`播放阶段[media]：${selected.qualityId} ${firstError}；备用 ${fallback.qualityId} ${secondError}`);
    }
  }
  if (!playable) throw new Error(`播放阶段[media]：${selected.qualityId} ${firstError || "验证失败"}`);
  return {
    url: playable.url,
    container: "m3u8",
    headers: hlsHeaders(config),
    startPositionSeconds: 0,
    isLive: true,
    streamKind: "live",
  };
}


function getManifest() {
  return {
    id: WidgetMetadata.id,
    name: WidgetMetadata.name,
    title: WidgetMetadata.title,
    version: WidgetMetadata.version,
    author: WidgetMetadata.author,
    site: WidgetMetadata.site,
    logo: WidgetMetadata.logo,
    icon: WidgetMetadata.icon,
    description: WidgetMetadata.description,
    capabilities: {
      home: true,
      category: true,
      detail: true,
      search: false,
      resourceVersions: true,
      playback: true,
      resourceMatching: false,
    },
    aggregation: {
      search: false,
      playbackHistory: false,
      resourceMatching: false,
    },
    parameters: [
      {
        name: "cookie",
        title: "Stripchat Cookie",
        type: "input",
        required: false,
        description: "可选。粘贴 stripchat.com 请求中的完整 Cookie；留空使用公开访问权限。Cookie 可能过期，请勿把它写入脚本。",
      },
    ],
  };
}

const api = {
  WidgetMetadata,
  getManifest,
  getHome,
  getHomeSection,
  getCategory,
  getDetail,
  getResourceVersions,
  resolvePlayback,
  home: getHome,
  homeSection: getHomeSection,
  getSection: getHomeSection,
  category: getCategory,
  catalog: getCategory,
  list: getCategory,
  detail: getDetail,
  getVersions: getResourceVersions,
  versions: getResourceVersions,
  resolvePlay: resolvePlayback,
  play: resolvePlayback,
  getPlayback: resolvePlayback,
  getPlayinfo: resolvePlayback,
};

if (typeof globalThis !== "undefined") Object.assign(globalThis, api);
if (typeof module !== "undefined" && module.exports) module.exports = api;
