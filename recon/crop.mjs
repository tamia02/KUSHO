import fs from 'node:fs';
import sharp from 'sharp';

// Find the vertical seam of a two-panel image: the column with the biggest change between neighbours near the middle.
async function seam(file) {
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let best = Math.floor(w / 2), bestScore = -1;
  for (let x = Math.floor(w * 0.42); x < Math.floor(w * 0.6); x++) {
    let s = 0;
    for (let y = 0; y < h; y += 3) s += Math.abs(data[y * w + x] - data[y * w + x - 1]);
    if (s > bestScore) { bestScore = s; best = x; }
  }
  return { x: best, w, h };
}

const out = (name) => `out/${name}.webp`;
const save = async (pipeline, name, width) => {
  const buf = await pipeline.resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  fs.writeFileSync(out(name), buf);
  const m = await sharp(buf).metadata();
  console.log(name.padEnd(16), `${m.width}x${m.height}`, `${(buf.length / 1024).toFixed(0)} KB`);
};
const region = (file, fx, fy, fw, fh) =>
  sharp(file).metadata().then((m) => sharp(file).extract({ left: Math.round(m.width * fx), top: Math.round(m.height * fy), width: Math.round(m.width * fw), height: Math.round(m.height * fh) }));

// product photos, text cropped out
await save(sharp('chosen/33.jpg'), 'hero-sleep', 1000);
await save(await region('chosen/153.jpg', 0, 0.2, 1, 0.8), 'sleep', 1000);
await save(await region('chosen/137.jpg', 0, 0.2, 1, 0.68), 'sleep-2', 1000);
await save(sharp('chosen/15.jpg'), 'drive', 1000);
await save(sharp('chosen/58.jpg'), 'drive-2', 800);
await save(await region('chosen/180.jpg', 0, 0.24, 1, 0.76), 'travel', 1000);
await save(await region('chosen/182.jpg', 0, 0.27, 1, 0.73), 'travel-2', 1000);
await save(await region('chosen/117.jpg', 0, 0.34, 1, 0.66), 'gift', 1000);

// blog two-panel collages -> before / after halves
const pairs = { sleep: 'you-wake-up-with-neck-or-back-stiffness', sit: 'you-feel-lower-back-pain-after-sitting', travel: 'you-feel-aching-after-traveling' };
for (const [key, slug] of Object.entries(pairs)) {
  const file = `chosen/blog-${slug}.jpg`;
  const s = await seam(file);
  console.log(key, 'seam at', s.x, 'of', s.w, `(${(s.x / s.w * 100).toFixed(1)}%)`);
  const pad = 6; // trim the seam itself
  await save(sharp(file).extract({ left: 6, top: 6, width: s.x - pad - 6, height: s.h - 12 }).resize(640, 720, { fit: 'cover' }), `cmp-${key}-before`, 640);
  await save(sharp(file).extract({ left: s.x + pad, top: 6, width: s.w - s.x - pad - 6, height: s.h - 12 }).resize(640, 720, { fit: 'cover' }), `cmp-${key}-after`, 640);
}
await save(sharp('chosen/blog-why-choosing-ergonomic-support-is-a-smart-choice.jpg'), 'work', 1500);
await save(sharp('chosen/blog-comfort-designed-for-everyday-life.jpg'), 'strip-life', 1500);
{
  const s = await seam('chosen/blog-you-feel-lower-back-pain-after-sitting.jpg');
  await save(sharp('chosen/blog-you-feel-lower-back-pain-after-sitting.jpg').extract({ left: s.x + 6, top: 0, width: s.w - s.x - 6, height: s.h }), 'work-2', 900);
}

// review sheet
const files = fs.readdirSync('out').filter((f) => f.endsWith('.webp')).sort();
const CELL = 300, COLS = 5, comps = [];
for (let k = 0; k < files.length; k++) {
  const b = await sharp(`out/${files[k]}`).resize(CELL, CELL, { fit: 'inside', background: '#fff' }).jpeg({ quality: 75 }).toBuffer();
  const x = (k % COLS) * CELL, y = Math.floor(k / COLS) * (CELL + 24);
  comps.push({ input: b, left: x, top: y });
  comps.push({ input: Buffer.from(`<svg width="${CELL}" height="24" xmlns="http://www.w3.org/2000/svg"><text x="4" y="17" font-size="15" font-family="Arial" fill="#222">${files[k].replace('.webp', '')}</text></svg>`), left: x, top: y + CELL });
}
await sharp({ create: { width: COLS * CELL, height: Math.ceil(files.length / COLS) * (CELL + 24), channels: 3, background: '#fff' } }).composite(comps).jpeg({ quality: 80 }).toFile('out-sheet.jpg');
