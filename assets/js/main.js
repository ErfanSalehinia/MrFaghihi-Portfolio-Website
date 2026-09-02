/* =========================================================
   Portavia — rebuild
   Vanilla JS, no dependencies. The smooth scroll and the
   scroll-linked 3D card are hand-rolled equivalents of the
   Lenis / GSAP-scrub setup the spec names (§2.1, §3).
   Everything motion-related is gated on prefers-reduced-motion.
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { /* private mode */ }
    return null;
  }

  /* ---------------------------------------------------------
     §2.1 Smooth scroll
     A wheel-driven lerp toward a target offset. Keyboard,
     scrollbar dragging, anchors and touch all keep native
     behaviour — we only take over the wheel, and resync
     whenever the page is scrolled by any other means.
     --------------------------------------------------------- */
  var smooth = { target: 0, current: 0, active: false };

  // Firefox and some mice report the wheel in lines or pages, not pixels;
  // taken literally (deltaY of 3) the page would barely move per notch.
  function wheelPx(e) {
    if (e.deltaMode === 1) return e.deltaY * 40;        // lines
    if (e.deltaMode === 2) return e.deltaY * window.innerHeight;  // pages
    return e.deltaY;
  }

  function initSmoothScroll() {
    if (reduce || !finePointer) return;

    smooth.target = smooth.current = window.scrollY;

    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey) return;                      // pinch-zoom
      if (document.body.classList.contains("is-locked")) return;
      e.preventDefault();
      smooth.target = clamp(smooth.target + wheelPx(e),
        0, document.documentElement.scrollHeight - window.innerHeight);
      smooth.active = true;
    }, { passive: false });

    // any non-wheel scroll (keys, anchors, scrollbar) wins
    window.addEventListener("scroll", function () {
      if (!smooth.active) smooth.target = smooth.current = window.scrollY;
    }, { passive: true });
  }

  function stepSmoothScroll() {
    if (!smooth.active) return;
    smooth.current = lerp(smooth.current, smooth.target, 0.2);
    if (Math.abs(smooth.target - smooth.current) < 0.5) {
      smooth.current = smooth.target;
      smooth.active = false;
    }
    // "instant" is essential: html has scroll-behavior:smooth for anchors, and
    // without this override the browser would start a fresh smooth animation on
    // every frame — they compound and the page crawls.
    window.scrollTo({ top: smooth.current, behavior: "instant" });
  }

  /* ---------------------------------------------------------
     §2.2 Custom cursor
     --------------------------------------------------------- */
  var cursor = { el: null, x: 0, y: 0, tx: 0, ty: 0 };

  function initCursor() {
    if (reduce || !finePointer) return;
    cursor.el = document.getElementById("cursor");
    if (!cursor.el) return;
    document.body.classList.add("has-cursor");

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      cursor.tx = e.clientX;
      cursor.ty = e.clientY;
      cursor.el.classList.add("is-on");
    }, { passive: true });

    document.addEventListener("pointerover", function (e) {
      if (!e.target.closest) return;
      var big = e.target.closest("a, button, .pcard, .bcard, .acc__btn, .switch, input, textarea, select");
      cursor.el.classList.toggle("is-lg", !!big);
    }, { passive: true });

    document.addEventListener("pointerleave", function () { cursor.el.classList.remove("is-on"); });
  }

  function stepCursor() {
    if (!cursor.el) return;
    cursor.x = lerp(cursor.x, cursor.tx, 0.18);
    cursor.y = lerp(cursor.y, cursor.ty, 0.18);
    cursor.el.style.transform = "translate3d(" + cursor.x.toFixed(1) + "px," + cursor.y.toFixed(1) + "px,0)";
  }

  /* ---------------------------------------------------------
     §3 The scroll-linked 3D card
     Progress runs 0→1 across the whole stage (hero → end of
     About). rotateY = 360deg * p, so the card completes two
     half-turns and the two faces alternate — no image swapping.
     A lerp on the progress gives the slight lag the spec asks
     for, and because the angle is a pure function of scroll,
     scrolling back plays it exactly in reverse.
     --------------------------------------------------------- */
  var card = { el: null, hi: null, stage: null, p: 0, target: 0, wide: false };

  function initCard() {
    card.el = document.getElementById("card3d");
    card.hi = document.getElementById("hiBadge");
    card.stage = document.getElementById("stage");
  }

  function measureCard() {
    card.wide = window.matchMedia("(min-width: 768px)").matches;
  }

  function stepCard() {
    if (!card.el || !card.stage || !card.wide) return;

    var rect = card.stage.getBoundingClientRect();
    var travel = rect.height - window.innerHeight;
    card.target = travel > 0 ? clamp(-rect.top / travel, 0, 1) : 0;

    // medium damping, no bounce
    card.p = reduce ? card.target : lerp(card.p, card.target, 0.14);
    var p = card.p;

    // 0 → 360deg across the stage: front, back, front again
    card.el.style.setProperty("--ry", (p * 360).toFixed(2) + "deg");
    card.el.style.setProperty("--rx", (Math.sin(p * Math.PI) * 5).toFixed(2) + "deg");

    // centre (50%) drifts to the right column (66%) over the first half
    var dx = clamp(p * 2, 0, 1) * 0.16 * window.innerWidth;
    card.el.style.setProperty("--dx", dx.toFixed(1) + "px");
    if (card.hi) card.hi.style.setProperty("--dx", dx.toFixed(1) + "px");
  }

  /* ---------------------------------------------------------
     Featured Projects — the sticky stack
     Every cover pins under the nav, so the next card slides over
     the previous one instead of pushing it away. The covered card
     eases down a few percent, which is what makes the pile read as
     depth rather than as two flat rectangles.
     --------------------------------------------------------- */
  var stack = { cards: [] };

  function initStack() {
    stack.cards = [].slice.call(document.querySelectorAll(".projects__list .pcard"));
  }

  function stepStack() {
    if (!stack.cards.length) return;
    for (var i = 0; i < stack.cards.length - 1; i++) {
      var el = stack.cards[i];
      if (!card.wide) { el.style.removeProperty("--s"); continue; }
      var r = el.getBoundingClientRect();
      // 0 while the next card is still below, 1 once it has covered this one
      var gap = stack.cards[i + 1].getBoundingClientRect().top - r.top;
      var covered = clamp(1 - gap / r.height, 0, 1);
      el.style.setProperty("--s", (1 - covered * 0.09).toFixed(4));
    }
  }

  /* ---------------------------------------------------------
     §2.3 Nav pill open / collapsed
     --------------------------------------------------------- */
  var pillEl = null;
  function stepPill() {
    if (!pillEl) pillEl = document.getElementById("pill");
    if (!pillEl) return;
    pillEl.classList.toggle("is-compact", window.scrollY > 80);
  }

  // Also bind it straight to scroll: the pill state is cheap and must not
  // depend on the rAF loop, which browsers throttle in background tabs.
  window.addEventListener("scroll", stepPill, { passive: true });

  /* ---------------------------------------------------------
     Single rAF loop drives every per-frame effect
     --------------------------------------------------------- */
  function frame() {
    stepSmoothScroll();
    stepCursor();
    stepCard();
    stepStack();
    stepPill();
    requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------
     §2.5 Section reveal — once, not every time
     --------------------------------------------------------- */
  function initReveal() {
    var items = [].slice.call(document.querySelectorAll(
      ".head, .service__col, .about__col, .tcard, .scard, .bcard, .faq__head, .acc-list--faq, .contact__media, .contact__body"
    ));
    items.forEach(function (el) { el.classList.add("reveal"); });

    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-visible");
        io.unobserve(en.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });

    // Failsafe: if the observer never fires (odd viewports, headless, an
    // early error), show everything rather than leaving the page blank.
    window.setTimeout(function () {
      items.forEach(function (el) { el.classList.add("is-visible"); });
    }, 2500);
  }

  /* ---------------------------------------------------------
     Counters (§4.3, §4.5) — 0 → target, ~1.5s easeOut
     --------------------------------------------------------- */
  function initCounters() {
    var nums = [].slice.call(document.querySelectorAll("[data-count]"));
    var render = function (el, v) { el.textContent = v + (el.dataset.suffix || ""); };

    if (reduce || !("IntersectionObserver" in window)) {
      nums.forEach(function (el) { render(el, Number(el.dataset.count)); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, to = Number(el.dataset.count), start = null;
        io.unobserve(el);
        (function tick(now) {
          if (start === null) start = now;
          var t = Math.min((now - start) / 1500, 1);
          render(el, Math.round(to * (1 - Math.pow(1 - t, 3))));
          if (t < 1) requestAnimationFrame(tick);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { render(el, 0); io.observe(el); });
  }

  /* ---------------------------------------------------------
     Accordions — one open per list, keyboard-native <button>
     --------------------------------------------------------- */
  function initAccordions() {
    document.querySelectorAll(".acc__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var list = btn.closest(".acc-list");
        var open = btn.getAttribute("aria-expanded") !== "true";
        list.querySelectorAll(".acc").forEach(function (a) {
          a.classList.remove("is-open");
          a.querySelector(".acc__btn").setAttribute("aria-expanded", "false");
        });
        if (open) {
          var item = btn.closest(".acc");
          var panel = item.querySelector(".acc__panel");
          // measure while collapsed, then hand the height to CSS
          panel.style.setProperty("--h", panel.scrollHeight + "px");
          item.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
        }
      });

      // hover thumb trails the pointer within a narrow band
      var thumb = btn.querySelector(".acc__thumb");
      if (!thumb || reduce) return;
      btn.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var r = btn.getBoundingClientRect();
        thumb.style.setProperty("--px", (((e.clientX - r.left) / r.width - 0.5) * 70).toFixed(0) + "px");
        thumb.style.setProperty("--py", (((e.clientY - r.top) / r.height - 0.5) * 16).toFixed(0) + "px");
      });
    });
  }

  /* ---------------------------------------------------------
     Mobile nav
     --------------------------------------------------------- */
  function initMobileNav() {
    var burger = document.getElementById("burger");
    var panel = document.getElementById("mobileNav");
    if (!burger || !panel) return;

    function close() {
      burger.setAttribute("aria-expanded", "false");
      panel.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      window.setTimeout(function () {
        if (burger.getAttribute("aria-expanded") === "false") panel.hidden = true;
      }, reduce ? 0 : 250);
    }

    burger.addEventListener("click", function () {
      if (burger.getAttribute("aria-expanded") === "true") { close(); return; }
      panel.hidden = false;
      requestAnimationFrame(function () { panel.classList.add("is-open"); });
      burger.setAttribute("aria-expanded", "true");
      document.body.classList.add("is-locked");
    });

    panel.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") { close(); burger.focus(); }
    });
  }

  /* ---------------------------------------------------------
     §2.4 Theme
     --------------------------------------------------------- */
  function initTheme() {
    var btn = document.getElementById("themeToggle");
    // Light is the ground state of the site. Only a choice the visitor made
    // before overrides it — the OS preference deliberately does not.
    var theme = store("pv-theme") || "light";

    function apply(next) {
      theme = next;
      root.dataset.theme = next;
      btn.setAttribute("aria-pressed", String(next === "light"));
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", next === "light" ? "#F4F4F2" : "#1B1D1C");
      store("pv-theme", next);
    }
    apply(theme);
    btn.addEventListener("click", function () { apply(theme === "dark" ? "light" : "dark"); });
  }

  /* ---------------------------------------------------------
     §4.8 Contact form — validate, fake submit
     --------------------------------------------------------- */
  /* ---------------------------------------------------------
     §4.8 Contact form
     There is no server behind this page, so a submit cannot be
     posted anywhere by itself. Rather than pretend, the finished
     message is handed to WhatsApp with every field already
     written out. Fill ENDPOINT in and it POSTs there instead.
     --------------------------------------------------------- */
  var ENDPOINT = "";                      // e.g. "https://formspree.io/f/xxxxxxx"
  var WHATSAPP = "989131067381";          // country code, no + and no spaces
  var PHONE_HUMAN = "+98 913 106 7381";

  function initForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;
    var status = document.getElementById("formStatus");
    var submit = document.getElementById("submitBtn");

    function show(field, msg) {
      var wrap = field.closest(".field");
      var slot = wrap.querySelector(".field__err");
      wrap.classList.toggle("has-error", !!msg);
      slot.textContent = msg || "";
      slot.hidden = !msg;
      field.setAttribute("aria-invalid", msg ? "true" : "false");
    }

    function check(field) {
      var v = field.value.trim();
      if (!v) return "This field is required.";
      if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email address.";
      return "";
    }

    form.querySelectorAll("input, textarea, select").forEach(function (f) {
      f.addEventListener("blur", function () { show(f, check(f)); });
      f.addEventListener("input", function () {
        if (f.closest(".field").classList.contains("has-error")) show(f, check(f));
      });
      f.addEventListener("change", function () { show(f, check(f)); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = [].slice.call(form.querySelectorAll("input, textarea, select"));
      var bad = null;
      fields.forEach(function (f) {
        var msg = check(f);
        show(f, msg);
        if (msg && !bad) bad = f;
      });
      if (bad) { bad.focus(); status.textContent = ""; status.classList.remove("is-ok"); return; }

      var data = {};
      fields.forEach(function (f) { data[f.name] = f.value.trim(); });

      status.classList.remove("is-ok");

      // A real endpoint takes priority the moment one is filled in above.
      if (ENDPOINT) {
        submit.disabled = true;
        submit.textContent = "Sending…";
        window.fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(data)
        }).then(function (r) {
          if (!r.ok) throw new Error(r.status);
          status.textContent = "Thank you — your message has been sent.";
          status.classList.add("is-ok");
          form.reset();
        }).catch(function () {
          status.textContent = "That didn't go through. Please write on WhatsApp instead: " + PHONE_HUMAN + ".";
        }).then(function () {
          submit.disabled = false;
          submit.textContent = "Send";
        });
        return;
      }

      // No endpoint: hand the finished message to WhatsApp. window.open runs
      // inside the click, so the popup blocker leaves it alone.
      var text = [
        "Hello Farzin,",
        "",
        "Name: " + data.name,
        "Email: " + data.email,
        "Subject: " + data.service,
        "",
        data.message
      ].join("\n");

      var win = window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(text), "_blank", "noopener");
      if (win) {
        status.textContent = "WhatsApp is open with your message ready — press send there.";
        status.classList.add("is-ok");
        form.reset();
      } else {
        status.textContent = "Your browser blocked the WhatsApp window. Write to " + PHONE_HUMAN + " directly.";
      }
    });
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  measureCard();
  window.addEventListener("resize", function () {
    measureCard();
    // an open panel must re-measure when the text reflows
    document.querySelectorAll(".acc.is-open .acc__panel").forEach(function (p) {
      p.style.setProperty("--h", "auto");
      p.style.setProperty("--h", p.scrollHeight + "px");
    });
  }, { passive: true });

  initTheme();
  initSmoothScroll();
  initCursor();
  initCard();
  initStack();
  initReveal();
  initCounters();
  initAccordions();
  initMobileNav();
  initForm();

  requestAnimationFrame(function () {
    requestAnimationFrame(function () { document.body.classList.add("is-ready"); });
  });
  frame();
})();
