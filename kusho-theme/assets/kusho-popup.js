/**
 * Welcome offer popup. Opens once per visitor after a delay (or when they scroll past the first screen,
 * whichever comes first), closes on the backdrop, the X or Escape, and remembers a close or a sign-up
 * for N days in localStorage. Focus moves into the dialog and back out again.
 * In the local preview (window.KushoPreview) the form does not post anywhere; it shows the success state.
 */
if (!customElements.get('kusho-popup')) {
  customElements.define(
    'kusho-popup',
    class KushoPopup extends HTMLElement {
      connectedCallback() {
        this.key = this.dataset.key || 'kusho:popup';
        this.days = Number(this.dataset.days) || 7;
        if (this.snoozed()) return;

        this.dialog = this.querySelector('[role="dialog"]');
        this.form = this.querySelector('form');
        this.onKey = (event) => { if (event.key === 'Escape') this.close(); };

        this.querySelectorAll('[data-popup-close]').forEach((el) => el.addEventListener('click', () => this.close()));
        if (this.form) this.form.addEventListener('submit', (event) => this.submit(event));
        const copy = this.querySelector('[data-popup-copy]');
        if (copy) copy.addEventListener('click', () => this.copy(copy));

        const delay = (Number(this.dataset.delay) || 6) * 1000;
        this.timer = window.setTimeout(() => this.open(), delay);
        this.onScroll = () => { if (window.scrollY > window.innerHeight * 0.8) this.open(); };
        window.addEventListener('scroll', this.onScroll, { passive: true });
      }

      disconnectedCallback() {
        window.clearTimeout(this.timer);
        window.removeEventListener('scroll', this.onScroll);
        document.removeEventListener('keydown', this.onKey);
      }

      snoozed() {
        try {
          const until = Number(window.localStorage.getItem(this.key) || 0);
          return until > Date.now();
        } catch (e) {
          return false;
        }
      }

      remember() {
        try {
          window.localStorage.setItem(this.key, String(Date.now() + this.days * 864e5));
        } catch (e) {
          /* private mode: fine, it just shows again next visit */
        }
      }

      open() {
        if (this.opened) return;
        this.opened = true;
        window.clearTimeout(this.timer);
        window.removeEventListener('scroll', this.onScroll);
        this.returnFocus = document.activeElement;
        this.hidden = false;
        window.requestAnimationFrame(() => this.classList.add('is-open'));
        document.addEventListener('keydown', this.onKey);
        const first = this.querySelector('input, button');
        if (first) first.focus({ preventScroll: true });
      }

      close() {
        this.remember();
        this.classList.remove('is-open');
        document.removeEventListener('keydown', this.onKey);
        window.setTimeout(() => { this.hidden = true; }, 320);
        if (this.returnFocus && this.returnFocus.focus) this.returnFocus.focus({ preventScroll: true });
      }

      submit(event) {
        if (!this.form.checkValidity()) return; // native messages
        this.remember();
        const success = this.querySelector('[data-popup-success]');
        const formBox = this.querySelector('[data-popup-form]');
        if (window.KushoPreview) {
          event.preventDefault();
          formBox.hidden = true;
          success.hidden = false;
          return;
        }
        // On Shopify the customer form posts and reloads with ?customer_posted=true; show the success then.
      }

      async copy(button) {
        const code = button.dataset.code;
        try {
          await navigator.clipboard.writeText(code);
          const label = button.querySelector('[data-copy-label]');
          if (label) label.textContent = 'Copied';
        } catch (e) {
          /* clipboard blocked: the code is visible anyway */
        }
      }
    }
  );

  // After a real sign-up Shopify reloads the page with ?customer_posted=true: show the success panel.
  if (/customer_posted=true/.test(window.location.search)) {
    window.addEventListener('DOMContentLoaded', () => {
      const popup = document.querySelector('kusho-popup');
      if (!popup) return;
      popup.hidden = false;
      popup.classList.add('is-open');
      popup.querySelector('[data-popup-form]').hidden = true;
      popup.querySelector('[data-popup-success]').hidden = false;
    });
  }
}
