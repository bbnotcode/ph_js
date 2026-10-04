const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
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

for (const file of ['123av-mini-library.js', 'girigirilove-mini-library.js', 'xxxfollow-mini-library 5.js']) {
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

for (const file of ['madou8-domestic-mini-library.js']) {
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
for (const file of ['novipnoad-mini-library.js']) {
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

// These entrypoints restore the online snapshot before the 2026-10-03 task.
// Later recovery behavior is intentionally absent from the restored scripts.
const restoration = JSON.parse(fs.readFileSync(path.join(root, 'tools/library-restoration.json'), 'utf8'));
assert.equal(restoration.cutoff, '2026-10-03T00:00:00+08:00');
assert.match(restoration.baselineCommit, /^[0-9a-f]{40}$/);
const restoredIds = {
  'missav-mini-library.js': 'missav-mini-library',
  'sexbjcam-mini-library.js': 'sexbjcam-mini-library',
  'madou8-mini-library 5.js': 'madou8-mini-library',
  'taolusm-mini-library.js': 'taolusm-mini-library',
  'kbjfan-mini-library.js': 'kbjfan-mini-library',
  'missav-mini-library-CloudFlare.js': 'missav-mini-library',
  'missav-mini-library-download-working.js': 'missav-mini-library',
  'missav-mini-library-download-working 6.js': 'missav-mini-library'
};
assert.deepEqual(Object.keys(restoration.files).sort(), Object.keys(restoredIds).sort());
for (const [file, original] of Object.entries(restoration.files)) {
  test(`${file}: bytes match the pre-task online snapshot`, () => {
    const bytes = fs.readFileSync(path.join(root, file));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), original.sha256);
  });
  test(`${file}: restored manifest and public entrypoints retain the pre-task snapshot contract`, () => {
    const c = load(file);
    const manifest = c.getManifest();
    assert.equal(manifest.id, restoredIds[file]);
    assert.equal(manifest.version, original.version);
    assert.ok(manifest.name && manifest.title);
    assert.equal(manifest.aggregation.search, true);
    for (const entry of ['getHome', 'getHomeSection', 'getCategory', 'getDetail', 'getResourceVersions', 'resolvePlayback', 'search']) {
      assert.equal(typeof c[entry], 'function', entry);
    }
  });
}
test('MissAV pre-task entrypoints preserve their distinct implementations and working alias', () => {
  const canonical = fs.readFileSync(path.join(root, 'missav-mini-library.js'));
  const cloudflare = fs.readFileSync(path.join(root, 'missav-mini-library-CloudFlare.js'));
  const working = fs.readFileSync(path.join(root, 'missav-mini-library-download-working.js'));
  assert.notDeepEqual(canonical, cloudflare);
  assert.notDeepEqual(canonical, working);
  assert.deepEqual(fs.readFileSync(path.join(root, 'missav-mini-library-download-working 6.js')), working);
});
test('MissAV pre-task snapshot retains direct HLS playback and its detail identifier', async () => {
  const c = load('missav-mini-library.js'); let requests = 0;
  c.Widget.http.get = async () => { requests++; throw new Error('direct playback should not fetch detail'); };
  const itemId = c.makeItemId('https://missav.ws/cn/sample', 'Sample', '');
  assert.equal(c.detailUrlFromContext({ itemId }), 'https://missav.ws/cn/sample');
  const playback = await c.resolvePlayback({ itemId, url: 'https://cdn.test/original.m3u8' });
  assert.equal(playback.url, 'https://cdn.test/original.m3u8');
  assert.equal(playback.container, 'm3u8'); assert.equal(requests, 0);
});
test('ASMRLIB current embedded players share the original page and retain old line IDs', async () => {
  const c = load('asmrlib-mini-library.js');
  const post = 'becd2651e7d56ca656d27766d036dcee';
  c.Widget.http.get = async () => ({ data: '<h1>Sample</h1><div id="players"><button data-url="https://bysetayico.com/e/sample">BI</button><button data-url="https://abyssplayer.com/sample">AB</button></div><div id="downloads"></div>' });
  const detail = await c.getDetail({ itemId: 'asmrlib://post/' + post });
  const groups = await c.getResourceVersions({ itemId: 'asmrlib://post/' + post });
  assert.deepEqual(plain(groups), plain(detail.resourceGroups));
  const versions = groups[0].versions;
  assert.equal(versions.length, 1);
  assert.equal(versions[0].name, '验证后捕获播放源');
  assert.equal(c.asmrVersionPlayerURL(versions[0].action), 'https://asmrlib.com/posts/' + post);
  assert.equal(versions[0].default, true);
  assert.equal(c.asmrVersionPlayerURL({versionId: 'asmrlib-line://BI/' + encodeURIComponent('https://bysetayico.com/e/sample')}), 'https://bysetayico.com/e/sample');
  assert.equal(c.getManifest().version, '1.2.3');
  assert.equal(restoration.supersededFiles['asmrlib-mini-library.js'].replacementVersion, '1.2.3');
});

test('ASMRLIB reads capturedRequests and preserves the actual media request headers', async () => {
  const c = load('asmrlib-mini-library.js'); const calls = []; const post = 'becd2651e7d56ca656d27766d036dcee';
  c.Widget.browser = { async fetch(url, options) { calls.push({url, options}); return {
    capturedRequests: [{url: 'https://cdn.test/master.m3u8', requestHeaders: {referer: 'https://abyssplayer.com/', 'user-agent': 'DeviceUA'}}]
  }; } };
  const result = await c.resolvePlayback(JSON.stringify({itemId: 'asmrlib://post/' + post, versionId: 'asmrlib-line://AB/' + encodeURIComponent('https://abyssplayer.com/sample')}));
  assert.equal(result.url, 'https://cdn.test/master.m3u8'); assert.equal(result.headers.Referer, 'https://abyssplayer.com/');
  assert.equal(result.headers['User-Agent'], 'DeviceUA'); assert.equal(result.headers.Origin, undefined);
  assert.equal(calls.length, 1); assert.equal(calls[0].url, 'https://asmrlib.com/posts/' + post); assert.equal(calls[0].options.waitForMediaSource, undefined);
});
test('ASMRLIB nested JSON capture supports page-version-only playback', async () => {
  const c = load('asmrlib-mini-library.js'); const post = 'becd2651e7d56ca656d27766d036dcee';
  c.Widget.browser = {async fetch(){return JSON.stringify({data:{result:{mediaSources:['https://cdn.test/current.mp4']}}});}};
  const result = await c.resolvePlayback({versionId:'asmrlib-page://post/' + post});
  assert.equal(result.url,'https://cdn.test/current.mp4'); assert.deepEqual(plain(result.headers),{});
});
test('ASMRLIB uses at most one visible capture after a loaded hidden page', async () => {
  const c = load('asmrlib-mini-library.js'); const calls = [];
  c.Widget.browser = {async fetch(url,options){calls.push(options);return options.visible ? {mediaSources:['https://cdn.test/current.mp4']} : {html:'点击播放按钮以验证你是真人'};}};
  await c.resolvePlayback({itemId:'asmrlib://post/becd2651e7d56ca656d27766d036dcee'});
  assert.equal(calls.length,2); assert.equal(calls[0].visible,false); assert.equal(calls[1].visible,true); assert.equal(calls[1].waitForMediaSource,true);
});
test('ASMRLIB rejects blobs and does not scrape ad media from arbitrary HTML', async () => {
  const c=load('asmrlib-mini-library.js'); let calls=0;
  c.Widget.browser={async fetch(){calls++;return {mediaSources:['blob:https://player.test/123'],html:'<script>var ad="https://cdn.test/advert.mp4"</script>'};}};
  await assert.rejects(c.resolvePlayback({itemId:'asmrlib://post/becd2651e7d56ca656d27766d036dcee'}),/stage=blob-only/); assert.equal(calls,2);
});
test('ASMRLIB hanging host is bounded and never starts an overlapping fallback', async () => {
  const c=load('asmrlib-mini-library.js',{setTimeout:fn=>setTimeout(fn,10)});let calls=0;
  c.Widget.browser={fetch(){calls++;return new Promise(()=>{});}};
  await assert.rejects(c.resolvePlayback({itemId:'asmrlib://post/becd2651e7d56ca656d27766d036dcee'}),/stage=hidden-capture/);assert.equal(calls,1);
});
test('ASMRLIB hidden preference fails explicitly and a later attempt can succeed', async () => {
  const c=load('asmrlib-mini-library.js');let available=false;const calls=[];
  c.Widget.browser={async fetch(url,options){calls.push(options);return available?{mediaSources:['https://cdn.test/retry.mp4']}:{html:'点击播放按钮以验证你是真人'};}};
  const input={itemId:'asmrlib://post/becd2651e7d56ca656d27766d036dcee',params:{browserVisible:false}};
  await assert.rejects(c.resolvePlayback(input),/stage=verification-required/);assert.equal(calls.length,1);available=true;
  assert.equal((await c.resolvePlayback(input)).url,'https://cdn.test/retry.mp4');assert.ok(calls.every(x=>x.visible===false));
});
test('KBJ pre-task snapshot object search retains the configured domain and page', async () => {
  const c = load('kbjfan-mini-library.js'); const requests = [];
  c.Widget.http.get = async url => { requests.push(url); return { data: '<html></html>' }; };
  const result = await c.search({ query: 'A&B #tag', page: 2, params: { baseURL: 'https://kbj.test' } });
  assert.deepEqual(requests, ['https://kbj.test/?s=A%26B%20%23tag&paged=2']);
  assert.equal(result.pageType, 'search'); assert.equal(result.page, 2);
});
test('Taolu pre-task snapshot retains its download version and original playback gateway', () => {
  const c = load('taolusm-mini-library.js');
  const groups = c.getResourceVersions({ itemId: '121576' });
  assert.equal(groups[0].versions[0].id, 'download-121576');
  assert.equal(groups[0].versions[0].url, 'https://taolusm.com/download/121576');
  const playback = c.resolvePlayback({ itemId: '121576' });
  assert.equal(playback.url, groups[0].versions[0].url);
  assert.equal(playback.container, 'mp4');
});

function javggListHTML(slugs, next) {
  return '<html><body><div class="items">' + slugs.map(slug =>
    '<article class="item movies"><div class="poster"><img data-src="https://img.test/' + slug + '.jpg"></div>' +
    '<div class="data"><h3><a href="https://javgg.net/jav/' + slug + '/">Video ' + slug + '</a></h3></div></article>'
  ).join('') + '</div>' + (next ? '<a class="next" href="' + next + '">Next</a>' : '') + '</body></html>';
}
function javggDetail(lines = ['VH', 'playmate', 'luluvdoo', 'SW']) {
  return '<div id="dooplay_player_content"><ul>' + lines.map((line, i) =>
    `<li data-nume="${i + 1}" data-post="579441" class="dooplay_player_option"><span class="title">Server</span><span class="server">${line}</span></li>`).join('') + '</ul>' + lines.map((line, i) =>
    `<div class="source-box" id="source-player-${i + 1}"><div class="pframe"><iframe src="https://player${i + 1}.test/e/film"></iframe></div></div>`).join('') + '</div>';
}
function packedJavgg(host = 'cdn', file = 'master', signature = 'fresh') {
  return `eval(function(p,a,c,k,e,d){return p;}('0({1:[{2:"3://4.5/6.7?8=9"}]});',36,10,'setup|sources|file|https|${host}|test|${file}|m3u8|sign|${signature}'.split('|'),0,{}))`;
}

test('JAVGG maps real server labels to numbered frames, despite missing/reordered frames', () => {
  const c = load('javgg-mini-library.js');
  const source = javggDetail().replace(/<div class="source-box" id="source-player-1">[\s\S]*?<\/div><\/div>/, '');
  const players = c.parsePlayers(source);
  assert.deepEqual(plain(players.map(x => [x.lineId, x.line])), [['2','playmate'],['3','luluvdoo'],['4','SW']]);
  assert.equal(players[0].url, 'https://player2.test/e/film');
  const groups = players.map(x => c.qualityGroup('https://javgg.net/jav/a/', 'A', x, [{name:'720p',height:720}]));
  assert.equal(new Set(groups.map(x => x.id)).size, 3);
});

test('JAVGG discovers packed HLS qualities while hung and empty players fail independently', async () => {
  const c = load('javgg-mini-library.js', { setTimeout: (fn, ms) => setTimeout(fn, ms / 100) });
  let active = 0, max = 0, browsers = 0;
  c.Widget.browser = { async fetch() { browsers++; throw new Error('should not be needed'); } };
  c.Widget.http.get = async url => {
    if (url.includes('/jav/')) return {statusCode:200,data:javggDetail()};
    if (url.includes('player1')) return new Promise(() => {});
    active++; max = Math.max(active, max); await Promise.resolve(); active--;
    if (url.includes('player2')) return {statusCode:200,data:'<html>dynamic player</html>'};
    if (url.includes('player3')) return {statusCode:200,data:packedJavgg('lulu')};
    if (url.includes('player4')) return {statusCode:200,data:packedJavgg('sw')};
    return {statusCode:200,data:url.includes('lulu') ? master.split('#EXT-X-STREAM-INF:BANDWIDTH=900000')[0] : master};
  };
  const groups = await c.getResourceVersions(JSON.stringify({detailUrl:'https://javgg.net/jav/a/'}));
  assert.deepEqual(plain(groups.map(x => x.title)), ['luluvdoo 线路','SW 线路']);
  assert.deepEqual(plain(groups[1].versions.map(x => x.name)), ['1080p','720p']);
  assert.equal(groups[1].versions.filter(x => x.default).length, 1);
  assert.equal(browsers, 0); assert.ok(max <= 2);
  const payload = c.decodePayload(groups[1].versions[1].id);
  assert.equal(payload.height,720); assert.equal(payload.lineId,'4'); assert.equal(payload.playerUrl,'https://player4.test/e/film');
  assert.ok(!groups[1].versions[0].id.includes('sign'));
});

test('JAVGG refreshes signed packed URLs and selects highest / requested / missing quality', async () => {
  const c = load('javgg-mini-library.js'); let refreshes = 0;
  c.Widget.http.get = async url => url.includes('player.test') ? {status:200,data:packedJavgg('cdn','master','fresh'+(++refreshes))} : {status:200,data:master};
  for (const height of [0,720,2160,1080]) {
    const result = await c.resolvePlayback({versionId:c.encodePayload({kind:'play',detailUrl:'https://javgg.net/jav/a/',playerUrl:'https://player.test/e/a',line:'Server',height})});
    assert.equal(result.url, 'https://cdn.test/' + (height === 720 ? '720' : '1080') + '.m3u8');
  }
  assert.equal(refreshes,4);
});

test('JAVGG does not execute packed scripts or accept unbounded packing dictionaries', () => {
  const c = load('javgg-mini-library.js');
  assert.equal(c.extractPlayableURL(packedJavgg()),'https://cdn.test/master.m3u8?sign=fresh');
  assert.equal(c.extractPlayableURL(packedJavgg().replace('return p;', 'globalThis.compromised=true;return p;')),'https://cdn.test/master.m3u8?sign=fresh');
  assert.equal(c.compromised,undefined);
  assert.equal(c.extractPlayableURL(packedJavgg().replace(',36,10,', ',36,200000,')), '');
});

test('JAVGG rejects expired 404 manifests, retries fresh discovery, and leaves detail resources empty', async () => {
  const c = load('javgg-mini-library.js'); let available = false;
  c.Widget.http.get = async url => url.includes('/jav/') ? {status:200,data:javggDetail(['SW'])} : url.includes('player1') ? {status:200,data:packedJavgg()} : {statusCode:available ? 200 : 404,data:available ? media : '<html>Not Found</html>'};
  const ctx={detailUrl:'https://javgg.net/jav/a/'};
  assert.equal((await c.getDetail(ctx)).resourceGroups.length,0);
  await assert.rejects(c.getResourceVersions(ctx), /manifest-http-404/);
  available=true;
  const groups=await c.getResourceVersions(ctx);assert.equal(groups[0].versions[0].name,'HLS 原始画质');
});

test('JAVGG captures real browser request headers once, then resolves a lower quality', async () => {
  const c=load('javgg-mini-library.js'); let browsers=0; const manifestHeaders=[];
  c.Widget.http.get=async (url, options)=>{
    if(url.includes('/jav/')) return {status:200,data:javggDetail(['playmate'])};
    if(url.includes('player1')) return {status:200,data:'<html>dynamic</html>'};
    manifestHeaders.push(options.headers);return {status:200,data:master};
  };
  c.Widget.browser={async fetch(url,options){browsers++;assert.equal(options.visible,false);assert.equal(options.waitForAny,undefined);assert.ok(options.timeout<=10);return {capturedRequests:[{url:'https://cdn.test/master.m3u8?fresh=1',requestHeaders:{referer:'https://actual-player.test/',origin:'https://actual-player.test','user-agent':'Actual Agent',cookie:'fixture-only','Authorization':'must-not-forward'}}]};}};
  const groups=await c.getResourceVersions({detailUrl:'https://javgg.net/jav/a/'});
  const result=await c.resolvePlayback(groups[0].versions[1].action);
  assert.equal(result.url,'https://cdn.test/720.m3u8');assert.equal(browsers,2);
  assert.deepEqual(plain(result.headers),{'User-Agent':'Actual Agent',Referer:'https://actual-player.test/',Origin:'https://actual-player.test',Cookie:'fixture-only'});
  assert.ok(manifestHeaders.every(h=>h.Referer==='https://actual-player.test/'));
});

test('JAVGG bounds a hung native browser and identifies capture failure without exposing tokens', async () => {
  const c=load('javgg-mini-library.js',{setTimeout:(fn,ms)=>setTimeout(fn,ms/100)});let browsers=0;
  c.Widget.http.get=async url=>({status:200,data:url.includes('/jav/')?javggDetail(): '<html>dynamic</html>'});
  c.Widget.browser={async fetch(){browsers++;return new Promise(()=>{});}};
  const start=Date.now();await assert.rejects(c.getResourceVersions({detailUrl:'https://javgg.net/jav/a/'}),/browser-media-timeout/);
  assert.equal(browsers,1);assert.ok(Date.now()-start<500);
  c.Widget.browser.fetch=async()=>({mediaSources:['blob:https://player.test/id'],secret:'must-not-leak'});
  await assert.rejects(c.resolvePlayback({playerUrl:'https://player.test/e/a'}),e=>/browser-.*media|browser-blob/.test(e.message)&&!e.message.includes('must-not-leak'));
});

test('JAVGG quality discovery itself has an overall deadline', async () => {
  const c=load('javgg-mini-library.js',{setTimeout:fn=>setTimeout(fn,15)});
  c.discoverResourceVersions=async()=>new Promise(()=>{});
  await assert.rejects(c.getResourceVersions({}),/画质发现超时.*total-deadline/);
});

test('JAVGG direct detail Play explores later lines and selects the highest real quality', async () => {
  const c=load('javgg-mini-library.js');
  c.Widget.http.get=async url=>{
    if(url.includes('/jav/')) return {status:200,data:javggDetail(['luluvdoo','SW'])};
    if(url.includes('player1')) return {status:200,data:packedJavgg('low')};
    if(url.includes('player2')) return {status:200,data:packedJavgg('high')};
    return {status:200,data:url.includes('low')?master.replace(/1920x1080/g,'1280x720').replace(/1080.m3u8/g,'720.m3u8'):master};
  };
  const result=await c.resolvePlayback({itemId:c.encodePayload({kind:'detail',detailUrl:'https://javgg.net/jav/a/'})});
  assert.equal(result.url,'https://high.test/1080.m3u8');
});

test('JAVGG playback fails explicitly when a fresh manifest is permanently unavailable', async () => {
  const c=load('javgg-mini-library.js');
  c.Widget.http.get=async url=>url.includes('player.test')?{status:200,data:packedJavgg()}:{statusCode:404,data:'Not Found'};
  await assert.rejects(c.resolvePlayback({playerUrl:'https://player.test/e/a'}),/manifest-http-404/);
});

test('JAVGG uses observed luluvdoo headers and does not invent headers for other players', () => {
  const c=load('javgg-mini-library.js');
  const known=c.playbackHeaders('https://luluvdoo.com/e/film');
  assert.equal(known.Referer,'https://luluvdoo.com/');assert.equal(known.Origin,'https://luluvdoo.com');
  const other=c.playbackHeaders('https://javstreamhq.xyz/e/film');
  assert.equal(other.Origin,undefined);assert.equal(other.Referer,undefined);
});

test('JAVGG 1.0.4 keeps the imported identity and records the user requested replacement', () => {
  const c = load('javgg-mini-library.js');
  assert.equal(c.getManifest().id, 'javgg-mini-library');
  assert.equal(c.getManifest().version, '1.0.4');
  assert.deepEqual(plain(c.getManifest().parameters.map(x => x.name)), ['baseUrl']);
  assert.equal(restoration.supersededFiles['javgg-mini-library.js'].replacementVersion, '1.0.4');
});
test('JAVGG working home keeps its original HTTP options, real cards and lazy sections', async () => {
  const c=load('javgg-mini-library.js');let http=0,browser=0;
  c.Widget.http.get=async(url,options)=>{
    http++;assert.equal(url,'https://javgg.net/new-post/');
    assert.equal(options.useBrowserCookie,false);assert.equal(options.browserFallback,false);
    assert.equal(options.timeout,undefined);assert.equal(options.timeoutSeconds,undefined);
    return {data:javggListHTML(['a','b','c'])};
  };
  c.Widget.browser={async fetch(){browser++;throw Error('list must stay on working path');}};
  const home=await c.getHome('{}');
  assert.equal(http,1);assert.equal(browser,0);assert.equal(home.hero.length,3);
  assert.equal(home.sections[1].items[0].poster,'https://img.test/a.jpg');
  assert.equal(c.detailURLFromId(home.hero[0].action.itemId),'https://javgg.net/jav/a/');
  assert.equal(home.sections.filter(s=>s.lazy).length,9);
});
test('JAVGG working category and search keep page two URLs and distinct detail IDs', async () => {
  const c=load('javgg-mini-library.js');const urls=[];
  c.Widget.http.get=async url=>{
    urls.push(url);return {data:javggListHTML([url.includes('/page/2/')?'two':'one'],url.includes('/page/2/')?'':'/page/2/')};
  };
  const first=await c.getCategory({pageId:'popular-weekly',page:1});
  const second=await c.getCategory(JSON.stringify({pageId:'popular-weekly',page:2}));
  assert.notEqual(first.items[0].id,second.items[0].id);
  assert.equal(first.hasMore,true);assert.equal(second.hasMore,false);
  await c.search({query:'A&B #tag',page:2});
  assert.deepEqual(urls,['https://javgg.net/trending/?sort=weekly','https://javgg.net/trending/page/2/?sort=weekly','https://javgg.net/page/2/?s=A%26B%20%23tag']);
});
test('JAVGG five current server labels stay associated when a container has no iframe', () => {
  const c=load('javgg-mini-library.js');
  const html=javggDetail(['vidhide','f4scom','streamwish','playmate','luluvdoo'])
    .replace('<iframe src="https://player2.test/e/film"></iframe>','');
  const players=c.parsePlayers(html);
  assert.deepEqual(plain(players.map(p=>[p.lineId,p.line])),[['1','vidhide'],['3','streamwish'],['4','playmate'],['5','luluvdoo']]);
});
test('JAVGG playback awaits asynchronous response bodies while list HTTP stays separate', async () => {
  const c=load('javgg-mini-library.js');
  c.Widget.http.get=async url=>url.includes('player.test') ? {statusCode:200,body:Promise.resolve(JSON.stringify({data:{html:packedJavgg()}}))} : {status:200,async text(){return master;}};
  const result=await c.resolvePlayback({versionId:c.encodePayload({playerUrl:'https://player.test/e/abc',height:720})});
  assert.match(result.url,/720\.m3u8$/);assert.equal(result.container,'m3u8');
});
test('JAVGG a hanging HTTP body times out and permits only one captured-media fallback', async () => {
  const c=load('javgg-mini-library.js',{setTimeout:(fn,ms)=>setTimeout(fn,ms/100)});let browser=0;
  c.Widget.http.get=async url=>url.includes('player.test') ? {text(){return new Promise(()=>{});}} : {data:media};
  c.Widget.browser={async fetch(url,options){browser++;assert.ok(options.timeoutSeconds<=10);assert.equal(options.waitForAny,undefined);
    return {capturedRequests:[{url:'https://cdn.test/fresh.m3u8',requestHeaders:{Referer:'https://player.test/'}}]};}};
  const result=await c.resolvePlayback({versionId:c.encodePayload({playerUrl:'https://player.test/e/abc'})});
  assert.equal(browser,1);assert.equal(result.url,'https://cdn.test/fresh.m3u8');
  assert.equal(result.headers.Referer,'https://player.test/');
});
test('JAVGG a hanging browser body fails within its capture stage', async () => {
  const c=load('javgg-mini-library.js',{setTimeout:(fn,ms)=>setTimeout(fn,ms/100)});let browser=0;
  c.Widget.http.get=async()=>({data:'<html>dynamic player</html>'});
  c.Widget.browser={async fetch(){browser++;return {text(){return new Promise(()=>{});}};}};
  await assert.rejects(c.resolvePlayback({versionId:c.encodePayload({playerUrl:'https://player.test/e/abc'})}),/stage=browser-media-timeout/);
  assert.equal(browser,1);
});
test('JAVGG browser blob-only output reports a capability failure without fake media', async () => {
  const c=load('javgg-mini-library.js');
  c.Widget.http.get=async()=>({data:'<html>dynamic player</html>'});
  c.Widget.browser={async fetch(){return {mediaSources:['blob:https://player.test/example'],html:'<video src="blob:https://player.test/example">'};}};
  await assert.rejects(c.resolvePlayback({versionId:c.encodePayload({playerUrl:'https://player.test/e/abc'})}),/stage=browser-blob-only/);
});
