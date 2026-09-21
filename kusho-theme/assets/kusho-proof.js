/**
 * Review notifications: shows one real review card at a time in the corner.
 * First after `data-first` seconds, visible for `data-show`, then a `data-gap` pause; at most `data-max` per
 * page; the order is shuffled so repeat visitors see different ones. Closing stops it for the session.
 * Pauses while the tab is hidden and never shows over an open popup.
 */
if (!customElements.get('kusho-proof')) {
  customElements.define(
    'kusho-proof',
    class KushoProof extends HTMLElement {
      connectedCallback() {
        try {
          if (window.sessionStorage.getItem('kusho:proof:off') === '1') return;
        } catch (e) { /* ignore */ }
        this.items = Array.from(this.querySelectorAll('[data-proof-item]'));
        if (!this.items.length) return;
        for (let i = this.items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this.items[i], this.items[j]] = [this.items[j], this.items[i]]; }
        this.shown = 0;
        this.max = Number(this.dataset.max) || 4;
        this.showFor = (Number(this.dataset.show) || 6) * 1000;
        this.gap = (Number(this.dataset.gap) || 25) * 1000;
        this.querySelectorAll('[data-proof-close]').forEach((b) => b.addEventListener('click', () => this.stop()));
        this.timer = window.setTimeout(() => this.next(), (Number(this.dataset.first) || 9) * 1000);
      }

      disconnectedCallback() {
        window.clearTimeout(this.timer);
      }

      next() {
        if (this.shown >= this.max) return;
        const popupOpen = document.querySelector('kusho-popup.is-open');
        if (document.hidden || popupOpen) { this.timer = window.setTimeout(() => this.next(), 5000); return; }
        const item = this.items[this.shown % this.items.length];
        this.items.forEach((el) => { el.hidden = el !== item; });
        this.classList.add('is-visible');
        this.shown += 1;
        this.timer = window.setTimeout(() => {
          this.classList.remove('is-visible');
          this.timer = window.setTimeout(() => this.next(), this.gap);
        }, this.showFor);
      }

      stop() {
        window.clearTimeout(this.timer);
        this.classList.remove('is-visible');
        try { window.sessionStorage.setItem('kusho:proof:off', '1'); } catch (e) { /* ignore */ }
      }
    }
  );
}
