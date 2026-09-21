// Sample store data for the local preview. Everything here is made up so the theme can be
// shown before it is connected to the real store. Nothing in this file ships to Shopify.

import fs from 'node:fs';
import path from 'node:path';
import { Color } from './color.mjs';

import { products, byHandle, pick, membershipOf, homeBestsellers } from './real.mjs';
export { products };
import { blog, pages, policyPages } from './content.mjs';
export { blog, pages, policyPages };
blog.all_tags = blog.tags;
let nextId = 9000;

const collection = (handle, title, description, list) => ({
  id: nextId++,
  handle,
  title,
  description,
  url: `/collections/${handle}`,
  image: null,
  products: list,
  products_count: list.length,
  all_products_count: list.length,
  sort_options: [
    { name: 'Featured', value: 'manual' },
    { name: 'Best selling', value: 'best-selling' },
    { name: 'Price, low to high', value: 'price-ascending' },
    { name: 'Price, high to low', value: 'price-descending' },
  ],
  default_sort_by: 'manual',
  sort_by: 'manual',
  filters: [],
  current_vendor: null,
  current_type: null,
});

export const collections = {
  all: collection('all', 'All products', 'Everything Kusho makes for sleep, work and travel.', products),
  pillows: collection('pillows', 'Pillows', 'Memory-foam pillows for calmer nights and easier mornings.', membershipOf('pillows')),
  cushions: collection('cushions', 'Cushions', 'Support for the driving seat, the desk chair and long journeys.', membershipOf('cushions')),
  combos: collection('combos', 'Combos', 'Complete comfort setups at a better price.', membershipOf('combos')),
  travel: collection('travel', 'Travel', 'Neck support that comes with you.', membershipOf('travel')),
  cars: collection('cars', 'Cars', 'Comfort for the driving seat.', membershipOf('cars')),
  accessories: collection('accessories', 'Accessories', 'Add-ons and small comforts.', membershipOf('accessories')),
  'buy-one-get-one-free': collection('buy-one-get-one-free', 'Buy one, get one free', 'Selected products, two for the price of one.', membershipOf('buy-one-get-one-free')),
  'best-sellers': collection('best-sellers', 'Best sellers', 'The pieces people come back for.', homeBestsellers),
};

const link = (title, url, links = []) => ({
  title,
  handle: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  url,
  links,
  levels: links.length ? 1 : 0,
  type: 'collection_link',
  active: false,
  current: false,
  child_active: false,
  child_current: false,
});

export const linklists = {
  'main-menu': {
    title: 'Main menu',
    handle: 'main-menu',
    links: [
      link('Shop by need', '/collections/all', [
        link('Neck comfort', '/collections/pillows'),
        link('Back and seat support', '/collections/cushions'),
        link('Better sleep', '/collections/pillows'),
        link('Driving comfort', '/collections/cars'),
        link('Travel', '/collections/travel'),
      ]),
      link('Pillows', '/collections/pillows'),
      link('Cushions', '/collections/cushions'),
      link('Combos', '/collections/combos'),
      link('Travel', '/collections/travel'),
      link('Gifting', '/pages/corporate-gifting'),
    ],
  },
  'footer-shop': { title: 'Shop', handle: 'footer-shop', links: [link('Pillows', '/collections/pillows'), link('Cushions', '/collections/cushions'), link('Combos', '/collections/combos'), link('Travel', '/collections/travel'), link('Best sellers', '/collections/best-sellers')] },
  'footer-help': { title: 'Help', handle: 'footer-help', links: [link('Contact us', '/pages/contact'), link('FAQs', '/pages/faqs'), link('Return and refund', '/pages/return-refund'), link('Shipping policy', '/policies/shipping-policy')] },
  'footer-company': { title: 'Company', handle: 'footer-company', links: [link('About us', '/pages/about-us'), link('Journal', '/blogs/news'), link('Catalogue', '/pages/kusho-catalogue')] },
  'footer-partner': { title: 'Partner', handle: 'footer-partner', links: [link('Corporate gifting', '/pages/corporate-gifting'), link('Become a retailer', '/pages/become-a-retailer'), link('Affiliate programme', '/pages/affiliate-program')] },
};

export const shop = {
  name: 'Kusho',
  url: 'http://localhost:3000',
  currency: 'INR',
  email: 'support@kusho.in',
  enabled_payment_types: ['visa', 'master', 'rupay', 'google_pay'],
  customer_accounts_enabled: true,
  brand: { logo: null, slogan: 'The Comfort You Deserve' },
  policies: [
    { title: 'Privacy policy', url: '/policies/privacy-policy' },
    { title: 'Refund policy', url: '/policies/refund-policy' },
    { title: 'Terms of service', url: '/policies/terms-of-service' },
    { title: 'Shipping policy', url: '/policies/shipping-policy' },
  ],
};

export const routes = {
  root_url: '/',
  cart_url: '/cart',
  cart_add_url: '/cart/add',
  cart_change_url: '/cart/change',
  cart_update_url: '/cart/update',
  cart_clear_url: '/cart/clear',
  search_url: '/search',
  predictive_search_url: '/search/suggest',
  all_products_collection_url: '/collections/all',
  collections_url: '/collections',
  account_url: '/account',
  account_login_url: '/account/login',
  account_register_url: '/account/register',
  account_logout_url: '/account/logout',
};

export const emptyCart = () => ({
  item_count: 0,
  items: [],
  total_price: 0,
  items_subtotal_price: 0,
  total_discount: 0,
  total_weight: 0,
  original_total_price: 0,
  currency: { iso_code: 'INR' },
  note: '',
  requires_shipping: false,
  taxes_included: true,
  cart_level_discount_applications: [],
  'empty?': true,
});

// ---- settings: settings_data.json preset + schema defaults, with colour objects ----
export function loadSettings(themeDir) {
  const data = JSON.parse(fs.readFileSync(path.join(themeDir, 'config/settings_data.json'), 'utf8'));
  const schema = JSON.parse(fs.readFileSync(path.join(themeDir, 'config/settings_schema.json'), 'utf8'));
  const preset = typeof data.current === 'string' ? data.presets[data.current] : data.current;
  const settings = {};

  for (const group of schema) {
    for (const s of group.settings || []) {
      if (s.id && s.default !== undefined) settings[s.id] = s.default;
    }
  }
  Object.assign(settings, preset);

  const font = (handle, fallback) => {
    const m = /^([a-z0-9_]+?)_([ni])(\d)$/.exec(handle || '');
    const family = m ? m[1].split('_').map((w) => w.replace(/^./, (c) => c.toUpperCase())).join(' ') : fallback;
    return {
      family,
      fallback_families: 'sans-serif',
      style: m && m[2] === 'i' ? 'italic' : 'normal',
      weight: m ? Number(m[3]) * 100 : 400,
      'system?': true, // fonts are loaded from Google Fonts in the preview instead of Shopify's CDN
    };
  };
  settings.type_header_font = font(preset.type_header_font, 'Josefin Sans');
  settings.type_body_font = font(preset.type_body_font, 'Assistant');

  const scheme = (v) => {
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = /^#/.test(val) ? new Color(val) : val;
    return out;
  };
  settings.color_schemes = Object.entries(preset.color_schemes).map(([id, v]) => ({ id, settings: scheme(v.settings) }));
  return settings;
}
