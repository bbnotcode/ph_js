// @name MissAV Mini Library

const MISSAV_DEFAULT_BASE = 'https://missav.ws';
const MISSAV_DEFAULT_ENTRY = '/dm247/cn';
const MISSAV_LOGO = 'https://missav.ws/favicon.ico';
const MISSAV_DETAIL_PAYLOAD_PREFIX = 'missav://detail?';
const MISSAV_VERIFY_PAYLOAD_PREFIX = 'missav://verify?';
const MISSAV_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const WidgetMetadata = {
  id: 'missav-mini-library',
  name: 'MissAV',
  title: 'MissAV',
  version: '1.5.9',
  author: 'Alan huang',
  logo: MISSAV_LOGO,
  icon: MISSAV_LOGO,
  site: MISSAV_DEFAULT_BASE,
  description: 'MissAV 自定义媒体库，支持首页、分类、搜索、详情和播放解析。'
};

const MISSAV_SECTIONS = [
  { id: 'recommended', title: '推荐给你', path: '/', style: 'discover.spotlight', group: 'japanese', personalizedHome: true, randomCategory: true },
  { id: 'nakadashi', title: '中出', path: '/cn/search/%E4%B8%AD%E5%87%BA', style: 'discover.posterCompact', group: 'japanese', eagerPagination: true },
  { id: 'big-breasts', title: '巨乳', path: '/cn/search/%E5%B7%A8%E4%B9%B3', style: 'discover.posterCompact', group: 'japanese', eagerPagination: true },
  { id: 'married-women', title: '人妻', path: '/cn/search/%E4%BA%BA%E5%A6%BB', style: 'discover.posterCompact', group: 'japanese', eagerPagination: true },
  { id: 'chinese-subtitle', title: '中文字幕', path: '/dm278/cn/chinese-subtitle', style: 'discover.posterCompact', group: 'japanese' },
  { id: 'latest', title: '最近更新', path: '/dm539/cn/new', style: 'discover.ranked', group: 'japanese', eagerPagination: true },
  { id: 'new-release', title: '新作上市', path: '/dm635/cn/release', style: 'discover.spotlight', group: 'japanese', eagerPagination: true },
  { id: 'random', title: '随机', aliases: ['好手气'], path: '/random', style: 'discover.posterCompact', group: 'japanese', randomCategory: true },
  { id: 'uncensored-leak', title: '无码流出', aliases: ['无码影片'], path: '/dm817/cn/uncensored-leak', style: 'discover.posterCompact', group: 'uncensored' },
  { id: 'actresses', title: '女优一览', path: '/cn/actresses', style: 'discover.posterCompact', group: 'japanese', categoryIndex: true },
  { id: 'actress-ranking', title: '女优排行', path: '/cn/actresses/ranking', style: 'discover.ranked', group: 'japanese', categoryIndex: true },
  { id: 'genres', title: '类型', path: '/cn/genres', style: 'discover.posterCompact', group: 'japanese', categoryIndex: true },
  { id: 'makers', title: '发行商', path: '/cn/makers', style: 'discover.posterCompact', group: 'japanese', categoryIndex: true },
  { id: 'vr', title: 'VR', path: '/cn/genres/VR', style: 'discover.posterCompact', group: 'japanese' },
  { id: 'today-hot', title: '今日热门', path: '/dm301/cn/today-hot', style: 'discover.ranked', group: 'japanese', eagerPagination: true },
  { id: 'weekly-hot', title: '本周热门', aliases: ['本週热门'], path: '/dm170/cn/weekly-hot', style: 'discover.ranked', group: 'japanese', eagerPagination: true },
  { id: 'monthly-hot', title: '本月热门', path: '/dm273/cn/monthly-hot', style: 'discover.ranked', group: 'japanese', eagerPagination: true },

  { id: 'siro', title: 'SIRO', path: '/dm36/cn/siro', style: 'discover.posterCompact', group: 'amateur' },
  { id: 'luxu', title: 'LUXU', path: '/dm34/cn/luxu', style: 'discover.posterCompact', group: 'amateur' },
  { id: 'gana', title: 'GANA', path: '/dm34/cn/gana', style: 'discover.posterCompact', group: 'amateur' },
  { id: 'prestige-premium', title: 'PRESTIGE PREMIUM', aliases: ['MAAN'], path: '/dm1004/cn/maan', style: 'discover.posterCompact', group: 'amateur' },
  { id: 's-cute', title: 'S-CUTE', aliases: ['SCUTE'], path: '/dm38/cn/scute', style: 'discover.posterCompact', group: 'amateur' },
  { id: 'ara', title: 'ARA', path: '/dm34/cn/ara', style: 'discover.posterCompact', group: 'amateur' },

  { id: 'fc2', title: 'FC2', path: '/dm597/cn/fc2', style: 'discover.posterCompact', group: 'uncensored' },
  { id: 'heyzo', title: 'HEYZO', path: '/dm2208642/cn/heyzo', style: 'discover.posterCompact', group: 'uncensored' },
  { id: 'tokyo-hot', title: '东京热', aliases: ['TOKYOHOT'], path: '/dm42/cn/tokyohot', style: 'discover.posterCompact', group: 'uncensored' },
  { id: '1pondo', title: '一本道', path: '/dm5199603/cn/1pondo', style: 'discover.posterCompact', group: 'uncensored', artworkCodePrefixes: ['pondo-'], detailSlugPattern: '^pondo-\\d{6}_\\d{3}$' },
  { id: 'caribbeancom', title: 'Caribbeancom', path: '/dm7704788/cn/caribbeancom', style: 'discover.posterCompact', group: 'uncensored' },
  { id: 'caribbeancompr', title: 'Caribbeancompr', path: '/dm91887/cn/caribbeancompr', style: 'discover.posterCompact', group: 'uncensored', detailSlugPattern: '^\\d{6}_\\d{3}$' },
  { id: '10musume', title: '10musume', path: '/dm7208981/cn/10musume', style: 'discover.posterCompact', group: 'uncensored', artworkCodePrefixes: ['musume-'], detailSlugPattern: '^musume-\\d{6}_\\d{2}$' },
  { id: 'pacopacomama', title: 'pacopacomama', path: '/dm3600557/cn/pacopacomama', style: 'discover.posterCompact', group: 'uncensored', artworkCodePrefixes: ['pacopacomama-'], detailSlugPattern: '^pacopacomama-\\d{6}_\\d{3}$' },
  { id: 'gachinco', title: 'Gachinco', path: '/dm150/cn/gachinco', style: 'discover.posterCompact', group: 'uncensored', artworkCodePrefixes: ['gachi'] },
  { id: 'xxx-av', title: 'XXX-AV', aliases: ['XXXAV'], path: '/dm42/cn/xxxav', style: 'discover.posterCompact', group: 'uncensored' },
  { id: 'marriedslash', title: '人妻斩', path: '/dm37/cn/marriedslash', style: 'discover.posterCompact', group: 'uncensored', artworkCodePrefixes: ['c0930-'] },
  { id: 'naughty4610', title: '顽皮 4610', path: '/dm33/cn/naughty4610', style: 'discover.posterCompact', group: 'uncensored', artworkCodePrefixes: ['h4610-'] },
  { id: 'naughty0930', title: '顽皮 0930', path: '/dm37/cn/naughty0930', style: 'discover.posterCompact', group: 'uncensored', artworkCodePrefixes: ['h0930-'] },

  { id: 'madou', title: '麻豆传媒', path: '/dm63/cn/madou', style: 'discover.posterCompact', group: 'asian' },
  { id: 'twav', title: 'TWAV', path: '/dm31/cn/twav', style: 'discover.posterCompact', group: 'asian' },
  { id: 'furuke', title: 'Furuke', path: '/dm15/cn/furuke', style: 'discover.posterCompact', group: 'asian' },
  { id: 'klive', title: '韩国直播', path: '/cn/klive', style: 'discover.posterCompact', group: 'asian' },
  { id: 'clive', title: '中国直播', path: '/cn/clive', style: 'discover.posterCompact', group: 'asian' }
];

const MISSAV_CATEGORY_GROUPS = [
  { id: 'japanese', title: '日本 AV / 综合分类' },
  { id: 'amateur', title: '素人' },
  { id: 'uncensored', title: '无码影片' },
  { id: 'asian', title: '亚洲 AV' }
];

const MISSAV_HOME_MEDIA_SECTION_IDS = [
  'recommended',
  'nakadashi',
  'big-breasts',
  'married-women',
  'new-release',
  'latest',
  'chinese-subtitle',
  'uncensored-leak',
  'random',
  'today-hot',
  'weekly-hot',
  'monthly-hot'
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
        title: '旧版显示窗口开关',
        type: 'boolean',
        defaultValue: false,
        required: false,
        description: '为兼容旧设置保留。自动请求始终隐藏；需要验证时请点击“手动完成验证”卡片。'
      },
      {
        name: 'automaticBrowserFallback',
        title: '自动静默浏览器兜底',
        type: 'boolean',
        defaultValue: true,
        required: false,
        description: '普通 HTTP 命中 Cloudflare 时静默尝试一次；关闭后只显示手动验证卡片。'
      },
      {
        name: 'verificationCooldownMinutes',
        title: '验证重试间隔分钟',
        type: 'number',
        defaultValue: 10,
        required: false,
        description: '静默验证失败后暂停自动重试，避免浏览时连续触发 Cloudflare。'
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
      },
      {
        name: 'categoryRestoreMinutes',
        title: '分类浏览进度保留分钟',
        type: 'number',
        defaultValue: 60,
        required: false,
        description: '从影片详情返回分类时，恢复已经加载的分页项目，避免列表退回并卡在 12 项。'
      }
    ]
  };
}

async function getHome(ctx) {
  ctx = normalizeContext(ctx);
  const html = await safeFetch(ctx, entryURL(ctx), baseURL(ctx) + '/');
  const hero = parseCards(sectionBlock(html, '推荐给你'), '推荐给你', ctx).slice(0, 10).map(toWideItem);
  const mediaSections = homeMediaSections(ctx, parseHomeSections(ctx, html));
  const artwork = categoryArtworkFromSections(ctx, mediaSections);
  const sections = categoryGroupSections(ctx, artwork).concat(mediaSections);

  return {
    pageType: 'home',
    id: 'missav-home',
    title: 'MissAV',
    heroAspectRatio: '16:9',
    hero: hero,
    sections: sections
  };
}

function homeMediaSections(ctx, parsedSections) {
  const sections = [];
  const seen = {};
  (parsedSections || []).forEach(function (section) {
    if (!section || !section.id || seen[section.id]) return;
    seen[section.id] = true;
    sections.push(section);
  });
  MISSAV_SECTIONS.filter(function (section) {
    return MISSAV_HOME_MEDIA_SECTION_IDS.indexOf(section.id) >= 0;
  }).forEach(function (section) {
    if (seen[section.id]) return;
    seen[section.id] = true;
    sections.push(sectionShell(ctx, section));
  });
  return sections;
}

function categoryGroupSections(ctx, artwork) {
  const sections = [];
  MISSAV_CATEGORY_GROUPS.forEach(function (group) {
    const categories = MISSAV_SECTIONS.filter(function (category) {
      return category.group === group.id;
    });
    for (let offset = 0; offset < categories.length; offset += 6) {
      const part = Math.floor(offset / 6);
      const groupSectionId = 'missav-categories-' + group.id + (part ? '-' + (part + 1) : '');
      const groupCategories = categories.slice(offset, offset + 6);
      const hasCompleteArtwork = groupCategories.every(function (category) {
        return categoryPreviewItems(
          artwork && artwork[category.id] && artwork[category.id].length
            ? artwork[category.id]
            : cachedCategoryArtwork(ctx, category.id),
          category
        ).length >= 3;
      });
      sections.push({
        id: groupSectionId,
        title: group.title + (part ? '（续 ' + part + '）' : ''),
        style: 'discover.annualWidePreview',
        lazy: !hasCompleteArtwork,
        loadAction: !hasCompleteArtwork
          ? { type: 'custom', id: groupSectionId, sectionId: groupSectionId, title: group.title }
          : undefined,
        items: hasCompleteArtwork
          ? groupCategories.map(function (category) {
              return categoryCard(ctx, category, artwork && artwork[category.id]);
            })
          : []
      });
    }
  });
  return sections;
}

function categoryCard(ctx, category, livePreviewItems) {
  const cachedPreviewItems = cachedCategoryArtwork(ctx, category.id);
  const previewItems = categoryPreviewItems(
    livePreviewItems && livePreviewItems.length
      ? livePreviewItems
      : cachedPreviewItems,
    category
  );
  const cover = previewItems[0] && firstNonEmpty(
    previewItems[0].backdrop,
    previewItems[0].poster,
    previewItems[0].thumbnailURL
  );
  const item = {
    id: 'category-' + category.id,
    title: category.title,
    subtitle: category.subtitle || '浏览' + category.title + '相关内容',
    type: 'category',
    aspectRatio: '16:9',
    previewItems: previewItems,
    action: {
      type: 'category',
      id: category.id,
      pageId: category.id,
      title: category.title,
      url: categoryURL(ctx, category.path),
      itemAspectRatio: '16:9'
    }
  };
  if (cover) {
    item.poster = cover;
    item.backdrop = cover;
    item.thumbnailURL = cover;
    item.posterPath = cover;
    item.backdropPath = cover;
    item.image = cover;
    item.imageURL = cover;
    item.posterURL = cover;
    item.backdropURL = cover;
    item.cover = cover;
    item.coverURL = cover;
    item.imageFit = 'fill';
    item.imageHeaders = imageHeaders(ctx, categoryURL(ctx, category.path));
    item.posterHeaders = item.imageHeaders;
    item.backdropHeaders = item.imageHeaders;
  }
  return item;
}

function categoryArtworkFromSections(ctx, sections) {
  const artwork = {};
  (sections || []).forEach(function (section) {
    if (!section || !section.id || !section.items || !section.items.length) return;
    const previews = categoryPreviewItems(section.items, findSection(section.id));
    if (!previews.length) return;
    artwork[section.id] = previews;
    rememberCategoryArtwork(ctx, section.id, previews);
  });
  return artwork;
}

function categoryPreviewItems(items, category) {
  const prefixes = category && Array.isArray(category.artworkCodePrefixes)
    ? category.artworkCodePrefixes.map(function (value) {
        return String(value || '').toLowerCase();
      }).filter(Boolean)
    : [];
  return (items || []).filter(function (item) {
    if (!item || !firstNonEmpty(item.backdrop, item.poster, item.thumbnailURL)) return false;
    if (!prefixes.length && !(category && category.detailSlugPattern)) return true;
    if (!categoryMatchesItem(item, category)) return false;
    if (!prefixes.length) return true;
    const target = stringValue(item.action && (item.action.url || item.action.itemId || item.action.id)).toLowerCase();
    const title = stringValue(item.title).toLowerCase();
    return prefixes.some(function (prefix) {
      return target.indexOf('/' + prefix) >= 0 || title.indexOf(prefix) >= 0;
    });
  }).slice(0, 3).map(function (item, index) {
    const image = firstNonEmpty(item.backdrop, item.poster, item.thumbnailURL);
    return {
      id: item.id,
      title: item.title,
      type: item.type || 'movie',
      rank: index + 1,
      poster: image,
      backdrop: image,
      thumbnailURL: image,
      aspectRatio: '16:9',
      action: item.action
    };
  });
}

function categoryMatchesItem(item, category) {
  if (!category || !category.detailSlugPattern) return true;
  const target = stringValue(item && item.action && (item.action.url || item.action.itemId || item.action.id));
  const slug = categorySlug(pathOf(target)).toLowerCase();
  try {
    return new RegExp(category.detailSlugPattern, 'i').test(slug);
  } catch (error) {
    return true;
  }
}

function filterCategoryItems(items, category) {
  if (!category || !category.detailSlugPattern) return items || [];
  return (items || []).filter(function (item) {
    return categoryMatchesItem(item, category);
  });
}

async function getHomeSection(ctx) {
  ctx = normalizeContext(ctx);
  const sectionId = stringValue(ctx && (ctx.sectionId || ctx.id));
  const categoryGroup = categoryGroupFromSectionId(sectionId);
  if (categoryGroup) return loadCategoryGroupSection(ctx, categoryGroup);
  const section = findSection(sectionId) || MISSAV_SECTIONS[0];
  if (section.personalizedHome) return personalizedRecommendationSection(ctx, section);
  const url = categoryURL(ctx, section.path);
  try {
    const html = await fetchText(ctx, url, entryURL(ctx));
    const items = filterCategoryItems(
      parseCards(mediaListBlock(html), section.title, ctx),
      section
    ).slice(0, 18);
    rememberCategoryArtwork(ctx, section.id, items);
    return {
      id: section.id,
      title: section.title,
      style: section.style,
      lazy: false,
      moreAction: categoryAction(ctx, section),
      items: items
    };
  } catch (error) {
    return verificationSection(ctx, section.id, section.title, section.style, url, error);
  }
}

function categoryGroupFromSectionId(sectionId) {
  const value = stringValue(sectionId);
  const match = /^missav-categories-([a-z]+)(?:-(\d+))?$/.exec(value);
  if (!match) return null;
  const group = MISSAV_CATEGORY_GROUPS.find(function (item) {
    return item.id === match[1];
  });
  if (!group) return null;
  const partNumber = Math.max(1, Number(match[2] || 1));
  const categories = MISSAV_SECTIONS.filter(function (category) {
    return category.group === group.id;
  }).slice((partNumber - 1) * 6, partNumber * 6);
  if (!categories.length) return null;
  return {
    id: value,
    title: group.title + (partNumber > 1 ? '（续 ' + (partNumber - 1) + '）' : ''),
    categories: categories
  };
}

async function loadCategoryGroupSection(ctx, groupSection) {
  const artwork = {};
  const categories = groupSection.categories || [];
  for (let offset = 0; offset < categories.length; offset += 2) {
    const batch = categories.slice(offset, offset + 2);
    const results = await Promise.all(batch.map(function (category) {
      return loadCategoryPreviewItems(ctx, category);
    }));
    batch.forEach(function (category, index) {
      artwork[category.id] = results[index];
    });
  }
  return {
    id: groupSection.id,
    title: groupSection.title,
    style: 'discover.annualWidePreview',
    lazy: false,
    items: categories.map(function (category) {
      return categoryCard(ctx, category, artwork[category.id]);
    })
  };
}

async function loadCategoryPreviewItems(ctx, category) {
  const cached = categoryPreviewItems(cachedCategoryArtwork(ctx, category.id), category);
  if (cached.length >= 3) return cached;
  try {
    const url = categoryURL(ctx, category.path);
    let html;
    if (category.personalizedHome) {
      html = await fetchText(ctx, entryURL(ctx), entryURL(ctx));
    } else if (category.categoryIndex && isActressIndexURL(url)) {
      html = await fetchActressIndexText(ctx, url, entryURL(ctx));
    } else {
      html = await fetchText(ctx, url, entryURL(ctx));
    }
    let items;
    if (category.personalizedHome) {
      items = parseCards(sectionBlock(html, category.title), category.title, ctx);
      if (!items.length) items = parseCards(mediaListBlock(html), category.title, ctx);
    } else if (category.categoryIndex) {
      items = parseCategoryCards(ctx, html, category.title);
      if (!items.length) items = parseCards(mediaListBlock(html), category.title, ctx);
    } else {
      items = filterCategoryItems(
        parseCards(mediaListBlock(html), category.title, ctx),
        category
      );
    }
    const previews = categoryPreviewItems(items, category);
    if (previews.length) rememberCategoryArtwork(ctx, category.id, previews);
    return previews;
  } catch (error) {
    return cached;
  }
}

async function personalizedRecommendationSection(ctx, section) {
  let items = [];
  const homeURL = entryURL(ctx);
  const browserText = await browserHTML(ctx, homeURL, homeURL);
  if (browserText) {
    items = parseCards(sectionBlock(browserText, section.title), section.title, ctx).slice(0, 18);
  }
  if (!items.length) {
    try {
      const fallbackHTML = await fetchText(ctx, randomPageURL(ctx, 1), homeURL);
      items = parseCards(fallbackHTML, section.title, ctx).slice(0, 18);
    } catch (error) {
      return verificationSection(ctx, section.id, section.title, section.style, homeURL, error);
    }
  }
  rememberCategoryArtwork(ctx, section.id, items);
  return {
    id: section.id,
    title: section.title,
    style: section.style,
    lazy: false,
    moreAction: categoryAction(ctx, section),
    items: items
  };
}

async function getCategory(ctx) {
  ctx = normalizeContext(ctx);
  const requestedPage = pageFromContext(ctx, 1);
  const pageId = normalizePageId(ctx, ctx && (ctx.pageId || ctx.id));
  const verificationURL = verificationUrlFromPageId(pageId);
  if (verificationURL) return runVerificationCategory(ctx, pageId, verificationURL);
  const section = findSection(pageId);
  const primary = findPrimaryCategory(pageId);
  const path = section ? section.path : primary ? primary.path : pageId;
  const page = categoryFetchPage(ctx, pageId, requestedPage);
  const url = section && section.randomCategory
    ? randomPageURL(ctx, page)
    : pagedURL(categoryURL(ctx, path), page);
  let html = '';
  try {
    html = isActressWorksURL(url)
      ? await fetchActressCategoryText(ctx, url, entryURL(ctx))
      : isActressIndexURL(url)
        ? await fetchActressIndexText(ctx, url, entryURL(ctx))
        : await fetchText(ctx, url, entryURL(ctx));
  } catch (error) {
    return verificationCategory(ctx, pageId, section ? section.title : primary ? primary.title : '需要验证', url, error, page);
  }
  const title = section ? section.title : primary ? primary.title : pageTitle(html) || 'MissAV';
  const categoryIndex = !!(section && section.categoryIndex);
  const categoryItems = categoryIndex ? parseCategoryCards(ctx, html, title) : [];
  const items = categoryItems.length
    ? []
    : filterCategoryItems(parseCards(mediaListBlock(html), title, ctx), section);
  const fallbackCategoryItems = items.length || categoryItems.length ? [] : parseCategoryCards(ctx, html, title);
  const listItems = items.length
    ? items
    : categoryItems.length
      ? categoryItems
      : fallbackCategoryItems;
  if (section && items.length) rememberCategoryArtwork(ctx, section.id, items);
  const pagination = section && section.randomCategory
    ? { hasMore: true, totalPages: 99 }
    : section && section.id === 'actress-ranking'
      ? { hasMore: false, totalPages: 1 }
    : paginationInfo(html, page, listItems.length);
  if (items.length && requestedPage === 1 && section && section.eagerPagination) {
    await prefetchNextCategoryPage(ctx, pageId, section, page, pagination);
  }
  const restored = listItems.length
    ? rememberCategoryPage(ctx, pageId, page, listItems, pagination)
    : null;
  const responseItems = restored && restored.items.length
    ? restored.items
    : items.length
      ? items
      : listItems;
  const responsePage = restored ? restored.page : page;
  const responseHasMore = restored ? restored.hasMore : items.length ? pagination.hasMore : false;

  return {
    pageType: 'category',
    id: pageId,
    title: title,
    style: items.length ? 'media.posterGrid' : 'discover.annualCategories',
    itemAspectRatio: '16:9',
    items: responseItems,
    page: responsePage,
    currentPage: responsePage,
    pageIndex: responsePage,
    nextPage: responseHasMore ? responsePage + 1 : undefined,
    totalPages: restored && restored.totalPages ? restored.totalPages : pagination.totalPages,
    pagecount: restored && restored.totalPages ? restored.totalPages : pagination.totalPages,
    hasMore: responseHasMore
  };
}

async function getDetail(ctx) {
  ctx = normalizeContext(ctx);
  const detailURL = detailUrlFromContext(ctx);
  if (!detailURL) throw new Error('MissAV 详情参数无效');

  let html = '';
  try {
    html = await fetchText(ctx, detailURL, entryURL(ctx));
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
  let detailPlayableURL = absoluteURL(ctx, extractPlayableURL(html));
  if (!detailPlayableURL) detailPlayableURL = await extractPlayableFromLinkedPlayers(ctx, html, detailURL);
  let resourceGroups = await playbackGroups(detailURL, title, detailPlayableURL, ctx, html);
  if (resourceVersionCount(resourceGroups) <= 1) {
    const browserPlayableURL = await extractFromBrowser(detailURL, detailURL);
    if (browserPlayableURL && browserPlayableURL !== detailPlayableURL) {
      const browserGroups = await playbackGroups(detailURL, title, browserPlayableURL, ctx, html);
      if (resourceVersionCount(browserGroups) > resourceVersionCount(resourceGroups)) {
        detailPlayableURL = browserPlayableURL;
        resourceGroups = browserGroups;
      }
    }
  }
  const versions = resourceGroups[0] && resourceGroups[0].versions || [];
  const defaultVersion = versions[0];

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
      versionCount: versions.length,
      episodeCount: 0,
      defaultVersionId: defaultVersion ? defaultVersion.id : ''
    },
    mediaSources: defaultVersion && defaultVersion.url ? [
      {
        id: defaultVersion.id,
        name: defaultVersion.name,
        displayName: defaultVersion.name,
        protocol: 'hls',
        container: 'm3u8',
        url: defaultVersion.url,
        path: defaultVersion.url,
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
  ctx = normalizeContext(ctx);
  const detailURL = detailUrlFromContext(ctx);
  const title = stringValue(ctx && (ctx.title || ctx.name)) || titleFromUrl(detailURL);
  const direct = playUrlFromContext(ctx);
  if (direct) {
    let directGroups = await playbackGroups(detailURL, title, direct, ctx);
    if (resourceVersionCount(directGroups) <= 1 && detailURL) {
      const browserPlayableURL = await extractFromBrowser(detailURL, detailURL);
      if (browserPlayableURL && browserPlayableURL !== direct) {
        const browserGroups = await playbackGroups(detailURL, title, browserPlayableURL, ctx);
        if (resourceVersionCount(browserGroups) > resourceVersionCount(directGroups)) directGroups = browserGroups;
      }
    }
    return directGroups;
  }
  try {
    const html = await fetchText(ctx, detailURL, entryURL(ctx));
    let playUrl = extractPlayableURL(html);
    if (!playUrl) playUrl = await extractPlayableFromLinkedPlayers(ctx, html, detailURL);
    let groups = await playbackGroups(detailURL, title, playUrl, ctx, html);
    if (resourceVersionCount(groups) <= 1) {
      const browserPlayableURL = await extractFromBrowser(detailURL, detailURL);
      if (browserPlayableURL && browserPlayableURL !== playUrl) {
        const browserGroups = await playbackGroups(detailURL, title, browserPlayableURL, ctx, html);
        if (resourceVersionCount(browserGroups) > resourceVersionCount(groups)) groups = browserGroups;
      }
    }
    return groups;
  } catch (error) {
    return [];
  }
}

async function resolvePlayback(ctx) {
  ctx = normalizeContext(ctx);
  const requestedQuality = qualityFromContext(ctx);
  const direct = firstNonEmpty(playUrlFromContext(ctx), ctx && ctx.url, ctx && ctx.playUrl, ctx && ctx.videoUrl);
  if (!requestedQuality && isPlayableURL(direct) && !isDetailPageURL(direct)) {
    return playbackResult(ctx, direct, ctx && ctx.referer);
  }

  const detailURL = detailUrlFromContext(ctx);
  if (!detailURL) throw new Error('MissAV 播放参数无效');
  let html = '';
  try {
    html = await fetchText(ctx, detailURL, entryURL(ctx));
  } catch (error) {
    // Playback has a separate, narrowly-scoped hidden browser media fallback.
  }
  const masterURL = firstNonEmpty(
    extractPlayableURL(html),
    await extractPlayableFromLinkedPlayers(ctx, html, detailURL),
    await extractFromBrowser(detailURL, detailURL)
  );
  let url = masterURL;
  if (masterURL) {
    let qualities = await discoverAvailableQualities(ctx, masterURL, detailURL, html);
    if (qualities.length <= 1) {
      const browserMasterURL = await extractFromBrowser(detailURL, detailURL);
      if (browserMasterURL && browserMasterURL !== masterURL) {
        const browserQualities = await discoverAvailableQualities(ctx, browserMasterURL, detailURL, html);
        if (browserQualities.length > qualities.length) qualities = browserQualities;
      }
    }
    const selected = selectQuality(qualities, requestedQuality);
    if (selected && selected.url) url = selected.url;
  }
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
  ctx = normalizeContext(ctx);
  const query = stringValue(ctx && (ctx.query || ctx.keyword || ctx.text));
  if (!query) return { pageType: 'search', title: '搜索结果', items: [] };
  const page = pageFromContext(ctx, 1);
  const url = pagedURL(categoryURL(ctx, '/search/' + encodeURIComponent(query.replace(/\\/g, ''))), page);
  let html = '';
  try {
    html = await fetchText(ctx, url, entryURL(ctx));
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
  const pagination = paginationInfo(html, page, items.length);
  return {
    pageType: 'search',
    title: '搜索结果',
    items: items,
    page: page,
    currentPage: page,
    pageIndex: page,
    nextPage: pagination.hasMore ? page + 1 : undefined,
    totalPages: pagination.totalPages,
    pagecount: pagination.totalPages,
    hasMore: pagination.hasMore
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
  ctx = normalizeContext(ctx);
  const nestedAction = ctx && ctx.action && typeof ctx.action === 'object' ? ctx.action : {};
  const name = stringValue(firstNonEmpty(
    ctx && ctx.name,
    nestedAction.name,
    ctx && ctx.actionName,
    nestedAction.id,
    ctx && ctx.id
  ));
  const payload = nestedAction.payload || (ctx && ctx.payload) || nestedAction || ctx || {};
  if (name !== 'verifyCloudflare') return { handled: false };
  const url = stringValue(payload.url || ctx.url) || entryURL(ctx);
  const html = await browserHTML(ctx, url, url, true);
  if (isUsableHTML(html)) setCachedText(ctx, url, html);
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
      const playerHTML = await fetchText(ctx, urls[index], referer);
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

function normalizeContext(ctx) {
  if (ctx === undefined || ctx === null) return {};
  if (typeof ctx === 'string') {
    const text = ctx.trim();
    if (!text) return {};
    if (text[0] === '{' && text[text.length - 1] === '}') {
      try {
        const parsed = JSON.parse(text);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
      } catch (error) {
        return { query: text };
      }
    }
    return { query: text };
  }
  return typeof ctx === 'object' ? ctx : {};
}

function pageFromContext(ctx, fallback) {
  const input = normalizeContext(ctx);
  const pagination = input.pagination && typeof input.pagination === 'object' ? input.pagination : {};
  const pageInfo = input.pageInfo && typeof input.pageInfo === 'object' ? input.pageInfo : {};
  return positiveInt(firstNonEmpty(
    contextValue(input, 'page'),
    contextValue(input, 'pg'),
    contextValue(input, 'currentPage'),
    contextValue(input, 'pageNumber'),
    contextValue(input, 'pageIndex'),
    pagination.page,
    pagination.pg,
    pagination.currentPage,
    pagination.pageNumber,
    pagination.pageIndex,
    pageInfo.page,
    pageInfo.pg,
    pageInfo.currentPage,
    pageInfo.pageNumber,
    pageInfo.pageIndex
  ), fallback);
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

function isActressWorksURL(url) {
  const path = pathOf(url).split('?')[0].replace(/\/+$/, '');
  return /\/(?:dm\d+\/)?cn\/actresses\/[^/]+$/i.test(path) &&
    !/\/actresses\/ranking$/i.test(path);
}

function isActressIndexURL(url) {
  const path = pathOf(url).split('?')[0].replace(/\/+$/, '');
  return /\/(?:dm\d+\/)?cn\/actresses(?:\/ranking)?$/i.test(path);
}

async function fetchActressCategoryText(ctx, url, referer) {
  const cached = getCachedText(ctx, url);
  if (cached) return cached;

  const fastContext = Object.assign({}, ctx || {}, {
    requestTimeoutSeconds: Math.min(numberParam(ctx, 'requestTimeoutSeconds', 45), 12),
    suppressBrowserFailureCooldown: true
  });

  let lastError = null;
  try {
    const options = requestOptions(fastContext, referer || url);
    options.useBrowserFallback = false;
    options.browserFallback = false;
    options.allowBrowserFallback = false;
    const response = await httpGet(url, options);
    const text = responseText(response);
    if (isUsableHTML(text, response && response.status, response && response.headers)) {
      setCachedText(ctx, url, text);
      return text;
    }
    throw new Error('HTTP ' + (response && response.status ? response.status : 'empty'));
  } catch (error) {
    lastError = error;
  }

  // Actress work pages are challenged more often than ordinary categories.
  // Reuse the verified browser session once with a short timeout instead of
  // immediately appending another verification card to the existing 12 items.
  const browserText = await browserHTML(fastContext, url, referer || url);
  if (isVerifiedTargetHTML(fastContext, url, browserText)) {
    setCachedText(ctx, url, browserText);
    return browserText;
  }

  throw new Error(
    '女优作品页读取失败。已短暂尝试复用刚才的验证状态，请点击一次真人验证后重试。' +
    (lastError && lastError.message ? ' 原因：' + lastError.message : '')
  );
}

async function fetchActressIndexText(ctx, url, referer) {
  const cached = getCachedText(ctx, url);
  if (cached && isVerifiedTargetHTML(ctx, url, cached)) return cached;

  const fastContext = Object.assign({}, ctx || {}, {
    requestTimeoutSeconds: Math.min(numberParam(ctx, 'requestTimeoutSeconds', 45), 12),
    suppressBrowserFailureCooldown: true
  });
  let lastError = null;
  try {
    const options = requestOptions(fastContext, referer || url);
    options.useBrowserFallback = false;
    options.browserFallback = false;
    options.allowBrowserFallback = false;
    const response = await httpGet(url, options);
    const text = responseText(response);
    if (isVerifiedTargetHTML(fastContext, url, text)) {
      setCachedText(ctx, url, text);
      return text;
    }
    throw new Error('HTTP ' + (response && response.status ? response.status : 'empty'));
  } catch (error) {
    lastError = error;
  }

  const browserText = await browserHTML(fastContext, url, referer || url);
  if (isVerifiedTargetHTML(fastContext, url, browserText)) {
    setCachedText(ctx, url, browserText);
    return browserText;
  }

  throw new Error(
    '女优目录读取失败。已短暂尝试复用浏览器验证状态，请手动完成一次真人验证。' +
    (lastError && lastError.message ? ' 原因：' + lastError.message : '')
  );
}

async function fetchText(ctx, url, referer) {
  const cached = getCachedText(ctx, url);
  if (cached) return cached;

  const urls = candidateURLs(ctx, url);
  let lastError = null;
  for (let index = 0; index < urls.length; index += 1) {
    const currentURL = urls[index];
    const requestReferer = referer || entryURL(ctx);
    try {
      const response = await httpGet(currentURL, requestOptions(ctx, requestReferer));
      const text = responseText(response);
      if (isUsableHTML(text, response && response.status, response && response.headers)) {
        setCachedText(ctx, currentURL, text);
        if (currentURL !== url) setCachedText(ctx, url, text);
        return text;
      }
      if (isCloudflare(text, response && response.status, response && response.headers)) {
        const browserText = await browserHTML(ctx, currentURL, requestReferer);
        if (isUsableHTML(browserText)) {
          setCachedText(ctx, currentURL, browserText);
          if (currentURL !== url) setCachedText(ctx, url, browserText);
          return browserText;
        }
      }
      lastError = new Error('HTTP ' + (response && response.status ? response.status : 'empty') + ' ' + currentURL);
    } catch (error) {
      lastError = error;
      const browserText = await browserHTML(ctx, currentURL, requestReferer);
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
  if (typeof Widget !== 'undefined' && Widget.http && typeof Widget.http.request === 'function') {
    const widgetOptions = options || {};
    if (!widgetOptions.method) widgetOptions.method = 'GET';
    return Widget.http.request(url, widgetOptions);
  }
  if (typeof $http !== 'undefined' && typeof $http.get === 'function') {
    return $http.get(url, options || {});
  }
  if (typeof $http !== 'undefined' && typeof $http.request === 'function') {
    const legacyOptions = options || {};
    if (!legacyOptions.method) legacyOptions.method = 'GET';
    return $http.request(url, legacyOptions);
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
  if (typeof response.text === 'string') return response.text;
  if (typeof response.data === 'string') return response.data;
  if (typeof response.body === 'string') return response.body;
  if (response.data && typeof response.data.html === 'string') return response.data.html;
  if (response.body && typeof response.body.html === 'string') return response.body.html;
  if (typeof response.html === 'string') return response.html;
  return String(response.data || response.body || '');
}

async function browserHTML(ctx, url, referer, forceVisible) {
  if (!boolParam(ctx, 'enableBrowserFallback', true)) return '';
  if (forceVisible !== true && !boolParam(ctx, 'automaticBrowserFallback', true)) return '';
  if (forceVisible !== true && browserRetryBlocked(ctx, url)) return '';
  if (typeof Widget === 'undefined' || !Widget.browser || typeof Widget.browser.fetch !== 'function') return '';
  try {
    const visible = forceVisible === true;
    const configuredTimeout = numberParam(ctx, 'requestTimeoutSeconds', 45);
    const timeout = visible ? Math.min(configuredTimeout, 20) : configuredTimeout;
    const result = await Widget.browser.fetch(url, {
      visible: visible,
      timeout: timeout,
      timeoutSeconds: timeout,
      waitAfterLoad: visible ? 1.5 : 3,
      headers: {
        'User-Agent': MISSAV_UA,
        Referer: referer || url
      }
    });
    const html = responseText(result.html ? { data: result.html } : result);
    if (isUsableHTML(html)) {
      clearBrowserFailure(url);
      return html;
    }
    rememberBrowserFailure(ctx, url);
    return '';
  } catch (error) {
    rememberBrowserFailure(ctx, url);
    return '';
  }
}

function browserFailureKey(url) {
  const scope = isActressWorksURL(url) || isActressIndexURL(url)
    ? pathOf(url).split('?')[0].replace(/\/+$/, '')
    : '';
  return 'missav:browser-failure:' + originOf(url) + (scope ? ':' + scope : '');
}

function browserRetryBlocked(ctx, url) {
  const value = cacheGet(browserFailureKey(url));
  return !!(value && Number(value.retryAfter) > Date.now());
}

function rememberBrowserFailure(ctx, url) {
  if (boolParam(ctx, 'suppressBrowserFailureCooldown', false)) return;
  const minutes = Math.max(0, numberParam(ctx, 'verificationCooldownMinutes', 10));
  if (!minutes) return;
  cacheSet(browserFailureKey(url), { retryAfter: Date.now() + minutes * 60 * 1000 });
}

function clearBrowserFailure(url) {
  cacheSet(browserFailureKey(url), { retryAfter: 0 });
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
      captureRequests: true,
      captureMedia: true,
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
  candidatePathVariants(ctx, path).forEach(function (variant) {
    const next = origin + variant;
    if (urls.indexOf(next) < 0) urls.push(next);
  });
  backupBaseURLs(ctx).forEach(function (base) {
    const root = base.replace(/\/+$/, '');
    if (!root || root === origin) return;
    candidatePathVariants(ctx, path).forEach(function (variant) {
      const next = root + variant;
      if (urls.indexOf(next) < 0) urls.push(next);
    });
  });
  return urls.filter(Boolean);
}

function candidatePathVariants(ctx, path) {
  const value = path && path[0] === '/' ? path : '/' + stringValue(path);
  const variants = [value];
  if (!isKnownCategoryPath(value)) return variants;
  const match = value.match(/^\/(?:dm\d+\/)?cn(\/[^?#]*)([?#].*)?$/i);
  if (match) {
    const suffix = match[1] || '';
    const query = match[2] || '';
    const cnPath = '/cn' + suffix + query;
    const rootPath = suffix + query;
    if (variants.indexOf(cnPath) < 0) variants.push(cnPath);
    if (variants.indexOf(rootPath) < 0) variants.push(rootPath);
  } else {
    const localePath = localePrefix(ctx) + value;
    const cnPath = '/cn' + value;
    if (variants.indexOf(localePath) < 0) variants.push(localePath);
    if (variants.indexOf(cnPath) < 0) variants.push(cnPath);
  }
  return variants;
}

function isKnownCategoryPath(path) {
  const clean = String(path || '').split(/[?#]/)[0].replace(/^\/(?:dm\d+\/)?cn/i, '') || '/';
  return MISSAV_SECTIONS.some(function (item) {
    return categorySlug(clean) === categorySlug(item.path);
  });
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

function categoryArtworkKey(ctx, pageId) {
  return 'missav:category-artwork:v4:' + baseURL(ctx) + ':' + String(pageId || '');
}

function rememberCategoryArtwork(ctx, pageId, items) {
  const previews = categoryPreviewItems(items, findSection(pageId));
  if (!previews.length) return;
  const key = categoryArtworkKey(ctx, pageId);
  const value = {
    items: previews,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  };
  memoryCache()[key] = value;
  cacheSet(key, value);
}

function cachedCategoryArtwork(ctx, pageId) {
  const key = categoryArtworkKey(ctx, pageId);
  const now = Date.now();
  let value = memoryCache()[key] || cacheGet(key);
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (error) {
      value = null;
    }
  }
  if (!value || value.expiresAt <= now || !Array.isArray(value.items)) return [];
  memoryCache()[key] = value;
  return value.items;
}

function categoryStateKey(ctx, pageId) {
  return 'missav:category-state:v6:' + baseURL(ctx) + ':' + String(pageId || '');
}

function memoryCache() {
  if (typeof globalThis === 'undefined') return {};
  if (!globalThis.__MISSAV_HTML_CACHE__) globalThis.__MISSAV_HTML_CACHE__ = {};
  return globalThis.__MISSAV_HTML_CACHE__;
}

function categoryStateFromCache(ctx, pageId) {
  const key = categoryStateKey(ctx, pageId);
  const now = Date.now();
  let state = memoryCache()[key] || cacheGet(key);
  if (typeof state === 'string') {
    try {
      state = JSON.parse(state);
    } catch (error) {
      state = null;
    }
  }
  if (!state || state.expiresAt <= now || !state.pages) return null;
  memoryCache()[key] = state;
  return state;
}

function randomPageURL(ctx, page) {
  const bucket = ((Math.max(1, Number(page) || 1) - 1) % 99) + 2;
  return baseURL(ctx) + '/random/' + bucket;
}

async function prefetchNextCategoryPage(ctx, pageId, section, page, pagination) {
  if (!pagination || !pagination.hasMore) return;
  const nextPage = page + 1;
  const state = categoryStateFromCache(ctx, pageId);
  if (state && state.pages && state.pages[String(nextPage)]) return;
  try {
    const url = pagedURL(categoryURL(ctx, section.path), nextPage);
    const html = await fetchText(ctx, url, entryURL(ctx));
    const items = parseCards(html, section.title, ctx);
    if (!items.length) return;
    rememberCategoryPage(ctx, pageId, nextPage, items, paginationInfo(html, nextPage, items.length));
  } catch (error) {
    // Page 1 remains usable; ordinary scrolling can retry the next page later.
  }
}

function contiguousCategoryPage(state) {
  if (!state || !state.pages || !state.pages['1']) return 0;
  let page = 1;
  while (state.pages[String(page + 1)]) page += 1;
  return page;
}

function categoryFetchPage(ctx, pageId, requestedPage) {
  if (requestedPage <= 1) return 1;
  const state = categoryStateFromCache(ctx, pageId);
  if (!state || !state.pages[String(requestedPage)]) return requestedPage;
  const lastLoadedPage = contiguousCategoryPage(state);
  return lastLoadedPage >= requestedPage ? lastLoadedPage + 1 : requestedPage;
}

function rememberCategoryPage(ctx, pageId, page, items, pagination) {
  const key = categoryStateKey(ctx, pageId);
  const ttl = numberParam(ctx, 'categoryRestoreMinutes', 60) * 60 * 1000;
  const existing = categoryStateFromCache(ctx, pageId);
  const state = existing || { pages: {} };
  state.pages[String(page)] = (items || []).slice(0, 120);
  state.hasMoreByPage = state.hasMoreByPage || {};
  state.hasMoreByPage[String(page)] = !!(pagination && pagination.hasMore);
  state.totalPages = Math.max(Number(state.totalPages) || 0, Number(pagination && pagination.totalPages) || 0);
  state.expiresAt = Date.now() + ttl;

  const pageNumbers = Object.keys(state.pages).map(Number).filter(function (value) {
    return Number.isFinite(value) && value > 0;
  }).sort(function (a, b) { return a - b; });
  while (pageNumbers.length > 20) {
    const removed = pageNumbers.shift();
    delete state.pages[String(removed)];
    delete state.hasMoreByPage[String(removed)];
  }
  memoryCache()[key] = state;
  cacheSet(key, state);

  if (page !== 1) {
    return {
      items: items,
      page: page,
      hasMore: !!(pagination && pagination.hasMore),
      totalPages: Number(pagination && pagination.totalPages) || state.totalPages
    };
  }

  const lastContiguousPage = contiguousCategoryPage(state);
  if (lastContiguousPage === 1) {
    return {
      items: items,
      page: 1,
      hasMore: !!(pagination && pagination.hasMore),
      totalPages: Number(pagination && pagination.totalPages) || state.totalPages
    };
  }

  const merged = [];
  const seen = {};
  for (let current = 1; current <= lastContiguousPage; current += 1) {
    (state.pages[String(current)] || []).forEach(function (item) {
      const identity = stringValue(item && (item.id || item.url || item.title));
      if (identity && seen[identity]) return;
      if (identity) seen[identity] = true;
      merged.push(item);
    });
  }
  const latestHasMore = state.hasMoreByPage[String(lastContiguousPage)];
  return {
    items: merged.slice(0, 240),
    page: lastContiguousPage,
    hasMore: latestHasMore !== undefined
      ? latestHasMore
      : state.totalPages > lastContiguousPage,
    totalPages: state.totalPages
  };
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
  const configuredMinutes = numberParam(ctx, 'cacheMinutes', 20);
  const minimumMinutes = isActressIndexURL(url) ? 60 : isActressWorksURL(url) ? 30 : 0;
  const ttl = Math.max(configuredMinutes, minimumMinutes) * 60 * 1000;
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
  const candidates = [];
  const keys = ['url', 'mediaURL', 'mediaUrl', 'videoURL', 'videoUrl', 'playURL', 'playUrl', 'src'];
  for (let index = 0; index < keys.length; index += 1) {
    const value = result[keys[index]];
    if (isPlayableURL(value)) candidates.push(value);
  }
  const arrays = [
    result.mediaSources,
    result.mediaRequests,
    result.capturedRequests,
    result.requests,
    result.responses,
    result.urls
  ];
  for (let a = 0; a < arrays.length; a += 1) {
    const array = arrays[a];
    if (!Array.isArray(array)) continue;
    for (let i = 0; i < array.length; i += 1) {
      const item = array[i];
      const value = typeof item === 'string' ? item : firstNonEmpty(item && item.url, item && item.src, item && item.responseURL);
      if (isPlayableURL(value)) candidates.push(value);
    }
  }
  return unique(candidates).sort(function (left, right) {
    return playableCandidateScore(right) - playableCandidateScore(left);
  })[0] || '';
}

function playableCandidateScore(url) {
  const value = String(url || '');
  let score = 0;
  if (/\.m3u8(?:[?#]|$)/i.test(value)) score += 20;
  if (/(?:master|playlist|index)\.m3u8(?:[?#]|$)/i.test(value)) score += 40;
  if (/\/\d{3,4}p(?:\/|[?#]|$)/i.test(value)) score -= 30;
  if (/\.(?:ts|m2ts)(?:[?#]|$)/i.test(value)) score -= 100;
  return score;
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
    title: '需要真人验证',
    type: 'collection',
    mediaType: 'collection',
    overview: cleanText(error && error.message) || '站点触发了 Cloudflare 真人验证。请返回列表页点击手动验证卡片，完成后刷新。',
    detailImageAspectRatio: '16:9',
    playable: false,
    isPlayable: false,
    resourceGroups: [],
    mediaSources: [],
    playbackSummary: {
      versionCount: 0,
      episodeCount: 0,
      defaultVersionId: ''
    },
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
  const targetURL = url || entryURL(ctx);
  const pageId = verificationPageId(targetURL);
  return {
    id: pageId,
    title: title || '手动完成验证',
    subtitle: '点击后再打开验证界面，完成后返回刷新',
    overview: cleanText(error && error.message) || '当前网络触发了 Cloudflare 真人验证。',
    type: 'category',
    mediaType: 'category',
    playable: false,
    isPlayable: false,
    aspectRatio: '16:9',
    action: {
      type: 'category',
      id: pageId,
      pageId: pageId,
      title: '手动完成验证',
      url: targetURL,
      itemAspectRatio: '16:9'
    }
  };
}

async function runVerificationCategory(ctx, pageId, url) {
  const requestedPage = Math.max(pageFromContext(ctx, 1), pageFromURL(url, 1));
  if (requestedPage > 1 || isVerifiedTargetHTML(ctx, url, getCachedText(ctx, url))) {
    return resumeVerifiedCategory(ctx, pageId, url, requestedPage);
  }
  let html = await browserHTML(ctx, url, url, true);
  if (!isVerifiedTargetHTML(ctx, url, html)) {
    const refreshedHTML = await fetchAfterVerification(ctx, url);
    if (isVerifiedTargetHTML(ctx, url, refreshedHTML)) html = refreshedHTML;
  }
  const ok = isVerifiedTargetHTML(ctx, url, html);
  if (ok) {
    setCachedText(ctx, url, html);
    if (isActressWorksURL(url) || isActressIndexURL(url)) {
      resetCategoryState(ctx, normalizePageId(ctx, url));
      return resumeVerifiedCategory(ctx, pageId, url, 1);
    }
  }
  const retryCard = verificationCard(
    ctx,
    '验证未完成，点击重新验证',
    url,
    new Error('浏览器尚未返回可读取的影片页面')
  );
  return {
    pageType: 'category',
    id: pageId,
    title: ok ? '验证完成' : '验证未完成',
    style: 'media.posterGrid',
    itemAspectRatio: '16:9',
    page: 1,
    hasMore: false,
    items: ok
      ? [{
          id: pageId + '-success',
          title: '验证完成',
          subtitle: '请返回原页面继续浏览',
          type: 'collection',
          mediaType: 'collection',
          playable: false,
          isPlayable: false,
          aspectRatio: '16:9',
          action: { type: 'none' }
        }]
      : [retryCard]
  };
}

async function resumeVerifiedCategory(ctx, verificationPageId, targetURL, page) {
  const stablePageId = normalizePageId(ctx, targetURL);
  const resumedContext = Object.assign({}, ctx || {}, {
    id: stablePageId,
    pageId: stablePageId,
    page: page,
    currentPage: page,
    pageIndex: page
  });
  let result = await getCategory(resumedContext);
  result.id = stablePageId;
  result.verificationTarget = targetURL;
  return result;
}

function resetCategoryState(ctx, pageId) {
  const key = categoryStateKey(ctx, pageId);
  delete memoryCache()[key];
  cacheSet(key, { pages: {}, expiresAt: 0 });
}

function isVerifiedTargetHTML(ctx, url, html) {
  if (!isUsableHTML(html)) return false;
  if (isActressWorksURL(url)) {
    return parseCards(html, pageTitle(html) || '女优作品', ctx).length > 0;
  }
  if (isActressIndexURL(url)) {
    return parseCategoryCards(ctx, html, /\/ranking$/i.test(pathOf(url)) ? '女优排行' : '女优一览').length > 0;
  }
  return true;
}

async function fetchAfterVerification(ctx, url) {
  const retryContext = Object.assign({}, ctx || {}, {
    requestTimeoutSeconds: Math.min(numberParam(ctx, 'requestTimeoutSeconds', 45), 6)
  });
  for (let attempt = 0; attempt < 1; attempt += 1) {
    try {
      await verificationCookieDelay(500);
      const options = requestOptions(retryContext, url);
      options.useBrowserFallback = false;
      options.browserFallback = false;
      options.allowBrowserFallback = false;
      options.useBrowserCookie = true;
      options.attachBrowserCookie = true;
      const response = await httpGet(url, options);
      const html = responseText(response);
      if (isVerifiedTargetHTML(ctx, url, html)) return html;
    } catch (error) {
      // Return a retry card quickly instead of leaving the verification page spinning.
    }
  }
  return '';
}

function verificationCookieDelay(milliseconds) {
  if (typeof Promise === 'undefined') return null;
  if (typeof setTimeout !== 'function') return Promise.resolve();
  return new Promise(function (resolve) {
    setTimeout(resolve, milliseconds);
  });
}

function pageFromURL(url, fallback) {
  const match = String(url || '').match(/[?&]page=(\d+)/i);
  return positiveInt(match && match[1], fallback);
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
  const records = {};
  const order = [];
  const pattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(source))) {
    const href = attr(match[1], 'href');
    if (!isCategoryHref(href)) continue;
    const url = absoluteURL(ctx, href);
    const rawTitle = cleanText(firstNonEmpty(
      attr(match[1], 'title'),
      attr(match[2], 'alt'),
      match[2]
    ));
    const title = categoryCardTitle(rawTitle);
    const image = absoluteURL(ctx, pickImage(match[0]));
    if (!records[url]) {
      records[url] = { url: url, title: '', image: '' };
      order.push(url);
    }
    if (title && !isJunkCategoryTitle(title)) records[url].title = records[url].title || title;
    if (image) records[url].image = records[url].image || image;
  }

  return order.map(function (url, index) {
    const record = records[url];
    if (!record || !record.title) return null;
    const item = {
      id: 'category-link-' + index + '-' + encodeURIComponent(record.title),
      title: record.title,
      subtitle: fallbackTitle || '分类',
      type: 'category',
      mediaType: 'category',
      playable: false,
      isPlayable: false,
      aspectRatio: record.image ? '2:3' : '16:9',
      action: {
        type: 'category',
        id: record.url,
        pageId: record.url,
        title: record.title,
        url: record.url,
        itemAspectRatio: '16:9'
      }
    };
    if (record.image) {
      item.poster = record.image;
      item.thumbnailURL = record.image;
      item.imageHeaders = imageHeaders(ctx, record.url);
    }
    return item;
  }).filter(Boolean).slice(0, 120);
}

function categoryCardTitle(value) {
  return cleanText(value)
    .replace(/\s+\d+\s*(?:条|部)影片[\s\S]*$/i, '')
    .replace(/\s+\d{4}\s*出道[\s\S]*$/i, '')
    .replace(/\s+第\s*\d+\s*名[\s\S]*$/i, '')
    .trim();
}

function categoryListBlock(html, title) {
  const source = String(html || '');
  const heading = cleanText(title || '');
  const index = heading ? source.search(new RegExp('<h1[^>]*>\\s*' + escapeRegExp(heading), 'i')) : -1;
  if (index < 0) return source;
  const nextFooter = source.indexOf('<footer', index);
  const endCandidates = [nextFooter].filter(function (value) { return value > index; });
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

function mediaListBlock(html) {
  const source = String(html || '');
  if (!source) return source;
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  let firstMediaIndex = -1;
  while ((match = anchorPattern.exec(source))) {
    if (!isDetailHref(attr(match[1], 'href'))) continue;
    firstMediaIndex = match.index;
    break;
  }
  if (firstMediaIndex < 0) return source;
  const headingIndex = source.lastIndexOf('<h1', firstMediaIndex);
  const mainIndex = source.lastIndexOf('<main', firstMediaIndex);
  const start = Math.max(headingIndex, mainIndex, 0);
  const footerIndex = source.indexOf('<footer', firstMediaIndex);
  return source.slice(start, footerIndex > firstMediaIndex ? footerIndex : undefined);
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
  return anchorsIn(block).some(function (anchor) {
    return isDetailHref(anchor.href);
  }) ? block : fallback;
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

async function playbackGroups(detailURL, title, playUrl, ctx, html) {
  if (!isPlayableURL(playUrl)) return [];
  const headers = playbackHeaders(ctx || {}, detailURL);
  const qualities = await discoverAvailableQualities(ctx || {}, playUrl, detailURL, html);
  if (!qualities.length && containerOf(playUrl) === 'm3u8' && !qualityHeightFromURL(playUrl)) return [];
  const sourceQualities = qualities.length ? qualities : [
    {
      height: qualityHeightFromURL(playUrl),
      label: qualityHeightFromURL(playUrl) ? qualityHeightFromURL(playUrl) + 'P' : '自动画质',
      url: playUrl
    }
  ];
  const versions = sourceQualities.map(function (quality, index) {
    const id = encodePayload({
      url: detailURL,
      title: title,
      quality: quality.height || 'auto'
    });
    return {
      id: id,
      title: quality.label,
      name: quality.label,
      subtitle: index === 0 ? '最高可用画质' : '切换时请稍候',
      url: quality.url,
      playUrl: quality.url,
      path: quality.url,
      default: index === 0,
      availability: 'playable',
      container: containerOf(quality.url),
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
  });
  return [
    {
      id: 'missav-online',
      title: '在线播放',
      versions: versions
    }
  ];
}

function resourceVersionCount(groups) {
  return (groups || []).reduce(function (total, group) {
    return total + (Array.isArray(group && group.versions) ? group.versions.length : 0);
  }, 0);
}

async function discoverAvailableQualities(ctx, playlistURL, referer, html) {
  const candidates = extractHTMLQualities(html, ctx);
  if (isPlayableURL(playlistURL)) {
    const height = qualityHeightFromURL(playlistURL);
    candidates.push({
      height: height,
      label: height ? height + 'P' : '自动画质',
      url: playlistURL
    });
  }

  const urls = unique(candidates.map(function (item) { return item.url; })).slice(0, 8);
  for (let index = 0; index < urls.length; index += 1) {
    const variants = await discoverQualities(ctx, urls[index], referer);
    variants.forEach(function (quality) { candidates.push(quality); });
  }
  return normalizeQualities(candidates);
}

function extractHTMLQualities(html, ctx) {
  const source = decodeEscapes(String(html || '') + '\n' + unpackPackedScripts(html).join('\n'));
  const qualities = [];
  const assignment = /\b(source(?:[_-]?\d{3,4})?|videoUrl|video_url|hlsUrl)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/gi;
  let match;
  while ((match = assignment.exec(source))) {
    const url = absoluteURL(ctx, decodeEscapes(match[2]));
    if (!isPlayableURL(url)) continue;
    const width = Number(firstMatch(match[1], /(\d{3,4})/)) || 0;
    const height = qualityHeightFromURL(url) || qualityHeightFromWidth(width);
    qualities.push({
      height: height,
      width: width,
      label: height ? height + 'P' : '自动画质',
      url: url
    });
  }

  const labeledSource = /(?:label|quality)\s*:\s*["'](\d{3,4})p?["'][\s\S]{0,240}?(?:file|src|url)\s*:\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/gi;
  while ((match = labeledSource.exec(source))) {
    const url = absoluteURL(ctx, decodeEscapes(match[2]));
    if (!isPlayableURL(url)) continue;
    const height = Number(match[1]) || qualityHeightFromURL(url);
    qualities.push({ height: height, label: height + 'P', url: url });
  }
  return normalizeQualities(qualities);
}

function qualityHeightFromWidth(width) {
  const value = Number(width) || 0;
  if (value >= 1900) return 1080;
  if (value >= 1200) return 720;
  if (value >= 800) return 480;
  if (value >= 600) return 360;
  if (value >= 400) return 240;
  return 0;
}

function normalizeQualities(qualities) {
  const output = [];
  const seenHeight = {};
  const seenURL = {};
  (qualities || []).sort(function (a, b) {
    return (b.height || 0) - (a.height || 0) || (b.bandwidth || 0) - (a.bandwidth || 0);
  }).forEach(function (quality) {
    const url = stringValue(quality && quality.url);
    if (!url || seenURL[url]) return;
    const height = Number(quality.height) || qualityHeightFromURL(url);
    if (height && seenHeight[String(height)]) return;
    seenURL[url] = true;
    if (height) seenHeight[String(height)] = true;
    output.push({
      height: height,
      width: Number(quality.width) || 0,
      bandwidth: Number(quality.bandwidth) || 0,
      label: height ? height + 'P' : stringValue(quality.label) || '自动画质',
      url: url
    });
  });
  const hasNamedQuality = output.some(function (quality) { return quality.height > 0; });
  return hasNamedQuality
    ? output.filter(function (quality) { return quality.height > 0; })
    : output;
}

async function discoverQualities(ctx, playlistURL, referer) {
  if (!isPlayableURL(playlistURL) || containerOf(playlistURL) !== 'm3u8') return [];
  try {
    const response = await httpGet(playlistURL, {
      headers: playbackHeaders(ctx || {}, referer || playlistURL),
      timeout: numberParam(ctx, 'requestTimeoutSeconds', 45),
      timeoutSeconds: numberParam(ctx, 'requestTimeoutSeconds', 45),
      useBrowserCookie: true,
      attachBrowserCookie: true
    });
    const playlist = responseText(response);
    if (playlist.indexOf('#EXT-X-STREAM-INF') < 0) return [];
    return parseMasterQualities(playlist, playlistURL);
  } catch (error) {
    return [];
  }
}

function parseMasterQualities(playlist, playlistURL) {
  const lines = String(playlist || '').split(/\r?\n/);
  const qualities = [];
  const seen = {};
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line.indexOf('#EXT-X-STREAM-INF:') !== 0) continue;
    const resolution = line.match(/\bRESOLUTION=(\d+)x(\d+)/i);
    const bandwidth = Number(firstMatch(line, /\b(?:AVERAGE-)?BANDWIDTH=(\d+)/i)) || 0;
    let uri = '';
    for (let next = index + 1; next < lines.length; next += 1) {
      const candidate = lines[next].trim();
      if (!candidate) continue;
      if (candidate[0] === '#') break;
      uri = candidate;
      break;
    }
    if (!uri) continue;
    const height = resolution ? Number(resolution[2]) : qualityHeightFromURL(uri);
    const url = resolveRelativeURL(playlistURL, uri);
    const key = String(height || 0) + '|' + url;
    if (!url || seen[key]) continue;
    seen[key] = true;
    qualities.push({
      height: height,
      width: resolution ? Number(resolution[1]) : 0,
      bandwidth: bandwidth,
      label: height ? height + 'P' : '自动画质',
      url: url
    });
  }
  return qualities.sort(function (a, b) {
    return (b.height || 0) - (a.height || 0) || (b.bandwidth || 0) - (a.bandwidth || 0);
  });
}

function selectQuality(qualities, requestedQuality) {
  const list = Array.isArray(qualities) ? qualities : [];
  if (!list.length) return null;
  const requested = Number(requestedQuality);
  if (requested > 0) {
    const exact = list.find(function (item) { return Number(item.height) === requested; });
    if (exact) return exact;
  }
  return list[0];
}

function qualityHeightFromURL(url) {
  const match = String(url || '').match(/(?:^|[\/_.-])(\d{3,4})p(?:[\/_.?#-]|$)/i);
  return match ? Number(match[1]) : 0;
}

function resolveRelativeURL(base, value) {
  const target = decodeEscapes(String(value || '').trim());
  if (!target) return '';
  if (/^https?:\/\//i.test(target)) return target;
  if (target.indexOf('//') === 0) return 'https:' + target;
  const origin = originOf(base);
  if (target[0] === '/') return origin + target;
  const directory = String(base || '').replace(/[?#].*$/, '').replace(/\/[^/]*$/, '/');
  const combined = directory + target;
  const prefix = firstMatch(combined, /^(https?:\/\/[^/]+)/i);
  const path = combined.slice(prefix.length).split('/');
  const normalized = [];
  path.forEach(function (part) {
    if (!part || part === '.') return;
    if (part === '..') normalized.pop();
    else normalized.push(part);
  });
  return prefix + '/' + normalized.join('/');
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
    firstMatch(source, /\bsource\s*=\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
    firstMatch(source, /source1280\s*=\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
    firstMatch(source, /source842\s*=\s*["']([^"']+\.(?:m3u8|mp4|mpd)[^"']*)["']/i),
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

function qualityFromContext(ctx) {
  const payload = decodePayload(ctx && (ctx.versionId || ctx.sourceId || ctx.id || ctx.itemId));
  return firstNonEmpty(
    payload && payload.quality,
    ctx && ctx.quality,
    ctx && ctx.height,
    ctx && ctx.resolution
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

function verificationPageId(url) {
  return MISSAV_VERIFY_PAYLOAD_PREFIX + 'url=' + encodeURIComponent(String(url || MISSAV_DEFAULT_BASE));
}

function verificationUrlFromPageId(value) {
  const text = stringValue(value);
  if (text.indexOf(MISSAV_VERIFY_PAYLOAD_PREFIX) !== 0) return '';
  const parts = text.slice(MISSAV_VERIFY_PAYLOAD_PREFIX.length).split('&');
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const separator = part.indexOf('=');
    const key = separator >= 0 ? part.slice(0, separator) : part;
    if (key !== 'url') continue;
    const raw = separator >= 0 ? part.slice(separator + 1) : '';
    try {
      return decodeURIComponent(raw);
    } catch (error) {
      return raw;
    }
  }
  return '';
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
  if (id.indexOf(MISSAV_VERIFY_PAYLOAD_PREFIX) === 0) return id;
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
  return MISSAV_SECTIONS.find(function (item) {
    return item.id === value ||
      item.title === value ||
      item.path === value ||
      item.path.replace(/^\//, '') === value ||
      categorySlug(item.path) === categorySlug(value);
  });
}

function isDetailHref(href) {
  const value = String(href || '');
  if (findSection(value)) return false;
  if (isCategoryHref(value)) return false;
  const path = value
    .replace(/^https?:\/\/[^/]+/i, '')
    .split(/[?#]/)[0]
    .replace(/^\/+|\/+$/g, '');
  const parts = path.split('/').filter(Boolean);
  if (/^dm\d+$/i.test(parts[0] || '')) parts.shift();
  if (/^(?:cn|en|ja|ko|ms|th|de|fr|vi|id)$/i.test(parts[0] || '')) parts.shift();
  if (parts.length !== 1) return false;
  const slug = parts[0] || '';
  if (/^(?:new|release|random|search|history|playlists?|saved|favorite|login|register|vip)$/i.test(slug)) return false;
  // Most MissAV codes use a hyphen (for example abc-123), while the
  // 1pondo/Caribbeancompr/10musume/pacopacomama feeds use date-based
  // underscore IDs such as pondo-072526_001 and 051726_001.
  const standardCode = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i.test(slug) &&
    /[a-z]/i.test(slug) &&
    /\d/.test(slug);
  const dateOnlyCode = /^\d{6}_\d{2,3}$/i.test(slug);
  return standardCode || dateOnlyCode;
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

function paginationInfo(html, page, itemCount) {
  const source = String(html || '');
  let totalPages = 0;
  const pagePattern = /[?&]page=(\d+)/gi;
  let match;
  while ((match = pagePattern.exec(source))) {
    totalPages = Math.max(totalPages, Number(match[1]) || 0);
  }
  const hasMore = hasNextPage(source, page) || (!totalPages && Number(itemCount) >= 12);
  return {
    hasMore: hasMore,
    totalPages: totalPages || undefined
  };
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
