# Bad News Dreamby 自定义媒体库

对应脚本：[bad-news-mini-library.js](./bad-news-mini-library.js)

## 功能

- 短视频、长视频和 H 动漫三个首页分组
- 分类二级页面和连续分页加载
- 成人内容关键词搜索
- 视频详情、资源线路和播放地址解析
- Twitter/X MP4、M3U8 播放
- H 动漫动态签名 MP4 地址刷新
- 同时兼容 bad.news 的桌面版与 iPhone 版 HTML

## 导入

1. 下载仓库中的 `bad-news-mini-library.js`。
2. 在 Dreamby 中打开自定义媒体库管理。
3. 导入该 JavaScript 文件。
4. 如果之前导入过旧版本，请先删除旧版本，避免缓存旧脚本。

当前脚本版本：`1.0.3`。

## 分页

站点当前使用以下分页地址：

- 短视频：`/tag/porn/page-{page}`
- 长视频：`/tag/long-porn/page-{page}`
- H 动漫：`/dm/page-{page}`

适配器返回 `page`、`hasMore`、`nextPage`、`pagecount`、`totalPages` 和 `total` 等分页字段，并兼容 Dreamby 可能传入的 `page`、`pg`、`currentPage`、`pageNumber`、`pageIndex` 等页码参数。

## 网络与兼容说明

- bad.news 会根据 User-Agent 返回不同页面结构。脚本同时支持桌面版列表结构和 iPhone 版移动列表结构。
- 普通 HTTP 请求没有返回有效媒体列表时，脚本会尝试使用 Dreamby 的隐藏浏览器请求。
- 首页包含有限的兜底条目，保证临时网络失败时仍有可显示内容；完整内容需要站点网络请求成功。
- H 动漫播放地址带有效期签名，脚本会在播放前重新请求详情页，不应长期缓存解析后的 MP4 地址。

## 已验证

- JavaScript 语法检查：`node --check bad-news-mini-library.js`
- 短视频第 2 页：25 项，可继续加载第 3 页
- 长视频第 2 页：25 项，可继续加载第 3 页
- H 动漫第 2 页：30 项，可继续加载第 3 页
- 测试时站点分页数量：短视频 400 页、长视频 400 页、H 动漫 619 页

站点内容和页面结构可能随时变化。桌面解析测试不能替代 Dreamby iPhone 客户端的最终播放验证。
