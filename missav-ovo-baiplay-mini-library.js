// @name MissAV_ovo baiPlay Mini Library

const MISSAV_OVO_DEFAULT_BASE = 'https://missav.ws';
const MISSAV_OVO_DEFAULT_ENTRY = '/dm247/cn';
const MISSAV_OVO_LOGO = 'https://missav.ws/favicon.ico';
const MISSAV_OVO_PAYLOAD_PREFIX = 'missavovo://detail?';
const MISSAV_OVO_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const WidgetMetadata = {
  id: 'missav-ovo-baiplay',
  name: 'MissAV_ovo',
  title: 'MissAV_ovo',
  version: '3.2.3-baiplay.1',
  author: 'MakkaPakka|CC|EL|Eric|墨白',
  logo: MISSAV_OVO_LOGO,
  icon: MISSAV_OVO_LOGO,
  site: MISSAV_OVO_DEFAULT_BASE,
  description: 'MissAV_ovo baiPlay 自定义媒体库，基于旧 Widget 脚本改写，支持首页、分类、搜索、详情和播放解析。'
};

const MISSAV_SORT_OPTIONS = [
  { title: '发行日期', value: 'released_at' },
  { title: '最近更新', value: 'published_at' },
  { title: '收藏数', value: 'saved' },
  { title: '今日浏览数', value: 'today_views' },
  { title: '本周浏览数', value: 'weekly_views' },
  { title: '本月浏览数', value: 'monthly_views' },
  { title: '总浏览数', value: 'views' }
];

const MISSAV_SECTIONS = [
  { id: 'recent-updates', title: '最近更新', path: 'new', sort: 'published_at', style: 'discover.ranked' },
  { id: 'chinese-subtitle', title: '中文字幕', path: 'chinese-subtitle', style: 'discover.posterCompact' },
  { id: 'release', title: '日本AV', path: 'new', style: 'discover.spotlight' },
  { id: 'weekly-hot', title: '本周热门', path: 'weekly-hot', style: 'discover.ranked' },
  { id: 'monthly-hot', title: '月度热门', path: 'monthly-hot', style: 'discover.ranked' },
  { id: 'siro', title: 'SIRO', path: 'siro', group: 'amateur', style: 'discover.posterCompact' },
  { id: 'luxu', title: 'LUXU', path: 'luxu', group: 'amateur', style: 'discover.posterCompact' },
  { id: 'gana', title: 'GANA', path: 'gana', group: 'amateur', style: 'discover.posterCompact' },
  { id: 'maan', title: 'PRESTIGE PREMIUM', path: 'prestige-premium', group: 'amateur', style: 'discover.posterCompact' },
  { id: 'scute', title: 'S-CUTE', path: 's-cute', group: 'amateur', style: 'discover.posterCompact' },
  { id: 'ara', title: 'ARA', path: 'ara', group: 'amateur', style: 'discover.posterCompact' },
  { id: 'uncensored-leak', title: '无码流出', path: 'uncensored-leak', group: 'uncensored', aliases: ['无码影片'], style: 'discover.posterCompact' },
  { id: 'fc2', title: 'FC2', path: 'fc2', group: 'uncensored', style: 'discover.posterCompact' },
  { id: 'heyzo', title: 'HEYZO', path: 'heyzo', group: 'uncensored', style: 'discover.posterCompact' },
  { id: 'tokyohot', title: '东京热', path: 'tokyo-hot', group: 'uncensored', style: 'discover.posterCompact' },
  { id: '1pondo', title: '一本道', path: '1pondo', group: 'uncensored', style: 'discover.posterCompact' },
  { id: 'caribbeancom', title: 'Caribbeancom', path: 'caribbeancom', group: 'uncensored', style: 'discover.posterCompact' },
  { id: 'caribbeancompr', title: 'Caribbeancompr', path: 'caribbeancompr', group: 'uncensored', style: 'discover.posterCompact' },
  { id: '10musume', title: '10musume', path: '10musume', group: 'uncensored', style: 'discover.posterCompact' },
  { id: 'pacopacomama', title: 'pacopacomama', path: 'pacopacomama', group: 'uncensored', style: 'discover.posterCompact' },
  { id: 'gachinco', title: 'Gachinco', path: 'gachinco', group: 'uncensored', style: 'discover.posterCompact' },
  { id: 'xxxav', title: 'XXX-AV', path: 'xxx-av', group: 'uncensored', style: 'discover.posterCompact' },
  { id: 'madou', title: '麻豆传媒', path: 'madou', group: 'asia', style: 'discover.posterCompact' },
  { id: 'twav', title: 'TWAV', path: 'twav', group: 'asia', style: 'discover.posterCompact' },
  { id: 'furuke', title: 'Furuke', path: 'furuke', group: 'asia', style: 'discover.posterCompact' },
  { id: 'klive', title: '韩国直播', path: 'klive', group: 'asia', style: 'discover.posterCompact' },
  { id: 'clive', title: '中国直播', path: 'clive', group: 'asia', style: 'discover.posterCompact' }
];

const MISSAV_PRIMARY_CATEGORIES = [
  { id: 'chinese-subtitle', title: '中文字幕', path: 'chinese-subtitle', subtitle: '中文字幕专区' },
  { id: 'release', title: '日本AV', path: 'new', subtitle: '最新发布与有码内容' },
  { id: 'amateur', title: '素人', path: 'siro', subtitle: 'SIRO、LUXU、GANA 等' },
  { id: 'uncensored', title: '无码影片', path: 'uncensored-leak', subtitle: '无码流出、FC2、HEYZO 等' },
  { id: 'asia', title: '亚洲AV', path: 'madou', subtitle: '麻豆、TWAV、直播回放等' },
  { id: 'actress', title: '女优', path: 'actresses/%E7%80%AC%E6%88%B8%E7%92%B0%E5%A5%88', subtitle: '按女优浏览' },
  { id: 'genre', title: '类型', path: 'genres/%E9%AB%98%E6%B8%85', subtitle: '按题材类型浏览' },
  { id: 'maker', title: '发行商', path: 'makers/Prestige', subtitle: '按发行商浏览' }
];

function getManifest() {
  return {
    id: WidgetMetadata.id,
    name: WidgetMetadata.name,
    title: WidgetMetadata.title,
    version: WidgetMetadata.version,
    author: WidgetMetadata.author,
    logo: WidgetMetadata.logo,
    icon: WidgetMetadata.icon,
    site: WidgetMetadata.site,
    description: WidgetMetadata.description,
    capabilities: {
      home: true,
      category: true,
      detail: true,
      search: true,
      playback: true,
      resourceVersions: true,
      aggregation: true,
      playbackHistory: true,
      resourceMatching: false
    },
    aggregation: {
      search: true,
      playbackHistory: true,
      resourceMatching: false
    },
    parameters: [
      {
        name: 'baseURL',
        title: '站点地址',
        type: 'input',
        defaultValue: MISSAV_OVO_DEFAULT_BASE,
        required: true,
        description: 'MissAV 当前可访问域名。'
      },
      {
        name: 'entryPath',
        title: '中文入口路径',
        type: 'input',
        defaultValue: MISSAV_OVO_DEFAULT_ENTRY,
        required: true,
        description: '例如 /dm247/cn。MissAV 的 dm 前缀会变化，失效时可替换。'
      },
      {
        name: 'worker',
        title: 'Worker地址',
        type: 'input',
        defaultValue: '',
        required: false,
        description: '可选，兼容原脚本 /qualities/{uuid} 画质接口。'
      }
    ]
  };
}

async function getHome(ctx) {
  let latestItems = [];
  try {
    const html = await fetchText(ctx, listURL(ctx, MISSAV_SECTIONS[0], 1, '', MISSAV_SECTIONS[0].sort));
    latestItems = parseCards(html, ctx).slice(0, 18);
  } catch (error) {
    latestItems = [];
  }

  return {
    pageType: 'home',
    id: 'missav-ovo-home',
    title: WidgetMetadata.title,
    heroAspectRatio: '16:9',
    hero: latestItems.slice(0, 8).map(toWideItem),
    sections: [
      primaryCategoriesSection(ctx),
      {
        id: 'recent-updates',
        title: '最近更新',
        style: 'discover.ranked',
        lazy: false,
        moreAction: categoryAction(ctx, MISSAV_SECTIONS[0]),
        items: latestItems
      }
    ].concat(MISSAV_SECTIONS.slice(1, 12).map(function (section) {
      return sectionShell(ctx, section);
    }))
  };
}

function primaryCategoriesSection(ctx) {
  return {
    id: 'missav-ovo-primary-categories',
    title: '分类',
    style: 'discover.annualCategories',
    lazy: false,
    items: MISSAV_PRIMARY_CATEGORIES.map(function (category) {
      return categoryCard(ctx, category);
    })
  };
}

async function getHomeSection(ctx) {
  const section = findSection(ctx && (ctx.sectionId || ctx.id || ctx.pageId)) || MISSAV_SECTIONS[0];
  try {
    const html = await fetchText(ctx, listURL(ctx, section, 1, contextValue(ctx, 'filters'), section.sort || contextValue(ctx, 'sort_by')));
    return {
      id: section.id,
      title: section.title,
      style: section.style || 'discover.posterCompact',
      lazy: false,
      moreAction: categoryAction(ctx, section),
      items: parseCards(html, ctx).slice(0, 18)
    };
  } catch (error) {
    return emptySection(section.id, section.title, section.style, error);
  }
}

async function getCategory(ctx) {
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  const pageId = ctx && (ctx.pageId || ctx.id || ctx.primary_category || ctx.endpoint || ctx.url);
  const section = findSection(pageId);
  const primary = findPrimaryCategory(pageId);
  const path = contextValue(ctx, 'url') || contextValue(ctx, 'endpoint') || (section ? section.path : primary ? primary.path : pageId);
  const sort = contextValue(ctx, 'sort') || contextValue(ctx, 'sort_by') || (section && section.sort) || '';
  const filters = contextValue(ctx, 'filters') || '';
  const url = /^https?:\/\//i.test(stringValue(path))
    ? pagedURL(withSortAndFilters(path, filters, sort), page)
    : listURL(ctx, { path: path || MISSAV_SECTIONS[0].path }, page, filters, sort);
  const fallbackTitle = (section && section.title) || (primary && primary.title) || 'MissAV';

  try {
    const html = await fetchText(ctx, url);
    const title = (section && section.title) || (primary && primary.title) || pageTitle(html) || 'MissAV';

    return {
      pageType: 'category',
      id: normalizePageId(pageId || title),
      title: title,
      style: 'media.posterGrid',
      itemAspectRatio: '16:9',
      sortOptions: sortOptions(),
      selectedSortValue: sort || '',
      items: parseCards(html, ctx),
      page: page,
      hasMore: hasNextPage(html, page)
    };
  } catch (error) {
    return fallbackCategoryPage(pageId, fallbackTitle, page, sort, error, ctx);
  }
}

async function getDetail(ctx) {
  const detailURL = detailUrlFromContext(ctx);
  if (!detailURL) throw new Error('MissAV 详情参数无效');

  const html = await fetchText(ctx, detailURL);
  const title = cleanTitle(firstNonEmpty(
    metaContent(html, 'property', 'og:title'),
    firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i),
    pageTitle(html),
    titleFromUrl(detailURL)
  ));
  const code = extractVideoId(detailURL) || extractSearchCode(title);
  const poster = absoluteURL(ctx, firstNonEmpty(
    metaContent(html, 'property', 'og:image'),
    metaContent(html, 'name', 'twitter:image'),
    pickImage(html),
    code ? 'https://fourhoi.com/' + code.toLowerCase() + '/cover-t.jpg' : ''
  ));
  const playable = extractVideoUrl(html);
  const actors = extractPeopleLinks(html, /\/(?:dm\d+\/)?cn\/actresses?\//i);
  const genres = extractPeopleLinks(html, /\/(?:dm\d+\/)?cn\/genres?\//i);
  const overview = cleanText(firstNonEmpty(
    labeledValue(html, ['简介', '描述', '说明']),
    metaContent(html, 'property', 'og:description'),
    metaContent(html, 'name', 'description')
  ));
  const releaseDate = firstMatch(cleanText(html), /(\d{4}-\d{2}-\d{2})/);
  const durationText = firstNonEmpty(
    firstMatch(cleanText(html), /(?:时长|長度|Duration)\s*[:：]?\s*(\d{1,3}:\d{2}(?::\d{2})?)/i),
    firstMatch(html, /(\d{1,3}:\d{2}:\d{2})/)
  );

  return {
    id: encodePayload({ url: detailURL, title: title, poster: poster }),
    title: title || code || titleFromUrl(detailURL),
    type: 'movie',
    poster: poster,
    backdrop: poster,
    detailImageAspectRatio: '16:9',
    imageHeaders: imageHeaders(ctx, detailURL),
    posterHeaders: imageHeaders(ctx, detailURL),
    backdropHeaders: imageHeaders(ctx, detailURL),
    overview: overview,
    year: releaseDate ? Number(releaseDate.slice(0, 4)) : undefined,
    releaseDate: releaseDate || undefined,
    runtimeMinutes: runtimeMinutes(durationText),
    remarks: durationText || code,
    genres: unique(genres.map(function (item) { return item.name; })),
    cast: actors.slice(0, 40).map(function (actor) {
      return {
        name: actor.name,
        role: '演员',
        action: {
          type: 'category',
          pageId: actor.url,
          title: actor.name,
          url: actor.url,
          itemAspectRatio: '16:9'
        }
      };
    }),
    providerIds: {
      missav: code || titleFromUrl(detailURL),
      source: WidgetMetadata.id
    },
    resourceGroups: await playbackGroups(ctx, detailURL, title, playable),
    recommendations: [
      {
        id: 'related',
        title: '相关推荐',
        style: 'discover.posterCompact',
        items: parseCards(html, ctx).filter(function (item) {
          return item.action && item.action.url !== detailURL;
        }).slice(0, 18)
      }
    ]
  };
}

async function getResourceVersions(ctx) {
  const detailURL = detailUrlFromContext(ctx);
  const direct = playUrlFromContext(ctx);
  const title = stringValue(ctx && (ctx.title || ctx.name)) || titleFromUrl(detailURL);
  if (direct) return playbackGroups(ctx, detailURL, title, direct);
  if (!detailURL) return [];

  try {
    const html = await fetchText(ctx, detailURL);
    return playbackGroups(ctx, detailURL, title, extractVideoUrl(html));
  } catch (error) {
    return playbackGroups(ctx, detailURL, title, '');
  }
}

async function resolvePlayback(ctx) {
  const direct = firstNonEmpty(playUrlFromContext(ctx), ctx && ctx.url, ctx && ctx.playUrl, ctx && ctx.videoUrl);
  if (isPlayableURL(direct)) return playbackResult(ctx, direct, ctx && (ctx.referer || ctx.detailURL));

  const detailURL = detailUrlFromContext(ctx);
  if (!detailURL) throw new Error('MissAV 播放参数无效');
  const html = await fetchText(ctx, detailURL);
  const playable = firstNonEmpty(extractVideoUrl(html), await extractFromBrowser(detailURL, detailURL));
  if (!playable) throw new Error('未能解析到 MissAV 播放地址。源站可能启用了 Cloudflare 或更换了播放器脚本。');
  return playbackResult(ctx, playable, detailURL);
}

async function search(ctx) {
  const query = stringValue(ctx && (ctx.query || ctx.keyword || ctx.text));
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  if (!query) return { pageType: 'search', title: '搜索结果', items: [], page: page, hasMore: false };

  try {
    const url = pagedURL(categoryURL(ctx, 'search/' + encodeURIComponent(query)), page);
    const html = await fetchText(ctx, url);
    return {
      pageType: 'search',
      title: query,
      style: 'media.posterGrid',
      itemAspectRatio: '16:9',
      items: parseCards(html, ctx),
      page: page,
      hasMore: hasNextPage(html, page)
    };
  } catch (error) {
    return {
      pageType: 'search',
      title: query,
      style: 'media.posterGrid',
      itemAspectRatio: '16:9',
      items: [errorItem('搜索失败', error)],
      page: page,
      hasMore: false
    };
  }
}

function onSearch(ctx) {
  return search(ctx || {});
}

function categoryCard(ctx, category) {
  return {
    id: 'category-' + category.id,
    title: category.title,
    subtitle: category.subtitle || '',
    type: 'category',
    aspectRatio: '16:9',
    action: categoryAction(ctx, category)
  };
}

function categoryAction(ctx, category) {
  return {
    type: 'category',
    id: category.id,
    pageId: category.id,
    title: category.title,
    url: categoryURL(ctx, category.path),
    itemAspectRatio: '16:9'
  };
}

function sectionShell(ctx, section) {
  return {
    id: section.id,
    title: section.title,
    style: section.style || 'discover.posterCompact',
    lazy: true,
    loadAction: { type: 'custom', id: section.id, sectionId: section.id, title: section.title },
    moreAction: categoryAction(ctx, section),
    items: []
  };
}

function emptySection(id, title, style, error) {
  return {
    id: id,
    title: title,
    style: style || 'discover.posterCompact',
    lazy: false,
    items: [errorItem('加载失败', error)]
  };
}

function fallbackCategoryPage(pageId, title, page, sort, error, ctx) {
  const primary = findPrimaryCategory(pageId);
  const groupItems = primary ? groupedCategoryCards(ctx, primary.id) : [];
  return {
    pageType: 'category',
    id: normalizePageId(pageId || title),
    title: title || 'MissAV',
    style: groupItems.length ? 'discover.annualCategories' : 'media.posterGrid',
    itemAspectRatio: '16:9',
    sortOptions: sortOptions(),
    selectedSortValue: sort || '',
    items: groupItems.length ? groupItems : [errorItem('加载失败', error)],
    page: page,
    hasMore: false
  };
}

function groupedCategoryCards(ctx, group) {
  const sections = MISSAV_SECTIONS.filter(function (section) {
    if (group === 'release') return ['release', 'weekly-hot', 'monthly-hot'].indexOf(section.id) >= 0;
    return section.group === group;
  });
  return sections.map(function (section) {
    return categoryCard(ctx, section);
  });
}

function errorItem(title, error) {
  const message = cleanText(error && (error.message || error)) || '请稍后重试，或在参数中更换可访问域名。';
  return {
    id: 'error-' + encodeURIComponent(title + '-' + message).slice(0, 80),
    title: title,
    subtitle: message,
    overview: message,
    type: 'collection',
    aspectRatio: '16:9'
  };
}

function sortOptions() {
  return MISSAV_SORT_OPTIONS.map(function (item) {
    return { label: item.title, title: item.title, value: item.value };
  });
}

function parseCards(html, ctx) {
  const blocks = mediaBlocks(html);
  const items = [];
  const seen = {};
  blocks.forEach(function (block) {
    const item = parseCard(block, ctx, items.length + 1);
    if (!item || seen[item.id]) return;
    seen[item.id] = true;
    items.push(item);
  });
  return items;
}

function mediaBlocks(html) {
  const source = String(html || '');
  const blocks = [];
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorPattern.exec(source))) {
    const href = attr(match[1], 'href');
    if (!isDetailHref(href)) continue;
    const before = source.slice(Math.max(0, match.index - 1200), match.index);
    const containerStart = Math.max(before.lastIndexOf('<div'), before.lastIndexOf('<article'), before.lastIndexOf('<li'));
    const realStart = containerStart >= 0 ? match.index - before.length + containerStart : match.index;
    const close = ['</article>', '</li>', '</div>']
      .map(function (tag) {
        const index = source.indexOf(tag, anchorPattern.lastIndex);
        return index >= 0 ? index + tag.length : -1;
      })
      .filter(function (index) { return index > anchorPattern.lastIndex; })
      .sort(function (a, b) { return a - b; })[0];
    blocks.push(source.slice(realStart, close || anchorPattern.lastIndex));
  }
  return blocks;
}

function parseCard(block, ctx, rank) {
  const anchors = anchorsIn(block).filter(function (anchor) { return isDetailHref(anchor.href); });
  if (!anchors.length) return null;
  const primary = anchors.filter(function (anchor) { return !isJunkText(anchor.text) && !isJunkText(anchor.title); })[0] || anchors[0];
  const detailURL = absoluteURL(ctx, primary.href);
  const videoId = extractVideoId(detailURL);
  const title = cleanText(firstNonEmpty(primary.title, primary.text, attr(block, 'title'), attr(block, 'alt'), videoId));
  if (!title || isJunkText(title)) return null;
  const image = absoluteURL(ctx, firstNonEmpty(pickImage(block), videoId ? 'https://fourhoi.com/' + videoId.toLowerCase() + '/cover-t.jpg' : ''));
  const duration = firstNonEmpty(firstMatch(block, /(\d{1,3}:\d{2}:\d{2})/), firstMatch(block, /(\d{1,3}:\d{2})/));
  const id = encodePayload({ url: detailURL, title: title, poster: image });
  const badges = [];
  if (/中文字幕|chinese-subtitle/i.test(block + ' ' + detailURL)) badges.push('中文字幕');
  if (/无码|uncensored|fc2/i.test(block + ' ' + detailURL)) badges.push('无码');

  return {
    id: id,
    title: title,
    name: title,
    type: 'movie',
    poster: image,
    backdrop: image,
    thumbnailURL: image,
    posterPath: image,
    backdropPath: image,
    imageHeaders: imageHeaders(ctx, detailURL),
    subtitle: duration || videoId || '',
    remarks: duration,
    runtimeMinutes: runtimeMinutes(duration),
    rank: rank,
    badges: badges,
    aspectRatio: '16:9',
    providerIds: {
      missav: videoId || extractSearchCode(title),
      source: WidgetMetadata.id
    },
    action: {
      type: 'detail',
      id: id,
      itemId: id,
      url: detailURL,
      title: title
    }
  };
}

async function playbackGroups(ctx, detailURL, title, playUrl) {
  const headers = playbackHeaders(ctx, detailURL);
  const versions = await playbackVersions(ctx, detailURL, title, playUrl, headers);
  return [
    {
      id: 'missav-ovo-online',
      title: '在线播放',
      versions: versions
    }
  ];
}

async function playbackVersions(ctx, detailURL, title, playUrl, headers) {
  const uuid = extractSurritUuid(playUrl);
  const workerItems = uuid ? await workerQualityVersions(ctx, uuid, detailURL, title, headers) : [];
  if (workerItems.length) return workerItems;

  const candidates = [];
  if (uuid) {
    candidates.push({ name: '1080P', url: 'https://surrit.com/' + uuid + '/1080p/video.m3u8' });
    candidates.push({ name: '720P', url: 'https://surrit.com/' + uuid + '/720p/video.m3u8' });
    candidates.push({ name: '默认线路', url: 'https://surrit.com/' + uuid + '/playlist.m3u8' });
  } else {
    candidates.push({ name: playUrl ? '默认线路' : '待解析', url: playUrl || detailURL });
  }

  const seen = {};
  return candidates.filter(function (item) {
    if (!item.url || seen[item.url]) return false;
    seen[item.url] = true;
    return true;
  }).map(function (item, index) {
    return playbackVersion(detailURL, title, item.name, item.url, headers, index === 0);
  });
}

async function workerQualityVersions(ctx, uuid, detailURL, title, headers) {
  const worker = workerURL(ctx);
  if (!worker) return [];
  try {
    const response = await httpGet(worker.replace(/\/+$/, '') + '/qualities/' + encodeURIComponent(uuid), {
      headers: requestHeaders(ctx, detailURL)
    });
    const data = parseJSONMaybe(responseText(response));
    const qualities = Array.isArray(data) ? data : Array.isArray(data && data.qualities) ? data.qualities : [];
    return qualities.map(function (item, index) {
      const url = typeof item === 'string' ? item : firstNonEmpty(item.url, item.playUrl, item.src);
      if (!url) return null;
      const name = typeof item === 'string' ? '线路 ' + (index + 1) : firstNonEmpty(item.label, item.name, item.title, item.quality, '线路 ' + (index + 1));
      return playbackVersion(detailURL, title, name, url, headers, index === 0, worker);
    }).filter(Boolean);
  } catch (error) {
    return [];
  }
}

function playbackVersion(detailURL, title, name, url, headers, isDefault, worker) {
  const id = encodePayload({ url: detailURL, title: title, playUrl: url, line: name, worker: worker || '' });
  return {
    id: id,
    title: name,
    name: name,
    subtitle: 'MissAV',
    url: url,
    playUrl: isPlayableURL(url) ? url : '',
    path: url,
    default: !!isDefault,
    availability: 'playable',
    container: containerOf(url),
    headers: headers,
    header: headers,
    Header: headers,
    customHeaders: headers,
    sourceName: 'MissAV',
    action: {
      type: 'play',
      itemId: id,
      versionId: id,
      title: title || 'MissAV'
    }
  };
}

function playbackResult(ctx, url, referer) {
  const link = absoluteURL(ctx, url);
  const container = containerOf(link);
  return {
    url: link,
    container: container,
    headers: playbackHeaders(ctx, referer),
    startPositionSeconds: 0,
    isLive: false,
    streamKind: container === 'm3u8' ? 'hls' : 'file'
  };
}

async function fetchText(ctx, url) {
  let response;
  try {
    response = await httpGet(url, {
      headers: requestHeaders(ctx, url),
      timeout: 30,
      useBrowserCookie: true,
      attachBrowserCookie: true,
      useBrowserFallback: true,
      browserFallback: true,
      allowBrowserFallback: true
    });
  } catch (error) {
    const browserText = await browserHTML(url, url);
    if (browserText && !isCloudflare(browserText)) return browserText;
    throw error;
  }
  const text = responseText(response);
  if (isCloudflare(text, response && response.status, response && response.headers)) {
    if (isLegalBlock(text, response && response.status)) {
      throw new Error('当前域名在所在网络返回 HTTP 451，请在参数中更换可访问域名，例如 https://missav.ws。');
    }
    const browserText = await browserHTML(url, url);
    if (browserText && !isCloudflare(browserText)) return browserText;
    throw new Error('MissAV 启用了 Cloudflare 浏览器校验，当前 HTTP 环境无法直接读取页面。');
  }
  if (!text) {
    const browserText = await browserHTML(url, url);
    if (browserText && !isCloudflare(browserText)) return browserText;
  }
  return text;
}

function httpGet(url, options) {
  if (typeof Widget !== 'undefined' && Widget.http && typeof Widget.http.get === 'function') return Widget.http.get(url, options || {});
  if (typeof $http !== 'undefined' && typeof $http.get === 'function') return $http.get(url, options || {});
  throw new Error('当前运行环境没有可用 HTTP 客户端。');
}

async function browserHTML(url, referer) {
  if (typeof Widget === 'undefined' || !Widget.browser || typeof Widget.browser.fetch !== 'function') return '';
  try {
    const result = await Widget.browser.fetch(url, {
      visible: false,
      timeout: 60,
      waitAfterLoad: 2.5,
      waitForAny: true,
      waitForMediaSource: true,
      headers: requestHeaders({}, referer || url)
    });
    return responseText(result && result.html ? { data: result.html } : result);
  } catch (error) {
    return '';
  }
}

async function extractFromBrowser(url, referer) {
  if (typeof Widget === 'undefined' || !Widget.browser || typeof Widget.browser.fetch !== 'function') return '';
  try {
    const result = await Widget.browser.fetch(url, {
      visible: false,
      timeout: 70,
      waitAfterLoad: 3,
      waitForAny: true,
      waitForMediaSource: true,
      headers: requestHeaders({}, referer || url)
    });
    return firstNonEmpty(playableFromBrowserResult(result), extractVideoUrl(responseText(result)), extractVideoUrl(result && result.html));
  } catch (error) {
    return '';
  }
}

function playableFromBrowserResult(result) {
  if (!result) return '';
  const keys = ['url', 'mediaURL', 'mediaUrl', 'videoURL', 'videoUrl', 'playURL', 'playUrl', 'src'];
  for (let index = 0; index < keys.length; index += 1) {
    if (isPlayableURL(result[keys[index]])) return result[keys[index]];
  }
  const arrays = [result.mediaSources, result.mediaRequests, result.requests, result.responses, result.urls];
  for (let a = 0; a < arrays.length; a += 1) {
    const array = arrays[a];
    if (!Array.isArray(array)) continue;
    for (let i = 0; i < array.length; i += 1) {
      const item = array[i];
      const value = typeof item === 'string' ? item : firstNonEmpty(item && item.url, item && item.src, item && item.responseURL);
      if (isPlayableURL(value)) return value;
    }
  }
  return '';
}

function extractVideoUrl(html) {
  const source = decodeEscapes(String(html || '') + '\n' + unpackPacker(html));
  return firstPlayable(
    firstMatch(source, /source1280\s*=\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
    firstMatch(source, /source842\s*=\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
    firstMatch(source, /source\s*=\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
    firstMatch(source, /(?:hlsUrl|videoUrl|video_url|videoSrc|m3u8|url|src)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
    firstMatch(source, /["'](https?:\/\/[^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
    firstMatch(source, /(https?:\\\/\\\/[^"']+\.(?:m3u8|mp4|mpd)[^"']*)/i)
  );
}

function unpackPacker(html) {
  const source = String(html || '');
  const unpacked = [];
  const pattern = /eval\s*\(\s*function\s*\(\s*p\s*,\s*a\s*,\s*c\s*,\s*k\s*,\s*e\s*,\s*d\s*\)[\s\S]+?\}\s*\(\s*'([\s\S]+?)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'([\s\S]+?)'[\s\S]+?\)/g;
  let match;
  while ((match = pattern.exec(source))) {
    try {
      let payload = match[1].replace(/\\'/g, "'");
      const radix = parseInt(match[2], 10);
      let count = parseInt(match[3], 10);
      const words = match[4].split('|');
      while (count > 0) {
        count -= 1;
        if (words[count]) payload = payload.replace(new RegExp('\\b' + count.toString(radix) + '\\b', 'g'), words[count]);
      }
      unpacked.push(payload);
    } catch (error) {}
  }
  return unpacked.join('\n');
}

function listURL(ctx, section, page, filters, sort) {
  return pagedURL(withSortAndFilters(categoryURL(ctx, section.path), filters, sort), page);
}

function withSortAndFilters(url, filters, sort) {
  let output = url;
  if (filters) output += (output.indexOf('?') >= 0 ? '&' : '?') + 'filters=' + encodeURIComponent(filters);
  if (sort) output += (output.indexOf('?') >= 0 ? '&' : '?') + 'sort=' + encodeURIComponent(sort);
  return output;
}

function pagedURL(url, page) {
  if (page <= 1) return url;
  if (/[?&]page=\d+/i.test(url)) return url.replace(/([?&]page=)\d+/i, '$1' + page);
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'page=' + page;
}

function categoryURL(ctx, path) {
  const value = stringValue(path);
  if (/^https?:\/\//i.test(value)) return value;
  if (!value || value === '/') return entryURL(ctx);
  if (/^(?:\/)?(?:dm\d+\/)?cn(?:\/|$)/i.test(value)) return baseURL(ctx) + '/' + value.replace(/^\/+/, '');
  return localePrefix(ctx) + '/' + value.replace(/^\/+/, '');
}

function entryURL(ctx) {
  return baseURL(ctx) + entryPath(ctx);
}

function baseURL(ctx) {
  return (stringValue(contextValue(ctx, 'baseURL') || contextValue(ctx, 'baseUrl') || MISSAV_OVO_DEFAULT_BASE) || MISSAV_OVO_DEFAULT_BASE).replace(/\/+$/, '');
}

function entryPath(ctx) {
  let value = stringValue(contextValue(ctx, 'entryPath') || contextValue(ctx, 'entry') || MISSAV_OVO_DEFAULT_ENTRY) || MISSAV_OVO_DEFAULT_ENTRY;
  if (value.charAt(0) !== '/') value = '/' + value;
  return value.replace(/\/+$/, '');
}

function localePrefix(ctx) {
  const match = entryPath(ctx).match(/^(.*\/cn)(?:\/|$)/i);
  return baseURL(ctx) + (match ? match[1] : entryPath(ctx)).replace(/\/+$/, '');
}

function requestHeaders(ctx, referer) {
  return {
    'User-Agent': MISSAV_OVO_UA,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    Referer: referer || entryURL(ctx)
  };
}

function imageHeaders(ctx, referer) {
  return {
    'User-Agent': MISSAV_OVO_UA,
    Referer: referer || entryURL(ctx)
  };
}

function playbackHeaders(ctx, referer) {
  return {
    'User-Agent': MISSAV_OVO_UA,
    Referer: referer || entryURL(ctx),
    Origin: originOf(referer) || baseURL(ctx)
  };
}

function responseText(response) {
  if (typeof response === 'string') return response;
  if (!response) return '';
  if (typeof response.data === 'string') return response.data;
  if (typeof response.body === 'string') return response.body;
  return String(response.data || response.body || '');
}

function detailUrlFromContext(ctx) {
  const payload = decodePayload(ctx && (ctx.versionId || ctx.sourceId || ctx.id || ctx.itemId));
  return firstNonEmpty(
    payload && payload.url,
    ctx && ctx.url,
    ctx && ctx.link,
    detailUrlFromItemId(ctx && ctx.itemId),
    detailUrlFromItemId(ctx && ctx.id)
  );
}

function playUrlFromContext(ctx) {
  const payload = decodePayload(ctx && (ctx.versionId || ctx.sourceId || ctx.id || ctx.itemId));
  return firstNonEmpty(payload && payload.playUrl, ctx && ctx.playUrl, ctx && ctx.videoUrl);
}

function detailUrlFromItemId(value) {
  const payload = decodePayload(value);
  if (payload && payload.url) return payload.url;
  const text = stringValue(value);
  return /^https?:\/\//i.test(text) ? text : '';
}

function encodePayload(data) {
  const parts = [];
  Object.keys(data || {}).forEach(function (key) {
    const value = data[key];
    if (value === undefined || value === null || value === '') return;
    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
  });
  return MISSAV_OVO_PAYLOAD_PREFIX + parts.join('&');
}

function decodePayload(value) {
  const text = stringValue(value);
  if (text.indexOf(MISSAV_OVO_PAYLOAD_PREFIX) !== 0) return null;
  const result = {};
  text.slice(MISSAV_OVO_PAYLOAD_PREFIX.length).split('&').forEach(function (part) {
    const index = part.indexOf('=');
    const key = index >= 0 ? part.slice(0, index) : part;
    const raw = index >= 0 ? part.slice(index + 1) : '';
    try {
      result[decodeURIComponent(key)] = decodeURIComponent(raw);
    } catch (error) {
      result[key] = raw;
    }
  });
  return result.url ? result : null;
}

function findSection(value) {
  const id = stringValue(value);
  return MISSAV_SECTIONS.find(function (item) {
    return item.id === id || item.title === id || item.path === id || item.path.replace(/^\//, '') === id ||
      (Array.isArray(item.aliases) && item.aliases.indexOf(id) >= 0) || categorySlug(item.path) === categorySlug(id);
  }) || null;
}

function findPrimaryCategory(value) {
  const id = stringValue(value);
  return MISSAV_PRIMARY_CATEGORIES.find(function (item) {
    return item.id === id || item.title === id || item.path === id || item.path.replace(/^\//, '') === id || categorySlug(item.path) === categorySlug(id);
  }) || null;
}

function normalizePageId(value) {
  const text = stringValue(value) || 'recent-updates';
  const section = findSection(text);
  if (section) return section.id;
  const primary = findPrimaryCategory(text);
  if (primary) return primary.id;
  return categorySlug(text) || text;
}

function isDetailHref(href) {
  const value = String(href || '');
  return /\/(?:dm\d+\/)?cn\/(?!new(?:[/?#]|$)|search(?:[/?#]|$)|genres?(?:[/?#]|$)|makers?(?:[/?#]|$)|actresses?(?:[/?#]|$)|actors?(?:[/?#]|$)|weekly-hot|monthly-hot|uncensored-leak|chinese-subtitle|fc2(?:[/?#]|$)|heyzo(?:[/?#]|$)|tokyohot(?:[/?#]|$)|1pondo(?:[/?#]|$)|caribbean|10musume|pacopacomama|gachinco|xxxav|siro|luxu|gana|maan|scute|ara|madou|twav|klive|clive|history|playlist|favorite|login|register)[^"'#?\/]+/i.test(value);
}

function anchorsIn(html) {
  const anchors = [];
  const pattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(String(html || '')))) {
    const attrs = match[1] || '';
    anchors.push({
      href: attr(attrs, 'href'),
      title: attr(attrs, 'title') || attr(match[0], 'title'),
      text: cleanText(match[2])
    });
  }
  return anchors;
}

function extractPeopleLinks(html, hrefPattern) {
  const seen = {};
  return anchorsIn(html).filter(function (anchor) {
    hrefPattern.lastIndex = 0;
    if (!hrefPattern.test(anchor.href) || !anchor.text) return false;
    const key = anchor.text + '|' + anchor.href;
    if (seen[key]) return false;
    seen[key] = true;
    anchor.name = anchor.text;
    anchor.url = absoluteURL(null, anchor.href);
    return true;
  }).slice(0, 60);
}

function pickImage(block) {
  const images = [];
  const pattern = /(?:data-src|data-original|data-lazy|data-poster|data-cover|poster|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let match;
  while ((match = pattern.exec(String(block || '')))) {
    const value = match[1] || match[2] || match[3] || '';
    if (/\.(?:jpg|jpeg|png|webp)(?:[?#]|$)/i.test(value) && !/logo|favicon|blank|loading|avatar/i.test(value)) images.push(value);
  }
  return images[0] || '';
}

function attr(block, name) {
  const pattern = new RegExp(name + '\\s*=\\s*(?:"([^"]*)"|\\\'([^\\\']*)\\\'|([^\\s>]+))', 'i');
  const match = pattern.exec(String(block || ''));
  return match ? decodeEntities(match[1] || match[2] || match[3] || '') : '';
}

function metaContent(html, key, value) {
  const pattern = /<meta\b[^>]*>/gi;
  let match;
  while ((match = pattern.exec(String(html || '')))) {
    const tag = match[0];
    if (attr(tag, key).toLowerCase() === String(value || '').toLowerCase()) return attr(tag, 'content');
  }
  return '';
}

function labeledValue(html, labels) {
  const text = cleanText(html);
  for (let index = 0; index < labels.length; index += 1) {
    const match = new RegExp(labels[index] + '\\s*[:：]\\s*([^\\n]+?)(?:\\s{2,}|$)').exec(text);
    if (match) return match[1];
  }
  return '';
}

function pageTitle(html) {
  return cleanText(firstNonEmpty(firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i), firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)));
}

function cleanTitle(value) {
  return cleanText(value).replace(/\s*-\s*MissAV.*$/i, '').trim();
}

function extractVideoId(href) {
  const slug = String(href || '').split('#')[0].split('?')[0].split('/').filter(Boolean).pop() || '';
  try {
    return decodeURIComponent(slug).toUpperCase();
  } catch (error) {
    return slug.toUpperCase();
  }
}

function extractSearchCode(text) {
  const source = String(text || '').toUpperCase().replace(/\./g, ' ').replace(/_/g, '-');
  const match = source.match(/\bFC2(?:[- ]?PPV)?[- ]?\d{5,8}\b|\b(?:CARIB|1PONDO|HEYZO|T28)[- ]?\d{3,8}\b|\b[A-Z]{2,8}[-_ ]?\d{2,7}[A-Z]?\b/);
  if (!match) return '';
  return match[0].replace(/\s+/g, '').replace(/_/g, '-').replace(/-+/g, '-').toUpperCase();
}

function extractSurritUuid(value) {
  const match = String(value || '').match(/surrit\.com\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\//i);
  return match ? match[1] : '';
}

function workerURL(ctx) {
  return stringValue(contextValue(ctx, 'worker') || contextValue(ctx, 'workerURL') || contextValue(ctx, 'workerUrl')).replace(/\/+$/, '');
}

function parseJSONMaybe(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch (error) {
    return null;
  }
}

function contextValue(ctx, key) {
  if (!ctx || !key) return '';
  if (ctx[key] !== undefined && ctx[key] !== null && ctx[key] !== '') return ctx[key];
  const bags = [ctx.params, ctx.config, ctx.settings, ctx.parameters];
  for (let index = 0; index < bags.length; index += 1) {
    const bag = bags[index];
    if (bag && bag[key] !== undefined && bag[key] !== null && bag[key] !== '') return bag[key];
  }
  return '';
}

function absoluteURL(ctx, url) {
  const value = decodeEntities(String(url || '').trim());
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.indexOf('//') === 0) return 'https:' + value;
  const root = ctx ? baseURL(ctx) : MISSAV_OVO_DEFAULT_BASE;
  return root.replace(/\/+$/, '') + '/' + value.replace(/^\/+/, '');
}

function originOf(url) {
  const match = String(url || '').match(/^(https?:\/\/[^/]+)/i);
  return match ? match[1] : MISSAV_OVO_DEFAULT_BASE;
}

function titleFromUrl(url) {
  const slug = extractVideoId(url);
  return slug ? slug.replace(/[-_]+/g, ' ') : 'MissAV';
}

function categorySlug(value) {
  const parts = String(value || '').split('?')[0].split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

function hasNextPage(html, page) {
  const source = String(html || '');
  if (new RegExp('>\\s*' + (page + 1) + '\\s*<').test(source)) return true;
  return /下一页|Next|rel=["']next["']/i.test(cleanText(source));
}

function runtimeMinutes(value) {
  const text = stringValue(value);
  const parts = text.split(':').map(function (part) { return Number(part); });
  if (parts.length === 3 && parts.every(Number.isFinite)) return parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
  if (parts.length === 2 && parts.every(Number.isFinite)) return parts[0] + Math.round(parts[1] / 60);
  return undefined;
}

function containerOf(url) {
  const match = String(url || '').match(/\.(m3u8|mpd|mp4|m4v|mov|webm|mkv|ts)(?:[?#]|$)/i);
  if (!match) return 'm3u8';
  return match[1].toLowerCase();
}

function isPlayableURL(url) {
  return /^https?:\/\//i.test(String(url || '')) && /\.(?:m3u8|mpd|mp4|m4v|mov|webm|mkv|ts)(?:[?#]|$)/i.test(String(url || ''));
}

function isCloudflare(html, status, headers) {
  const text = String(html || '') + ' ' + JSON.stringify(headers || {});
  return Number(status) === 403 ||
    Number(status) === 451 ||
    /<title>\s*Just a moment/i.test(text) ||
    /HTTP\s*451|법적 사유로 이용 불가|legal reasons/i.test(text) ||
    /Enable JavaScript and cookies to continue/i.test(text) ||
    /cf-mitigated|cf-browser-verification/i.test(text);
}

function isLegalBlock(html, status) {
  return Number(status) === 451 || /HTTP\s*451|법적 사유로 이용 불가|legal reasons/i.test(String(html || ''));
}

function toWideItem(item) {
  const copy = {};
  Object.keys(item).forEach(function (key) { copy[key] = item[key]; });
  copy.aspectRatio = '16:9';
  copy.backdrop = copy.backdrop || copy.poster;
  return copy;
}

function isJunkText(value) {
  const text = cleanText(value);
  return !text ||
    text === '更多' ||
    text === '载入更多' ||
    text === '訂閱' ||
    text === '订阅' ||
    /^\d{1,3}:\d{2}(?::\d{2})?$/.test(text) ||
    /^(中文字幕|英文字幕|无码影片)$/i.test(text);
}

function firstPlayable() {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = normalizePlayableURL(arguments[index]);
    if (value) return value;
  }
  return '';
}

function normalizePlayableURL(value) {
  const text = decodeEscapes(stringValue(value)).replace(/\\/g, '');
  if (!/^https?:\/\//i.test(text) && text.indexOf('//') !== 0) return '';
  if (!/\.(?:m3u8|mp4|mpd)(?:[?#]|$)/i.test(text)) return '';
  return text.indexOf('//') === 0 ? 'https:' + text : text;
}

function cleanText(value) {
  return decodeEntities(stripTags(value)).replace(/\s+/g, ' ').trim();
}

function stripTags(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

function decodeEscapes(value) {
  return String(value || '')
    .replace(/\\u002F/g, '/')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&');
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&#x([0-9a-f]+);/gi, function (_, hex) { return String.fromCharCode(parseInt(hex, 16)); })
    .replace(/&#(\d+);/g, function (_, num) { return String.fromCharCode(parseInt(num, 10)); })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function firstMatch(value, regex) {
  const match = regex.exec(String(value || ''));
  if (!match) return '';
  for (let index = 1; index < match.length; index += 1) {
    if (match[index]) return match[index];
  }
  return match[0] || '';
}

function firstNonEmpty() {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = arguments[index];
    if (Array.isArray(value)) {
      const nested = firstNonEmpty.apply(null, value);
      if (nested) return nested;
      continue;
    }
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return '';
}

function stringValue(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function positiveInt(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function unique(items) {
  const seen = {};
  const output = [];
  (items || []).forEach(function (item) {
    const value = cleanText(item);
    if (!value || seen[value]) return;
    seen[value] = true;
    output.push(value);
  });
  return output;
}

const MissAVOvoBaiPlayMiniLibrary = {
  metadata: WidgetMetadata,
  getManifest: getManifest,
  getHome: getHome,
  getHomeSection: getHomeSection,
  getCategory: getCategory,
  getDetail: getDetail,
  getResourceVersions: getResourceVersions,
  resolvePlayback: resolvePlayback,
  search: search,
  onSearch: onSearch
};

function __jsEvalReturn() {
  return MissAVOvoBaiPlayMiniLibrary;
}

if (typeof globalThis !== 'undefined') {
  globalThis.WidgetMetadata = WidgetMetadata;
  globalThis.MissAVOvoBaiPlayMiniLibrary = MissAVOvoBaiPlayMiniLibrary;
  globalThis.getManifest = getManifest;
  globalThis.getHome = getHome;
  globalThis.getHomeSection = getHomeSection;
  globalThis.getCategory = getCategory;
  globalThis.getDetail = getDetail;
  globalThis.getResourceVersions = getResourceVersions;
  globalThis.resolvePlayback = resolvePlayback;
  globalThis.search = search;
  globalThis.onSearch = onSearch;
  globalThis.__jsEvalReturn = __jsEvalReturn;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MissAVOvoBaiPlayMiniLibrary;
}
