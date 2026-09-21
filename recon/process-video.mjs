// Turns the raw Veo clips in ../public/assets into web-ready loops.
//   - trims the first second where needed (a camera rig is visible at the start of the pillow clip)
//   - paints out Veo's sparkle watermark (a 68x68 box at 1126,566 in every clip) with the delogo filter
//   - crossfades the last second into the first so the loop has no visible seam
//   - H.264, CRF 24, no audio, faststart
// Writes: ../public/assets/web/<slot>.mp4 (for uploading to Shopify) and ../preview/data/video/<slot>.mp4 (local preview),
// plus a poster frame ../kusho-theme/assets/kusho-photo-<photo>.webp so the photo under each video matches its first frame.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const FF = 'C:/Users/tasmi/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe';
const FP = FF.replace(/ffmpeg\.exe$/, 'ffprobe.exe');
const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'public', 'assets');
const outWeb = path.join(src, 'web');
const outPreview = path.join(root, 'preview', 'data', 'video');
const themeAssets = path.join(root, 'kusho-theme', 'assets');
for (const d of [outWeb, outPreview]) fs.mkdirSync(d, { recursive: true });

const clips = [
  { file: 'Woman_resting_on_pillow', slots: ['hero', 'sleep'], trim: 1.0, poster: ['hero-sleep', 'sleep-2'] },
  { file: 'Man_resting_in_parked_car', slots: ['drive'], trim: 0, poster: ['drive-2'] },
  { file: 'Woman_typing_at_laptop', slots: ['work'], trim: 0, poster: ['work'] },
  { file: 'Woman_resting_against_travel_pillow', slots: ['travel'], trim: 0, poster: ['travel-2'] },
];

const duration = (f) => Number(execFileSync(FP, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());
const XF = 1; // seconds of crossfade at the loop seam

for (const c of clips) {
  const input = fs.readdirSync(src).find((n) => n.startsWith(c.file) && n.endsWith('.mp4'));
  if (!input) { console.log('missing', c.file); continue; }
  const inPath = path.join(src, input);
  const total = duration(inPath);
  const usable = total - c.trim; // length after the trim
  const mainLen = usable - XF; // main body, the head (first XF s) is blended into its tail
  const first = path.join(outWeb, `${c.slots[0]}.mp4`);

  const filter =
    `[0:v]trim=start=${c.trim},setpts=PTS-STARTPTS,delogo=x=1126:y=566:w=68:h=68,split=2[a][b];` +
    `[a]trim=start=${XF},setpts=PTS-STARTPTS[main];` +
    `[b]trim=end=${XF},setpts=PTS-STARTPTS[head];` +
    `[main][head]xfade=transition=fade:duration=${XF}:offset=${(mainLen - XF).toFixed(3)},format=yuv420p[v]`;

  execFileSync(FF, ['-y', '-v', 'error', '-i', inPath, '-filter_complex', filter, '-map', '[v]', '-an',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-profile:v', 'high', '-level', '4.0', '-movflags', '+faststart', first]);

  // poster: first frame of the processed clip
  const png = path.join(outWeb, `${c.slots[0]}-poster.png`);
  execFileSync(FF, ['-y', '-v', 'error', '-i', first, '-frames:v', '1', png]);
  const buf = fs.readFileSync(png);
  for (const p of c.poster) {
    await sharp(buf).resize(1280).webp({ quality: 82 }).toFile(path.join(themeAssets, `kusho-photo-${p}.webp`));
  }
  fs.unlinkSync(png);

  for (const slot of c.slots) {
    if (slot !== c.slots[0]) fs.copyFileSync(first, path.join(outWeb, `${slot}.mp4`));
    fs.copyFileSync(first, path.join(outPreview, `${slot}.mp4`));
  }
  const size = (fs.statSync(first).size / 1024 / 1024).toFixed(2);
  console.log(`${input} -> ${c.slots.join(', ')}  ${duration(first).toFixed(2)}s  ${size} MB  posters: ${c.poster.join(', ')}`);
}
