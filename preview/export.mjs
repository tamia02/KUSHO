// Renders the whole preview to static files in ./dist so it can be hosted anywhere (Vercel, Netlify, any
// static host) to show the client before the theme is connected to Shopify.
//   node export.mjs            -> preview/dist
// It starts the preview server on a spare port, follows every internal link, saves each page as
// <path>/index.html, downloads every local asset the pages reference, and adds a phone-frame page and a 404.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { staticSearchMarkup } from './lib/static-search.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');
const PORT = 3999;
const BASE = `http://localhost:${PORT}`;

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

// ---- start the server ----
const server = spawn(process.execPath, ['server.mjs'], { cwd: here, env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'ignore', 'inherit'] });
const ready = async () => {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(BASE + '/'); if (r.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('preview server did not start');
};
await ready();

// ---- crawl ----
const SKIP = /^(mailto:|tel:|https?:|javascript:|#|data:)/;
const isAsset = (p) => /\.(css|js|webp|png|jpe?g|svg|ico|woff2?|mp4|json|xml|txt)$/i.test(p.split('?')[0]);
const pagePath = (href) => {
  if (!href || SKIP.test(href)) return null;
  let p = href.split('#')[0].split('?')[0];
  if (!p.startsWith('/') || p.startsWith('//') || isAsset(p)) return null;
  if (/^\/(cdn|cart\/|account|checkout|_mobile)/.test(p)) return null;
  return p || '/';
};

const pages = new Map(); // path -> html
const assets = new Set();
const queue = ['/', '/cart', '/search', '/collections', '/collections/all', '/blogs/news', '/pages/faqs', '/pages/campus-ambassador', '/this-page-does-not-exist'];
const seen = new Set(queue);

const rewrite = (html) =>
  html
    .replaceAll('http://localhost:' + PORT, '')
    .replace('Local preview · data from kusho.in', 'Preview build · not the live store');

while (queue.length) {
  const p = queue.shift();
  const res = await fetch(BASE + p);
  const html = await res.text();
  if (res.status !== 200 && p !== '/this-page-does-not-exist') { console.log('skip', res.status, p); continue; }
  pages.set(p, rewrite(html));
  for (const m of html.matchAll(/\b(?:href|src|poster)="([^"]*)"/g)) {
    const raw = m[1].replace(/&amp;/g, '&');
    if (raw.startsWith('/') && !raw.startsWith('//') && isAsset(raw)) assets.add(raw.split('?')[0]);
    const link = pagePath(raw);
    if (link && !seen.has(link)) { seen.add(link); queue.push(link); }
  }
  for (const m of html.matchAll(/srcset="([^"]*)"/g)) {
    m[1].split(',').forEach((part) => { const u = part.trim().split(/\s+/)[0]; if (u.startsWith('/') && isAsset(u)) assets.add(u.split('?')[0]); });
  }
  for (const m of html.matchAll(/url\((['"]?)(\/[^'")]+)\1\)/g)) if (isAsset(m[2])) assets.add(m[2].split('?')[0]);
}

// Assets referenced from CSS (fonts, images inside stylesheets)
for (const a of [...assets]) {
  if (!a.endsWith('.css')) continue;
  const css = await (await fetch(BASE + a)).text();
  for (const m of css.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) {
    let u = m[2];
    if (/^(data:|https?:)/.test(u)) continue;
    if (!u.startsWith('/')) u = path.posix.join(path.posix.dirname(a), u);
    if (isAsset(u)) assets.add(u.split('?')[0]);
  }
}

// ---- write pages ----
const write = (rel, data) => {
  const file = path.join(dist, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
};
for (const [p, html] of pages) {
  if (p === '/this-page-does-not-exist') { write('404.html', html); continue; }
  write(p === '/' ? 'index.html' : path.posix.join(p.slice(1), 'index.html'), html);
}

// Phone frame: same as the server's /_mobile, reading ?path= in the browser
write('_mobile/index.html', `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Kusho · mobile view</title>
<body style="margin:0;background:#e9eeeb;font:14px Assistant,sans-serif;display:grid;justify-items:center;padding:24px 0">
<p style="margin:0 0 12px;color:#5e6a64">Mobile view (390px) · <a id="d" href="/">open desktop view</a></p>
<iframe id="f" style="width:390px;height:844px;border:0;border-radius:28px;background:#fff;box-shadow:0 12px 40px rgba(22,33,28,.18)"></iframe>
<script>var p=new URLSearchParams(location.search).get('path')||'/';document.getElementById('f').src=p;document.getElementById('d').href=p;</script></body>`);

// ---- static search: product index + a script on the search page, so /search?q= works without a server ----
const idx = await (await fetch(BASE + '/__search-index.json')).json().catch(() => null);
if (idx && pages.has('/search')) {
  write('search-index.json', JSON.stringify(idx));
  write('search/index.html', pages.get('/search').replace('</main>', staticSearchMarkup + '</main>'));
}

// ---- write assets ----
let bytes = 0;
for (const a of assets) {
  const res = await fetch(BASE + a);
  if (!res.ok) { console.log('asset missing', a); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  bytes += buf.length;
  write(a.slice(1), buf);
}

// bare /favicon.ico for browsers that ask for it without a link tag
fs.copyFileSync(path.join(here, '..', 'kusho-theme', 'assets', 'kusho-favicon.png'), path.join(dist, 'favicon.ico'));

server.kill();
console.log(`exported ${pages.size} pages and ${assets.size} assets (${(bytes / 1024 / 1024).toFixed(1)} MB) to ${dist}`);
