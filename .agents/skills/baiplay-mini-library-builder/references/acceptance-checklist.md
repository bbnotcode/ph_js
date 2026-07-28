# Dreamby Adapter Acceptance Checklist

Use this checklist for every new adapter and every client-reported regression. A syntax check or desktop parser test is never iPhone acceptance.

## 1. Define scope from evidence

- List the requested home groups, categories, search behavior, media types, and quality restrictions.
- Inspect the live source before inventing categories or sorting options.
- Prefer a stable JSON/API endpoint. Use HTML only when no deterministic API exists.
- Identify whether the source changes markup by User-Agent, locale, login state, or viewport.

## 2. Support Dreamby runtime shapes

- Accept both object context and JSON-string context.
- Read values from top level and common nested containers such as `params`, `config`, `settings`, `parameters`, `pagination`, and `pageInfo`.
- Detect `Widget` and `$http` with `typeof` guards. Support `get` and `request` where available.
- Unwrap common response shapes: raw string, `data`, `body`, `text`, nested `data.html`, and Fetch `response.text()`.
- Export canonical entrypoints on `globalThis` and `module.exports`; add established aliases only for compatibility.

## 3. Make the home page visibly useful

- Return a stable home `id`.
- Return at least one immediate non-lazy section with real media items.
- If multiple groups are requested, ensure every group is visible or intentionally lazy-loadable by the client.
- Do not let finite fallback items masquerade as the full library.
- Treat fallback cards as diagnostics and say when live loading failed.

## 4. Validate parsers against real response variants

- Capture representative desktop and mobile responses when the site varies by User-Agent.
- Require actual extracted media cards before calling HTML usable; a sidebar selector match is insufficient.
- Test title, ID, poster, detail action, and media type for every card layout.
- Treat Cloudflare markers such as `Just a moment`, `cf-mitigated`, and Cloudflare Ray IDs as stop-and-pivot signals.
- Use `Widget.browser.fetch` only for pages that genuinely need browser execution or when plain HTTP returns a challenge/incomplete body.

## 5. Prove genuine pagination

- Discover the real URL or API parameters for page 1 and page 2 in every section.
- Parse page 2 and verify its IDs differ from page 1.
- Accept common page inputs: `page`, `pg`, `currentPage`, `pageNumber`, and `pageIndex`.
- Return at least `page`, `hasMore`, and `items`; include `nextPage`, `pagecount`, `totalPages`, `limit`, and `total` when the client or source exposes them.
- Stop only when the source has no next page or returns no new items.
- Test short video, long video, anime, search, and every independent paginated group separately.

## 6. Round-trip navigation

- Home card action opens the intended detail.
- Home `moreAction` opens the intended category with correct `pageId` and aspect ratio.
- Category and search items open the same adapter's detail page.
- Series details contain seasons and episodes; movie details expose resource versions.
- When a video has multiple real qualities, expose all of them as separate versions ordered from highest to lowest resolution.
- Mark exactly one version as default, and make it the highest quality actually available for that video.
- Return the same quality choices from `getDetail().resourceGroups` and `getResourceVersions()` so the detail-page resource button and dynamic version loading agree.
- Do not advertise 1080P, 4K, or any other quality unless the source manifest, API, or player configuration proves that variant exists.
- Sample at least two ordinary videos and one reported or structurally different video; do not assume every item uses the same player or playlist shape.
- Accept playback identifiers from common fields such as `versionId`, `episodeId`, `itemId`, `id`, `url`, `path`, `playUrl`, and `videoUrl` when the source workflow needs them.

## 7. Resolve playback at play time

- Inspect one known detail/play sample end to end.
- Prove the default/basic stream works repeatedly before enabling multiple quality choices.
- Preserve exact Referer, Origin, User-Agent, Cookie, and other source-specific headers.
- Refresh short-lived signed URLs immediately before playback; never freeze them into bootstrap data.
- For signed multi-quality streams, keep stable quality identifiers in version actions and refresh the selected variant in `resolvePlayback()`.
- Determine whether the signature is bound to IP, ASN, cookies, browser storage, session, or User-Agent. Do not generate it through a server/proxy HTTP path when playback occurs directly from the device.
- When network affinity is present, obtain both the player token and signed master manifest through narrowly scoped device/browser execution or media capture. Use ordinary HTTP only for pages and endpoints proven not to bind authorization to the request environment.
- Add cache-busting and no-cache headers to player/token requests when the source rotates signatures, but do not blindly mutate signed media URLs after the source generates them.
- Classify every HLS response by content: `#EXT-X-STREAM-INF` identifies a master playlist; `#EXTINF` plus segments identifies a media/variant playlist. Do not treat the first captured `.m3u8` as a master merely because of its extension.
- Prefer the master URL explicitly present in player HTML, configuration, or API. If browser capture exposes only a selected variant, reconstruct a master only from a source-proven URL relationship and preserve the entire signed query string.
- Retry transient quality discovery a small bounded number of times using fresh authorization. Cache stable quality metadata only; never persist signed URLs, cookies, or a temporary default-only fallback.
- Simulate `weak network → failed detail discovery → good network → reopen the same item`. A transient failure must return no cacheable default-only resource group; a later resource-version request must rediscover qualities or reuse previously proven stable metadata.
- Verify direct Play selects the highest available quality, each lower-quality `versionId` selects its corresponding stream, and an unavailable requested quality falls back to the highest real variant.
- Run a sequential playback probe: default quality, lower quality, default quality again, exit/reopen, then play again. Confirm each attempt refreshes authorization and reaches a manifest or MP4 response.
- Test or explicitly report Wi-Fi/cellular changes, VPN/proxy/Private Relay use, and delayed retries when intermittent 403 is part of the reported symptom.
- Distinguish MP4, HLS/M3U8, and live streams correctly.
- Verify the manifest or MP4 range request is reachable, but do not call that iPhone playback proof.
- If Cloudflare or key generation is browser-only, scope browser use to playback resolution.

## 8. Release and handoff

- Bump the manifest version for every client-facing fix.
- Run `node --check` and a Dreamby-like runtime mock.
- Record counts for home groups and page 2 of each paginated group.
- State separately:
  - desktop/static checks passed;
  - live HTTP/API checks passed;
  - iPhone `首页 → 分类 → 详情 → 资源版本 → 播放` still unverified or user-confirmed.
- Provide a versioned reimport artifact or clearly instruct the user to delete the cached old version before importing.

## Symptom routing

- No visible items: inspect immediate home items, runtime globals, response unwrapping, and challenge HTML.
- Only one group: inspect lazy-section behavior and load actions.
- Fixed small count such as 6 or 12: verify whether fallback data is hiding a failed live parser.
- Cannot load more: inspect mobile markup, page-2 URL, page input fields, and pagination metadata.
- Detail works but playback fails: inspect actual play-page URL, identifier shape, signed URL refresh, and Referer.
- First play works, later play or quality switching returns 403: inspect cached player HTML, token reuse, proxy-versus-device IP/ASN, cookie/storage continuity, network switching, and whether signed manifests were fetched outside the playback network context.
- Resource button shows only a default line: inspect `getDetail().resourceGroups`, `getResourceVersions()`, whether browser capture returned a media/variant playlist instead of the master, whether a transient discovery failure was cached, stale per-item detail cache, ordering, and version-action round trips.
- Desktop works but iPhone fails: inspect User-Agent-specific markup and Dreamby runtime globals before rewriting the whole adapter.
