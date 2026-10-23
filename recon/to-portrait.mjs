// Turns square product creatives into the site's 1200x1500 portrait shape without redrawing them.
//   node to-portrait.mjs <srcDir> <outDir>
//
// These are finished marketing layouts with headlines and labels, so nothing may be cropped away. Two moves:
//   extend - when the backdrop genuinely carries on past the edge (flat colour or a left-to-right gradient),
//            the edge row is stretched to fill the extra height and the join is invisible.
//   frame  - otherwise the square sits centred on white, which loses nothing and smears nothing.
// An edge qualifies for extend only if the first row matches a row just inside it AND that strip is calm
// enough to be backdrop rather than photograph; stretching a flat-looking piece of a photo would smear it.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const TARGET_W = 1200;
const TARGET_H = 1500;

const edgeIsBackdrop = async (buf, w, h, fromTop) => {
  const band = Math.max(12, Math.round(h * 0.03));
  const y0 = fromTop ? 0 : h - 1;
  const y1 = fromTop ? band : h - 1 - band;
  const row = async (y) => sharp(buf).extract({ left: 0, top: y, width: w, height: 1 }).raw().toBuffer();
  const [a, b] = await Promise.all([row(y0), row(y1)]);
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  if (sum / a.length >= 8) return false;
  // Smooth is not the same as uniform: a left-to-right gradient varies a lot overall yet changes gently from one
  // pixel to the next, while photographic detail jumps. Neighbour-to-neighbour change tells them apart.
  let step = 0;
  for (let i = 3; i < a.length; i++) step += Math.abs(a[i] - a[i - 3]);
  return step / a.length < 3;
};

export const toPortrait = async (buf) => {
  const base = await sharp(buf).flatten({ background: '#ffffff' }).resize({ width: TARGET_W }).png().toBuffer();
  const meta = await sharp(base).metadata();
  if (meta.height >= TARGET_H) {
    return { buf: await sharp(base).resize(TARGET_W, TARGET_H, { fit: 'cover', position: 'centre' }).png().toBuffer(), mode: 'fit' };
  }
  const extra = TARGET_H - meta.height;
  const [top, bottom] = await Promise.all([
    edgeIsBackdrop(base, meta.width, meta.height, true),
    edgeIsBackdrop(base, meta.width, meta.height, false),
  ]);
  const padTop = Math.round(extra / 2);
  const layers = [{ input: base, top: padTop, left: 0 }];
  let mode = 'frame';
  if (top && bottom) {
    mode = 'extend';
    const edge = async (y, height) =>
      sharp(base).extract({ left: 0, top: y, width: meta.width, height: 1 }).resize(meta.width, height, { fit: 'fill' }).png().toBuffer();
    layers.unshift({ input: await edge(0, padTop), top: 0, left: 0 });
    layers.push({ input: await edge(meta.height - 1, extra - padTop), top: padTop + meta.height, left: 0 });
  }
  const out = await sharp({ create: { width: TARGET_W, height: TARGET_H, channels: 3, background: '#ffffff' } })
    .composite(layers).png().toBuffer();
  return { buf: out, mode };
};

if (process.argv[2] && process.argv[3]) {
  const [srcDir, outDir] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  const counts = {};
  for (const f of fs.readdirSync(srcDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort()) {
    const { buf, mode } = await toPortrait(fs.readFileSync(path.join(srcDir, f)));
    await sharp(buf).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(path.join(outDir, f.replace(/\.(png|jpe?g|webp)$/i, '.jpg')));
    counts[mode] = (counts[mode] || 0) + 1;
  }
  console.log(path.basename(outDir).padEnd(26), JSON.stringify(counts));
}
