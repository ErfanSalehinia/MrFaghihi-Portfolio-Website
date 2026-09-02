/* =========================================================
   Bilingual dictionary.
   Persian lives in index.html as the default markup, so the
   page still reads correctly with JavaScript disabled.
   This file only supplies the English side; main.js caches
   the Persian original on first run and swaps between them.

   TODO: keep these keys in sync when you replace the
   placeholder Persian copy with Mr. Faghihi's real content.
   ========================================================= */
window.I18N_EN = {
  "a11y.skip": "Skip to main content",

  "nav.home": "Home",
  "nav.services": "Expertise",
  "nav.work": "Projects",
  "nav.insights": "Insights",
  "nav.contact": "Contact",
  "nav.status": "Available for work",

  /* hero */
  "hero.name": "Farzin Faghihi",
  "hero.line1": "strategic",
  "hero.line2": "leadership",
  "hero.sub": "Managing Director at «Company Name» with over 15 years leading teams and growing businesses",

  /* services */
  "srv.title": "What I can do for you",
  "srv.lead": "My job is turning a vision into a plan people can actually run — one that keeps the team aligned and the business growing.",
  "srv.1.t": "Strategic management",
  "srv.1.d": "Vision setting and roadmapping, long-range planning, market and competitor analysis, and risk management.",
  "srv.2.t": "Business development",
  "srv.2.d": "Spotting opportunities, entering new markets, strategic partnerships and revenue model design.",
  "srv.3.t": "Team leadership",
  "srv.3.d": "Building high-performing teams, mentoring middle managers, company culture and succession planning.",
  "srv.4.t": "Digital transformation",
  "srv.4.d": "Digitising core processes, data-driven decision making, and operations and cost optimisation.",

  /* about */
  "ab.title": "About me",
  "ab.p1": "I'm Farzin Faghihi, a director focused on durable growth. I believe a good strategy is one the team can start executing on Monday morning — not a deck that lives in a drawer.",
  "ab.s1": "Years of experience",
  "ab.s2": "Projects delivered",
  "ab.s3": "People led",
  "ab.s4": "Stakeholder satisfaction",

  /* work */
  "wk.title": "Selected projects",
  "wk.more": "Full track record",
  "wk.1.tag": "Digital transformation",
  "wk.1.t": "Supply chain redesign",
  "wk.2.tag": "Market growth",
  "wk.2.t": "Regional market entry",
  "wk.3.tag": "Governance",
  "wk.3.t": "Merger and integration",
  "wk.4.tag": "Operations",
  "wk.4.t": "Production line optimisation",

  /* testimonial */
  "ts.1.q": "He had a clear picture of the destination and walked the team there step by step. The plan he gave us was one we could actually run.",
  "ts.1.n": "Ali Rostami",
  "ts.1.r": "Chief Financial Officer",

  /* faq */
  "fq.title": "Frequently asked",
  "fq.1.q": "What kind of work do you take on?",
  "fq.1.a": "Executive management, strategy redesign, market growth and growth advisory for mid-size and large organisations.",
  "fq.2.q": "How does an engagement start?",
  "fq.2.a": "With a short discovery call, followed by an initial assessment and a proposed way of working together.",
  "fq.3.q": "How long does a project run?",
  "fq.3.a": "It depends on scope — from a focused three-month engagement to a long-term board advisory role.",
  "fq.4.q": "Do you work with international teams?",
  "fq.4.a": "Yes. Meetings run in Persian or English, and there's prior experience working with regional partners.",

  /* insights */
  "in.title": "Insights",
  "in.more": "All insights",
  "in.1.date": "14 July 2026",
  "in.1.t": "Strategy that actually ships",
  "in.2.date": "2 June 2026",
  "in.2.t": "A team that decides for itself",
  "in.3.date": "20 April 2026",
  "in.3.t": "The right number, the right call",

  /* cta */
  "ct.line1": "let's",
  "ct.line2": "get started",

  /* footer */
  "ft.rights": "© 2026 Farzin Faghihi",
  "ft.top": "Top"
};

/* Strings that only ever live in JS (aria labels, formatting). */
window.I18N_UI = {
  fa: {
    langLabel: "EN",
    langAria: "تغییر زبان به انگلیسی",
    themeAria: "تغییر تم روشن و تاریک",
    menuAria: "منو"
  },
  en: {
    langLabel: "FA",
    langAria: "Switch language to Persian",
    themeAria: "Toggle light and dark theme",
    menuAria: "Menu"
  }
};
