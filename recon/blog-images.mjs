import fs from 'node:fs';
import sharp from 'sharp';
const arts = JSON.parse(fs.readFileSync('articles.json', 'utf8'));
fs.mkdirSync('../preview/data/img/blog', { recursive: true });
let n = 0;
for (const a of arts) {
  if (!a.image) continue;
  const url = a.image.split('?')[0] + '?width=1000';
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) { console.log('fail', a.handle, r.status); continue; }
  const buf = Buffer.from(await r.arrayBuffer());
  const out = await sharp(buf).resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  fs.writeFileSync(`../preview/data/img/blog/${a.handle}.webp`, out);
  fs.writeFileSync(`img/blog-${a.handle}.jpg`, await sharp(buf).resize({ width: 500 }).jpeg({ quality: 70 }).toBuffer());
  const m = await sharp(out).metadata();
  a.local = `/data/img/blog/${a.handle}.webp`; a.w = m.width; a.h = m.height; n++;
}
fs.writeFileSync('articles.json', JSON.stringify(arts, null, 2));
console.log('saved', n, 'article images');
