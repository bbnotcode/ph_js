const assert = require('assert');

const storageValues = new Map();
let networkGood = false;
let manifestBrowserRequests = 0;

const detailURL = 'https://sexbjcam.com/2026/06/20/sample/';
const embedURL = 'https://player.example/embed/sample';
const masterURL = 'https://cdn.example/master.m3u8?token=fresh';
const detailHTML = [
  '<article itemprop="video">',
  '<meta itemprop="name" content="Recovery sample">',
  '<meta itemprop="embedURL" content="' + embedURL + '">',
  '<meta itemprop="thumbnailUrl" content="https://sexbjcam.com/sample.jpg">',
  '</article>'
].join('');
const masterManifest = [
  '#EXTM3U',
  '#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080',
  '1080/index.m3u8',
  '#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720',
  '720/index.m3u8',
  '#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=854x480',
  '480/index.m3u8'
].join('\n');

global.Widget = {
  http: {
    get(url) {
      if (String(url).indexOf(detailURL) === 0) return detailHTML;
      if (networkGood && String(url).indexOf(masterURL) === 0) return masterManifest;
      throw new Error('network unavailable');
    }
  },
  browser: {
    fetch(url) {
      if (!networkGood) throw new Error('network unavailable');
      if (String(url).indexOf(embedURL) === 0) return { html: '<script>const source="' + masterURL + '";</script>', capturedRequests: [{ url: masterURL, requestHeaders: { Referer: embedURL, Origin: 'https://player.example', 'User-Agent': 'Fixture browser' } }] };
      if (String(url).indexOf(masterURL) === 0) { manifestBrowserRequests++; return { html: masterManifest }; }
      throw new Error('unexpected browser URL: ' + url);
    }
  },
  storage: {
    get(key) { return storageValues.get(key); },
    set(key, value) { storageValues.set(key, value); }
  }
};

const library = require('./sexbjcam-mini-library.js');

// Version 1.1.3 returns its original dynamic default line after a failed
// quality probe; the later cache/deadline recovery implementation is rolled back.
async function run() {
  const weakDetail = await library.getDetail({ itemId: detailURL });
  assert.strictEqual(weakDetail.resourceGroups[0].id, 'online', '初版弱网详情保留动态默认线路');
  assert.deepStrictEqual(
    weakDetail.resourceGroups[0].versions.map((version) => version.name),
    ['默认线路']
  );
  assert.strictEqual(weakDetail.resourceGroups[0].versions[0].action.embedURL, embedURL);

  const weakVersions = await library.getResourceVersions({ itemId: detailURL, embedURL });
  assert.strictEqual(weakVersions.groups[0].id, 'online', '初版弱网资源探测返回原有默认线路');
  assert.strictEqual(weakVersions.groups[0].versions[0].action.itemId, detailURL);

  networkGood = true;
  const recovered = await library.getResourceVersions({ itemId: detailURL, embedURL });
  assert.deepStrictEqual(
    recovered.groups[0].versions.map((version) => version.name),
    ['1080P', '720P', '480P'],
    '网络恢复后同一视频重新发现全部画质'
  );
  assert.strictEqual(recovered.groups[0].versions[0].default, true);
  assert(recovered.groups[0].versions.slice(1).every((version) => !version.default));
  assert(manifestBrowserRequests > 0, '保留初版浏览器读取 HLS 清单的实际流程');

  networkGood = false;
  const weakAgain = await library.getResourceVersions({ itemId: detailURL, embedURL });
  assert.deepStrictEqual(
    weakAgain.groups[0].versions.map((version) => version.name),
    ['默认线路'],
    '初版没有持久画质缓存，再次弱网时返回动态默认线路'
  );
  assert.strictEqual(storageValues.size, 0, '初版不写入后续版本的画质缓存');

  networkGood = true;
  const playback = await library.resolvePlayback({ itemId: detailURL, embedURL, versionId: 'quality:720' });
  assert(playback.url.includes('/720/index.m3u8'), '网络恢复后按原版画质标识选择 720P');
  assert.strictEqual(playback.headers.Referer, embedURL, '保持原版播放器请求头');
  assert.strictEqual(playback.headers.Origin, 'https://player.example');
  console.log('SexBJCam first-upload network behavior test passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
