import fs from 'node:fs';
import path from 'node:path';
const products = JSON.parse(fs.readFileSync('products.json', 'utf8')).products;
const MAX = 8;
let ok = 0, fail = 0;
async function get(url, file) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) throw new Error(r.status);
      fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
      return true;
    } catch (e) { await new Promise(r => setTimeout(r, 400)); }
  }
  return false;
}
const jobs = [];
for (const p of products) {
  const dir = path.join('products', p.handle);
  fs.mkdirSync(dir, { recursive: true });
  p.images.slice(0, MAX).forEach((im, i) => {
    const ext = /\.png/i.test(im.src) ? 'png' : 'jpg';
    jobs.push({ url: im.src.split('?')[0] + '?width=1100', file: path.join(dir, `${i + 1}.${ext}`) });
  });
}
const pool = 8;
let idx = 0;
await Promise.all(Array.from({ length: pool }, async () => {
  while (idx < jobs.length) { const j = jobs[idx++]; (await get(j.url, j.file)) ? ok++ : fail++; }
}));
console.log('downloaded', ok, 'failed', fail, 'of', jobs.length);
