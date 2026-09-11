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
let proxyHost = "stripchat-mouflon-proxy.douyin-skip-community.workers.dev";
const masterHosts = [];
const proxyRequests = [];
const modelRequests = [];

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
        if (url.includes("/play/") && url.endsWith("/index.json")) {
          if (!proxyAvailable || new URL(url).host.toLowerCase() !== proxyHost.toLowerCase()) throw new Error("connect ECONNREFUSED " + new URL(url).host);
          proxyRequests.push(url);
          assert.strictEqual(options.request.headers.Accept, "application/json");
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
        if (url.includes("_auto.m3u8")) {
          const host = new URL(url).hostname;
          masterHosts.push(host);
          if (host === "edge-hls.doppiocdn.org" || host === "edge-hls.doppiocdn.com") {
            throw new Error("simulated NSURLError -1004");
          }
          return { status: 200, bodyText: master.replaceAll("doppiocdn.org", "doppiocdn.media") };
        }
        throw new Error("Unexpected URL: " + url);
      }
    }
  }
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(__dirname + "/main.js", "utf8"), context);

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

  const detail = await plugin.getRoomDetail({ roomId: "123456", userId: "demo_user" });
  assert.strictEqual(detail.roomId, "123456");

  // 代理不可用时回退到直连官方 CDN 的旧行为
  failCam = true;
  const camRequestsBeforePlayback = camRequests;
  const playback = await plugin.getPlayback({ roomId: "123456", userId: "demo_user" });
  assert.strictEqual(camRequests, camRequestsBeforePlayback, "playback should not require the cam endpoint when roomId works");
  assert.strictEqual(playback[0].qualitys.length, 2);
  assert.deepStrictEqual(masterHosts, [
    "edge-hls.doppiocdn.org",
    "edge-hls.doppiocdn.com",
    "edge-hls.doppiocdn.media"
  ]);
  assert.strictEqual(playback[0].qualitys[0].liveCodeType, "m3u8");
  assert.ok(playback[0].qualitys[0].url.includes("media-hls.doppiocdn.media/b-hls-21/"));
  assert.ok(!playback[0].qualitys[0].url.includes("growcdnssedge.com"));
  assert.ok(playback[0].qualitys[0].url.includes("pkey=test-pkey"));
  assert.strictEqual(playback[0].displayName, "Stripchat 官方线路");
  // mePlayer 会把分片 URL 截断导致 400 卡死，只允许 avPlayer。
  assert.strictEqual(JSON.stringify(playback[0].qualitys[0].playbackHints.preferredEngines), '["avPlayer"]');
  assert.strictEqual(playback[0].qualitys[0].playbackHints.latencyMode, undefined);
  assert.strictEqual(playback[0].qualitys[0].headers.Origin, undefined);
  assert.strictEqual(playback[0].qualitys[0].headers.Referer, undefined);

  // 所有设备统一走云端 Mouflon 解密代理
  proxyAvailable = true;
  proxyRequests.length = 0;
  const masterHostsBeforeProxy = masterHosts.length;
  const proxied = await plugin.getPlayback({ roomId: "123456", userId: "demo_user" });
  assert.strictEqual(proxyRequests.length, 1);
  assert.strictEqual(masterHosts.length, masterHostsBeforeProxy, "proxy path must not touch upstream master");
  assert.strictEqual(proxied[0].qualitys.length, 2);
  assert.strictEqual(proxied[0].qualitys[0].qn, 1080);
  assert.ok(proxied[0].qualitys[0].url.startsWith("http://" + proxyHost + "/play/123456/"),
    "playback should target the cloud worker, never a machine-local proxy");
  assert.strictEqual(proxied[0].qualitys[0].headers.Referer, undefined);
  assert.strictEqual(proxied[0].qualitys[0].headers.Origin, undefined);
  assert.strictEqual(proxied[0].qualitys[0].playbackHints.requiresCustomSegmentLoader, false);

  // 云端代理不可用时回退到直连上游，而不是再去找 Mac 本地进程
  proxyAvailable = false;
  proxyRequests.length = 0;
  const directAgain = await plugin.getPlayback({ roomId: "123456", userId: "demo_user" });
  assert.strictEqual(proxyRequests.length, 0, "must not probe any machine-local proxy");
  assert.ok(!directAgain[0].qualitys[0].url.includes("127.0.0.1"));
  assert.ok(!directAgain[0].qualitys[0].url.includes(".local"));

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
