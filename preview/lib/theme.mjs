// Renders the real theme files (layout, JSON templates, section groups, sections, snippets).

import fs from 'node:fs';
import path from 'node:path';
import { createEngine } from './engine.mjs';
import { fileURLToPath } from 'node:url';
import * as mock from './mock.mjs';

// Drop finished clips into preview/data/video and they appear in the preview:
//   hero.mp4                                 -> home hero
//   sleep.mp4 drive.mp4 work.mp4 travel.mp4  -> the four "how to use" cards, in that order
//   foam.mp4                                 -> the strip in "Why Kusho"
const VIDEO_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'video');
const CARD_ORDER = ['sleep', 'drive', 'work', 'travel'];
const clip = (name) => (fs.existsSync(path.join(VIDEO_DIR, name + '.mp4')) ? { preview_url: '/data/video/' + name + '.mp4' } : null);

const SHOPIFY_URL = /^shopify:\/\/(collections|pages|products)\/(.+)$/;

export function createTheme({ themeDir }) {
  const read = (...p) => fs.readFileSync(path.join(themeDir, ...p), 'utf8');
  const readJson = (...p) => JSON.parse(read(...p));

  const settings = mock.loadSettings(themeDir);

  const hooks = {
    renderGroup: (name, scope) => renderGroup(name, scope),
    renderStaticSection: (name, scope) => renderSectionFile(name, { id: name, type: name }, {}, scope),
  };
  const engine = createEngine({ themeDir, hooks });

  const globals = {
    settings,
    shop: mock.shop,
    routes: mock.routes,
    linklists: mock.linklists,
    collections: mock.collections,
    blogs: { news: mock.blog },
    blog: undefined,
    all_products: Object.fromEntries(mock.products.map((p) => [p.handle, p])),
    cart: mock.emptyCart(),
    customer: null,
    localization: { available_countries: [], available_languages: [], country: { iso_code: 'IN' }, language: { iso_code: 'en' } },
    request: { locale: { iso_code: 'en' }, origin: 'http://localhost:3000', design_mode: false, page_type: 'index' },
    content_for_header: `<script>
      window.Shopify = { designMode: false, shop: 'kusho-preview.myshopify.com', locale: 'en', currency: { active: 'INR', rate: '1.0' }, country: 'IN', theme: { name: 'Kusho', id: 1 } };
      window.ShopifyAnalytics = { lib: { track() {}, page() {} } };
      window.KushoPreview = true;
    </script>`,
  };

  // ---- setting values -> what Liquid sees --------------------------------------------------
  const url = (v) => {
    const m = SHOPIFY_URL.exec(v || '');
    return m ? `/${m[1]}/${m[2]}` : v || '';
  };

  const resolveSettings = (schemaSettings = [], values = {}, overrides = {}) => {
    const out = {};
    for (const s of schemaSettings) {
      if (!s.id) continue;
      let v = overrides[s.id] !== undefined ? overrides[s.id] : values[s.id];
      if (v === undefined) v = s.default;
      switch (s.type) {
        case 'collection': v = v ? mock.collections[v] || mock.collections.all : null; break;
        case 'product': v = v ? mock.products.find((p) => p.handle === v) || null : null; break;
        case 'blog': v = v ? mock.blog : null; break;
        case 'link_list': v = v ? mock.linklists[v] || null : null; break;
        case 'url': v = url(v); break;
        case 'image_picker':
        case 'video': v = typeof v === 'object' ? v : null; break;
        default: break;
      }
      out[s.id] = v;
    }
    return out;
  };

  const parseSchema = (source) => {
    const m = /\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/.exec(source);
    return m ? JSON.parse(m[1]) : {};
  };

  // ---- sections ----------------------------------------------------------------------------
  async function renderSectionFile(type, def, ctxInfo, scope) {
    const source = read('sections', `${type}.liquid`);
    const schema = parseSchema(source);
    const overrides = (ctxInfo.overrides && ctxInfo.overrides[def.id]) || {};

    const blockOrder = def.block_order || Object.keys(def.blocks || {});
    const blocks = blockOrder.map((bid, index) => {
      const b = def.blocks[bid];
      const bschema = (schema.blocks || []).find((x) => x.type === b.type) || {};
      const bsettings = resolveSettings(bschema.settings, b.settings);
      if (type === 'kusho-stack' && !bsettings.video) bsettings.video = clip(CARD_ORDER[index]);
      return { id: bid, type: b.type, settings: bsettings, shopify_attributes: '' };
    });

    const id = `${ctxInfo.prefix ?? 'template--preview__'}${def.id}`;
    const section = {
      id,
      type,
      settings: resolveSettings(schema.settings, def.settings, overrides),
      blocks,
      block_order: blockOrder,
    };

    if (type === 'kusho-hero' && !section.settings.video) section.settings.video = clip('hero');
    if (type === 'kusho-why' && !section.settings.video) section.settings.video = clip('foam');

    const html = await engine.parseAndRender(source, { section }, { globals: { ...scope, section } });
    const tag = schema.tag || 'div';
    const classes = ['shopify-section', ctxInfo.groupClass, schema.class].filter(Boolean).join(' ');
    return `<${tag} id="shopify-section-${id}" class="${classes}">${html}</${tag}>`;
  }

  async function renderSections(json, ctxInfo, scope) {
    const parts = [];
    for (const sid of json.order) {
      const def = { id: sid, ...json.sections[sid] };
      parts.push(await renderSectionFile(def.type, def, ctxInfo, scope));
    }
    return parts.join('\n');
  }

  async function renderGroup(name, scope) {
    const json = readJson('sections', `${name}.json`);
    return renderSections(json, { prefix: '', groupClass: `shopify-section-group-${name}` }, scope);
  }

  // ---- pages -------------------------------------------------------------------------------
  const FONTS =
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700&family=Josefin+Sans:wght@300;400;600;700&display=swap">';

  const PREVIEW_CSS = '<style>.cart-count-bubble{display:none}</style>';

  const BADGE =
    '<div id="kusho-preview-badge" style="position:fixed;left:12px;bottom:12px;z-index:25;padding:6px 12px;border-radius:999px;background:#16211c;color:#fff;font:400 11px/1 Assistant,sans-serif;letter-spacing:.08em;text-transform:uppercase;opacity:.88;cursor:pointer" title="Click to hide" onclick="this.remove()">Local preview · data from kusho.in</div>';

  async function renderPage({ template, pageType, path: reqPath, title, description, extra = {}, overrides = {}, body }) {
    const scope = {
      ...globals,
      ...extra,
      template: { name: template, suffix: '', directory: '' },
      request: { ...globals.request, page_type: pageType, path: reqPath },
      canonical_url: `http://localhost:3000${reqPath}`,
      page_title: title,
      page_description: description || '',
      current_page: 1,
      current_tags: null,
    };

    const content = body
      ? await body(scope)
      : await renderSections(readJson('templates', `${template}.json`), { prefix: 'template--preview__', overrides }, scope);

    let html = await engine.renderFile('theme', {}, { globals: { ...scope, content_for_layout: content } });
    html = html.replace('</head>', `${FONTS}${PREVIEW_CSS}</head>`).replace('</body>', `${BADGE}</body>`);
    return html;
  }

  return { renderPage, engine, globals };
}
