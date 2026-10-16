# aidevelopment.in

The root catalog page for **aidevelopment.in**. A static landing page that lists every project living under the domain, each deployed independently as its own Vercel project. New projects show up automatically.

## Stack

Static HTML + CSS + a little vanilla JavaScript (`app.js`) and one serverless function (`api/projects.js`). No build step, no npm dependencies.

- Typography: **Instrument Serif** + **JetBrains Mono** (via Google Fonts CDN)
- Design direction: technicolor bento catalog
- Single page: `index.html`, stylesheet `styles.css`
- Tiles: discovered by `api/projects.js`, customized by `projects.json`

## Local preview

Any static file server works. Easiest:

```bash
npx serve .
```

Or just open `index.html` in a browser. Locally there is no `/api/projects`, so the page shows the static fallback tiles in `index.html`. To preview the automatic tiles, use `vercel dev` with `VERCEL_TOKEN` set.

## Deploy to Vercel

```bash
# from this folder, after pushing to GitHub
vercel
# or via the Vercel dashboard: Add New → Project → import this repo
```

No build command required. Vercel serves the static files from the root and deploys `api/` as serverless functions. The `vercel.json` enables clean URLs.

## Map to apex domain

Once deployed:

1. Vercel project → **Settings → Domains**
2. Add `aidevelopment.in` and `www.aidevelopment.in`
3. Move them off the existing meeting-cost-calc project if currently attached there
4. DNS already points correctly (Vercel handles SSL automatically)

## Add a project (automatic)

Every project on your Vercel account appears as a tile, except the hub itself. Hide ones you don't want with `"hidden": true` in `projects.json`. Give a project a `<name>.aidevelopment.in` domain and the tile links there; otherwise it links to another custom domain, or its `*.vercel.app` address. Within about 5 minutes it appears as a new tile on the hub, numbered in order of project creation date. No code changes.

How it works: `api/projects.js` asks the Vercel API for every project on your account, lists every project except the hub itself, and `app.js` renders them as tiles. The static tiles in `index.html` stay as a fallback if JavaScript or the API is unavailable. The API response is cached for 5 minutes.

New tiles get an automatic name (from the Vercel project name), the Vercel project description, and a color generated from the subdomain.

### Optional: customize a tile

Edit `projects.json`. Add an entry under `overrides`, keyed by the subdomain (`cab` for `cab.aidevelopment.in`), or by the Vercel project name for projects without an aidevelopment.in domain. Every field is optional:

| Field | What it does |
|---|---|
| `title` and `italic` | Tile name; `italic` is shown in the serif italic |
| `tagline` | Small caps line above the name |
| `description` | Body text |
| `status` | Pill in the top corner (default `new`) |
| `cta` | Button text (default `Open it`) |
| `tags` | List of small pills |
| `size` | `"large"` for the big tile |
| `color` | `{ "bg": "#2746d9", "fg": "#ffffff" }` |
| `skin` | An existing color class, e.g. `tile-pm` |
| `order` | Lower numbers come first; tiles without it follow by creation date |
| `hidden` | `true` to keep a project off the hub |

## Setup (one time)

1. Create a token at <https://vercel.com/account/tokens> (scope it to the account or team that owns your projects).
2. In the hub project on Vercel: **Settings → Environment Variables**, add `VERCEL_TOKEN` with that token. If the projects live under a team, also add `VERCEL_TEAM_ID` (the team ID, from Team Settings, starts with `team_`).
3. Redeploy the hub so the variables take effect.

The token is only read by the serverless function and is never sent to the browser.
