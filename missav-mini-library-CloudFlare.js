// @name MissAV Mini Library

const MISSAV_DEFAULT_BASE = 'https://missav.ws';
const MISSAV_DEFAULT_ENTRY = '/dm247/cn';
const MISSAV_LOGO = 'https://missav.ws/favicon.ico';
const MISSAV_DETAIL_PAYLOAD_PREFIX = 'missav://detail?';
const MISSAV_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const WidgetMetadata = {
  id: 'missav-mini-library',
  name: 'MissAV',
  title: 'MissAV',
  version: '1.0.7',
  author: 'alanhuang',
  logo: MISSAV_LOGO,
  icon: MISSAV_LOGO,
  site: MISSAV_DEFAULT_BASE,
  description: 'MissAV 自定义媒体库，支持首页、分类、搜索、详情和播放解析。'
};

const MISSAV_SECTIONS = [
  { id: 'new-release', title: '新作上市', path: '/new', style: 'discover.spotlight' },
  { id: 'latest', title: '最近更新', path: '/new?sort=published_at', style: 'discover.ranked' },
  { id: 'chinese-subtitle', title: '中文字幕', path: '/chinese-subtitle', style: 'discover.posterCompact' },
  { id: 'uncensored-leak', title: '无码流出', aliases: ['无码影片'], path: '/uncensored-leak', style: 'discover.posterCompact' },
  { id: 'today-hot', title: '今日热门', path: '/today-hot', style: 'discover.ranked' },
  { id: 'weekly-hot', title: '本周热门', path: '/weekly-hot', style: 'discover.ranked' },
  { id: 'monthly-hot', title: '本月热门', path: '/monthly-hot', style: 'discover.ranked' },
  { id: 'fc2', title: 'FC2', path: '/fc2', style: 'discover.posterCompact' },
  { id: 'heyzo', title: 'HEYZO', path: '/heyzo', style: 'discover.posterCompact' },
  { id: 'tokyo-hot', title: '东京热', path: '/tokyo-hot', style: 'discover.posterCompact' },
  { id: '1pondo', title: '一本道', path: '/1pondo', style: 'discover.posterCompact' },
  { id: 'caribbeancom', title: 'Caribbeancom', path: '/caribbeancom', style: 'discover.posterCompact' },
  { id: 'caribbeancompr', title: 'Caribbeancompr', path: '/caribbeancompr', style: 'discover.posterCompact' },
  { id: '10musume', title: '10musume', path: '/10musume', style: 'discover.posterCompact' },
  { id: 'pacopacomama', title: 'pacopacomama', path: '/pacopacomama', style: 'discover.posterCompact' },
  { id: 'gachinco', title: 'Gachinco', path: '/gachinco', style: 'discover.posterCompact' },
  { id: 'xxx-av', title: 'XXX-AV', path: '/xxx-av', style: 'discover.posterCompact' },
  { id: 'siro', title: 'SIRO', path: '/siro', style: 'discover.posterCompact' },
  { id: 'luxu', title: 'LUXU', path: '/luxu', style: 'discover.posterCompact' },
  { id: 'gana', title: 'GANA', path: '/gana', style: 'discover.posterCompact' },
  { id: 'prestige-premium', title: 'PRESTIGE PREMIUM', path: '/prestige-premium', style: 'discover.posterCompact' },
  { id: 's-cute', title: 'S-CUTE', path: '/s-cute', style: 'discover.posterCompact' },
  { id: 'ara', title: 'ARA', path: '/ara', style: 'discover.posterCompact' },
  { id: 'madou', title: '麻豆传媒', path: '/madou', style: 'discover.posterCompact' },
  { id: 'twav', title: 'TWAV', path: '/twav', style: 'discover.posterCompact' },
  { id: 'vr', title: 'VR', path: '/vr', style: 'discover.posterCompact' }
];

const MISSAV_PRIMARY_CATEGORIES = [
  { id: 'latest', title: '最近更新', path: '/new?sort=published_at', subtitle: '按发布时间更新' },
  { id: 'new-release', title: '新作上市', path: '/new', subtitle: '最新上架作品' },
  { id: 'uncensored-leak', title: '无码流出', path: '/uncensored-leak', subtitle: '无码流出专区' },
  { id: 'actresses', title: '女优一览', path: '/actresses', subtitle: '按女优浏览' },
  { id: 'actress-ranking', title: '女优排行', path: '/actresses/ranking', subtitle: '站内女优排行' },
  { id: 'genres', title: '类型', path: '/genres', subtitle: '按题材类型浏览' },
  { id: 'makers', title: '发行商', path: '/makers', subtitle: '按发行商浏览' },
  { id: 'vr', title: 'VR', path: '/genres/VR', subtitle: 'VR 作品专区' }
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
      resourceMatching: false,
      resourceMatch: {
        enabled: false,
        parameters: [
          'tmdbId',
          'imdbId',
          'title',
          'originalTitle',
          'alternativeTitles',
          'year',
          'mediaType'
        ]
      }
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
        defaultValue: MISSAV_DEFAULT_BASE,
        required: true,
        description: 'MissAV 当前可访问域名。'
      },
      {
        name: 'entryPath',
        title: '中文入口路径',
        type: 'input',
        defaultValue: MISSAV_DEFAULT_ENTRY,
        required: true,
        description: '例如 /dm247/cn。MissAV 的 dm 前缀会变化，失效时可替换为当前可访问入口。'
      },
      {
        name: 'backupBaseURLs',
        title: '备用站点地址',
        type: 'input',
        defaultValue: 'https://missav.ai,https://missav123.com',
        required: false,
        description: '多个域名用逗号或换行分隔。网络不稳或主域名被拦截时会自动尝试备用域名。'
      },
      {
        name: 'enableBrowserFallback',
        title: 'Cloudflare 浏览器兜底',
        type: 'boolean',
        defaultValue: true,
        required: false,
        description: '遇到 Cloudflare 或普通 HTTP 失败时，使用 App 浏览器请求一次并复用浏览器 Cookie。'
      },
      {
        name: 'browserVisible',
        title: '显示验证窗口',
        type: 'boolean',
        defaultValue: false,
        required: false,
        description: '默认关闭，避免列表页自动跳出真人验证界面。需要时点击页面里的手动验证卡片。'
      },
      {
        name: 'requestTimeoutSeconds',
        title: '请求超时秒数',
        type: 'number',
        defaultValue: 45,
        required: false,
        description: '网络差时可调大到 60-90 秒。'
      },
      {
        name: 'cacheMinutes',
        title: '页面缓存分钟',
        type: 'number',
        defaultValue: 20,
        required: false,
        description: '短期缓存首页、分类、详情 HTML，减少重复触发 Cloudflare。'
      }
    ]
  };
}

async function getHome(ctx) {
  const html = await safeFetch(ctx, entryURL(ctx), baseURL(ctx) + '/');
  const hero = parseCards(sectionBlock(html, '推荐给你'), '推荐给你', ctx).slice(0, 10).map(toWideItem);
  const parsedSections = parseHomeSections(ctx, html);
  const mediaSections = parsedSections.length ? parsedSections : MISSAV_SECTIONS.map(function (section) {
    return sectionShell(ctx, section);
  });
  const sections = [primaryCategoriesSection(ctx)].concat(mediaSections);

  return {
    pageType: 'home',
    id: 'missav-home',
    title: 'MissAV',
    heroAspectRatio: '16:9',
    hero: hero,
    sections: sections
  };
}

function primaryCategoriesSection(ctx) {
  return {
    id: 'missav-primary-categories',
    title: '分类',
    style: 'discover.annualCategories',
    lazy: false,
    items: MISSAV_PRIMARY_CATEGORIES.map(function (category) {
      return categoryCard(ctx, category);
    })
  };
}

function categoryCard(ctx, category) {
  return {
    id: 'category-' + category.id,
    title: category.title,
    subtitle: category.subtitle || '',
    type: 'category',
    aspectRatio: '16:9',
    previewItems: [],
    action: {
      type: 'category',
      id: category.id,
      pageId: category.id,
      title: category.title,
      url: categoryURL(ctx, category.path),
      itemAspectRatio: '16:9'
    }
  };
}

async function getHomeSection(ctx) {
  const sectionId = stringValue(ctx && (ctx.sectionId || ctx.id));
  const section = findSection(sectionId) || MISSAV_SECTIONS[0];
  const url = categoryURL(ctx, section.path);
  try {
    const html = await fetchText(ctx, url);
    return {
      id: section.id,
      title: section.title,
      style: section.style,
      lazy: false,
      moreAction: categoryAction(ctx, section),
      items: parseCards(html, section.title, ctx).slice(0, 18)
    };
  } catch (error) {
    return verificationSection(ctx, section.id, section.title, section.style, url, error);
  }
}

async function getCategory(ctx) {
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  const pageId = normalizePageId(ctx, ctx && (ctx.pageId || ctx.id));
  const section = findSection(pageId);
  const primary = findPrimaryCategory(pageId);
  const path = section ? section.path : primary ? primary.path : pageId;
  const url = pagedURL(categoryURL(ctx, path), page);
  let html = '';
  try {
    html = await fetchText(ctx, url);
  } catch (error) {
    return verificationCategory(ctx, pageId, section ? section.title : primary ? primary.title : '需要验证', url, error, page);
  }
  const title = section ? section.title : primary ? primary.title : pageTitle(html) || 'MissAV';
  const items = parseCards(html, title, ctx);
  const categoryItems = items.length ? [] : parseCategoryCards(ctx, html, title);

  return {
    pageType: 'category',
    id: pageId,
    title: title,
    style: items.length ? 'media.posterGrid' : 'discover.annualCategories',
    itemAspectRatio: '16:9',
    items: items.length ? items : categoryItems,
    page: page,
    hasMore: items.length ? hasNextPage(html, page) : false
  };
}

async function getDetail(ctx) {
  const detailURL = detailUrlFromContext(ctx);
  if (!detailURL) throw new Error('MissAV 详情参数无效');

  let html = '';
  try {
    html = await fetchText(ctx, detailURL);
  } catch (error) {
    return verificationDetail(ctx, detailURL, error);
  }
  const fallbackTitle = titleFromUrl(detailURL);
  const title = cleanText(
    firstNonEmpty(
      metaContent(html, 'property', 'og:title'),
      firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i),
      pageTitle(html),
      fallbackTitle
    )
  ).replace(/\s*-\s*MissAV.*$/i, '');
  const detailImage = detailImageInfo(html);
  const poster = absoluteURL(ctx, firstNonEmpty(
    detailImage.url,
    metaContent(html, 'property', 'og:image'),
    metaContent(html, 'name', 'twitter:image'),
    pickImage(html)
  ));
  const overview = cleanText(firstNonEmpty(
    metaContent(html, 'name', 'description'),
    metaContent(html, 'property', 'og:description'),
    labeledValue(html, ['简介', '描述', '说明'])
  ));
  const code = extractCode(title) || extractCode(detailURL);
  const actorLinks = extractLabeledPeopleLinks(html, ['女优', '演员'], /\/(?:dm\d+\/)?cn\/actresses?\//i);
  const actors = unique(actorLinks.map(function (actor) { return actor.name; }).concat(metaContents(html, 'property', 'og:video:actor')));
  const genres = unique(extractLabeledPeopleLinks(html, ['类型', '標籤', '标签'], /\/(?:dm\d+\/)?cn\/(?:genres?|labels?)\//i).map(function (item) { return item.name; }));
  const makers = unique(extractLabeledPeopleLinks(html, ['发行商', '製作商', '厂商'], /\/(?:dm\d+\/)?cn\/makers?\//i).map(function (item) { return item.name; }));
  const durationText = firstNonEmpty(
    firstMatch(html, /(?:时长|長度|Duration)\s*[:：]?\s*<\/?[^>]*>\s*([0-9:]+)/i),
    firstMatch(html, /(\d{1,2}:\d{2}:\d{2})/i)
  );
  const releaseDate = firstMatch(html, /(\d{4}-\d{2}-\d{2})/);
  const detailPlayableURL = absoluteURL(ctx, extractPlayableURL(html));
  const resourceGroups = playbackGroups(detailURL, title, detailPlayableURL, ctx);
  const defaultVersion = resourceGroups[0] && resourceGroups[0].versions && resourceGroups[0].versions[0];

  return {
    id: makeItemId(detailURL, title, poster),
    title: title || code || fallbackTitle,
    type: 'movie',
    poster: poster,
    backdrop: poster,
    detailImageAspectRatio: detailImage.aspectRatio || '16:9',
    imageHeaders: imageHeaders(ctx, detailURL),
    posterHeaders: imageHeaders(ctx, detailURL),
    backdropHeaders: imageHeaders(ctx, detailURL),
    overview: overview,
    year: releaseDate ? Number(releaseDate.slice(0, 4)) : undefined,
    runtimeMinutes: runtimeMinutes(durationText),
    genres: unique(genres.concat(makers)),
    actors: actors,
    cast: await buildCast(actorLinks, html, ctx, detailURL),
    releaseDate: releaseDate,
    remarks: durationText || code,
    resourceGroups: resourceGroups,
    resourceSummary: {
      versionCount: defaultVersion ? 1 : 0,
      episodeCount: 0,
      defaultVersionId: defaultVersion ? defaultVersion.id : ''
    },
    mediaSources: detailPlayableURL ? [
      {
        id: encodePayload({ url: detailURL, title: title, playUrl: detailPlayableURL }),
        name: 'MissAV HLS',
        displayName: 'MissAV HLS',
        protocol: 'hls',
        container: 'm3u8',
        url: detailPlayableURL,
        path: detailPlayableURL,
        headers: playbackHeaders(ctx, detailURL),
        header: playbackHeaders(ctx, detailURL),
        Header: playbackHeaders(ctx, detailURL),
        customHeaders: playbackHeaders(ctx, detailURL)
      }
    ] : [],
    recommendations: [
      {
        id: 'related',
        title: '相关推荐',
        style: 'discover.posterCompact',
        items: parseCards(html, '相关推荐', ctx).filter(function (item) {
          return item.id !== makeItemId(detailURL, title, poster);
        }).slice(0, 12)
      }
    ],
    providerIds: {
      missav: code || titleFromUrl(detailURL),
      source: WidgetMetadata.id
    }
  };
}

async function getResourceVersions(ctx) {
  const detailURL = detailUrlFromContext(ctx);
  const title = stringValue(ctx && (ctx.title || ctx.name)) || titleFromUrl(detailURL);
  const direct = playUrlFromContext(ctx);
  if (direct) return playbackGroups(detailURL, title, direct, ctx);
  try {
    const html = await fetchText(ctx, detailURL);
    return playbackGroups(detailURL, title, extractPlayableURL(html), ctx);
  } catch (error) {
    return playbackGroups(detailURL, title, '', ctx);
  }
}

async function resolvePlayback(ctx) {
  const direct = firstNonEmpty(playUrlFromContext(ctx), ctx && ctx.url, ctx && ctx.playUrl, ctx && ctx.videoUrl);
  if (isPlayableURL(direct) && !isDetailPageURL(direct)) {
    return playbackResult(ctx, direct, ctx && ctx.referer);
  }

  const detailURL = detailUrlFromContext(ctx);
  if (!detailURL) throw new Error('MissAV 播放参数无效');
  const html = await fetchText(ctx, detailURL);
  const url = firstNonEmpty(
    extractPlayableURL(html),
    await extractPlayableFromLinkedPlayers(ctx, html, detailURL),
    await extractFromBrowser(detailURL, detailURL)
  );
  if (!url) {
    throw new Error('未能解析到 MissAV 播放地址。站点可能启用了 Cloudflare 或更换了播放器脚本，请尝试更新入口路径或在 App 侧启用浏览器请求。');
  }
  return playbackResult(ctx, absoluteURL(ctx, url), detailURL);
}

async function getPlayback(ctx) {
  const playback = await resolvePlayback(ctx || {});
  return {
    id: (ctx && (ctx.versionId || ctx.id || ctx.itemId)) || playback.url,
    title: (ctx && (ctx.title || ctx.name)) || 'MissAV HLS',
    url: playback.url,
    videoUrl: playback.url,
    playUrl: playback.url,
    type: playback.type,
    protocol: playback.protocol,
    container: playback.container,
    mimeType: playback.mimeType,
    playerType: playback.playerType,
    headers: playback.headers,
    Header: playback.headers,
    header: playback.headers,
    customHeaders: playback.headers,
    contentType: playback.mimeType,
    subtitles: playback.subtitles || [],
    danmaku: null,
    startPosition: 0,
    mediaSourceId: (ctx && (ctx.versionId || ctx.id || ctx.itemId)) || playback.url
  };
}

async function play(flagOrInput, id) {
  const input = typeof flagOrInput === 'object' && flagOrInput ? flagOrInput : { id: id || flagOrInput };
  const playback = await getPlayback(input);
  return {
    parse: 0,
    jx: 0,
    playUrl: playback.url,
    url: playback.url,
    videoUrl: playback.url,
    header: playback.headers,
    headers: playback.headers,
    Header: playback.headers,
    customHeaders: playback.headers,
    contentType: playback.mimeType,
    mediaSourceId: playback.mediaSourceId || playback.id,
    type: playback.type,
    container: playback.container
  };
}

async function search(ctx) {
  const query = stringValue(ctx && (ctx.query || ctx.keyword || ctx.text));
  if (!query) return { pageType: 'search', title: '搜索结果', items: [] };
  const page = positiveInt(contextValue(ctx, 'page'), 1);
  const url = pagedURL(categoryURL(ctx, '/search/' + encodeURIComponent(query.replace(/\\/g, ''))), page);
  let html = '';
  try {
    html = await fetchText(ctx, url);
  } catch (error) {
    return {
      pageType: 'search',
      title: '搜索结果',
      items: [verificationCard(ctx, '需要真人验证', url, error)],
      page: page,
      hasMore: false
    };
  }
  const items = parseCards(html, query, ctx);
  return {
    pageType: 'search',
    title: '搜索结果',
    items: items,
    page: page,
    hasMore: hasNextPage(html, page)
  };
}

async function onSearch(ctx) {
  return search(ctx || {});
}

async function getSearch(ctx) {
  return search(ctx || {});
}

async function matchResources(ctx) {
  const query = stringValue(ctx && (ctx.title || ctx.name || ctx.query || ctx.keyword));
  if (!query) return { results: [] };
  const results = await search({ query: query });
  return { results: (results.items || []).slice(0, 8) };
}

async function onAction(ctx) {
  const name = stringValue(ctx && (ctx.name || ctx.action || ctx.id));
  const payload = (ctx && ctx.payload) || ctx || {};
  if (name !== 'verifyCloudflare') return { handled: false };
  const url = stringValue(payload.url || ctx.url) || entryURL(ctx);
  const html = await browserHTML(ctx, url, url, true);
  return {
    handled: true,
    ok: isUsableHTML(html),
    message: isUsableHTML(html) ? '验证完成，可以返回刷新当前页面。' : '验证没有完成，请确认页面已加载并通过真人验证。'
  };
}

async function extractPlayableFromLinkedPlayers(ctx, html, referer) {
  const urls = extractPlayerURLs(ctx, html, referer);
  for (let index = 0; index < urls.length; index += 1) {
    try {
      const playerHTML = await fetchText(ctx, urls[index]);
      const playable = extractPlayableURL(playerHTML);
      if (playable) return playable;
    } catch (error) {
      // Ignore broken auxiliary player pages and continue with browser fallback.
    }
  }
  return '';
}

function extractPlayerURLs(ctx, html, referer) {
  const urls = [];
  const source = String(html || '');
  const patterns = [
    /<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
    /<embed\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
    /(?:player|iframe|embed|src)\s*[:=]\s*["']([^"']+)["']/gi
  ];
  patterns.forEach(function (pattern) {
    let match;
    while ((match = pattern.exec(source))) {
      const url = absoluteURL(ctx, decodeEscapes(match[1]));
      if (url && url !== referer && urls.indexOf(url) < 0 && /^https?:\/\//i.test(url)) urls.push(url);
    }
  });
  return urls.slice(0, 5);
}

function baseURL(ctx) {
  return (stringValue(
    contextValue(ctx, 'baseURL') ||
    contextValue(ctx, 'baseUrl') ||
    contextValue(ctx, 'base_url')
  ) || MISSAV_DEFAULT_BASE).replace(/\/+$/, '');
}

function entryPath(ctx) {
  let value = stringValue(
    contextValue(ctx, 'entryPath') ||
    contextValue(ctx, 'entry') ||
    contextValue(ctx, 'path')
  ) || MISSAV_DEFAULT_ENTRY;
  if (value[0] !== '/') value = '/' + value;
  return value.replace(/\/+$/, '');
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

function localePrefix(ctx) {
  const path = entryPath(ctx);
  const match = path.match(/^(.*\/cn)(?:\/|$)/i);
  return (match ? match[1] : path).replace(/\/+$/, '');
}

function entryURL(ctx) {
  return absoluteURL(ctx, entryPath(ctx));
}

function categoryURL(ctx, path) {
  const value = stringValue(path || '');
  if (/^https?:\/\//i.test(value)) return value;
  if (!value || value === '/') return entryURL(ctx);
  if (/^\/(?:dm\d+\/)?cn(?:\/|$)/i.test(value)) return absoluteURL(ctx, value);
  return absoluteURL(ctx, localePrefix(ctx) + '/' + value.replace(/^\/+/, ''));
}

function pagedURL(url, page) {
  if (page <= 1) return url;
  if (/[?&]page=\d+/i.test(url)) return url.replace(/([?&]page=)\d+/i, '$1' + page);
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'page=' + page;
}

async function fetchText(ctx, url) {
  const cached = getCachedText(ctx, url);
  if (cached) return cached;

  const urls = candidateURLs(ctx, url);
  let lastError = null;
  for (let index = 0; index < urls.length; index += 1) {
    const currentURL = urls[index];
    try {
      const response = await httpGet(currentURL, requestOptions(ctx, currentURL));
      const text = responseText(response);
      if (isUsableHTML(text, response && response.status, response && response.headers)) {
        setCachedText(ctx, currentURL, text);
        if (currentURL !== url) setCachedText(ctx, url, text);
        return text;
      }
      if (isCloudflare(text, response && response.status, response && response.headers)) {
        const browserText = await browserHTML(ctx, currentURL, currentURL);
        if (isUsableHTML(browserText)) {
          setCachedText(ctx, currentURL, browserText);
          if (currentURL !== url) setCachedText(ctx, url, browserText);
          return browserText;
        }
      }
      lastError = new Error('HTTP ' + (response && response.status ? response.status : 'empty') + ' ' + currentURL);
    } catch (error) {
      lastError = error;
      const browserText = await browserHTML(ctx, currentURL, currentURL);
      if (isUsableHTML(browserText)) {
        setCachedText(ctx, currentURL, browserText);
        if (currentURL !== url) setCachedText(ctx, url, browserText);
        return browserText;
      }
    }
  }
  throw new Error('MissAV 页面读取失败，可能是 Cloudflare 验证、网络超时或当前域名不可达。可点击“手动完成验证”，或在“备用站点地址”里填写当前能打开的域名。' + (lastError && lastError.message ? ' 原因：' + lastError.message : ''));
}

async function safeFetch(ctx, url, referer) {
  try {
    return await fetchText(ctx || { baseURL: originOf(url), entryPath: pathOf(url) }, url, referer);
  } catch (error) {
    return '';
  }
}

function requestOptions(ctx, referer) {
  const timeout = numberParam(ctx, 'requestTimeoutSeconds', 45);
  return {
    headers: requestHeaders(ctx, referer),
    timeout: timeout,
    timeoutSeconds: timeout,
    useBrowserCookie: true,
    attachBrowserCookie: true,
    useBrowserFallback: boolParam(ctx, 'enableBrowserFallback', true),
    browserFallback: boolParam(ctx, 'enableBrowserFallback', true),
    allowBrowserFallback: boolParam(ctx, 'enableBrowserFallback', true)
  };
}

function httpGet(url, options) {
  if (typeof Widget !== 'undefined' && Widget.http && typeof Widget.http.get === 'function') {
    return Widget.http.get(url, options || {});
  }
  if (typeof $http !== 'undefined' && typeof $http.get === 'function') {
    return $http.get(url, options || {});
  }
  throw new Error('当前运行环境没有可用 HTTP 客户端。');
}

function requestHeaders(ctx, referer) {
  return {
    'User-Agent': MISSAV_UA,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    Referer: referer || entryURL(ctx)
  };
}

function imageHeaders(ctx, referer) {
  return {
    'User-Agent': MISSAV_UA,
    Referer: referer || entryURL(ctx)
  };
}

function playbackHeaders(ctx, referer) {
  const origin = originOf(referer) || baseURL(ctx);
  return {
    'User-Agent': MISSAV_UA,
    Referer: referer || entryURL(ctx),
    Origin: origin
  };
}

function responseText(response) {
  if (typeof response === 'string') return response;
  if (!response) return '';
  if (typeof response.data === 'string') return response.data;
  if (typeof response.body === 'string') return response.body;
  return String(response.data || response.body || '');
}

async function browserHTML(ctx, url, referer, forceVisible) {
  if (!boolParam(ctx, 'enableBrowserFallback', true)) return '';
  if (typeof Widget === 'undefined' || !Widget.browser || typeof Widget.browser.fetch !== 'function') return '';
  try {
    const timeout = numberParam(ctx, 'requestTimeoutSeconds', 45);
    const result = await Widget.browser.fetch(url, {
      visible: forceVisible === true ? true : boolParam(ctx, 'browserVisible', false),
      timeout: timeout,
      timeoutSeconds: timeout,
      waitAfterLoad: 4,
      waitForAny: true,
      waitForMediaSource: true,
      headers: {
        'User-Agent': MISSAV_UA,
        Referer: referer || url
      }
    });
    return responseText(result.html ? { data: result.html } : result);
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
      waitForMediaSource: true,
      waitForAny: true,
      headers: {
        'User-Agent': MISSAV_UA,
        Referer: referer || url
      }
    });
    return firstNonEmpty(
      playableFromBrowserResult(result),
      extractPlayableURL(responseText(result)),
      extractPlayableURL(result && result.html)
    );
  } catch (error) {
    return '';
  }
}

function candidateURLs(ctx, url) {
  const input = stringValue(url);
  const urls = [input];
  const origin = originOf(input);
  const path = input.replace(/^https?:\/\/[^/]+/i, '');
  backupBaseURLs(ctx).forEach(function (base) {
    const root = base.replace(/\/+$/, '');
    if (!root || root === origin) return;
    const next = root + (path[0] === '/' ? path : '/' + path);
    if (urls.indexOf(next) < 0) urls.push(next);
  });
  return urls.filter(Boolean);
}

function backupBaseURLs(ctx) {
  const raw = stringValue(contextValue(ctx, 'backupBaseURLs') || contextValue(ctx, 'backupBaseUrls') || contextValue(ctx, 'backup_base_urls'));
  return raw.split(/[\n,，\s]+/).map(function (value) {
    return value.replace(/\/+$/, '');
  }).filter(function (value) {
    return /^https?:\/\//i.test(value);
  });
}

function cacheKey(url) {
  return 'missav:html:' + String(url || '');
}

function memoryCache() {
  if (typeof globalThis === 'undefined') return {};
  if (!globalThis.__MISSAV_HTML_CACHE__) globalThis.__MISSAV_HTML_CACHE__ = {};
  return globalThis.__MISSAV_HTML_CACHE__;
}

function getCachedText(ctx, url) {
  const ttl = numberParam(ctx, 'cacheMinutes', 20) * 60 * 1000;
  if (ttl <= 0) return '';
  const key = cacheKey(url);
  const now = Date.now();
  const memory = memoryCache()[key];
  if (memory && memory.expiresAt > now && memory.text) return memory.text;
  const stored = cacheGet(key);
  if (stored && stored.expiresAt > now && stored.text) return stored.text;
  return '';
}

function setCachedText(ctx, url, text) {
  if (!isUsableHTML(text)) return;
  const ttl = numberParam(ctx, 'cacheMinutes', 20) * 60 * 1000;
  if (ttl <= 0) return;
  const value = { text: text, expiresAt: Date.now() + ttl };
  const key = cacheKey(url);
  memoryCache()[key] = value;
  cacheSet(key, value);
}

function cacheGet(key) {
  try {
    if (typeof Widget !== 'undefined' && Widget.cache && typeof Widget.cache.get === 'function') return Widget.cache.get(key);
    if (typeof $cache !== 'undefined' && typeof $cache.get === 'function') return $cache.get(key);
  } catch (error) {
    return null;
  }
  return null;
}

function cacheSet(key, value) {
  try {
    if (typeof Widget !== 'undefined' && Widget.cache && typeof Widget.cache.set === 'function') Widget.cache.set(key, value);
    if (typeof $cache !== 'undefined' && typeof $cache.set === 'function') $cache.set(key, value);
  } catch (error) {
    // Cache is opportunistic; ignore unsupported host APIs.
  }
}

function isUsableHTML(html, status, headers) {
  const text = String(html || '');
  if (!text || text.length < 80) return false;
  if (Number(status) >= 400) return false;
  if (isCloudflare(text, status, headers)) return false;
  return /<html|<body|<a\b|<video\b|m3u8|mp4/i.test(text);
}

function boolParam(ctx, key, fallback) {
  const value = contextValue(ctx, key);
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return !/^(false|0|no|off|否|关闭)$/i.test(String(value).trim());
}

function numberParam(ctx, key, fallback) {
  const value = Number(contextValue(ctx, key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function playableFromBrowserResult(result) {
  if (!result) return '';
  const keys = ['url', 'mediaURL', 'mediaUrl', 'videoURL', 'videoUrl', 'playURL', 'playUrl', 'src'];
  for (let index = 0; index < keys.length; index += 1) {
    const value = result[keys[index]];
    if (isPlayableURL(value)) return value;
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

function parseHomeSections(ctx, html) {
  const titles = ['推荐给你', '新作上市', '最近更新', '无码影片', '随机'];
  const sections = [];
  for (let index = 0; index < titles.length; index += 1) {
    const title = titles[index];
    const block = sectionBlock(html, title);
    const items = parseCards(block, title, ctx).slice(0, 18);
    if (!items.length) continue;
    const predefined = findSection(title);
    sections.push({
      id: predefined ? predefined.id : 'missav-home-' + index,
      title: title,
      style: predefined ? predefined.style : sectionStyle(title),
      moreAction: predefined ? categoryAction(ctx, predefined) : undefined,
      items: items
    });
  }
  return sections;
}

function sectionShell(ctx, section) {
  return {
    id: section.id,
    title: section.title,
    style: section.style,
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
    items: [
      {
        id: id + '-error',
        title: '加载失败',
        subtitle: cleanText(error && error.message) || '请稍后重试',
        type: 'collection',
        action: { type: 'category', pageId: id, title: title }
      }
    ]
  };
}

function verificationCategory(ctx, id, title, url, error, page) {
  return {
    pageType: 'category',
    id: id,
    title: title || '需要验证',
    style: 'media.posterGrid',
    itemAspectRatio: '16:9',
    items: [verificationCard(ctx, '需要真人验证', url, error)],
    page: page || 1,
    hasMore: false
  };
}

function verificationSection(ctx, id, title, style, url, error) {
  return {
    id: id,
    title: title,
    style: style || 'discover.posterCompact',
    lazy: false,
    items: [verificationCard(ctx, '需要真人验证', url, error)]
  };
}

function verificationDetail(ctx, url, error) {
  const title = titleFromUrl(url) || '需要真人验证';
  return {
    pageType: 'detail',
    id: makeItemId(url, title, ''),
    title: title,
    type: 'movie',
    overview: cleanText(error && error.message) || '站点触发了 Cloudflare 真人验证。请返回列表页点击手动验证卡片，完成后刷新。',
    detailImageAspectRatio: '16:9',
    resourceGroups: playbackGroups(url, title, '', ctx),
    recommendations: [
      {
        id: 'verify',
        title: '访问受限',
        style: 'discover.posterCompact',
        items: [verificationCard(ctx, '手动完成验证', url, error)]
      }
    ]
  };
}

function verificationCard(ctx, title, url, error) {
  return {
    id: 'verify-cloudflare-' + encodeURIComponent(url || entryURL(ctx)).slice(0, 120),
    title: title || '手动完成验证',
    subtitle: '点击后再打开验证界面，完成后返回刷新',
    overview: cleanText(error && error.message) || '当前网络触发了 Cloudflare 真人验证。',
    type: 'collection',
    aspectRatio: '16:9',
    action: {
      type: 'custom',
      name: 'verifyCloudflare',
      id: 'verifyCloudflare',
      title: '手动完成验证',
      payload: { url: url || entryURL(ctx) }
    }
  };
}

function categoryAction(ctx, section) {
  return {
    type: 'category',
    id: section.id,
    pageId: section.id,
    title: section.title,
    url: categoryURL(ctx, section.path)
  };
}

function parseCategoryCards(ctx, html, fallbackTitle) {
  const source = categoryListBlock(html, fallbackTitle);
  const items = [];
  const seen = {};
  anchorsIn(source).forEach(function (anchor) {
    const href = anchor.href;
    const title = cleanText(anchor.text || anchor.title);
    if (!title || seen[href + title] || isJunkCategoryTitle(title)) return;
    if (!isCategoryHref(href)) return;
    const url = absoluteURL(ctx, href);
    seen[href + title] = true;
    items.push({
      id: 'category-link-' + items.length + '-' + encodeURIComponent(title),
      title: title,
      subtitle: fallbackTitle || '分类',
      type: 'category',
      aspectRatio: '16:9',
      action: {
        type: 'category',
        id: url,
        pageId: url,
        title: title,
        url: url,
        itemAspectRatio: '16:9'
      }
    });
  });
  return items.slice(0, 80);
}

function categoryListBlock(html, title) {
  const source = String(html || '');
  const heading = cleanText(title || '');
  const index = heading ? source.search(new RegExp('<h1[^>]*>\\s*' + escapeRegExp(heading), 'i')) : -1;
  if (index < 0) return source;
  const nextScript = source.indexOf('<script', index);
  const nextFooter = source.indexOf('<footer', index);
  const endCandidates = [nextScript, nextFooter].filter(function (value) { return value > index; }).sort(function (a, b) { return a - b; });
  return source.slice(index, endCandidates[0] || undefined);
}

function isCategoryHref(href) {
  const value = String(href || '');
  return /\/(?:dm\d+\/)?cn\/(?:actresses|genres|makers|labels|series)(?:\/|$)/i.test(value) ||
    /^https?:\/\/[^/]+\/(?:dm\d+\/)?cn\/(?:actresses|genres|makers|labels|series)(?:\/|$)/i.test(value);
}

function isJunkCategoryTitle(title) {
  const text = cleanText(title);
  return !text ||
    text === '更多' ||
    text === '显示更多' ||
    text === '返回' ||
    text === '登入' ||
    text === '注册' ||
    /条影片|部影片|影片$/i.test(text) ||
    /^\d+$/.test(text);
}

function parseCards(html, fallbackTitle, ctx) {
  const source = String(html || '');
  const blocks = mediaBlocks(source);
  const items = [];
  const seen = {};
  blocks.forEach(function (block) {
    const item = parseCard(block, fallbackTitle, items.length + 1, ctx);
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
    blocks.push(expandBlock(source, match.index, anchorPattern.lastIndex, match[0]));
  }
  return blocks;
}

function expandBlock(source, start, end, fallback) {
  const before = source.slice(Math.max(0, start - 1800), start);
  const containerStart = Math.max(
    before.lastIndexOf('<article'),
    before.lastIndexOf('<li'),
    before.lastIndexOf('<div')
  );
  const realStart = containerStart >= 0 ? start - before.length + containerStart : start;
  const nextDetail = source.slice(end).search(/<a\b[^>]*href\s*=\s*["'][^"']*\/(?:dm\d+\/)?cn\/(?!new|search|genres?|makers?|actresses?|actors?|today-hot|weekly-hot|monthly-hot|uncensored|chinese|fc2|siro|vr)[^"']+/i);
  const close = ['</article>', '</li>', '</div>']
    .map(function (tag) {
      const index = source.indexOf(tag, end);
      return index >= 0 ? index + tag.length : -1;
    })
    .filter(function (index) { return index > end; })
    .sort(function (a, b) { return a - b; })[0];
  const realEnd = close || (nextDetail >= 0 ? end + nextDetail : Math.min(source.length, end + 1800));
  const block = source.slice(realStart, realEnd);
  return isDetailHref(block) ? block : fallback;
}

function parseCard(block, fallbackTitle, rank, ctx) {
  const anchors = anchorsIn(block).filter(function (anchor) { return isDetailHref(anchor.href); });
  if (!anchors.length) return null;
  const mediaAnchors = anchors.filter(function (anchor) {
    return !isJunkCardText(anchor.text) && !isJunkCardText(anchor.title);
  });
  const primaryAnchor = mediaAnchors[0] || anchors[0];
  const href = primaryAnchor.href;
  const detailURL = absoluteURL(ctx, href);
  const title = cleanText(firstNonEmpty(
    mediaAnchors.map(function (anchor) { return anchor.title; }).sort(longestFirst)[0],
    mediaAnchors.map(function (anchor) { return anchor.text; }).sort(longestFirst)[0],
    attr(block, 'title'),
    attr(block, 'alt'),
    fallbackTitle
  ));
  if (!title || /^miss\s*av$/i.test(title) || isJunkCardText(title)) return null;
  const image = absoluteURL(ctx, pickImage(block));
  if (!image) return null;
  const duration = firstNonEmpty(
    firstMatch(block, /(\d{1,2}:\d{2}:\d{2})/),
    firstMatch(block, /(\d{1,3}:\d{2})/)
  );
  const badges = [];
  if (/中文字幕|chinese-subtitle/i.test(block + ' ' + href)) badges.push('中文字幕');
  if (/无码|uncensored/i.test(block + ' ' + href)) badges.push('无码');

  return {
    id: makeItemId(detailURL, title, image),
    title: title,
    name: title,
    type: 'movie',
    poster: image,
    backdrop: image,
    thumbnailURL: image,
    posterPath: image,
    backdropPath: image,
    imageHeaders: imageHeaders(ctx || { baseURL: originOf(detailURL), entryPath: pathOf(detailURL) }, detailURL),
    subtitle: duration || fallbackTitle || '',
    remarks: duration,
    runtimeMinutes: runtimeMinutes(duration),
    rank: rank,
    badges: badges,
    aspectRatio: '16:9',
    providerIds: {
      missav: extractCode(title) || titleFromUrl(detailURL),
      source: WidgetMetadata.id
    },
    action: { type: 'detail', id: makeItemId(detailURL, title, image), itemId: makeItemId(detailURL, title, image), url: detailURL }
  };
}

function isJunkCardText(value) {
  const text = cleanText(value);
  return !text ||
    text === '更多' ||
    text === '载入更多' ||
    text === '訂閱' ||
    text === '订阅' ||
    text === '好手气' ||
    /^[:：]+$/.test(text) ||
    /^\d{1,3}:\d{2}(?::\d{2})?$/.test(text) ||
    /^(中文字幕|英文字幕|无码影片)$/i.test(text);
}

function toWideItem(item) {
  item.aspectRatio = '16:9';
  item.backdrop = item.backdrop || item.poster;
  return item;
}

function playbackGroups(detailURL, title, playUrl, ctx) {
  const id = encodePayload({ url: detailURL, title: title, playUrl: playUrl || '' });
  const headers = playbackHeaders(ctx || {}, detailURL);
  return [
    {
      id: 'missav-online',
      title: '在线播放',
      versions: [
        {
          id: id,
          title: 'MissAV HLS',
          name: '默认线路',
          subtitle: 'MissAV',
          url: playUrl || detailURL,
          playUrl: playUrl || '',
          path: playUrl || detailURL,
          default: true,
          availability: 'playable',
          container: 'm3u8',
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
        }
      ]
    }
  ];
}

function playbackResult(ctx, url, referer) {
  const link = absoluteURL(ctx, url);
  const container = containerOf(link);
  const headers = playbackHeaders(ctx || {}, referer);
  return {
    url: link,
    videoUrl: link,
    playUrl: link,
    path: link,
    type: container === 'm3u8' ? 'hls' : container,
    protocol: container === 'm3u8' ? 'hls' : '',
    mimeType: container === 'm3u8' ? 'application/vnd.apple.mpegurl' : '',
    playerType: 'ijk',
    container: container,
    headers: headers,
    header: headers,
    Header: headers,
    customHeaders: headers,
    subtitles: [],
    danmaku: null,
    startPosition: 0,
    startPositionSeconds: 0,
    isLive: false,
    streamKind: container === 'm3u8' ? 'hls' : 'file'
  };
}

function extractPlayableURL(html) {
  const source = decodeEscapes(String(html || '') + '\n' + unpackPackedScripts(html).join('\n'));
  return firstPlayable(
    firstMatch(source, /source1280\s*=\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
    firstMatch(source, /source842\s*=\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
    firstMatch(source, /source\s*=\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
    firstMatch(source, /var\s+hlsUrl\s*=\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
    firstMatch(source, /<video\b[^>]*\b(?:data-src|src)\s*=\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
    firstMatch(source, /source\s+src\s*=\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
    firstMatch(source, /(?:hlsUrl|videoUrl|video_url|videoSrc|m3u8|url|src)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
    firstMatch(source, /file\s*:\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
    firstMatch(source, /\\?["'](https?:\\?\/\\?\/[^"']+\.(?:m3u8|mp4|mpd)[^"']*)\\?["']/i),
    firstMatch(source, /["'](https?:\/\/[^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
    firstMatch(source, /(https?:\\\/\\\/[^"']+\.(?:m3u8|mp4|mpd)[^"']*)/i)
  );
}

function unpackPackedScripts(html) {
  const source = String(html || '');
  const unpacked = [];
  const pattern = /eval\(function\(p,a,c,k,e,d\)[\s\S]*?\(\s*'((?:\\'|[^'])*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'((?:\\'|[^'])*)'\.split\('\|'\)/g;
  let match;
  while ((match = pattern.exec(source))) {
    const payload = decodePackedString(match[1]);
    const radix = Number(match[2]);
    const count = Number(match[3]);
    const words = decodePackedString(match[4]).split('|');
    if (!payload || !radix || !count || !words.length) continue;
    unpacked.push(unpackDeanEdwards(payload, radix, count, words));
  }
  return unpacked;
}

function unpackDeanEdwards(payload, radix, count, words) {
  let output = String(payload || '');
  for (let index = count - 1; index >= 0; index -= 1) {
    const key = baseEncode(index, radix);
    const value = words[index] || key;
    if (!value) continue;
    output = output.replace(new RegExp('\\b' + escapeRegExp(key) + '\\b', 'g'), value);
  }
  return decodeEscapes(output);
}

function baseEncode(number, radix) {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const base = Math.min(Math.max(Number(radix) || 36, 2), alphabet.length);
  let value = Number(number) || 0;
  if (value === 0) return '0';
  let output = '';
  while (value > 0) {
    output = alphabet[value % base] + output;
    value = Math.floor(value / base);
  }
  return output;
}

function decodePackedString(value) {
  return String(value || '')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function detailUrlFromContext(ctx) {
  const payload = decodePayload(ctx && (ctx.versionId || ctx.sourceId || ctx.id || ctx.itemId));
  return firstNonEmpty(
    payload && payload.url,
    ctx && ctx.url,
    ctx && ctx.link,
    ctx && ctx.playUrl,
    detailUrlFromItemId(ctx && ctx.itemId),
    detailUrlFromItemId(ctx && ctx.id)
  );
}

function playUrlFromContext(ctx) {
  const payload = decodePayload(ctx && (ctx.versionId || ctx.sourceId || ctx.id || ctx.itemId));
  return firstNonEmpty(
    payload && payload.playUrl,
    ctx && ctx.playUrl,
    ctx && ctx.videoUrl
  );
}

function makeItemId(url, title, poster) {
  return encodePayload({ url: absoluteURL(null, url), title: title || '', poster: poster || '' });
}

function detailUrlFromItemId(value) {
  const payload = decodePayload(value);
  if (payload && payload.url) return payload.url;
  const text = stringValue(value);
  if (/^https?:\/\//i.test(text)) return text;
  return '';
}

function encodePayload(data) {
  const parts = [];
  Object.keys(data || {}).forEach(function (key) {
    const value = data[key];
    if (value == null || value === '') return;
    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
  });
  return MISSAV_DETAIL_PAYLOAD_PREFIX + parts.join('&');
}

function decodePayload(value) {
  const text = stringValue(value);
  if (text.indexOf(MISSAV_DETAIL_PAYLOAD_PREFIX) !== 0) return null;
  const result = {};
  text.slice(MISSAV_DETAIL_PAYLOAD_PREFIX.length).split('&').forEach(function (part) {
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

function normalizePageId(ctx, value) {
  const id = stringValue(value) || 'new-release';
  const section = findSection(id);
  if (section) return section.id;
  const primary = findPrimaryCategory(id);
  if (primary) return primary.id;
  if (/^https?:\/\//i.test(id)) return pathOf(id);
  if (id[0] === '/') return id;
  return '/' + id;
}

function findSection(id) {
  const value = stringValue(id);
  return MISSAV_SECTIONS.find(function (item) {
    return item.id === value ||
      item.title === value ||
      (Array.isArray(item.aliases) && item.aliases.indexOf(value) >= 0) ||
      item.path === value ||
      item.path.replace(/^\//, '') === value ||
      categorySlug(item.path) === categorySlug(value);
  });
}

function findPrimaryCategory(id) {
  const value = stringValue(id);
  return MISSAV_PRIMARY_CATEGORIES.find(function (item) {
    return item.id === value ||
      item.title === value ||
      item.path === value ||
      item.path.replace(/^\//, '') === value ||
      categorySlug(item.path) === categorySlug(value);
  });
}

function isDetailHref(href) {
  const value = String(href || '');
  return /\/(?:dm\d+\/)?cn\/(?!new(?:[/?#]|$)|search(?:[/?#]|$)|genres?(?:[/?#]|$)|makers?(?:[/?#]|$)|actresses?(?:[/?#]|$)|actors?(?:[/?#]|$)|today-hot|weekly-hot|monthly-hot|uncensored-leak|chinese-subtitle|fc2(?:[/?#]|$)|heyzo(?:[/?#]|$)|tokyo-hot(?:[/?#]|$)|1pondo(?:[/?#]|$)|caribbeancom(?:[/?#]|$)|caribbeancompr(?:[/?#]|$)|10musume(?:[/?#]|$)|pacopacomama(?:[/?#]|$)|gachinco(?:[/?#]|$)|xxx-av(?:[/?#]|$)|siro(?:[/?#]|$)|luxu(?:[/?#]|$)|gana(?:[/?#]|$)|prestige-premium(?:[/?#]|$)|s-cute(?:[/?#]|$)|ara(?:[/?#]|$)|madou(?:[/?#]|$)|twav(?:[/?#]|$)|vr(?:[/?#]|$)|history|playlist|favorite|login|register)[^"'#?\/]+/i.test(value);
}

function categorySlug(value) {
  const parts = String(value || '').split('?')[0].split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

function hasNextPage(html, page) {
  const source = cleanText(html);
  if (new RegExp('>' + (page + 1) + '<').test(html || '')) return true;
  if (/下一页|Next/i.test(source)) return true;
  const total = Number(firstMatch(source, /\/\s*(\d{2,})\s*(?:使用键盘|返回|$)/i));
  return total ? page < total : false;
}

function sectionBlock(html, title) {
  const source = String(html || '');
  const index = source.search(new RegExp('<h[12][^>]*>\\s*' + escapeRegExp(title), 'i'));
  if (index < 0) return source;
  const next = source.slice(index + 10).search(/<h[12][^>]*>/i);
  return source.slice(index, next >= 0 ? index + 10 + next : undefined);
}

function sectionStyle(title) {
  if (/热门|排行/i.test(title || '')) return 'discover.ranked';
  if (/推荐|新作/i.test(title || '')) return 'discover.spotlight';
  return 'discover.posterCompact';
}

function pageTitle(html) {
  return cleanText(firstNonEmpty(firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i), firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)));
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

function metaContents(html, key, value) {
  const values = [];
  const pattern = /<meta\b[^>]*>/gi;
  let match;
  while ((match = pattern.exec(String(html || '')))) {
    const tag = match[0];
    if (attr(tag, key).toLowerCase() === String(value || '').toLowerCase()) values.push(attr(tag, 'content'));
  }
  return unique(values);
}

function labeledValue(html, labels) {
  const text = cleanText(html);
  for (let index = 0; index < labels.length; index += 1) {
    const label = labels[index];
    const match = new RegExp(label + '\\s*[:：]\\s*([^\\n]+?)(?:\\s{2,}|$)').exec(text);
    if (match) return match[1];
  }
  return '';
}

function extractPeople(html, hrefPattern) {
  return unique(extractPeopleLinks(html, hrefPattern).map(function (person) { return person.name; })).slice(0, 24);
}

function extractPeopleLinks(html, hrefPattern) {
  const people = [];
  anchorsIn(html).forEach(function (anchor) {
    hrefPattern.lastIndex = 0;
    if (hrefPattern.test(anchor.href) && anchor.text) people.push({ name: anchor.text, url: anchor.href });
  });
  const seen = {};
  return people.filter(function (person) {
    const key = person.name + '|' + person.url;
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  }).slice(0, 40);
}

function extractLabeledPeopleLinks(html, labels, hrefPattern) {
  const source = String(html || '');
  for (let index = 0; index < labels.length; index += 1) {
    const label = escapeRegExp(labels[index]);
    const pattern = new RegExp('<div[^>]*>\\s*<span>\\s*' + label + '\\s*[:：]\\s*<\\/span>([\\s\\S]*?)<\\/div>', 'i');
    const match = pattern.exec(source);
    if (match) {
      const links = extractPeopleLinks(match[1], hrefPattern);
      if (links.length) return links;
    }
  }
  return extractPeopleLinks(html, hrefPattern);
}

async function buildCast(actorLinks, html, ctx, referer) {
  const linked = [];
  const sourceActors = actorLinks || [];
  for (let index = 0; index < sourceActors.length; index += 1) {
    const actor = sourceActors[index];
    const url = absoluteURL(ctx, actor.url);
    const avatar = index < 12 ? await fetchActorAvatar(ctx, url) : '';
    const member = {
      name: actor.name,
      role: '演员',
      action: {
        type: 'category',
        pageId: url || actor.url,
        title: actor.name,
        itemAspectRatio: '16:9'
      }
    };
    if (avatar) {
      member.avatar = avatar;
      member.image = avatar;
      member.profilePath = avatar;
      member.avatarHeaders = imageHeaders(ctx, url || referer);
      member.avatarReferer = url || referer;
    }
    linked.push(member);
  }
  const names = {};
  linked.forEach(function (actor) { names[actor.name] = true; });
  metaContents(html, 'property', 'og:video:actor').forEach(function (name) {
    if (names[name]) return;
    names[name] = true;
    linked.push({ name: name, role: '演员' });
  });
  return linked.slice(0, 40);
}

async function fetchActorAvatar(ctx, url) {
  if (!url) return '';
  try {
    const response = await httpGet(url, {
      headers: requestHeaders(ctx, url),
      useBrowserCookie: true,
      attachBrowserCookie: true
    });
    const html = responseText(response);
    if (!html || isCloudflare(html, response && response.status, response && response.headers)) return '';
    const image = firstNonEmpty(
      metaContent(html, 'property', 'og:image'),
      metaContent(html, 'name', 'twitter:image'),
      pickImage(sectionBlock(html, '女优')),
      pickImage(html)
    );
    return absoluteURL(ctx, image);
  } catch (error) {
    return '';
  }
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

function detailImageInfo(html) {
  const candidates = [];
  const source = String(html || '');
  const metaWidth = Number(metaContent(source, 'property', 'og:image:width') || metaContent(source, 'name', 'twitter:image:width')) || 0;
  const metaHeight = Number(metaContent(source, 'property', 'og:image:height') || metaContent(source, 'name', 'twitter:image:height')) || 0;
  const pattern = /\b(?:poster|content|src|data-src|data-original|data-poster|data-cover|data-image|href)\s*=\s*(?:"([^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"|'([^']+\.(?:jpg|jpeg|png|webp)(?:\?[^']*)?)'|([^\s>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s>]*)?))/gi;
  let match;
  while ((match = pattern.exec(source))) {
    const url = match[1] || match[2] || match[3] || '';
    if (!isUsefulImage(url)) continue;
    const tagStart = source.lastIndexOf('<', match.index);
    const tagEnd = source.indexOf('>', match.index);
    const tag = tagStart >= 0 && tagEnd > tagStart ? source.slice(tagStart, tagEnd + 1) : '';
    const width = Number(attr(tag, 'width') || attr(tag, 'data-width')) || metaWidth;
    const height = Number(attr(tag, 'height') || attr(tag, 'data-height')) || metaHeight;
    candidates.push({
      url: url,
      width: width,
      height: height,
      score: imageScore(url, tag)
    });
  }
  candidates.sort(function (a, b) { return b.score - a.score; });
  const best = candidates[0];
  if (!best) return { url: '', aspectRatio: '16:9' };
  return {
    url: best.url,
    aspectRatio: best.width && best.height && best.height > best.width ? '2:3' : '16:9'
  };
}

function isUsefulImage(url) {
  return /\.(?:jpg|jpeg|png|webp)(?:[?#]|$)/i.test(String(url || '')) && !/logo|favicon|blank|loading|avatar|sprite|placeholder/i.test(url);
}

function imageScore(url, source) {
  let score = 0;
  if (/cover|poster|data-poster|data-cover|og:image|twitter:image/i.test(source || '')) score += 40;
  if (/cover|poster/i.test(url || '')) score += 20;
  if (/preview|thumbnail|thumb/i.test(url || '')) score += 8;
  if (/avatar|logo|favicon|blank|loading|placeholder/i.test(url || '')) score -= 100;
  return score;
}

function attr(block, name) {
  const pattern = new RegExp(name + '\\s*=\\s*(?:"([^"]*)"|\\\'([^\\\']*)\\\'|([^\\s>]+))', 'i');
  const match = pattern.exec(String(block || ''));
  return match ? decodeEntities(match[1] || match[2] || match[3] || '') : '';
}

function absoluteURL(ctx, url) {
  const value = decodeEntities(String(url || '').trim());
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.indexOf('//') === 0) return 'https:' + value;
  const root = ctx ? baseURL(ctx) : MISSAV_DEFAULT_BASE;
  if (value[0] === '/') return root.replace(/\/+$/, '') + value;
  return root.replace(/\/+$/, '') + '/' + value;
}

function originOf(url) {
  const match = String(url || '').match(/^(https?:\/\/[^/]+)/i);
  return match ? match[1] : MISSAV_DEFAULT_BASE;
}

function pathOf(url) {
  const match = String(url || '').match(/^https?:\/\/[^/]+(\/[^?#]*)/i);
  return match ? match[1] : MISSAV_DEFAULT_ENTRY;
}

function titleFromUrl(url) {
  const path = pathOf(url);
  const parts = path.split('/').filter(Boolean);
  try {
    return decodeURIComponent(parts[parts.length - 1] || 'MissAV').replace(/[-_]+/g, ' ').toUpperCase();
  } catch (error) {
    return (parts[parts.length - 1] || 'MissAV').replace(/[-_]+/g, ' ').toUpperCase();
  }
}

function extractCode(value) {
  const match = String(value || '').toUpperCase().match(/\b([A-Z]{2,8})[-_\s]?(\d{2,7})\b|FC2[-_\s]*(?:PPV[-_\s]*)?(\d{5,8})/);
  if (!match) return '';
  if (match[3]) return 'FC2-PPV-' + match[3];
  return match[1] + '-' + match[2];
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
  const ext = match[1].toLowerCase();
  return ext === 'm3u8' ? 'm3u8' : ext;
}

function isPlayableURL(url) {
  return /^https?:\/\//i.test(String(url || '')) && /\.(?:m3u8|mpd|mp4|m4v|mov|webm|mkv|ts)(?:[?#]|$)/i.test(String(url || ''));
}

function isDetailPageURL(url) {
  return /^https?:\/\/[^/]+\/(?:dm\d+\/)?(?:cn\/)?[^/?#]+$/i.test(String(url || '')) && !isPlayableURL(url);
}

function isCloudflare(html, status, headers) {
  const text = String(html || '') + ' ' + JSON.stringify(headers || {});
  return Number(status) === 403 ||
    Number(status) === 429 ||
    Number(status) === 503 ||
    /<title>\s*Just a moment/i.test(text) ||
    /Checking your browser|Verifying you are human|Verify you are human|Ray ID/i.test(text) ||
    /Enable JavaScript and cookies to continue/i.test(text) ||
    /cf-mitigated|cf-browser-verification|cf-chl-|challenge-platform|turnstile/i.test(text);
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

function stripTags(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

function cleanText(value) {
  return decodeEntities(stripTags(value)).replace(/\s+/g, ' ').trim();
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

function firstPlayable() {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = normalizePlayableURL(arguments[index]);
    if (value) return value;
  }
  return '';
}

function normalizePlayableURL(value) {
  const text = decodeEscapes(stringValue(value)).replace(/\\\//g, '/').replace(/\\/g, '');
  if (!/^https?:\/\//i.test(text) && text.indexOf('//') !== 0) return '';
  if (!/\.(?:m3u8|mp4|mpd)(?:[?#]|$)/i.test(text)) return '';
  return text.indexOf('//') === 0 ? 'https:' + text : text;
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

function longestFirst(a, b) {
  return String(b || '').length - String(a || '').length;
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const MissAVMiniLibrary = {
  metadata: WidgetMetadata,
  getManifest: getManifest,
  getHome: getHome,
  getHomeSection: getHomeSection,
  getCategory: getCategory,
  getDetail: getDetail,
  getResourceVersions: getResourceVersions,
  resolvePlayback: resolvePlayback,
  getPlayback: getPlayback,
  play: play,
  search: search,
  onSearch: onSearch,
  getSearch: getSearch,
  onAction: onAction,
  matchResources: matchResources,
  matchMovie: matchResources
};

function __jsEvalReturn() {
  return MissAVMiniLibrary;
}

if (typeof globalThis !== 'undefined') {
  globalThis.WidgetMetadata = WidgetMetadata;
  globalThis.MissAVMiniLibrary = MissAVMiniLibrary;
  globalThis.getManifest = getManifest;
  globalThis.getHome = getHome;
  globalThis.getHomeSection = getHomeSection;
  globalThis.getCategory = getCategory;
  globalThis.getDetail = getDetail;
  globalThis.getResourceVersions = getResourceVersions;
  globalThis.resolvePlayback = resolvePlayback;
  globalThis.getPlayback = getPlayback;
  globalThis.play = play;
  globalThis.search = search;
  globalThis.onSearch = onSearch;
  globalThis.getSearch = getSearch;
  globalThis.onAction = onAction;
  globalThis.matchResources = matchResources;
  globalThis.matchMovie = matchResources;
  globalThis.__jsEvalReturn = __jsEvalReturn;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MissAVMiniLibrary;
}
