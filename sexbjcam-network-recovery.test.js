const assert = require('assert');

const storageValues = new Map();
let networkGood = false;

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
      throw new Error('network unavailable');
    }
  },
  browser: {
    fetch(url) {
      if (!networkGood) throw new Error('network unavailable');
      if (String(url).indexOf(embedURL) === 0) return '<script>const source="' + masterURL + '";</script>';
      if (String(url).indexOf(masterURL) === 0) return masterManifest;
      throw new Error('unexpected browser URL: ' + url);
    }
  },
  storage: {
    get(key) { return storageValues.get(key); },
    set(key, value) { storageValues.set(key, value); }
  }
};

const library = require('./sexbjcam-mini-library.js');

async function run() {
  const weakDetail = await library.getDetail({ itemId: detailURL });
  assert.deepStrictEqual(weakDetail.resourceGroups, [], '弱网失败不能被保存成默认线路');

  await assert.rejects(
    library.getResourceVersions({ itemId: detailURL, embedURL }),
    (error) => error instanceof Error,
    '弱网资源探测应失败并允许客户端稍后重试'
  );

  networkGood = true;
  const recovered = await library.getResourceVersions({ itemId: detailURL, embedURL });
  assert.deepStrictEqual(
    recovered.groups[0].versions.map((version) => version.name),
    ['1080P', '720P', '480P'],
    '网络恢复后同一视频应重新发现全部画质'
  );

  networkGood = false;
  const cached = await library.getResourceVersions({ itemId: detailURL, embedURL });
  assert.deepStrictEqual(
    cached.groups[0].versions.map((version) => version.name),
    ['1080P', '720P', '480P'],
    '成功发现后的稳定画质元数据应可跨网络波动复用'
  );

  const serializedCache = JSON.stringify(Array.from(storageValues.values()));
  assert(!serializedCache.includes('token=fresh'), '不得缓存签名播放 URL');
  console.log('SexBJCam network recovery test passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
