// Real kusho.in data (products, collections, policies, FAQ) turned into the objects the theme renders.
// Source: public product feed and pages of kusho.in, captured into ./data by recon/build-data.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Color } from './color.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, '..', 'data');
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));

// Real customer reviews pulled from the live store's Judge.me widget (recon/reviews.mjs)
const reviewData = fs.existsSync(path.join(dataDir, 'reviews.json')) ? readJson('reviews.json') : {};

const raw = readJson('products.json').products;
const membership = readJson('collections.json');
export const policies = readJson('policies.json');
export const faq = readJson('faq.json');

// Ratings and review counts as shown on the live homepage (review app data).
const REVIEWS = {
  'Kusho Car Comfort Combo': [5.0, 1],
  'Kusho Car Neck Cushion': [4.0, 4],
  'Kusho Dreamer Cervical Pillow': [5.0, 3],
  'Kusho Travel Neck Pillow': [5.0, 2],
  'Kusho Car Spine Rest Cushion': [5.0, 3],
};

const SWATCH = {
  black: '#1f2622', gray: '#9aa19d', grey: '#9aa19d', 'light gray': '#d5d9d6', wine: '#722f37',
  'petrol blue': '#1f5f7a', 'navy blue': '#1f2a5a', blue: '#2f5d9e', maroon: '#6d1f2b',
};

const cents = (v) => (v == null || v === '' ? null : Math.round(parseFloat(v) * 100));

const cleanDescription = (html) => {
  const paras = [];
  for (const m of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = m[1].replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length > 60 && !/^(DESCRIPTION|PRODUCT HIGHLIGHT|SPECIFICATION)/i.test(text)) paras.push(text);
  }
  return paras.map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/&amp;amp;/g, '&amp;')}</p>`).join('');
};

const mapProduct = (p) => {
  const images = p.images.slice(0, 8);
  const media = images.map((im, i) => ({
    id: im.id,
    src: `/data/img/${p.handle}/${i + 1}.webp`,
    alt: '',
    width: 1000,
    height: 1000,
    aspect_ratio: 1,
    media_type: 'image',
  }));

  const realOptions = p.options.filter((o) => !(o.name === 'Title' && o.values.length === 1));
  const variants = p.variants.map((v) => {
    const options = [v.option1, v.option2, v.option3].filter((x) => x != null);
    return {
      id: v.id,
      title: v.title,
      options: realOptions.length ? options : [],
      option1: v.option1,
      available: v.available,
      price: cents(v.price),
      compare_at_price: cents(v.compare_at_price),
      sku: v.sku,
      featured_media: media.find((m) => m.id === v.image_id) || media[0],
      inventory_management: null,
      inventory_quantity: 0,
    };
  });

  const colourish = (name) => /colo/i.test(name);
  const options = realOptions.map((o, i) => ({
    name: o.name,
    position: i + 1,
    values: o.values.map((label) => ({
      name: label,
      toString: () => label,
      swatch: colourish(o.name) && SWATCH[label.toLowerCase()] ? { color: new Color(SWATCH[label.toLowerCase()]) } : undefined,
    })),
  }));

  const inBogo = membership['buy-one-get-one-free'].includes(p.handle);
  const tags = [];
  if (/bestseller/i.test(p.tags.join(','))) tags.push('badge:bestseller');
  if (inBogo) tags.push('badge:bogo');

  const first = variants[0];
  const prices = variants.map((v) => v.price);
  const review = REVIEWS[p.title];

  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    template_suffix: p.handle === 'kusho-cervical-butterfly-pillow' ? 'stacked' : '', // the one product with the vertical gallery (on Shopify: assign the product.stacked template)
    url: `/products/${p.handle}`,
    type: p.product_type,
    vendor: p.vendor,
    description: cleanDescription(p.body_html || ''),
    price: Math.min(...prices),
    compare_at_price: first.compare_at_price,
    price_varies: new Set(prices).size > 1,
    available: variants.some((v) => v.available),
    tags,
    featured_media: media[0],
    featured_image: media[0],
    media,
    images: media,
    variants,
    variants_count: variants.length,
    has_only_default_variant: realOptions.length === 0,
    options: realOptions.map((o) => o.name),
    options_with_values: options,
    selected_or_first_available_variant: variants.find((v) => v.available) || first,
    first_available_variant: first,
    metafields: {
      reviews: reviewData[p.handle] && reviewData[p.handle].count > 0 ? { rating: { value: { rating: reviewData[p.handle].average, scale_max: 5 } }, rating_count: { value: reviewData[p.handle].count } } : review ? { rating: { value: { rating: review[0], scale_max: 5 } }, rating_count: { value: review[1] } } : {},
      kusho: reviewData[p.handle] && reviewData[p.handle].reviews.length ? { reviews: { value: reviewData[p.handle].reviews } } : {},
    },
  };
};

// Homepage order on kusho.in first, then the rest.
const HOME_ORDER = [
  'kusho-car-comfort-combo', 'kusho-car-neck-support-broad', 'kusho-cervical-butterfly-pillow', 'kusho-comfy-wedge-pillow',
  'kusho-dreamer-counter-pillow', 'kusho-car-neck-pillow', 'kusho-travel-neck-pillow', 'kusho-ultimate-pro-seating-combo',
];
const ordered = [...HOME_ORDER.map((h) => raw.find((p) => p.handle === h)), ...raw.filter((p) => !HOME_ORDER.includes(p.handle))].filter(Boolean);

export const products = ordered.map(mapProduct);
export const byHandle = Object.fromEntries(products.map((p) => [p.handle, p]));
export const pick = (handles) => handles.map((h) => byHandle[h]).filter(Boolean);
export const membershipOf = (name) => pick(membership[name] || []);
export const homeBestsellers = pick(HOME_ORDER);
