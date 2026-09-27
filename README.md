# S.E.A.L. COMMAND

A playful sci-fi space agency site run by a seal — combining seals, sci-fi/space books, and War Thunder. Static HTML/CSS/JS frontend + a small serverless backend (Vercel Functions + MongoDB) for shared, live features:

- **Book reviews** — any visitor can leave a rating + review on any Archive book; everyone sees the same list.
- **Weapon loadouts** — every Hangar starfighter has a swappable weapon, shared across all visitors.
- **Orbital Duel** — pick two starfighters, Command runs the odds (ship power + equipped weapon), and one wins.

Vercel hosts the static files *and* the two small API functions; MongoDB (Atlas's free tier works fine) holds the data. You'll need to create a free MongoDB Atlas cluster yourself — see **How the backend works** below.

## File structure

```
conny/
├── index.html                 # all sections/markup + <template> card structures
├── css/
│   └── style.css               # all styling (dark HUD theme, responsive, scanlines)
├── js/
│   ├── data.js                  # content arrays — edit THIS to add/change cards & posts
│   └── main.js                   # rendering, starfield, nav, API calls, Orbital Duel, easter egg
├── api/
│   ├── reviews.js                # GET/POST /api/reviews  (MongoDB collection: "reviews")
│   └── weapons.js                # GET/POST /api/weapons  (MongoDB collection: "weapons")
├── lib/
│   └── mongodb.js                # shared, connection-caching MongoDB client helper
├── assets/
│   └── images/                    # all images live here
├── .env.example                 # env vars the API functions need — copy to .env for local dev
├── package.json                 # mongodb dependency
└── README.md
```

## Editing content

You should almost never need to touch `index.html` to add content — everything
below is data-driven from `js/data.js`.

### Add a starfighter (The Hangar)

Copy an object inside `HANGAR_DATA` in `js/data.js`:

```js
{
  id: "your-ship",            // unique — used as the key for its shared weapon loadout
  name: "Your Ship Name",
  class: "Interceptor",
  image: "assets/images/hangar/your-ship.jpg",
  powerScore: 75,              // base combat power, used by Orbital Duel
  defaultWeapon: "ion-tusk",   // must match an id in WEAPONS_CATALOG
  stats: [
    { label: "Thrust Class", value: "..." },
    { label: "Armor Rating", value: "..." },
  ],
},
```

### Add/edit a weapon

Weapons live in `WEAPONS_CATALOG` in `js/data.js` and populate the dropdown on
every Hangar card and the Orbital Duel power calculation:

```js
{ id: "your-weapon", name: "Your Weapon Name", damage: 70, description: "Flavor text." },
```

### Add a book (The Archive)

Copy an object inside `ARCHIVE_DATA` in `js/data.js`:

```js
{
  id: "your-book",             // unique — used as the key for its shared reviews
  title: "Book Title",
  author: "Author Name",
  cover: "assets/images/archive/book-cover.jpg",
  rating: 4.5,                 // YOUR rating, 0-5, supports halves
  status: "Reading",           // "Reading" | "Completed" | "Want to Read"
},
```

Visitor reviews are separate from your own `rating` field above — they're
submitted through the site and stored in the backend, not in this file.

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
panel, cyan corner brackets, a big seal icon) so the site looks intentional
out of the box instead of showing broken image icons. Swap them for real
photos/art whenever you're ready:

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

## How the backend works

Two Vercel serverless functions — Vercel automatically maps any file under `api/` to a route of the same name, so `api/reviews.js` serves `/api/reviews` and `api/weapons.js` serves `/api/weapons`, no routing config needed:

- **`/api/reviews`** — `GET` returns all reviews grouped by book (or `?bookId=x` for one book); `POST { bookId, name, rating, text }` inserts a review document. Backed by the `reviews` collection (one document per review, with a `bookId` field matching the book's `id` from `js/data.js`).
- **`/api/weapons`** — `GET` returns the full shipId → weaponId map; `POST { shipId, weaponId }` upserts one ship's loadout. Backed by the `weapons` collection (one document per ship, `_id` = the ship's `id`).

Both functions share a connection-caching MongoDB client in `lib/mongodb.js`.

**You need a MongoDB database.** The free tier of [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) works well:

1. Create a free cluster (M0 tier).
2. **Database Access** → add a database user (username + password).
3. **Network Access** → add `0.0.0.0/0` (allow access from anywhere) — Vercel's serverless functions run from dynamic IPs, so you can't whitelist a fixed one.
4. **Connect** → "Drivers" → copy the connection string, which looks like `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`.
5. Set that as the `MONGODB_URI` environment variable (see below) — the actual database name is set separately via `MONGODB_DB` (defaults to `seal_command` if you don't set it; Atlas will create it automatically on first write).

**Graceful degradation:** if the API is unreachable (wrong/missing `MONGODB_URI`, or the site is hosted somewhere without these functions, or you're just opening `index.html` from disk), `js/main.js` automatically falls back to a per-browser `localStorage` cache. The site keeps working — reviews and weapon changes just won't be shared with other visitors — and a small amber notice appears under the affected section explaining this.

**Basic spam guard:** the review form includes a hidden honeypot field; submissions with it filled are silently dropped server-side.

## Running locally

The static pages alone (no backend) can be opened directly:

```bash
# no backend, no npm install — reviews/weapons fall back to localStorage
python -m http.server 8000
```

For the **full stack** (static site + working `/api/*` functions talking to your real MongoDB database):

```bash
npm install
cp .env.example .env    # then fill in MONGODB_URI (and MONGODB_DB if you want a non-default name)
npm run dev
# equivalent to: npx vercel dev
```

First run will ask you to log in to Vercel and link the project (`vercel link`) — accept the defaults. `vercel dev` then serves the static files and the `api/*` functions together on one local port, reading `.env` for environment variables.

## Deploying

### Vercel (required for the live backend)

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project** → import the repo.
3. Framework preset: **Other**. Build command: *(none)*. Output directory: `.` (repo root) — `api/*.js` is picked up automatically.
4. **Before deploying**, add the environment variables from `.env.example` (`MONGODB_URI`, and `MONGODB_DB` if you're not using the default) under **Settings → Environment Variables**.
5. Deploy.

### GitHub Pages / other static hosts (static only)

These can serve `index.html`, `css/`, `js/`, and `assets/` fine, but they don't run the `api/*` functions — `/api/reviews` and `/api/weapons` will 404. The site still works thanks to the localStorage fallback (reviews/weapons just stay local to each visitor's browser instead of being shared).
