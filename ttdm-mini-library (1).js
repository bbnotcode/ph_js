// @name 天天动漫
// @version 1.0.1
// 动漫目录适配（含中国/日本/欧美/其他/动画电影/里番）。无需 Node、DOMParser 或浏览器执行。
var WidgetMetadata = { id: 'ttdm-mini-library', title: '天天动漫', name: '天天动漫', version: '1.0.1', author: 'Alan huang', description: '动漫分类、搜索、选集和多线路播放（含里番）' };
(function () {
'use strict';
var BASE = 'https://www.ttdm11.me';
var CATS = { '1': '中国动漫', '2': '日本动漫', '3': '欧美动漫', '4': '其他动漫', '5': '动画电影', '6': '里番动漫' };
function context(value) {
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch (_) { value = {}; } }
  value = value || {};
  var result = {};
  ['params','config','settings','parameters','pagination','pageInfo'].forEach(function (key) { Object.assign(result, value[key] || {}); });
  return Object.assign(result, value);
}
function base(c) { return String(c.baseUrl || BASE).replace(/\/+$/, ''); }
function abs(path, root) {
  if (/^https?:\/\//i.test(path)) return path;
  if (/^\/\//.test(path)) return 'https:' + path;
  var origin = (root.match(/^https?:\/\/[^/]+/) || [BASE])[0];
  return path.charAt(0) === '/' ? origin + path : root.replace(/[^/]*$/, '') + path;
}
function decode(s) { return String(s || '').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#(?:39|x27);/gi,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/&#(\d+);/g,function(_,n){return String.fromCharCode(+n);}); }
function plain(s) { return decode(String(s || '').replace(/<!--[\s\S]*?-->/g,'').replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim(); }
function attr(s, key) { var m = s.match(new RegExp('(?:^|\\s)' + key + '\\s*=\\s*(["\x27])([\\s\\S]*?)\\1','i')); return m ? decode(m[2]) : ''; }
function match(s,re) { var m = s.match(re); return m ? m[1] : ''; }
async function unwrap(r) {
  for (var n=0;n<5;n++) {
    if (typeof r === 'string') return r;
    if (!r) break;
    if (typeof r.text === 'function') return await r.text();
    if (typeof r.status === 'number' && r.status >= 400) throw new Error('HTTP ' + r.status);
    r = r.data !== undefined ? r.data : r.body !== undefined ? r.body : r.html !== undefined ? r.html : r.text;
  }
  throw new Error('HTTP 返回内容无法读取');
}
async function request(url) {
  var client = typeof $http !== 'undefined' ? $http : typeof Widget !== 'undefined' ? Widget.http : null;
  if (!client) throw new Error('当前环境没有可用的 HTTP 客户端');
  var options = { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 };
  var response = typeof client.get === 'function' ? await client.get(url, options) : await client.request(Object.assign({url:url,method:'GET'}, options));
  return unwrap(response);
}
function getManifest() {
  return Object.assign({}, WidgetMetadata, {logo:BASE+'/favicon.png',icon:BASE+'/favicon.png', capabilities:{home:true,category:true,detail:true,search:true,resourceVersions:true,playback:true,resourceMatching:false},aggregation:{search:true,playbackHistory:true,resourceMatching:false},parameters:[{name:'baseUrl',title:'网站地址',type:'input',value:BASE}]});
}
function cards(html,c,type) {
  var items=[], seen={};
  html.replace(/<a\b([^>]*\bclass=["'][^"']*module-(?:poster-item|card-item-poster)[^"']*["'][^>]*)>([\s\S]*?)<\/a>/gi,function(_,tag,body){
    var id=match(attr(tag,'href'),/\/vod\/(\d+)/), img=match(body,/(<img\b[^>]*>)/i);
    if (!id || seen[id] || !img) return '';
    seen[id]=true;
    var title=attr(tag,'title') || attr(img,'alt'), poster=attr(img,'data-original') || attr(img,'data-src') || attr(img,'src');
    if (!title || !poster) return '';
    items.push({id:id,title:title,type:type || 'series',poster:abs(poster,base(c)+'/'),aspectRatio:'2:3',imageHeaders:{},subtitle:plain(match(body,/class=["']module-item-note["'][^>]*>([\s\S]*?)<\/div>/)),action:{type:'detail',itemId:id}});
    return '';
  });
  return items;
}
function pageNumber(c) { return Math.max(1,Math.floor(Number(c.page || c.pageNumber || 1)) || 1); }
function categoryId(c) { var id=String(c.pageId || c.sectionId || c.id || '1'); if (!CATS[id]) throw new Error('不支持的动漫分类'); return id; }
function nextPage(html) { return /<a\b[^>]*title=["']下一页["'][^>]*>/i.test(html); }
async function getCategory(value) {
  var c=context(value), id=categoryId(c), page=pageNumber(c);
  var path='/vod-show/'+id+(page===1 ? '-----------/' : '--------'+page+'---/');
  var html=await request(base(c)+path), items=cards(html,c,id==='5'?'movie':'series');
  if (!items.length && page===1) throw new Error('分类没有返回影片，请检查网站地址或网络');
  return {pageType:'category',id:id,title:CATS[id],style:'media.posterGrid',itemAspectRatio:'2:3',page:page,hasMore:nextPage(html),items:items};
}
async function getHomeSection(value) {
  var c=context(value), id=String(c.sectionId || c.pageId || c.id || '1');
  try { var p=await getCategory(Object.assign({},c,{pageId:id,page:1})); return {id:id,title:p.title,style:'discover.posterCompact',lazy:false,items:p.items.slice(0,12),moreAction:{type:'category',pageId:id,title:p.title}}; }
  catch (e) { return {id:id,title:CATS[id] || '动漫',style:'discover.posterCompact',lazy:false,items:[],subtitle:String(e.message || e)}; }
}
async function getHome(value) {
  var c=context(value), first=await getHomeSection(Object.assign({},c,{sectionId:'1'}));
  var sections=[first];
  Object.keys(CATS).filter(function(id){return id!=='1';}).forEach(function(id){sections.push({id:id,title:CATS[id],style:'discover.posterCompact',lazy:true,items:[],moreAction:{type:'category',pageId:id,title:CATS[id]}});});
  return {pageType:'home',id:'ttdm-home',title:'天天动漫',sections:sections};
}
async function search(value) {
  var c=context(value), query=String(c.query || c.keyword || c.text || '').trim(), page=pageNumber(c);
  if (!query) return {pageType:'search',items:[],page:page,hasMore:false};
  var path=page===1 ? '/vod-search/-------------/?wd='+encodeURIComponent(query) : '/vod-search/'+encodeURIComponent(query)+'----------'+page+'---/';
  var html=await request(base(c)+path), items=[];
  html.split(/<div\s+class=["']module-card-item module-item["']>/i).slice(1).forEach(function(block){
    var category=plain(match(block,/class=["']module-card-item-class["'][^>]*>([\s\S]*?)<\/div>/));
    if (Object.keys(CATS).some(function(id){return CATS[id]===category;})) items=items.concat(cards(block,c,category==='动画电影'?'movie':'series'));
  });
  return {pageType:'search',title:'搜索：'+query,keyword:query,page:page,hasMore:nextPage(html),items:items};
}
function episodeKey(title) { return title.replace(/第0*(\d+)([集话期])/g,function(_,n,unit){return '第'+Number(n)+unit;}).replace(/\s+/g,''); }
function parseDetail(html,c,id) {
  html=html.replace(/<!--[\s\S]*?-->/g,'');
  var info=html.slice(html.indexOf('class="module module-info"'));
  var cat=match(info,/href=["']\/vod-type\/(\d+)\//);
  if (!CATS[cat]) throw new Error('此条目不在支持的动漫分类中');
  var title=plain(match(info,/<h1[^>]*>([\s\S]*?)<\/h1>/)), img=match(info,/(<img\b[^>]*>)/), lines=[], byLine={};
  html.replace(/<div\b([^>]*\bdata-sid=["']\d+["'][^>]*)>/g,function(_,tag){var sid=attr(tag,'data-sid'); if(!byLine[sid]){var line={id:sid,name:attr(tag,'data-show') || '线路 '+sid,episodes:[]};lines.push(line);byLine[sid]=line;}return '';});
  html.replace(/<a\b([^>]*\bclass=["'][^"']*module-play-list-link[^"']*["'][^>]*)>([\s\S]*?)<\/a>/g,function(_,tag,body){
    var m=attr(tag,'href').match(/\/vod-play\/(\d+)-(\d+)-(\d+)\//);
    if(m && m[1]===id && byLine[m[2]]) byLine[m[2]].episodes.push({index:m[3],title:plain(body)});
    return '';
  });
  lines=lines.filter(function(l){return l.episodes.length;});
  if(!title || !lines.length) throw new Error('详情或剧集目录解析失败：'+id);
  var type=cat==='5'?'movie':'series', episodes=[], seen={};
  lines.forEach(function(line){line.episodes.forEach(function(e){var key=episodeKey(e.title);if(!seen[key]){seen[key]=true;var eid='ep:'+encodeURIComponent(key);episodes.push({id:eid,title:e.title,episodeNumber:episodes.length+1,action:{type:'play',itemId:id,episodeId:eid}});}});});
  return {pageType:'detail',id:id,title:title,type:type,poster:abs(attr(img,'data-original') || attr(img,'src'),base(c)+'/'),detailImageAspectRatio:'2:3',imageHeaders:{},year:Number(match(info,/title=["']((?:19|20)\d{2})["']/)) || undefined,overview:plain(match(info,/class=["']module-info-introduction-content["'][^>]*>([\s\S]*?)<\/div>/)),genres:[CATS[cat]],seasons:type==='series'?[{id:'s1',title:'剧集',seasonNumber:1,episodes:episodes}]:[],recommendations:[],_lines:lines};
}
async function detailData(c) {
  var id=String(c.itemId || c.id || '');
  if(!/^\d+$/.test(id)) throw new Error('缺少有效影片 ID');
  return parseDetail(await request(base(c)+'/vod/'+id+'/'),c,id);
}
function selected(d,c) {
  var title=c.episodeId ? decodeURIComponent(String(c.episodeId).replace(/^ep:/,'')) : d._lines[0].episodes[0].title;
  return d._lines.map(function(line){var episode=line.episodes.filter(function(e){return episodeKey(e.title)===episodeKey(title);})[0];return episode?{line:line,episode:episode}:null;}).filter(Boolean);
}
function groups(d,c) {
  var options=selected(d,c), eid=c.episodeId || 'ep:'+encodeURIComponent(d._lines[0].episodes[0].title);
  return [{id:'lines',title:'播放线路',versions:options.map(function(o,i){return {id:'line:'+o.line.id,name:o.line.name,default:i===0,subtitle:o.episode.title,action:{type:'play',itemId:d.id,episodeId:eid,versionId:'line:'+o.line.id}};})}];
}
async function getDetail(value) {var c=context(value),d=await detailData(c);d.resourceGroups=groups(d,c);delete d._lines;return d;}
async function getResourceVersions(value) {var c=context(value),d=await detailData(c);return {itemId:d.id,episodeId:c.episodeId,groups:groups(d,c)};}
function playerData(html) {
  var start=html.search(/var\s+player_\w+\s*=/);
  if(start<0) throw new Error('播放器未返回配置');
  var tail=html.slice(start), json=match(tail,/^[^=]*=\s*([\s\S]*?)<\/script>/).replace(/;\s*$/,'');
  var data=JSON.parse(json), url=data.url;
  if(Number(data.encrypt)===1) url=decodeURIComponent(url);
  if(Number(data.encrypt)===2) {
    var decode64=typeof $utils!=='undefined' && $utils.base64Decode ? $utils.base64Decode : typeof atob==='function'?atob:null;
    if(!decode64) throw new Error('当前环境缺少 Base64 解码接口');
    url=decodeURIComponent(decode64(url));
  }
  if(!/^https?:\/\/.+\.(m3u8|mp4)(?:[?#]|$)/i.test(url)) throw new Error('线路 '+data.from+' 未提供直连媒体地址');
  return {url:url,container:/\.m3u8(?:[?#]|$)/i.test(url)?'m3u8':'mp4'};
}
async function resolvePlayback(value) {
  var c=context(value),d=await detailData(c),options=selected(d,c),sid=String(c.versionId || c.lineId || '').replace(/^line:/,'');
  var chosen=sid?options.filter(function(o){return o.line.id===sid;})[0]:options[0];
  if(!chosen) throw new Error('所选线路没有此集，请切换线路');
  var path='/vod-play/'+d.id+'-'+chosen.line.id+'-'+chosen.episode.index+'/?iframe=1';
  var result=playerData(await request(base(c)+path));
  return Object.assign(result,{headers:{},isLive:false,streamKind:'vod'});
}
var api={getManifest:getManifest,getHome:getHome,getHomeSection:getHomeSection,getCategory:getCategory,getDetail:getDetail,getResourceVersions:getResourceVersions,resolvePlayback:resolvePlayback,search:search};
if(typeof globalThis!=='undefined') Object.assign(globalThis,api,{WidgetMetadata:WidgetMetadata});
if(typeof module!=='undefined' && module.exports) module.exports=api;
})();
