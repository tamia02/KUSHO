import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dest = '../preview/data';
fs.mkdirSync(`${dest}/img`, { recursive: true });

// 1. collection membership (real)
const cols = ['pillows', 'cushions', 'combos', 'travel', 'cars', 'accessories', 'buy-one-get-one-free'];
const membership = {};
for (const c of cols) {
  const r = await fetch(`https://kusho.in/collections/${c}/products.json?limit=250`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  membership[c] = (await r.json()).products.map((p) => p.handle);
  console.log(c, membership[c].length);
}
fs.writeFileSync(`${dest}/collections.json`, JSON.stringify(membership, null, 2));

// 2. products + policies
fs.copyFileSync('products.json', `${dest}/products.json`);
fs.copyFileSync('policies.json', `${dest}/policies.json`);

// 3. optimised images (webp, max 1000px)
let bytesIn = 0, bytesOut = 0, n = 0;
for (const handle of fs.readdirSync('products')) {
  const out = `${dest}/img/${handle}`;
  fs.mkdirSync(out, { recursive: true });
  for (const f of fs.readdirSync(`products/${handle}`)) {
    const src = `products/${handle}/${f}`;
    const num = path.parse(f).name;
    const buf = await sharp(src).resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    fs.writeFileSync(`${out}/${num}.webp`, buf);
    bytesIn += fs.statSync(src).size; bytesOut += buf.length; n++;
  }
}
console.log(`images: ${n}, ${(bytesIn / 1e6).toFixed(1)} MB -> ${(bytesOut / 1e6).toFixed(1)} MB`);

// 4. logo (official file from kusho.in), trimmed and resized
const logo = await sharp('img/kusho-removebg-preview.png').trim().resize({ height: 240 }).png({ compressionLevel: 9 }).toBuffer();
fs.writeFileSync('../kusho-theme/assets/kusho-logo.png', logo);
const meta = await sharp(logo).metadata();
console.log('logo', meta.width, 'x', meta.height, (logo.length / 1024).toFixed(0) + ' KB');
