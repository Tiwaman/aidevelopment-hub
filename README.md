# aidevelopment.in

The root catalog page for **aidevelopment.in**. A static landing page that lists every project on the account, each deployed independently as its own Vercel project. New projects show up automatically.

## Stack

Static HTML + CSS + a little vanilla JavaScript (`app.js`) and one serverless function (`api/projects.js`). No build step, no npm dependencies.

- Typography: **Instrument Serif** (headline) + **Inter** (everything else), via Google Fonts CDN
- Design: one serif display headline (Instrument Serif) with Inter for everything else, one background and text colour, one blue accent for interactive states only. Surfaces are separated by tone, not borders. Light and dark follow the system setting.
- Single page: `index.html`, stylesheet `styles.css`
- Rows: discovered by `api/projects.js`, customized by `projects.json`

## Local preview

Any static file server works. Easiest:

```bash
npx serve .
```

Or just open `index.html` in a browser. Locally there is no `/api/projects`, so the page shows the static fallback list in `index.html`. To preview the automatic rows, use `vercel dev` with `VERCEL_TOKEN` set.

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

Every project on your Vercel account appears as a row in the catalog, except the hub itself. Hide ones you don't want with `"hidden": true` in `projects.json`. A row links to `<name>.aidevelopment.in` if the project has one; otherwise to another custom domain, or its `*.vercel.app` address. New projects show up within about 5 minutes. No code changes.

How it works: `api/projects.js` asks the Vercel API for every project on your account, lists every project except the hub itself, and `app.js` renders them as rows. The static list in `index.html` stays as a fallback if JavaScript or the API is unavailable. The API response is cached for 5 minutes.

## The catalog page

A search box (press `/` to focus it) live-filters by name, tagline, description, category, tags and domain. Next to it are a **Category** dropdown, a **Link** dropdown (aidevelopment.in subdomain, custom domain, vercel.app) and a **Sort** dropdown (curated, name, newest). Search and both filters combine, with an "N of M" count. The filters are kept in the address bar (`?q=&cat=&link=`), so a filtered view can be shared or reloaded. Each row shows the name, a one-line description (full text on hover, wrapped on phones), the category, and an access link with the host; the whole row is also clickable. The 5 original projects are written into `index.html` as a plain list, shown if JavaScript or the API is unavailable (regenerate them from `rowHtml` in `app.js` if you change the row markup).

New rows get an automatic name (from the Vercel project name), the Vercel project description, the category `Uncategorized`, and no extra styling.

### Optional: customize a row

Edit `projects.json`. Add an entry under `overrides`, keyed by the subdomain (`cab` for `cab.aidevelopment.in`), or by the Vercel project name for projects without an aidevelopment.in domain. Every field is optional:

| Field | What it does |
|---|---|
| `title` and `italic` | Project name (the two are joined into one plain name) |
| `tagline` | Searchable only (not shown) |
| `description` | The short blurb shown in the About column (falls back to the Vercel project description) |
| `category` | Group name for the Category filter, e.g. `"Productivity"`. Categories appear in the filter automatically; projects without one are `Uncategorized`, listed last |
| `status` | Kept for compatibility, not shown |
| `cta` | Screen-reader label for the access link (default `Open it`) |
| `tags` | Extra search keywords (not shown) |
| `size` | Ignored (kept for older files) |
| `color` | Ignored (kept for older files) |
| `skin` | Ignored (kept for older files) |
| `order` | Lower numbers come first; the rest follow by creation date |
| `hidden` | `true` to keep a project off the hub |

## Setup (one time)

1. Create a token at <https://vercel.com/account/tokens> (scope it to the account or team that owns your projects).
2. In the hub project on Vercel: **Settings → Environment Variables**, add `VERCEL_TOKEN` with that token. If the projects live under a team, also add `VERCEL_TEAM_ID` (the team ID, from Team Settings, starts with `team_`).
3. Redeploy the hub so the variables take effect.

The token is only read by the serverless function and is never sent to the browser.
