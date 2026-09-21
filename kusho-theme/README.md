# Kusho theme

Shopify Online Store 2.0 theme for kusho.in (a brand of 3C Ventures).
Forked from Shopify's Dawn (MIT, see `LICENSE.md`) and re-skinned to the Kusho design system
described in *Kusho — Website Redesign: Design System, Motion & Shopify Development Guide*, then taken in a
**quiet-luxury direction** (thin uppercase display type, near-monochrome, square edges, full-bleed hero) after
the client asked for a more expensive, minimal look.

Section numbers below (for example "guide 10.5") refer to that guide.

## Preview locally first (no Shopify store needed)

The `../preview` folder renders this theme on your computer with sample data:

```bash
cd ../preview && npm install && npm start     # http://localhost:3000  (phone view: /_mobile)
```

See `../preview/README.md` for what is real and what is stand-in.

## Run it against Shopify

```bash
npm install -g @shopify/cli@latest        # Node 20+
cd kusho-theme
shopify theme dev --store <your-store>.myshopify.com   # preview; live theme untouched
shopify theme check                                    # 0 errors expected
shopify theme push --unpublished --theme "Kusho 2026 — build"   # unpublished copy for review
```

Before the first push, **duplicate the live theme as a backup** (guide 14.2).

## One-time store setup

| Where | What |
|---|---|
| Settings → General → Store defaults → Currency formatting | Change the HTML format to `₹{{amount_no_decimals}}` (fixes the live `₹.2,975.00` prices) |
| Collections | Create a `best-sellers` collection (the homepage uses it). Combos, Pillows, Cushions, Travel and Cars already exist on the store |
| Blogs | The homepage and blog use the existing blog with the handle `news` |
| Navigation | Create menus with the handles `footer-shop`, `footer-help`, `footer-company`, `footer-partner`; keep `main-menu` |
| Pages | Assign each page its template: about-us → *page.about*, contact → *page.contact*, faqs → *page.faq*, corporate-gifting → *page.corporate-gifting*, become-a-retailer → *page.retailer*, campus-ambassador → *page.campus*, affiliate-program → *page.affiliate*, kusho-catalogue → *page.catalogue*, return-refund → *page* |
| Products | The Dreamer Cervical Pillow uses the **product.stacked** template (Products → the product → Theme template), which lists its photos top to bottom instead of a carousel. Assign it to any product that should read that way |
| Pages | Delete the duplicates `/pages/corporategifting` and `/pages/becomearetailer` (301 redirect to the hyphenated versions) |
| Products → Tags | Optional badge tags: `badge:bestseller`, `badge:new`, `badge:limited`, `badge:bogo`, `badge:deal-of-the-day` |
| Custom data → Product metafields | Namespace `kusho`. Create these and the product page fills itself in (empty ones simply do not show): |
| | `tagline` single line · `short_benefit` single line (cards) · `key_benefits`, `best_for`, `in_the_box`, `care`, `how_to`: multi-line text, **one item per line** |
| | `specs`: multi-line, one **`Label: value`** per line · `features`: one **`Title | text`** per line · `faqs`: one **`Question || Answer`** per line |
| Discounts | Create the code **WELCOME10** (or change it in the Welcome offer popup section). The popup posts Shopify's customer form: email goes to the customer list with the tags newsletter and popup, the phone number is saved as a customer note. For SMS/WhatsApp-only capture use Shopify Forms or Klaviyo and switch the section off |
| Product page → Offers | Offer blocks are display only. Each one must match a real discount rule in Shopify (or GoKwik) |

The logo is bundled (`assets/kusho-logo.png`, the official file from kusho.in), so nothing needs uploading.
Business details (3C VENTURES, address, GSTIN, support@kusho.in, +91 7049726060, WhatsApp, Instagram, Facebook,
YouTube) come from the live site and sit in Theme settings → Kusho, where they can be edited.

Star ratings read Shopify's standard `reviews.rating` / `reviews.rating_count` metafields (Judge.me writes them).
The review list on the product page renders a `kusho.reviews` JSON metafield (list of {rating, author, title, body,
date, verified, pictures}); the preview fills it with the 22 real reviews pulled from the live store's Judge.me widget
(`recon/reviews.mjs`). On the live store, either keep Judge.me and add its app block to the "Product reviews" section,
or sync reviews into that metafield. The homepage "Customer words" section holds nine of those real reviews as editable blocks.

## What is built

**Foundation:** design tokens and motion tokens, base re-skin of Dawn, Kusho colour schemes, official logo in the header,
announcement bar, ink-black footer with legal details, floating WhatsApp button, one icon family.

**Homepage** (`templates/index.json`), built around real photos of people:
- **Hero:** full-screen photo (or video) of a woman sleeping on a Kusho pillow, darkened, with a centred thin
  uppercase headline and one outline button. The header floats transparent over it. Assurances and the featured
  product (pick it in the section settings) sit in a thin strip underneath.
- **Ribbon:** a thin uppercase line of moving text between hairlines, with a pause button.
- **Shop by need:** five photo tiles (sleep, drive, work, travel, gifting) with hover zoom.
- **Bestsellers,** then **before/after slider** with three scenes (sleeping, sitting, travelling). It plays a short demo
  sweep the first time it scrolls into view so people see it can be dragged.
- **"Comfort for every part of your day":** cards that stack and scale as you scroll, with a step index on desktop.
- **Why Kusho** (with a photo strip), combos, corporate gifting and retailer panels with photos, journal (latest real
  articles) and FAQ.
- **Site-wide motion** (`kusho-reveal.js`): sections fade and rise as they scroll in, gentle parallax on the hero photo,
  a thin gold scroll-progress bar.

**Product page:** swipeable gallery with thumbnails and zoom, price with "You save", offers, colour swatches, quantity,
Add to cart and Buy now, pincode delivery estimate, trust row, accordions (description, specifications, what's in the box,
care, delivery and returns), shared FAQ, "why it works" and "how to use" (from metafields), reviews summary, sticky
add-to-cart bar, "you may also like".

**Content pages** (all real text from kusho.in): About, Contact (with legal entity and form), FAQs (14 questions, with search),
Return and refund (with "on this page" links), Corporate gifting, Become a retailer, Campus ambassador, Affiliate programme,
Catalogue, the four policies (Terms, Privacy, Refund, Shipping), Blog (topic filters) and Article pages, 404.

**Photos** (`assets/kusho-photo-*.webp`, 17 files): cropped from the product galleries and blog images already on
kusho.in, with any text baked into the image removed. Every photo can be replaced from the section settings in the theme
editor (hero photo, before/after pairs, bento tiles, business panels) without touching code. Two things to know:
the source files are about 1000px wide, so they are slightly soft on very sharp screens, and some of the photos are
AI-generated stock that kusho.in already publishes. A proper shoot of real customers is the best upgrade.

## Not built yet

Cart drawer tiers and upsells, GoKwik / KwikPass wiring, collection filters restyle, "anatomy of comfort" scroll,
frequently bought together and comparison table, video and 3D media, reviews app blocks, tracking, SEO schema beyond
Product, FAQ and Article, account pages (Shopify hosts these), Hindi.

Draft copy to review: the Corporate gifting, Retailer, Campus ambassador and Affiliate pages had no text on the live
site, so their wording is a first draft. The Return and refund text is the live text with punctuation tidied.
Health statements (for example "helps with neck and back pain") come from the live FAQ and blog, so please have them
reviewed against advertising rules before launch.

## Checked, and not checked

- `shopify theme check`: 0 errors. 9 warnings, all in untouched Dawn files.
- Local preview in Edge at 1440px and 390px: 64 pages and 248 assets crawled with no failures; 107 checks on every
  page type (no sideways scroll on phones, no broken images, one h1 each, slider, FAQ search, contact form labels),
  33 product-page interaction checks and 19 homepage motion checks (scroll reveal, progress bar, parallax, ribbon pause,
  slider demo and drag, stacking cards, reduced-motion switches everything off) all pass.
- Fixed while testing: Dawn hides every empty `div` (`div:empty { display: none }`), which would have hidden the progress
  bar on a real store. It is now a `span`.
- **Not yet run against a live Shopify store:** add to cart, the cart drawer, filters, search, fonts from Shopify's CDN,
  and form delivery are untested until the theme is connected.
- Motion is off for visitors with `prefers-reduced-motion`, and can be switched off in Theme settings → Kusho.

## Look and feel

- **Fonts:** Josefin Sans (300, uppercase, letter-spaced) for display and headings; Assistant for body, UI and
  buttons. Both are set in Theme settings → Typography, so they can be swapped in the editor.
- **Colour:** ink `#16211C` on white and warm off-white `#F5F4F0`. Brand green is a hover and accent colour, not a
  background. Gold appears only as hairlines. Dark sections (Why Kusho, business panel, footer) use the ink scheme.
- **Shape:** every radius token is 0. No drop shadows. Depth comes from tone and hairlines.
- **Homepage hero:** full-bleed photo or video filling the first screen, header floats transparent over it and
  turns frosted white once you scroll. Assurances and the featured product sit in a thin strip below.
- **Where it lives:** tokens in `kusho-tokens.css`, global type and buttons in `kusho-base.css`, and the
  restyle of every component in `kusho-luxe.css` (loads last on every page). To go back to the brighter first
  build, remove `kusho-luxe.css` from `layout/theme.liquid` and restore the earlier tokens.
- **Videos:** the four lifestyle clips (sleep, drive, work, travel) ship inside the theme as `assets/kusho-video-*.mp4`
  (0.3 to 0.6 MB each), so the hero, the "how to use" cards and the product page's "See it in use" band play them with no
  uploads. The product band picks the clip from the product (car, travel, cushion, else pillow); a `kusho.video` file
  metafield on a product overrides it. Every slot also accepts an uploaded video from the theme editor. `kusho-video.js` plays a clip only while it is on screen, adds a pause button, and shows the
  photo instead for reduced-motion and data-saver visitors.

## Conventions

- Component CSS/JS lives in `assets/kusho-*.css|js` and is loaded by the section that needs it.
- Tokens are CSS custom properties (`--kusho-green`, `--sp-4`, `--dur-settle`, `--ease-foam`). 1rem = 10px (Dawn).
- Only `transform`, `opacity` and SVG `stroke-dashoffset` are animated on scroll or load.
- No jQuery, no animation libraries.
- Display text, labels, nav and buttons are uppercase and letter-spaced (the `.kusho-label` class). Body copy is
  sentence case.
