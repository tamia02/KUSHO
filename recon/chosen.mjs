import fs from 'node:fs';
import sharp from 'sharp';
const products = JSON.parse(fs.readFileSync('products.json', 'utf8')).products;
const index = JSON.parse(fs.readFileSync('sheet-index.json', 'utf8'));
const want = [33, 4, 6, 137, 153, 134, 138, 15, 58, 150, 21, 147, 168, 171, 48, 43, 180, 182, 174, 176, 178, 181, 117, 2, 63, 151, 110, 5];
fs.mkdirSync('chosen', { recursive: true });
const rows = [];
for (const n of want) {
  const e = index.find((x) => x.n === n);
  const p = products.find((x) => x.handle === e.handle);
  const im = p.images[e.img - 1];
  const r = await fetch(im.src.split('?')[0] + '?width=1400', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(`chosen/${n}.jpg`, buf);
  const m = await sharp(buf).metadata();
  rows.push({ n, handle: e.handle, w: m.width, h: m.height });
}
console.log(rows.map((r) => `${r.n}:${r.w}x${r.h}`).join('  '));
// review sheet: 4 columns x 7 rows, 300px cells
const CELL = 300, COLS = 4;
const comps = [];
for (let k = 0; k < want.length; k++) {
  const n = want[k];
  const buf = await sharp(`chosen/${n}.jpg`).resize(CELL, CELL, { fit: 'inside', background: '#fff' }).jpeg({ quality: 78 }).toBuffer();
  comps.push({ input: buf, left: (k % COLS) * CELL, top: Math.floor(k / COLS) * CELL });
  comps.push({ input: Buffer.from(`<svg width="60" height="30" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="30" fill="#000" opacity=".8"/><text x="8" y="22" font-size="20" font-family="Arial" fill="#fff" font-weight="700">${n}</text></svg>`), left: (k % COLS) * CELL, top: Math.floor(k / COLS) * CELL });
}
await sharp({ create: { width: COLS * CELL, height: Math.ceil(want.length / COLS) * CELL, channels: 3, background: '#fff' } }).composite(comps).jpeg({ quality: 80 }).toFile('chosen-sheet.jpg');
