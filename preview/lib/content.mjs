// Real kusho.in content for the preview: blog articles, pages and policies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { policies } from './real.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const data = (f) => JSON.parse(fs.readFileSync(path.resolve(here, '..', 'data', f), 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ---- blog ----
const TAGS = { 'why-back': 'Sleep', 'sleep-without': 'Sleep', 'you-sleep': 'Sleep', 'you-wake': 'Posture', 'too-much': 'Posture', 'screens': 'Posture', 'you-experience': 'Posture', 'you-feel-lower': 'Posture', 'you-feel-aching': 'Travel' };
const tagFor = (handle) => Object.entries(TAGS).find(([k]) => handle.startsWith(k))?.[1] || 'Comfort';

const toHtml = (blocks) => {
  let html = '';
  let list = false;
  for (const b of blocks) {
    if (/leave a comment/i.test(b.text)) continue;
    if (b.tag === 'li') { if (!list) { html += '<ul>'; list = true; } html += `<li>${esc(b.text)}</li>`; continue; }
    if (list) { html += '</ul>'; list = false; }
    html += b.tag === 'p' ? `<p>${esc(b.text)}</p>` : `<h2>${esc(b.text)}</h2>`;
  }
  return list ? html + '</ul>' : html;
};

const articles = data('articles.json').map((a, i) => {
  const content = toHtml(a.blocks);
  return {
    id: 7000 + i,
    title: a.title,
    handle: a.handle,
    url: `/blogs/news/${a.handle}`,
    published_at: a.date,
    author: 'Kusho',
    tags: [tagFor(a.handle)],
    image: a.local ? { src: a.local, alt: a.title, width: a.w, height: a.h, aspect_ratio: a.w / a.h, media_type: 'image' } : null,
    content,
    excerpt: '',
    excerpt_or_content: content,
    comments_count: 0,
    'comments_enabled?': false,
  };
});

export const blog = { id: 6000, title: 'Journal', handle: 'news', url: '/blogs/news', articles, articles_count: articles.length, tags: ['Sleep', 'Posture', 'Travel', 'Comfort'] };

// ---- pages ----
const refundText = `
<p>Hey, we know sometimes things don't work. If you didn't like our product, you may return it, no hard feelings!</p>
<h2>Please keep these things in mind</h2>
<p><strong>Return and refund policy:</strong> You have 7 days from the date of delivery to initiate a return or refund. After this period, returns and refunds will not be accepted.</p>
<p>Before requesting a refund, we highly recommend using the product for at least two days. Your body needs time to adjust to the improved posture and support our products provide. Give it a little time, you might just feel the difference!</p>
<p><strong>Convenience:</strong> To make the process hassle-free for you, we offer reverse pick-up services. Please note that this feature depends on your area's pin code.</p>
<p><strong>Condition:</strong> For a smooth refund process, kindly ensure that the product(s) are returned in their original condition. We will not be able to give a refund for products showing signs of wear, damage or dirt.</p>
<p><strong>Back to source:</strong> Once the product is received, it will undergo a quality check. If it passes, the refund will be processed to the original payment method in case of a prepaid order.</p>
<p><strong>Partial refund:</strong> For a partial return on combo or bundle discounted orders, the refund amount will be calculated based on the actual (non-discounted) price of the product. If the return doesn't fulfil the free-product criteria, then it has to be returned too.</p>
<h2>Terms and conditions</h2>
<p><strong>Time-bound returns:</strong> Products returned beyond the 7-day period, or those showing signs of use or damage, cannot be accepted for returns or exchanges.</p>
<p><strong>Sales platform:</strong> For sales from platforms like Amazon, Flipkart, or other marketplaces, returns may not be applicable from our website.</p>
<p><strong>Refund timeline:</strong> Refunds will be processed within 7 working days from the date we receive the goods and confirm the quality check.</p>
<h2>Got questions?</h2>
<p>Reach out to us at +91 7049726060, ping us on WhatsApp, or send a note to <a href="mailto:support@kusho.in">support@kusho.in</a>. Our team is available Monday to Friday, 10 AM to 6 PM.</p>`;

export const pages = {
  'return-refund': { title: 'Return and refund', template: 'page', content: refundText },
  'upcoming-products': { title: 'Upcoming products', template: 'page', content: '<p>New comfort is on the way. Follow us on Instagram and Facebook for the first look, or message us on WhatsApp to be told when something new arrives.</p>' },
  'about-us': { title: 'About us', template: 'page.about', content: '' },
  contact: { title: 'Contact', template: 'page.contact', content: '' },
  'contact-us': { title: 'Contact', template: 'page.contact', content: '' },
  faqs: { title: 'FAQs', template: 'page.faq', content: '' },
  help: { title: 'Help', template: 'page.faq', content: '' },
  'help-1': { title: 'Help', template: 'page.faq', content: '' },
  'corporate-gifting': { title: 'Corporate gifting', template: 'page.corporate-gifting', content: '' },
  corporategifting: { title: 'Corporate gifting', template: 'page.corporate-gifting', content: '' },
  'become-a-retailer': { title: 'Become a retailer', template: 'page.retailer', content: '' },
  becomearetailer: { title: 'Become a retailer', template: 'page.retailer', content: '' },
  'campus-ambassador': { title: 'Campus ambassador', template: 'page.campus', content: '' },
  'affiliate-program': { title: 'Affiliate programme', template: 'page.affiliate', content: '' },
  'kusho-catalogue': { title: 'Kusho catalogue', template: 'page.catalogue', content: '' },
  'collection-bundle': { title: 'Collection bundle', template: 'page', content: '<p>Explore our combos for complete comfort at a better price.</p><p><a href="/collections/combos">Shop combos</a></p>' },
};
for (const [handle, p] of Object.entries(pages)) Object.assign(p, { handle, url: `/pages/${handle}`, id: 8000 + Object.keys(pages).indexOf(handle) });

export const policyPages = {
  'terms-of-service': { title: 'Terms of service', html: policies['terms-of-service'].html },
  'privacy-policy': { title: 'Privacy policy', html: policies['privacy-policy'].html },
  'refund-policy': { title: 'Refund policy', html: policies['refund-policy'].html },
  'shipping-policy': { title: 'Shipping policy', html: policies['shipping-policy'].html },
};
