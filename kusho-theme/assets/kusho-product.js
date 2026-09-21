/**
 * Kusho product page (guide 11.3).
 *  - <kusho-gallery>: scroll-snap stage, thumbnails, arrows, keyboard, zoom lightbox
 *  - [data-kusho-product]: variant switching (price, image, stock, buttons), quantity,
 *    pincode estimate, share, coupon copy, "Added" feedback, sticky add-to-cart bar
 * Vanilla JS, no dependencies. Add-to-cart itself is Dawn's <product-form>, so the cart drawer keeps working.
 */

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------- toast */
let toastEl;
let toastTimer;
function toast(message) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'ktoast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;
  toastEl.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('is-visible'), 3500);
}

/* -------------------------------------------------------------- gallery */
if (!customElements.get('kusho-gallery')) {
  customElements.define(
    'kusho-gallery',
    class KushoGallery extends HTMLElement {
      connectedCallback() {
        this.track = this.querySelector('[data-track]');
        this.slides = Array.from(this.querySelectorAll('[data-slide]'));
        this.thumbs = Array.from(this.querySelectorAll('[data-thumb]'));
        this.rail = this.querySelector('.kgal__thumbs');
        this.counter = this.querySelector('[data-counter-current]');
        this.dialog = this.querySelector('[data-lightbox]');
        this.index = 0;
        this.ticking = false;
        if (!this.track || !this.slides.length) return;

        this.track.addEventListener('scroll', () => {
          if (this.ticking) return;
          this.ticking = true;
          window.requestAnimationFrame(() => {
            this.ticking = false;
            const vertical = this.dataset.axis === 'y';
            const size = (vertical ? this.track.clientHeight : this.track.clientWidth) || 1;
            this.setActive(Math.round((vertical ? this.track.scrollTop : this.track.scrollLeft) / size));
          });
        }, { passive: true });

        this.thumbs.forEach((thumb) => thumb.addEventListener('click', () => this.goTo(Number(thumb.dataset.thumb))));
        this.querySelector('[data-prev]')?.addEventListener('click', () => this.goTo(this.index - 1));
        this.querySelector('[data-next]')?.addEventListener('click', () => this.goTo(this.index + 1));
        this.querySelector('[data-open-zoom]')?.addEventListener('click', () => this.openLightbox(this.index));
        this.slides.forEach((slide) => {
          slide.querySelector('img')?.addEventListener('click', () => this.openLightbox(Number(slide.dataset.slide)));
        });

        this.track.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); this.goTo(this.index + 1); }
          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); this.goTo(this.index - 1); }
        });

        this.bindLightbox();
      }

      get total() {
        return this.slides.length;
      }

      goTo(target, { instant = false } = {}) {
        const next = Math.max(0, Math.min(this.total - 1, target));
        const vertical = this.dataset.axis === 'y';
        this.track.scrollTo({
          [vertical ? 'top' : 'left']: next * (vertical ? this.track.clientHeight : this.track.clientWidth),
          behavior: instant || prefersReducedMotion() ? 'auto' : 'smooth',
        });
        this.setActive(next);
      }

      goToMedia(mediaId, options) {
        const index = this.slides.findIndex((slide) => Number(slide.dataset.mediaId) === Number(mediaId));
        if (index >= 0) this.goTo(index, options);
      }

      setActive(index) {
        const clamped = Math.max(0, Math.min(this.total - 1, index));
        if (clamped === this.index && this.thumbs[clamped]?.getAttribute('aria-current') === 'true') return;
        this.index = clamped;
        if (this.counter) this.counter.textContent = String(clamped + 1);

        this.thumbs.forEach((thumb, i) => {
          if (i === clamped) thumb.setAttribute('aria-current', 'true');
          else thumb.removeAttribute('aria-current');
        });

        const thumb = this.thumbs[clamped];
        if (thumb && this.rail) {
          // Scroll only the thumbnail rail, never the page.
          if (this.rail.scrollHeight > this.rail.clientHeight + 1) {
            this.rail.scrollTop = thumb.offsetTop - (this.rail.clientHeight - thumb.offsetHeight) / 2;
          } else if (this.rail.scrollWidth > this.rail.clientWidth + 1) {
            this.rail.scrollLeft = thumb.offsetLeft - (this.rail.clientWidth - thumb.offsetWidth) / 2;
          }
        }
      }

      /* ---- lightbox ---- */
      bindLightbox() {
        if (!this.dialog) return;
        this.lbImg = this.dialog.querySelector('[data-lb-img]');
        this.lbCaption = this.dialog.querySelector('[data-lb-caption]');
        this.lbIndex = 0;

        this.dialog.querySelector('[data-close-zoom]')?.addEventListener('click', () => this.dialog.close());
        this.dialog.querySelector('[data-lb-prev]')?.addEventListener('click', () => this.showInLightbox(this.lbIndex - 1));
        this.dialog.querySelector('[data-lb-next]')?.addEventListener('click', () => this.showInLightbox(this.lbIndex + 1));

        // Click outside the picture closes; click on the picture toggles 2x zoom around the pointer.
        this.dialog.addEventListener('click', (event) => {
          if (event.target === this.dialog) this.dialog.close();
        });
        this.lbImg.addEventListener('click', (event) => {
          const zoomed = this.lbImg.classList.toggle('is-zoomed');
          if (zoomed) {
            const box = this.lbImg.getBoundingClientRect();
            const x = ((event.clientX - box.left) / box.width) * 100;
            const y = ((event.clientY - box.top) / box.height) * 100;
            this.lbImg.style.transformOrigin = `${x}% ${y}%`;
          }
        });
        this.dialog.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowRight') this.showInLightbox(this.lbIndex + 1);
          if (event.key === 'ArrowLeft') this.showInLightbox(this.lbIndex - 1);
        });
        this.dialog.addEventListener('close', () => {
          this.lbImg.classList.remove('is-zoomed');
          this.goTo(this.lbIndex, { instant: true });
        });
      }

      openLightbox(index) {
        if (!this.dialog || typeof this.dialog.showModal !== 'function') return;
        this.showInLightbox(index);
        this.dialog.showModal();
      }

      showInLightbox(index) {
        const next = (index + this.total) % this.total;
        const slide = this.slides[next];
        this.lbIndex = next;
        this.lbImg.classList.remove('is-zoomed');
        this.lbImg.src = slide.dataset.zoomSrc;
        this.lbImg.alt = slide.dataset.zoomAlt || '';
        if (this.lbCaption) this.lbCaption.textContent = slide.dataset.zoomAlt || '';
      }
    }
  );
}

/* -------------------------------------------------------------- product */
class KushoProduct {
  constructor(root) {
    this.root = root;
    this.strings = {};
    Object.entries(root.dataset).forEach(([key, value]) => {
      if (key.startsWith('strings')) this.strings[key.replace(/^strings/, '').replace(/^./, (c) => c.toLowerCase())] = value;
    });
    this.currency = root.dataset.currency || '₹';
    this.variants = JSON.parse(root.querySelector('[data-variants]')?.textContent || '[]');
    this.groups = Array.from(root.querySelectorAll('.kopt'));
    this.gallery = root.querySelector('kusho-gallery');
    this.idInput = root.querySelector('[data-variant-id]');
    this.atc = root.querySelector('[data-atc]');
    this.atcLabel = root.querySelector('[data-atc-label]');
    this.buyNow = root.querySelector('[data-buy-now]');
    this.qtyInput = root.querySelector('[data-qty-input]');
    this.sticky = root.querySelector('[data-sticky]');
    this.addedTimer = null;

    this.bindOptions();
    this.bindQuantity();
    this.bindPincode();
    this.bindShare();
    this.bindCopy();
    this.bindBuyNow();
    this.bindAddedFeedback();
    this.bindSticky();
    this.refreshAvailability();
  }

  money(cents) {
    return `${this.currency}${Math.round(cents / 100).toLocaleString('en-US')}`;
  }

  /* ---- variants ---- */
  selected() {
    return this.groups.map((group) => group.querySelector('input:checked')?.value);
  }

  findVariant(options) {
    return this.variants.find((variant) => variant.options.every((value, i) => value === options[i]));
  }

  bindOptions() {
    this.groups.forEach((group) => {
      group.addEventListener('change', () => this.onOptionChange());
    });
  }

  onOptionChange() {
    const options = this.selected();
    this.groups.forEach((group, i) => {
      const label = group.querySelector('[data-option-label]');
      if (label) label.textContent = options[i] || '';
    });
    const variant = this.findVariant(options);
    this.refreshAvailability();
    if (variant) this.applyVariant(variant);
  }

  /** Mark values that cannot be bought with the other current selections. */
  refreshAvailability() {
    const options = this.selected();
    this.groups.forEach((group, groupIndex) => {
      group.querySelectorAll('input').forEach((input) => {
        const trial = options.slice();
        trial[groupIndex] = input.value;
        const match = this.findVariant(trial);
        const unavailable = !match || !match.available;
        const label = group.querySelector(`label[for="${input.id}"]`);
        if (label) label.classList.toggle('is-unavailable', unavailable);
      });
    });
  }

  applyVariant(variant) {
    if (this.idInput) this.idInput.value = variant.id;

    const onSale = variant.available && variant.compare_at_price > variant.price;
    const save = variant.compare_at_price - variant.price;
    const percent = onSale ? Math.round((save * 100) / variant.compare_at_price) : 0;
    const set = (selector, text, show) => {
      const el = this.root.querySelector(selector);
      if (!el) return;
      if (text !== undefined) el.textContent = text;
      if (show !== undefined) el.hidden = !show;
    };
    set('[data-price-now]', this.money(variant.price));
    set('[data-price-was]', this.money(variant.compare_at_price), onSale);
    set('[data-price-off]', (this.strings.off || '').replace('__PERCENT__', percent), onSale);
    set('[data-price-save]', (this.strings.save || '').replace('__AMOUNT__', this.money(save)), onSale);
    this.root.querySelector('.kprice')?.classList.toggle('kprice--sale', onSale);
    set('[data-sticky-price]', this.money(variant.price));

    const threshold = Number(this.root.dataset.lowStock) || 0;
    const low = variant.inventory_management && variant.inventory_quantity > 0 && variant.inventory_quantity <= threshold;
    set('[data-stock]', low ? (this.strings.onlyLeft || '').replace('__COUNT__', variant.inventory_quantity) : '', Boolean(low));

    const label = variant.available ? this.strings.add : this.strings.soldOut;
    [this.atc, this.buyNow, this.root.querySelector('[data-sticky-atc]')].forEach((button) => {
      if (button) button.disabled = !variant.available;
    });
    if (this.atcLabel && !this.addedTimer) this.atcLabel.textContent = label;
    set('[data-sticky-label]', label);

    if (this.gallery && variant.media_id) this.gallery.goToMedia(variant.media_id);

    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url);
  }

  /* ---- quantity ---- */
  bindQuantity() {
    const input = this.qtyInput;
    if (!input) return;
    const clamp = () => {
      const value = parseInt(input.value, 10);
      input.value = Number.isFinite(value) && value > 0 ? value : 1;
    };
    this.root.querySelector('[data-qty-minus]')?.addEventListener('click', () => {
      input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
    });
    this.root.querySelector('[data-qty-plus]')?.addEventListener('click', () => {
      input.value = (parseInt(input.value, 10) || 1) + 1;
    });
    input.addEventListener('change', clamp);
  }

  /* ---- delivery estimate ---- */
  bindPincode() {
    const form = this.root.querySelector('[data-pincode-form]');
    if (!form) return;
    const input = form.querySelector('[data-pincode-input]');
    const message = form.querySelector('[data-pincode-msg]');
    const days = Number(this.root.dataset.deliveryDays) || 5;
    const cod = this.root.dataset.cod === 'true';

    const addWorkingDays = (start, count) => {
      const date = new Date(start);
      let added = 0;
      while (added < count) {
        date.setDate(date.getDate() + 1);
        if (date.getDay() !== 0) added += 1; // skip Sundays
      }
      return date;
    };

    const check = (pincode) => {
      const valid = /^[1-9][0-9]{5}$/.test(pincode);
      input.setAttribute('aria-invalid', String(!valid));
      message.classList.toggle('is-error', !valid);
      if (!valid) {
        message.textContent = this.strings.pincodeError || '';
        return;
      }
      const when = addWorkingDays(new Date(), days).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      const text = (this.strings.deliveryBy || '').replace('__DATE__', when);
      message.textContent = cod && this.strings.cod ? `${text} · ${this.strings.cod}` : text;
      try {
        window.localStorage.setItem('kusho:pincode', pincode);
      } catch (e) {
        /* storage unavailable: nothing to remember */
      }
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      check(input.value.trim());
    });

    try {
      const saved = window.localStorage.getItem('kusho:pincode');
      if (saved) {
        input.value = saved;
        check(saved);
      }
    } catch (e) {
      /* ignore */
    }
  }

  /* ---- share + copy ---- */
  bindShare() {
    const button = this.root.querySelector('[data-share]');
    if (!button) return;
    button.addEventListener('click', async () => {
      const data = { title: button.dataset.shareTitle, url: button.dataset.shareUrl };
      try {
        if (navigator.share) {
          await navigator.share(data);
          return;
        }
        await navigator.clipboard.writeText(data.url);
        toast(this.strings.linkCopied);
      } catch (e) {
        if (e && e.name !== 'AbortError') toast(this.strings.linkCopied);
      }
    });
  }

  bindCopy() {
    this.root.querySelectorAll('[data-copy-code]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.copyCode);
          toast(this.strings.copied);
        } catch (e) {
          toast(button.dataset.copyCode);
        }
      });
    });
  }

  /* ---- buy now (GoKwik replaces this later) ---- */
  bindBuyNow() {
    if (!this.buyNow) return;
    const error = this.root.querySelector('.kpdp__error');
    this.buyNow.addEventListener('click', async () => {
      const original = this.buyNow.textContent;
      this.buyNow.disabled = true;
      try {
        const body = new FormData();
        body.append('id', this.idInput.value);
        body.append('quantity', this.qtyInput ? this.qtyInput.value : '1');
        const response = await fetch(`${window.routes ? window.routes.cart_add_url : '/cart/add'}.js`, {
          method: 'POST',
          body,
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
        const json = await response.json();
        if (!response.ok || json.status) throw new Error(json.description || json.message || 'error');
        window.location.href = '/checkout';
      } catch (e) {
        if (error) {
          error.hidden = false;
          error.querySelector('.product-form__error-message').textContent = this.strings.buyError;
        }
        this.buyNow.disabled = false;
        this.buyNow.textContent = original;
      }
    });
  }

  /* ---- "Added" confirmation on the button ---- */
  bindAddedFeedback() {
    if (typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS === 'undefined' || !this.atcLabel) return;
    this.unsubscribe = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if (!event || event.source !== 'product-form') return;
      this.atc.classList.add('is-added');
      this.atcLabel.textContent = this.strings.added;
      window.clearTimeout(this.addedTimer);
      this.addedTimer = window.setTimeout(() => {
        this.addedTimer = null;
        this.atc.classList.remove('is-added');
        this.atcLabel.textContent = this.atc.disabled ? this.strings.soldOut : this.strings.add;
      }, 1600);
    });
  }

  /* ---- sticky add-to-cart bar ---- */
  bindSticky() {
    if (!this.sticky || !this.atc) return;
    const form = this.root.querySelector('form.kpdp__form-inner');
    this.root.querySelector('[data-sticky-atc]')?.addEventListener('click', () => {
      if (form && form.requestSubmit) form.requestSubmit();
      else this.atc.click();
    });

    const show = (visible) => {
      this.sticky.classList.toggle('is-visible', visible);
      this.sticky.setAttribute('aria-hidden', String(!visible));
      this.sticky.toggleAttribute('inert', !visible);
      document.documentElement.style.setProperty('--kusho-sticky-offset', visible ? `${this.sticky.offsetHeight}px` : '0px');
    };

    // A scroll check (not IntersectionObserver): the bar must also appear after a jump past the button,
    // for example an anchor link or a restored scroll position, where no edge is ever crossed.
    let ticking = false;
    const update = () => {
      ticking = false;
      show(this.atc.getBoundingClientRect().bottom < 0);
    };
    const schedule = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    update();
  }
}

const initProducts = (scope = document) => {
  scope.querySelectorAll('[data-kusho-product]').forEach((root) => {
    if (root.dataset.kushoInit) return;
    root.dataset.kushoInit = 'true';
    new KushoProduct(root);
  });
};

initProducts();
document.addEventListener('shopify:section:load', (event) => initProducts(event.target));
