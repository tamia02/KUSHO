# Kusho — Shopify theme

Online store for [kusho.in](https://kusho.in) (3C Ventures): memory-foam pillows and cushions for sleep, work and travel.

| Folder | What it is |
|---|---|
| `kusho-theme/` | The Shopify Online Store 2.0 theme (forked from Dawn). This is what gets pushed to the store. See its README for store setup, what is built and what is not. |
| `preview/` | Local preview server: renders the real theme with the real product data at http://localhost:3000, no Shopify account needed. `cd preview && npm install && npm start`. |
| `public/assets/` | Lifestyle videos (raw Veo output) and `web/` — the processed, upload-ready versions. |
| `recon/` | Scripts that copied products, blog, policies and images from the live site into `preview/data/`, plus the video processing script. Scratch downloads are git-ignored. |

Start with `kusho-theme/README.md`.
