import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { __test } from "./index.js";

function encryptedToken(plain, pdkey) {
  const digest = new Uint8Array(createHash("sha256").update(pdkey).digest());
  const bytes = Buffer.from(plain, "ascii");
  for (let i = 0; i < bytes.length; i += 1) bytes[i] ^= digest[i % digest.length];
  return bytes.toString("base64").replace(/=+$/, "").split("").reverse().join("");
}

test("decryptSegmentURL restores the Mouflon filename", async () => {
  const pdkey = "test-pdkey";
  const plain = "segment-0042";
  const token = encryptedToken(plain, pdkey);
  const encrypted = `https://media-hls.doppiocdn.org/b-hls-14/123_${token}_42.mp4`;
  assert.equal(
    await __test.decryptSegmentURL(encrypted, pdkey),
    "https://media-hls.doppiocdn.org/b-hls-14/123_segment-0042_42.mp4"
  );
});

test("compact segment targets round-trip", () => {
  const original = "https://media-hls.doppiocdn.net/b-hls-16/123456/123456_99_token.mp4?x=1";
  const compact = __test.compactSegmentTarget(original);
  const encoded = Buffer.from(compact, "binary").toString("base64url");
  assert.equal(__test.decodeSegmentParam(encoded), original);
});

test("parseMaster reads Mouflon key and variants", () => {
  const parsed = __test.parseMaster(
    "#EXTM3U\n#EXT-X-MOUFLON:PSCH:v2:test-key\n#EXT-X-STREAM-INF:BANDWIDTH=900000,RESOLUTION=960x720,NAME=\"720p\"\n720.m3u8\n",
    "https://edge.example/master.m3u8"
  );
  assert.deepEqual(parsed.pkeys, [{ scheme: "v2", key: "test-key" }]);
  assert.equal(parsed.variants[0].url, "https://edge.example/720.m3u8");
  assert.equal(parsed.variants[0].height, 720);
});

test("rewriteMediaPlaylist emits standard direct HLS segment URLs", async () => {
  const pdkey = "test-pdkey";
  const token = encryptedToken("real-segment", pdkey);
  const encrypted = `https://media-hls.doppiocdn.org/b-hls-14/123_${token}_7.mp4`;
  const input = `#EXTM3U\n#EXT-X-TARGETDURATION:2\n#EXT-X-MOUFLON:URI:${encrypted}\nmedia.mp4\n`;
  const result = await __test.rewriteMediaPlaylist(input, encrypted, "pkey", pdkey, "direct");
  assert.equal(result.segmentCount, 1);
  assert.match(result.playlist, /123_real-segment_7\.mp4/);
  assert.doesNotMatch(result.playlist, /EXT-X-MOUFLON|media\.mp4/);
});

function masterFixture(pkey = '1Dzcc6OjP73LKbtI', variant = '1080.m3u8') {
  return `#EXTM3U\n#EXT-X-MOUFLON:PSCH:v2:${pkey}\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1920x1080,NAME="1080p"\n${variant}\n`;
}

async function withFetch(replacement, operation) {
  const original = globalThis.fetch;
  globalThis.fetch = replacement;
  __test.masterCache.clear(); __test.masterFailCache.clear();
  try { return await operation(); }
  finally { globalThis.fetch = original; __test.masterCache.clear(); __test.masterFailCache.clear(); }
}

test('loadMaster returns the first valid CDN and cancels pending probes', async () => {
  let cancelled = 0;
  await withFetch(async (url, options) => {
    if (String(url).includes('/api/keys')) return new Response('', { status: 503 });
    if (String(url).includes('doppiocdn.org')) return new Response(masterFixture());
    return new Promise((_, reject) => options.signal.addEventListener('abort', () => { cancelled++; reject(new Error('cancelled')); }, { once: true }));
  }, async () => {
    const started = Date.now(); const master = await __test.loadMaster('fast-cdn', {});
    assert.equal(master.variants[0].height, 1080); assert.ok(Date.now() - started < 500); assert.equal(cancelled, 3);
  });
});

test('all 404/410 masters mean offline; mixed upstream failures remain unknown', async () => {
  for (const mixed of [false, true]) {
    await withFetch(async url => new Response('', { status: mixed && String(url).includes('doppiocdn.com') ? 403 : 404 }), async () => {
      await assert.rejects(__test.loadMaster(mixed ? 'unknown' : 'offline', {}), error => error.offline === !mixed);
    });
  }
});

test('the upstream deadline includes a stalled playlist body', async () => {
  let cancelled = false;
  await withFetch(async () => new Response(new ReadableStream({ cancel() { cancelled = true; } })), async () => {
    const started = Date.now();
    await assert.rejects(__test.upstreamFetch('https://edge.test/stalled.m3u8', 20, { read: 'text' }), /timed out|cancelled/);
    assert.ok(Date.now() - started < 500); assert.equal(cancelled, true);
  });
});

test('oversized playlists are rejected without unbounded buffering', async () => {
  await withFetch(async () => new Response(new Uint8Array(1024 * 1024 + 1)), async () => {
    await assert.rejects(__test.upstreamFetch('https://edge.test/oversized.m3u8', 100, { read: 'text' }), /size limit/);
  });
});

test('media segments remain streaming rather than being buffered as playlists', async () => {
  const body = new ReadableStream({});
  await withFetch(async () => new Response(body), async () => {
    const response = await __test.upstreamFetch('https://media.test/segment.mp4', 100);
    assert.ok(response.body); assert.equal(response.bodyUsed, false); await response.body.cancel();
  });
});

test('variant retry reloads master and uses the refreshed pkey and pdkey', async () => {
  const streamId = 'rotating-key';
  const newPkey = '7uUnbD0jMCB9GH32'; const newPdkey = 'lzCQ6QBTnLpB0zMF';
  const token = encryptedToken('fresh-segment', newPdkey);
  const body = `#EXTM3U\n#EXT-X-TARGETDURATION:2\n#EXT-X-MOUFLON:URI:https://media-hls.doppiocdn.org/b-hls-14/123_${token}_7.mp4\nmedia.mp4\n`;
  const requests = [];
  await withFetch(async (url, options) => {
    requests.push(String(url));
    if (new URL(url).pathname.endsWith('_auto.m3u8')) return new Response(masterFixture(newPkey, 'refreshed.m3u8'));
    if (String(url).includes('pkey=old-key')) return new Response('', { status: 403 });
    assert.ok(String(url).includes(`pkey=${newPkey}`)); assert.ok(String(url).includes('refreshed.m3u8'));
    return new Response(body);
  }, async () => {
    const old = { streamId, scheme: 'v1', pkey: 'old-key', pdkey: 'old-pdkey', variants: [{ name: '1080p', height: 1080, bandwidth: 2000000, url: 'https://media-hls.doppiocdn.org/old.m3u8' }] };
    __test.masterCache.set(streamId, { at: Date.now(), data: old });
    const response = await __test.handleVariantPlaylist(streamId, '1080p', { SEGMENT_MODE: 'direct' }, {}, new Request('https://worker.test/play/rotating-key/1080p.m3u8'));
    const playlist = await response.text();
    assert.equal(response.status, 200, playlist); assert.match(playlist, /123_fresh-segment_7\.mp4/);
    assert.ok(requests.some(url => url.includes('/master/'))); assert.ok(requests.some(url => url.includes(`pkey=${newPkey}`)));
  });
});
