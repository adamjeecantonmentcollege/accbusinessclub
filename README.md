# ACC Business Club

Website for the [Adamjee Cantonment College](https://accbusinessclub.cloud) Business Club — a static, no-framework site (vanilla HTML/CSS/JS) deployed at **accbusinessclub.cloud**.

## Structure

```
docs/            → the website (deployable root, GH Pages-ready)
  index.html     → home (hero, bento grid, member previews)
  executives/    → Executive Members panel
  teachers/      → Teachers panel
  advisors/      → Advisors panel
  alumni/        → Alumni panel (year tabs)
  events/        → Events
  gallery/       → Gallery
  about/         → About
  contact/       → Contact
  js/            → renderers: members.js (cards + profile modal), hero.js, alumni.js, …
  css/           → base / layout / components / pages / responsive
  *.json         → all site content lives here (acts as the CMS)
  assets/        → member photos (.webp), gallery images, logo
```

## How it works

No build step. Each page is a static `index.html` that fetches its section's JSON
(`executives.json`, `teachers.json`, …) and renders member cards client-side.
Clicking a card opens a flip-card profile modal with quote, achievements, and
social links (Facebook / Instagram / LinkedIn / WhatsApp).

### Updating content

Edit the JSON files in `docs/` — no code changes needed:

- `executives.json`, `teachers.json`, `advisors.json`, `alumni.json` — member records (`name`, `role`, `image`, `quote`, `achievements`, socials, `year` for alumni)
- `events.json`, `gallery.json`, `about.json`, `contact.json` — page content

### Running locally

Serve `docs/` from any static server:

```sh
# from the repo root
python3 -m http.server 8000 --directory docs
# or
npx serve docs
```

> Note: navigation uses absolute paths (e.g. `/executives.json`), so serve at
> the domain root — that's how it runs on accbusinessclub.cloud.

## Repo hygiene

Everything outside `docs/` (scratch dirs, crawl archives, vendored tooling) is
gitignored. `git status --ignored` shows the full ignore list.