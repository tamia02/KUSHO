import fs from 'node:fs';
const decode = (s) => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&#x27;/g,"'").replace(/&nbsp;/g,' ');
export function mainText(html) {
  let m = html.match(/<main[\s\S]*?<\/main>/i);
  let h = m ? m[0] : html;
  h = h.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<svg[\s\S]*?<\/svg>/gi,'');
  h = h.replace(/<\/(p|div|h[1-6]|li|tr|section)>/gi,'\n').replace(/<br\s*\/?>/gi,'\n').replace(/<li[^>]*>/gi,'- ');
  h = decode(h.replace(/<[^>]+>/g,''));
  return h.split('\n').map(l=>l.trim()).filter(Boolean).join('\n');
}
if (process.argv[2]) { console.log(mainText(fs.readFileSync(process.argv[2],'utf8'))); }
