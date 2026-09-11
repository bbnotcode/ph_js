const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const model = {
  id: "123456",
  username: "demo_user",
  status: "public",
  isLive: true,
  isOnline: true,
  snapshotUrl: "//img.example/demo.jpg",
  viewersCount: 42,
  streamName: "123456"
};

const master = [
  "#EXTM3U",
  "#EXT-X-MOUFLON:PSCH:v2:test-pkey",
  '#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1920x1080,NAME="1080p"',
  "https://media-hls.doppiocdn.org/b-hls-21/123456/1080p/playlist.m3u8?token=x",
  '#EXT-X-STREAM-INF:BANDWIDTH=900000,RESOLUTION=1280x720,NAME="720p"',
  "https://media-hls.doppiocdn.org/b-hls-21/123456/720p/playlist.m3u8?token=x"
].join("\n");

let camRequests = 0;
let failCam = false;
let camOffline = false;
let proxyAvailable = false;
let indexStatus = 200;
let playlistFailures = 0;
let proxyHost = "stripchat-mouflon-proxy.douyin-skip-community.workers.dev";
const masterHosts = [];
const proxyRequests = [];
const modelRequests = [];
const playlistRequests = [];

const context = {
  console,
  Date,
  JSON,
  encodeURIComponent,
  decodeURIComponent,
  Host: {
    makeError(code, message, details) {
      const error = new Error(message);
      error.code = code;
      error.details = details;
      return error;
    },
    http: {
      async request(options) {
        assert.strictEqual(options.authMode, undefined, "public requests must not request managed cookies");
        assert.strictEqual(options.platformId, undefined, "public requests must not nominate a credential owner");
        const url = options.request.url;
        if (url.includes("/health")) {
          const host = new URL(url).host;
          if (!proxyAvailable || host.toLowerCase() !== proxyHost.toLowerCase()) throw new Error("connect ECONNREFUSED " + host);
          return { status: 200, bodyText: JSON.stringify({ ok: true }) };
        }
        if (url.includes("/index.json")) {
          if (!proxyAvailable || new URL(url).host.toLowerCase() !== proxyHost.toLowerCase()) throw new Error("connect ECONNREFUSED " + new URL(url).host);
          proxyRequests.push(url);
          assert.strictEqual(options.request.headers.Accept, "application/json");
          if (indexStatus !== 200) return { status: indexStatus, bodyText: JSON.stringify({ error: "model-offline" }) };
          return {
            status: 200,
            bodyText: JSON.stringify({
              streamId: "123456",
              pkey: "test-pkey",
              variants: [
                { name: "1080p", height: 1080, bandwidth: 2000000, title: "1080p", url: "http://" + proxyHost + "/play/123456/1080p.m3u8" },
                { name: "720p", height: 720, bandwidth: 900000, title: "720p", url: "http://" + proxyHost + "/play/123456/720p.m3u8" }
              ]
            })
          };
        }
        if (url.includes("_auto.m3u8")) {
          const host = new URL(url).hostname;
          masterHosts.push(host);
          throw new Error("插件不应再把未解密的上游 master 交给播放器: " + host);
        }
        if (url.endsWith(".m3u8")) {
          playlistRequests.push(url);
          if (playlistFailures > 0) {
            playlistFailures -= 1;
            return { status: 502, bodyText: "上游媒体清单不可用（已重试多个 CDN 节点）" };
          }
          assert.strictEqual(options.request.headers.Accept, "application/vnd.apple.mpegurl, application/x-mpegURL, */*");
          return { status: 200, bodyText: "#EXTM3U\n#EXT-X-TARGETDURATION:2\n#EXT-X-MEDIA-SEQUENCE:1\nhttps://media-hls.doppiocdn.org/b-hls-16/123456/123456_1_abc.mp4\n" };
        }
        if (url.includes("/api/front/v2/models/username/")) {
          camRequests += 1;
          if (failCam) throw new Error("cam endpoint unavailable");
          const camModel = camOffline ? Object.assign({}, model, { status: "offline", isLive: false }) : model;
          return { status: 200, bodyText: JSON.stringify({ user: { user: camModel }, cam: { streamName: "123456" } }) };
        }
        if (url.includes("/api/front/v2/models?")) {
          return { status: 200, bodyText: JSON.stringify({ blocks: [] }) };
        }
        if (url.includes("/api/front/models?")) {
          modelRequests.push(url);
          return { status: 200, bodyText: JSON.stringify({ models: [model] }) };
        }
        throw new Error("Unexpected URL: " + url);
      }
    }
  }
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(__dirname + "/main.js", "utf8"), context);

async function expectFailure(label, task) {
  let failed = false;
  try { await task(); } catch (_) { failed = true; }
  assert.ok(failed, label + "：必须抛错而不是返回结果");
}

(async () => {
  const plugin = context.LiveParsePlugin;
  assert.strictEqual(plugin.apiVersion, 1);
  const categories = plugin.getCategories()[0].subList;
  assert.ok(categories.length >= 15, "分类数量应该覆盖官网主要分类/标签，实际 " + categories.length);
  const categoryIds = categories.map((item) => item.id);
  assert.ok(categoryIds.indexOf("girls/asian") >= 0, "必须保留亚洲分类");
  assert.strictEqual(new Set(categoryIds).size, categoryIds.length, "分类 id 不能重复");

  // 标签分类必须真的带 filterGroupTags，否则点进去看到的是全部女主播。
  modelRequests.length = 0;
  await plugin.getRooms({ id: "girls/asian", page: 1 });
  assert.strictEqual(modelRequests.length, 1);
  assert.ok(modelRequests[0].includes("primaryTag=girls"), "标签分类仍要带主分类");
  assert.ok(
    modelRequests[0].includes("filterGroupTags=" + encodeURIComponent(JSON.stringify([["ethnicityAsian"]]))),
    "亚洲分类必须真的用 ethnicityAsian 过滤：" + modelRequests[0]
  );

  // 纯主分类不能被塞进标签过滤
  modelRequests.length = 0;
  await plugin.getRooms({ id: "couples", page: 1 });
  assert.ok(!modelRequests[0].includes("filterGroupTags"), "主分类不应带标签过滤");

  const rooms = await plugin.getRooms({ id: "girls", page: 1 });
  assert.strictEqual(rooms.length, 1);
  assert.strictEqual(rooms[0].liveState, "1");
  assert.strictEqual(rooms[0].userId, "demo_user");

  // 封面清晰度：官网列表接口只返回 200x150 的 -thumb-small，
  // 直接铺到卡片上会发糊，必须升到 400x300 的 -thumb-big。
  const savedSnapshot = model.snapshotUrl;
  delete model.snapshotUrl;
  model.avatarUrl = "https://static-proxy.strpst.com/avatars/4/5/7/hash-full";
  model.previewUrlThumbSmall = "https://static-proxy.strpst.com/previews/a/7/8/hash-thumb-small";
  const listWithThumb = await plugin.getRooms({ id: "girls", page: 1 });
  assert.strictEqual(
    listWithThumb[0].roomCover,
    "https://static-proxy.strpst.com/previews/a/7/8/hash-thumb-big",
    "-thumb-small 必须升到 -thumb-big"
  );

  // 详情页一次只显示一张图，直接给 1000x750 的 -full，和官网大图一致。
  const hdDetail = await plugin.getRoomDetail({ roomId: "123456", userId: "demo_user" });
  assert.strictEqual(
    hdDetail.roomCover,
    "https://static-proxy.strpst.com/previews/a/7/8/hash-full",
    "详情封面必须升到 -full"
  );

  // /api/front/v2/* 返回的是相对路径，必须补上图片域名，否则是空封面。
  model.previewUrlThumbSmall = "/previews/a/7/8/hash-thumb-small";
  const listWithRelative = await plugin.getRooms({ id: "girls", page: 1 });
  assert.strictEqual(
    listWithRelative[0].roomCover,
    "https://static-proxy.strpst.com/previews/a/7/8/hash-thumb-big",
    "相对路径必须补成绝对地址"
  );
  delete model.avatarUrl;
  delete model.previewUrlThumbSmall;
  model.snapshotUrl = savedSnapshot;

  const detail = await plugin.getRoomDetail({ roomId: "123456", userId: "demo_user" });
  assert.strictEqual(detail.roomId, "123456");

  // 云端解密代理不可用时必须直接报错。
  // 上游 master 里的分片名是 Mouflon 加密串，交给播放器只会无限转圈，
  // 所以绝不能再"看起来成功、其实播不了"地回退过去。
  failCam = true;
  // 用独立的 roomId：失败结论会进 8 秒失败缓存，换个 id 才能测到真实路径。
  await expectFailure("云端代理不可用", () => plugin.getPlayback({ roomId: "111111", userId: "demo_user" }));
  assert.deepStrictEqual(masterHosts, [], "任何情况下都不应请求未解密的上游 master");

  // 所有设备统一走云端 Mouflon 解密代理
  proxyAvailable = true;
  proxyRequests.length = 0;
  playlistRequests.length = 0;
  proxyRequests.length = 0;
  const masterHostsBeforeProxy = masterHosts.length;
  const proxied = await plugin.getPlayback({ roomId: "123456", userId: "demo_user" });
  assert.strictEqual(proxyRequests.length, 1);
  assert.strictEqual(masterHosts.length, masterHostsBeforeProxy, "proxy path must not touch upstream master");
  // 起播前必须真的拉过一次媒体清单验证，两个画质各一次。
  assert.strictEqual(playlistRequests.length, 2, "每个画质都要先验证清单可拉取");
  assert.strictEqual(proxied[0].qualitys.length, 2);
  assert.strictEqual(proxied[0].qualitys[0].qn, 1080);
  assert.ok(proxied[0].qualitys[0].url.startsWith("http://" + proxyHost + "/play/123456/"),
    "playback should target the cloud worker, never a machine-local proxy");
  assert.strictEqual(proxied[0].displayName, "Stripchat 官方线路");
  assert.strictEqual(proxied[0].qualitys[0].liveCodeType, "m3u8");
  // mePlayer 会把分片 URL 截断导致 400 卡死，只允许 avPlayer。
  assert.strictEqual(JSON.stringify(proxied[0].qualitys[0].playbackHints.preferredEngines), '["avPlayer"]');
  assert.strictEqual(proxied[0].qualitys[0].playbackHints.latencyMode, undefined);
  assert.strictEqual(proxied[0].qualitys[0].headers.Referer, undefined);
  assert.strictEqual(proxied[0].qualitys[0].headers.Origin, undefined);
  assert.strictEqual(proxied[0].qualitys[0].playbackHints.requiresCustomSegmentLoader, false);

  // 上游抖动导致媒体清单 502 时：丢掉的画质不能被返回，
  // 但只要有画质验证通过就照常播放，不能把整次起播拖垮。
  playlistRequests.length = 0;
  playlistFailures = 1;
  const partial = await plugin.getPlayback({ roomId: "123456", userId: "demo_user" });
  assert.strictEqual(partial[0].qualitys.length, 1, "只返回验证通过的画质");

  // 全部画质都拉不到清单时：重试一次并带上 cache-buster 绕开边缘缓存。
  proxyRequests.length = 0;
  playlistRequests.length = 0;
  playlistFailures = 99;
  await expectFailure("全部画质都拉不到清单", () => plugin.getPlayback({ roomId: "222222", userId: "demo_user" }));
  assert.strictEqual(proxyRequests.length, 2, "失败后必须重试一次代理");
  assert.ok(/[?&]v=/.test(proxyRequests[1]), "重试必须带 cache-buster，绕开边缘缓存的失败结果");
  playlistFailures = 0;

  // 主播确实没播（Worker 探遍四个 CDN 域名都是 404）时才允许报"已下播"。
  indexStatus = 404;
  const offlineState = await plugin.getLiveState({ roomId: "123456", userId: "demo_user" });
  assert.strictEqual(offlineState.liveState, "0", "404 才是真的没播");
  // 502 只是这一跳抖动，绝不能报"已下播"，否则宿主会把正在播放的流掐掉。
  indexStatus = 502;
  const flakyState = await plugin.getLiveState({ roomId: "123456", userId: "demo_user" });
  assert.strictEqual(flakyState.liveState, "3", "502 是抖动，必须报未知 3");
  indexStatus = 200;

  // 直播状态：cam 接口被 Stripchat 反爬拦截（实测稳定返回 HTTP 418）时，
  // 插件绝不能报 "0"（已下播），否则宿主会把正在播放的流掐掉，
  // 表现就是画面播着播着突然冻住不动。此处 failCam 仍为 true。
  proxyAvailable = true;
  const liveWhenCamBlocked = await plugin.getLiveState({ roomId: "123456", userId: "demo_user" });
  assert.strictEqual(liveWhenCamBlocked.liveState, "1",
    "cam 被拦截但代理能拿到清单时，必须报在播");

  proxyAvailable = false;
  const liveWhenNothing = await plugin.getLiveState({ roomId: "123456", userId: "demo_user" });
  assert.strictEqual(liveWhenNothing.liveState, "3",
    "cam 和代理都问不到时必须报未知 3，不能报已下播 0");

  // cam 明确说不在播，但代理仍能拉到清单 -> 以代理为准，报在播（避免缓存/误判误杀）
  proxyAvailable = true;
  camOffline = true;
  const liveWhenCamStale = await plugin.getLiveState({ roomId: "123456", userId: "demo_user" });
  assert.strictEqual(liveWhenCamStale.liveState, "1",
    "cam 说下播但代理能拉到清单时，以代理为准");
  camOffline = false;

  failCam = false;
  const share = await plugin.resolveShare({ shareCode: "https://stripchat.com/demo_user" });
  assert.strictEqual(share.userId, "demo_user");
  console.log("AngelLive Stripchat contract tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
