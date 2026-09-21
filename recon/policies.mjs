import fs from 'node:fs';
// Extract the inner HTML of the element that starts at `startRe`, balancing <div> nesting.
function innerBalanced(html, startRe) {
  const m = startRe.exec(html); if (!m) return null;
  let i = m.index + m[0].length, depth = 1;
  const tag = /<(\/?)div\b[^>]*>/gi; tag.lastIndex = i;
  let t;
  while ((t = tag.exec(html))) { depth += t[1] ? -1 : 1; if (depth === 0) return html.slice(m.index + m[0].length, t.index); }
  return null;
}
const out = {};
for (const p of ['terms-of-service','privacy-policy','refund-policy','shipping-policy']) {
  const html = fs.readFileSync(`policy-${p}.html`, 'utf8');
  let body = innerBalanced(html, /<div class="shopify-policy__body"[^>]*>/i) || '';
  const inner = innerBalanced(body, /<div class="rte"[^>]*>/i);
  body = (inner || body).replace(/<script[\s\S]*?<\/script>/gi,'').trim();
  const title = (/<h1 class="shopify-policy__title"[^>]*>([\s\S]*?)<\/h1>/i.exec(html) || [,''])[1].replace(/<[^>]+>/g,'').trim();
  out[p] = { title, html: body };
  console.log(p, '|', title, '|', body.length, 'chars |', (body.match(/<h[1-4]/gi)||[]).length, 'headings');
}
fs.writeFileSync('policies.json', JSON.stringify(out, null, 2));
console.log('\n--- shipping sample:\n', out['shipping-policy'].html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,900));
console.log('\n--- terms sample:\n', out['terms-of-service'].html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,500));
