import fs from 'node:fs';
const UA = { 'User-Agent': 'Mozilla/5.0' };
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');

function innerBalanced(html, startRe) {
  const m = startRe.exec(html); if (!m) return null;
  let depth = 1; const tag = /<(\/?)div\b[^>]*>/gi; tag.lastIndex = m.index + m[0].length; let t;
  while ((t = tag.exec(html))) { depth += t[1] ? -1 : 1; if (depth === 0) return html.slice(m.index + m[0].length, t.index); }
  return null;
}

// ---- pages: return-refund body (rte inside the page section)
const rr = fs.readFileSync('page-return-refund.html', 'utf8');
let rrBody = null;
for (const re of [/<div class="rte"[^>]*>/i, /<div[^>]*class="[^"]*page-content[^"]*"[^>]*>/i, /<div[^>]*class="[^"]*main-page[^"]*"[^>]*>/i]) {
  rrBody = innerBalanced(rr, re);
  if (rrBody && /Return & Refund Policy|Return &amp; Refund Policy/.test(rrBody)) break;
  rrBody = null;
}
console.log('return-refund body:', rrBody ? rrBody.length : 'NOT FOUND');

// ---- blog: all articles
const sitemap = await (await fetch('https://kusho.in/sitemap_blogs_1.xml', { headers: UA })).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+\/blogs\/news\/[^<]+)<\/loc>/g)].map((m) => m[1]);
const articles = [];
for (const url of urls) {
  const html = await (await fetch(url, { headers: UA })).text();
  const handle = url.split('/').pop();
  const title = decode((/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html) || [, ''])[1].replace(/<[^>]+>/g, '').trim()) || handle;
  const date = (/<time[^>]*datetime="([^"]+)"/i.exec(html) || [, ''])[1];
  const art = /<article[\s\S]*?<\/article>/i.exec(html);
  let body = art ? art[0] : '';
  body = body.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<svg[\s\S]*?<\/svg>/gi, '');
  const img = (/<img[^>]+src="([^"]*cdn\/shop\/articles[^"]+)"/i.exec(body) || /<img[^>]+src="([^"]*cdn\/shop\/(?:articles|files)[^"]+)"/i.exec(body) || [, ''])[1];
  const paras = [...body.matchAll(/<(p|li|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((m) => ({ tag: m[1], text: decode(m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).replace(/^(Share\s*)+Link Close share Copy link\s*/i, '') }))
    .filter((p) => p.text.length > 2);
  articles.push({ handle, title, date, image: img ? (img.startsWith('//') ? 'https:' + img : img) : '', blocks: paras });
  console.log('-', handle, '|', date.slice(0, 10), '| blocks', paras.length, '| image', Boolean(img));
}
fs.writeFileSync('articles.json', JSON.stringify(articles, null, 2));
fs.writeFileSync('page-return-refund-body.html', rrBody || '');
