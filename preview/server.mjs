// Local preview server for the Kusho theme.
//   npm install && npm start      ->  http://localhost:3000
// Renders the real files in ../kusho-theme with sample data. Edit the theme, refresh the page.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTheme } from './lib/theme.mjs';
import { productSvg, heroSvg } from './lib/svg.mjs';
import * as mock from './lib/mock.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const themeDir = path.resolve(here, '..', 'kusho-theme');
const PORT = Number(process.env.PORT) || 3000;

const theme = createTheme({ themeDir });

const TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.html': 'text/html; charset=utf-8',
  '.mp4': 'video/mp4',
};

const send = (res, status, body, type = 'text/html; charset=utf-8') => {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
};

// MP4 with HTTP range support so the browser can seek and loop
const streamVideo = (req, res, file) => {
  const size = fs.statSync(file).size;
  const range = /bytes=(d*)-(d*)/.exec(req.headers.range || '');
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Number(range[2]) : size - 1;
    res.writeHead(206, { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Content-Range': 'bytes ' + start + '-' + end + '/' + size, 'Content-Length': end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Content-Length': size });
  return fs.createReadStream(file).pipe(res);
};

const heroImage = (name, ratio, w, h) => ({ src: `/mock/img/${name}`, alt: '', width: w, height: h, aspect_ratio: ratio, media_type: 'image' });

let pathnameWithQuery = '';
async function page(pathname) {
  if (pathname === '/') {
    return theme.renderPage({
      template: 'index',
      pageType: 'index',
      path: pathname,
      title: 'Kusho — The Comfort You Deserve',
      description: 'Ergonomic memory-foam pillows and cushions for sleep, work and travel.',
    });
  }

  const prod = /^\/products\/([\w-]+)$/.exec(pathname);
  if (prod) {
    const product = mock.products.find((p) => p.handle === prod[1]);
    if (!product) return null;
    const tagline = product.metafields.kusho.tagline;
    return theme.renderPage({
      template: 'product',
      pageType: 'product',
      path: pathname,
      title: product.title,
      description: tagline && tagline.value,
      extra: { product },
    });
  }

  if (pathname === '/collections') {
    const list = Object.values(mock.collections).filter((c) => c.handle !== 'all');
    return theme.renderPage({ template: 'list-collections', pageType: 'list-collections', path: pathname, title: 'Collections', extra: { collections: list } });
  }

  const col = /^\/collections\/([\w-]+)$/.exec(pathname);
  if (col) {
    const collection = mock.collections[col[1]];
    if (!collection) return null;
    return theme.renderPage({
      template: 'collection',
      pageType: 'collection',
      path: pathname,
      title: collection.title,
      description: collection.description,
      extra: { collection, current_tags: null },
      // Filters come from Shopify's Search & Discovery app, which the preview does not simulate.
      overrides: { 'product-grid': { enable_filtering: false } },
    });
  }

  const pg = /^\/pages\/([\w-]+)$/.exec(pathname);
  if (pg) {
    const p = mock.pages[pg[1]];
    if (!p) return null;
    return theme.renderPage({ template: p.template, pageType: 'page', path: pathname, title: p.title, extra: { page: p } });
  }

  const pol = /^\/policies\/([\w-]+)$/.exec(pathname);
  if (pol) {
    const p = mock.policyPages[pol[1]];
    if (!p) return null;
    return theme.renderPage({
      template: 'page',
      pageType: 'policy',
      path: pathname,
      title: p.title,
      body: async () => `<div class="shopify-policy__container"><div class="shopify-policy__title"><h1>${p.title}</h1></div><div class="shopify-policy__body"><div class="rte">${p.html}</div></div></div>`,
    });
  }

  const tagged = /^\/blogs\/news\/tagged\/([\w-]+)$/.exec(pathname);
  if (pathname === '/blogs/news' || tagged) {
    const tag = tagged && mock.blog.tags.find((x) => x.toLowerCase() === tagged[1]);
    const blog = tag ? { ...mock.blog, articles: mock.blog.articles.filter((a) => a.tags.includes(tag)) } : mock.blog;
    return theme.renderPage({ template: 'blog', pageType: 'blog', path: pathname, title: 'The Kusho journal', extra: { blog, current_tags: tag ? [tag] : null } });
  }

  const art = /^\/blogs\/news\/([\w-]+)$/.exec(pathname);
  if (art) {
    const article = mock.blog.articles.find((a) => a.handle === art[1]);
    if (!article) return null;
    return theme.renderPage({ template: 'article', pageType: 'article', path: pathname, title: article.title, extra: { blog: mock.blog, article } });
  }

  if (pathname === '/cart') {
    return theme.renderPage({ template: 'cart', pageType: 'cart', path: pathname, title: 'Your cart' });
  }

  if (pathname === '/search') {
    const q = (new URL(`http://x${pathnameWithQuery}`).searchParams.get('q') || '').trim();
    const results = q ? mock.products.filter((p) => p.title.toLowerCase().includes(q.toLowerCase())) : [];
    return theme.renderPage({
      template: 'search',
      pageType: 'search',
      path: pathname,
      title: 'Search',
      extra: { search: { performed: Boolean(q), terms: q, results, results_count: results.length, filters: [], sort_by: 'relevance', default_sort_by: 'relevance', sort_options: [], types: [] } },
    });
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');

    if (pathname.startsWith('/assets/')) {
      const file = path.join(themeDir, 'assets', path.basename(pathname));
      if (!fs.existsSync(file)) return send(res, 404, 'Not found', 'text/plain');
      if (path.extname(file) === '.mp4') return streamVideo(req, res, file);
      return send(res, 200, fs.readFileSync(file), TYPES[path.extname(file)] || 'application/octet-stream');
    }

    if (pathname.startsWith('/data/video/')) {
      const file = path.join(here, 'data', 'video', path.basename(pathname));
      if (!fs.existsSync(file)) return send(res, 404, 'Not found', 'text/plain');
      const size = fs.statSync(file).size;
      const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
      if (range) {
        const start = range[1] ? Number(range[1]) : 0;
        const end = range[2] ? Number(range[2]) : size - 1;
        res.writeHead(206, { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Content-Range': 'bytes ' + start + '-' + end + '/' + size, 'Content-Length': end - start + 1 });
        return fs.createReadStream(file, { start, end }).pipe(res);
      }
      res.writeHead(200, { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Content-Length': size });
      return fs.createReadStream(file).pipe(res);
    }

    if (pathname.startsWith('/data/img/')) {
      const rel = pathname.replace('/data/img/', '');
      const file = path.join(here, 'data', 'img', rel);
      if (!file.startsWith(path.join(here, 'data', 'img')) || !fs.existsSync(file)) return send(res, 404, 'Not found', 'text/plain');
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'image/webp', 'Cache-Control': 'public, max-age=3600' });
      return res.end(fs.readFileSync(file));
    }

    if (pathname.startsWith('/mock/img/')) {
      const name = path.basename(pathname, '.svg');
      if (name === 'hero-wide') return send(res, 200, heroSvg('wide'), TYPES['.svg']);
      if (name === 'hero-tall') return send(res, 200, heroSvg('tall'), TYPES['.svg']);
      const m = /^(\w+?)-(grey|green|sand)(?:-(alt|detail|side|dims|box|hand))?$/.exec(name);
      if (!m) return send(res, 404, 'Not found', 'text/plain');
      return send(res, 200, productSvg(m[1], m[2], m[3] || 'front'), TYPES['.svg']);
    }

    // Phone-width frame: shows the mobile layout on a desktop screen (media queries respond to the iframe width).
    if (pathname === '/_mobile') {
      const q = new URL(req.url, 'http://localhost').searchParams;
      const target = q.get('path') || '/';
      const h = Number(q.get('h')) || 844;
      return send(res, 200, `<!doctype html><meta charset="utf-8"><title>Kusho · mobile view</title>
        <body style="margin:0;background:#e9eeeb;font:14px Montserrat,sans-serif;display:grid;justify-items:center;padding:24px 0">
        <p style="margin:0 0 12px;color:#5e6a64">Mobile view (390px) · <a href="${target}">open desktop view</a></p>
        <iframe src="${target}" style="width:390px;height:${h}px;border:0;border-radius:28px;background:#fff;box-shadow:0 12px 40px rgba(22,33,28,.18)"></iframe></body>`);
    }

    if (pathname === '/favicon.ico') return send(res, 204, '');

    // Cart calls are not wired in the preview yet.
    if (pathname.startsWith('/cart') && req.method === 'POST') {
      return send(res, 200, JSON.stringify({ status: 422, message: 'Preview only', description: 'Adding to cart works once the theme is connected to Shopify.' }), TYPES['.json']);
    }

    pathnameWithQuery = req.url;
    const html = await page(pathname);
    if (html === null) {
      const nf = await theme.renderPage({ template: '404', pageType: '404', path: pathname, title: 'Page not found' });
      return send(res, 404, nf);
    }
    return send(res, 200, html);
  } catch (err) {
    console.error(err);
    return send(res, 500, `<pre style="padding:24px;white-space:pre-wrap;font:14px/1.5 monospace">${String(err.stack || err).replace(/</g, '&lt;')}</pre>`);
  }
});

server.listen(PORT, () => {
  console.log(`\n  Kusho preview running at http://localhost:${PORT}\n  Theme: ${themeDir}\n`);
});
