# Meridian — Marketing Website

A fast, responsive, accessible single-page marketing site for **Meridian**, a hands-on
AI consultancy for local beauty & wellness businesses (Frisco / Dallas–Fort Worth, TX).

Plain static site — **no build step**. Just HTML, CSS, JS, and images.

## Project structure

```
meridian-website/
├── index.html          # Page structure + all copy
├── css/
│   └── styles.css       # All styling (brand tokens at the top)
├── js/
│   └── main.js          # Nav, scroll animations, contact-form logic
├── assets/
│   └── meridian-logo.png # Logo (transparent, used in header + footer + favicon)
├── vercel.json          # Vercel config (clean URLs + asset caching)
├── package.json         # Local dev server script
└── .gitignore
```

## Run it locally

**Option A — npm (recommended):**

```bash
cd meridian-website
npm install
npm run dev
```

Then open http://localhost:3000

**Option B — Python (no install needed):**

```bash
cd meridian-website
python3 -m http.server 3000
```

Then open http://localhost:3000

> Tip: open the site through the local server (a `localhost` URL), not by
> double-clicking `index.html`. A local server loads the CSS, JS, and logo
> correctly; the raw `file://` path can be fussy about relative paths.

## Deploy to Vercel

**Easiest — drag & drop:**
1. Go to [vercel.com/new](https://vercel.com/new).
2. Drag the `meridian-website` folder onto the page (or connect a Git repo).
3. Framework preset: **Other**. No build command, no output dir needed.
4. Deploy. Done.

**Or with the Vercel CLI:**

```bash
npm i -g vercel
cd meridian-website
vercel          # preview deploy
vercel --prod   # production deploy
```

## Editing guide

- **Copy:** edit directly in `index.html`, section by section.
- **Colors / fonts / spacing:** `css/styles.css` → the `:root` "DESIGN TOKENS" block.
- **Logo:** `assets/meridian-logo.png` (swap the file, keep the name — or update the
  `<img src>` in the header and footer).
- **Real contact info:** search `index.html` for `EDIT:` (email, phone, socials).
- **Photos:** each image slot is marked with an `IMAGE SLOT` comment describing what
  goes there. Drop a file in `assets/` and replace the placeholder block with an `<img>`.

## Make the contact form live

The form currently validates and shows a thank-you message (no data is sent). Pick one:

- **Formspree:** add `action="https://formspree.io/f/XXXX" method="post"` to the
  `<form>` in `index.html`, then remove the submit handler in `js/main.js`.
- **Netlify Forms:** add the `netlify` attribute to the `<form>` tag (auto-detected on Netlify).
- **Custom endpoint:** POST `new FormData(form)` to your API inside `js/main.js`.

## Pricing note

The pricing section intentionally shows **"Contact for pricing"** with no dollar
figures — real numbers go in once a pilot has been priced.
