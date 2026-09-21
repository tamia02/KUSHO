import fs from 'node:fs';
const a = JSON.parse(fs.readFileSync('articles.json', 'utf8'));
fs.mkdirSync('chosen', { recursive: true });
for (const h of ['you-wake-up-with-neck-or-back-stiffness', 'you-sleep-but-don-t-feel-rested', 'you-feel-lower-back-pain-after-sitting', 'you-feel-aching-after-traveling', 'comfort-designed-for-everyday-life', 'why-choosing-ergonomic-support-is-a-smart-choice']) {
  const x = a.find((y) => y.handle === h);
  const r = await fetch(x.image.split('?')[0] + '?width=1800', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  fs.writeFileSync(`chosen/blog-${h}.jpg`, Buffer.from(await r.arrayBuffer()));
}
console.log('ok');
