/**
 * Video controller for every Kusho video slot (hero, "how to use" cards, "why" strip). ~1.5 KB.
 *  - A clip plays only while at least a third of it is on screen, and only while the tab is visible.
 *  - It never plays for visitors who prefer reduced motion or have data-saver on: the photo underneath stays.
 *  - Videos are silent, loop and play inline. The file is only downloaded when the clip is about to be seen.
 *  - A small pause / play button appears on each clip (WCAG 2.2.2: moving content that starts by itself
 *    needs a way to stop it).
 * Markup: <video class="kusho-video" muted loop playsinline preload="none">. Add the class kusho-video-host
 * to the parent if it is not already positioned.
 */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const HOSTS = '.kstack__inner, .khero__media, .kwhy__photo, .kusho-video-host';
  const ICONS = {
    pause: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M8 5v14M16 5v14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
  };

  const visible = new Set();
  let io;

  const allowed = () => !reduced.matches && !saveData && !document.hidden;

  function play(video) {
    if (video.dataset.userPaused === 'true' || !allowed()) return;
    video.preload = 'auto';
    const promise = video.play();
    if (promise) promise.then(() => video.classList.add('is-playing')).catch(() => {});
  }

  function sync() {
    document.querySelectorAll('video.kusho-video').forEach((video) => {
      if (visible.has(video) && allowed()) play(video);
      else video.pause();
    });
  }

  function addToggle(video) {
    const host = video.closest(HOSTS) || video.parentElement;
    if (!host || host.querySelector('.kusho-video__toggle')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'kusho-video__toggle';
    button.setAttribute('aria-label', 'Pause video');
    button.innerHTML = ICONS.pause;
    button.hidden = true;
    button.addEventListener('click', () => {
      const pausing = !video.paused;
      video.dataset.userPaused = String(pausing);
      button.setAttribute('aria-label', pausing ? 'Play video' : 'Pause video');
      button.innerHTML = pausing ? ICONS.play : ICONS.pause;
      if (pausing) video.pause();
      else play(video);
    });
    video.addEventListener('playing', () => { button.hidden = false; });
    host.appendChild(button);
  }

  function init(scope = document) {
    if (!io) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) visible.add(entry.target);
            else visible.delete(entry.target);
            if (entry.isIntersecting) play(entry.target);
            else entry.target.pause();
          });
        },
        { threshold: 0.33 }
      );
    }
    scope.querySelectorAll('video.kusho-video:not([data-kv])').forEach((video) => {
      video.dataset.kv = '';
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.removeAttribute('controls');
      addToggle(video);
      io.observe(video);
    });
  }

  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  document.addEventListener('shopify:section:load', (event) => init(event.target));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
  else init();
})();
