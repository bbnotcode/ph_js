# stripchat-mouflon-proxy（Cloudflare Worker 版）

云端常驻版的 Mouflon 解密代理。逻辑与 `~/stripchat-mouflon-proxy/proxy.js` 完全一致，
只是跑在 Cloudflare 边缘，因此**任何设备、任何网络都能用，不需要自己的机器开机**。

线上地址：

```text
https://stripchat-mouflon-proxy.douyin-skip-community.workers.dev
```

## 部署 / 更新

```bash
cd worker
npx wrangler deploy
```

改动 `index.js` 后重新 deploy 即可；插件端不用动（地址不变）。

`~/stripchat-mouflon-proxy/worker/src/index.js` 是实际部署的那份，本目录与它保持一致，
改动后请同步过去再 deploy。

## 路由

| 路径 | 说明 |
| --- | --- |
| `/health` | 健康检查 |
| `/play/<streamId>/index.json` | 画质列表，边缘缓存 30s |
| `/play/<streamId>/<variant>.m3u8` | 解密后的媒体清单 |
| `/seg/segment.mp4?u=&k=` | 分片转发，边缘缓存 120s |
| `/sub/<文件名>` | 订阅源镜像，见下 |

### `/sub/` 订阅镜像

固定从 `bbnotcode/ph_js` 的 `main` 拉取（raw 优先，jsDelivr 兜底），只允许
`*.json` / `*.zip`，避免变成开放代理。

返回订阅索引时会把 `zipURLs` 改写成走本 Worker，原始地址保留在后面兜底，
这样设备只需要能连上 Cloudflare：

```text
https://stripchat-mouflon-proxy.douyin-skip-community.workers.dev/sub/source-index.json
```

索引边缘缓存 60 秒，zip 缓存 1 小时（同版本内容不变）。

## 密钥

内置了社区公开的 `pkey -> pdkey` 兜底表，运行时每 6 小时从
`https://mouflon.chantrail.com/api/keys` 自动同步一次。
若需要在不改代码的情况下覆盖，可在 Worker 里配置环境变量
`MOUFLON_KEYS_JSON`（形如 `{"pkey":"pdkey"}`）。

## 注意

- workers.dev 地址是公开的：知道地址的人都能调用。它只代理 Stripchat 的公开直播流，
  但会消耗你账号的 Workers 额度（免费版 10 万请求/天）。
- 观看一路直播大约 1 请求/秒（每 2 秒一个分片 + 清单刷新），
  也就是**连续看 24 小时约 8.6 万请求**，单设备基本卡在免费额度边缘。
  多设备或长时间挂机建议升级 Workers 付费版。
- `/seg` 只允许转发 `*.doppiocdn.*` / `*.stripchat.*`，其他上游返回 403，不会被当成开放代理。
