# aidevelopment.in

The root catalog page for **aidevelopment.in**. A static landing page that lists every project on the account, each deployed independently as its own Vercel project. New projects show up automatically.

## Stack

Static HTML + CSS + a little vanilla JavaScript (`app.js`) and one serverless function (`api/projects.js`). No build step, no npm dependencies.

- Typography: **Instrument Serif** + **JetBrains Mono** (via Google Fonts CDN)
- Design direction: editorial catalog, a searchable list with a color dot per project
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

A search box (press `/` to focus it) live-filters by name, tagline, description, category, tags and domain. Next to it, a **Category** dropdown and a **Link** dropdown (aidevelopment.in subdomain, custom domain, vercel.app) combine with the search, with counts and an "N of M" result count. The filters are kept in the address bar (`?q=&cat=&link=`), so a filtered view can be shared or reloaded. Click **Name** or **Access link · Newest** in the header to sort. Each row has a color dot, a short description, and an access link showing the host. On phones, rows stack. The 5 original projects are also written into `index.html` as a plain list, shown if JavaScript or the API is unavailable.

New rows get an automatic name (from the Vercel project name), the Vercel project description, the category `Uncategorized`, and a dot color generated from the subdomain.

### Optional: customize a row

Edit `projects.json`. Add an entry under `overrides`, keyed by the subdomain (`cab` for `cab.aidevelopment.in`), or by the Vercel project name for projects without an aidevelopment.in domain. Every field is optional:

| Field | What it does |
|---|---|
| `title` and `italic` | Project name; `italic` is shown in the serif italic |
| `tagline` | Small caps line under the name |
| `description` | The short blurb shown in the About column (falls back to the Vercel project description) |
| `category` | Group name for the Category filter, e.g. `"Productivity"`. Categories appear in the filter automatically; projects without one are `Uncategorized`, listed last |
| `status` | Status pill (default `new`) |
| `cta` | Screen-reader label for the access link (default `Open it`) |
| `tags` | List of small pills |
| `size` | Ignored (kept for older files) |
| `color` | `{ "bg": "#2746d9" }`, the dot color |
| `skin` | Older color name (`tile-pm` etc.), used only for the dot color |
| `order` | Lower numbers come first; the rest follow by creation date |
| `hidden` | `true` to keep a project off the hub |

## Setup (one time)

1. Create a token at <https://vercel.com/account/tokens> (scope it to the account or team that owns your projects).
2. In the hub project on Vercel: **Settings → Environment Variables**, add `VERCEL_TOKEN` with that token. If the projects live under a team, also add `VERCEL_TEAM_ID` (the team ID, from Team Settings, starts with `team_`).
3. Redeploy the hub so the variables take effect.

The token is only read by the serverless function and is never sent to the browser.
