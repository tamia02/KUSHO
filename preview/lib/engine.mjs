// LiquidJS configured to behave like Shopify's Liquid for this theme:
// Shopify-only tags (schema, style, form, sections, paginate …) and filters (money, t, image_url …).

import fs from 'node:fs';
import path from 'node:path';
import { Liquid } from 'liquidjs';
import { colorFilters } from './color.mjs';

/** Named filter arguments (`| f: a: 1, b: 2`) arrive as [key, value] pairs. */
const kwargs = (args) => {
  const out = {};
  for (const a of args) if (Array.isArray(a) && a.length === 2 && typeof a[0] === 'string') out[a[0]] = a[1];
  return out;
};

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Split "a, b: 'x, y', c: 3" on top-level commas. */
const splitArgs = (src) => {
  const parts = [];
  let cur = '', quote = null, depth = 0;
  for (const ch of src) {
    if (quote) { cur += ch; if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
};

export function createEngine({ themeDir, hooks }) {
  const engine = new Liquid({
    root: [path.join(themeDir, 'layout'), path.join(themeDir, 'sections')],
    partials: [path.join(themeDir, 'snippets')],
    extname: '.liquid',
    ownPropertyOnly: false,
    strictFilters: true,
    strictVariables: false,
    cache: false,
  });

  const locale = JSON.parse(fs.readFileSync(path.join(themeDir, 'locales/en.default.json'), 'utf8'));

  // ------------------------------------------------------------------ tags
  const swallow = (name, endName) =>
    engine.registerTag(name, {
      parse(token, remain) {
        const stream = this.liquid.parser.parseStream(remain);
        stream
          .on('token', (t) => { if (t.name === endName) stream.stop(); })
          .on('end', () => { throw new Error(`tag ${name} not closed`); });
        stream.start();
      },
      render() { return ''; },
    });

  swallow('schema', 'endschema');
  swallow('doc', 'enddoc');

  const wrapBlock = (name, open, close) =>
    engine.registerTag(name, {
      parse(token, remain) {
        this.tpls = [];
        const stream = this.liquid.parser.parseStream(remain);
        stream
          .on(`tag:end${name}`, () => stream.stop())
          .on('template', (tpl) => this.tpls.push(tpl))
          .on('end', () => { throw new Error(`tag ${name} not closed`); });
        stream.start();
      },
      *render(ctx, emitter) {
        emitter.write(open);
        yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
        emitter.write(close);
      },
    });

  wrapBlock('style', '<style data-shopify>', '</style>');
  wrapBlock('javascript', '<script>', '</script>');

  engine.registerTag('form', {
    parse(token, remain) {
      this.args = token.args;
      this.tpls = [];
      const stream = this.liquid.parser.parseStream(remain);
      stream
        .on('tag:endform', () => stream.stop())
        .on('template', (tpl) => this.tpls.push(tpl))
        .on('end', () => { throw new Error('tag form not closed'); });
      stream.start();
    },
    *render(ctx, emitter) {
      const parts = splitArgs(this.args);
      const type = String(yield this.liquid.evalValue(parts[0], ctx));
      const attrs = {};
      for (const part of parts.slice(1)) {
        const m = /^([\w-]+):\s*(.+)$/s.exec(part);
        if (m) attrs[m[1]] = yield this.liquid.evalValue(m[2], ctx);
      }
      const action = type === 'product' ? '/cart/add' : type === 'customer' ? '/contact#ContactFooter' : '/contact';
      const html = Object.entries(attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
      emitter.write(`<form method="post" action="${action}" accept-charset="UTF-8"${html}>`);
      ctx.push({ form: { errors: false, 'posted_successfully?': false, email: '', id: attrs.id } });
      yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
      ctx.pop();
      emitter.write('</form>');
    },
  });

  engine.registerTag('paginate', {
    parse(token, remain) {
      this.args = token.args;
      this.tpls = [];
      const stream = this.liquid.parser.parseStream(remain);
      stream
        .on('tag:endpaginate', () => stream.stop())
        .on('template', (tpl) => this.tpls.push(tpl))
        .on('end', () => { throw new Error('tag paginate not closed'); });
      stream.start();
    },
    *render(ctx, emitter) {
      const [listExpr, sizeExpr] = this.args.split(/\s+by\s+/);
      const items = (yield this.liquid.evalValue(listExpr.trim(), ctx)) || [];
      const size = Number(yield this.liquid.evalValue(sizeExpr.trim(), ctx)) || 12;
      ctx.push({ paginate: { current_page: 1, page_size: size, pages: Math.max(1, Math.ceil(items.length / size)), items: items.length, parts: [], previous: null, next: null } });
      yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
      ctx.pop();
    },
  });

  engine.registerTag('layout', { parse() {}, render() { return ''; } });

  engine.registerTag('sections', {
    parse(token) { this.expr = token.args; },
    *render(ctx, emitter) {
      const name = yield this.liquid.evalValue(this.expr, ctx);
      emitter.write(yield hooks.renderGroup(name, ctx.globals));
    },
  });

  engine.registerTag('section', {
    parse(token) { this.expr = token.args; },
    *render(ctx, emitter) {
      const name = yield this.liquid.evalValue(this.expr, ctx);
      emitter.write(yield hooks.renderStaticSection(name, ctx.globals));
    },
  });

  // ------------------------------------------------------------------ filters
  const money = (cents, { symbol = true, currency = false } = {}) => {
    const n = Math.round(Number(cents) || 0) / 100;
    const body = (Number.isInteger(n) ? n : Math.round(n)).toLocaleString('en-US');
    return `${symbol ? '₹' : ''}${body}${currency ? ' INR' : ''}`;
  };
  engine.registerFilter('money', (v) => money(v));
  engine.registerFilter('money_without_trailing_zeros', (v) => money(v));
  engine.registerFilter('money_with_currency', (v) => money(v, { currency: true }));
  engine.registerFilter('money_without_currency', (v) => money(v, { symbol: false }));

  engine.registerFilter('asset_url', (name) => `/assets/${name}`);
  engine.registerFilter('stylesheet_tag', (url) => `<link href="${url}" rel="stylesheet" type="text/css" media="all">`);

  engine.registerFilter('image_url', function (img, ...args) {
    if (!img) return '';
    const { width = 1000 } = kwargs(args);
    const ext = /.(webp|jpe?g|png)$/i.test(img.src) ? '' : '.svg';
    return `${img.src}${ext}?width=${width}&ar=${img.aspect_ratio || 1}`;
  });

  engine.registerFilter('image_tag', function (url, ...args) {
    if (!url) return '';
    const kw = kwargs(args);
    const [base, query = ''] = String(url).split('?');
    const q = new URLSearchParams(query);
    const width = Number(q.get('width')) || 1000;
    const ar = Number(q.get('ar')) || 1;
    const at = (w) => `${base}?width=${w}&ar=${ar}`;
    const widths = kw.widths ? String(kw.widths).split(',').map((w) => Number(w.trim())).filter(Boolean) : [];
    const attrs = { src: at(width) };
    if (widths.length) attrs.srcset = widths.map((w) => `${at(w)} ${w}w`).join(', ');
    if (kw.sizes) attrs.sizes = kw.sizes;
    attrs.loading = kw.loading || 'lazy';
    if (kw.fetchpriority) attrs.fetchpriority = kw.fetchpriority;
    attrs.alt = kw.alt ?? '';
    if (kw.class) attrs.class = kw.class;
    attrs.width = width;
    attrs.height = Math.round(width / ar);
    return `<img ${Object.entries(attrs).map(([k, v]) => `${k}="${esc(v)}"`).join(' ')}>`;
  });

  engine.registerFilter('video_tag', (video, ...args) => {
    if (!video || !video.preview_url) return '';
    const kw = kwargs(args);
    const flag = (name, on) => (on ? ' ' + name : '');
    const cls = kw.class ? ' class="' + esc(kw.class) + '"' : '';
    return '<video' + cls + flag('autoplay', kw.autoplay) + flag('loop', kw.loop) + flag('muted', kw.muted) + flag('controls', kw.controls) + flag('playsinline', kw.playsinline) +
      ' preload="' + esc(kw.preload || 'metadata') + '"><source src="' + esc(video.preview_url) + '" type="video/mp4"></video>';
  });
  engine.registerFilter('standard_event_data', () => '{}');
  engine.registerFilter('structured_data', (p) => JSON.stringify({ '@context': 'https://schema.org/', '@type': 'Product', name: p && p.title }));
  engine.registerFilter('item_count_for_variant', () => 0);
  engine.registerFilter('handleize', (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));

  engine.registerFilter('placeholder_svg_tag', (name, cls = '') =>
    `<svg class="${esc(cls)}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 525 525"><rect width="525" height="525" fill="#eef0ef"/><circle cx="262" cy="262" r="90" fill="#d6dbd8"/></svg>`);

  engine.registerFilter('inline_asset_content', (name) => {
    try { return fs.readFileSync(path.join(themeDir, 'assets', name), 'utf8'); } catch { return ''; }
  });

  engine.registerFilter('payment_type_svg_tag', (type, ...args) => {
    const label = { visa: 'VISA', master: 'MC', rupay: 'RuPay', google_pay: 'GPay' }[type] || String(type);
    const cls = kwargs(args).class || '';
    return `<svg class="${esc(cls)}" viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect x=".5" y=".5" width="37" height="23" rx="3" fill="#fff" stroke="#d9e1dc"/><text x="19" y="15" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="7" font-weight="700" fill="#16211c">${esc(label)}</text></svg>`;
  });

  engine.registerFilter('font_face', () => '');
  engine.registerFilter('font_url', () => '');
  engine.registerFilter('font_modify', (font) => font);
  for (const [name, fn] of Object.entries(colorFilters)) engine.registerFilter(name, fn);

  engine.registerFilter('t', (key, ...args) => {
    const vars = kwargs(args);
    let node = key.split('.').reduce((o, k) => (o == null ? o : o[k]), locale);
    if (node && typeof node === 'object') node = vars.count === 1 ? node.one ?? node.other : node.other ?? node.one;
    if (typeof node !== 'string') return `Translation missing: en.${key}`;
    return node.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => (vars[name] !== undefined ? vars[name] : ''));
  });

  return engine;
}
