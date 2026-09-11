(function () {
  "use strict";

  var API_BASES = ["https://zh.stripchat.global", "https://stripchat.com"];
  var REFERER = "https://zh.stripchat.global/";
  var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
  var PAGE_SIZE = 30;

  // Stripchat 的 HLS 现在受 Mouflon v2 保护：媒体清单必须带 psch/pkey 才返回真清单，
  // 且真清单里的分片文件名是加密的。宿主播放器没有解密能力，必须由解密代理还原成标准 HLS。
  //
  // 所有设备统一只走云端 Cloudflare Worker：
  //   - 手机 / 平板 / Mac 行为一致，出问题只看一处日志；
  //   - 不依赖任何一台自己的机器开着机（本地进程只在 Mac 上，且出网要绕节点）；
  //   - PROXY_HOSTS 留成数组是为了将来加备用 Worker，按顺序探测、命中后缓存。
  // 想临时回退到 Mac 本地节点（~/stripchat-mouflon-proxy，127.0.0.1:8787），
  // 把 { base: "http://127.0.0.1:8787", timeout: 2 } 加回数组最前面即可。
  var PROXY_HOSTS = [
    { base: "https://stripchat-mouflon-proxy.douyin-skip-community.workers.dev", timeout: 10 }
  ];
  var proxyBaseCache = null;

  // 解析超时是"加载太久直接闪退"的主因：宿主对 getPlayback 有整体超时，
  // 之前最坏情况会串行等 2 + 10 + 2 秒探测代理、再串行等 3×10 秒直连上游，
  // 加起来 40 秒以上。这里给整个解析过程加一个硬上限，并给失败的流做短缓存，
  // 避免用户反复点击时每次都重跑一遍完整探测。
  var RESOLVE_DEADLINE_MS = 12000;
  // 失败缓存只用来挡住"用户反复点同一个坏直播间"的重复探测。
  // 不能再长：上游抖动几十秒内就会恢复，缓存太久会让重进直播间直接拿到旧错误。
  var FAIL_TTL_MS = 4000;
  var failureCache = {};

  function withDeadline(promise, ms, message) {
    // 宿主若没有 setTimeout 就退化成不加超时，绝不因为兜底逻辑本身抛错。
    if (typeof setTimeout !== "function") return promise;
    var timer = null;
    var guard = new Promise(function (_, reject) {
      timer = setTimeout(function () {
        reject(Host.makeError("TIMEOUT", message, {}));
      }, ms);
    });
    return Promise.race([promise, guard]).then(function (value) {
      if (timer) clearTimeout(timer);
      return value;
    }, function (error) {
      if (timer) clearTimeout(timer);
      throw error;
    });
  }

  // Stripchat 官网的分类是两层结构：
  //   主分类 primaryTag = girls / couples / men / trans
  //   子标签 filterGroupTags = 官网筛选面板里的标签 key
  //
  // 之前只硬编码了 5 个入口，而且靠解析列表接口返回的 blocks 去反查标签 id，
  // 但 /api/front/v2/models 的 blocks 里根本没有 asian 这类标签，
  // 查不到就退化成整个 girls 分类 —— 点「亚洲女主播」看到的其实是全部女主播。
  // 现在直接使用官网筛选面板的标签 key（已逐个实测能真正过滤），分类数量也从 5 个扩到 22 个。
  var CATEGORIES = [
    { id: "girls", title: "女主播", icon: "person.crop.circle", tag: "girls" },
    { id: "girls/new", title: "新主播", icon: "sparkles", tag: "girls/new" },
    { id: "girls/asian", title: "亚洲", icon: "globe.asia.australia", tag: "girls/asian" },
    { id: "girls/chinese", title: "中文主播", icon: "globe.asia.australia", tag: "girls/chinese" },
    { id: "girls/japanese", title: "日本", icon: "globe.asia.australia", tag: "girls/japanese" },
    { id: "girls/korean", title: "韩国", icon: "globe.asia.australia", tag: "girls/korean" },
    { id: "girls/ebony", title: "黑人", icon: "globe", tag: "girls/ebony" },
    { id: "girls/latina", title: "拉丁", icon: "globe.americas", tag: "girls/latina" },
    { id: "girls/mixed", title: "混血", icon: "globe", tag: "girls/mixed" },
    { id: "girls/vr", title: "VR 直播", icon: "visionpro", tag: "girls/vr" },
    { id: "girls/teen", title: "18+ 少女", icon: "sparkles", tag: "girls/teen" },
    { id: "girls/young", title: "青春 22+", icon: "sparkles", tag: "girls/young" },
    { id: "girls/toy", title: "互动玩具", icon: "gamecontroller", tag: "girls/toy" },
    { id: "girls/squirt", title: "潮吹", icon: "drop", tag: "girls/squirt" },
    { id: "girls/masturbation", title: "自慰", icon: "hand.raised", tag: "girls/masturbation" },
    { id: "girls/feet", title: "恋足", icon: "figure.walk", tag: "girls/feet" },
    { id: "girls/anal", title: "肛交", icon: "person.crop.circle", tag: "girls/anal" },
    { id: "girls/cosplay", title: "Cosplay", icon: "theatermasks", tag: "girls/cosplay" },
    { id: "girls/student", title: "学生", icon: "graduationcap", tag: "girls/student" },
    { id: "couples", title: "情侣直播", icon: "person.2", tag: "couples" },
    { id: "men", title: "男主播", icon: "person.crop.circle", tag: "men" },
    { id: "men/gays", title: "男男", icon: "person.2", tag: "men/gays" },
    { id: "men/straight", title: "直男", icon: "person.crop.circle", tag: "men/straight" },
    { id: "trans", title: "跨性别", icon: "person.crop.circle.badge.checkmark", tag: "trans" }
  ];

  // 分类 id -> Stripchat 官网筛选面板的标签 key。
  // 没有条目的（girls / couples / men / trans）就是纯主分类，不带标签过滤。
  var TAG_KEYS = {
    "girls/new": "autoTagNew",
    "girls/asian": "ethnicityAsian",
    "girls/chinese": "tagLanguageChinese",
    "girls/japanese": "tagLanguageJapanese",
    "girls/korean": "tagLanguageKorean",
    "girls/ebony": "ethnicityEbony",
    "girls/latina": "ethnicityLatino",
    "girls/mixed": "ethnicityMultiracial",
    "girls/vr": "autoTagVr",
    "girls/teen": "ageTeen",
    "girls/young": "ageYoung",
    "girls/toy": "autoTagInteractiveToy",
    "girls/squirt": "doSquirt",
    "girls/masturbation": "doMasturbation",
    "girls/feet": "doFootFetish",
    "girls/anal": "doAnal",
    "girls/cosplay": "doCosplay",
    "girls/student": "subcultureStudent",
    "men/gays": "sexGayCouples",
    "men/straight": "orientationStraight"
  };

  function headers(accept) {
    return {
      "User-Agent": UA,
      "Referer": REFERER,
      "Origin": "https://zh.stripchat.global",
      "Accept": accept,
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "X-Requested-With": "XMLHttpRequest"
    };
  }

  function apiHeaders() { return headers("application/json, text/plain, */*"); }
  function playbackHeaders() {
    return {
      "User-Agent": UA,
      "Accept": "application/vnd.apple.mpegurl, application/x-mpegURL, */*"
    };
  }

  async function get(url, requestHeaders, timeout) {
    var response = await Host.http.request({
      request: { url: url, method: "GET", headers: requestHeaders || {}, timeout: timeout || 20 }
    });
    if (!response || Number(response.status || 0) >= 400) {
      throw Host.makeError("UPSTREAM", "HTTP " + String(response && response.status || 0), { url: url });
    }
    return String(response.bodyText || "");
  }

  async function getJSON(url, timeout) {
    var text = await get(url, apiHeaders(), timeout || 20);
    if (/<html[\s>]|cloudflare|cf-chl-|just a moment|access denied/i.test(text)) {
      throw Host.makeError("UPSTREAM", "Stripchat 返回了访问拦截页", { url: url });
    }
    try { return JSON.parse(text); }
    catch (_) { throw Host.makeError("PARSE", "Stripchat API 返回了无效 JSON", { url: url }); }
  }

  async function currentAPI(path, timeout) {
    var last = null;
    for (var i = 0; i < API_BASES.length; i += 1) {
      try { return await getJSON(API_BASES[i] + path, timeout); }
      catch (error) { last = error; }
    }
    throw last || Host.makeError("NETWORK", "Stripchat API 请求失败", { path: path });
  }

  function payload(value) {
    if (Array.isArray(value)) return { models: value };
    if (!value || typeof value !== "object") return {};
    if (Array.isArray(value.models) || Array.isArray(value.blocks)) return value;
    if (value.data !== undefined) return payload(value.data);
    if (value.body !== undefined) return payload(value.body);
    if (value.result !== undefined) return payload(value.result);
    return value;
  }

  function normalizeModel(model) {
    if (!model || typeof model !== "object") return model;
    var nested = model.user && model.user.user && typeof model.user.user === "object"
      ? model.user.user : model.model && typeof model.model === "object" ? model.model : null;
    if (!nested) return model;
    var result = {};
    Object.keys(model).forEach(function (key) { result[key] = model[key]; });
    Object.keys(nested).forEach(function (key) { result[key] = nested[key]; });
    return result;
  }

  function publicLive(model) {
    var status = String(model && model.status || "").toLowerCase();
    return (!status || status === "public") && model.isLive !== false && model.isOnline !== false;
  }

  // /api/front/v2/* 返回的是相对路径（/previews/... 、/avatars/...），
  // /api/front/models 返回的是绝对路径。两种都要能用。
  var IMAGE_BASE = "https://static-proxy.strpst.com";

  function absoluteImage(value) {
    var text = String(value || "").trim();
    if (text.indexOf("//") === 0) return "https:" + text;
    if (text.charAt(0) === "/") return IMAGE_BASE + text;
    return text;
  }

  // Stripchat 同一张预览图有 4 档，路径只差结尾的尺寸后缀：
  //   -thumb-small  200x150（官网列表接口默认返回的就是这一档，铺到卡片上会发糊）
  //   -thumb-big    400x300
  //   -full        1000x750
  //   无后缀         竖版摄像头原始快照（1000+ x 2500+），比例不适合当封面
  // 列表用 -thumb-big：像素是原来的 4 倍，单张也才 ~25KB，30 个房间多拉约 0.5MB；
  // 详情页一次只显示一张，直接上 -full，和官网打开房间看到的大图一致。
  function upgradeImage(value, full) {
    var url = absoluteImage(value);
    if (!url) return url;
    if (url.indexOf("-thumb-small") >= 0) url = url.replace(/-thumb-small/g, "-thumb-big");
    if (full && url.indexOf("-thumb-big") >= 0) url = url.replace(/-thumb-big/g, "-full");
    return url;
  }

  function roomDTO(model, detail) {
    model = normalizeModel(model || {});
    var username = String(model.username || model.name || model.nickname || "未命名主播");
    var modelId = String(model.id !== undefined ? model.id : model.modelId || "");
    var cover = upgradeImage(model.snapshotUrl || model.previewUrlThumbBig || model.previewUrlThumbSmall || model.avatarUrl || model.previewUrl || model.image, detail);
    var avatar = absoluteImage(model.avatarUrl || model.previewUrlThumbSmall || cover);
    var viewers = model.viewersCount !== undefined ? model.viewersCount : model.viewers;
    return {
      userName: username,
      roomTitle: username + " 的直播",
      roomCover: cover,
      userHeadImg: avatar,
      liveState: publicLive(model) ? "1" : "0",
      userId: username,
      roomId: modelId || username,
      liveWatchedCount: viewers === undefined || viewers === null ? "" : String(viewers)
    };
  }

  function primaryTag(tag) {
    var value = String(tag || "girls").split("/")[0].toLowerCase();
    return ["girls", "couples", "men", "trans"].indexOf(value) >= 0 ? value : "girls";
  }

  function categoryTagKey(tag) {
    return TAG_KEYS[String(tag || "")] || "";
  }

  async function requestModels(tag, key, offset) {
    var parts = [
      "removeShows=true", "recInFeatured=false", "limit=" + PAGE_SIZE, "offset=" + offset,
      "primaryTag=" + encodeURIComponent(primaryTag(tag)), "sortBy=stripRanking", "userRole=user",
      "nic=true", "byw=false", "rcmGrp=N", "rbCnGr=true", "iem=true", "decMb=true",
      "ctryTop=true", "mlfv=false", "rectf=false", "eab=false", "sac=false"
    ];
    if (key) {
      parts.push("filterGroupTags=" + encodeURIComponent(JSON.stringify([[key]])));
      parts.push("parentTag=" + encodeURIComponent(key));
    }
    parts.push("uniq=" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    var root = payload(await currentAPI("/api/front/models?" + parts.join("&"), 20));
    var models = root.models || root.items || root.users || root.results || [];
    return models.map(normalizeModel).filter(publicLive);
  }

  async function fetchModels(tag, page) {
    page = Math.max(1, Number(page) || 1);
    var offset = (page - 1) * PAGE_SIZE;
    var key = categoryTagKey(tag);
    var models = await requestModels(tag, key, offset);
    // 带标签的分类偶尔会返回空列表（Stripchat 标签接口抖动 / 反爬），
    // 空结果重试一次，避免用户看到"这个分类没人直播"的假象。
    if (key && !models.length) models = await requestModels(tag, key, offset);
    return models;
  }

  function currentCam(value, username) {
    var root = payload(value);
    var user = root.user && root.user.user && typeof root.user.user === "object" ? root.user.user
      : root.user && typeof root.user === "object" ? root.user
        : root.model && typeof root.model === "object" ? root.model : {};
    var cam = root.cam && typeof root.cam === "object" ? root.cam : {};
    var model = {};
    Object.keys(cam).forEach(function (key) { model[key] = cam[key]; });
    Object.keys(user).forEach(function (key) { model[key] = user[key]; });
    if (!model.username) model.username = username;
    return model;
  }

  async function fetchCam(username) {
    var name = String(username || "").trim();
    if (!name) throw Host.makeError("INVALID_ARGUMENT", "缺少主播用户名", {});
    var path = "/api/front/v2/models/username/" + encodeURIComponent(name) + "/cam?triggerRequest=loadCam&uniq=" + Date.now().toString(36);
    return currentCam(await currentAPI(path, 20), name);
  }

  function streamName(model) {
    var values = [model && model.streamName, model && model.stream_name,
      model && model.cam && model.cam.streamName, model && model.stream && model.stream.streamName];
    for (var i = 0; i < values.length; i += 1) if (String(values[i] || "").trim()) return String(values[i]).trim();
    return "";
  }

  function localHeaders() {
    return { "Accept": "application/vnd.apple.mpegurl, application/x-mpegURL, */*" };
  }

  // 直接用 index.json 当健康检查：省掉一次 /health 往返，能播时只发一个请求。
  async function proxyQualitiesAt(candidate, streamId, bust) {
    var url = candidate.base + "/play/" + encodeURIComponent(streamId) + "/index.json";
    if (bust) url += "?v=" + Date.now().toString(36);
    var response = await Host.http.request({
      request: { url: url, method: "GET", headers: { "Accept": "application/json" }, timeout: candidate.timeout || 5 }
    });
    if (!response || Number(response.status || 0) !== 200) {
      var status = Number(response && response.status || 0);
      // 404 是 Worker 明确告诉我们"四个 CDN 域名全部 404"= 主播确实没播；
      // 其余状态码（502/超时/5xx）只是这一跳的抖动，不能当成下播。
      var code = status === 404 ? "OFFLINE" : "PROXY";
      throw Host.makeError(code, "Mouflon 解密代理无响应 (HTTP " + String(status) + ")", { url: url });
    }
    var data = null;
    try { data = JSON.parse(String(response.bodyText || "")); }
    catch (_) { throw Host.makeError("PROXY", "Mouflon 解密代理返回了无效 JSON", { url: url }); }
    var variants = data && data.variants || [];
    if (!variants.length) throw Host.makeError("PROXY", "Mouflon 解密代理未返回可用画质", { url: url });
    return variants.map(function (item) {
      return { title: item.title || item.name || "自动", qn: item.height || 0, url: item.url, local: true };
    }).sort(function (a, b) { return b.qn - a.qn; });
  }

  async function proxyQualities(streamId, bust) {
    // 命中过的代理排在最前，其余按配置顺序兜底。
    var order = [];
    if (proxyBaseCache) order.push(proxyBaseCache);
    for (var i = 0; i < PROXY_HOSTS.length; i += 1) {
      if (!proxyBaseCache || PROXY_HOSTS[i].base !== proxyBaseCache.base) order.push(PROXY_HOSTS[i]);
    }
    var last = null;
    for (var j = 0; j < order.length; j += 1) {
      try {
        var list = await proxyQualitiesAt(order[j], streamId, bust);
        proxyBaseCache = order[j];
        return list;
      } catch (error) {
        last = error;
        if (error && error.code === "OFFLINE") throw error;
        if (proxyBaseCache && order[j].base === proxyBaseCache.base) proxyBaseCache = null;
      }
    }
    throw last || Host.makeError("PROXY", "Mouflon 解密代理不可达", {});
  }

  // cam 接口（/api/front/v2/models/username/<name>/cam）经常被 Stripchat 的反爬拦截，
  // 实测会稳定返回 HTTP 418。以前只要这个接口失败，getLiveState 就直接上报 "0"，
  // 宿主拿到 "0" 会认为主播已经下播，把正在播放的流掐掉——表现就是画面播着播着
  // 突然冻住不动，"打开前两个直播间正常、切到第三个就开始卡"也是同一个原因
  // （轮询下播的时机不同而已）。
  //
  // 现在改成：宿主说在播就直接确认；只要有任何不确定，就用云端解密代理去探真实清单
  // （探得到 = 在播），谁都问不到时返回 "3"（未知），交给宿主的 liveStateFailureFallback
  // 处理，绝不会把正在播的流误判成下播。
  var LIVE_STATE_DEADLINE_MS = 6000;

  async function proxyLiveStateAt(candidate, streamId) {
    var url = candidate.base + "/play/" + encodeURIComponent(streamId) + "/index.json";
    try {
      var response = await Host.http.request({
        request: { url: url, method: "GET", headers: { "Accept": "application/json" }, timeout: candidate.timeout || 5 }
      });
      var status = Number(response && response.status || 0);
      if (status === 200) return "1";
      // 只有 404 才是"真的没播"：Worker 会先探四个 CDN 域名，全部 404 才回 404。
      if (status === 404) return "0";
      // 502 是这一跳的抖动（上游 403 / 超时 / 限流），不代表主播下播。
      // 这里绝不能返回 "0"：宿主拿到 "0" 会立刻把正在播放的流掐掉，
      // 表现就是画面播着播着突然冻住不动。
      return "3";
    } catch (_) {
      // 连代理都连不上，属于"不知道"，不能当成下播。
      return "3";
    }
  }

  async function probeLiveViaProxy(streamId) {
    if (!streamId) return "3";
    var order = [];
    if (proxyBaseCache) order.push(proxyBaseCache);
    for (var i = 0; i < PROXY_HOSTS.length; i += 1) {
      if (!proxyBaseCache || PROXY_HOSTS[i].base !== proxyBaseCache.base) order.push(PROXY_HOSTS[i]);
    }
    for (var j = 0; j < order.length; j += 1) {
      var state = await proxyLiveStateAt(order[j], streamId);
      if (state !== "3") return state;
    }
    return "3";
  }

  async function qualitiesFor(streamId) {
    var cached = failureCache[streamId];
    if (cached && Date.now() - cached.at < FAIL_TTL_MS) throw cached.error;
    try {
      return await withDeadline(resolveQualities(streamId), RESOLVE_DEADLINE_MS,
        "解析直播地址超过 " + Math.round(RESOLVE_DEADLINE_MS / 1000) + " 秒，已中止（主播可能刚开播或网络受限）");
    } catch (error) {
      failureCache[streamId] = { at: Date.now(), error: error };
      throw error;
    }
  }

  // 起播前先真的拉一次媒体清单。
  //
  // 代理的 index.json 只能说明"主播在播"，不代表这一刻真能拿到清单：
  // 上游 CDN 抖动时 index.json 是 200、媒体清单却是 502（实测能连续失败几十秒）。
  // 旧版本遇到这种情况会回退到"上游 master + pkey"的地址——那个地址看起来是好的，
  // 但分片文件名仍是 Mouflon 加密串，播放器永远拿不到分片，于是无限转圈。
  // 现在只把"刚刚真的拉到过清单"的画质返回给宿主。
  async function verifyQuality(quality) {
    try {
      var response = await Host.http.request({
        request: { url: quality.url, method: "GET", headers: localHeaders(), timeout: 8 }
      });
      if (Number(response && response.status || 0) !== 200) return null;
      if (String(response.bodyText || "").indexOf("#EXTM3U") < 0) return null;
      return quality;
    } catch (_) { return null; }
  }

  async function verifyQualities(list) {
    if (!list || !list.length) return [];
    // 画质之间并发验证，多验几个画质只多几十毫秒，不会拖长起播。
    var checked = await Promise.all(list.map(function (quality) { return verifyQuality(quality); }));
    return checked.filter(function (item) { return !!item; });
  }

  async function resolveQualities(streamId) {
    var last = null;
    for (var attempt = 0; attempt < 2; attempt += 1) {
      try {
        // 第二次重试带 cache-buster，绕开边缘上可能已经缓存的失败结果。
        var list = await proxyQualities(streamId, attempt > 0);
        var playable = await verifyQualities(list);
        if (playable.length) return playable;
        last = Host.makeError("UPSTREAM", "云端解密代理暂时拉不到媒体清单", { streamId: streamId });
      } catch (error) {
        last = error;
        // 代理明确说主播没播（四个 CDN 域名全 404）时不必重试。
        if (error && error.code === "OFFLINE") break;
      }
    }
    throw last || Host.makeError("UPSTREAM", "没有可用的 Stripchat 线路", { streamId: streamId });
  }

  async function resolveRoom(roomId, userId) {
    var username = String(userId || "").trim();
    if (username) return await fetchCam(username);
    return { id: roomId, username: roomId, status: "public", isLive: true };
  }

  function parseShare(value) {
    var text = String(value || "");
    var match = text.match(/(?:https?:\/\/)?(?:[a-z]+\.)?stripchat\.(?:com|global)\/([^\s/?#]+)/i);
    return match ? decodeURIComponent(match[1]) : text.trim().replace(/^@/, "");
  }

  globalThis.LiveParsePlugin = {
    apiVersion: 1,

    getCategories: function () {
      return [{
        id: "stripchat",
        title: "Stripchat",
        icon: "play.tv",
        biz: "public",
        subList: CATEGORIES.map(function (item) {
          return { id: item.id, parentId: "stripchat", title: item.title, icon: item.icon, biz: item.tag };
        })
      }];
    },

    getRooms: async function (input) {
      var tag = String(input && (input.biz || input.id) || "girls");
      var models = await fetchModels(tag, input && input.page || 1);
      return models.map(roomDTO);
    },

    search: async function (input) {
      var keyword = String(input && input.keyword || "").trim().toLowerCase();
      if (!keyword) return [];
      var groups = ["girls", "couples", "men"], all = [];
      var page = input && input.page || 1;
      // 三组并发拉取，串行的话要等三个 API 往返。
      var results = await Promise.all(groups.map(function (group) {
        return fetchModels(group, page).catch(function () { return []; });
      }));
      for (var i = 0; i < results.length; i += 1) all = all.concat(results[i]);
      var seen = {};
      return all.filter(function (model) {
        var name = String(model.username || model.name || model.nickname || "").toLowerCase();
        var id = String(model.id !== undefined ? model.id : model.modelId || name);
        if (seen[id] || name.indexOf(keyword) < 0) return false;
        seen[id] = true; return true;
      }).map(roomDTO);
    },

    getRoomDetail: async function (input) {
      var model = await resolveRoom(input && input.roomId, input && input.userId);
      return roomDTO(model, true);
    },

    getLiveState: async function (input) {
      var roomId = String(input && input.roomId || "").trim();
      var username = String(input && input.userId || "").trim();
      try {
        var model = await withDeadline(resolveRoom(roomId, username), LIVE_STATE_DEADLINE_MS,
          "直播状态查询超过 " + Math.round(LIVE_STATE_DEADLINE_MS / 1000) + " 秒");
        if (publicLive(model)) return { liveState: "1" };
      } catch (_) { /* cam 被反爬拦截或超时，下面用代理判断，绝不因此报"已下播" */ }
      // cam 明确说不在播、或 cam 根本问不到时，都以云端代理探测到的真实清单为准。
      return { liveState: await probeLiveViaProxy(roomId || username) };
    },

    getPlayback: async function (input) {
      var roomId = String(input && input.roomId || "").trim();
      var username = String(input && input.userId || "").trim();
      if (!roomId && !username) throw Host.makeError("INVALID_ARGUMENT", "缺少直播流 ID", {});

      // 列表返回的 roomId 就是通常可用的流 ID。先直接解析，避免播放强依赖
      // Stripchat cam API；只有 roomId 过期/不匹配时才用用户名查询新流 ID。
      var qualitys = null;
      var directError = null;
      if (roomId) {
        try { qualitys = await qualitiesFor(roomId); }
        catch (error) { directError = error; }
      }
      if (!qualitys && username) {
        try {
          var model = await fetchCam(username);
          if (!publicLive(model)) throw Host.makeError("NOT_LIVE", "主播当前不是公开直播", { username: username });
          var currentStreamId = streamName(model);
          if (!currentStreamId) throw Host.makeError("NOT_LIVE", "主播当前没有可用直播流", { username: username });
          qualitys = await qualitiesFor(currentStreamId);
        } catch (fallbackError) {
          throw directError || fallbackError;
        }
      }
      if (!qualitys) throw directError || Host.makeError("NOT_LIVE", "没有可用直播流", { roomId: roomId });
      return [{
        cdn: "stripchat-official",
        displayName: "Stripchat 官方线路",
        requestContext: { roomId: roomId, userId: username },
        qualitys: qualitys.map(function (quality) {
          return {
            roomId: roomId,
            title: quality.title,
            qn: quality.qn,
            url: quality.url,
            liveCodeType: "m3u8",
            liveType: "stripchat",
            userAgent: UA,
            headers: quality.local ? localHeaders() : playbackHeaders(),
            requestContext: { roomId: roomId, userId: username },
            // avPlayer 是唯一稳定跑通的引擎：它用 HTTP/2、按原样请求分片地址。
            // mePlayer 会把分片 URL 截断（约 190 字符上限），拿不到 u 参数就一路 400，
            // 重试 8 次后整个播放线程卡死，表现就是"播一两分钟后画面卡住不动"。
            // 同时不要声明 lowLatency：低延迟模式只留 2~3 秒缓冲，任何抖动都会直接断流。
            playbackHints: {
              streamFormat: "hlsLive",
              preferredEngines: ["avPlayer"],
              isLive: true,
              requiresCustomSegmentLoader: false,
              selectionBehavior: "direct"
            }
          };
        })
      }];
    },

    resolveShare: async function (input) {
      var username = parseShare(input && input.shareCode);
      if (!username) throw Host.makeError("INVALID_ARGUMENT", "无法识别 Stripchat 分享链接", {});
      return roomDTO(await fetchCam(username));
    }
  };
})();
