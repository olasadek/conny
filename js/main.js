/*
  S.E.A.L. COMMAND — main.js
  Vanilla JS only. No dependencies.
  Sections:
    1. Starfield canvas
    2. Mobile nav toggle
    3. Scroll-reveal (IntersectionObserver)
    4. Card renderers (Hangar / Archive / Logs / Sightings)
    5. Easter egg (Konami code + hidden click target)
*/

(function () {
  "use strict";

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
    window.__revealObserver = observer;
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
  }

  /* ==================== 4. CARD RENDERERS ==================== */

  function renderHangar() {
    const grid = document.getElementById("hangarGrid");
    const cardTpl = document.getElementById("hangarCardTemplate");
    const statTpl = document.getElementById("hangarStatTemplate");
    if (!grid || !cardTpl || !statTpl || typeof HANGAR_DATA === "undefined") return;

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

      grid.appendChild(node);
    });
  }

  function starString(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return "★".repeat(full) + (half ? "⯨" : "") + "☆".repeat(Math.max(empty, 0)) + `  (${rating}/5)`;
  }

  function renderArchive() {
    const grid = document.getElementById("archiveGrid");
    const cardTpl = document.getElementById("archiveCardTemplate");
    if (!grid || !cardTpl || typeof ARCHIVE_DATA === "undefined") return;

    ARCHIVE_DATA.forEach((book) => {
      const node = cardTpl.content.cloneNode(true);
      const img = node.querySelector(".cover-image");
      img.src = book.cover;
      img.alt = `${book.title} cover`;

      const tag = node.querySelector(".status-tag");
      tag.textContent = book.status;
      tag.setAttribute("data-status", book.status);

      node.querySelector(".book-title").textContent = book.title;
      node.querySelector(".book-author").textContent = `by ${book.author}`;
      node.querySelector(".book-rating").textContent = starString(book.rating);

      grid.appendChild(node);
    });
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

  /* ==================== 5. EASTER EGG ==================== */
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
  document.addEventListener("DOMContentLoaded", () => {
    initStarfield();
    initNav();
    renderHangar();
    renderArchive();
    renderLogs();
    renderSightings();
    initScrollRevealShared();
    initEasterEgg();
  });
})();
