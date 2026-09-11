# Stripchat for AngelLive

AngelLive API v1 插件，仅枚举和播放 Stripchat `public` 状态的直播。

## 文件

- `manifest.json`：AngelLive 插件清单。
- `main.js`：分类、房间、搜索、详情、状态和 HLS 播放实现。
- `test.js`：`node test.js` 运行契约测试（含代理路径与直连回退路径）。
- `stripchat-angellive-1.0.19.zip`：可安装插件包，包含 AngelLive 列表和首页平台卡片图标。
- `worker/`：Cloudflare Worker 版解密代理源码。
- `source-index.json`：AngelLive 订阅源索引。

## 加载超时保护（闪退）

AngelLive 对 `getPlayback` 有整体超时。旧版本最坏情况要串行等：

- 代理探测 `2 + 10 + 2 = 14` 秒（本机 / 云端 / Bonjour 依次试）
- 直连回退 `3 × 10 = 30` 秒（三个 CDN 域名依次试）

合计 40 秒以上，宿主会先放弃，表现就是「转圈很久然后直接闪退」。

现在：

- `qualitiesFor` 整体加 **12 秒硬上限**，超时抛出可读的 `TIMEOUT` 错误而不是把宿主拖死；
- 直连回退的三个 CDN 域名改为**并发**，最坏耗时从 30 秒降到 5 秒；
- 云端代理探测超时 10 → 6 秒；
- 解析失败的流做 **8 秒负缓存**，反复点击不会重跑整轮探测；
- Worker 侧 `loadMaster` 也改成四域名并发 + 15 秒失败负缓存（最坏 36 秒 → 4.5 秒）。

## 播放引擎：mePlayer 主路，avPlayer 兜底（1.0.19 改回）

AngelLive 有两个播放引擎：`avPlayer`（系统播放器 / KSAVPlayer）和 `mePlayer`（内置播放器 /
KSMEPlayer）。宿主自己为**普通 HLS 直播**定的默认顺序是 `[mePlayer, avPlayer]`
（`RoomPlaybackResolver.resolvePlan`），而本插件从 1.0.11 起一直把
`playbackHints.preferredEngines` 写死成 `["avPlayer"]`，等于绕开了宿主的默认路径。

**为什么当初写死 avPlayer。** 同一台设备同一时段的抓包对比：

| 引擎 | 协议 | 特征请求头 | 结果 |
| --- | --- | --- | --- |
| avPlayer | HTTP/2 | `x-playback-session-id` | 40 个分片全部 200 |
| mePlayer | HTTP/1.1 | `icy-metadata: 1`、`range: bytes=0-`、UA 重复两遍 | 8 个请求全部 400 |

原因是 **mePlayer 会把分片 URL 截断在约 190 字符**（`u` 参数从 136 字符被砍成 109 字符，
base64 长度变成非法的 4k+1），播放器拿不到分片就每秒重试一次，重试 8 次后整个播放线程
放弃，表现就是「前一两分钟很流畅，之后画面卡住不动」。

**为什么现在改回来。**

1. **截断前提已经消失。** 1.0.15 之后走的是官方 CDN 直连分片地址，实测 12 个直播间、
   51 条分片，**最长 107 字符**，离 190 的上限还很远。
2. **写死 avPlayer 的代价是「没有任何自愈」。** 宿主 `PlaybackTuning.swift` 里写得很清楚：
   `stallMonitoringEnabled` **「由内核决定（KSME 主路 true；KSAV/VLC false）」**。
   也就是说 KSAVPlayer 这条路上零吞吐 watchdog 是**关着的**，`PlaybackRecoveryCoordinator`
   的 tick 里对没有字节采样的内核直接 `return`（"无字节采样内核(HLS/KSAVPlayer)：卡顿由
   EOF/error 经 finish 反馈，这里不判 stall"）。而这正是「其他订阅源的直播卡住后点一下
   按钮就能恢复、Stripchat 不能」的原因——别的源走默认的 mePlayer，有起播超时、零吞吐
   stall 检测和一整条恢复阶梯。
3. **回退是安全的。** 顺序写成 `["mePlayer", "avPlayer"]`，mePlayer 起不来时
   `KSPlayerLayer` 会按 `playerTypes` 顺序自动切到 avPlayer，最坏情况就是回到 1.0.18 的行为。

同时保留的两条：

- 不声明 `latencyMode: "lowLatency"`：低延迟模式只留 2~3 秒缓冲，任何抖动都直接断流；
- Worker 侧分片地址仍然压到 179 字符以内，即使被降级到 mePlayer 也不会超过它的上限。

> 如果换回 mePlayer 后起播反而变差，把 `main.js` 里 `preferredEngines` 改回 `["avPlayer"]`
> 即可一键回退，其余逻辑不受影响。

三种编码格式 Worker 都兼容，设备上残留的旧清单不会 404。

## 分类：主分类 + 官网标签

Stripchat 官网的分类是两层结构：

- 主分类 `primaryTag` = `girls` / `couples` / `men` / `trans`
- 子标签 `filterGroupTags` = 官网筛选面板里的标签 key（`ethnicityAsian`、`tagLanguageJapanese`、`doSquirt` …）

1.0.15 之前只有 5 个写死的入口，而且靠解析 `/api/front/v2/models` 返回的 `blocks`
反查标签 id。实测那份 `blocks` 里根本没有 asian 这类标签，查不到就静默退化成整个
`girls` 分类——所以点「亚洲女主播」看到的是全部女主播。

现在 `main.js` 里维护两张表：

- `CATEGORIES`：展示用分类列表，1.0.15 从 5 个扩到 22 个；
- `TAG_KEYS`：分类 id → 官网标签 key 的映射，直接用于 `filterGroupTags`。

标签接口偶尔会返回空列表（Stripchat 抖动 / 反爬），带标签的分类遇到空结果会
自动重试一次，避免用户看到「这个分类没人直播」的假象。

## 播放：清单经代理，分片直连官方 CDN

Stripchat 的 HLS 现在启用了 **Mouflon v2** 保护，宿主播放器无法直接播放：

- 媒体清单不带 `psch` / `pkey` 时会 302 到一份只有广告的诱饵清单；
- 真清单里的分片文件名是加密串，需要 `pkey` 对应的 `pdkey` 才能还原。

宿主没有相关能力，所以 `getPlayback` 会把请求交给解密代理，由它还原出标准 HLS。
代理候选地址写在 `main.js` 顶部的 `PROXY_HOSTS`，按顺序探测并缓存命中项：

```js
var PROXY_HOSTS = [
  { base: "https://stripchat-mouflon-proxy.douyin-skip-community.workers.dev", timeout: 10 }
];
```

**所有设备统一只走云端 Worker**：手机、平板、Mac 行为完全一致，出问题只需要看一处日志，
也不依赖任何一台自己的机器开着机。Mac 上那个本地进程（`~/stripchat-mouflon-proxy/`，
`127.0.0.1:8787`）已经不再被引用——留着当手动备用即可，想临时切回去就把
`{ base: "http://127.0.0.1:8787", timeout: 2 }` 加回数组最前面。

云端 Worker 不可用时会回退到旧的直连逻辑（此时通常播不出来），不会再去找机器本地进程。

### 视频不再经过 Cloudflare（1.0.15 关键改动）

分片文件名 `＜streamId＞_＜序号＞_＜加密token＞_＜时间戳＞.mp4` 里只有中间那段 token 是加密的，
streamId / 序号 / 时间戳都是明文。解密后得到的就是可以直接下载的真实 CDN 地址，
实测不挑请求头（带 UA、带 Referer、完全不带头或用 `AppleCoreMedia` UA 都是 200）。

所以 Worker 现在默认 `SEGMENT_MODE=direct`：清单里直接输出解密后的真实 CDN 地址，
播放器拉视频**直连 Stripchat 官方 CDN**，Cloudflare 只负责那几 KB 的清单。
这和「直接在官网看」走的是同一条链路，速度自然一致。

- 实测对比：分片经 Worker 中转 3.7~4.4 秒，直连 CDN 3.3~4.1 秒，且少一跳；
- 上游 CDN 曾对 Cloudflare 出口返回 403（`media-hls.doppiocdn.com/net`），说明中转本身不稳；
- 解不开的分片会自动退回 Worker 中转，绝不会给出播放器拿不到的地址；
- `EXT-X-MAP`（init 段，文件名未加密）在 direct 模式下直接用原地址。

想一键回退成旧的中转模式：给 Worker 设置 `SEGMENT_MODE=proxy` 再部署即可。

## 图标与封面（1.0.17 修正）

AngelLive 对图标的渲染方式是固定的，插件只能适配：

| 文件 | 使用位置 | AngelLive 的渲染方式 |
| --- | --- | --- |
| `assets/tv_<pluginId>_big[_dark].png` | tvOS / iOS 平台卡片 | tvOS：`resizable().frame(370×222)`，**硬拉伸**；iOS：`aspectRatio(.fit).frame(maxHeight: 80)` |
| `assets/tv_<pluginId>_small[_dark].png` | tvOS 聚焦浮层 | 同 370×222，下方叠一段主播简介 |
| `assets/live_card_<pluginId>.png` | iOS tab / 列表 | 按最长边归一到 25pt |
| `assets/pad_live_card_<pluginId>.png` | iOS 插件管理列表 | 原始尺寸 |
| `assets/mini_live_card_<pluginId>.png` | macOS 侧边栏 | 强制按 16pt 渲染 |

关键点：**tvOS 不会保持图标比例**。370×222 是 5:3，
所以 `tv_*_big` / `tv_*_small` 必须本身就是 5:3 画布（本插件用 1000×600），
图标画在画布里保持自然比例，这样被拉伸到 370×222 时才是等比缩放。
1.0.16 及之前给的是 512×512 方图，被横向拉扁 1.67 倍，圆形气泡变成扁椭圆。

颜色：浅色版 `#903232`（favicon 里图标本身的颜色），
深色版 `#fa5365`（官网品牌强调色），两者是不同文件。

房间封面：官网列表接口只给 `-thumb-small`（200×150），
把后缀换成 `-thumb-big` 即 400×300（单张 ~25KB）；
详情页用 `-full` 即 1000×750。实测 29/29 个在播房间两档均为 200。

## 「点进去就卡」的两个真实成因（1.0.16 修复）

**一、回退到了播不了的地址。** 早先云端代理失败时会回退到「上游 master + pkey」。
那个地址看起来是好的，但分片文件名仍是 Mouflon 加密串，播放器永远拿不到分片，
于是无限转圈——比直接报错更糟。现在只剩云端解密代理一条路：起播前先真的拉一次
媒体清单验证，只把确认能播的画质返回给宿主；全部画质都拉不到就给宿主一个明确的
错误，让用户重试，而不是交出死地址。

**二、上游抖动被当成了「主播下播」。** Worker 原来对四个 CDN 域名轮询失败一律记
15 秒负缓存、一律回 502。于是一次抖动会污染接下来 15 秒的全部重试，而插件又把
502 当成「已下播」上报，宿主会立刻掐掉正在播放的流。现在：

- 四个 CDN 域名**全部 404** 才算真没播，Worker 回 **404**（负缓存 15 秒）；
- 超时 / 403 / 5xx 只是这一跳抖动，回 **502**（负缓存只有 2 秒）；
- 插件的直播状态探测只在 **404** 时报「已下播」，**502 一律报「未知」**。

这正好解释了那个现象：卡住的直播间退回首页刷新一下、过十几秒再进就恢复了。

## 付费 / 私密 / 组秀场次（1.0.18 修正）

Stripchat 的房间状态不止「公开」和「没播」两种。`/api/front/models` 里会返回
`status: "groupShow"`（`groupShowType: "ticket"` 的门票场）、`private`、`p2p` 等。
这些房间**确实在播**，只是没有公开分片，AngelLive 播不了。

旧版用一句 `publicLive` 把它们从列表里整个过滤掉，表现是：

- 官网明明显示在播，插件列表里却找不到这个主播；
- 收藏夹里的主播一直是灰的，看着像已经下播。

现在改成三档处理：

| 房间状态 | 列表里 | `roomTitle` 后缀 | `liveState` | 点进播放 |
| --- | --- | --- | --- | --- |
| 公开 | 显示 | 无 | `1` | 正常播放 |
| 门票场 / 组秀 / 私密 / 其他付费 | **显示** | `· 门票场` 等 | `1` | 抛 `NOT_LIVE` + 人话提示 |
| 真下播（`isLive: false`） | 过滤 | — | `0` | — |

两个关键点：

- **`liveState` 必须报 `1`**。报 `0` 会被宿主当成下播，主播从公开切到私密的那一刻
  正在播放的流会被直接掐掉；
- **提示要走 `NOT_LIVE` 而不是原样抛代理错误**。付费房间没有公开分片，解析 `roomId`
  必然失败，旧版会把「Mouflon 解密代理无响应」丢给用户，看不出发生了什么。
  现在按状态提示「该主播当前是门票场，需要先购票才能观看；AngelLive 播放不了付费场次」。

## 复制直播间链接 / 在浏览器打开（1.0.18 修复）

这两个按钮的地址由 `manifest.json` 的 `hostBehavior.externalRoomURLTemplate` 生成，
宿主只做一次 `{userId}` 字符串替换。模板一直是 `https://stripchat.com/{userId}`，
但 **`stripchat.com` 在部分网络下不可达**（本机实测解析到 `127.0.0.1`，
浏览器直接报「无法访问此网站」），而同一站点的中文域名 `zh.stripchat.global` 正常。

现在模板改成：

```json
"externalRoomURLTemplate": "https://zh.stripchat.global/{userId}"
```

`shareResolve.hosts` 仍然保留 `stripchat.com` 和 `zh.stripchat.global` 两个域名，
粘贴任何一种链接都能被 `resolveShare` 认出来。

## 订阅

把 `source-index.json` 和 `stripchat-angellive-1.0.19.zip` 一起上传到 `bbnotcode/ph_js` 的 `main`
分支根目录，然后在 AngelLive 中添加订阅地址：

```text
https://stripchat-mouflon-proxy.douyin-skip-community.workers.dev/sub/source-index.json
```

订阅列表图标取自 Stripchat 官网 favicon 的图形本身（见下一节）。

**推荐用上面这条 Worker 地址**：它由云端 Worker 回源拉取订阅，并在返回的
`zipURLs` 里把插件包也改写成走 Worker，所以设备全程只依赖 Cloudflare——
不需要能访问 `raw.githubusercontent.com`（国内多数网络不通），也不用管
jsDelivr 的分支缓存。索引边缘只缓存 60 秒，发新版大约 1 分钟就能被设备看到。

`worker/index.js` 里的 `/sub/<文件名>` 路由只允许 `*.json` / `*.zip`，且固定从
`bbnotcode/ph_js` 的 `main` 拉取，不会被当成开放代理。

> 仍然想用 GitHub / jsDelivr 地址的话，注意分支缓存：jsDelivr 对 `@main` 是
> CDN 12 小时、客户端 7 天。更新后需要 purge，而且单次 purge 常常要等一两分钟
> 甚至再执行一次才生效：
>
> ```bash
> curl -s "https://purge.jsdelivr.net/gh/bbnotcode/ph_js@main/source-index.json"
> ```
>
> 或改用带 commit 的固定地址（永久生效，不随 main 更新）：
> `https://cdn.jsdelivr.net/gh/bbnotcode/ph_js@<commit>/source-index.json`

> 门票场 / 组秀 / 私房 / 付费视频都不支持播放。插件不会绕过 Stripchat 的访问控制或付费墙，
> 但会把这类房间照常显示出来并标注状态，点进去给一句人话提示（见下一节）。

> 注意：这个版本依赖 `PROXY_HOSTS` 里的解密代理。云端 Worker 地址是作者自有的，
> 别人装了会共用同一个 Worker 并消耗作者账号的额度。要长期分享，建议让使用者
> 各自 `npx wrangler deploy` 一份 `worker/` 并改掉 `PROXY_HOSTS`。
