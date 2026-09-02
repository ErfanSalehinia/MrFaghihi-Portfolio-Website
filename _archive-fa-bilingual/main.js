/* =========================================================
   Farzin Faghihi — site behaviour
   Vanilla JS, no dependencies. Every animation checks
   prefers-reduced-motion before it runs.
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var UI = window.I18N_UI;
  var EN = window.I18N_EN || {};

  /* localStorage is unavailable in some privacy modes — never let it break the page. */
  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { /* ignore */ }
    return null;
  }

  /* ---------------------------------------------------------
     Language
     Persian is the markup default; we cache it on first run
     and swap in the English dictionary on demand.
     --------------------------------------------------------- */
  var i18nNodes = [];
  var lang = store("ff-lang") === "en" ? "en" : "fa";

  function cachePersian() {
    i18nNodes = [].slice.call(document.querySelectorAll("[data-i18n]"));
    i18nNodes.forEach(function (el) { el.dataset.fa = el.textContent.trim(); });
  }

  /* Numerals follow the script they sit in. */
  var FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
  function localiseDigits(text, to) {
    return text.replace(/[0-9۰-۹]/g, function (ch) {
      var i = FA_DIGITS.indexOf(ch);
      if (i === -1) i = Number(ch);
      return to === "fa" ? FA_DIGITS[i] : String(i);
    });
  }

  function applyLang(next) {
    lang = next;
    root.lang = next;
    root.dir = next === "fa" ? "rtl" : "ltr";

    i18nNodes.forEach(function (el) {
      var key = el.dataset.i18n;
      el.textContent = next === "fa" ? el.dataset.fa : (EN[key] || el.dataset.fa);
    });

    // accordion numerals are decorative markup, not dictionary entries
    document.querySelectorAll(".acc__t i").forEach(function (el) {
      el.textContent = localiseDigits(el.textContent, next);
    });

    var strings = UI[next];
    var langBtn = document.getElementById("langToggle");
    langBtn.textContent = strings.langLabel;
    langBtn.setAttribute("aria-label", strings.langAria);
    document.getElementById("themeToggle").setAttribute("aria-label", strings.themeAria);
    document.getElementById("burger").setAttribute("aria-label", strings.menuAria);

    resetCounters();
    store("ff-lang", next);
  }

  /* ---------------------------------------------------------
     Theme
     --------------------------------------------------------- */
  var themeBtn = document.getElementById("themeToggle");
  var savedTheme = store("ff-theme");
  var theme = savedTheme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

  function applyTheme(next) {
    theme = next;
    root.dataset.theme = next;
    themeBtn.setAttribute("aria-pressed", String(next === "light"));
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "light" ? "#ffffff" : "#0f0f0f");
    store("ff-theme", next);
  }

  themeBtn.addEventListener("click", function () {
    applyTheme(theme === "dark" ? "light" : "dark");
  });

  /* ---------------------------------------------------------
     Hero entrance — the two display words slide in from
     opposite sides, matching the reference's appear effect.
     --------------------------------------------------------- */
  function initHero() {
    var hero = document.querySelector(".hero");
    if (!hero) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add("is-ready"); });
    });
  }

  /* ---------------------------------------------------------
     Scroll reveal — applied to section-level blocks so the
     markup stays free of presentation classes.
     --------------------------------------------------------- */
  function initReveal() {
    var items = [].slice.call(document.querySelectorAll(
      ".section .head, .section .split__text, .section .split__media, " +
      ".section .about > *, .card, .post, .quote, .cta__inner > *"
    ));
    items.forEach(function (el) { el.classList.add("reveal"); });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     Stat counters
     --------------------------------------------------------- */
  var counterObserver = null;

  function renderCount(el, value) {
    el.textContent = localiseDigits(String(value) + (el.dataset.suffix || ""), lang);
  }

  function runCount(el) {
    var target = Number(el.dataset.count);
    if (reduceMotion) { renderCount(el, target); return; }

    var duration = 1400;
    var start = null;
    (function step(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      renderCount(el, Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  function resetCounters() {
    var nums = document.querySelectorAll(".stats__num");
    if (counterObserver) counterObserver.disconnect();

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nums.forEach(function (el) { renderCount(el, Number(el.dataset.count)); });
      return;
    }
    counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCount(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) {
      renderCount(el, 0);
      counterObserver.observe(el);
    });
  }

  /* ---------------------------------------------------------
     Accordions — one panel open at a time within each list
     --------------------------------------------------------- */
  function initAccordions() {
    document.querySelectorAll(".acc__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".acc");
        var list = btn.closest(".acc-list");
        var willOpen = btn.getAttribute("aria-expanded") !== "true";

        list.querySelectorAll(".acc").forEach(function (other) {
          other.classList.remove("is-open");
          other.querySelector(".acc__btn").setAttribute("aria-expanded", "false");
        });

        if (willOpen) {
          item.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  /* ---------------------------------------------------------
     Scroll effects — one rAF-throttled pass drives all of them,
     so scrolling never queues more than a frame of work.

       · the hero portrait drifts down and swings in 3D
       · the services image tilts as it crosses the viewport
       · the nav pill collapses to its "available" state

     Skipped entirely under reduced motion and on narrow
     screens, where the hero stacks and parallax would fight
     the layout.
     --------------------------------------------------------- */
  function initScrollFX() {
    var pill = document.getElementById("pill");
    var portrait = document.querySelector(".hero__portrait");
    var tilt = document.querySelector(".ph--tilt");
    var hero = document.querySelector(".hero");
    var wide = window.matchMedia("(min-width: 761px)");
    var ticking = false;

    function frame() {
      ticking = false;
      var y = window.scrollY;

      // pill state flips once the hero is mostly behind you
      var threshold = hero ? hero.offsetHeight * 0.45 : 400;
      pill.classList.toggle("is-compact", y > threshold);

      if (reduceMotion || !wide.matches) {
        if (portrait) portrait.style.transform = "";
        if (tilt) tilt.style.removeProperty("--tilt");
        return;
      }

      if (portrait) {
        // only while the hero is still on screen
        var p = Math.min(y / (hero.offsetHeight || 1), 1);
        portrait.style.transform =
          "perspective(1200px) translateY(" + (p * 260).toFixed(1) + "px)" +
          " rotateY(" + (p * 26).toFixed(1) + "deg)" +
          " rotateZ(" + (p * 6).toFixed(1) + "deg)";
      }

      if (tilt) {
        var r = tilt.getBoundingClientRect();
        // -1 when entering from the bottom, +1 when leaving at the top
        var t = 1 - 2 * ((r.top + r.height / 2) / window.innerHeight);
        tilt.style.setProperty("--tilt", Math.max(-1, Math.min(1, t)).toFixed(3));
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(frame);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    frame();
  }

  /* ---------------------------------------------------------
     Accordion hover preview — the thumb trails the pointer.
     Pointer-driven, so it never appears on touch devices.
     --------------------------------------------------------- */
  function initPreviews() {
    if (reduceMotion) return;

    document.querySelectorAll(".acc__btn").forEach(function (btn) {
      var preview = btn.querySelector(".acc__preview");
      if (!preview) return;

      btn.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var r = btn.getBoundingClientRect();
        // The thumb is already centred in the row by CSS; the pointer
        // only nudges it within a narrow band, so it stays off the label
        // whatever the title's length or the writing direction.
        var relX = (e.clientX - r.left) / r.width - 0.5;
        var relY = (e.clientY - r.top) / r.height - 0.5;
        preview.style.setProperty("--px", (relX * 70).toFixed(0) + "px");
        preview.style.setProperty("--py", (relY * 16).toFixed(0) + "px");
      });
    });
  }

  /* ---------------------------------------------------------
     Active nav link
     --------------------------------------------------------- */
  function initNavSpy() {
    var links = [].slice.call(document.querySelectorAll(".pill__links a"));
    var sections = links
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);
    if (!("IntersectionObserver" in window) || !sections.length) return;

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------------------------------------------------------
     Mobile navigation
     --------------------------------------------------------- */
  function initMobileNav() {
    var burger = document.getElementById("burger");
    var panel = document.getElementById("mobileNav");

    function close() {
      burger.setAttribute("aria-expanded", "false");
      panel.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      window.setTimeout(function () {
        if (burger.getAttribute("aria-expanded") === "false") panel.hidden = true;
      }, reduceMotion ? 0 : 240);
    }

    burger.addEventListener("click", function () {
      if (burger.getAttribute("aria-expanded") === "true") { close(); return; }
      panel.hidden = false;
      // let the browser paint the unhidden panel before fading it in
      requestAnimationFrame(function () { panel.classList.add("is-open"); });
      burger.setAttribute("aria-expanded", "true");
      document.body.classList.add("is-locked");
    });

    panel.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        close();
        burger.focus();
      }
    });
  }

  /* ---------------------------------------------------------
     Back to top
     --------------------------------------------------------- */
  document.getElementById("toTop").addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  cachePersian();
  applyTheme(theme);
  applyLang(lang);
  initHero();
  initReveal();
  initAccordions();
  initNavSpy();
  initMobileNav();
  initScrollFX();
  initPreviews();

  document.getElementById("langToggle").addEventListener("click", function () {
    applyLang(lang === "fa" ? "en" : "fa");
  });
})();
