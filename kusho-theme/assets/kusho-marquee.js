/**
 * Accessible marquee (guide 7.5, 16.2).
 * - Only runs on small screens and only when Kusho motion is allowed.
 * - Duplicates the list once (aria-hidden) for a seamless loop; removes the copy otherwise.
 * - Pauses on hover/focus (CSS), off-screen (IntersectionObserver) and via a visible button.
 */
if (!customElements.get('kusho-marquee')) {
  customElements.define(
    'kusho-marquee',
    class KushoMarquee extends HTMLElement {
      connectedCallback() {
        this.list = this.querySelector('[data-marquee-list]');
        this.toggle = this.querySelector('[data-marquee-toggle]');
        if (!this.list) return;

        this.small = window.matchMedia('(max-width: 989px)');
        this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

        this.sync = this.sync.bind(this);
        this.small.addEventListener('change', this.sync);
        this.reduced.addEventListener('change', this.sync);

        this.observer = new IntersectionObserver(([entry]) => {
          this.toggleAttribute('data-offscreen', !entry.isIntersecting);
        });
        this.observer.observe(this);

        if (this.toggle) {
          this.toggle.addEventListener('click', () => {
            const paused = this.toggleAttribute('data-paused');
            this.toggle.setAttribute('aria-pressed', String(paused));
            this.toggle.setAttribute(
              'aria-label',
              paused ? this.toggle.dataset.labelPlay : this.toggle.dataset.labelPause
            );
            this.toggle.querySelector('[data-icon-pause]').hidden = paused;
            this.toggle.querySelector('[data-icon-play]').hidden = !paused;
          });
        }

        this.sync();
      }

      disconnectedCallback() {
        if (this.observer) this.observer.disconnect();
        if (this.small) this.small.removeEventListener('change', this.sync);
        if (this.reduced) this.reduced.removeEventListener('change', this.sync);
      }

      get motionAllowed() {
        return Boolean(window.Kusho && window.Kusho.motionAllowed);
      }

      sync() {
        const active = this.motionAllowed && (this.hasAttribute('data-always') || this.small.matches);
        this.classList.toggle('is-marquee', active);
        this.removeClones();

        if (!active) return;

        Array.from(this.list.children).forEach((item) => {
          const clone = item.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          clone.dataset.marqueeClone = 'true';
          this.list.appendChild(clone);
        });
      }

      removeClones() {
        this.list.querySelectorAll('[data-marquee-clone]').forEach((clone) => clone.remove());
      }
    }
  );
}
