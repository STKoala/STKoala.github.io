(function () {
  const languages = [
    { code: 'zh-CN', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'en', label: 'English' }
  ];

  function detectLanguageFromPath(path) {
    if (/^\/en(\/|$)/.test(path)) return 'en';
    if (/^\/ja(\/|$)/.test(path)) return 'ja';
    return 'zh-CN';
  }

  function detectPostLanguage(card) {
    const link = card.querySelector('a[href]');
    if (!link) return 'zh-CN';
    const href = link.getAttribute('href') || '';
    try {
      return detectLanguageFromPath(new URL(href, window.location.origin).pathname);
    } catch (_error) {
      return detectLanguageFromPath(href);
    }
  }

  function resetArticleGrid() {
    const container = document.querySelector('#articles');
    if (!container) return;

    if (window.jQuery) {
      const $container = window.jQuery(container);
      if (typeof $container.masonry === 'function' && $container.data('masonry')) {
        $container.masonry('destroy');
      }
    }

    container.style.height = '';
    container.querySelectorAll('.article').forEach(card => {
      card.style.position = '';
      card.style.left = '';
      card.style.top = '';
      card.style.right = '';
      card.style.bottom = '';
      card.style.width = '';
      card.style.transform = '';
    });
  }

  function applyLanguage(lang, buttons, cards) {
    buttons.forEach(button => {
      const active = button.dataset.lang === lang;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    cards.forEach(card => {
      card.hidden = card.dataset.lang !== lang;
    });

    window.localStorage.setItem('home-post-language', lang);
    resetArticleGrid();
  }

  function init() {
    const articleList = document.querySelector('#articles .article-row');
    if (!articleList || document.querySelector('.home-lang-filter-wrapper')) return;

    const cards = Array.from(articleList.querySelectorAll('.article'));
    if (!cards.length) return;

    cards.forEach(card => {
      card.dataset.lang = detectPostLanguage(card);
    });

    const available = new Set(cards.map(card => card.dataset.lang));
    if (available.size < 2) return;

    const controls = document.createElement('div');
    controls.className = 'home-lang-filter';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Post language filter');

    const buttons = languages
      .filter(lang => available.has(lang.code))
      .map(lang => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'home-lang-filter__button';
        button.dataset.lang = lang.code;
        button.textContent = lang.label;
        button.addEventListener('click', () => applyLanguage(lang.code, buttons, cards));
        controls.appendChild(button);
        return button;
      });

    const wrapper = document.createElement('div');
    wrapper.className = 'home-lang-filter-wrapper article col s12';
    wrapper.appendChild(controls);
    articleList.insertBefore(wrapper, articleList.firstChild);

    const saved = window.localStorage.getItem('home-post-language');
    const initial = available.has(saved) ? saved : detectLanguageFromPath(window.location.pathname);
    applyLanguage(available.has(initial) ? initial : 'zh-CN', buttons, cards);
    window.addEventListener('load', resetArticleGrid, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
