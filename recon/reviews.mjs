// Pulls the real customer reviews from kusho.in's Judge.me widget (public, per product) into ../preview/data/reviews.json
// Run: node reviews.mjs
import fs from 'node:fs';
const SHOP = 'gpmaeb-qy.myshopify.com';
const products = JSON.parse(fs.readFileSync('../preview/data/products.json', 'utf8'));
const list = products.products || products;
const out = {};
const decode = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const text = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

for (const p of list) {
  const page = await fetch(`https://kusho.in/products/${p.handle}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text()).catch(() => '');
  const id = /data-product-id="(\d+)"/.exec(page)?.[1] || p.id;
  if (!id) { console.log('no id', p.handle); continue; }
  const url = `https://judge.me/reviews/reviews_for_widget?url=${SHOP}&shop_domain=${SHOP}&platform=shopify&product_id=${id}&per_page=50&page=1`;
  const json = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://kusho.in/' } }).then((r) => r.json()).catch(() => null);
  if (!json || !Array.isArray(json.reviews)) { console.log('no widget', p.handle); continue; }
  const reviews = json.reviews.map((r) => ({
    rating: r.rating,
    author: r.is_anonymous_reviewer ? 'Anonymous' : r.reviewer_name,
    title: text(r.title || ''),
    body: text(r.body_html || ''),
    date: (r.created_at || '').slice(0, 10),
    verified: Boolean(r.verified_buyer),
    pictures: (r.pictures_urls || []).map((p) => (typeof p === 'string' ? p : p.original || p.huge)).filter(Boolean),
    reply: r.reply_content ? text(r.reply_content) : '',
  }));
  out[p.handle] = { product_id: Number(id), count: json.number_of_reviews, average: Number(json.average_rating), reviews };
  console.log(p.handle, json.number_of_reviews, 'reviews, parsed', reviews.length);
}
// Review photos: download and resize so they are not hot-linked from Judge.me (which needs a referer)
const { default: sharp } = await import('sharp');
fs.mkdirSync('../preview/data/img/reviews', { recursive: true });
let n = 0;
for (const [h, x] of Object.entries(out)) for (const r of x.reviews) {
  const local = [];
  for (const url of r.pictures) {
    const name = h + '-' + (++n) + '.webp';
    const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://kusho.in/' } })).arrayBuffer());
    await sharp(buf).rotate().resize(480, 480, { fit: 'cover' }).webp({ quality: 82 }).toFile('../preview/data/img/reviews/' + name);
    local.push('/data/img/reviews/' + name);
  }
  r.pictures = local;
}
fs.writeFileSync('../preview/data/reviews.json', JSON.stringify(out, null, 2) + '\n');
const total = Object.values(out).reduce((n, x) => n + x.reviews.length, 0);
console.log('saved', total, 'reviews for', Object.keys(out).length, 'products');
