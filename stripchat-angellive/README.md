# Stripchat for AngelLive

AngelLive API v1 插件，仅枚举和播放 Stripchat `public` 状态的直播。

## 文件

- `manifest.json`：AngelLive 插件清单。
- `main.js`：分类、房间、搜索、详情、状态和 HLS 播放实现。
- `test.js`：`node test.js` 运行契约测试（含代理路径与直连回退路径）。
- `stripchat-angellive-1.0.15.zip`：可安装插件包，包含 AngelLive 列表和首页平台卡片图标。
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

## 播放引擎：只允许 avPlayer

AngelLive 有两个播放引擎：`avPlayer`（系统播放器）和 `mePlayer`（内置播放器）。
两者对同一份清单的表现完全不同，同一台设备同一时段的抓包对比：

| 引擎 | 协议 | 特征请求头 | 结果 |
| --- | --- | --- | --- |
| avPlayer | HTTP/2 | `x-playback-session-id` | 40 个分片全部 200 |
| mePlayer | HTTP/1.1 | `icy-metadata: 1`、`range: bytes=0-`、UA 重复两遍 | 8 个请求全部 400 |

原因：**mePlayer 会把分片 URL 截断在约 190 字符**（`u` 参数从 136 字符被砍成 109 字符，
base64 长度变成非法的 4k+1）。播放器拿不到分片就每秒重试一次，重试 8 次后整个播放线程
放弃，表现就是「前一两分钟很流畅，之后画面卡住不动」。

因此这一版做了三件事：

- `playbackHints.preferredEngines` 固定为 `["avPlayer"]`，不给回退到 mePlayer 的机会；
- 不再声明 `latencyMode: "lowLatency"`：低延迟模式只留 2~3 秒缓冲，任何抖动都直接断流；
- Worker 侧把分片地址从 236 字符压到 **179 字符**（域名压成一位下标 + 去掉重复的
  `/<streamId>/` 目录层），即使被降级到 mePlayer 也不会超过它的上限。

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

## 订阅

把 `source-index.json` 和 `stripchat-angellive-1.0.15.zip` 一起上传到 `bbnotcode/ph_js` 的 `main`
分支根目录，然后在 AngelLive 中添加订阅地址：

```text
https://stripchat-mouflon-proxy.douyin-skip-community.workers.dev/sub/source-index.json
```

订阅列表图标使用 Stripchat 官网声明的 512×512 PNG 应用图标。

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

> 不支持私房、群组秀或付费视频。插件不会绕过 Stripchat 的访问控制或付费墙。

> 注意：这个版本依赖 `PROXY_HOSTS` 里的解密代理。云端 Worker 地址是作者自有的，
> 别人装了会共用同一个 Worker 并消耗作者账号的额度。要长期分享，建议让使用者
> 各自 `npx wrangler deploy` 一份 `worker/` 并改掉 `PROXY_HOSTS`。
