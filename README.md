# DreamBy / Forward 脚本

本仓库同时保存 DreamBy（baiPlay）自定义媒体库、Forward 脚本和 Angel Live 插件。不同协议的版本号不能互相比较；亚洲版、国产版等不同内容分支分别维护。

已经导入 DreamBy 的入口继续使用原来的下载地址。更新沿用原文件路径、媒体库 ID 和原参数名；不用删除后重新导入。每个下载入口都包含完整 JavaScript，不需要远程加载器。

## 主维护文件与兼容入口

| 主维护文件 | 版本 | 保留并同步的旧文件 |
| --- | --- | --- |
| [eporner-mini-library 2.js](eporner-mini-library%202.js) | 1.0.9 | `eporner-mini-library.js` |
| [xxxfollow-mini-library 5.js](xxxfollow-mini-library%205.js) | 1.0.1 | `xxxfollow-mini-library.js` |
| [missav-mini-library-download-working 6.js](missav-mini-library-download-working%206.js) | 1.5.10 | `missav-mini-library-download-working.js`、`missav-mini-library.js`、`missav-mini-library-CloudFlare.js` |

Eporner、XXXFollow 的两份文件原本内容相同。MissAV 的两个旧 1.0.7 实现升级为 1.5.10 兼容副本，保留 `missav-mini-library` ID、旧参数名和 `missav://detail?` 历史条目格式。

日常只修改左侧主维护文件，再运行：

```bash
node tools/sync-library-aliases.cjs
```

GitHub Actions 会先生成兼容副本并验证；`main` 的检查通过后，如果副本有变化，机器人只提交这 5 个兼容文件。PR 要提交同步后的副本，检查会拒绝遗漏更新。主维护文件的新实现因此能继续通过所有旧下载路径获得。

## 独立保留的入口

- 麻豆亚洲版 `madou8-mini-library 5.js` 与国产版 `madou8-domestic-mini-library.js` 内容范围和 ID 不同，分别保留。
- Jable、Pornhub、Hanime1、MissAV 的 Forward 与 DreamBy 入口分别保留。
- Hanime1 的 `.fwd` 包和加密的 `twitter视频.js` 保持原格式；Stripchat ZIP、两个订阅索引和插件主程序保持一致。
- `ttdm-mini-library (1).js`、`pektino-mini-library 3.js` 保持现有文件名。

## 2026-10-03 更新版本

| 文件 | 原版本 | 新版本 |
| --- | --- | --- |
| [123av-mini-library.js](123av-mini-library.js) | 1.1.0 | 1.1.1 |
| [1808-mini-library.js](1808-mini-library.js) | 1.0.5 | 1.0.6 |
| [4kvm-dreamby-mini-library.js](4kvm-dreamby-mini-library.js) | 1.10.0 | 1.10.1 |
| [591av-mini-library.js](591av-mini-library.js) | 1.3.1 | 1.3.2 |
| [91porny_int.js](91porny_int.js) | 0.9.6 | 0.9.7 |
| [MissAV 3.0.js](MissAV%203.0.js) | 3.0 | 3.0.1 |
| [asmrlib-mini-library.js](asmrlib-mini-library.js) | 1.2.0 | 1.2.1 |
| [girigirilove-mini-library.js](girigirilove-mini-library.js) | 1.0.0 | 1.0.1 |
| [jable.js](jable.js) | 1.3.0 | 1.3.1 |
| [jable.media-library.js](jable.media-library.js) | 1.0.0 | 1.0.1 |
| [javgg-mini-library.js](javgg-mini-library.js) | 1.0.0 | 1.0.1 |
| [kbjfan-mini-library.js](kbjfan-mini-library.js) | 1.0.0 | 1.0.1 |
| [madou8-domestic-mini-library.js](madou8-domestic-mini-library.js) | 1.2.1 | 1.2.2 |
| [madou8-mini-library 5.js](madou8-mini-library%205.js) | 1.1.0 | 1.1.1 |
| [manko-fun-mini-library.js](manko-fun-mini-library.js) | 1.8.0 | 1.8.1 |
| [missav-mini-library-download-working 6.js](missav-mini-library-download-working%206.js) | 1.5.9 | 1.5.10 |
| [novipnoad-mini-library.js](novipnoad-mini-library.js) | 1.0.0 | 1.0.1 |
| [pornhub.media-library.js](pornhub.media-library.js) | 1.0.0 | 1.0.1 |
| [pornhub_int.js](pornhub_int.js) | 1.1.5 | 1.1.6 |
| [sexbjcam-mini-library.js](sexbjcam-mini-library.js) | 1.1.7 | 1.1.8 |
| [taolusm-mini-library.js](taolusm-mini-library.js) | 1.0.0 | 1.0.1 |
| [xvideos_int.js](xvideos_int.js) | 0.9.6 | 0.9.7 |
| [xxxfollow-mini-library 5.js](xxxfollow-mini-library%205.js) | 1.0.0 | 1.0.1 |

具体行为和设备验证限制见 [CHANGELOG.md](CHANGELOG.md)。

## SexBJCam 1.1.9 播放修复稿

保留 `sexbjcam-mini-library.js` 原下载路径、`sexbjcam-mini-library` ID、`baseURL` 参数、历史详情 URL 与 `quality:1080/720/480` ID。播放器改为先用 HTTP 读取公开打包配置，必要时只做一次 12 秒浏览器媒体捕获；HLS 正文使用最多 4 秒 HTTP 请求，不再用浏览器导航清单。详情、资源发现和播放各有 28 秒总时限；脚本截止时间不能强制取消宿主原生任务。

画质仅取真实清单或此前成功验证的分辨率元数据，签名地址在播放时刷新。只有原始 HLS 时明确显示“原始画质”，暂时失败不生成假默认线路；404、验证页、非 HLS 和捕获失败显示具体阶段。捕获媒体请求头仅用于本次播放，不写入画质缓存。详情标题优先读取影片标题，避免把嵌套上传者姓名当作标题。

匿名 HTTP 已验证 `recordplay.biz` 和 `playrecord.biz` 的真实 master、1080p/720p/480p 与范围分片；播放器请求也有超时，源站并非始终稳定。匿名主站详情出现过 Cloudflare 403，浏览器会话中可正常读取；不将桌面网页或 HTTP 成功视为 DreamBy/iPhone 原生播放验收。

## 本地验收

```bash
node tools/sync-library-aliases.cjs --check
node tools/verify-scripts.cjs
node --test tests/adapters.test.cjs
node sexbjcam-network-recovery.test.js
node stripchat-angellive/test.js
node --test stripchat-angellive/worker/test.js
python3 tools/verify-release.py
git diff --check
```

检查覆盖旧媒体库 ID/参数/入口、语法、分页失败恢复、画质选择、过期地址刷新、播放总时限，以及 ZIP/索引/版本/SHA-256 和特殊封装格式。离线测试不替代 DreamBy 设备上的浏览器媒体回传和实际起播验证。
