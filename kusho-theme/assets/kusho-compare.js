/**
 * Before / after slider with tabs (guide 7.4-E).
 * The slider is a native <input type="range"> laid over the photos, so pointer, touch and keyboard
 * (arrow keys, Home, End, Page Up/Down) all work without extra code. This script mirrors the value into a CSS
 * variable, switches tabs, and plays a short "demo" sweep the first time the slider scrolls into view so
 * people see that it can be dragged. The sweep stops the moment the visitor touches it.
 */
if (!customElements.get('kusho-compare')) {
  customElements.define(
    'kusho-compare',
    class KushoCompare extends HTMLElement {
      connectedCallback() {
        this.tabs = Array.from(this.querySelectorAll('[data-tab]'));
        this.panels = Array.from(this.querySelectorAll('[data-panel]'));
        this.interacted = false;
        this.demoDone = false;
        this.frame = null;

        this.panels.forEach((panel) => {
          const stage = panel.querySelector('[data-stage]');
          const range = panel.querySelector('[data-range]');
          if (!stage || !range) return;

          const update = () => {
            stage.style.setProperty('--pos', `${range.value}%`);
            range.setAttribute('aria-valuetext', `${range.value}% before`);
          };
          range.addEventListener('input', update);

          const stop = () => {
            this.interacted = true;
            if (this.frame) window.cancelAnimationFrame(this.frame);
          };
          ['pointerdown', 'keydown', 'touchstart'].forEach((type) => range.addEventListener(type, stop, { passive: true }));
          update();
        });

        this.tabs.forEach((tab, index) => {
          tab.addEventListener('click', () => this.select(index));
          tab.addEventListener('keydown', (event) => {
            const last = this.tabs.length - 1;
            let next = null;
            if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
            if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = last;
            if (next === null) return;
            event.preventDefault();
            this.select(next, true);
          });
        });

        if (window.Kusho && window.Kusho.motionAllowed && 'IntersectionObserver' in window) {
          this.observer = new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting && !this.demoDone && !this.interacted) {
                this.demoDone = true;
                this.demo();
              }
            },
            { threshold: 0.55 }
          );
          this.observer.observe(this);
        }
      }

      disconnectedCallback() {
        if (this.observer) this.observer.disconnect();
        if (this.frame) window.cancelAnimationFrame(this.frame);
      }

      get activeRange() {
        return this.querySelector('[data-panel]:not([hidden]) [data-range]');
      }

      /** 58 -> 24 -> 82 -> 58 over about 2.6 seconds, eased. */
      demo() {
        const range = this.activeRange;
        if (!range) return;
        const keys = [58, 24, 82, 58];
        const total = 2600;
        const start = performance.now();
        const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

        const tick = (now) => {
          if (this.interacted) return;
          const t = Math.min(1, (now - start) / total);
          const scaled = t * (keys.length - 1);
          const i = Math.min(keys.length - 2, Math.floor(scaled));
          const value = keys[i] + (keys[i + 1] - keys[i]) * ease(scaled - i);
          range.value = String(Math.round(value));
          range.dispatchEvent(new Event('input', { bubbles: true }));
          if (t < 1) this.frame = window.requestAnimationFrame(tick);
        };
        this.frame = window.requestAnimationFrame(tick);
      }

      select(index, focus = false) {
        this.tabs.forEach((tab, i) => {
          const active = i === index;
          tab.setAttribute('aria-selected', String(active));
          tab.tabIndex = active ? 0 : -1;
          if (active && focus) tab.focus();
        });
        this.panels.forEach((panel, i) => {
          panel.hidden = i !== index;
        });
      }
    }
  );
}
