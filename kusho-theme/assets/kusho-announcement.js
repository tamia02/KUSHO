/**
 * Announcement bar + countdown (guide 10.1).
 * - Cross-fades one message at a time every 4s.
 * - Pauses on hover/focus, when the tab is hidden, and via an explicit pause button.
 * - Never auto-rotates for visitors who prefer reduced motion.
 * - Dismiss is remembered for the session.
 */
if (!customElements.get('kusho-announcement')) {
  customElements.define(
    'kusho-announcement',
    class KushoAnnouncement extends HTMLElement {
      connectedCallback() {
        this.messages = Array.from(this.querySelectorAll('[data-message]'));
        this.live = this.querySelector('[data-messages]');
        this.pauseButton = this.querySelector('[data-action="pause"]');
        this.interval = Number(this.dataset.interval) || 4000;
        this.index = 0;
        this.timer = null;
        this.userPaused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.hoverPaused = false;

        this.addEventListener('click', this.onClick.bind(this));
        this.addEventListener('pointerenter', () => this.setHover(true));
        this.addEventListener('pointerleave', () => this.setHover(false));
        this.addEventListener('focusin', () => this.setHover(true));
        this.addEventListener('focusout', () => this.setHover(false));

        this.onVisibility = () => this.schedule();
        document.addEventListener('visibilitychange', this.onVisibility);

        this.syncPauseButton();
        this.schedule();
      }

      disconnectedCallback() {
        this.stop();
        document.removeEventListener('visibilitychange', this.onVisibility);
      }

      get canRotate() {
        return this.messages.length > 1;
      }

      onClick(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        switch (button.dataset.action) {
          case 'next':
            this.go(this.index + 1, true);
            break;
          case 'prev':
            this.go(this.index - 1, true);
            break;
          case 'pause':
            this.userPaused = !this.userPaused;
            this.syncPauseButton();
            this.schedule();
            break;
          case 'dismiss':
            this.hidden = true;
            try {
              sessionStorage.setItem('kusho:announcement-dismissed', '1');
            } catch (e) {
              /* storage unavailable: hide for this page view only */
            }
            break;
        }
      }

      setHover(value) {
        this.hoverPaused = value;
        this.schedule();
      }

      syncPauseButton() {
        if (!this.pauseButton) return;
        const paused = this.userPaused;
        this.pauseButton.setAttribute('aria-pressed', String(paused));
        this.pauseButton.setAttribute(
          'aria-label',
          paused ? this.pauseButton.dataset.labelPlay : this.pauseButton.dataset.labelPause
        );
        this.pauseButton.querySelector('[data-icon-pause]').hidden = paused;
        this.pauseButton.querySelector('[data-icon-play]').hidden = !paused;
      }

      /** manual = announce the change to screen readers; autoplay stays silent */
      go(next, manual = false) {
        if (!this.canRotate) return;
        const count = this.messages.length;
        this.index = (next + count) % count;

        if (this.live) this.live.setAttribute('aria-live', manual ? 'polite' : 'off');

        this.messages.forEach((message, i) => {
          const active = i === this.index;
          message.classList.toggle('is-active', active);
          message.toggleAttribute('inert', !active);
        });

        if (manual) this.schedule();
      }

      schedule() {
        this.stop();
        if (!this.canRotate || this.userPaused || this.hoverPaused || document.hidden) return;
        this.timer = window.setInterval(() => this.go(this.index + 1), this.interval);
      }

      stop() {
        if (this.timer) window.clearInterval(this.timer);
        this.timer = null;
      }
    }
  );
}

if (!customElements.get('kusho-countdown')) {
  customElements.define(
    'kusho-countdown',
    class KushoCountdown extends HTMLElement {
      connectedCallback() {
        this.end = Number(this.dataset.end);
        this.output = this.querySelector('[data-countdown-value]');
        if (!this.end || !this.output) return;

        this.tick();
        this.timer = window.setInterval(() => this.tick(), 1000);
      }

      disconnectedCallback() {
        if (this.timer) window.clearInterval(this.timer);
      }

      tick() {
        const remaining = Math.floor((this.end - Date.now()) / 1000);

        if (remaining <= 0) {
          this.hidden = true; // expired: the countdown removes itself
          if (this.timer) window.clearInterval(this.timer);
          return;
        }

        const days = Math.floor(remaining / 86400);
        const hours = Math.floor((remaining % 86400) / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        const pad = (n) => String(n).padStart(2, '0');

        this.output.textContent = `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
      }
    }
  );
}
