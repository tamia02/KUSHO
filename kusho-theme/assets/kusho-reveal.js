/**
 * Premium motion helpers (guide 7.4 / 7.5), loaded on every page, ~2 KB.
 *  - Scroll reveal: elements below the fold fade and rise once as they enter.
 *  - Parallax: [data-parallax="0.06"] drifts against the scroll (desktop only).
 *  - Progress bar: a thin gold line along the top shows how far down the page you are.
 * Only transform and opacity change. Everything stays visible for visitors who prefer reduced motion,
 * and when Theme settings > Kusho > "Enable premium animations" is off.
 */
(() => {
  const allowed = () => Boolean(window.Kusho && window.Kusho.motionAllowed);

  const AUTO = [
    '.product-grid > .grid__item',
    '.kjrn__grid > li',
    '.kblog__grid > li',
    '.ksplit__card',
    '.kwhy__item',
    '.ksteps__item',
    '.khow__step',
    '.kfeature',
    '.kcard-contact',
    '.kstory__grid > li',
    '.kfaqs__intro',
  ];

  let io;
  let bar = null;
  let ticking = false;
  const parallax = new Set();

  function initReveal(scope = document) {
    if (!allowed()) return;
    if (!io) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px 8% 0px' }
      );
    }

    const targets = new Set(scope.querySelectorAll('[data-reveal]'));
    AUTO.forEach((selector) =>
      scope.querySelectorAll(selector).forEach((el) => {
        targets.add(el);
        if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
        if (!el.style.getPropertyValue('--ri')) {
          const index = Array.from(el.parentElement.children).indexOf(el);
          el.style.setProperty('--ri', String(Math.min(index, 6)));
        }
      })
    );

    // Section titles rise in word by word once their block reveals
    scope.querySelectorAll('.ksec-title:not([data-words])').forEach((title) => {
      if (title.children.length) return; // leave titles with markup alone
      const words = title.textContent.trim().split(/\s+/);
      if (words.length < 2 || words.length > 12) return;
      title.setAttribute('data-words', '');
      title.textContent = '';
      words.forEach((word, i) => {
        const span = document.createElement('span');
        span.className = 'kword';
        span.style.setProperty('--w', String(i));
        span.textContent = word;
        title.appendChild(span);
        if (i < words.length - 1) title.appendChild(document.createTextNode(' '));
      });
    });

    targets.forEach((el) => {
      if (el.classList.contains('is-in') || el.hasAttribute('data-reveal-pending')) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) {
        el.classList.add('is-in'); // already on screen: no animation, no flash
        return;
      }
      el.setAttribute('data-reveal-pending', '');
      io.observe(el);
    });
  }

  function initParallax(scope = document) {
    if (!allowed() || window.innerWidth < 750) return;
    scope.querySelectorAll('[data-parallax]').forEach((el) => parallax.add(el));
  }

  function initProgress() {
    if (bar || !allowed()) return;
    bar = document.createElement('span'); // not a div: Dawn hides empty divs (div:empty { display: none })
    bar.className = 'kusho-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
  }

  function update() {
    ticking = false;
    const viewport = window.innerHeight;

    parallax.forEach((el) => {
      if (!el.isConnected) {
        parallax.delete(el);
        return;
      }
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > viewport + 200) return;
      const factor = Number(el.dataset.parallax) || 0.05;
      const offset = (rect.top + rect.height / 2 - viewport / 2) * factor;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });

    if (bar) {
      const max = document.documentElement.scrollHeight - viewport;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0})`;
    }
  }

  const schedule = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  function init(scope = document) {
    initReveal(scope);
    initParallax(scope);
    initProgress();
    schedule();
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('shopify:section:load', (event) => init(event.target));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
  else init();
})();
