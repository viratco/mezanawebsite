# Mezana website (mezana.in)

The marketing site for Mezana. It is a static site: Vite + GSAP (scroll animations) + Lenis (smooth scroll).
It is separate from the POS app in `../frontend`, which runs at `app.mezana.in`.

## Before going live: fill in `site.config.json`

| Key | What to put |
|---|---|
| `whatsappNumber` | Your WhatsApp number with country code, digits only, e.g. `919812345678`. Every "Book a demo" button opens a chat with this number. While it's empty, those buttons scroll to "Getting started" instead. |
| `whatsappMessage` | The message that's typed in for the café owner. |
| `instagram` | Your handle without `@`. Left empty, the Instagram link is hidden. |
| `email` | Left empty, the email link is hidden. |
| `appUrl` | Where "Café login" goes: `https://app.mezana.in`. |
| `siteUrl` | `https://mezana.in` (used for the link preview image). |

## Run it

```bash
npm install
```
```bash
npm run dev
```
Then open http://localhost:5173.

## Deploy on Vercel

The site lives in its own repo, github.com/viratco/mezanawebsite (pushed from the `website/` folder of
the main project with `git subtree split --prefix website`). In Vercel: New project → import that repo,
keep Root Directory `./`. Vercel detects Vite; build command `npm run build`, output `dist`. Then add the domains `mezana.in` and `www.mezana.in` to this project
(remove them from the POS project first).

## Images

`public/shots/` holds screenshots of the demo café (Brew & Bloom), and `public/brand/` holds the icons and the
link-preview image. `npm run assets` rebuilds them from the logo in `../marketing/logo/` and, with `SHOTS=<folder>`,
from a folder of full-size screenshots. The video in `public/media/` is the 49-second reel, re-encoded for the web.
