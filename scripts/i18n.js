'use strict';

const { Permalink, createSha1Hash, slugize } = require('hexo-util');
const { basename } = require('path');

const DEFAULT_LANG = 'zh-CN';
const LANGUAGE_ORDER = ['zh-CN', 'ja', 'en'];
const LANGUAGES = {
  'zh-CN': {
    label: '中文',
    pathPrefix: ''
  },
  ja: {
    label: '日本語',
    pathPrefix: 'ja'
  },
  en: {
    label: 'English',
    pathPrefix: 'en'
  }
};

const permalinkCache = new Map();

function normalizeLang(lang) {
  if (!lang) return DEFAULT_LANG;
  const value = String(lang).toLowerCase();
  if (value === 'zh' || value === 'zh-cn' || value === 'zh_cn') return 'zh-CN';
  if (value === 'ja' || value === 'jp' || value === 'ja-jp') return 'ja';
  if (value === 'en' || value === 'en-us' || value === 'en-gb') return 'en';
  return DEFAULT_LANG;
}

function stripLanguageSuffix(slug) {
  return String(slug || '').replace(/\.(zh-cn|zh|ja|jp|en)$/i, '');
}

function translationKey(post) {
  return String(
    post.translation_key ||
    post.translationKey ||
    post.i18n_key ||
    stripLanguageSuffix(post.slug)
  );
}

function translationSlug(post, lang) {
  return String(
    post.translation_slug ||
    post.translationSlug ||
    stripLanguageSuffix(post.slug)
  );
}

function getPermalink(rule) {
  if (!permalinkCache.has(rule)) {
    permalinkCache.set(rule, new Permalink(rule, {}));
  }
  return permalinkCache.get(rule);
}

function buildLocalizedPermalink(post, lang, config) {
  const langConfig = LANGUAGES[lang];
  if (!langConfig || !langConfig.pathPrefix) return null;

  const rule = `${langConfig.pathPrefix}/${config.permalink || ':year/:month/:day/:title/'}`;
  const slug = translationSlug(post, lang);
  const hash = slug && post.date
    ? createSha1Hash().update(slug + post.date.unix().toString()).digest('hex').slice(0, 12)
    : null;
  const meta = {
    id: post.id || post._id,
    title: slug,
    name: typeof slug === 'string' ? basename(slug) : '',
    post_title: slugize(post.title, { transform: 1 }),
    year: post.date.format('YYYY'),
    month: post.date.format('MM'),
    day: post.date.format('DD'),
    hour: post.date.format('HH'),
    minute: post.date.format('mm'),
    second: post.date.format('ss'),
    i_month: post.date.format('M'),
    i_day: post.date.format('D'),
    hash,
    category: config.default_category
  };

  if (post.categories && post.categories.length) {
    meta.category = post.categories.last().slug;
  }

  Object.keys(post).forEach(key => {
    if (Object.prototype.hasOwnProperty.call(meta, key)) return;
    Object.defineProperty(meta, key, Object.getOwnPropertyDescriptor(post, key));
  });

  if (config.permalink_defaults) {
    Object.keys(config.permalink_defaults).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(meta, key)) {
        meta[key] = config.permalink_defaults[key];
      }
    });
  }

  let path = getPermalink(rule).stringify(meta);
  if (config.post_asset_folder && !path.endsWith('/') && !path.endsWith('.html')) {
    path += '/';
  }
  return path;
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function urlFor(path, config) {
  const root = config.root || '/';
  return `${root.replace(/\/?$/, '/')}${String(path).replace(/^\/+/, '')}`;
}

function collectPosts(hexo) {
  const posts = hexo.locals.get('posts');
  if (!posts || !posts.data) return [];
  return posts.data.filter(post => post && post.published !== false);
}

function languageSwitchHtml(currentPost, relatedPosts, config) {
  const currentLang = normalizeLang(currentPost.lang || currentPost.language);
  const links = LANGUAGE_ORDER.map(lang => {
    const post = relatedPosts.find(item => normalizeLang(item.lang || item.language) === lang);
    if (!post) return null;
    const label = LANGUAGES[lang].label;
    if (lang === currentLang) {
      return `<span class="lang-switch__current" aria-current="page">${htmlEscape(label)}</span>`;
    }
    return `<a class="lang-switch__link lang-switch__link-${htmlEscape(lang.toLowerCase())}" href="${htmlEscape(urlFor(post.path, config))}" hreflang="${htmlEscape(lang)}">${htmlEscape(label)}</a>`;
  }).filter(Boolean);

  if (links.length < 2) return '';

  return [
    '<nav class="lang-switch" aria-label="Language switcher">',
    links.join('<span class="lang-switch__separator" aria-hidden="true">|</span>'),
    '</nav>'
  ].join('');
}

hexo.extend.filter.register('post_permalink', function localizePostPermalink(post) {
  if (!post || typeof post !== 'object') return post;
  if (post.__permalink) return post;

  const lang = normalizeLang(post.lang || post.language);
  if (lang === DEFAULT_LANG) return post;

  const path = buildLocalizedPermalink(post, lang, this.config);
  if (path) post.__permalink = path;
  return post;
}, 5);

hexo.extend.filter.register('template_locals', function injectLanguageSwitch(locals) {
  if (!locals || !locals.page || locals.page.layout !== 'post') return locals;

  const key = translationKey(locals.page);
  const relatedPosts = collectPosts(this)
    .filter(post => translationKey(post) === key)
    .sort((a, b) => {
      const aIndex = LANGUAGE_ORDER.indexOf(normalizeLang(a.lang || a.language));
      const bIndex = LANGUAGE_ORDER.indexOf(normalizeLang(b.lang || b.language));
      return aIndex - bIndex;
    });

  const switcher = languageSwitchHtml(locals.page, relatedPosts, this.config);
  if (switcher) {
    locals.page.content = `${switcher}\n${locals.page.content}`;
  }

  return locals;
});

hexo.extend.injector.register('head_end', () => {
  return `<link rel="stylesheet" href="${htmlEscape(urlFor('css/lang-switch.css', hexo.config))}">`;
}, 'post');

hexo.extend.injector.register('head_end', () => {
  return `<link rel="stylesheet" href="${htmlEscape(urlFor('css/home-language-filter.css', hexo.config))}">`;
}, 'home');

hexo.extend.injector.register('body_end', () => {
  return `<script src="${htmlEscape(urlFor('js/home-language-filter.js', hexo.config))}"></script>`;
}, 'home');
