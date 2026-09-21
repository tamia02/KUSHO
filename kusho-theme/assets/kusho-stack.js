/**
 * Stacking "how to use" cards (desktop). Cards are position: sticky in CSS, so they pile up as you scroll.
 * This script only scales and dims the card that is being covered, and highlights the current step in the index.
 * On phones and for reduced motion the cards are a plain vertical list.
 */
document.querySelectorAll('[data-stack]').forEach((stack) => {
  const section = stack.closest('.kstack');
  const cards = Array.from(stack.querySelectorAll('[data-card]'));
  const items = section ? Array.from(section.querySelectorAll('[data-index-item]')) : [];
  const desktop = window.matchMedia('(min-width: 990px)');
  let ticking = false;

  const reset = () => {
    cards.forEach((card) => {
      const inner = card.querySelector('.kstack__inner');
      inner.style.transform = '';
      inner.style.removeProperty('--dim');
    });
  };

  const update = () => {
    ticking = false;
    if (!desktop.matches || !(window.Kusho && window.Kusho.motionAllowed)) {
      reset();
      return;
    }

    let active = 0;
    cards.forEach((card, i) => {
      const inner = card.querySelector('.kstack__inner');
      const next = cards[i + 1];
      const rect = card.getBoundingClientRect();
      const stuck = parseFloat(getComputedStyle(card).top) || 0;
      if (rect.top <= stuck + 4) active = i;

      if (!next) {
        inner.style.transform = '';
        inner.style.setProperty('--dim', '0');
        return;
      }
      const distance = next.getBoundingClientRect().top - (rect.top + 24);
      const progress = Math.max(0, Math.min(1, 1 - distance / (rect.height * 0.9)));
      inner.style.transform = `scale(${(1 - 0.05 * progress).toFixed(4)})`;
      inner.style.setProperty('--dim', (0.55 * progress).toFixed(3));
    });

    items.forEach((item, i) => item.classList.toggle('is-active', i === active));
  };

  const schedule = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  desktop.addEventListener('change', schedule);
  update();
});
