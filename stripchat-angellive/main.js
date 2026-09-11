(function () {
  "use strict";

  var API_BASES = ["https://zh.stripchat.global", "https://stripchat.com"];
  var REFERER = "https://zh.stripchat.global/";
  var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
  var PAGE_SIZE = 30;

  // Stripchat 的 HLS 现在受 Mouflon v2 保护：媒体清单必须带 psch/pkey 才返回真清单，
  // 且真清单里的分片文件名是加密的。宿主播放器没有解密能力，所以由本地代理
  // （~/stripchat-mouflon-proxy，launchd 常驻 127.0.0.1:8787）还原成标准 HLS。
  // 解密代理候选项，按顺序探测，命中后缓存：
  //   1. 本机回环——Mac 上的 AngelLive 用它，走本地进程、不消耗云端额度；
  //   2. Cloudflare Worker——常驻在云上，iPad / iPhone / 任何设备都能用，不需要 Mac 开机；
  //   3. Mac 的 Bonjour 名——局域网兜底（Worker 万一挂了时用）。
  // Bonjour 名 = `scutil --get LocalHostName` + ".local"。
  var PROXY_HOSTS = [
    { base: "http://127.0.0.1:8787", timeout: 3 },
    { base: "https://stripchat-mouflon-proxy.douyin-skip-community.workers.dev", timeout: 8 },
    { base: "http://huangzls-MacBook-Air.local:8787", timeout: 5 }
  ];
  var proxyBaseCache = null;

  var CATEGORIES = [
    { id: "girls", title: "女主播", icon: "person.crop.circle", tag: "girls" },
    { id: "girls/new", title: "最新女主播", icon: "sparkles", tag: "girls/new" },
    { id: "girls/asian", title: "亚洲女主播", icon: "globe.asia.australia", tag: "girls/asian" },
    { id: "couples", title: "情侣直播", icon: "person.2", tag: "couples" },
    { id: "men", title: "男主播", icon: "person.crop.circle", tag: "men" }
  ];

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
  function hlsHeaders() { return headers("application/vnd.apple.mpegurl, application/x-mpegURL, */*"); }
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

  function absoluteImage(value) {
    var text = String(value || "").trim();
    return text.indexOf("//") === 0 ? "https:" + text : text;
  }

  function roomDTO(model) {
    model = normalizeModel(model || {});
    var username = String(model.username || model.name || model.nickname || "未命名主播");
    var modelId = String(model.id !== undefined ? model.id : model.modelId || "");
    var cover = absoluteImage(model.snapshotUrl || model.previewUrlThumbBig || model.previewUrlThumbSmall || model.avatarUrl || model.previewUrl || model.image);
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

  async function tagKey(tag) {
    if (String(tag).indexOf("/") < 0) return "";
    var path = "/api/front/v2/models?primaryTag=" + encodeURIComponent(primaryTag(tag))
      + "&limit=24&topLimit=61&favoritesLimit=24&msBlock=true&removeShows=true&nic=true&uniq=" + Date.now().toString(36);
    var blocks = payload(await currentAPI(path, 20)).blocks || [];
    for (var i = 0; i < blocks.length; i += 1) {
      if (String(blocks[i] && blocks[i].url || "") === String(tag)) {
        var id = String(blocks[i].tagId || "");
        return id.indexOf(".") >= 0 ? id.split(".").pop() : id;
      }
    }
    return "";
  }

  async function fetchModels(tag, page) {
    page = Math.max(1, Number(page) || 1);
    var offset = (page - 1) * PAGE_SIZE;
    var key = await tagKey(tag);
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
    parts.push("uniq=" + Date.now().toString(36));
    var root = payload(await currentAPI("/api/front/models?" + parts.join("&"), 20));
    var models = root.models || root.items || root.users || root.results || [];
    return models.map(normalizeModel).filter(publicLive);
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

  function joinURL(base, value) {
    if (/^https?:\/\//i.test(value)) return value;
    if (String(value).indexOf("//") === 0) return "https:" + value;
    var origin = String(base).match(/^(https?:\/\/[^/]+)/i);
    if (String(value).indexOf("/") === 0) return (origin ? origin[1] : "") + value;
    return String(base).replace(/[^/]*(?:\?.*)?$/, "") + value;
  }

  function variants(text, base) {
    var lines = String(text || "").split(/\r?\n/), result = [];
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i].trim();
      if (!/^#EXT-X-STREAM-INF:/i.test(line)) continue;
      var bandwidth = Number((line.match(/BANDWIDTH=(\d+)/i) || [])[1] || 0);
      var name = (line.match(/NAME="([^"]+)"/i) || line.match(/NAME=([^,]+)/i) || [])[1] || "";
      var resolution = line.match(/RESOLUTION=(\d+)x(\d+)/i);
      var height = Number(resolution && resolution[2] || 0), uri = "";
      for (var j = i + 1; j < lines.length; j += 1) {
        var candidate = lines[j].trim();
        if (candidate && candidate.charAt(0) !== "#") { uri = joinURL(base, candidate); break; }
      }
      if (uri && !/blurred/i.test(name)) result.push({ name: name, height: height, bandwidth: bandwidth, url: uri });
    }
    return result;
  }

  function append(url, name, value) {
    if (new RegExp("[?&]" + name + "=", "i").test(url)) return url;
    return url + (url.indexOf("?") >= 0 ? "&" : "?") + name + "=" + encodeURIComponent(value);
  }

  function playableURL(url, pkey) {
    // Keep the exact CDN host and path returned by Stripchat's signed master.
    // Rewriting b-hls-* to another CDN breaks TLS/routing in Angel Live and can
    // also detach the pkey from the network context that issued it.
    var result = String(url);
    result = append(result, "playlistType", "lowLatency");
    result = append(result, "psch", "v2");
    return append(result, "pkey", pkey);
  }

  function localHeaders() {
    return { "Accept": "application/vnd.apple.mpegurl, application/x-mpegURL, */*" };
  }

  async function proxyHealth(candidate) {
    var response = await Host.http.request({
      request: {
        url: candidate.base + "/health",
        method: "GET",
        headers: { "Accept": "application/json" },
        timeout: candidate.timeout || 5
      }
    });
    if (!response || Number(response.status || 0) !== 200) {
      throw Host.makeError("PROXY", "Mouflon 解密代理健康检查失败", { url: candidate.base });
    }
    return true;
  }

  async function resolveProxyBase() {
    if (proxyBaseCache) {
      try { await proxyHealth(proxyBaseCache); return proxyBaseCache.base; }
      catch (_) { proxyBaseCache = null; }
    }
    var last = null;
    for (var i = 0; i < PROXY_HOSTS.length; i += 1) {
      try { await proxyHealth(PROXY_HOSTS[i]); proxyBaseCache = PROXY_HOSTS[i]; return PROXY_HOSTS[i].base; }
      catch (error) { last = error; }
    }
    throw last || Host.makeError("PROXY", "Mouflon 解密代理不可达", {});
  }

  async function proxyQualities(streamId) {
    var base = await resolveProxyBase();
    var url = base + "/play/" + encodeURIComponent(streamId) + "/index.json";
    var response = await Host.http.request({
      request: { url: url, method: "GET", headers: { "Accept": "application/json" }, timeout: 8 }
    });
    if (!response || Number(response.status || 0) !== 200) {
      throw Host.makeError("PROXY", "本地 Mouflon 代理无响应 (HTTP " + String(response && response.status || 0) + ")", { url: url });
    }
    var data = null;
    try { data = JSON.parse(String(response.bodyText || "")); }
    catch (_) { throw Host.makeError("PROXY", "本地 Mouflon 代理返回了无效 JSON", { url: url }); }
    var variants = data && data.variants || [];
    if (!variants.length) throw Host.makeError("PROXY", "本地 Mouflon 代理未返回可用画质", { url: url });
    return variants.map(function (item) {
      return { title: item.title || item.name || "自动", qn: item.height || 0, url: item.url, local: true };
    }).sort(function (a, b) { return b.qn - a.qn; });
  }

  async function qualitiesFor(streamId) {
    var last = null;
    try { return await proxyQualities(streamId); }
    catch (error) { last = error; }
    try { return await discover(streamId); }
    catch (error) { last = error; }
    throw last;
  }

  async function discover(streamId) {
    var hosts = [
      "edge-hls.doppiocdn.org",
      "edge-hls.doppiocdn.com",
      "edge-hls.doppiocdn.media"
    ], last = null;
    for (var h = 0; h < hosts.length; h += 1) {
      var master = "https://" + hosts[h] + "/hls/" + streamId + "/master/" + streamId + "_auto.m3u8";
      try {
        var text = await get(master, hlsHeaders(), 10);
        var match = text.match(/#EXT-X-MOUFLON:PSCH:v2:([^\r\n]+)/i);
        if (!match) throw new Error("master 未返回 pkey");
        var pkey = String(match[1]).trim().split(/\s+/)[0];
        var list = variants(text, master);
        if (!list.length) throw new Error("master 未返回画质");
        return list.map(function (item) {
          var title = item.height ? String(item.height) + "p" : item.name || "自动";
          return { title: title, qn: item.height || 0, url: playableURL(item.url, pkey) };
        }).sort(function (a, b) { return b.qn - a.qn; });
      } catch (error) { last = error; }
    }
    throw last || Host.makeError("UPSTREAM", "无法获取 Stripchat HLS", { streamId: streamId });
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
      for (var i = 0; i < groups.length; i += 1) all = all.concat(await fetchModels(groups[i], input && input.page || 1));
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
      return roomDTO(model);
    },

    getLiveState: async function (input) {
      try {
        var model = await resolveRoom(input && input.roomId, input && input.userId);
        return { liveState: publicLive(model) ? "1" : "0" };
      } catch (_) { return { liveState: "0" }; }
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
            playbackHints: {
              streamFormat: "hlsLive",
              latencyMode: "lowLatency",
              preferredEngines: ["avPlayer", "mePlayer"],
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
