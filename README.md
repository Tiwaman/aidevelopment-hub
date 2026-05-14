# aidevelopment.in

The root catalog page for **aidevelopment.in**. A single static HTML/CSS landing that lists every project living under the domain — each one deployed independently as its own Vercel project.

## Stack

Pure HTML + CSS. No build step, no JavaScript dependencies (other than a CSS animation and Google Fonts).

- Typography: **Instrument Serif** + **JetBrains Mono** (via Google Fonts CDN)
- Design direction: technicolor bento catalog
- Single page: `index.html`
- Single stylesheet: `styles.css`

## Local preview

Any static file server works. Easiest:

```bash
npx serve .
```

Or just open `index.html` in a browser.

## Deploy to Vercel

```bash
# from this folder, after pushing to GitHub
vercel
# or via the Vercel dashboard: Add New → Project → import this repo
```

No build command required — Vercel detects static and serves from the root. The `vercel.json` enables clean URLs.

## Map to apex domain

Once deployed:

1. Vercel project → **Settings → Domains**
2. Add `aidevelopment.in` and `www.aidevelopment.in`
3. Move them off the existing meeting-cost-calc project if currently attached there
4. DNS already points correctly (Vercel handles SSL automatically)

## Add or update a tile

Open `index.html`, find the `<section class="grid">` block. Each tile is a single `<a>` with class `tile tile-<slug> [tile-large]`. To add a new project:

1. Pick a slug and add a color block to `styles.css` (`--newproject`, `--newproject-deep`, `--newproject-fg`)
2. Add a `.tile-newproject` skin class with `background: var(--newproject); color: var(--newproject-fg);`
3. Append the `<a>` to the grid with the next `№ 0N` number and a sensible grid span (4, 6, or 8)
4. Optionally add it to the hero `<aside>` workshop list
