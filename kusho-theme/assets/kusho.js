/**
 * Kusho core helpers (loaded on every page, deferred, ~1 KB).
 * Feature scripts (announcement, hero, press-to-feel, anatomy …) live in their own files
 * and are loaded only by the sections that use them.
 */
(() => {
  const root = document.documentElement;
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /** Shared guard for every animation script: master switch AND visitor preference. */
  window.Kusho = {
    get motionAllowed() {
      return root.hasAttribute('data-kusho-motion') && !reducedQuery.matches;
    },
  };

  /* Header gains a soft shadow after 80px of scroll (guide 7.5). */
  let ticking = false;
  const updateScrolled = () => {
    ticking = false;
    root.toggleAttribute('data-kusho-scrolled', window.scrollY > 80);
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateScrolled);
    },
    { passive: true }
  );
  updateScrolled();

  /* Cart count bubble bumps when the header re-renders after add-to-cart (guide 7.5). */
  const bindCartBump = () => {
    const icon = document.getElementById('cart-icon-bubble');
    if (!icon || icon.dataset.kushoBump) return;
    icon.dataset.kushoBump = 'true';

    new MutationObserver(() => {
      if (!window.Kusho.motionAllowed) return;
      const bubble = icon.querySelector('.cart-count-bubble');
      if (!bubble) return;
      bubble.classList.remove('is-bumping');
      void bubble.offsetWidth; // restart the animation
      bubble.classList.add('is-bumping');
    }).observe(icon, { childList: true, subtree: true });
  };

  bindCartBump();
  document.addEventListener('shopify:section:load', bindCartBump);
})();
