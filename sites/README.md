# sites/ — client demo sites

Standalone static sites for local-business prospects. **Nothing here is part of the
JUnited app.** `vite build` only compiles `src/`, so this folder is inert to the app
build and cannot affect it.

Each site is one folder: `index.html` (fully self-contained — no build step, no
dependencies) plus a `vercel.json`.

---

## Live sites

| Folder | Business | URL |
|---|---|---|
| `nutinfits/` | Nutinfits — tailor, Wellington | https://nutinfits.vercel.app |
| `central-barbershop/` | Central Barbershop — Cedarhurst NY | not yet deployed |
| `vip-efraim/` | VIP by Efraim — 2 shops, Cedarhurst NY | not yet deployed |
| — | Flawless Finishes — mobile body shop | https://flawless-finishes-sage.vercel.app |
| — | WPB Mobile Mechanic | https://wpb-mobile-mechanic.vercel.app |

(The last two were deployed from local folders before this repo existed. Moving them
in here is optional — see "Migrating an existing site" below.)

---

## One-time setup per site (Vercel dashboard)

1. **vercel.com → Add New → Project**
2. **Import** `Fluffy321/united`
3. **Root Directory** → click Edit → choose `sites/<folder>`
4. **Framework Preset** → **Other** (these are plain HTML, no build)
5. **Deploy**
6. After it deploys: **Settings → Git → Production Branch** →
   set to `claude/site-forge-setup-c9jlve` → redeploy once

Done. From then on, every push to that branch redeploys the site automatically.

## Day-to-day

Claude pushes a change → Vercel rebuilds → live in ~30 seconds. No terminal, no zips,
no base64.

## Migrating an existing site

For a site already deployed from a local folder (Flawless, WPB Mechanic): open the
project in Vercel → **Settings → Git → Connect Git Repository** → pick this repo →
set Root Directory to `sites/<folder>` and Production Branch as above. The URL stays
the same.

---

## Demo mode

Every site has a `SHOP` config block near the bottom of `index.html`:

```js
var SHOP = {
  rating: null,        // Google rating, as a number
  reviewCount: null,   // review count, as a number
  quotes: [],          // up to 3 real reviews
  demoMode: true       // false = strip the "Sample design" banner + allow indexing
};
```

Anything left `null` / `[]` **does not render**. Nothing appears on a page unless it
was put here deliberately — no invented ratings, no fake testimonials.

Set `demoMode: false` only when a site is paid for and going live on the client's own
domain. Until then the banner stays and the page is `noindex`, so it can't compete
with anything the business already has in Google.
