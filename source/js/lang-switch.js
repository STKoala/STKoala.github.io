(function () {
  function normalizeLanguageLinks() {
    document.querySelectorAll('.lang-switch a').forEach(link => {
      if (link.getAttribute('target') !== '_self') {
        link.setAttribute('target', '_self');
      }
      if (link.dataset.langSwitchBound === 'true') return;
      link.dataset.langSwitchBound = 'true';
      link.addEventListener('click', () => {
        if (link.getAttribute('target') !== '_self') {
          link.setAttribute('target', '_self');
        }
      });
    });
  }

  function observeLanguageSwitcher() {
    const switcher = document.querySelector('.lang-switch');
    if (!switcher || switcher.dataset.langSwitchObserved === 'true') return;
    switcher.dataset.langSwitchObserved = 'true';
    const observer = new MutationObserver(normalizeLanguageLinks);
    observer.observe(switcher, {
      subtree: true,
      attributes: true,
      attributeFilter: ['target']
    });
  }

  function init() {
    normalizeLanguageLinks();
    observeLanguageSwitcher();
    [0, 50, 250, 1000].forEach(delay => {
      window.setTimeout(normalizeLanguageLinks, delay);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
