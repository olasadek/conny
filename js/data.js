/*
  S.E.A.L. COMMAND — content data
  ---------------------------------
  Edit the arrays below to add/remove/change content.
  No HTML editing required — main.js renders these into cards automatically.
*/

/* ---------- THE HANGAR (assigned starfighters) ---------- *
 * To add a new starfighter, copy an object below and edit the fields.
 * `image` should point at a file in /assets/images/hangar/
 */
const HANGAR_DATA = [
  {
    name: "URSS Flipperclaw",
    class: "Interceptor",
    image: "assets/images/hangar/flipperclaw.svg",
    stats: [
      { label: "Thrust Class", value: "Mk. VII Whisker-Drive" },
      { label: "Armor Rating", value: "Blubber-Plate II" },
      { label: "Turn Radius", value: "Tight (Pup-Agile)" },
      { label: "Pilot Seniority", value: "Chief Flipper" },
    ],
  },
  {
    name: "SS Blubber Comet",
    class: "Heavy Bomber",
    image: "assets/images/hangar/blubber-comet.svg",
    stats: [
      { label: "Thrust Class", value: "Krill-Fusion IV" },
      { label: "Armor Rating", value: "Reinforced Tusk-Hull" },
      { label: "Turn Radius", value: "Wide (Walrus-Grade)" },
      { label: "Pilot Seniority", value: "Petty Officer Herring" },
    ],
  },
  {
    name: "ORCA-9 Prowler",
    class: "Stealth Recon",
    image: "assets/images/hangar/orca-9.svg",
    stats: [
      { label: "Thrust Class", value: "Silent Fin-Jet" },
      { label: "Armor Rating", value: "Low-Vis Composite" },
      { label: "Turn Radius", value: "Medium" },
      { label: "Pilot Seniority", value: "Lieutenant Barnacle" },
    ],
  },
  {
    name: "MK.IV Tideskipper",
    class: "Light Fighter",
    image: "assets/images/hangar/tideskipper.svg",
    stats: [
      { label: "Thrust Class", value: "Twin Flipper-Boost" },
      { label: "Armor Rating", value: "Standard Neoprene" },
      { label: "Turn Radius", value: "Very Tight" },
      { label: "Pilot Seniority", value: "Ensign Pebble" },
    ],
  },
];

/* ---------- THE ARCHIVE (book library) ---------- *
 * status: "Reading" | "Completed" | "Want to Read"
 * rating: 0-5 (supports .5 halves)
 */
const ARCHIVE_DATA = [
  {
    title: "Dune",
    author: "Frank Herbert",
    cover: "assets/images/archive/dune.svg",
    rating: 5,
    status: "Completed",
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    cover: "assets/images/archive/hail-mary.svg",
    rating: 5,
    status: "Completed",
  },
  {
    title: "Leviathan Wakes",
    author: "James S.A. Corey",
    cover: "assets/images/archive/leviathan-wakes.svg",
    rating: 4.5,
    status: "Reading",
  },
  {
    title: "The Left Hand of Darkness",
    author: "Ursula K. Le Guin",
    cover: "assets/images/archive/left-hand.svg",
    rating: 4,
    status: "Completed",
  },
  {
    title: "Ender's Game",
    author: "Orson Scott Card",
    cover: "assets/images/archive/enders-game.svg",
    rating: 4.5,
    status: "Want to Read",
  },
  {
    title: "Children of Time",
    author: "Adrian Tchaikovsky",
    cover: "assets/images/archive/children-of-time.svg",
    rating: 4,
    status: "Want to Read",
  },
];

/* ---------- MISSION LOGS (blog/journal, newest first) ---------- *
 * date format: "YYYY-MM-DD" (used for sorting + display)
 * To add an entry, just add a new object to the TOP of this array.
 */
const MISSION_LOGS = [
  {
    date: "2026-09-26",
    title: "Krill Rations Approved for Long-Haul Patrol",
    body: "Quartermaster signed off on the extended krill supply for the outer-buoy patrol route. Squadron morale up. Ensign Pebble still insists on herring instead — request denied, again.",
  },
  {
    date: "2026-09-14",
    title: "ORCA-9 Passes Stealth Trials",
    body: "Low-vis composite plating held up against three simulated intercepts. Lieutenant Barnacle reports the prowler is 'quieter than a nap on a warm rock.' Recommending fleet-wide rollout.",
  },
  {
    date: "2026-08-30",
    title: "Archive Wing Reorganized",
    body: "Moved the sci-fi shelf closer to the observation dome so off-duty pilots can read while watching the actual stars. Morale officer approves. Someone dog-eared page 40 of Dune. Investigation ongoing.",
  },
  {
    date: "2026-08-11",
    title: "Tideskipper Clears Atmospheric Re-Entry Drill",
    body: "First full re-entry burn for the MK.IV. Ensign Pebble stuck the landing on the ice-shelf pad. Minor scorch marks on the flipper-boosters, nothing the maintenance crew can't buff out.",
  },
  {
    date: "2026-07-22",
    title: "New Recruit Orientation — Batch 12",
    body: "Twelve new pups reported for basic flight orientation this cycle. Reminded them: barrel rolls are for the simulator only. Command will not be issuing replacement whiskers.",
  },
];

/* ---------- SEAL SIGHTINGS (field report gallery) ---------- *
 * Swap the `image` paths for your own seal photos in /assets/images/sightings/
 */
const SIGHTINGS_DATA = [
  {
    image: "assets/images/sightings/report-01.svg",
    caption: "Field Report #001 — Spotted basking near Sector 7 ice shelf.",
  },
  {
    image: "assets/images/sightings/report-02.svg",
    caption: "Field Report #002 — Confirmed periscope-style surfacing maneuver.",
  },
  {
    image: "assets/images/sightings/report-03.svg",
    caption: "Field Report #003 — Unauthorized nap during patrol hours.",
  },
  {
    image: "assets/images/sightings/report-04.svg",
    caption: "Field Report #004 — Successful flipper-five with visiting cadet.",
  },
];
