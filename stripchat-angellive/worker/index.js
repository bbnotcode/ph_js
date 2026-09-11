/**
 * Stripchat Mouflon HLS 代理 —— Cloudflare Worker 版
 *
 * 和本地 Node 版逻辑一致：拿到 master 里的 psch/pkey → 取真媒体清单 →
 * 用 pkey 对应的 pdkey 还原被加密的分片文件名 → 输出标准 HLS。
 * 区别是在 Cloudflare 边缘常驻，不依赖任何一台自己的机器。
 */

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const CDN_TLDS = ["org", "com", "net", "live"];
const MEDIA_TLDS = ["org", "com", "net", "live"];
const EDGE_TLDS = ["org", "com", "net", "live"];
const KEY_URL = "https://mouflon.chantrail.com/api/keys";
const KEY_TTL_MS = 6 * 3600 * 1000;
const MASTER_TTL_MS = 60 * 1000;
const MASTER_FAIL_TTL_MS = 15 * 1000;
const MASTER_FETCH_TIMEOUT_MS = 4500;
const MEDIA_PLAYLIST_TTL_SECONDS = 1;
const INDEX_TTL_SECONDS = 30;
const SEGMENT_TTL_SECONDS = 120;

const SEGMENT_RE = /_([^_]+)_(\d+(?:_part\d+)?)\.mp4(?:[?#].*)?/;
// 上游分片永远来自这几个域名，把域名压成一位下标能省掉一大截 URL 长度。
const SEGMENT_HOSTS = [
  "media-hls.doppiocdn.org",
  "media-hls.doppiocdn.com",
  "media-hls.doppiocdn.net",
  "media-hls.doppiocdn.live"
];
const ALLOWED_UPSTREAM_HOST = /(^|\.)(doppiocdn\.(org|com|live|net)|stripchat\.(com|global))$/i;
const MOUFLON_ADVERT = /#EXT-X-MOUFLON-ADVERT/i;

/* ------------------------- 订阅源镜像（绕开 raw / jsDelivr 缓存） ------------------------- */

const SUB_REPO = "bbnotcode/ph_js";
const SUB_BRANCH = "main";
const SUB_RAW = `https://raw.githubusercontent.com/${SUB_REPO}/${SUB_BRANCH}/`;
const SUB_MIRROR = `https://cdn.jsdelivr.net/gh/${SUB_REPO}@${SUB_BRANCH}/`;
const SUB_INDEX_TTL_SECONDS = 60;
const SUB_ZIP_TTL_SECONDS = 3600;
const SUB_FILE_RE = /^[A-Za-z0-9._-]+\.(json|zip)$/;

/* 社区公开的 pkey -> pdkey 密钥表（离线兜底，可用环境变量 MOONFLON_KEYS_JSON 覆盖） */
const BUNDLED_KEYS = {
  "1Dzcc6OjP73LKbtI": "Y64UVwX5RrIWnOLp",
  "7uUnbD0jMCB9GH32": "lzCQ6QBTnLpB0zMF",
  "Fq6m2TO2ZeBkRPm9": "xb6di1NF9EFXHUwb",
  "GrRncsoByZmsiT6L": "NigHYyOD9l4rvAEb",
  "N2oLovTIXb0o28Uj": "ABE7Sj8jh3oPM2ae",
  "NTK9aqcLmNFMWrpQ": "tOcYOap4Ty1l9Jzb",
  "OLzu7QlySkG2fVRn": "CsovScFH9VirSJ4Z",
  "Ohi7eTRBpkAuML0l": "kExe29N2sLFrHGqu",
  "Ook7quaiNgiyuhai": "EQueeGh2kaewa3ch"
};

let keyCache = { at: 0, keys: null };
let keyInflight = null;
const masterCache = new Map();
// 主播没开播 / 上游整体不可用时，把失败结论短时间记住。
// 否则播放器每次重试都要把 4 个 CDN 域名轮询一遍，客户端会一直转圈直到自己超时放弃。
const masterFailCache = new Map();

/* -------------------------------- 工具 -------------------------------- */

async function upstreamFetch(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Referer": "https://stripchat.com/",
        "Accept": "*/*",
        "Accept-Encoding": "identity"
      },
      redirect: "manual",
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function text(body, status = 200, type = "text/plain; charset=utf-8") {
  return new Response(body, { status, headers: { "Content-Type": type, "Cache-Control": "no-store" } });
}

/* ------------------------------ 密钥 / 解密 ------------------------------ */

async function getKeys(env) {
  if (keyCache.keys && Date.now() - keyCache.at < KEY_TTL_MS) return keyCache.keys;
  if (keyInflight) return keyInflight;

  const bundled = { ...BUNDLED_KEYS };
  if (env && env.MOUFLON_KEYS_JSON) {
    try { Object.assign(bundled, JSON.parse(env.MOUFLON_KEYS_JSON)); } catch (_) { /* 忽略坏配置 */ }
  }

  keyInflight = (async () => {
    try {
      const res = await upstreamFetch(KEY_URL, 8000);
      if (res.ok) {
        const parsed = await res.json();
        if (parsed && parsed.keys && Object.keys(parsed.keys).length) {
          keyCache = { at: Date.now(), keys: parsed.keys };
          return keyCache.keys;
        }
      }
    } catch (_) { /* 用兜底表 */ }
    // 兜底表也只在短时间有效，避免同步一直失败时反复打远端
    keyCache = { at: Date.now() - KEY_TTL_MS + 5 * 60 * 1000, keys: bundled };
    return bundled;
  })();

  try { return await keyInflight; } finally { keyInflight = null; }
}

const keyStreamCache = new Map();

// 密钥流就是 SHA-256(pdkey) 的 32 字节，按 pdkey 缓存，避免每个分片都重算。
async function sha256Keystream(pdkey) {
  const cached = keyStreamCache.get(pdkey);
  if (cached) return cached;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pdkey));
  const bytes = new Uint8Array(digest);
  if (keyStreamCache.size > 64) keyStreamCache.clear();
  keyStreamCache.set(pdkey, bytes);
  return bytes;
}

async function decryptSegmentURL(url, pdkey) {
  const match = SEGMENT_RE.exec(url);
  if (!match) return null;
  const token = match[1];

  // 反转字符串并补齐 Base64 填充
  let reversed = token.split("").reverse().join("");
  while (reversed.length % 4 !== 0) reversed += "=";

  let raw;
  try { raw = atob(reversed); } catch (_) { return null; }
  if (!raw.length) return null;

  const keystream = await sha256Keystream(pdkey);
  let out = "";
  for (let i = 0; i < raw.length; i += 1) {
    out += String.fromCharCode(raw.charCodeAt(i) ^ keystream[i % keystream.length]);
  }
  if (!/^[\x20-\x7e]+$/.test(out)) return null;
  return url.replace(token, out);
}

/* ------------------------------ master 解析 ------------------------------ */

function parseMaster(bodyText, baseURL) {
  const lines = bodyText.replace(/\r/g, "").split("\n").map((line) => line.trim());
  const pkeys = [];
  const variants = [];
  let pending = null;
  for (const line of lines) {
    if (line.startsWith("#EXT-X-MOUFLON:PSCH:")) {
      const rest = line.slice("#EXT-X-MOUFLON:PSCH:".length);
      const cut = rest.indexOf(":");
      if (cut > 0) pkeys.push({ scheme: rest.slice(0, cut), key: rest.slice(cut + 1) });
    } else if (line.startsWith("#EXT-X-STREAM-INF:")) {
      const attrs = line.slice("#EXT-X-STREAM-INF:".length);
      const bandwidth = Number((attrs.match(/BANDWIDTH=(\d+)/) || [])[1] || 0);
      const name = (attrs.match(/NAME="([^"]*)"/) || attrs.match(/NAME=([^,]*)/) || [])[1] || "";
      const resolution = attrs.match(/RESOLUTION=(\d+)x(\d+)/);
      pending = { name: name || "auto", bandwidth, height: Number((resolution && resolution[2]) || 0) };
    } else if (line && line[0] !== "#" && pending) {
      pending.url = new URL(line, baseURL).toString();
      variants.push(pending);
      pending = null;
    }
  }
  return { pkeys, variants };
}

async function probeMaster(streamId, tld, keys) {
  const url = `https://edge-hls.doppiocdn.${tld}/hls/${streamId}/master/${streamId}_auto.m3u8`;
  try {
    const res = await upstreamFetch(url, MASTER_FETCH_TIMEOUT_MS);
    if (!res.ok) return { ok: false, why: `${tld}: HTTP ${res.status}` };
    const parsed = parseMaster(await res.text(), url);
    if (!parsed.variants.length) return { ok: false, why: `${tld}: 无画质变体` };
    const known = parsed.pkeys.find((pair) => keys[pair.key]);
    if (!known) return { ok: false, why: `${tld}: master 给出的 pkey 无匹配 pdkey` };
    return {
      ok: true,
      data: { streamId, scheme: known.scheme, pkey: known.key, pdkey: keys[known.key], variants: parsed.variants },
      why: ""
    };
  } catch (error) {
    return { ok: false, why: `${tld}: ${error && error.message}` };
  }
}

async function loadMaster(streamId, env) {
  const cached = masterCache.get(streamId);
  if (cached && Date.now() - cached.at < MASTER_TTL_MS) return cached.data;

  const failed = masterFailCache.get(streamId);
  if (failed && Date.now() - failed.at < MASTER_FAIL_TTL_MS) throw new Error(failed.message);

  const keys = await getKeys(env);
  // 4 个 CDN 域名并发探，最坏耗时从 36s 降到单个超时。
  const results = await Promise.all(EDGE_TLDS.map((tld) => probeMaster(streamId, tld, keys)));
  const hit = results.find((item) => item.ok);
  if (hit) {
    masterCache.set(streamId, { at: Date.now(), data: hit.data });
    masterFailCache.delete(streamId);
    return hit.data;
  }

  const message = `无法获取 Stripchat 直播清单 (${streamId}): ${results.map((item) => item.why).join("; ")}`;
  masterFailCache.set(streamId, { at: Date.now(), message });
  throw new Error(message);
}

/* ---------------------------- 播放列表改写 ---------------------------- */

function variantURL(master, variant) {
  const sep = variant.url.includes("?") ? "&" : "?";
  return `${variant.url}${sep}psch=${encodeURIComponent(master.scheme)}&pkey=${encodeURIComponent(master.pkey)}`;
}

// 分片地址必须压短：Angel Live 的 mePlayer 引擎有约 190 字符的 URL 上限，
// 超了会静默截断，u 变成非法 base64 → 400 → 连续重试后整个播放卡死。
function compactSegmentTarget(encryptedURL) {
  for (let i = 0; i < SEGMENT_HOSTS.length; i += 1) {
    const prefix = `https://${SEGMENT_HOSTS[i]}`;
    if (!encryptedURL.startsWith(prefix)) continue;
    const rest = encryptedURL.slice(prefix.length);
    const q = rest.indexOf("?");
    const pathPart = q === -1 ? rest : rest.slice(0, q);
    const query = q === -1 ? "" : rest.slice(q);
    // 最常见的形态：/b-hls-14/277087958_533_xxx.mp4 -> "0|14|277087958_533_xxx.mp4"
    const plain = /^\/b-hls-(\d+)\/(.+)$/.exec(pathPart);
    if (plain) {
      // 目录里还有一层和文件名重复的 streamId：277087958/277087958_2164_xxx.mp4
      const file = plain[2].replace(/^(\d+)\/(\1_)/, "$2");
      return `${i}|${plain[1]}|${file}${query}`;
    }
    // 兜底：压掉目录里和文件名重复的那段 streamId
    const deduped = pathPart.replace(/^(\/[^/]+\/)(\d+)\/(\2_)/, "$1$3");
    return `${i}${deduped}${query}`;
  }
  return null;
}

function proxySegmentPath(encryptedURL, pkey) {
  const compact = compactSegmentTarget(encryptedURL);
  const encoded = base64url(compact === null ? encryptedURL : compact);
  return `/seg/segment.mp4?u=${encoded}&k=${encodeURIComponent(pkey)}`;
}

function base64url(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (str.length % 4)) % 4);
  return atob(padded);
}

// 不同客户端/旧版本插件生成的分片地址编码方式并不统一：
// 标准 base64 里的 "+" 在 query 里会被解析成空格，个别版本还会直接传明文 URL。
// 这里统一容错，避免播放器拿到 400 之后陷入重试风暴。
function decodeSegmentParam(raw) {
  const value = String(raw || "");
  if (!value) return null;
  const attempts = [value];
  if (value.includes(" ")) attempts.push(value.replace(/ /g, "+"));
  for (const candidate of attempts) {
    let url = null;
    try { url = unb64url(candidate); } catch (_) { url = null; }
    if (url) {
      if (/^https:\/\//i.test(url)) return url;
      const packed = /^([0-3])\|(\d+)\|(.+)$/.exec(url);
      if (packed) {
        // 文件名开头就是 streamId，补回被压掉的那层目录。
        const sid = /^(\d+)_/.exec(packed[3]);
        const dir = sid ? `${sid[1]}/` : "";
        return `https://${SEGMENT_HOSTS[Number(packed[1])]}/b-hls-${packed[2]}/${dir}${packed[3]}`;
      }
      const compact = /^([0-3])(\/.*)$/.exec(url);
      if (compact) return `https://${SEGMENT_HOSTS[Number(compact[1])]}${compact[2]}`;
    }
  }
  try {
    const plain = decodeURIComponent(value);
    if (/^https:\/\//i.test(plain)) return plain;
  } catch (_) { /* give up */ }
  return null;
}

function rewriteMediaPlaylist(bodyText, baseURL, pkey) {
  const lines = bodyText.replace(/\r/g, "").split("\n");
  const out = [];
  let count = 0;
  let pendingEncrypted = null;
  let sawParts = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("#EXT-X-MOUFLON:URI:")) { pendingEncrypted = line.slice("#EXT-X-MOUFLON:URI:".length); continue; }
    if (line.startsWith("#EXT-X-PRELOAD-HINT:") || line.startsWith("#EXT-X-RENDITION-REPORT:")) { sawParts = true; continue; }
    if (line.startsWith("#EXT-X-PART:")) { sawParts = true; continue; }
    if (line.startsWith("#EXT-X-MOUFLON")) continue;

    if (line.startsWith("#EXT-X-MAP:")) {
      const match = line.match(/URI="([^"]+)"/);
      out.push(match ? line.replace(match[1], proxySegmentPath(new URL(match[1], baseURL).toString(), pkey)) : line);
      continue;
    }
    if (line[0] === "#") { out.push(line); continue; }

    if (pendingEncrypted) {
      const absolute = /^https?:\/\//i.test(pendingEncrypted) ? pendingEncrypted
        : pendingEncrypted.startsWith("//") ? "https:" + pendingEncrypted
          : new URL(pendingEncrypted, baseURL).toString();
      out.push(proxySegmentPath(absolute, pkey));
      count += 1;
      pendingEncrypted = null;
    }
    // 没有对应 Mouflon URI 的裸分片行（占位 media.mp4）丢弃
  }
  return { playlist: out.join("\n") + "\n", segmentCount: count, sawParts };
}

function alternateHosts(url) {
  const list = [url];
  for (const tld of MEDIA_TLDS) {
    const swapped = url.replace(/^(https:\/\/media-hls\.doppiocdn\.)[a-z]+/i, "$1" + tld);
    if (swapped !== url && !list.includes(swapped)) list.push(swapped);
  }
  return list;
}

async function tryVariantCandidate(candidate, attempts) {
  try {
    const res = await upstreamFetch(candidate, 6000);
    const body = res.ok ? await res.text() : "";
    const decoy = MOUFLON_ADVERT.test(body);
    if (res.ok && !decoy) return { ok: true, body, url: candidate };
    attempts.push(`${new URL(candidate).host} -> ${res.status}${decoy ? " (广告诱饵清单)" : ""}`);
  } catch (error) {
    attempts.push(`${new URL(candidate).host} -> ${error && error.message}`);
  }
  return { ok: false };
}

async function fetchVariantPlaylist(master, variant, env) {
  const attempts = [];
  // 第一轮并发探所有 CDN 域名：最常见的情况是第一个就命中，最坏也只有一个超时周期。
  const first = await Promise.all(alternateHosts(variantURL(master, variant)).map((candidate) => tryVariantCandidate(candidate, attempts)));
  const hit = first.find((item) => item.ok);
  if (hit) return hit;

  masterCache.delete(master.streamId);
  await new Promise((resolve) => setTimeout(resolve, 300));
  const second = await Promise.all(alternateHosts(variantURL(master, variant)).map((candidate) => tryVariantCandidate(candidate, attempts)));
  const retry = second.find((item) => item.ok);
  if (retry) return retry;
  return { ok: false, attempts };
}

/* -------------------------------- 路由 -------------------------------- */

async function handleIndex(request, streamId, env, ctx) {
  const origin = new URL(request.url).origin;
  const cache = typeof caches !== "undefined" ? caches.default : null;
  const cacheKey = new Request(`${origin}/play/${encodeURIComponent(streamId)}/index.json`, { method: "GET" });
  if (cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) return hit;
    } catch (_) { /* 缓存不可用就走回源 */ }
  }

  const master = await loadMaster(streamId, env);
  const variants = master.variants
    .map((variant) => ({
      name: variant.name,
      height: variant.height,
      bandwidth: variant.bandwidth,
      title: variant.height ? `${variant.height}p` : variant.name,
      url: `${origin}/play/${encodeURIComponent(streamId)}/${encodeURIComponent(variant.name)}.m3u8`
    }))
    .sort((a, b) => b.height - a.height || b.bandwidth - a.bandwidth);

  const response = json({ streamId, pkey: master.pkey, variants });
  response.headers.set("Cache-Control", `public, max-age=${INDEX_TTL_SECONDS}`);
  if (cache && ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(cache.put(cacheKey, response.clone()).catch(() => {}));
  }
  return response;
}

async function handleMasterPlaylist(streamId, env) {
  const master = await loadMaster(streamId, env);
  const lines = ["#EXTM3U", "#EXT-X-VERSION:6"];
  for (const variant of master.variants) {
    const attrs = [`BANDWIDTH=${variant.bandwidth}`];
    if (variant.height) attrs.push(`RESOLUTION=${Math.round(variant.height * 3 / 4)}x${variant.height}`);
    if (variant.name) attrs.push(`NAME="${variant.name}"`);
    lines.push(`#EXT-X-STREAM-INF:${attrs.join(",")}`);
    lines.push(`/play/${encodeURIComponent(streamId)}/${encodeURIComponent(variant.name)}.m3u8`);
  }
  return text(lines.join("\n") + "\n", 200, "application/vnd.apple.mpegurl");
}

async function handleVariantPlaylist(streamId, name, env, ctx, request) {
  const origin = new URL(request.url).origin;
  const cache = typeof caches !== "undefined" ? caches.default : null;
  const cacheKey = new Request(`${origin}/play/${encodeURIComponent(streamId)}/${encodeURIComponent(name)}.m3u8`, { method: "GET" });
  if (cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) return hit;
    } catch (_) { /* 缓存不可用就走回源 */ }
  }
  const master = await loadMaster(streamId, env);
  const variant = master.variants.find((item) => item.name === name) ||
    master.variants.find((item) => item.name.toLowerCase() === String(name).toLowerCase());
  if (!variant) return text(`unknown variant: ${name}`, 404);

  const outcome = await fetchVariantPlaylist(master, variant, env);
  if (!outcome.ok) {
    return text(
      "上游媒体清单不可用（已重试多个 CDN 节点）：\n" + outcome.attempts.join("\n") +
      "\n\n403/302 通常是该 CDN 节点暂时不可用或对本出口限流，换一个主播或过几分钟再试。", 502);
  }
  const rewritten = rewriteMediaPlaylist(outcome.body, outcome.url, master.pkey);
  if (!rewritten.segmentCount) return text("上游清单里没有可解密的 Mouflon 分片", 502);
  const response = new Response(rewritten.playlist, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl",
      "Cache-Control": `public, max-age=${MEDIA_PLAYLIST_TTL_SECONDS}`,
      "Access-Control-Allow-Origin": "*"
    }
  });
  if (cache && ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(cache.put(cacheKey, response.clone()).catch(() => {}));
  }
  return response;
}

async function handleSegment(url, env, ctx) {
  const raw = url.searchParams.get("u");
  const pkey = url.searchParams.get("k") || "";
  if (!raw) return text("missing u", 400);

  // 直播分片一旦发布内容就不再变化，URL 里带序号和签名，可以按 URL 安全缓存。
  // 同一路直播的两个设备、播放器重拉同一个分片，都能直接命中边缘缓存。
  const cache = typeof caches !== "undefined" ? caches.default : null;
  const cacheKey = new Request(url.toString(), { method: "GET" });
  if (cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) return hit;
    } catch (_) { /* 缓存不可用就走回源 */ }
  }

  const rawValue = String(raw || "");
  // 正常 base64 长度一定是 4 的倍数（去掉 = 填充后是 4k / 4k+2 / 4k+3）。
  // 只要出现 4k+1，就说明客户端把 URL 截断了，这是 mePlayer 引擎的典型症状。
  if (rawValue.length % 4 === 1) {
    console.log("seg-truncated", "len=" + rawValue.length,
      "head=" + JSON.stringify(rawValue.slice(0, 24)), "tail=" + JSON.stringify(rawValue.slice(-16)));
  }
  const encryptedURL = decodeSegmentParam(raw);
  if (!encryptedURL) {
    const value = String(raw || "");
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").replace(/ /g, "+")
      + "=".repeat((4 - (value.length % 4)) % 4);
    let detail = "";
    try {
      detail = "atob=" + JSON.stringify(atob(padded).slice(0, 160));
    } catch (error) {
      detail = "atobErr=" + (error && error.message);
    }
    console.log("seg-bad-u", "len=" + value.length, "mod4=" + (value.length % 4), detail, "raw=" + JSON.stringify(value.slice(0, 400)));
    return text("bad u", 400);
  }

  let hostname = "";
  try { hostname = new URL(encryptedURL).hostname; } catch (_) { return text("bad u", 400); }
  if (!ALLOWED_UPSTREAM_HOST.test(hostname)) return text("upstream host not allowed", 403);

  const keys = await getKeys(env);
  const pdkey = keys[pkey] || Object.values(keys)[0];
  if (!pdkey) return text("没有可用的 Mouflon 解密密钥", 502);

  const decrypted = await decryptSegmentURL(encryptedURL, pdkey);
  const target = decrypted || encryptedURL;

  const res = await upstreamFetch(target, 15000);
  if (!res.ok) {
    return text(`上游分片 HTTP ${res.status}（多为分片已过期，播放器会自行续拉）`, 502);
  }
  const response = new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Cache-Control": `public, max-age=${SEGMENT_TTL_SECONDS}`,
      "Access-Control-Allow-Origin": "*"
    }
  });
  if (cache && ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(cache.put(cacheKey, response.clone()).catch(() => {}));
  }
  return response;
}

/* --------------------------- 订阅源镜像（路由） --------------------------- */

async function fetchSubscriptionFile(path) {
  const errors = [];
  // 回源必须带 cache-buster：raw.githubusercontent 的 Fastly 缓存对同一个 URL
  // 会缓存十几分钟，发新版后设备迟迟看不到。按索引 TTL 分桶，既保证一分钟内必刷，
  // 又不会每个请求都打穿到 GitHub。
  const bucket = Math.floor(Date.now() / (SUB_INDEX_TTL_SECONDS * 1000));
  for (const base of [SUB_RAW, SUB_MIRROR]) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const target = base === SUB_RAW ? `${base}${path}?cb=${bucket}` : `${base}${path}`;
      const res = await fetch(target, {
        headers: { "User-Agent": UA, "Accept": "*/*" },
        signal: controller.signal
      });
      if (res.ok) return res;
      errors.push(`${base} -> HTTP ${res.status}`);
    } catch (error) {
      errors.push(`${base} -> ${error && error.message}`);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(errors.join("; "));
}

// 把订阅源里的 zipURLs 改写成走本 Worker，原始地址保留在后面兜底。
function rewriteSubscriptionIndex(bodyText, origin) {
  const data = JSON.parse(bodyText);
  for (const plugin of data.plugins || []) {
    const urls = Array.isArray(plugin.zipURLs) ? plugin.zipURLs : [];
    const local = [];
    for (const url of urls) {
      const name = String(url).split("?")[0].split("/").pop();
      if (SUB_FILE_RE.test(name) && name.endsWith(".zip")) local.push(`${origin}/sub/${name}`);
    }
    plugin.zipURLs = [...new Set(local)].concat(urls);
  }
  return JSON.stringify(data, null, 2) + "\n";
}

async function handleSubscription(request, path, env, ctx) {
  if (!SUB_FILE_RE.test(path)) return text("not found", 404);

  const origin = new URL(request.url).origin;
  const isIndex = path.endsWith(".json");
  const ttl = isIndex ? SUB_INDEX_TTL_SECONDS : SUB_ZIP_TTL_SECONDS;
  const cache = typeof caches !== "undefined" ? caches.default : null;
  const cacheKey = new Request(`${origin}/sub/${path}`, { method: "GET" });
  if (cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) return hit;
    } catch (_) { /* 缓存不可用就走回源 */ }
  }

  let upstream;
  try {
    upstream = await fetchSubscriptionFile(path);
  } catch (error) {
    return text(`订阅源获取失败：${error && error.message}`, 502);
  }

  let body;
  let contentType = "application/zip";
  try {
    if (isIndex) {
      contentType = "application/json; charset=utf-8";
      body = rewriteSubscriptionIndex(await upstream.text(), origin);
    } else {
      body = await upstream.arrayBuffer();
    }
  } catch (error) {
    return text(`订阅源处理失败：${error && error.message}`, 502);
  }

  const response = new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": `public, max-age=${ttl}`,
      "Access-Control-Allow-Origin": "*"
    }
  });
  if (cache && ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(cache.put(cacheKey, response.clone()).catch(() => {}));
  }
  return response;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);
    try {
      if (pathname === "/health") return json({ ok: true, runtime: "cloudflare-worker" });
      const sub = pathname.match(/^\/sub\/([^/]+)$/);
      if (sub) return await handleSubscription(request, sub[1], env, ctx);
      if (pathname === "/seg" || /^\/seg\/[^/]*\.mp4$/.test(pathname)) return await handleSegment(url, env, ctx);
      const rawPlaylist = pathname.match(/^\/raw\/([^/]+)\/([^/]+)\.m3u8$/);
      if (rawPlaylist) {
        const master = await loadMaster(rawPlaylist[1], env);
        const variant = master.variants.find((item) => item.name === rawPlaylist[2]) || master.variants[0];
        const outcome = await fetchVariantPlaylist(master, variant, env);
        if (!outcome.ok) return text(outcome.attempts.join("\n"), 502);
        return text(outcome.body, 200, "application/vnd.apple.mpegurl");
      }

      const play = pathname.match(/^\/play\/([^/]+?)(?:\/([^/]+))?\.m3u8$/);
      if (play) {
        return play[2] ? await handleVariantPlaylist(play[1], play[2], env, ctx, request) : await handleMasterPlaylist(play[1], env);
      }
      const index = pathname.match(/^\/play\/([^/]+)\/index\.json$/);
      if (index) return await handleIndex(request, index[1], env, ctx);

      return text("not found", 404);
    } catch (error) {
      return text(`proxy error: ${error && error.message}`, 502);
    }
  }
};
