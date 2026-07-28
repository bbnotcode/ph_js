# User Request Template

Copy the template below and replace bracketed fields.

```text
请使用 baiplay-mini-library-builder，把下面的网站制作成 Dreamby / baiPlay 原生自定义媒体库：

目标网站：[URL]

我需要的范围：
- 首页分组：[逐项列出，例如短视频、长视频、动漫]
- 分类与排序：[需要哪些；如果没有证据，请不要自行虚构]
- 搜索：[需要 / 不需要]
- 详情页：[电影 / 剧集 / 直播]
- 播放要求：[MP4 / M3U8 / 直播 / 只保留 4K 等]
- 是否需要资源匹配：[需要 / 不需要]

请直接完成代码、测试和版本化交付，不要只给方案。

强制要求：
1. 先判断网站属于 API、服务端 HTML、Cloudflare、动态签名播放器、Twitter/X、直播/M3U 或混合类型，再选择实现方式；不要把同一种方案套到所有网站。
2. 优先分析公开 API；没有稳定 API 时再解析 HTML。
3. 同时检查桌面端和 iPhone User-Agent 返回的页面结构，不能只适配桌面 HTML。
4. 首页必须实际显示我列出的全部分组，不能只返回空的懒加载壳。
5. 每个有分页的分组都必须真实测试第 1 页和第 2 页，确认条目 ID 不重复，并实现连续加载。
6. 不得用有限内置兜底数据冒充完整列表；兜底只能用于诊断网络失败。
7. 兼容 Dreamby 的 JSON 字符串 ctx、Widget.http、$http、受限 JavaScript 运行环境和常见响应包装。
8. 详情、资源版本和 resolvePlayback 必须用一个真实样本完整往返验证。
9. 短期签名播放地址必须在播放时刷新，并保留正确的 Referer/Origin/User-Agent。
10. 遇到 Cloudflare 时识别挑战页，仅在必要页面使用 Widget.browser.fetch。
11. 分开报告静态检查、模拟运行、实时桌面探测和 iPhone Dreamby 验收，不能把它们合并成“全部验证通过”。

交付时请给我：
- 可直接导入的版本化 JS 文件；
- manifest 版本号；
- 各首页分组的实际条目数；
- 每个分类第 2 页的条目数、hasMore 和 nextPage；
- 一个真实详情与播放样本的验证结果；
- iPhone 上需要我依次确认的：首页 → 分类连续翻页 → 详情 → 资源版本 → 播放。
```

For a bug report, append:

```text
当前版本：[版本号]
出错步骤：[首页 / 分类 / 翻页 / 详情 / 资源版本 / 播放]
实际表现：[完整错误文字和数量]
期望表现：[应显示什么]
附件：[截图 / 录屏]
已确认正常的前一步：[例如首页正常、详情正常]
```
