# Kusho local preview

Runs the real theme in `../kusho-theme` on your computer with **sample data**, so it can be reviewed
before it is connected to a Shopify store. It renders the actual Liquid, CSS and JavaScript: edit a theme
file, refresh the browser, see the change. Nothing in this folder is uploaded to Shopify.

## Start

```bash
cd preview
npm install        # first time only
npm start          # http://localhost:3000
```

| Address | Shows |
|---|---|
| `http://localhost:3000/` | Homepage (desktop or whatever size your window is) |
| `http://localhost:3000/_mobile` | Homepage in a 390px phone frame |
| `http://localhost:3000/_mobile?path=/collections/pillows` | Any page in the phone frame |
| `http://localhost:3000/collections/pillows` | Collection page (also `cushions`, `combos`, `travel`, `best-sellers`, `all`) |
| `http://localhost:3000/products/kusho-cervical-butterfly-pillow` | Product page. Also try `kusho-car-neck-support-broad` (3 colours), `kusho-comfy-wedge-pillow` (sold out), `kusho-travel-neck-pillow` (MRP lower than price on the live site) |
| `/pages/about-us`, `/pages/contact`, `/pages/faqs`, `/pages/return-refund`, `/pages/corporate-gifting` … | Content pages |
| `/policies/terms-of-service` (and privacy, refund, shipping) | Policies |
| `/blogs/news`, `/blogs/news/what-actually-helps` | Blog and article |

Change the port with `PORT=4000 npm start` (PowerShell: `$env:PORT=4000; npm start`).

## What is real and what is stand-in

| Real (same code as production) | Stand-in for the preview only |
|---|---|
| All 22 products, prices, colours, photos and descriptions, copied from kusho.in (`data/`) | Ratings shown are the counts visible on the live homepage; no other reviews exist |
| Collections, blog (15 articles with photos), policies, FAQ, About, Contact, Return and refund text | Menus (built from the live navigation ideas) and the collection filters, which need Shopify |
| The official logo, legal details, GSTIN, phone, email and social links | The homepage people photos are cropped from kusho.in's own product and blog images (`kusho-theme/assets/kusho-photo-*.webp`). Swap in your own shoot through the theme editor |
| Every stylesheet and script in `kusho-theme/assets`, and the theme's settings | Fonts load from Google Fonts (production uses Shopify's font CDN) |

To refresh the product data later, re-run the scripts in `../recon` (they copy from the live site into `data/`).

A small "Local preview · data from kusho.in" pill sits bottom-left of every page. Click it to hide it before a screen-share.

## Not simulated

Add to cart and the cart drawer (buttons show a "preview only" message), collection filters
(Shopify Search & Discovery), predictive search, customer accounts, and customer accounts. The delivery checker gives an estimate from a setting, not a courier lookup. They start working when the theme is connected to Shopify.

## Host it for the client (no Shopify needed)

`npm run export` renders every page to static files in `dist/` (about 20 MB with the videos). The repo has a
`vercel.json` that runs this build, so on Vercel just import the GitHub repo and deploy: every page, the phone
frame at `/_mobile`, the videos and the 404 page all work. Search and add-to-cart are display only, as in the
local preview. Any static host works the same way (upload the `dist` folder).

## Then connect the theme to Shopify

```bash
cd ../kusho-theme
shopify theme dev --store <your-store>.myshopify.com     # live preview against real products
shopify theme push --unpublished --theme "Kusho 2026 — build"   # upload as an unpublished theme
```

Duplicate the live theme first as a backup. Full checklist: `../kusho-theme/README.md`.

## Videos

The Veo clips live in `../public/assets` (raw) and `../public/assets/web` (processed: watermark painted out, first
second trimmed where a camera rig showed, ends crossfaded into the start so they loop without a seam, ~0.3–0.5 MB each).
`node ../recon/process-video.mjs` regenerates them and also copies them to `data/video/` for this preview and writes a
matching poster frame into the theme's photo assets. On the live store, upload the files from `public/assets/web`
through each section's **Video** setting in the theme editor.

| File | Where it plays |
|---|---|
| `hero.mp4` (and `sleep.mp4`, same clip) | Homepage hero, and the "Sleep" how-to card |
| `drive.mp4` | "Drive" how-to card |
| `work.mp4` | "Work" how-to card |
| `travel.mp4` | "Travel" how-to card |
| `foam.mp4` (not made yet) | Strip in "Why Kusho" |
