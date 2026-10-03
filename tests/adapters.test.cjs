const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function load(file, additions = {}) {
  const context = vm.createContext({ console: { log() {}, warn() {}, error() {} }, URL, URLSearchParams, Buffer, atob, btoa,
    TextDecoder, TextEncoder, setTimeout, clearTimeout, module: { exports: {} },
    Widget: { http: { async get() { return { status: 200, statusCode: 200, data: '<html><body></body></html>' }; } }, storage: { get() { return null; } } }, ...additions });
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file, timeout: 2000 });
  return context;
}
function plain(value) { return JSON.parse(JSON.stringify(value)); }
const master = '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1920x1080\n1080.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=900000,RESOLUTION=1280x720\n720.m3u8\n';
const media = '#EXTM3U\n#EXT-X-TARGETDURATION:4\n#EXTINF:4,\nsegment.ts\n';

for (const file of ['123av-mini-library.js', 'girigirilove-mini-library.js', 'kbjfan-mini-library.js', 'taolusm-mini-library.js', 'xxxfollow-mini-library 5.js']) {
  test(`${file}: object and JSON-string search contexts request the same page`, async () => {
    const c = load(file); const requests = [];
    c.Widget.http.get = async (url) => { requests.push(url); return { status: 200, data: '<html><body></body></html>' }; };
    c.Widget.http.post = async (url, body) => { requests.push(url + '|' + body); return { status: 200, data: '<html><body></body></html>' }; };
    const input = { query: 'A&B #tag', page: 2 };
    await c.search(input).catch(() => {}); const objectRequests = requests.splice(0);
    await c.search(JSON.stringify(input)).catch(() => {});
    assert.ok(objectRequests.length > 0); assert.deepEqual(requests, objectRequests);
  });
}

test('Jable home waits for one category; all remaining categories load lazily', async () => {
  const c = load('jable.media-library.js'); let calls = 0;
  c.loadPosterWall = async () => { calls++; return [{ id: 'fresh', title: 'Fresh', poster: 'https://img.test/fresh.jpg' }]; };
  const home = await c.getHome({});
  assert.equal(calls, 1); assert.equal(home.hero.length, 1);
  assert.ok(home.sections.filter(s => s.lazy).length > 20);
  const section = await c.getHomeSection({ sectionId: 'hot' });
  assert.equal(section.lazy, false); assert.equal(section.items.length, 1); assert.equal(calls, 2);
});
test('Jable refreshes a saved detail playback action even when it contains an old URL', async () => {
  const c = load('jable.media-library.js'); let calls = 0;
  c.getDetail = async () => { calls++; return { id: 'https://jable.tv/videos/a/', link: 'https://jable.tv/videos/a/', videoUrl: 'https://cdn.test/fresh.m3u8' }; };
  const result = await c.resolvePlayback({ itemId: 'https://jable.tv/videos/a/', versionId: 'https://jable.tv/videos/a/#hls', url: 'https://cdn.test/expired.m3u8' });
  assert.equal(result.url, 'https://cdn.test/fresh.m3u8'); assert.equal(calls, 1);
});
test('591AV fails an incomplete two-page batch and keeps its page available for retry', async () => {
  const c = load('591av-mini-library.js'); let calls = 0;
  c.fetchText = async () => { if (++calls === 1) throw new Error('temporary failure'); return '<html></html>'; };
  const result = await c.getCategory({ pageId: 'new', page: 1 });
  assert.ok(result.error); assert.equal(result.nextPage, 1); assert.equal(result.hasMore, true); assert.equal(result.items.length, 0);
});
test('591AV recovers the same batch without skipping source page one', async () => {
  const c = load('591av-mini-library.js'); const requests = [];
  c.fetchText = async (ctx, url) => { requests.push(url); return url; };
  c.parseCards = html => [{ id: new URL(html).searchParams.get('from') === '2' ? 'source-two' : 'source-one', title: 'Video' }];
  const first = await c.getCategory({ pageId: 'new', page: 1 });
  const retry = await c.getCategory({ pageId: 'new', page: 1 });
  assert.deepEqual(plain(retry.items), plain(first.items)); assert.equal(requests[0], requests[2]); assert.equal(requests[1], requests[3]);
  assert.deepEqual(plain(first.items.map(item => item.id)), ['source-one', 'source-two']);
});
test('591AV home does not wait for six category previews', async () => {
  const c = load('591av-mini-library.js'); let calls = 0;
  c.fetchText = async () => { calls++; return 'latest'; }; c.parseCards = () => [{ id: 'latest', poster: 'https://img.test/a.jpg' }];
  const home = await c.getHome({}); assert.equal(calls, 1); assert.equal(home.sections[0].lazy, true);
});

for (const file of ['madou8-domestic-mini-library.js', 'madou8-mini-library 5.js']) {
  for (const requested of [1080, 0, 2160]) {
    test(`${file}: lower first line does not hide the later 1080P line (${requested})`, async () => {
      const c = load(file); const requestedURLs = [];
      c.fetchHlsText = async (ctx, url) => { requestedURLs.push(url); return media; };
      const result = await c.chooseStream({}, [{ url: 'https://cdn.test/720p/stream.m3u8' }, { url: 'https://cdn.test/1080p/stream.m3u8' }], requested, 'https://madou8.pw/detail');
      assert.equal(result.height, 1080); assert.equal(requestedURLs.length, 2);
    });
  }
  test(`${file}: master-discovered lower fallback still explores another line`, async () => {
    const c = load(file);
    c.fetchHlsText = async (ctx, url) => url.includes('master720') ? master.replace(/1920x1080/g, '1280x720').replace(/1080\.m3u8/g, '720.m3u8') : media;
    const result = await c.chooseStream({}, [{ url: 'https://cdn.test/master720.m3u8' }, { url: 'https://cdn.test/1080p/stream.m3u8' }], 1080, 'https://madou8.pw/detail');
    assert.equal(result.height, 1080);
  });
}
test('1808 network failure is labeled historical and cannot generate playable lines', async () => {
  const c = load('1808-mini-library.js'); c.Widget.http.get = async () => { throw new Error('offline'); };
  const home = await c.getHome({}); assert.ok(home.sections[0].error); assert.match(home.sections[0].title, /历史/); assert.match(home.hero[0].subtitle, /历史/);
  await assert.rejects(c.getDetail({ itemId: '/movies/new_slug.html' }), /offline/);
  await assert.rejects(c.resolvePlayback({ itemId: '/movies/new_slug.html' }), /offline/);
  assert.equal(c.syntheticPlaybackLines, undefined);
});
test('1808 defaults to the highest real source line and validates the current HLS', async () => {
  const c = load('1808-mini-library.js');
  c.fetchText = async (ctx, url) => url.includes('.m3u8') ? media : '<html>current</html>';
  c.parseDetailPage = () => ({ title: 'Film', poster: '', overview: '', actorText: '', related: [], referer: 'https://1808.online/movies/a.html', urls: [
    { title: '360P', url: 'https://cdn.test/360/a.m3u8' }, { title: '720P', url: 'https://cdn.test/720/a.m3u8' }] });
  const detail = await c.getDetail({ itemId: '/movies/a.html' }); assert.equal(detail.resourceGroups[0].versions[0].name, '720P');
  const result = await c.resolvePlayback({ itemId: '/movies/a.html' }); assert.equal(result.url, 'https://cdn.test/720/a.m3u8');
});
test('Giri excludes history links, bounds episode groups and preserves parent item IDs', async () => {
  const c = load('girigirilove-mini-library.js');
  const history = '<a href="/play/999-1-1/">2026</a>';
  assert.equal(c.parseDetail({}, history, 'film').episodes.length, 0);
  const html = '<h1>Series</h1><span class="slide-info-remarks">更新至1集</span><div class="anthology-list-box"><div><a x-effect="visible => show()" href="/play/123-1-1/">1</a></div></div>' + history;
  c.fetchText = async () => html;
  const result = await c.getDetail({ itemId: 'series' }); assert.equal(result.type, 'series'); assert.equal(result.seasons[0].episodes.length, 1);
  const action = result.seasons[0].episodes[0].action;
  assert.equal(c.decodePayload(action.itemId).id, 'series'); assert.equal(c.decodePayload(action.episodeId).id, 'play/123-1-1');
  c.fetchText = async () => '<h1>Film</h1><div class="anthology-list-box"><a href="/play/456-1-1/">正片</a></div>';
  const film = await c.getDetail({ itemId: 'film' }); assert.equal(film.type, 'movie'); assert.equal(film.seasons.length, 0); assert.equal(film.resourceGroups.length, 1);
});
test('Giri parses quoted > in card attributes and never caches HTTP errors', async () => {
  const c = load('girigirilove-mini-library.js');
  const html = '<a x-effect="visible => show()" class="public-list-exp" href="/video/123/" title="Good"><img src="https://img.test/a.jpg"></a>';
  assert.equal(c.parseCards({}, html).length, 1);
  c.Widget.http.get = async () => ({ status: 503, data: '<html><title>Service Unavailable</title></html>' });
  await assert.rejects(c.fetchText({}, 'https://girigirilove.com/video/123/'), /503/);
  c.Widget.http.get = async () => ({ status: 200, data: html });
  assert.equal(await c.fetchText({}, 'https://girigirilove.com/video/123/'), html);
});
test('MissAV does not invoke player/browser fallbacks after a complete master discovery', async () => {
  const c = load('missav-mini-library-download-working 6.js'); let linked = 0, browser = 0;
  c.fetchText = async () => '<script>var source="https://cdn.test/master.m3u8"</script>';
  c.discoverAvailableQualities = async () => [{ height: 1080, url: 'https://cdn.test/1080.m3u8' }, { height: 720, url: 'https://cdn.test/720.m3u8' }];
  c.extractPlayableFromLinkedPlayers = async () => { linked++; return ''; }; c.extractFromBrowser = async () => { browser++; return ''; };
  const result = await c.resolvePlayback({ itemId: c.makeItemId('https://missav.ws/cn/a', 'A', '') });
  assert.equal(result.url, 'https://cdn.test/1080.m3u8'); assert.equal(linked, 0); assert.equal(browser, 0);
});
test('MissAV accepts the original 1.0.7 detail payload and all legacy parameter names', () => {
  const c = load('missav-mini-library-download-working 6.js');
  const old = 'missav://detail?url=https%3A%2F%2Fmissav.ws%2Fdm247%2Fcn%2Fsample&title=Old';
  assert.equal(c.detailUrlFromContext({ itemId: old }), 'https://missav.ws/dm247/cn/sample');
  const names = c.getManifest().parameters.map(p => p.name);
  for (const name of ['baseURL', 'entryPath', 'backupBaseURLs', 'enableBrowserFallback', 'browserVisible', 'requestTimeoutSeconds', 'cacheMinutes']) assert.ok(names.includes(name));
});

const missavFile = 'missav-mini-library-download-working 6.js';
const missavPage = '<html><title>Sample - MissAV</title><body>' +
  '<script>var source="https://cdn.test/playlist.m3u8";var source1920="https://cdn.test/1080p/video.m3u8";var source1280="https://cdn.test/720p/video.m3u8";</script>' +
  '<script src="/cdn-cgi/challenge-platform/scripts/jsd/main.js"></script></body></html>';
function missavInput(c) { return { itemId: c.makeItemId('https://missav.ws/cn/sample-001', 'Sample', '') }; }
function acceleratedTimers() { return { setTimeout: (fn, ms) => setTimeout(fn, ms / 100) }; }

test('MissAV HTTP 200 passive Cloudflare detection is not a blocking challenge', async () => {
  const c = load(missavFile); const requests = []; let browser = 0;
  c.Widget.http.get = async url => { requests.push(url); return { statusCode: 200, data: url.includes('.m3u8') ? master : missavPage }; };
  c.Widget.browser = { async fetch() { browser++; throw new Error('browser must not be needed'); } };
  const result = await c.resolvePlayback(missavInput(c));
  assert.equal(result.url, 'https://cdn.test/1080.m3u8');
  assert.equal(browser, 0);
  assert.deepEqual(requests, ['https://missav.ws/cn/sample-001', 'https://cdn.test/playlist.m3u8']);
  assert.equal(c.isCloudflare(missavPage, 200, { server: 'cloudflare' }), false);
  for (const [html, status, headers] of [
    ['<html><title>Just a moment...</title><body>Verify you are human</body></html>', 200, {}],
    [missavPage, 200, { 'Cf-Mitigated': 'challenge' }], [missavPage, 403, {}]
  ]) assert.equal(c.isUsableHTML(html, status, headers), false);
});
test('MissAV uses its one browser call for media capture after a real challenge', async () => {
  const c = load(missavFile); const browserCalls = [], requests = [];
  c.Widget.http.get = async url => { requests.push(url); return { statusCode: 200, data: url.includes('.m3u8') ? master : '<html><title>Just a moment...</title><body>Enable JavaScript and cookies to continue</body></html>' }; };
  c.Widget.browser = { async fetch(url, options) { browserCalls.push({ url, options }); return { mediaSources: [{ url: 'https://cdn.test/playlist.m3u8' }] }; } };
  assert.equal((await c.resolvePlayback(missavInput(c))).url, 'https://cdn.test/1080.m3u8');
  assert.equal(browserCalls.length, 1); assert.equal(browserCalls[0].options.captureMedia, true);
  assert.equal(browserCalls[0].options.visible, false); assert.equal(requests.length, 2);
});
test('MissAV a host that ignores HTTP timeout still reaches media capture before the total deadline', async () => {
  const c = load(missavFile, acceleratedTimers()); let browser = 0, requests = 0;
  c.Widget.http.get = async url => { requests++; return url.includes('.m3u8') ? { status: 200, data: master } : new Promise(() => {}); };
  c.Widget.browser = { async fetch() { browser++; return { mediaSources: [{ url: 'https://cdn.test/playlist.m3u8' }] }; } };
  assert.equal((await c.resolvePlayback(missavInput(c))).url, 'https://cdn.test/1080.m3u8');
  assert.equal(browser, 1); assert.equal(requests, 2);
});
test('MissAV a hung browser reports the failing media stage without retrying mirrors', async () => {
  const c = load(missavFile, acceleratedTimers()); let browser = 0, requests = 0;
  c.Widget.http.get = async () => { requests++; throw new Error('offline'); };
  c.Widget.browser = { async fetch() { browser++; return new Promise(() => {}); } };
  await assert.rejects(c.resolvePlayback(missavInput(c)), error => /stage=browser-media/.test(error.message) && !/total-deadline/.test(error.message));
  assert.equal(browser, 1); assert.equal(requests, 1);
});
test('MissAV a hung optional master probe hands off the highest HTML quality without another browser', async () => {
  const c = load(missavFile, acceleratedTimers()); let browser = 0;
  c.Widget.http.get = async url => url.includes('.m3u8') ? new Promise(() => {}) : { status: 200, data: missavPage };
  c.Widget.browser = { async fetch() { browser++; return new Promise(() => {}); } };
  assert.equal((await c.resolvePlayback(missavInput(c))).url, 'https://cdn.test/1080p/video.m3u8');
  assert.equal(browser, 0);
});
test('MissAV playback refreshes detail HTML instead of using cached signed source URLs', async () => {
  const c = load(missavFile); let refreshes = 0;
  c.setCachedText({}, 'https://missav.ws/cn/sample-001', missavPage);
  c.Widget.http.get = async url => { if (url.includes('.m3u8')) return { status: 200, data: media }; refreshes++; return { status: 200, data: missavPage.replaceAll('https://cdn.test/', 'https://fresh.test/' + refreshes + '/') }; };
  assert.equal((await c.resolvePlayback(missavInput(c))).url, 'https://fresh.test/1/1080p/video.m3u8');
  assert.equal((await c.resolvePlayback(missavInput(c))).url, 'https://fresh.test/2/1080p/video.m3u8');
  assert.equal(refreshes, 2);
});
test('MissAV optional master discovery reserves time to hand off an already discovered stream', async () => {
  let offset = 0, masterTimeout;
  class PlaybackClock extends Date { static now() { return Date.now() + offset; } }
  const c = load(missavFile, { ...acceleratedTimers(), Date: PlaybackClock });
  c.Widget.http.get = async (url, options) => {
    if (url.includes('.m3u8')) { masterTimeout = options.timeoutSeconds; return new Promise(() => {}); }
    offset = 26500; return { status: 200, data: missavPage };
  };
  assert.equal((await c.resolvePlayback(missavInput(c))).url, 'https://cdn.test/1080p/video.m3u8');
  assert.ok(masterTimeout > 0 && masterTimeout <= 1);
});
test('MissAV resource discovery failure does not become a fake playable webpage', async () => {
  const c = load('missav-mini-library-download-working 6.js');
  c.fetchText = async () => { throw new Error('503'); }; c.extractFromBrowser = async () => '';
  const groups = await c.getResourceVersions({ itemId: c.makeItemId('https://missav.ws/cn/a', 'A', '') });
  assert.equal(Array.isArray(groups) ? groups.length : groups.groups?.length || 0, 0);
});
for (const file of ['missav-mini-library-download-working 6.js', 'sexbjcam-mini-library.js', 'javgg-mini-library.js', 'novipnoad-mini-library.js']) {
  test(`${file}: a hung resolver has one overall deadline`, async () => {
    const c = load(file, { setTimeout: (fn) => setTimeout(fn, 15) });
    c.resolvePlaybackWithinBudget = async () => new Promise(() => {});
    const start = Date.now(); await assert.rejects(c.resolvePlayback({}), /total-deadline/); assert.ok(Date.now() - start < 500);
  });
}
test('XXXFollow refreshes a saved payload instead of trusting its expired cached URL', async () => {
  const c = load('xxxfollow-mini-library 5.js');
  const old = c.makePlaybackPayload('fresh', 'https://cdn.test/old.mp4', '', 'Saved');
  c.findById = () => ({ id: 'fresh', videoUrl: 'https://cdn.test/new.mp4', title: 'New' });
  const result = await c.resolvePlayback({ itemId: old, url: 'https://cdn.test/old.mp4' }); assert.equal(result.url, 'https://cdn.test/new.mp4');
});
test('4KVM retains the historical version ID without claiming every captured stream is 1080P', async () => {
  const c = load('4kvm-dreamby-mini-library.js');
  assert.equal(c.kvmVersions('1')[0].id, 'public-1080'); assert.match(c.kvmVersions('1')[0].name, /自动/);
  c.Widget.browser = { async fetch() { return { mediaSources: [{ url: 'https://cdn.test/360.mp4' }] }; } };
  assert.equal((await c.resolvePlayback({ itemId: '1' })).url, 'https://cdn.test/360.mp4');
  c.Widget.browser.fetch = async () => ({ mediaSources: [{ url: 'https://cdn.test/ads/1080.mp4' }, { url: 'https://cdn.test/main/360.mp4' }] });
  assert.equal((await c.resolvePlayback({ itemId: '1' })).url, 'https://cdn.test/main/360.mp4');
});
test('Pornhub sorts by actual quality and marks only the highest as default', () => {
  const c = load('pornhub.media-library.js');
  const result = c.sortMediaSources([{ id: '360', quality: 360, default: true }, { id: '1080', quality: 1080, default: false }]);
  assert.deepEqual(plain(result.map(x => x.quality)), [1080, 360]); assert.equal(result.filter(x => x.default).length, 1);
});
test('Manko keeps successful navigation cards when one category fails', async () => {
  const c = load('manko-fun-mini-library.js'); let active = 0, max = 0;
  c.primaryNavCard = async definition => { active++; max = Math.max(max, active); await Promise.resolve(); active--; if (definition[0] === 'new') throw new Error('offline'); return { id: definition[0], poster: 'https://img.test/a.jpg' }; };
  const section = await c.getHomeSection({ sectionId: 'primary-nav' }); assert.ok(section.items.length > 0); assert.ok(max <= 2);
});
test('ASMRLIB category previews come from their own category and load after home', async () => {
  const c = load('asmrlib-mini-library.js'); c.asmrHTTP = async () => '<html></html>';
  c.asmrParseList = () => [{ id: 'home', poster: 'https://img.test/home.jpg' }];
  const home = await c.getHome(); assert.equal(home.sections[1].lazy, true);
  const requested = []; c.getCategory = async ({ pageId }) => { requested.push(pageId); return { items: [0,1,2].map(i => ({ id: `${pageId}-${i}`, poster: `https://img.test/${pageId}-${i}.jpg` })) }; };
  const section = await c.getHomeSection({ sectionId: 'categories' }); assert.ok(requested.length >= 3);
  assert.ok(section.items.every(x => x.previewItems[0].id.startsWith(x.action.pageId + '-')));
});
const asmrPost = 'becd2651e7d56ca656d27766d036dcee';
const asmrCurrentPage = '<html><h1>ASMR sample</h1><div id="players"><button data-url="https://bysetayico.com/e/current">BI</button><button data-url="https://abyssplayer.com/current">AB</button></div><div id="downloads"></div></html>';
test('ASMRLIB current embedded players expose one interactive page action consistently', async () => {
  const c = load('asmrlib-mini-library.js');
  c.Widget.http.get = async () => ({ status: 200, data: asmrCurrentPage });
  const input = { itemId: 'asmrlib://post/' + asmrPost };
  const detail = await c.getDetail(input), groups = await c.getResourceVersions(input);
  assert.deepEqual(plain(groups), plain(detail.resourceGroups));
  const versions = groups[0].versions;
  assert.equal(versions.length, 1); assert.equal(versions[0].default, true);
  assert.equal(versions[0].action.itemId, input.itemId);
  assert.equal(c.asmrId(versions[0].action.versionId), asmrPost);
  assert.match(versions[0].subtitle, /验证或播放/);
});
for (const player of ['https://bysetayico.com/e/old', 'https://abyssplayer.com/old']) {
  test(`ASMRLIB legacy ${new URL(player).host} action preserves the original embedding page`, async () => {
    const c = load('asmrlib-mini-library.js'); const calls = []; let http = 0;
    c.Widget.http.get = async () => { http++; throw new Error('unnecessary detail refresh'); };
    c.Widget.browser = { async fetch(url, options) { calls.push({ url, options }); return { mediaSources: [{ url: 'https://cdn.test/main.m3u8', requestHeaders: { referer: player, origin: new URL(player).origin } }] }; } };
    const input = { itemId: 'asmrlib://post/' + asmrPost, versionId: 'asmrlib-line://old/' + encodeURIComponent(player) };
    const result = await c.resolvePlayback(JSON.stringify(input));
    assert.equal(result.url, 'https://cdn.test/main.m3u8'); assert.equal(result.container, 'm3u8');
    assert.equal(calls.length, 1); assert.equal(http, 0);
    assert.equal(calls[0].url, 'https://asmrlib.com/posts/' + asmrPost); assert.equal(calls[0].options.visible, true);
    assert.equal(calls[0].options.waitForMediaSource, true);
    assert.equal(calls[0].options.captureRequests, undefined); assert.equal(calls[0].options.captureMedia, undefined);
    assert.equal(result.headers.Referer, player); assert.equal(result.headers.Origin, new URL(player).origin);
  });
}
test('ASMRLIB page-version-only input uses captured media headers and not outer document headers', async () => {
  const c = load('asmrlib-mini-library.js');
  c.Widget.browser = { async fetch() { return { headers: { Origin: 'https://outer.test' }, capturedRequests: [{ url: 'https://cdn.test/final.mp4', headers: { Referer: 'https://player.test/', Origin: 'https://player.test', Cookie: 'verified=sample', Connection: 'keep-alive' } }] }; } };
  const result = await c.resolvePlayback({ versionId: 'asmrlib-page://post/' + asmrPost });
  assert.equal(result.url, 'https://cdn.test/final.mp4'); assert.equal(result.headers.Origin, 'https://player.test');
  assert.equal(result.headers.Cookie, 'verified=sample'); assert.equal(result.headers.Connection, undefined);
});
test('ASMRLIB refuses blob-only results and records capability evidence without retrying players', async () => {
  const c = load('asmrlib-mini-library.js'); let calls = 0;
  c.Widget.browser = { async fetch() { calls++; return { html: '<video src="blob:https://player.test/id"></video>', mediaSources: [{ url: 'blob:https://player.test/id' }] }; } };
  await assert.rejects(c.resolvePlayback({ itemId: asmrPost }), error => /stage=page-media/.test(error.message) && /blobOnly=true/.test(error.message) && /keys=html,mediaSources/.test(error.message));
  assert.equal(calls, 1);
});
test('ASMRLIB honors hidden-page preference and reports manual verification requirements', async () => {
  const c = load('asmrlib-mini-library.js'); let visible;
  c.Widget.browser = { async fetch(url, options) { visible = options.visible; return { html: '<p>点击播放按钮以验证你是真人</p>' }; } };
  await assert.rejects(c.resolvePlayback({ itemId: asmrPost, params: { browserVisible: false } }), /stage=verification-required/);
  assert.equal(visible, false); assert.equal(c.getManifest().parameters[0].defaultValue, true);
});
test('ASMRLIB bounds a hung host browser and preserves the stage without exposing native exceptions', async () => {
  const c = load('asmrlib-mini-library.js', { setTimeout: (fn, ms) => setTimeout(fn, ms / 100) }); let calls = 0;
  c.Widget.browser = { async fetch() { calls++; return new Promise(() => {}); } };
  await assert.rejects(c.resolvePlayback({ itemId: asmrPost }), /stage=page-media/); assert.equal(calls, 1);
  c.Widget.browser.fetch = async () => { throw new Error('Cookie=session-secret https://cdn.test/?token=secret'); };
  await assert.rejects(c.resolvePlayback({ itemId: asmrPost }), error => /stage=page-media/.test(error.message) && !/secret/.test(error.message));
});
test('ASMRLIB old UP failure falls back once to the embedded page instead of skipping browser capture', async () => {
  const c = load('asmrlib-mini-library.js', { $crypto: { aesDecrypt() { throw new Error('unsupported AES'); } } }); let browser = 0, timeout;
  c.Widget.http.get = async (url, options) => { timeout = options.timeout; return { data: 'abcdef123456' }; };
  c.Widget.browser = { async fetch(url) { browser++; assert.equal(url, 'https://asmrlib.com/posts/' + asmrPost); return { mediaURL: 'https://cdn.test/current.mp4' }; } };
  const versionId = 'asmrlib-line://UP/' + encodeURIComponent('https://v.upn.one/#legacycode');
  const result = await c.resolvePlayback({ itemId: asmrPost, versionId });
  assert.equal(result.url, 'https://cdn.test/current.mp4'); assert.equal(browser, 1); assert.equal(timeout, 5);
  assert.equal(result.headers.Origin, undefined); assert.equal(result.headers.Referer, undefined);
});
test('ASMRLIB retains direct media compatibility without requiring a browser', async () => {
  const c = load('asmrlib-mini-library.js');
  assert.equal((await c.resolvePlayback({ url: 'https://cdn.test/legacy.mp4' })).url, 'https://cdn.test/legacy.mp4');
});
test('Jable Forward adds sorting and page parameters once', async () => {
  const c = load('jable.js'); let captured;
  c.Widget.http.get = async url => { captured = new URL(url); throw new Error('fixture stop'); };
  await assert.rejects(c.search({ keyword: 'A&B #tag', sort_by: 'video_viewed', from: 2 }), /fixture stop/);
  assert.deepEqual(captured.searchParams.getAll('sort_by'), ['video_viewed']); assert.deepEqual(captured.searchParams.getAll('from'), ['2']);
  assert.equal(captured.searchParams.get('q'), 'A&B #tag');
});

for (const keyword of ['中文 空格', 'A&B #tag', 'C++ 100%', '"quoted"']) {
  test(`Forward search retains special characters: ${keyword}`, async () => {
    const c91 = load('91porny_int.js'); let url91;
    vm.runInContext('widgetAPI.getHtml = async function(url) { globalThis.capturedSearchURL = url; throw new Error("stop"); }', c91);
    await c91.search({ keyword, page: 2 }); url91 = new URL(c91.capturedSearchURL);
    assert.equal(url91.searchParams.get('keywords'), keyword); assert.equal(url91.searchParams.get('page'), '2'); assert.equal(url91.hash, '');
    const cPH = load('pornhub_int.js'); let urlPH;
    cPH.Widget.http.get = async url => { urlPH = new URL(url); throw new Error('stop'); };
    await assert.rejects(cPH.getSearchResults({ search_query: keyword, page: 2 }), /stop/);
    assert.equal(urlPH.searchParams.get('search'), keyword.trim().toLowerCase().replace(/[\s\-]+/g, ' '));
    assert.equal(urlPH.searchParams.get('page'), '2'); assert.equal(urlPH.hash, '');
  });
}

test('Giri selected episode keeps its version and resolves its own play page', async () => {
  const c = load('girigirilove-mini-library.js');
  const parent = c.encodePayload({id:'GV123'}); const selected = c.encodePayload({id:'play/123-1-2',episodeTitle:'第2集'});
  const groups = await c.getResourceVersions({itemId:parent, episodeId:selected});
  assert.equal(groups[0].versions.length, 1); assert.equal(c.decodePayload(groups[0].versions[0].id).id,'play/123-1-2');
  const pages = []; c.resolvePlayPage = async (ctx,id) => {pages.push(id);return {url:'https://cdn.test/episode2.m3u8'};};
  const result = await c.resolvePlayback({itemId:parent, episodeId:selected,versionId:groups[0].versions[0].id});
  assert.equal(result.url,'https://cdn.test/episode2.m3u8'); assert.deepEqual(pages,['play/123-1-2']);
});

for (const mode of ['expired', 'rejected']) {
  test(`MissAV Forward refreshes a ${mode} URL and can recover after failure`, async () => {
    const c = load('MissAV 3.0.js'); const requests = [];
    c.Widget.html = { load: () => selector => ({length: selector === '#videodetails' ? 1 : 0,attr: () => 'https://missav.ai/cn/ABP-123'}) };
    c.extractVideoUrlFromHtml = () => 'https://cdn.test/new.m3u8';
    vm.runInContext(`VIDEO_URL_CACHE['ABP-123'] = {url:'https://cdn.test/old.m3u8',timestamp:Date.now()-${mode === 'expired' ? 61000 : 1000},referer:'https://missav.ai/cn/ABP-123'}`,c);
    c.Widget.http.get = async url => {requests.push(url);return url.includes('old.m3u8') ? {statusCode:403,data:''} : {statusCode:200,data:'<html>detail</html>'};};
    const result = await c.loadResource({code:'ABP-123'});
    assert.equal(result[0].url,'https://cdn.test/new.m3u8'); assert.ok(requests.some(url => url.includes('/cn/search/')));
    assert.equal(requests.some(url => url.includes('old.m3u8')),mode === 'rejected');
    c.Widget.http.get = async () => {throw new Error('temporary');};
    assert.equal((await c.loadResource({code:'ABP-123'})).length,0);
    c.Widget.http.get = async () => ({statusCode:200,data:'<html>detail</html>'});
    assert.equal((await c.loadResource({code:'ABP-123'}))[0].url,'https://cdn.test/new.m3u8');
  });
}

test('MissAV playback budget owns browser fallback and preserves attached cookies', () => {
  const c = load('missav-mini-library-download-working 6.js');
  const options = c.requestOptions({__playbackBudget:{endAt:Date.now()+2000,expired:false}},'https://missav.ws/');
  assert.ok(options.timeout > 0 && options.timeout <= 2); assert.equal(options.useBrowserFallback,false); assert.equal(options.attachBrowserCookie,true);
});

test('Novip playback awaits native browser media and caps both HTTP and browser stages', async () => {
  const c = load('novipnoad-mini-library.js'); const calls=[];
  c.parsePlayInfo = () => ({vid:'video123',pkey:'key'}); c.parseEpisodes = () => [];
  c.Widget.http.get = async (url,options) => {calls.push(options);return {status:200,data:'<html>detail</html>'};};
  c.Widget.browser = {async fetch(url,options){calls.push(options);return {mediaSources:['https://cdn.test/final.m3u8']};}};
  const result = await c.resolvePlayback({itemId:'/movie/123.html'});
  assert.equal(result.url,'https://cdn.test/final.m3u8'); assert.equal(calls.length,2);
  assert.ok(calls[0].timeout <= 6 && calls[1].timeout <= 12);
});

test('Context normalization keeps user parameter precedence and distinct content/episode IDs', async () => {
  const c = load('girigirilove-mini-library.js'); const requests=[];
  c.Widget.http.get = async url => {requests.push(url);return {status:200,data:'<html></html>'};};
  await c.getCategory(JSON.stringify({pageId:'latest',parameters:JSON.stringify({page:2}),params:{baseURL:'https://custom.test'},config:{baseURL:'https://ignored.test'}}));
  assert.ok(requests.length > 0); assert.ok(requests.every(url=>url.startsWith('https://custom.test/')));
  const parent=c.encodePayload({id:'GV123'}); const episode=c.encodePayload({id:'play/123-1-2'});
  c.resolvePlayPage = async (ctx,id) => ({url:'https://cdn.test/'+id.split('-').pop()+'.m3u8'});
  assert.equal((await c.resolvePlayback(JSON.stringify({itemId:parent,episodeId:episode}))).url,'https://cdn.test/2.m3u8');
});

test('XVideos attaches the configured session token without printing it', async () => {
  const logs=[]; const token='fixture-session-secret';
  const c=load('xvideos_int.js',{console:{log:(...args)=>logs.push(args.join(' ')),error:(...args)=>logs.push(args.join(' '))},setTimeout:()=>0});
  c.Widget.storage.getItem=async()=>token;
  const options=await vm.runInContext('widgetAPI.getDefaultOptions()',c);
  assert.equal(options.headers.Cookie,'session_token='+token); assert.ok(logs.every(line=>!line.includes(token)));
});

const madouCard = id => `<div class="streamit-video-card rounded-3" data-preview="https://img.test/preview.mp4"><a href="/asian/zh-CN/video/cid/${id}"><img src="https://img.test/${id}.jpg" alt="${id}"></a></div>`;
const taoluPage = (id, source, preview = true) => `<h1>Film ${id}</h1><video id="player"></video>${preview ? '正在播放预览，VIP可免费观看完整视频' : ''}<script>const video_id = '${id}'; document.addEventListener('DOMContentLoaded', () => { const source = '${source}'; });</script><video data-src="https://img.test/snapshots/999.mp4"></video>`;

test('KBJ unavailable home reports the source failure instead of successful empty media', async () => {
  const c = load('kbjfan-mini-library.js'); c.Widget.http.get = async () => { throw new Error('connection closed'); };
  await assert.rejects(c.getHome({}), /KBJFan 加载失败.*connection closed/);
  const section = await c.getHomeSection({ sectionId: 'dance' }); assert.equal(section.items.length, 0); assert.match(section.error, /connection closed/);
});
test('KBJ rejects a repurposed domain redirect and does not invent a replacement', async () => {
  const c = load('kbjfan-mini-library.js'); c.Widget.http.get = async () => ({ statusCode: 200, finalURL: 'https://other.test/', data: '<h1>Other site</h1>' });
  await assert.rejects(c.getHome({}), /跳转到其他站点/);
  c.Widget.http.get = async () => ({ statusCode: 403, data: '<html>Forbidden</html>' });
  await assert.rejects(c.getHome({}), /HTTP 403/);
});
test('KBJ accepts request-only HTTP and nested response HTML while preserving old contexts', async () => {
  const c = load('kbjfan-mini-library.js'); const calls = [];
  c.Widget.http = { async request(options) { calls.push(options); return { statusCode: 200, body: { html: '<posts class="posts-item"><h2 class="item-heading"><a href="/film/">Film</a></h2><img data-src="/poster.jpg"></posts>' } }; } };
  const home = await c.getHome(JSON.stringify({ params: JSON.stringify({ baseURL: 'https://kbj.test' }) }));
  assert.equal(home.hero[0].id, 'https://kbj.test/film/'); assert.equal(calls[0].url, 'https://kbj.test/koreanbjdance/'); assert.equal(calls[0].browserFallback, false);
});
test('KBJ and Taolu bound a hung response body as well as their HTTP request', async () => {
  for (const file of ['kbjfan-mini-library.js', 'taolusm-mini-library.js']) {
    const c = load(file, { setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms, 15)) });
    c.Widget.http.get = async () => ({ statusCode: 200, text: () => new Promise(() => {}) });
    await assert.rejects(c.fetchText({}, 'https://source.test/'), /超时/);
  }
});
test('Madou first screen loads only recent media; category artwork remains lazy', async () => {
  const c = load('madou8-mini-library 5.js'); const calls = [];
  c.Widget.http.get = async url => { calls.push(url); return { statusCode: 200, body: { html: madouCard('first') } }; };
  const home = await c.getHome(JSON.stringify({ params: JSON.stringify({ baseUrl: 'https://madou.test' }) }));
  assert.deepEqual(calls, ['https://madou.test/asian/zh-CN/videos/recent']); assert.equal(home.hero[0].id, 'first');
  assert.equal(home.sections[0].lazy, true); assert.equal(home.sections[1].items[0].rank, 1);
});
test('Madou page failures do not turn into successful empty home or fake qualities', async () => {
  const c = load('madou8-mini-library 5.js'); c.Widget.http.get = async () => ({ statusCode: 403, data: '<h1>Forbidden</h1>' });
  await assert.rejects(c.getHome({}), /HTTP 403/);
  c.Widget.http.get = async () => ({ statusCode: 200, data: '<html>No cards</html>' });
  await assert.rejects(c.getHome({}), /未收到影片列表/);
  c.fetchStreamInfo = async () => ({ playlist: [{ url: 'https://invalid.test/stream.m3u8' }] }); c.fetchHlsText = async () => { throw new Error('HTTP 403'); };
  await assert.rejects(c.buildPlaybackGroups({}, 'https://madou.test/detail', 'uid', 'Film'), /没有可验证/);
});
test('Madou one challenged page can return native browser HTML without media capture or retry stacks', async () => {
  const c = load('madou8-mini-library 5.js'); let browsers = 0;
  c.Widget.http.get = async () => ({ statusCode: 403, data: '<title>Just a moment</title>' });
  c.Widget.browser = { async fetch(url, options) { browsers++; assert.equal(options.visible, false); assert.equal(options.waitForMediaSource, undefined); return { html: madouCard('verified') }; } };
  const home = await c.getHome({}); assert.equal(home.hero[0].id, 'verified'); assert.equal(browsers, 1);
  await assert.rejects(c.fetchHlsText({}, 'https://cdn.test/master.m3u8', 'https://madou.test/'), /HTTP 403/); assert.equal(browsers, 1);
});
test('Madou relative cards and signed HLS paths round-trip without URL global', () => {
  const c = load('madou8-mini-library 5.js', { URL: undefined });
  const items = c.parseCards(madouCard('film'), {});
  assert.equal(items[0].action.detailUrl, 'https://madou8.pw/asian/zh-CN/video/cid/film');
  assert.equal(c.resolveURL('../720/video.m3u8?sig=a/b#part', 'https://cdn.test/token/master.m3u8'), 'https://cdn.test/720/video.m3u8?sig=a/b#part');
});
test('Madou evaluates a working line beyond the old first-four limit and skips web-only schemes', async () => {
  const c = load('madou8-mini-library 5.js'); const calls = [];
  const playlist = Array.from({length: 5}, (_, i) => ({ url: `https://cdn.test/${i}/master.m3u8` }));
  playlist.unshift({ url: 'https://enc.test/stream.m3u8', playMode: 'streampipe' }, { url: 'https://web.test/stream.m3u8', native: false });
  c.fetchHlsText = async (ctx, url) => { calls.push(url); if (url.includes('/4/')) return url.endsWith('master.m3u8') ? master : media; throw new Error('HTTP 403'); };
  const chosen = await c.chooseStream({}, playlist, 1080, 'https://madou.test/detail');
  assert.equal(chosen.height, 1080); assert.match(chosen.url, /\/4\/1080.m3u8/); assert.ok(!calls.some(url => /enc.test|web.test/.test(url)));
});
test('Madou retains public player Accept-sign headers for master, variant and native playback', async () => {
  const c = load('madou8-mini-library 5.js'); const calls = [];
  c.Widget.http.get = async (url, options) => { calls.push({url, headers: options.headers}); return {statusCode:200,data:url.endsWith('master.m3u8') ? master : media}; };
  const chosen = await c.chooseStream({}, [{url:'https://cdn.test/master.m3u8',urlSign:'opaque normal value'}], 720, 'https://madou.test/detail');
  assert.equal(chosen.height, 720); assert.equal(chosen.headers.Accept, '*/*;sign=opaque%20normal%20value');
  assert.ok(calls.every(x => x.headers.Accept === chosen.headers.Accept)); assert.equal(chosen.headers.Origin, undefined);
  const q = await c.discoverVariants({}, [{url:'https://cdn.test/master.m3u8',urlSign:'private-now'}], 'https://madou.test/detail');
  assert.ok(!JSON.stringify(q).includes('private-now'));
});
test('Madou original media playlists expose honest original quality and refresh before every play', async () => {
  const c = load('madou8-mini-library 5.js'); let api = 0;
  c.Widget.http.get = async url => ({statusCode:200,data:url.includes('/api/video/stream') ? JSON.stringify({playlist:[{url:`https://cdn.test/stream.m3u8?fresh=${++api}`,urlSign:`now-${api}`} ]}) : media});
  const detail = 'https://madou8.pw/asian/zh-CN/video/cid/film';
  const groups = await c.buildPlaybackGroups(c.madouContext({}), detail, 'uid', 'Film');
  assert.equal(groups[0].versions[0].name, '原始画质'); assert.ok(!JSON.stringify(groups).includes('now-'));
  const action = groups[0].versions[0].action;
  for (const height of [0, 720, 0]) {
    const result = await c.resolvePlayback(JSON.stringify({...action,qualityId:height,url:'https://expired.test/file.m3u8'}));
    assert.match(result.url, new RegExp(`fresh=${api}$`)); assert.equal(result.headers.Accept, `*/*;sign=now-${api}`);
  }
  assert.equal(api, 4);
});
test('Madou media discovery caps concurrency and the overall deadline when native requests hang', async () => {
  const c = load('madou8-mini-library 5.js', {setTimeout:(fn,ms)=>setTimeout(fn,Math.min(ms,20))}); let active=0,max=0;
  c.Widget.http.get = async () => { active++; max=Math.max(max,active); return new Promise(()=>{}); };
  const playlist=Array.from({length:9},(_,i)=>({url:`https://cdn.test/${i}/master.m3u8`}));
  const start=Date.now(); await assert.rejects(c.chooseStream({__deadline:Date.now()+25},playlist,0,'https://madou.test/detail'), /stage=/);
  assert.ok(Date.now()-start<150); assert.ok(max<=6); // timed-out native calls cannot be cancelled; logical workers remain three
});
test('Taolu detail and versions identify public previews, not download/login pages or recommendations', async () => {
  const c=load('taolusm-mini-library.js'); const calls=[];
  c.Widget.http.get=async url=>{calls.push(url);return {statusCode:200,data:taoluPage('121576','https://tl.test/preview_mp4/121576.mp4')};};
  const detail=await c.getDetail({itemId:'121576'}); const version=detail.resourceGroups[0].versions[0];
  assert.equal(version.name,'公开预览（非完整影片）'); assert.equal(version.url,undefined); assert.match(detail.overview,/完整影片需要/);
  const result=await c.resolvePlayback(JSON.stringify(version.action)); assert.equal(result.url,'https://tl.test/preview_mp4/121576.mp4'); assert.equal(result.container,'mp4'); assert.equal(result.headers.Origin,undefined);
  assert.ok(calls.every(url=>url.endsWith('/v/121576'))); assert.equal(c.parsePlaybackSource(taoluPage('other','https://tl.test/preview_mp4/other.mp4'),'121576').url,'');
});
test('Taolu old complete/download choices report access requirements instead of silently substituting previews', async () => {
  const c=load('taolusm-mini-library.js');c.Widget.http.get=async()=>({statusCode:200,data:taoluPage('121576','https://tl.test/preview_mp4/121576.mp4')});
  await assert.rejects(c.resolvePlayback({versionId:'download-121576'}),/旧下载线路需要/);
  await assert.rejects(c.resolvePlayback({url:'https://taolusm.com/download/121576'}),/旧下载线路需要/);
  assert.equal(c.itemIdFromContext({itemId:'https://taolusm.com/v/121576?year=2026'}),'121576');
});
test('Taolu missing source, HTTP errors and login redirects never become MP4 playback results', async () => {
  const c=load('taolusm-mini-library.js');
  for(const response of [{statusCode:200,data:'<video data-src="https://tl.test/snapshots/999.mp4"></video>'},{statusCode:403,data:'Forbidden'},{statusCode:200,finalURL:'https://taolusm.com/login',data:'Login'}]) {
    c.Widget.http.get=async()=>response;
    await assert.rejects(c.resolvePlayback({itemId:'121576'}),/未提供|HTTP 403|需要站点登录/);
  }
});

test('Madou history refresh ignores an old media URL when only stable item/version is present', async () => {
  const c=load('madou8-mini-library 5.js');const version=c.encodeVersionId({url:'https://madou8.pw/asian/zh-CN/video/cid/film',uid:'uid',height:720});
  assert.equal(c.detailURL({itemId:'film',url:'https://expired.test/stream.m3u8'}),'https://madou8.pw/asian/zh-CN/video/cid/film');
  assert.equal(c.detailURL({versionId:version,url:'https://expired.test/stream.m3u8'}),'https://madou8.pw/asian/zh-CN/video/cid/film');
});
test('Madou native response body timeouts and logical media concurrency remain bounded', async () => {
  const c=load('madou8-mini-library 5.js',{setTimeout:(fn,ms)=>setTimeout(fn,Math.min(ms,15))});
  c.Widget.http.get=async()=>({statusCode:200,text:()=>new Promise(()=>{})});
  await assert.rejects(c.getHome({}),/stage=page-http/);
  let active=0,max=0;
  const results=await c.madouMap([1,2,3,4,5,6,7],3,async value=>{active++;max=Math.max(max,active);await new Promise(resolve=>setTimeout(resolve,3));active--;return value;});
  assert.deepEqual(plain(results),[1,2,3,4,5,6,7]);assert.equal(max,3);
});
test('KBJ unrelated HTML cannot create fake playable lines or successful first categories', async () => {
  const c=load('kbjfan-mini-library.js');c.Widget.http.get=async()=>({statusCode:200,data:'<title>Other site</title>'});
  await assert.rejects(c.getCategory({pageId:'dance'}),/没有原站影片/);
  const detail=await c.getDetail({itemId:'https://www.kbjfan.com/old-film/'});assert.equal(detail.resourceGroups.length,0);
  await assert.rejects(c.getResourceVersions({itemId:'https://www.kbjfan.com/old-film/'}),/没有可播放媒体/);
});
