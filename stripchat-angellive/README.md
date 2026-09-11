# Stripchat for AngelLive

AngelLive API v1 插件，仅枚举和播放 Stripchat `public` 状态的直播。

## 文件

- `manifest.json`：AngelLive 插件清单。
- `main.js`：分类、房间、搜索、详情、状态和 HLS 播放实现。
- `test.js`：`node test.js` 运行契约测试（含代理路径与直连回退路径）。
- `stripchat-angellive-1.0.10.zip`：可安装插件包，包含 AngelLive 列表和首页平台卡片图标。
- `worker/`：Cloudflare Worker 版解密代理源码。
- `source-index.json`：AngelLive 订阅源索引。

## 播放：经 Mouflon 解密代理

Stripchat 的 HLS 现在启用了 **Mouflon v2** 保护，宿主播放器无法直接播放：

- 媒体清单不带 `psch` / `pkey` 时会 302 到一份只有广告的诱饵清单；
- 真清单里的分片文件名是加密串，需要 `pkey` 对应的 `pdkey` 才能还原。

宿主没有相关能力，所以 `getPlayback` 会把请求交给解密代理，由它还原出标准 HLS。
代理候选地址写在 `main.js` 顶部的 `PROXY_HOSTS`，按顺序探测并缓存命中项：

```js
var PROXY_HOSTS = [
  { base: "http://127.0.0.1:8787", timeout: 3 },                                        // Mac 本地进程，不耗云端额度
  { base: "https://stripchat-mouflon-proxy.douyin-skip-community.workers.dev", timeout: 8 }, // 云端常驻，任意设备可用
  { base: "http://huangzls-MacBook-Air.local:8787", timeout: 5 }                        // 局域网兜底
];
```

- **iPad / iPhone / 其他设备**：直接命中云端 Worker，不需要 Mac 开机。
- **Mac 上**：优先用本地进程（`~/stripchat-mouflon-proxy/`），省云端额度。
- 全部不可用时回退到旧的直连逻辑（此时通常播不出来）。

云端 Worker 的源码在 `worker/`，改动后 `npx wrangler deploy` 重新发布即可。

```bash
launchctl print gui/$(id -u)/com.local.stripchat-mouflon-proxy | grep -E "state|pid"   # 本地代理
curl -s https://stripchat-mouflon-proxy.douyin-skip-community.workers.dev/health        # 云端代理
```

## 订阅

把 `source-index.json` 和 `stripchat-angellive-1.0.10.zip` 一起上传到 `bbnotcode/ph_js` 的 `main`
分支根目录，然后在 AngelLive 中添加订阅地址：

```text
https://raw.githubusercontent.com/bbnotcode/ph_js/main/source-index.json
```

订阅列表图标使用 Stripchat 官网声明的 512×512 PNG 应用图标。

> 更新订阅后，若在设备上仍看到旧版本，是 jsDelivr 的缓存（部分网络会把
> `raw.githubusercontent.com` 重定向到 jsDelivr）。执行一次即可强制刷新：
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
