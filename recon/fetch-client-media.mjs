// Pulls the client's creative folders from Drive and writes them into ../public/product-media/<handle>/
// as 1200x1500 portrait JPEGs, numbered in the designer's own order.
//   node fetch-client-media.mjs
// Shape conversion is done by to-portrait.mjs. Re-running replaces a product's set.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { toPortrait } from './to-portrait.mjs';

const NEW_CREATIVE = '1m-_VcFQE0obnqvcHWiFiyjreoYsjjZJC';
// handle -> either a folder id, or [parentId, 'child folder name']
const SOURCES = {
  'kusho-car-comfort-combo': '13YkiEiPLzNEZiJfStbgxbLgpJ6bUYfCB',
  'kusho-ultimate-pro-seating-combo': '1THJxy3xxC-CR5LbkT1QsqKyV18kmWnDU',
  'kusho-travel-neck-support': '12cujpr3Y1VxSP-emuWdsxrHNqnsTqQRK',
  'kusho-baby-care-pillow': [NEW_CREATIVE, 'KUSHO BABY CARE PILLOW'],
  'kusho-car-neck-support-broad': [NEW_CREATIVE, 'KUSHO CAR NECK CUSHION (GREY + BLACK)'],
  'kusho-car-neck-pillow': [NEW_CREATIVE, 'KUSHO CAR NECK PILLOW GREY'],
  'kusho-car-seat-cushion': [NEW_CREATIVE, 'KUSHO CAR SEAT CUSHION'],
  'kusho-comfy-wedge-pillow': [NEW_CREATIVE, 'KUSHO COMPY WEDGE PILLOW'],
  'kusho-cervical-butterfly-pillow': [NEW_CREATIVE, 'KUSHO DREAMER CERVICAL PILLOW'],
  'kusho-cuddle-sleep-pillow': [NEW_CREATIVE, 'KUSHO DREAMER CUDDLE PILLOW FOR HER'],
  'kusho-cuddle-pillow-for-him': [NEW_CREATIVE, 'KUSHO DREAMER CUDDLE PILLOW FOR HIM'],
  'kusho-dreamer-pillow': [NEW_CREATIVE, 'KUSHO DREAMER PILLOW'],
  'kusho-ergo-lumbar-cushion': [NEW_CREATIVE, 'KUSHO ERGO LUMBAR CUSHION (GREY)'],
  'kusho-ultimate-car-neck-rest-pillow': [NEW_CREATIVE, 'KUSHO LUMBAR BACK PRO CUSHION (GREY)'],
  'kusho-tailbone-pro-cushion': [NEW_CREATIVE, 'KUSHO TAILBONE PRO CUSHION (GREY)'],
  'kusho-tailbone-support-cushion': [NEW_CREATIVE, 'KUSHO TAILBONE SUPPORT CUSHION (GREY)'],
  'kusho-travel-neck-pillow': [NEW_CREATIVE, 'KUSHO TRAVEL NECK PILLOW (GREY)'],
};

const UA = { 'User-Agent': 'Mozilla/5.0' };
const listFolder = async (id) => {
  const html = await (await fetch(`https://drive.google.com/embeddedfolderview?id=${id}#list`, { headers: UA })).text();
  const ids = [...html.matchAll(/id="entry-([^"]+)"/g)].map((m) => m[1]);
  const names = [...html.matchAll(/flip-entry-title">([^<]*)/g)].map((m) => m[1]);
  return ids.map((fid, i) => ({ id: fid, name: (names[i] || '').trim() }));
};
const numeric = (n) => { const m = /(\d+)/.exec(n); return m ? Number(m[1]) : 1e9; };

const outRoot = path.resolve(import.meta.dirname, '..', 'public', 'product-media');
for (const [handle, src] of Object.entries(SOURCES)) {
  let folderId = src;
  if (Array.isArray(src)) {
    const children = await listFolder(src[0]);
    const hit = children.find((c) => c.name.toLowerCase() === src[1].toLowerCase()) || children.find((c) => c.name.toLowerCase().startsWith(src[1].toLowerCase().slice(0, 18)));
    if (!hit) { console.log('NO FOLDER for', handle, '->', src[1]); continue; }
    folderId = hit.id;
  }
  const files = (await listFolder(folderId)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f.name)).sort((a, b) => numeric(a.name) - numeric(b.name));
  if (!files.length) { console.log('NO FILES for', handle); continue; }
  const dir = path.join(outRoot, handle);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const modes = {};
  let i = 0;
  for (const f of files) {
    const res = await fetch(`https://drive.google.com/uc?export=download&id=${f.id}`, { headers: UA });
    if (!res.ok) { console.log('  download failed', handle, f.name); continue; }
    const { buf, mode } = await toPortrait(Buffer.from(await res.arrayBuffer()));
    modes[mode] = (modes[mode] || 0) + 1;
    const stem = path.basename(f.name).replace(/\.(png|jpe?g|webp)$/i, '').replace(/[^\w-]/g, '');
    await sharp(buf).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(path.join(dir, `${String(++i).padStart(2, '0')}-${stem}.jpg`));
  }
  console.log(`${handle.padEnd(38)} ${String(i).padStart(2)} images  ${JSON.stringify(modes)}`);
}
