// Robust Alpine store bootstrap (works whether Alpine is already loaded or not)
(function initThemeStore() {
  function start() {
    if (!window.Alpine) return;
    Alpine.store('theme', themeStore());
    Alpine.store('theme').init();
  }
  if (window.Alpine) start();
  else document.addEventListener('alpine:init', start);
})();

function themeStore() {
  return {
    isDark: true,
    init() {
      try {
        const saved = localStorage.getItem('theme');
        if (saved) {
          this.isDark = saved === 'dark';
        } else {
          this.isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
      } catch (_) { this.isDark = true; }
      document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
    },
    toggle() {
      this.isDark = !this.isDark;
      document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
      localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    }
  };
}

function portfolioApp() {
  const supportedTabs = new Set(['home', 'projects', 'about', 'contact']);
  const initialTabRaw = (location.hash || '#home').replace('#','');
  return {
    currentTab: supportedTabs.has(initialTabRaw) ? initialTabRaw : 'home',
    animState: { leaving: null, entering: null },
    init() {
      console.log('Portfolio app initialized!');
      const setHeaderHeightVar = () => {
        try {
          const header = document.querySelector('header.site-header');
          if (!header) return;
          const h = header.getBoundingClientRect().height;
          document.documentElement.style.setProperty('--header-h', h + 'px');
        } catch (_) { /* noop */ }
      };
      setHeaderHeightVar();
      window.addEventListener('resize', setHeaderHeightVar, { passive: true });
      const updateHeroCenter = () => {
        try {
          const projectsLink = document.querySelector('nav.main-nav a[href="#projects"]');
          if (!projectsLink) return;
          const rect = projectsLink.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          // Convert px to percentage of viewport width to keep it responsive
          const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
          const percent = (centerX / vw) * 100;
          document.documentElement.style.setProperty('--hero-center-x', percent + 'vw');
        } catch (_) { /* noop */ }
      };

      const setHeroActive = (isActive) => {
        try {
          const wide = document.getElementById('wide-hero');
          const narrow = document.getElementById('narrow-hero');
          const toggle = (el) => {
            if (!el) return;
            // Always remove first to reset state
            el.classList.remove('entering');
            if (isActive) {
              // Force reflow so the subsequent add triggers transition
              void el.offsetWidth;
              el.classList.add('entering');
            }
          };
          toggle(wide);
          toggle(narrow);
        } catch (_) { /* noop */ }
      };

      // Initial alignment
      updateHeroCenter();
      window.addEventListener('resize', updateHeroCenter, { passive: true });
      setHeroActive(this.currentTab === 'home');

      const onHash = () => {
        const h = (location.hash || '#home').replace('#','');
        console.log('Hash changed to:', h);
        if (supportedTabs.has(h)) {
          const prev = this.currentTab;
          if (h === prev) return;
          // add exiting class to previous pane
          try {
            const prevEl = document.querySelector(`section[data-tab="${prev}"] .tab-pane`) || document.querySelector(`section[data-tab="${prev}"]`);
            if (prevEl) {
              prevEl.classList.remove('entering');
              prevEl.classList.add('exiting');
            }
          } catch(_) {}
          // fade out hero when leaving Home
          if (prev === 'home') {
            try {
              const wide = document.getElementById('wide-hero');
              if (wide) {
                wide.classList.remove('entering');
                void wide.offsetWidth; // restart
                wide.classList.add('leaving');
              }
            } catch(_) {}
            setHeroActive(false);
          }
          // after fade-out, switch tab and play fade-in
          setTimeout(() => {
            this.currentTab = h;
            console.log('Current tab set to:', this.currentTab);
            try {
              const nextEl = document.querySelector(`section[data-tab="${h}"] .tab-pane`) || document.querySelector(`section[data-tab="${h}"]`);
              if (nextEl) {
                // force reflow to restart animation
                void nextEl.offsetWidth;
                nextEl.classList.remove('exiting');
                nextEl.classList.add('entering');
              }
            } catch(_) {}
            // hero fade state
            try {
              const wide = document.getElementById('wide-hero');
              if (wide) wide.classList.remove('leaving');
            } catch(_) {}
            setHeroActive(h === 'home');
            updateHeroCenter();
          }, 230);
          // Recompute center when navigating
          updateHeroCenter();
        }
      };
      window.addEventListener('hashchange', onHash);
      onHash(); // Run once on init
    }
  };
}

// Make sure Alpine.js can find the function
window.portfolioApp = portfolioApp;
// No additional app logic

// Extend projects dataset if present on the page
document.addEventListener('alpine:init', () => {
  try {
    const addProject = {
      id: 'walmart-sales',
      title: 'Walmart Sales Regression',
      type: 'Notebook',
      description: 'End-to-end regression modeling to forecast weekly sales with regularization and overfitting controls.',
      tags: ['Regression', 'Python', 'Notebook', 'Modeling'],
      thumbnail: './media/thumbs/walmart-sales.svg',
      embedUrl: 'https://github.com/Jkrol6675/walmart_sales_analysis/tree/main/walmart_sales',
      sourceUrl: 'https://github.com/Jkrol6675/walmart_sales_analysis/tree/main/walmart_sales'
    };
    // If an Alpine scope exposes a projects array, append safely
    setTimeout(() => {
      const scopes = document.querySelectorAll('[x-data]');
      scopes.forEach((el) => {
        try {
          const ctx = Alpine.$data(el);
          if (ctx && Array.isArray(ctx.projects)) {
            const exists = ctx.projects.some(p => p.id === addProject.id);
            if (!exists) ctx.projects.push(addProject);
          }
        } catch (_) {}
      });
    }, 0);
  } catch (_) {}
});

// THEME → NOTEBOOK HTML SYNC (applies to any same-origin iframe)
(function enableNotebookThemeSync() {
  function themeName() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  function themeCSS(theme) {
    if (theme === 'light') {
      return `
        :root{color-scheme:light}
        html,body{background:#f8f9fc!important;color:#111827!important}
        a{color:#185cff!important}
        pre,code{background:#eef2ff!important;color:#111827!important}
        table, .dataframe{background:#ffffff!important;color:#111827!important;border-collapse:collapse}
        th,td{border:1px solid #e5e7eb!important;padding:6px 8px}
        thead th{background:#f3f4f6!important;font-weight:600}
      `;
    }
    return `
      :root{color-scheme:dark}
      html,body{background:#0e0e12!important;color:#e6e6ee!important}
      /* Force base text color across common inline containers */
      body, p, li, span, div, td, th, code, pre, kbd, samp, blockquote, dd, dt, figcaption, caption{color:#e6e6ee!important}
      a{color:#9fd8ff!important}
      pre,code{background:#16181d!important;color:#e6e6ee!important}
      .highlight, .highlight pre, .highlight code, pre code{color:#e6e6ee!important}
      table, .dataframe{background:#12151a!important;color:#e6e6ee!important;border-collapse:collapse}
      th,td{border:1px solid #2a2f3a!important;padding:6px 8px}
      thead th{background:#1b1f28!important;font-weight:600}
      tbody tr:nth-child(odd), .dataframe tbody tr:nth-child(odd){background:#10141a!important}
      tbody tr:nth-child(even), .dataframe tbody tr:nth-child(even){background:#161b22!important}
      .output, .output_html, .rendered_html, .text_cell_render, .jp-RenderedHTMLCommon{color:#e6e6ee!important}
      p, li, h1, h2, h3, h4, h5, h6, figcaption, caption{color:#e6e6ee!important}
      /* Prompts / streams */
      .prompt, .output_stream, .stderr, .stdout{color:#e6e6ee!important}
      svg text{fill:#e6e6ee!important}
      svg .tick text{fill:#e6e6ee!important}
      svg path, svg line{stroke:#cfd3dc!important}
      img{filter:invert(0.92) hue-rotate(180deg) saturate(0.9)}
      img[data-no-invert]{filter:none}
      /* Syntax highlighting (Pygments / nbconvert) */
      .highlight{background:#0f1319!important;color:#e6e6ee!important}
      .highlight .c, .highlight .cm, .highlight .cp, .highlight .c1{color:#a7b0be!important;font-style:italic}
      .highlight .k, .highlight .kr, .highlight .kd, .highlight .kn{color:#d6b9ff!important}
      .highlight .s, .highlight .s1, .highlight .s2, .highlight .sb, .highlight .sa, .highlight .se{color:#b6f1c5!important}
      .highlight .n, .highlight .nx, .highlight .nn, .highlight .nc, .highlight .nf{color:#b4d4ff!important}
      .highlight .o, .highlight .p, .highlight .ow{color:#aee6ff!important}
      .highlight .m, .highlight .mi, .highlight .mf{color:#ffc49a!important}
      .highlight .gd{color:#ffa3a3!important}
      .highlight .gi{color:#8fe9c3!important}
      /* ANSI colors commonly used in rich outputs */
      .ansi-black-fg{color:#c4c7d1!important}
      .ansi-red-fg{color:#ffb8bf!important}
      .ansi-green-fg{color:#a5ebc8!important}
      .ansi-yellow-fg{color:#ffe5b3!important}
      .ansi-blue-fg{color:#bfe2ff!important}
      .ansi-magenta-fg{color:#e8ceff!important}
      .ansi-cyan-fg{color:#c4eef4!important}
      .ansi-white-fg{color:#f0f0f5!important}
      .ansi-bold{font-weight:600}
      /* highlight.js token fallbacks (in case notebook used hljs instead of pygments) */
      .hljs, pre code.hljs, code.hljs{background:#0f1319!important;color:#e6e6ee!important}
      .hljs-comment,.hljs-quote{color:#a7b0be!important;font-style:italic}
      .hljs-keyword,.hljs-selector-tag,.hljs-subst{color:#d6b9ff!important}
      .hljs-string,.hljs-title,.hljs-name,.hljs-attribute,.hljs-type{color:#b6f1c5!important}
      .hljs-number,.hljs-literal{color:#ffc49a!important}
      .hljs-built_in,.hljs-builtin-name,.hljs-symbol,.hljs-bullet{color:#b4d4ff!important}
      .hljs-addition{color:#8fe9c3!important}
      .hljs-deletion{color:#ffa3a3!important}
    `;
  }
  function injectTheme(iframe) {
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const head = doc.head || doc.getElementsByTagName('head')[0];
      if (!head) return;
      let style = doc.getElementById('theme-bridge');
      if (!style) {
        style = doc.createElement('style');
        style.id = 'theme-bridge';
        head.appendChild(style);
      }
      style.textContent = themeCSS(themeName());
    } catch (_) {
      // Cross-origin iframes can't be themed; ignore
    }
  }
  function applyToAll() {
    document.querySelectorAll('iframe.overlay-frame, iframe[data-theme-sync="notebook"]').forEach((f) => injectTheme(f));
  }
  // On load of each relevant iframe
  function hookFrame(f) {
    try { f.addEventListener('load', () => injectTheme(f), { passive: true }); } catch (_) {}
  }
  document.querySelectorAll('iframe.overlay-frame, iframe[data-theme-sync="notebook"]').forEach(hookFrame);
  // Observe DOM for newly added iframes (e.g., overlay opens)
  new MutationObserver((muts) => {
    muts.forEach((m) => m.addedNodes && m.addedNodes.forEach((n) => {
      if (n.tagName === 'IFRAME' && (n.classList.contains('overlay-frame') || n.getAttribute('data-theme-sync') === 'notebook')) hookFrame(n);
      if (n.querySelectorAll) n.querySelectorAll('iframe.overlay-frame, iframe[data-theme-sync="notebook"]').forEach(hookFrame);
    }));
  }).observe(document.documentElement, { childList: true, subtree: true });
  // Apply now and on theme changes
  applyToAll();
  new MutationObserver(applyToAll).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();

