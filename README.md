# S.E.A.L. COMMAND

A playful sci-fi space agency site run by a seal — combining seals, sci-fi/space books, and War Thunder. Plain HTML/CSS/JS, no framework, no build step.

## File structure

```
conny/
├── index.html          # all sections/markup + <template> card structures
├── css/
│   └── style.css        # all styling (dark HUD theme, responsive, scanlines)
├── js/
│   ├── data.js           # content arrays — edit THIS to add/change cards & posts
│   └── main.js            # rendering, starfield, nav, scroll-reveal, easter egg
├── assets/
│   └── images/            # all images live here
└── README.md
```

## Editing content

You should almost never need to touch `index.html` to add content — everything
below is data-driven from `js/data.js`.

### Add a starfighter (The Hangar)

Open `js/data.js`, copy an object inside `HANGAR_DATA`, and edit the fields:

```js
{
  name: "Your Ship Name",
  class: "Interceptor",
  image: "assets/images/hangar/your-ship.jpg",
  stats: [
    { label: "Thrust Class", value: "..." },
    { label: "Armor Rating", value: "..." },
  ],
},
```

### Add a book (The Archive)

Copy an object inside `ARCHIVE_DATA` in `js/data.js`:

```js
{
  title: "Book Title",
  author: "Author Name",
  cover: "assets/images/archive/book-cover.jpg",
  rating: 4.5,                 // 0-5, supports halves
  status: "Reading",           // "Reading" | "Completed" | "Want to Read"
},
```

### Add a mission log entry

Add a new object to the **top** of `MISSION_LOGS` in `js/data.js` (list is
auto-sorted newest first by date, so order in the file doesn't strictly
matter, but top-first keeps it readable):

```js
{
  date: "2026-10-01",           // YYYY-MM-DD
  title: "Entry Title",
  body: "Entry text goes here.",
},
```

### Add a seal sighting

Add an object to `SIGHTINGS_DATA` in `js/data.js`:

```js
{
  image: "assets/images/sightings/your-photo.jpg",
  caption: "Field Report #005 — your caption.",
},
```

## Swapping placeholder images

Search `index.html` and `js/data.js` for `IMAGE PLACEHOLDER` comments — each
one tells you exactly what the image should be and where it goes.

Right now every card image is a simple generated `.svg` placeholder (dark
panel, cyan corner brackets, label text) so the site looks intentional out of
the box instead of showing broken image icons. Swap them for real photos/art
whenever you're ready:

- `assets/images/hero-seal.jpg` — hero image (already using your provided seal-in-spacesuit photo)
- `assets/images/favicon.svg` — browser tab icon (generated placeholder)
- `assets/images/hangar/*.svg` — one per ship in `HANGAR_DATA`
- `assets/images/archive/*.svg` — one per book in `ARCHIVE_DATA`
- `assets/images/sightings/*.svg` — one per entry in `SIGHTINGS_DATA`

To swap one: drop your image in (e.g. `.jpg` or `.png`) and update that
entry's path in `js/data.js` to match — filenames don't need to match, the
path is just a string. No other code changes needed.

## The Easter Egg

Two ways to trigger it:

1. **Konami code** anywhere on the page: `↑ ↑ ↓ ↓ ← → ← → b a`
2. **Hidden click target**: click the faint `·` glyph in the footer 5 times quickly

Both open the same "RECRUIT ACCEPTED" secret overlay. Edit the content in the
`#secretOverlay` block in `index.html`, or the trigger logic in
`initEasterEgg()` in `js/main.js`.

## Running locally

No build step, no dependencies. Just open `index.html` in a browser, or serve
the folder with any static server, e.g.:

```bash
npx serve .
# or
python -m http.server 8000
```

## Deploying

### Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import an existing project** → pick the repo.
3. Build command: *(leave blank)*. Publish directory: `.` (repo root).
4. Deploy.

Or drag-and-drop the whole project folder onto [app.netlify.com/drop](https://app.netlify.com/drop) for an instant deploy with no git required.

### Vercel

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project** → import the repo.
3. Framework preset: **Other**. Build command: *(none)*. Output directory: `.`
4. Deploy.

### GitHub Pages

1. Push this repo to GitHub.
2. Repo **Settings → Pages** → Source: `Deploy from a branch` → branch `main`, folder `/ (root)`.
3. Save — your site will be live at `https://<username>.github.io/<repo>/`.
