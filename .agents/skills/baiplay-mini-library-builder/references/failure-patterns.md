# Cross-Project Failure Patterns

This reference summarizes recurring problems across the Dreamby custom-media-library workspace. Classify the source before choosing an implementation.

## 1. Source classification mistakes

### API-backed sites

Examples: ePorner listing/detail APIs, Sorani CMS, TwiIdol ranking/history APIs.

Typical failures:

- Assuming every endpoint containing `/api/` returns JSON, or assuming non-`/api/` endpoints cannot return JSON.
- Reading only one response wrapper and missing raw strings, `data`, `body`, nested objects, or Fetch responses.
- Inventing categories or time filters that the API does not actually support.
- Treating an API success as proof that images, detail navigation, and playback work in Dreamby.

Preferred approach:

- Parse by response content and content type, not URL naming.
- Keep API list/detail models separate from playback resolution.
- Verify real paging metadata and one full item round trip.

### Server-rendered HTML sites

Examples: KBJFan, Taolusm, Pektino, Bad News.

Typical failures:

- Selectors match desktop markup but not mobile markup.
- A sidebar, recommendation card, or hidden template matches the selector before the real list.
- Regex block boundaries swallow adjacent cards or extract the wrong title/poster.
- Relative URLs, HTML entities, lazy-image attributes, and CSS background images are not normalized.
- Site locale, viewport, or User-Agent changes the page structure.

Preferred approach:

- Capture desktop and iPhone HTML separately.
- Require extracted media items, not merely a selector hit, before accepting a page.
- Test IDs, titles, posters, actions, and page 2 for every card layout.

### Cloudflare or browser-gated sites

Examples: MissAV variants, 1808, NO视频.

Typical failures:

- HTTP 200 contains a challenge page rather than media HTML.
- Retrying plain HTTP produces the same challenge indefinitely.
- Browser fallback is used for every request, making the adapter slow and fragile.
- A finite fallback list hides that live loading never succeeded.
- `cf_clearance`, cookies, or browser state are assumed to be permanent.

Preferred approach:

- Detect challenge markers before parsing.
- Use plain HTTP for stable list/detail pages when possible.
- Scope browser fetching to challenged pages or player execution.
- Return an explicit diagnostic when browser support/cookies are unavailable.

### Dynamic or signed-player sites

Examples: ePorner player hash and `/xhr/video`, GirigiriLove episode player pages, Sorani signed HLS.

Typical failures:

- Scraping a visible page but never locating the actual play page or player API.
- Caching a signed URL that expires before the user taps Play.
- Generating a fresh signature through a server/proxy HTTP client and then playing it from an iPhone whose IP or ASN does not match.
- Treating intermittent 403 as a bandwidth problem when Wi-Fi/cellular changes, VPNs, Private Relay, cookies, browser storage, or CDN authorization propagation are the real variable.
- Adding cache-busting but still resolving the token in the wrong network context.
- Passing the wrong item, episode, line, or version identifier into `resolvePlayback`.
- Omitting the exact detail/play-page Referer.
- Returning resource-version cards that cannot round-trip into playback.
- Assuming every item uses the same player shape because one sample worked.
- Treating the first browser-captured `.m3u8` as a master when it is already a selected media/variant playlist, so no `#EXT-X-STREAM-INF` qualities are found.
- Caching a transient quality-discovery failure as a permanent single default line.
- Blindly rewriting a variant filename to `master.m3u8` without source-specific evidence or while dropping the signed query.

Preferred approach:

- Model detail selection separately from playback resolution.
- Encode only stable identifiers in item/version IDs.
- Refresh tokens and signed URLs in `resolvePlayback`.
- Classify HLS content before parsing qualities: master playlists contain `#EXT-X-STREAM-INF`; media playlists contain `#EXTINF` and segments.
- Prefer an explicit master reference from player HTML/config/API over arbitrary captured media. Use variant-to-master reconstruction only after proving the source's URL relationship, and preserve the exact signature/query.
- Retry transient discovery with fresh authorization and cache only stable quality metadata. Never let a failed/default-only result poison an item's future resource versions.
- Determine whether tokens bind IP, ASN, cookies, storage, session, or User-Agent. If they do, generate and capture them through the device/browser context that will request the media.
- Keep browser execution scoped to token generation and signed media capture; do not move stable list/detail/search traffic into the browser.
- Prove basic playback first, then add multi-quality selection without changing the authorization path.
- Test `default → lower quality → default → reopen` rather than accepting one successful play.
- Test one real home-to-playback sample with the exact headers.

### Twitter/X media sources

Examples: TwiIdol, Pektino, Bad News.

Typical failures:

- Thumbnail works but video requests fail due to missing X/Twitter Referer or Origin.
- M3U8 and MP4 variants are treated as the same container.
- Search or ranking returns a user/account object but the adapter expects a media object.
- A direct media URL is embedded in an ID and later decoded incorrectly.
- Short-lived or deleted posts make bootstrap samples stale.

Preferred approach:

- Preserve stable tweet/media IDs and current best media URL separately.
- Use X/Twitter playback headers when required.
- Keep user collections and media cards as different item types.
- Refresh source data when detail or playback can do so.

### Live and M3U/IPTV sources

Examples: live-mini-library and subscription-based channel lists.

Typical failures:

- Treating a live channel like a movie with a detail page.
- Losing channel headers embedded in M3U attributes.
- Recursive playlists loop forever or cache failed content.
- Live HLS is returned with `isLive: false`.
- Large channel collections are loaded eagerly and freeze the client.

Preferred approach:

- Use direct play actions for channels where appropriate.
- Normalize channel headers and Referer aliases.
- Bound recursion, cache successful playlist content, and paginate large groups.
- Return `isLive: true` and `streamKind: "live"`.

## 2. Protocol and runtime failures shared by all classes

### Context-shape mismatch

Symptoms:

- Works in Node but Dreamby says an ID or URL is missing.
- Category always returns page 1.
- Playback works only from one entrypoint.

Causes:

- Reading only object context, while Dreamby passes JSON text.
- Reading only one field name such as `itemId` or `page`.
- Ignoring nested `params`, `settings`, `pagination`, or `pageInfo`.

Fix:

- Normalize context once.
- Accept established aliases without conflating unrelated values.
- Test object and JSON-string calls.

### Runtime-global mismatch

Symptoms:

- `当前环境没有可用的 HTTP 客户端`
- Desktop mock works, iPhone returns only a diagnostic card.

Causes:

- Looking only at `globalThis.Widget`.
- Supporting `Widget.http.get` but not `request`, or `$http` but not `Widget.http`.
- Assuming Node globals such as `URLSearchParams`, `Buffer`, DOMParser, or CommonJS always exist.

Fix:

- Use `typeof Widget !== "undefined"` and equivalent `$http` guards.
- Add minimal compatibility code and test inside a restricted VM.

### Home rendering mismatch

Symptoms:

- “没有返回可显示的媒体条目”
- Only one requested group appears.
- Hero renders, but sections are empty.

Causes:

- All sections are lazy and the client never invokes the custom load action.
- Section returns `undefined` after a request error.
- Cards lack type, poster, or detail/play action.
- Bootstrap data is malformed or stale.

Fix:

- Return a stable home ID and immediate real items.
- Always return a valid section object.
- Test the exact decoded home structure, not only the network helper.

### Pagination mismatch

Symptoms:

- Stops at 6, 12, 18, 25, or 30 items.
- Scrolling reloads page 1 or duplicates cards.
- Website has hundreds of pages but Dreamby reports no more content.

Causes:

- Fallback count is mistaken for source completion.
- Page input aliases are ignored.
- `hasMore` is guessed from item count without checking the source.
- Page 2 uses a different mobile template.
- Cursor pagination is treated as page-number pagination.

Fix:

- Fetch and compare page 1 and page 2.
- Return source-backed pagination metadata.
- Deduplicate by stable ID and stop when no new IDs arrive.
- Keep page-number, offset, and cursor models distinct.

### Image failures

Symptoms:

- Titles display but posters are blank.
- Detail image works on desktop but not iPhone.

Causes:

- Lazy source is in `data-src`, `data-echo`, `data-original`, or a CSS background.
- Relative/protocol-relative URLs are not normalized.
- Image CDN requires Referer/User-Agent.
- Signed thumbnail URL is expired.

Fix:

- Normalize all observed image attributes.
- Attach `imageHeaders`, `posterHeaders`, and `backdropHeaders` where needed.

### Detail/resource/playback contract mismatch

Symptoms:

- Detail opens, but no resource versions appear.
- Version appears, but Play reports “没有解析到播放地址”.
- Wrong episode or wrong line plays.

Causes:

- IDs are not reversible.
- Version actions omit stable item/episode/line context.
- `resolvePlayback` expects only one calling convention.
- Movie and series shapes are mixed.

Fix:

- Design and test an explicit payload codec.
- Test every transition independently.
- Use seasons/episodes for series and resource groups for playable lines.

## 3. Validation traps

- `node --check` proves syntax only.
- Fixture tests prove parser behavior only for that fixture.
- A successful API request does not prove Dreamby runtime compatibility.
- A reachable M3U8 manifest does not prove iPhone playback.
- JSON/MD5 validation does not prove client import.
- A fallback card proves rendering, not source connectivity.
- One successful sample does not prove search, pagination, every episode, or every quality.
- One successful video does not prove every item shares the same player, master-playlist exposure, or authorization path.

Use four separate evidence labels:

1. static/code validation;
2. fixture/runtime simulation;
3. live desktop/API/media probe;
4. Dreamby iPhone user confirmation.

Never collapse these into a single “fully verified” claim.

## 4. Recommended build sequence

1. Classify the source.
2. Prove list page/API data.
3. Prove real page 2 or cursor continuation.
4. Map one card into detail.
5. Prove one basic/default playback URL at play time in the same network context as the client.
6. Prove resource versions and multi-quality selection without changing the authorization context.
7. Exercise master capture, variant-only capture, and transient discovery failure against ordinary and outlier items.
8. Repeat default, lower quality, default, and reopen playback attempts.
9. Add search and secondary groups.
10. Add narrowly scoped fallback behavior.
11. Run static, fixture, live, and iPhone network-affinity probes.
12. Hand off a bumped version for iPhone acceptance.
