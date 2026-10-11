// Turns client-supplied product photos into the preview's product galleries.
//   node apply-product-images.mjs
// Source:  ../public/product-media/<product-handle>/NN-name.jpg   (committed; the number is the gallery order)
// Writes:  ../preview/data/img/<product-handle>/N.webp            (what the preview serves)
//          and rewrites that product's images[] in ../preview/data/products.json so the count and
//          dimensions line up (preview/lib/real.mjs maps images[i] -> /data/img/<handle>/(i+1).webp).
// Re-running recon/build-data.mjs would pull the live store's photos back over these, so run this after it.
// On Shopify the client uploads the same files to the product; nothing here is pushed to the store.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const mediaDir = path.join(root, 'public', 'product-media');
const imgDir = path.join(root, 'preview', 'data', 'img');
const productsFile = path.join(root, 'preview', 'data', 'products.json');

const raw = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
const list = raw.products || raw;
let changed = 0;

for (const handle of fs.readdirSync(mediaDir)) {
  const src = path.join(mediaDir, handle);
  if (!fs.statSync(src).isDirectory()) continue;
  const product = list.find((p) => p.handle === handle);
  if (!product) { console.log('no product for', handle); continue; }

  const files = fs.readdirSync(src).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
  const out = path.join(imgDir, handle);
  fs.mkdirSync(out, { recursive: true });

  const images = [];
  for (let i = 0; i < files.length; i++) {
    const buf = fs.readFileSync(path.join(src, files[i]));
    const meta = await sharp(buf).metadata();
    await sharp(buf).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(out, `${i + 1}.webp`));
    const old = product.images[i] || {};
    images.push({
      id: old.id || Number(`90${i}${handle.length}`),
      position: i + 1,
      src: `product-media/${handle}/${files[i]}`,
      width: meta.width,
      height: meta.height,
    });
  }
  // drop files left over from a longer previous gallery
  for (const f of fs.readdirSync(out)) {
    const n = Number(path.basename(f, '.webp'));
    if (Number.isFinite(n) && n > files.length) fs.unlinkSync(path.join(out, f));
  }
  product.images = images;
  changed++;
  console.log(`${handle}: ${files.length} images (${images[0].width}x${images[0].height})`);
}

fs.writeFileSync(productsFile, JSON.stringify(raw, null, 2) + '\n');
console.log('updated', changed, 'products');
