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
