/**
 * Homepage opening sequence (guide 7.3 "signature" motion).
 * The hero and the [data-slide] sections that follow it are each one screen tall and the page snaps
 * between them (CSS scroll-snap, so it is native on phones and never fights the scrollbar). This script:
 *  - adds .is-active to the slide on screen, which plays that slide's entrance (see kusho-slides.css)
 *  - builds the small dot navigation on the left and keeps it in sync
 *  - hides the dots once the visitor scrolls past the sequence
 * Without motion (reduced motion or the theme switch) slides are simply visible and there is no snapping.
 */
(() => {
  const allowed = () => Boolean(window.Kusho && window.Kusho.motionAllowed);
  const hero = document.querySelector('.kusho-hero-section');
  const slides = Array.from(document.querySelectorAll('[data-slide]'));
  if (!hero || !slides.length || !allowed()) return;

  const all = [hero, ...slides];
  document.documentElement.classList.add('kusho-snap');

  // Dots
  const nav = document.createElement('nav');
  nav.className = 'kdots';
  nav.setAttribute('aria-label', 'Opening sections');
  const list = document.createElement('ol');
  list.setAttribute('role', 'list');
  const dots = all.map((el, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'kdots__dot';
    a.href = `#${el.id || (el.id = `kusho-slide-${i}`)}`;
    const label = el.dataset.slideLabel || (i === 0 ? 'Start' : `Section ${i + 1}`);
    a.setAttribute('aria-label', label);
    a.innerHTML = `<span class="kdots__mark" aria-hidden="true"></span><span class="kdots__label">${label}</span>`;
    a.addEventListener('click', (event) => {
      event.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    li.appendChild(a);
    list.appendChild(li);
    return a;
  });
  nav.appendChild(list);
  document.body.appendChild(nav);

  const setActive = (index) => {
    all.forEach((el, i) => el.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-current', i === index);
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(all.indexOf(entry.target));
      });
    },
    { threshold: [0.3, 0.6] }
  );
  all.forEach((el) => io.observe(el));

  // Safety net: a slide taller than the screen may never reach the ratio above, so also activate the slide whose
  // top half is on screen as the page scrolls.
  let raf = 0;
  window.addEventListener('scroll', () => {
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      const mid = window.innerHeight * 0.5;
      const i = all.findIndex((el) => { const r = el.getBoundingClientRect(); return r.top <= mid && r.bottom >= mid; });
      if (i >= 0 && !all[i].classList.contains('is-active')) setActive(i);
    });
  }, { passive: true });

  // Dots only while the sequence is on screen
  const last = slides[slides.length - 1];
  const gate = new IntersectionObserver(
    () => {
      const end = last.getBoundingClientRect().bottom;
      nav.classList.toggle('is-hidden', end < window.innerHeight * 0.5);
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] }
  );
  gate.observe(last);
  window.addEventListener('scroll', () => {
    const end = last.getBoundingClientRect().bottom;
    nav.classList.toggle('is-hidden', end < window.innerHeight * 0.5);
  }, { passive: true });

  setActive(0);
})();
