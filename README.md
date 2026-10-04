# DreamBy / Forward 脚本

本仓库同时保存 DreamBy（baiPlay）自定义媒体库、Forward 脚本和 Angel Live 插件。不同协议的版本号不能互相比较；亚洲版、国产版等不同内容分支分别维护。

已经导入 DreamBy 的入口继续使用原来的下载地址和媒体库 ID。每个下载入口都包含完整 JavaScript，不需要远程加载器。

## JAVGG 1.0.3：首页与分类加载修复 — 2026-10-04

用户在 iPhone DreamBy 中报告首页及各分类显示站点 Logo 的失败卡，错误为 `stage=http-timeout`。JAVGG 原版列表请求禁用浏览器回退，HTTP 失败后直接返回错误卡。此次仅修列表读取和失败显示：普通 HTTP 最多 6 秒，包含正文读取；失败或收到验证/不完整页面时，最多一次 12 秒隐藏网页 HTML 回退，不等待视频媒体。正常 HTTP 列表不打开浏览器，可使用宿主提供的正常浏览器会话；不提取或保存 Cookie。

首页仍只立即加载最近发布，其他分区保持懒加载。兼容原始 HTML、嵌套对象/JSON 正文及异步 `text()`。失败返回明确错误和空条目，避免把站点 Logo 的失败提示作为影片或排名内容显示；热门影片提供真实排名。原文件名、库 ID、`baseUrl` 参数、详情/播放载荷保留。

桌面验证：匿名 iPhone User-Agent 的最近发布/第二页及精选页返回 HTTP 200；当前浏览器会话验证八个分类的前两页，第二页均有不同影片。热门分类普通请求出现超时，网页导航曾返回 40 条。67 项离线回归通过，包含 HTTP/正文挂起、一次 HTML 回退、验证页、异步响应、翻页、空搜索及明确失败。iPhone 的网页 HTML 回传和实际列表显示仍需用户更新测试。

播放与详情解析的 19 个相关函数和原恢复版逐字相同；其他九个历史下载入口仍与任务前快照一致。此次列表修复更新为 1.0.3，之前的播放修复没有重新引入。

## 2026-10-04：更正恢复到任务开始前的版本

用户更正恢复时间为昨天（2026-10-03）开始本轮任务之前。按上海时间 `2026-10-03 00:00:00 +08:00` 之前主分支最后的快照 `2fd0121bfbf0cc812d1e9e39501384710e684ade` 恢复。这十个目标路径与原审查基线 `8e43017532ec81e3338046ba6e32dff7655bd3dd` 完全同字节；两提交之间仅新增另一个库 `hsex-mini-library.js`。

| 媒体库 / 当前下载文件 | 恢复版本 |
| --- | --- |
| [MissAV 普通版](missav-mini-library.js) | 1.0.7 |
| [MissAV CloudFlare 版](missav-mini-library-CloudFlare.js) | 1.0.7 |
| [MissAV download-working](missav-mini-library-download-working.js) / [working 6](missav-mini-library-download-working%206.js) | 1.5.9 |
| [SexBJCam](sexbjcam-mini-library.js) | 1.1.7 |
| [ASMRLIB](asmrlib-mini-library.js) | 1.2.0 |
| [JAVGG](javgg-mini-library.js) | 1.0.3（随后按用户要求修复列表加载） |
| [麻豆亚洲版](madou8-mini-library%205.js) | 1.1.0 |
| [套路 SM](taolusm-mini-library.js) | 1.0.0 |
| [KBJ fan](kbjfan-mini-library.js) | 1.0.0 |

每个文件均恢复该时间点的原始内容、版本号和参数，原 raw 地址与库 ID 保留。MissAV 普通版和 CloudFlare 版虽然版本号相同，内容和参数不同，分别保留；只有内容相同的两个 download-working 文件继续同步。

时间截止点、基线提交及历史文件 SHA-256 记录在 [tools/library-restoration.json](tools/library-restoration.json)。JAVGG 的旧快照移入 `supersededFiles` 并标明此后按用户要求更新到 1.0.3；其余九个入口继续校验历史内容。恢复检查校验每个路径的历史内容、真实 manifest、原版公共入口和对应版本行为。此前恢复最早上传版的操作已更正，下文播放修复为撤回的历史记录。

## 主维护文件与兼容入口

| 主维护文件 | 版本 | 保留并同步的旧文件 |
| --- | --- | --- |
| [eporner-mini-library 2.js](eporner-mini-library%202.js) | 1.0.9 | `eporner-mini-library.js` |
| [xxxfollow-mini-library 5.js](xxxfollow-mini-library%205.js) | 1.0.1 | `xxxfollow-mini-library.js` |
| [missav-mini-library-download-working 6.js](missav-mini-library-download-working%206.js) | 1.5.9 | `missav-mini-library-download-working.js` |

Eporner、XXXFollow 的两份文件原本内容相同。MissAV 两个 download-working 入口继续保持相同内容；普通版和 CloudFlare 版独立保留。

日常只修改左侧主维护文件，再运行：

```bash
node tools/sync-library-aliases.cjs
```

GitHub Actions 会先生成兼容副本并验证；`main` 的检查通过后，如果副本有变化，机器人只提交这 3 个兼容文件。PR 要提交同步后的副本，检查会拒绝遗漏更新。主维护文件的新实现因此能继续通过所有旧下载路径获得。

## 独立保留的入口

- MissAV 普通版 `missav-mini-library.js`、CloudFlare 版 `missav-mini-library-CloudFlare.js` 各自保留任务之前的实现。
- 麻豆亚洲版 `madou8-mini-library 5.js` 与国产版 `madou8-domestic-mini-library.js` 内容范围和 ID 不同，分别保留。
- Jable、Pornhub、Hanime1、MissAV 的 Forward 与 DreamBy 入口分别保留。
- Hanime1 的 `.fwd` 包和加密的 `twitter视频.js` 保持原格式；Stripchat ZIP、两个订阅索引和插件主程序保持一致。
- `ttdm-mini-library (1).js`、`pektino-mini-library 3.js` 保持现有文件名。

## 2026-10-03 更新版本（历史记录，七库现已恢复原版）

| 文件 | 原版本 | 新版本 |
| --- | --- | --- |
| [123av-mini-library.js](123av-mini-library.js) | 1.1.0 | 1.1.1 |
| [1808-mini-library.js](1808-mini-library.js) | 1.0.5 | 1.0.6 |
| [4kvm-dreamby-mini-library.js](4kvm-dreamby-mini-library.js) | 1.10.0 | 1.10.1 |
| [591av-mini-library.js](591av-mini-library.js) | 1.3.1 | 1.3.2 |
| [91porny_int.js](91porny_int.js) | 0.9.6 | 0.9.7 |
| [MissAV 3.0.js](MissAV%203.0.js) | 3.0 | 3.0.1 |
| [asmrlib-mini-library.js](asmrlib-mini-library.js) | 1.2.0 | 1.2.2 |
| [girigirilove-mini-library.js](girigirilove-mini-library.js) | 1.0.0 | 1.0.1 |
| [jable.js](jable.js) | 1.3.0 | 1.3.1 |
| [jable.media-library.js](jable.media-library.js) | 1.0.0 | 1.0.1 |
| [javgg-mini-library.js](javgg-mini-library.js) | 1.0.0 | 1.0.2 |
| [kbjfan-mini-library.js](kbjfan-mini-library.js) | 1.0.0 | 1.0.2 |
| [madou8-domestic-mini-library.js](madou8-domestic-mini-library.js) | 1.2.1 | 1.2.2 |
| [madou8-mini-library 5.js](madou8-mini-library%205.js) | 1.1.0 | 1.1.2 |
| [manko-fun-mini-library.js](manko-fun-mini-library.js) | 1.8.0 | 1.8.1 |
| [missav-mini-library-download-working 6.js](missav-mini-library-download-working%206.js) | 1.5.9 | 1.5.11 |
| [novipnoad-mini-library.js](novipnoad-mini-library.js) | 1.0.0 | 1.0.1 |
| [pornhub.media-library.js](pornhub.media-library.js) | 1.0.0 | 1.0.1 |
| [pornhub_int.js](pornhub_int.js) | 1.1.5 | 1.1.6 |
| [sexbjcam-mini-library.js](sexbjcam-mini-library.js) | 1.1.7 | 1.1.9 |
| [taolusm-mini-library.js](taolusm-mini-library.js) | 1.0.0 | 1.0.2 |
| [xvideos_int.js](xvideos_int.js) | 0.9.6 | 0.9.7 |
| [xxxfollow-mini-library 5.js](xxxfollow-mini-library%205.js) | 1.0.0 | 1.0.1 |

具体行为和设备验证限制见 [CHANGELOG.md](CHANGELOG.md)。

## 统一故障修复 — 2026-10-03（历史记录，已撤回）

- 麻豆亚洲版 `madou8-mini-library 5.js` 为 1.1.2：首屏只取最近更新，分类预览随后加载；HTTP 错误及验证失败明确报告。五个分类前两页各返回 12 条且没有跨页重复；桌面首屏 1.543 秒。原文件名、ID、`baseUrl` 和 `madou8://` 版本载荷保持兼容。
- 播放检查最多 12 条实际普通 HLS 线路，使用三个逻辑并发任务和 28 秒预算，避免接口顺序变化时漏掉第五条以后的有效源。沿用网页 `xhrSetup` 的 `Accept` 凭据，每次从 API 刷新，不写入版本/缓存。专用 StreamPipe/service-worker 线路及明确 `native:false` 的线路不会伪装成原生地址。
- 麻豆 IPX-559 已验证原始 HLS 及 MPEG-TS 分片；来源未标明该线路分辨率，没有宣称 1080P 恢复。STCV-497 返回 720P；另一部普通影片返回 1080P/720P/480P/360P，并通过 1080P → 720P → 1080P 的桌面请求。仍有 CDN 返回 403；未通过伪造权限或签名规避。
- 套路 SM `taolusm-mini-library.js` 为 1.0.2：旧下载入口会跳到登录页，现从当前影片主播放器配置读取实际源。三部匿名 HTTP 样本仅提供公开预览，资源明确标注“公开预览（非完整影片）”；旧下载选择报告登录/观看权限，完整影片未宣称恢复。
- KBJ fan `kbjfan-mini-library.js` 为 1.0.2：补充 HTTP 状态、响应正文、8 秒截止时间和域名跳转诊断，加载失败不再返回成功的空首页或假播放线路。当前原域名连接中断，另一次网页读取跳到其他站点；用户 iPhone 测试也确认打不开。没有确认到官方替代地址，内容恢复仍待可用站点。

三个新增修复原先独立通过 64 项回归；与 MissAV、ASMRLIB、JAVGG、SexBJCam 整合后共 103 项媒体库回归及仓库检查通过。以上真实媒体结果来自桌面 HTTP；DreamBy/iPhone 的显示、原生起播及验证状态衔接仍需设备确认。用户报告的 IPX-559 所属媒体库尚待确认，本轮按麻豆亚洲版检查该影片。原下载路径全部保留；完整变更见 [PR #13](https://github.com/bbnotcode/ph_js/pull/13)。用户已要求发布这些改动，更新时沿用既有导入地址；无需删除媒体库重导。

ASMRLIB 1.2.2 的 BI/AB 使用“验证后播放”入口，在原详情页内选择线路并手动验证或点击播放。源设置中的“显示播放验证页面”默认开启。只有浏览器返回最终媒体地址才会交给原生播放器；若只返回网页或 blob，脚本会显示具体阶段。此流程的代码及模拟已验证，iPhone 嵌套媒体回传、自动交回和起播仍待设备确认。

## JAVGG 1.0.2 播放修复（历史记录，已撤回）

`javgg-mini-library.js` 保持原下载路径、媒体库 ID、`baseUrl` 参数和旧 `javgg://` 载荷。按实际 `data-nume` 对应 VH、playmate、luluvdoo、SW 线路，静态读取公开播放器的打包代码，不执行远程脚本。资源列表仅包含本次成功读取到的真实画质，最高画质默认；地址在每次播放时刷新。

画质发现与播放各有 28 秒总时限，播放器及清单 HTTP 阶段最多 4 秒；两路并发检查，某条线路失效不会抹掉其他可用线路。静态发现已有可用线路时直接返回；全部失败时最多一次 8 秒浏览器媒体捕获。已选线路播放的捕获最多 10 秒。404、验证页、非 HLS 响应会明确失败，临时发现失败可重新请求。脚本截止时间不能强制取消宿主已经启动的原生请求。

匿名桌面 HTTP 已验证 CAWB-046 的 luluvdoo 1080p、SW 1080p/720p/480p 和 MIRD-287 的 luluvdoo 720p，master、变体与分片可请求；ATID-666 的 SW 清单当时返回 404。首页/详情 HTTP 还可能遇到站点浏览器检查，浏览器正常打开不等于设备脚本能读取。DreamBy 浏览器回传、iPhone 原生起播与切画质仍待实测。

## SexBJCam 1.1.9 播放修复（历史记录，已撤回）

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
