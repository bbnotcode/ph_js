---
name: baiplay-mini-library-builder
description: Build, port, update, or debug baiPlay custom mini media library JavaScript scripts and manifests. Use when Codex is asked to create a baiPlay "custom media library", "mini library", "mini app", "自定义媒体库", or "小程序媒体库" from a website, API, M3U/IPTV source, VOD subscription, AGC/Forward widget, or existing JS file; implement or fix getManifest, getHome, getHomeSection, getCategory, getDetail, getResourceVersions, resolvePlayback, search, matchResources, image headers, user parameters, section styles, live-channel direct play, Cloudflare/browser-fetch handling, or protocol validation.
---

# baiPlay Mini Library Builder

## Purpose

Create baiPlay custom mini media libraries as native-data adapters, not web views. The JavaScript returns structured media data, actions, images, headers, user parameters, and playback URLs; baiPlay owns the native UI, navigation, search page, playback strategy, playback history, and aggregation settings.

## First Steps

1. Locate the baiPlay repo when available. Prefer the current repo docs and examples over bundled reference notes:
   - `docs/小程序源设计规范.md`
   - `docs/examples/mini-library-sample.js`
   - `docs/examples/live-mini-library.js`
   - `docs/examples/novipnoad-mini-library.js`
   - `docs/examples/jable.media-library.js`
   - `docs/examples/libvio-agc-mini-library.js`
2. If the repo docs are not available, read `references/protocol.md`.
3. For a new adapter, optionally generate a starting file with:
   ```bash
   python3 /Users/baiguangli/.codex/skills/baiplay-mini-library-builder/scripts/scaffold_mini_library.py \
     --id example-library \
     --name "Example Library" \
     --base-url "https://example.com/" \
     --output /tmp/example-library.js
   ```
4. Inspect the target source before coding. Identify whether it is an API, static HTML site, M3U/IPTV list, VOD widget/subscription, AGC/Forward widget, or Cloudflare-protected site.
   Do not infer one universal player shape from one successful video. Inspect multiple ordinary items plus at least one reported or structural outlier because a site may mix master HLS playlists, already-selected variant playlists, MP4, and different player implementations.
5. Read `references/acceptance-checklist.md` for every new adapter or client-reported bug. Treat its desktop/mobile, pagination, runtime, playback, and handoff checks as required gates.
6. Read `references/failure-patterns.md` when selecting an architecture or diagnosing a failure. Classify the source first; do not apply an HTML, API, Cloudflare, signed-player, Twitter/X, or live-stream solution to a different source class without evidence.

## Implementation Workflow

1. Define `WidgetMetadata` and `getManifest()`.
   Include stable `id`, readable `name/title`, `version`, `author`, `logo/icon`, `capabilities`, `aggregation`, and any user `parameters`. Set the default author to `Alan huang` for all newly created or updated custom mini media libraries unless the user explicitly requests a different author. Do not inherit an author from another adapter or template. Use `objectList` for multiple subscriptions or account/API endpoint lists.

2. Build the home page around baiPlay's discover-style sections.
   Return `pageType: "home"`, `hero` or `carousel`, `heroAspectRatio`, and `sections`. Use lazy sections for slow remote data. Each section must return a valid object even on failure; never return `null` or `undefined` from `getHomeSection()`.

3. Map cards to media actions.
   Media cards normally use `{ type: "detail", itemId }`. Live channel cards may use `{ type: "play", itemId, url, title }` so tapping directly starts playback. Category/collection cards use `{ type: "category", pageId, title }`.

4. Implement category/list pages.
   Return `pageType: "category"`, `items`, optional `hasMore`, `page`, `sort/sortOptions`, `selectedSortValue`, and a page-level image ratio such as `itemAspectRatio: "16:9"` when cards are landscape.

5. Implement details with TMDB-like data.
   Return `title`, `type`, `poster`, `backdrop`, `detailImageAspectRatio`, `overview`, `year`, `rating`, `runtimeMinutes`, `genres`, `cast`, `seasons[].episodes[]`, `recommendations`, and optional inline `resourceGroups`. Use image headers/referer fields wherever the source requires anti-hotlinking.

6. Implement resource versions and playback.
   `getResourceVersions(ctx)` returns groups of playable versions or lines. `resolvePlayback(ctx)` returns only the resource description: `url`, `container`, `headers`, `startPositionSeconds`, `isLive`, and `streamKind`. Do not return or depend on playback strategy fields such as `preferDirectAVPlayer`, `forceDirectAVPlayer`, `playbackStrategy`, or `playerStrategy`; the App chooses the player path.
   When a video exposes multiple real qualities, list every available quality as a separate version, sort them from highest to lowest resolution, mark the highest available quality as `default: true`, and make direct Play resolve to that highest quality. Do not invent qualities that the source does not expose. Keep `getDetail().resourceGroups` and `getResourceVersions()` consistent because the detail-page resource button may read the inline groups first. For expiring or signed streams, store only stable quality identifiers in version actions and refresh the selected quality URL inside `resolvePlayback()`.
   Classify an HLS response by its contents before discovering qualities: a master playlist contains `#EXT-X-STREAM-INF`, while a media/variant playlist normally contains `#EXTINF` and segment references. Never assume the first captured `.m3u8` is the master. Prefer an explicit master URL from player HTML, configuration, or API over an arbitrary captured media request. Recover a master URL from a captured variant only when the source's own URL pattern proves the mapping; preserve the complete signed query string and do not apply a speculative filename rewrite across unrelated sources.
   Treat quality discovery as transient work. Retry a small bounded number of times with fresh player authorization, cache only stable quality metadata such as height, bandwidth, and a stable selector, and never cache signed URLs, cookies, or a temporary single “default line” fallback as permanent item truth. A failed attempt must not make one video lose its quality choices indefinitely.
   Account for client-side detail caching. If quality discovery fails transiently, do not return a successful inline “default line” resource group: return no inline group and let the dynamic resource-version request retry, or make that request fail explicitly so the client cannot cache failure as valid resource metadata. Persist previously proven stable quality metadata when host storage is available, but refresh every signed playback URL at play time.
   When quality switching requires noticeable re-resolution, explain it in the version subtitle, for example `切换时请稍候`. Do not invent unsupported toast/loading fields: the mini-library protocol does not let adapter code present UI while `resolvePlayback()` is running. A dynamic `正在切换画质中，请稍后` indicator must be implemented by the App around the pending playback-resolution call.
   Prove basic playback before adding quality selection. For IP-, ASN-, cookie-, or session-bound signatures, obtain the player token and signed manifest in the same device/browser network context that will play the media; prefer narrowly scoped `Widget.browser.fetch()` with media capture over a proxy-backed HTTP client. Add cache-busting only to token/player requests, preserve the exact player-page Referer and required cookies, and never assume that a URL reachable from Node or a server-side HTTP helper is authorized on iPhone.

7. Implement search only when supported.
   If manifest declares search support, `search(ctx)` must accept `query`, `keyword`, and `text`, return a standard search page or item array, and make every result open the mini-library detail page.

8. Implement resource matching only when explicitly requested.
   `matchResources(ctx)` is reserved for future TMDB detail matching. Declare the supported parameters in manifest if used, but avoid adding it when the user has asked not to support matching yet.

## Source Handling Rules

- Prefer official JSON/API endpoints or deterministic HTML parsing with correct headers.
- Do not use a visible browser for ordinary list/detail/search pages. Use `Widget.browser.fetch()` only for real browser-only pages such as Cloudflare verification, player key generation, canvas/sessionStorage/localStorage checks, or media request capture.
- If a site is Cloudflare-protected, let normal pages degrade gracefully and keep browser verification scoped to the page that actually needs it.
- Preserve source-specific request headers, cookies, referers, and user agents. Playback headers belong in `resolvePlayback()`. Image headers belong on items, detail images, cast images, episode stills, or recommendation items.
- Treat intermittent HTTP 403 from a signed CDN as a network-affinity signal, not merely an expiry or speed problem. Compare the environment that creates the signature with the environment that requests the manifest and segments. Wi-Fi/cellular changes, VPNs, Private Relay, proxies, and different ASNs can invalidate otherwise fresh URLs.
- Keep browser use narrow: ordinary pages stay on HTTP/API; only token generation, signed player execution, and signed-manifest capture should use the device/browser path when evidence requires it.
- Keep JS responsible for adaptation and parsing. Do not duplicate App UI, App playback decisions, playback history writes, or global search routing inside the script.

## Validation

Run the fastest checks that fit the adapter:

```bash
node --check path/to/library.js
node scripts/validate_mini_library_examples.js
```

For source-specific scripts, also run small function calls with local stubs for `$http`, `Widget.http`, `$cache`, or `Widget.vod` when possible. Verify at least:

- `getManifest()` returns valid metadata and capabilities.
- `getHome()` returns a non-empty page or valid lazy sections.
- Each `getHomeSection()` path returns a section object.
- Category/search/detail actions round-trip into `getCategory()`, `search()`, and `getDetail()`.
- Series details include episodes; movie details include resource versions.
- Multi-quality videos expose every real quality in descending order in both inline detail groups and `getResourceVersions()`, with exactly one highest-quality default.
- Quality discovery is tested against master-playlist capture, variant-only capture, and player HTML/config that exposes the master; playlist type is decided from HLS tags rather than the `.m3u8` suffix.
- Direct Play and every quality `versionId` round-trip through `resolvePlayback()` to the intended stream; a missing requested quality falls back to the highest actually available quality.
- Signed playback survives a sequential `default → lower quality → default → reopen` test, with a fresh token or media URL for every play attempt and no proxy/device network mismatch.
- Test at least two ordinary videos and one reported or structurally different video. Simulate transient discovery failures followed by success and verify that no failed/default-only result poisons later detail or resource-version calls.
- `resolvePlayback()` returns a final playable URL, container, headers, and live/VOD flags.
- List parsing is tested against the target site's desktop and mobile responses when they differ.
- Page 2 is fetched and parsed for every paginated section; do not infer pagination from page 1 alone.
- Dreamby iPhone behavior is reported separately from desktop, Node, API, and browser simulation.

## Reference

Read `references/protocol.md` for the compact baiPlay protocol, style tokens, data shapes, host APIs, and common pitfalls.

Read `references/acceptance-checklist.md` for implementation and release gates derived from real Dreamby failures.

Read `references/failure-patterns.md` for recurring failure modes across API, HTML, Cloudflare, signed-player, Twitter/X, series, and live/M3U adapters.

When the user asks how to request a new adapter, give them the reusable template in `references/request-template.md`.
