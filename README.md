# Meridian — Marketing Website

A fast, responsive, accessible single-page marketing site for **Meridian**, a hands-on
AI consultancy for local beauty & wellness businesses (Frisco / Dallas–Fort Worth, TX).

Plain static site — **no build step**. Just HTML, CSS, JS, and images.

## Project structure

```
meridian-website/
├── index.html                      # Page structure + all copy
├── css/
│   └── styles.css                  # All styling (brand tokens at the top)
├── js/
│   ├── main.js                     # Nav, scroll animations, contact-form logic
│   └── meridian-flow.js            # The missed-call animation (How It Works)
├── embed/                          # THE PRODUCT — the chat widget clients install
│   ├── chat.js                     # The widget. Served to client sites. Don't edit per client.
│   ├── meridian-logo.png           # The mark used in the "Powered by Meridian" credit
│   └── clients/
│       ├── _TEMPLATE.js            # Copy this to onboard a new client
│       ├── meridian.js             # Meridian's own answers
│       └── ivy-lane.js             # Worked example / sample for demos
├── install/index.html              # Install instructions you send the client
├── preview/index.html              # Live preview of a client's assistant, before they buy
├── assets/
│   ├── meridian-logo.png           # Logo (header + footer + favicon)
│   ├── founder-photo.jpg
│   ├── missed-call-animation.gif   # The animation as a GIF, for emails
│   └── missed-call-animation.png   # Static first frame, for clients that block GIFs
├── vercel.json                     # Vercel config (clean URLs + asset caching)
├── package.json                    # Local dev server script
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

## The two embedded demos

The site carries the two things Meridian sells, running live. A prospect can try
the product on the page that's selling it, which beats describing it.

### 1. The missed-call animation

In the **How It Works** section, under the four steps. It loops through a call
going unanswered, the auto-text going out, and the booking landing.

```html
<div data-meridian-flow data-business="Your Studio" data-theme="light" data-autoplay="false"></div>
<script src="js/meridian-flow.js" defer></script>
```

It renders into a shadow root, so `css/styles.css` cannot reach inside it and it
cannot leak out. The only styling on this side is spacing — the `.flow-embed`
block in `styles.css`. Restyling the site can't break the animation.

Useful attributes on that `<div>`:

| Attribute | What it does |
|---|---|
| `data-business` | The name shown inside the animation |
| `data-theme` | `light` (default) or `dark` — use `dark` only inside a navy section |
| `data-autoplay` | `false` waits until it's scrolled into view. Leave it as `false`. |
| `data-speed` | Playback multiplier, `1` is normal |

**Source of truth:** `../meridian-missed-call/embed/meridian-flow.js`. The copy
here is exactly that file. If you change one, copy it across.

### 2. The FAQ chat widget

Bottom-right bubble. This is the **same install a client gets** — one line,
pointed at a config on this server:

```html
<script src="/embed/chat.js" data-client="meridian" defer></script>
```

Meridian's own answers live in `embed/clients/meridian.js`. Running the real
install on our own site means that if the install is broken, it's broken here
first — before a client finds out.

**AI mode is off, deliberately.** With it off the widget answers only from the
config and physically cannot invent a price or a turnaround time. On the site
that sells your credibility, that's the setting you want.

**To remove it from this site:** delete that one line.

## Selling the chat widget: the whole workflow

The `embed/` folder is a product, not a demo. Everything a client needs is
hosted here, so you can go from "interesting" to installed in a single
conversation.

### Onboard a new client

1. **Copy `embed/clients/_TEMPLATE.js`** to `embed/clients/<slug>.js`.
   Slugs are lowercase letters, numbers and hyphens — `ivy-lane`,
   `coastline-barbers`. The slug ends up in their install line, so keep it
   recognisable.

2. **Fill in every `ASK THEM`.** The template walks through it. Don't guess a
   price or a cancellation policy — a bot that quotes a wrong price starts an
   argument at a real front desk, and that lands on you.

3. **Deploy** (`./push.sh`).

4. **Send them the preview:** `/preview?client=<slug>`
   A live assistant with their real hours and prices, on a neutral page, that
   they can try themselves. Hand them the keyboard and let them try to catch it
   out — the honest *"I'm not sure, give us a call"* is a feature, and it's
   worth pointing that out when it happens.

5. **Send them the install page:** `/install?client=<slug>`
   The snippet is already filled in with their slug, with a copy button and
   step-by-step instructions for Squarespace, Wix, WordPress, Shopify, GoDaddy
   and hand-built sites. Nothing for them to edit.

### Why Meridian hosts it

The client pastes one line and never touches it again. **The answers live on
this server, not theirs.** When a salon changes its prices you edit one file
here and redeploy — every visitor sees the new answer within minutes. No
emailing files, no asking the owner to log back into Squarespace, no waiting on
their web guy.

That's also the thing worth charging for: you own the maintenance, so they
don't have to think about it.

### How the boot works

`chat.js` reads its own `<script>` tag for `data-client`, works out its own
folder from its `src`, and loads `clients/<slug>.js` from there. Config is
loaded with a script tag rather than `fetch()` on purpose — script tags work
cross-origin with no CORS headers to configure, so a client's server settings
can't break it.

If the config fails to load, **the widget does not mount** and logs one clear
console warning. A chat bubble that opens onto "I don't know" answers is worse
than no bubble. A bad slug is rejected before it reaches the network.

Verified working cross-origin: a page on a different domain loading `chat.js`
from this one gets the right config, the right business name, working answers,
and a credit logo that resolves correctly.

### Branding

The chat **header** shows the client's own logo (`brand.logo`) or their
initials — never the Meridian mark, because to a visitor that widget is the
salon's front desk, not ours. The Meridian mark goes in the **footer credit**,
which links back here. That's free marketing on every client site you install.
Set `brand.poweredBy: false` if a client objects.

### The self-hosted alternative

`../meridian-chatbot/` is the older two-file version a client copies onto their
own server. It still works and is a fine fallback for someone who refuses
third-party scripts, but the hosted install above is the default — it's one
line instead of two files, and it's the only version where you can update
answers without touching their website.

Both share the same answering logic. **If you fix a bug in one, copy it to the
other.**

## The animation as a GIF, for emails

`assets/missed-call-animation.gif` (600×466, ~1.2 MB, loops forever) and
`assets/missed-call-animation.png` (static first frame) are hosted here purely so
outbound email has a public URL to point at — email clients can't read a local
file or a `data:` URI.

Once the site is deployed they live at:

```
https://your-domain/assets/missed-call-animation.gif
https://your-domain/assets/missed-call-animation.png
```

Ready-to-paste email HTML is in `../meridian-missed-call/export/out/email-snippet.html`
— find and replace `YOUR-DOMAIN` in it and you're done. Its link points at
`/#how`, so a reader who clicks lands on the live version of the same animation.

To regenerate the GIF after changing the animation, see
`../meridian-missed-call/export/`.

## Make the contact form live

The form currently validates and shows a thank-you message (no data is sent). Pick one:

- **Formspree:** add `action="https://formspree.io/f/XXXX" method="post"` to the
  `<form>` in `index.html`, then remove the submit handler in `js/main.js`.
- **Netlify Forms:** add the `netlify` attribute to the `<form>` tag (auto-detected on Netlify).
- **Custom endpoint:** POST `new FormData(form)` to your API inside `js/main.js`.

## Pricing note

The pricing section intentionally shows **"Contact for pricing"** with no dollar
figures — real numbers go in once a pilot has been priced.
