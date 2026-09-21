import fs from 'node:fs';
import sharp from 'sharp';
const products = JSON.parse(fs.readFileSync('products.json', 'utf8')).products;
fs.mkdirSync('all', { recursive: true });
const items = [];
for (const p of products) p.images.forEach((im, i) => items.push({ handle: p.handle, n: i + 1, url: im.src.split('?')[0] + '?width=500', file: `all/${p.handle}__${i + 1}.jpg` }));
console.log('total images', items.length);
let idx = 0;
await Promise.all(Array.from({ length: 10 }, async () => {
  while (idx < items.length) {
    const it = items[idx++];
    if (fs.existsSync(it.file)) continue;
    for (let t = 0; t < 3; t++) { try { const r = await fetch(it.url, { headers: { 'User-Agent': 'Mozilla/5.0' } }); if (!r.ok) throw 0; fs.writeFileSync(it.file, Buffer.from(await r.arrayBuffer())); break; } catch { await new Promise(r => setTimeout(r, 300)); } }
  }
}));
// contact sheets: 6 columns x 5 rows, numbered
const CELL = 200, COLS = 6, ROWS = 5, PER = COLS * ROWS;
const sheets = Math.ceil(items.length / PER);
const index = [];
for (let s = 0; s < sheets; s++) {
  const slice = items.slice(s * PER, (s + 1) * PER);
  const comps = [];
  for (let k = 0; k < slice.length; k++) {
    const it = slice[k];
    if (!fs.existsSync(it.file)) continue;
    const buf = await sharp(it.file).resize(CELL, CELL, { fit: 'cover' }).jpeg({ quality: 70 }).toBuffer();
    const x = (k % COLS) * CELL, y = Math.floor(k / COLS) * CELL;
    comps.push({ input: buf, left: x, top: y });
    const label = Buffer.from(`<svg width="56" height="30" xmlns="http://www.w3.org/2000/svg"><rect width="56" height="30" fill="#000" opacity=".75"/><text x="8" y="21" font-size="18" font-family="Arial" fill="#fff" font-weight="700">${s * PER + k + 1}</text></svg>`);
    comps.push({ input: label, left: x, top: y });
    index.push({ n: s * PER + k + 1, handle: it.handle, img: it.n });
  }
  await sharp({ create: { width: COLS * CELL, height: ROWS * CELL, channels: 3, background: '#fff' } }).composite(comps).jpeg({ quality: 72 }).toFile(`sheet-${s + 1}.jpg`);
}
fs.writeFileSync('sheet-index.json', JSON.stringify(index));
console.log('sheets:', sheets);
