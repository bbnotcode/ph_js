WidgetMetadata = {
  id: "forward.bubuyingshi",
  title: "布布影视(完美双域规范版)",
  version: "1.0.5",
  requiredVersion: "0.0.1",
  description: "完美融合同源脚本特征与跨站壳域名防盗链校验，严格对齐Forward最新WASM与弹幕三阶段规范",
  author: "Forward",
  site: "https://github.com/InchStudio/ForwardWidgets",
  detailCacheDuration: 60,
  globalParams: [
    { name: "danmu_server", title: "弹幕服务器(选填)", type: "input", value: "https://api.dandanplay.net" }
  ],
  modules: [
    { id: "loadHomeList", title: "首页推荐", functionName: "loadHomeList", cacheDuration: 3600 },
    {
      id: "loadCategoryList",
      title: "分类检索",
      functionName: "loadCategoryList",
      cacheDuration: 1800,
      params: [
        {
          name: "categoryId",
          title: "主分类",
          type: "enumeration",
          enumOptions: [
            { title: "电影", value: "电影" },
            { title: "剧集", value: "剧集" },
            { title: "动漫", value: "动漫" },
            { title: "综艺", value: "综艺" }
          ]
        },
        { name: "class", title: "类型", type: "input" },
        { name: "area", title: "地区", type: "input" },
        { name: "year", title: "年份", type: "input" },
        { name: "page", title: "页码", type: "page" }
      ]
    },
    { id: "searchDanmu", title: "弹幕搜索", functionName: "searchDanmu", type: "danmu", params: [] },
    { id: "getDetail", title: "弹幕剧集", functionName: "getDetailById", type: "danmu", params: [] },
    { id: "getComments", title: "弹幕评论", functionName: "getCommentsById", type: "danmu", params: [] }
  ],
  search: {
    title: "搜索",
    functionName: "search",
    params: [
      { name: "keyword", title: "关键词", type: "input" },
      { name: "page", title: "页码", type: "page" }
    ]
  }
};

// ========== 严格对齐最新抓包的 UA 与同源策略请求头 ==========
const HOST = 'https://asd123sx23xdacsx.top'; 
const HEADERS = {
  'Host': 'asd123sx23xdacsx.top',
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1',
  'Accept': 'application/json, text/plain, */*',
  'Sec-Fetch-Site': 'same-origin', 
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
  'web-sign': 'f65f3a83d6d9ad6f',
  'X-Client': '8f3d2a1c7b6e5d4c9a0b1f2e3d4c5b6a',
  'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
  'Origin': 'https://asd123sx23xdacsx.top',      
  'Referer': 'https://asd123sx23xdacsx.top/'     
};
const DEFAULT_DANMU_SERVER = "https://api.dandanplay.net";

function isImageOrDocResponse(res) {
  const contentType = res?.headers?.['content-type'] || res?.headers?.['Content-Type'] || '';
  return contentType.includes('image') || contentType.includes('html') || contentType.includes('xml');
}

function parseRawVideoToItem(v) {
  return {
    id: String(v.vod_id),
    type: "url", 
    title: v.vod_name,
    posterPath: v.vod_pic,
    description: v.vod_remarks || v.vod_content || "",
    releaseDate: v.vod_year ? String(v.vod_year) + "-01-01" : "",
    link: "bubu:" + v.vod_id + "|" + encodeURIComponent(v.vod_name) // 👈 巧妙地将剧集名称挂载在link上，供给后续弹幕解析阶段
  };
}

// ========== 1. 列表数据加载模块 ==========

async function loadHomeList(params = {}) {
  try {
    const res = await Widget.http.get(`${HOST}/api.php/web/index/home`, { headers: HEADERS });
    if (isImageOrDocResponse(res)) { 
      const backupHeaders = { ...HEADERS, 'Origin': 'https://bubuzhuiju.com', 'Referer': 'https://bubuzhuiju.com/' };
      const resBackup = await Widget.http.get(`${HOST}/api.php/web/index/home`, { headers: backupHeaders });
      if (isImageOrDocResponse(resBackup)) return [];
      const categories = resBackup.data?.data?.categories || [];
      const items = [];
      categories.forEach(c => { if (Array.isArray(c.videos)) c.videos.forEach(v => items.push(parseRawVideoToItem(v))); });
      return items;
    }
    const categories = res.data?.data?.categories || [];
    const items = [];
    categories.forEach(c => { if (Array.isArray(c.videos)) c.videos.forEach(v => items.push(parseRawVideoToItem(v))); });
    return items;
  } catch (e) {
    return [];
  }
}

async function loadCategoryList(params = {}) {
  try {
    const categoryId = params.categoryId || "电影";
    const pg = Number(params.page || 1);
    let url = `${HOST}/api.php/web/filter/vod?type_name=${encodeURIComponent(categoryId)}&page=${pg}&limit=50&sort=hits`;
    
    if (params.genreId) {
      url += `&class=${encodeURIComponent(params.genreId)}`;
    } else {
      if (params.class) url += `&class=${encodeURIComponent(params.class)}`;
      if (params.area) url += `&area=${encodeURIComponent(params.area)}`;
      if (params.year) url += `&year=${encodeURIComponent(params.year)}`;
    }

    const res = await Widget.http.get(url, { headers: HEADERS });
    if (isImageOrDocResponse(res)) return [];
    const rawItems = res.data?.data || [];
    return rawItems.map(v => parseRawVideoToItem(v));
  } catch (e) {
    return [];
  }
}

async function search(params = {}) {
  try {
    const kw = params.keyword || "";
    const pg = Number(params.page || 1);
    if (!kw) return [];
    
    const res = await Widget.http.get(`${HOST}/api.php/web/search/index?wd=${encodeURIComponent(kw)}&page=${pg}&limit=50`, { headers: HEADERS });
    if (isImageOrDocResponse(res)) return [];
    const rawItems = res.data?.data || [];
    return rawItems.map(v => parseRawVideoToItem(v));
  } catch (e) {
    return [];
  }
}

// ========== 2. 详情与播放核心路由（一查：修正顶级函数及模型字段） ==========

async function loadDetail(link) { // 👈 修正一：严格遵守规范，去掉 params，直接接收 link 字符串
  const linkStr = String(link);
  
  if (linkStr.startsWith("bubu:")) {
    try {
      const mainPart = linkStr.split(":")[1];
      const vodId = mainPart.split("|")[0];
      const vodName = mainPart.split("|")[1] || "";

      const res = await Widget.http.get(`${HOST}/api.php/web/vod/get_detail?vod_id=${vodId}`, { headers: HEADERS });
      if (isImageOrDocResponse(res)) return null;
      
      const data = res.data?.data?.[0];
      if (!data) return null;

      let genres = [];
      const rawClass = data.vod_class || data.type_name || "";
      if (rawClass) {
        genres = rawClass.split(/[,/，\s]+/).filter(Boolean).map(g => ({ id: String(g), title: g }));
      }

      const epsItems = []; // 👈 修正二：规范中剧集扩展列表的核心字段名必须是 episodeItems
      const rawShows = (data.vod_play_from || "").split('$$$');
      const rawUrlsList = (data.vod_play_url || "").split('$$$');
      const vodplayer = res.data?.vodplayer || [];

      rawShows.forEach((showCode, showIndex) => {
        const playerInfo = vodplayer.find(p => p.from === showCode) || {};
        const lineName = playerInfo.show || showCode;
        const urls = (rawUrlsList[showIndex] || "").split('#').filter(Boolean);
        
        urls.forEach(urlItem => {
          if (urlItem.includes('$')) {
            const [epName, rawUrl] = urlItem.split('$');
            // 提取出纯数字剧集数便于弹幕无缝匹配
            let epNum = epName.replace(/[^0-9]/g, "");
            if(!epNum) epNum = "1";
            
            const payload = `${showCode}@${playerInfo.decode_status || 0}@${rawUrl}`;
            
            epsItems.push({
              id: `${vodId}-${showIndex}-${epName}`,
              type: "url",
              title: `[${lineName}] ${epName}`,
              // 再次向下透传主剧集名以及子集数，确保播放页呼叫弹幕链时字段齐全
              link: `play:${payload}|name=${vodName}|ep=${epNum}`
            });
          }
        });
      });

      return {
        id: String(data.vod_id),
        type: "url",
        title: data.vod_name,
        posterPath: data.vod_pic,
        description: data.vod_content || data.vod_remarks || "",
        releaseDate: data.vod_year ? String(data.vod_year) + "-01-01" : "",
        genreItems: genres,         
        backdropPaths: data.vod_pic ? [data.vod_pic] : [], 
        episodeItems: epsItems, // 👈 绑定到正确规范模型
        link: link
      };
    } catch (e) {
      return null;
    }
  }
  
  if (linkStr.startsWith("play:")) {
    const infoParts = linkStr.substring(5).split('|');
    const payload = infoParts[0];
    
    const parts = payload.split('@');
    const play_from = parts[0];
    const decode_status = parts[1];
    const raw_url = parts.slice(2).join('@');
    
    let finalPlayUrl = raw_url; 

    try {
      if (decode_status === '1' || !raw_url.startsWith('http')) {
        const decoded = await decodeEncryptedUrl(raw_url, play_from);
        if (decoded && decoded.startsWith('http')) {
          finalPlayUrl = decoded;
        }
      }
    } catch (e) {}

    return {
      id: linkStr,
      type: "url",
      title: "立即播放",
      videoUrl: finalPlayUrl, 
      playerType: "system",
      link: link
    };
  }

  return null;
}

// ========== 3. 三阶段串联弹幕模块（二查：修正参数注入对齐） ==========

async function searchDanmu(params = {}) {
  try {
    const server = params.danmu_server || DEFAULT_DANMU_SERVER;
    // 自动解构：播放路由向下透传的或是App原生提供的
    let kw = params.seriesName || params.title || "";
    if(!kw && params.link && String(params.link).includes("name=")) {
      const matched = String(params.link).match(/name=([^|]+)/);
      if(matched) kw = decodeURIComponent(matched[1]);
    }
    if (!kw) return { animes: [] };

    const res = await Widget.http.get(`${server}/api/v2/search/anime?keyword=${encodeURIComponent(kw)}`);
    const list = res.data?.animes || [];
    return {
      animes: list.map(a => ({
        animeId: String(a.bangumiId || a.animeId), 
        animeTitle: a.animeTitle,
        type: a.type
      }))
    };
  } catch (e) {
    return { animes: [] };
  }
}

async function getDetailById(params = {}) {
  try {
    const server = params.danmu_server || DEFAULT_DANMU_SERVER;
    const animeId = params.animeId; 
    if (!animeId) return [];

    const res = await Widget.http.get(`${server}/api/v2/bangumi/${animeId}`);
    const eps = res.data?.bangumi?.episodes || [];
    const targetList = eps.map(e => ({
      episodeId: String(e.episodeId), 
      episodeTitle: e.episodeTitle
    }));

    // 👈 修正三：根据规范，params 传入的是固定的 params.episode（集数数字）
    let currentEp = String(params.episode || "").trim();
    if(!currentEp && params.link && String(params.link).includes("ep=")) {
      const matched = String(params.link).match(/ep=(\d+)/);
      if(matched) currentEp = matched[1];
    }

    if (currentEp) {
      // 智能全等或包含关系置顶：优先把当前播放的集数精准推荐在首位，极大提高App端一键匹配体验
      targetList.sort((a, b) => {
        const aTitle = String(a.episodeTitle);
        const bTitle = String(b.episodeTitle);
        const aMatch = aTitle === currentEp || aTitle.includes("第" + currentEp + "集") || aTitle.includes(" " + currentEp + " ");
        const bMatch = bTitle === currentEp || bTitle.includes("第" + currentEp + "集") || bTitle.includes(" " + currentEp + " ");
        return bMatch - aMatch;
      });
    }

    return targetList;
  } catch (e) {
    return [];
  }
}

async function getCommentsById(params = {}) {
  try {
    const server = params.danmu_server || DEFAULT_DANMU_SERVER;
    const commentId = params.commentId; 
    if (!commentId) return { count: 0, comments: [] };

    const res = await Widget.http.get(`${server}/api/v2/comment/${commentId}?withRelated=true&chConvert=1`);
    return res.data;
  } catch (e) {
    return { count: 0, comments: [] };
  }
}

// ========== 4. WASM 汇编解码核心管线（三查：同源环境隔离验证） ==========

let wasmModule = null, wasmMemView = null, wasmD = 0;
const wasmTextEnc = new TextEncoder();
const wasmTextDec = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
const wasmExtTable = new Map();
let wasmExtCounter = 4;

function wasmGetMem() {
  if (!wasmMemView || wasmMemView.byteLength === 0) wasmMemView = new Uint8Array(wasmModule.exports.memory.buffer);
  return wasmMemView;
}
function wasmReadStr(p, l) { return wasmTextDec.decode(wasmGetMem().subarray(p >>> 0, (p >>> 0) + l)); }
function wasmWriteBytes(data, malloc) {
  const p = malloc(data.length, 1) >>> 0;
  wasmGetMem().set(data, p);
  wasmD = data.length;
  return p;
}
function wasmWriteStr(s, malloc, realloc) {
  let n = s.length, p = malloc(n, 1) >>> 0; const m = wasmGetMem(); let o = 0;
  for (; o < n; o++) { const c = s.charCodeAt(o); if (c > 127) break; m[p + o] = c; }
  if (o !== n) {
    const r = s.slice(o); p = realloc(p, n, n = o + r.length * 3, 1) >>> 0;
    const sub = wasmGetMem().subarray(p + o, p + n); const res = wasmTextEnc.encodeInto(r, sub);
    o += res.written; p = realloc(p, n, o, 1) >>> 0;
  }
  wasmD = o; return p;
}

async function ensureWasmReady() {
  if (wasmModule) return true;
  try {
    const wasmUrl = "https://bubuyingshi.com/assets/web_app_wasm_bg-DaFtKBCq.wasm";
    const res = await Widget.http.get(wasmUrl, { responseType: 'arraybuffer' });
    const imports = {
      "./web_app_wasm_bg.js": {
        __wbg___wbindgen_is_function_0095a73b8b156f76: (e) => typeof wasmExtTable.get(e) === 'function',
        __wbg___wbindgen_is_object_5ae8e5880f2c1fbd: (e) => { const r = wasmExtTable.get(e); return typeof r === 'object' && r !== null; },
        __wbg___wbindgen_is_string_cd444516edc5b180: (e) => typeof wasmExtTable.get(e) === 'string',
        __wbg___wbindgen_is_undefined_9e4d92534c42d778: (e) => wasmExtTable.get(e) === undefined,
        __wbg___wbindgen_throw_be289d5034ed271b: (e, r) => { throw new Error(wasmReadStr(e, r)); },
        __wbg_call_389efe28435a9388: (e, r) => { const idx = wasmExtCounter++; wasmExtTable.set(idx, wasmExtTable.get(e).call(wasmExtTable.get(r))); return idx; },
        __wbg_crypto_86f2631e91b51511: () => { const idx = wasmExtCounter++; wasmExtTable.set(idx, {}); return idx; },
        __wbg_length_32ed9a279acd054c: (e) => wasmExtTable.get(e).length,
        __wbg_new_no_args_1c7c842f08d00ebb: (e, r) => { const idx = wasmExtCounter++; wasmExtTable.set(idx, new Function(wasmReadStr(e, r))); return idx; },
        __wbg_new_with_length_a2c39cbe88fd8ff1: (e) => { const idx = wasmExtCounter++; wasmExtTable.set(idx, new Uint8Array(e >>> 0)); return idx; },
        __wbg_now_a3af9a2f4bbaa4d1: () => Date.now(),
        __wbg_subarray_a96e1fef17ed23cb: (e, r, n) => { const idx = wasmExtCounter++; wasmExtTable.set(idx, wasmExtTable.get(e).subarray(r >>> 0, n >>> 0)); return idx; },
        __wbindgen_init_externref_table: () => {}
      }
    };
    const { instance } = await WebAssembly.instantiate(res.data, imports);
    wasmModule = instance;
    if (wasmModule.exports.__wbindgen_start) wasmModule.exports.__wbindgen_start();
    return true;
  } catch (err) {
    return false;
  }
}

async function decodeEncryptedUrl(rawUrl, vodFrom) {
  if (!(await ensureWasmReady())) return null;
  try {
    const e = wasmModule.exports;
    const up = wasmWriteStr(rawUrl, e.__wbindgen_malloc, e.__wbindgen_realloc); const ul = wasmD;
    const fp = wasmWriteStr(vodFrom, e.__wbindgen_malloc, e.__wbindgen_realloc); const fl = wasmD;
    const r = e.create_decode_request(up, ul, fp, fl);
    const reqData = new Uint8Array(wasmGetMem().slice(r[0], r[0] + r[1]));
    e.__wbindgen_free(r[0], r[1], 1);

    const sig = e.get_signature_headers();
    const aid = e.signatureheaders_aid(sig);
    const ave = e.signatureheaders_ave(sig);
    const nonc = e.signatureheaders_nonc(sig);
    const sign = e.signatureheaders_sign(sig);
    const time = e.signatureheaders_time(sig);
    
    const sigHeaders = {
      'X-App-Id': aid[0] ? wasmReadStr(aid[0], aid[1]) : '',
      'X-App-Ve': ave[0] ? wasmReadStr(ave[0], ave[1]) : '',
      'X-Nonc': nonc[0] ? wasmReadStr(nonc[0], nonc[1]) : '',
      'X-Sign': sign[0] ? wasmReadStr(sign[0], sign[1]) : '',
      'X-Time': time[0] ? wasmReadStr(time[0], time[1]) : ''
    };
    e.__wbg_signatureheaders_free(sig, 0);

    // WASM 解码请求同样注入最新同源对齐 Headers
    const pRes = await Widget.http.post(`${HOST}/api.php/web/decode/url`, reqData, {
      headers: {
        'Content-Type': 'application/x-protobuf',
        'Accept': 'application/x-protobuf',
        'User-Agent': HEADERS['User-Agent'],
        'Origin': HEADERS['Origin'],
        'Referer': HEADERS['Referer'],
        ...sigHeaders
      },
      responseType: 'arraybuffer'
    });

    const bp = wasmWriteBytes(new Uint8Array(pRes.data), e.__wbindgen_malloc); const bl = wasmD;
    const parseR = e.parse_decode_response(bp, bl);
    if (parseR[2]) return null;

    const ptr = parseR[0];
    const code = e.decoderesult_code(ptr);
    const dd = e.decoderesult_data(ptr);
    const decodedStr = dd[0] ? wasmReadStr(dd[0], dd[1]) : '';
    e.__wbg_decoderesult_free(ptr, 0);

    return (code === 1 && decodedStr.startsWith('http')) ? decodedStr : null;
  } catch (err) {
    return null;
  }
}
