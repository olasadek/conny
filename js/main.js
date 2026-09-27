/*
  S.E.A.L. COMMAND — main.js
  Vanilla JS only. No build-time dependencies.
  Sections:
    1. Starfield canvas
    2. Mobile nav toggle
    3. Scroll-reveal (IntersectionObserver)
    4. Backend API helpers (Vercel + MongoDB functions, with localStorage fallback)
    5. Card renderers (Hangar+Weapons / Archive+Reviews / Logs / Sightings)
    6. Orbital Duel minigame
    7. Easter egg (Konami code + hidden click target)

  Backend note: /api/reviews and /api/weapons are Vercel serverless
  functions backed by MongoDB (see /api and /lib/mongodb.js). On a
  plain static host (no Vercel) those calls 404 — everything degrades
  gracefully to a per-browser localStorage cache so the page still
  works, just not shared.
*/

(function () {
  "use strict";

  const OFFLINE_MSG =
    "⚠ Live sync unavailable on this host — changes are saved to this browser only. Deploy to Vercel (with MongoDB configured) to enable shared storage for everyone.";

  /* ==================== 1. STARFIELD ==================== */
  function initStarfield() {
    const canvas = document.getElementById("starfield");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width, height, stars;

    const STAR_COUNT = 160;

    function resize() {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }

    function makeStars() {
      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.4 + 0.2,
        speed: Math.random() * 0.15 + 0.02,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const now = performance.now() * 0.001;

      for (const star of stars) {
        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
        const twinkle = 0.5 + 0.5 * Math.sin(now * star.twinkleSpeed * 60 + star.twinklePhase);
        const alpha = 0.3 + twinkle * 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 235, 255, ${alpha})`;
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    resize();
    makeStars();

    window.addEventListener("resize", () => {
      resize();
      makeStars();
    });

    if (!prefersReducedMotion) {
      requestAnimationFrame(draw);
    } else {
      draw();
    }
  }

  /* ==================== 2. MOBILE NAV ==================== */
  function initNav() {
    const toggle = document.getElementById("navToggle");
    const nav = document.getElementById("siteNav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ==================== 3. SCROLL REVEAL ==================== */
  function initScrollRevealShared() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
  }

  /* ==================== 4. BACKEND API HELPERS ==================== */
  /* Each store: tries the Vercel function first, falls back to a
     localStorage cache (per-browser only) if the network call fails
     (offline, or hosted somewhere without the /api/* functions). */

  const WeaponsAPI = {
    LS_KEY: "seal-command:weapons",

    async getAll() {
      try {
        const res = await fetch("/api/weapons");
        if (!res.ok) throw new Error("bad status");
        const data = await res.json();
        localStorage.setItem(this.LS_KEY, JSON.stringify(data));
        return { data, offline: false };
      } catch {
        let data = {};
        try {
          data = JSON.parse(localStorage.getItem(this.LS_KEY)) || {};
        } catch {}
        return { data, offline: true };
      }
    },

    async set(shipId, weaponId) {
      try {
        const res = await fetch("/api/weapons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shipId, weaponId }),
        });
        if (!res.ok) throw new Error("bad status");
        return { offline: false };
      } catch {
        let all = {};
        try {
          all = JSON.parse(localStorage.getItem(this.LS_KEY)) || {};
        } catch {}
        all[shipId] = weaponId;
        localStorage.setItem(this.LS_KEY, JSON.stringify(all));
        return { offline: true };
      }
    },
  };

  const ReviewsAPI = {
    LS_KEY: "seal-command:reviews",

    async getAll() {
      try {
        const res = await fetch("/api/reviews");
        if (!res.ok) throw new Error("bad status");
        const data = await res.json();
        localStorage.setItem(this.LS_KEY, JSON.stringify(data));
        return { data, offline: false };
      } catch {
        let data = {};
        try {
          data = JSON.parse(localStorage.getItem(this.LS_KEY)) || {};
        } catch {}
        return { data, offline: true };
      }
    },

    async add(bookId, review) {
      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId, ...review }),
        });
        if (!res.ok) throw new Error("bad status");
        const list = await res.json();
        return { data: list, offline: false };
      } catch {
        let all = {};
        try {
          all = JSON.parse(localStorage.getItem(this.LS_KEY)) || {};
        } catch {}
        const list = all[bookId] || [];
        list.unshift({ name: review.name, text: review.text, rating: review.rating, date: new Date().toISOString() });
        all[bookId] = list;
        localStorage.setItem(this.LS_KEY, JSON.stringify(all));
        return { data: list, offline: true };
      }
    },
  };

  const BooksAPI = {
    LS_KEY: "seal-command:books",

    async getAll() {
      try {
        const res = await fetch("/api/books");
        if (!res.ok) throw new Error("bad status");
        const data = await res.json();
        localStorage.setItem(this.LS_KEY, JSON.stringify(data));
        return { data, offline: false };
      } catch {
        let data = [];
        try {
          data = JSON.parse(localStorage.getItem(this.LS_KEY)) || [];
        } catch {}
        return { data, offline: true };
      }
    },

    /* `book.id` present = edit an existing book; omitted = create a new one. */
    async save(book) {
      try {
        const res = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(book),
        });
        if (!res.ok) throw new Error("bad status");
        const saved = await res.json();
        return { data: saved, offline: false };
      } catch {
        let all = [];
        try {
          all = JSON.parse(localStorage.getItem(this.LS_KEY)) || [];
        } catch {}
        const id =
          book.id ||
          `${(book.title || "book").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "book"}-${Math.random()
            .toString(16)
            .slice(2, 8)}`;
        const saved = {
          id,
          title: book.title,
          author: book.author,
          cover: book.cover || "assets/images/archive/placeholder-book.svg",
          rating: Number(book.rating) || 0,
          status: book.status || "Want to Read",
        };
        const idx = all.findIndex((b) => b.id === id);
        if (idx >= 0) all[idx] = saved;
        else all.push(saved);
        localStorage.setItem(this.LS_KEY, JSON.stringify(all));
        return { data: saved, offline: true };
      }
    },
  };

  /* Shared, mutable cache: shipId -> weaponId. Populated by hydrateWeapons(),
     read live by the Hangar weapon selects and the Orbital Duel game. */
  const weaponsState = {};

  function noteOffline(sectionSubEl) {
    if (!sectionSubEl || sectionSubEl.dataset.offlineNoted) return;
    sectionSubEl.dataset.offlineNoted = "true";
    const note = document.createElement("p");
    note.className = "offline-note";
    note.textContent = OFFLINE_MSG;
    sectionSubEl.insertAdjacentElement("afterend", note);
  }

  function getWeapon(weaponId) {
    return (
      (typeof WEAPONS_CATALOG !== "undefined" && WEAPONS_CATALOG.find((w) => w.id === weaponId)) ||
      (typeof WEAPONS_CATALOG !== "undefined" ? WEAPONS_CATALOG[0] : null)
    );
  }

  function equippedWeaponId(ship) {
    return weaponsState[ship.id] || ship.defaultWeapon;
  }

  /* ==================== 5. CARD RENDERERS ==================== */

  function renderHangar() {
    const grid = document.getElementById("hangarGrid");
    const cardTpl = document.getElementById("hangarCardTemplate");
    const statTpl = document.getElementById("hangarStatTemplate");
    if (!grid || !cardTpl || !statTpl || typeof HANGAR_DATA === "undefined") return [];

    const refs = [];

    HANGAR_DATA.forEach((ship) => {
      const node = cardTpl.content.cloneNode(true);
      const img = node.querySelector(".card-image");
      img.src = ship.image;
      img.alt = ship.name;

      node.querySelector(".class-tag").textContent = ship.class;
      node.querySelector(".card-title").textContent = ship.name;

      const statsList = node.querySelector(".card-stats");
      ship.stats.forEach((stat) => {
        const statNode = statTpl.content.cloneNode(true);
        statNode.querySelector(".stat-label").textContent = stat.label;
        statNode.querySelector(".stat-value").textContent = stat.value;
        statsList.appendChild(statNode);
      });

      const select = node.querySelector(".weapon-select");
      const desc = node.querySelector(".weapon-desc");

      if (typeof WEAPONS_CATALOG !== "undefined") {
        WEAPONS_CATALOG.forEach((weapon) => {
          const opt = document.createElement("option");
          opt.value = weapon.id;
          opt.textContent = `${weapon.name} (DMG ${weapon.damage})`;
          select.appendChild(opt);
        });
      }
      select.value = ship.defaultWeapon;
      updateWeaponDesc(desc, select.value);

      select.addEventListener("change", async () => {
        updateWeaponDesc(desc, select.value);
        weaponsState[ship.id] = select.value;
        const { offline } = await WeaponsAPI.set(ship.id, select.value);
        if (offline) noteOffline(document.querySelector("#hangar .section-sub"));
      });

      grid.appendChild(node);
      refs.push({ ship, select, desc });
    });

    return refs;
  }

  function updateWeaponDesc(descEl, weaponId) {
    const weapon = getWeapon(weaponId);
    if (!descEl || !weapon) return;
    descEl.textContent = weapon.description;
  }

  async function hydrateWeapons(refs) {
    const { data, offline } = await WeaponsAPI.getAll();
    Object.assign(weaponsState, data);
    if (offline) noteOffline(document.querySelector("#hangar .section-sub"));

    refs.forEach(({ ship, select, desc }) => {
      const weaponId = equippedWeaponId(ship);
      select.value = weaponId;
      updateWeaponDesc(desc, weaponId);
    });
  }

  function starString(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return "★".repeat(full) + (half ? "⯨" : "") + "☆".repeat(Math.max(empty, 0)) + `  (${rating}/5)`;
  }

  function fullStars(rating) {
    const n = Math.max(0, Math.min(5, Math.round(rating)));
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  function formatReviewDate(iso) {
    try {
      return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
    } catch {
      return "";
    }
  }

  function renderReviewList(listEl, reviews) {
    const tpl = document.getElementById("reviewItemTemplate");
    if (!tpl) return;
    listEl.textContent = "";
    if (!reviews.length) {
      const empty = document.createElement("li");
      empty.className = "review-empty";
      empty.textContent = "No reviews yet — be the first recruit to log one.";
      listEl.appendChild(empty);
      return;
    }
    reviews.forEach((review) => {
      const node = tpl.content.cloneNode(true);
      node.querySelector(".review-name").textContent = review.name;
      node.querySelector(".review-stars").textContent = fullStars(review.rating);
      node.querySelector(".review-text").textContent = review.text;
      node.querySelector(".review-date").textContent = formatReviewDate(review.date);
      listEl.appendChild(node);
    });
  }

  /* Builds one archive card (fragment) for `book`, pre-populated with
     `reviews`. Wires the reviews toggle/form AND the edit toggle/form.
     `opts.skipReveal` strips the scroll-reveal attribute for cards built
     after the initial page-load pass (e.g. a book just added by the
     visitor), since the IntersectionObserver has already run by then. */
  function buildArchiveCard(book, reviews, opts = {}) {
    const cardTpl = document.getElementById("archiveCardTemplate");
    if (!cardTpl) return null;

    const bookState = { ...book };
    const node = cardTpl.content.cloneNode(true);
    const article = node.querySelector(".archive-card");
    if (opts.skipReveal) article.removeAttribute("data-reveal");

    const img = node.querySelector(".cover-image");
    const titleEl = node.querySelector(".book-title");
    const authorEl = node.querySelector(".book-author");
    const ratingEl = node.querySelector(".book-rating");
    const tag = node.querySelector(".status-tag");

    function applyFields() {
      img.src = bookState.cover;
      img.alt = `${bookState.title} cover`;
      titleEl.textContent = bookState.title;
      authorEl.textContent = `by ${bookState.author}`;
      ratingEl.textContent = starString(bookState.rating);
      tag.textContent = bookState.status;
      tag.setAttribute("data-status", bookState.status);
    }
    applyFields();

    // --- Edit toggle/form ---
    const editToggle = node.querySelector(".edit-toggle");
    const editPanel = node.querySelector(".edit-panel");
    const editForm = node.querySelector(".edit-form");
    const editStatus = node.querySelector(".edit-status");
    const editCancel = node.querySelector(".edit-cancel");

    editToggle.addEventListener("click", () => {
      if (editPanel.hidden) {
        editForm.elements.title.value = bookState.title;
        editForm.elements.author.value = bookState.author;
        editForm.elements.cover.value = bookState.cover;
        editForm.elements.rating.value = String(bookState.rating);
        editForm.elements.status.value = bookState.status;
      }
      editPanel.hidden = !editPanel.hidden;
    });

    editCancel.addEventListener("click", () => {
      editPanel.hidden = true;
    });

    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = editForm.elements.title.value.trim();
      const author = editForm.elements.author.value.trim();
      const cover = editForm.elements.cover.value.trim() || bookState.cover;
      const rating = Number(editForm.elements.rating.value);
      const status = editForm.elements.status.value;

      if (!title || !author) {
        editStatus.textContent = "Title and author are required.";
        return;
      }

      editStatus.textContent = "Saving...";
      const { data: saved, offline } = await BooksAPI.save({ id: bookState.id, title, author, cover, rating, status });
      Object.assign(bookState, saved);
      applyFields();
      editStatus.textContent = offline ? "Saved locally (backend not detected)." : "Saved.";
      editPanel.hidden = true;
      if (offline) noteOffline(document.querySelector("#archive .section-sub"));
      setTimeout(() => {
        editStatus.textContent = "";
      }, 3000);
    });

    // --- Reviews toggle/list/form ---
    const toggleBtn = node.querySelector(".reviews-toggle");
    const countEl = node.querySelector(".reviews-count");
    const panel = node.querySelector(".reviews-panel");
    const listEl = node.querySelector(".reviews-list");
    const form = node.querySelector(".review-form");
    const statusEl = node.querySelector(".review-status");
    const submitBtn = node.querySelector(".review-submit");

    countEl.textContent = String(reviews.length);
    renderReviewList(listEl, reviews);

    toggleBtn.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.elements.name.value.trim();
      const rating = Number(form.elements.rating.value);
      const text = form.elements.text.value.trim();
      const honeypot = form.elements.honeypot.value;

      if (!name || !text || !(rating >= 1 && rating <= 5)) {
        statusEl.textContent = "Fill in a callsign, rating, and review first.";
        return;
      }

      submitBtn.disabled = true;
      statusEl.textContent = "Transmitting...";

      const { data: list, offline } = await ReviewsAPI.add(bookState.id, { name, rating, text, honeypot });
      renderReviewList(listEl, list);
      countEl.textContent = String(list.length);
      form.reset();
      statusEl.textContent = offline ? "Saved to this browser only (backend not detected)." : "Review posted.";
      submitBtn.disabled = false;
      if (offline) noteOffline(document.querySelector("#archive .section-sub"));
      setTimeout(() => {
        statusEl.textContent = "";
      }, 4000);
    });

    return node;
  }

  async function renderArchive() {
    const grid = document.getElementById("archiveGrid");
    const addBookTpl = document.getElementById("addBookCardTemplate");
    if (!grid || typeof ARCHIVE_DATA === "undefined") return;

    const [booksResult, reviewsResult] = await Promise.all([BooksAPI.getAll(), ReviewsAPI.getAll()]);
    const customBooks = booksResult.data || [];
    const reviewsByBook = reviewsResult.data || {};
    if (booksResult.offline || reviewsResult.offline) {
      noteOffline(document.querySelector("#archive .section-sub"));
    }

    const overridesById = new Map(customBooks.map((b) => [b.id, b]));
    const seedIds = new Set(ARCHIVE_DATA.map((b) => b.id));

    ARCHIVE_DATA.forEach((seedBook) => {
      const merged = { ...seedBook, ...(overridesById.get(seedBook.id) || {}) };
      const node = buildArchiveCard(merged, reviewsByBook[merged.id] || []);
      if (node) grid.appendChild(node);
    });

    customBooks
      .filter((b) => !seedIds.has(b.id))
      .forEach((b) => {
        const node = buildArchiveCard(b, reviewsByBook[b.id] || []);
        if (node) grid.appendChild(node);
      });

    if (addBookTpl) {
      const addFragment = addBookTpl.content.cloneNode(true);
      const addCardEl = addFragment.querySelector(".add-book-card");
      const form = addFragment.querySelector(".add-book-form");
      const statusEl = addFragment.querySelector(".edit-status");
      const submitBtn = addFragment.querySelector(".add-book-submit");

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = form.elements.title.value.trim();
        const author = form.elements.author.value.trim();
        const cover = form.elements.cover.value.trim();
        const rating = Number(form.elements.rating.value);
        const status = form.elements.status.value;

        if (!title || !author) {
          statusEl.textContent = "Title and author are required.";
          return;
        }

        submitBtn.disabled = true;
        statusEl.textContent = "Adding...";

        const { data: saved, offline } = await BooksAPI.save({ title, author, cover, rating, status });
        const cardNode = buildArchiveCard(saved, [], { skipReveal: true });
        if (cardNode) grid.insertBefore(cardNode, addCardEl);
        form.reset();
        statusEl.textContent = offline ? "Saved locally (backend not detected)." : "Book added.";
        submitBtn.disabled = false;
        if (offline) noteOffline(document.querySelector("#archive .section-sub"));
        setTimeout(() => {
          statusEl.textContent = "";
        }, 3000);
      });

      grid.appendChild(addFragment);
    }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
  }

  function renderLogs() {
    const list = document.getElementById("logsList");
    const tpl = document.getElementById("logEntryTemplate");
    if (!list || !tpl || typeof MISSION_LOGS === "undefined") return;

    const sorted = [...MISSION_LOGS].sort((a, b) => (a.date < b.date ? 1 : -1));

    sorted.forEach((entry) => {
      const node = tpl.content.cloneNode(true);
      node.querySelector(".log-date").textContent = formatDate(entry.date);
      node.querySelector(".log-title").textContent = entry.title;
      node.querySelector(".log-text").textContent = entry.body;
      list.appendChild(node);
    });
  }

  function renderSightings() {
    const grid = document.getElementById("sightingsGrid");
    const tpl = document.getElementById("sightingCardTemplate");
    if (!grid || !tpl || typeof SIGHTINGS_DATA === "undefined") return;

    SIGHTINGS_DATA.forEach((item) => {
      const node = tpl.content.cloneNode(true);
      const img = node.querySelector(".sighting-image");
      img.src = item.image;
      img.alt = item.caption;
      node.querySelector(".sighting-caption").textContent = item.caption;
      grid.appendChild(node);
    });
  }

  /* ==================== 6. ORBITAL DUEL ==================== */

  const VICTORY_QUIPS = [
    "flippers first, questions later.",
    "left the loser filing an incident report.",
    "out-whiskered the competition entirely.",
    "called in an orbital nap immediately after.",
    "the ice shelf erupted in applause.",
    "logged it as 'routine patrol' in the mission report.",
  ];

  function initDuel() {
    const selectA = document.getElementById("duelSelectA");
    const selectB = document.getElementById("duelSelectB");
    const loadoutA = document.getElementById("duelLoadoutA");
    const loadoutB = document.getElementById("duelLoadoutB");
    const oddsEl = document.getElementById("duelOdds");
    const engageBtn = document.getElementById("duelEngage");
    const resultEl = document.getElementById("duelResult");
    const canvas = document.getElementById("duelCanvas");

    if (!selectA || !selectB || !canvas || typeof HANGAR_DATA === "undefined") return;
    const ctx = canvas.getContext("2d");

    HANGAR_DATA.forEach((ship) => {
      [selectA, selectB].forEach((sel) => {
        const opt = document.createElement("option");
        opt.value = ship.id;
        opt.textContent = ship.name;
        sel.appendChild(opt);
      });
    });
    selectA.value = HANGAR_DATA[0].id;
    selectB.value = (HANGAR_DATA[1] || HANGAR_DATA[0]).id;

    function getShip(id) {
      return HANGAR_DATA.find((s) => s.id === id);
    }

    function power(ship) {
      const weapon = getWeapon(equippedWeaponId(ship));
      return ship.powerScore + (weapon ? weapon.damage : 0);
    }

    function refreshOdds() {
      const shipA = getShip(selectA.value);
      const shipB = getShip(selectB.value);
      if (!shipA || !shipB) return;

      const weaponA = getWeapon(equippedWeaponId(shipA));
      const weaponB = getWeapon(equippedWeaponId(shipB));
      loadoutA.textContent = `Loadout: ${weaponA.name} (DMG ${weaponA.damage})`;
      loadoutB.textContent = `Loadout: ${weaponB.name} (DMG ${weaponB.damage})`;

      const powerA = power(shipA);
      const powerB = power(shipB);
      const total = powerA + powerB || 1;
      const pctA = Math.round((powerA / total) * 100);
      const pctB = 100 - pctA;

      oddsEl.textContent = "";
      const bar = document.createElement("div");
      bar.className = "odds-bar";
      const fillA = document.createElement("span");
      fillA.className = "odds-fill";
      fillA.style.width = pctA + "%";
      bar.appendChild(fillA);
      const label = document.createElement("p");
      label.className = "odds-label";
      label.textContent = `${shipA.name}: ${pctA}%  ·  ${pctB}%: ${shipB.name}`;
      oddsEl.appendChild(bar);
      oddsEl.appendChild(label);

      drawArenaIdle(ctx, canvas);
      resultEl.textContent = "";
    }

    selectA.addEventListener("change", refreshOdds);
    selectB.addEventListener("change", refreshOdds);
    refreshOdds();

    let animating = false;

    engageBtn.addEventListener("click", () => {
      if (animating) return;

      const shipA = getShip(selectA.value);
      const shipB = getShip(selectB.value);
      if (shipA.id === shipB.id) {
        resultEl.textContent = "Pick two different ships, ace.";
        return;
      }

      const powerA = power(shipA);
      const powerB = power(shipB);
      const winnerIsA = Math.random() < powerA / (powerA + powerB);
      const winner = winnerIsA ? shipA : shipB;
      const loser = winnerIsA ? shipB : shipA;

      animating = true;
      engageBtn.disabled = true;
      resultEl.textContent = "";

      runDuelAnimation(ctx, canvas, winnerIsA, () => {
        animating = false;
        engageBtn.disabled = false;
        const quip = VICTORY_QUIPS[Math.floor(Math.random() * VICTORY_QUIPS.length)];
        resultEl.textContent = `🏆 ${winner.name} wins — ${quip} (${loser.name} limps back to the hangar.)`;
      });
    });
  }

  /* Draws one duelist as a seal emoji with a colored team halo behind it.
     `mirrored` flips it horizontally so the two combatants visually face
     each other across the arena. */
  function drawSealMarker(ctx, x, y, color, mirrored, alpha) {
    const a = alpha === undefined ? 1 : alpha;
    if (a <= 0) return;

    ctx.save();
    ctx.globalAlpha = a * 0.35;
    ctx.shadowBlur = 16;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = "26px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(x, y);
    if (mirrored) ctx.scale(-1, 1);
    ctx.fillText("🦭", 0, 1);
    ctx.restore();
  }

  function drawArenaIdle(ctx, canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(75,251,255,0.18)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 220, 80, 0, 0, Math.PI * 2);
    ctx.stroke();
    drawSealMarker(ctx, cx - 220, cy, "#4bfbff", false);
    drawSealMarker(ctx, cx + 220, cy, "#ffb347", true);
  }

  function runDuelAnimation(ctx, canvas, winnerIsA, onDone) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setTimeout(onDone, 400);
      return;
    }

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radiusX = 220;
    const radiusY = 80;
    const duration = 2200;
    const start = performance.now();

    function frame(now) {
      const t = now - start;
      const progress = Math.min(t / duration, 1);

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#05070a";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(75,251,255,0.18)";
      ctx.beginPath();
      ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();

      const angleA = progress * Math.PI * 5;
      const angleB = angleA + Math.PI;
      const ax = cx + Math.cos(angleA) * radiusX;
      const ay = cy + Math.sin(angleA) * radiusY;
      const bx = cx + Math.cos(angleB) * radiusX;
      const by = cy + Math.sin(angleB) * radiusY;

      if (progress < 0.9 && Math.floor(t / 260) % 2 === 0) {
        ctx.strokeStyle = "rgba(255,179,71,0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }

      const isFading = progress > 0.85;
      const fadeProgress = isFading ? (progress - 0.85) / 0.15 : 0;
      const loserAlpha = isFading ? Math.max(0, 1 - fadeProgress) : 1;
      const alphaA = winnerIsA ? 1 : loserAlpha;
      const alphaB = winnerIsA ? loserAlpha : 1;

      drawSealMarker(ctx, ax, ay, "#4bfbff", false, alphaA);
      drawSealMarker(ctx, bx, by, "#ffb347", true, alphaB);

      if (isFading) {
        const loserPos = winnerIsA ? { x: bx, y: by } : { x: ax, y: ay };
        ctx.save();
        ctx.globalAlpha = loserAlpha;
        ctx.fillStyle = "#ff5c5c";
        for (let i = 0; i < 8; i++) {
          const pa = (i / 8) * Math.PI * 2;
          const pr = fadeProgress * 34;
          ctx.beginPath();
          ctx.arc(loserPos.x + Math.cos(pa) * pr, loserPos.y + Math.sin(pa) * pr, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        onDone();
      }
    }

    requestAnimationFrame(frame);
  }

  /* ==================== 7. EASTER EGG ==================== */
  function initEasterEgg() {
    const overlay = document.getElementById("secretOverlay");
    const closeBtn = document.getElementById("secretClose");
    const hiddenTrigger = document.getElementById("secretTrigger");
    if (!overlay) return;

    function openSecret() {
      overlay.hidden = false;
    }
    function closeSecret() {
      overlay.hidden = true;
    }

    closeBtn && closeBtn.addEventListener("click", closeSecret);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeSecret();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.hidden) closeSecret();
    });

    /* Hidden click target: the faint "·" glyph in the footer */
    let clickCount = 0;
    let clickTimer = null;
    if (hiddenTrigger) {
      hiddenTrigger.addEventListener("click", () => {
        clickCount += 1;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => { clickCount = 0; }, 1500);
        if (clickCount >= 5) {
          clickCount = 0;
          openSecret();
        }
      });
    }

    /* Konami code: up up down down left right left right b a */
    const KONAMI = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
      "b", "a",
    ];
    let progress = 0;

    document.addEventListener("keydown", (e) => {
      const expected = KONAMI[progress];
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (key === expected) {
        progress += 1;
        if (progress === KONAMI.length) {
          progress = 0;
          openSecret();
        }
      } else {
        progress = key === KONAMI[0] ? 1 : 0;
      }
    });
  }

  /* ==================== INIT ==================== */
  document.addEventListener("DOMContentLoaded", async () => {
    initStarfield();
    initNav();

    const hangarRefs = renderHangar();
    renderLogs();
    renderSightings();
    await renderArchive(); // builds its own cards after fetching books+reviews

    initScrollRevealShared();
    initEasterEgg();
    initDuel();

    hydrateWeapons(hangarRefs);
  });
})();
