# Farzin Faghihi — Founder & CEO, Wira Bonyan Apadana

A one-page site built on a hand-made clone of
[portavia.framer.website](https://portavia.framer.website/). Plain HTML + CSS +
JavaScript, **no build step and no dependencies** — open `index.html`.

```bash
start index.html          # or: npx serve .
```

## Structure

```
index.html                 the whole page
assets/css/style.css       tokens, layout, every component
assets/js/main.js          smooth scroll, cursor, 3D card, project stack, form
assets/img/                photographs and placeholder covers
design-system/MASTER.md    tokens, measured type scale, motion contract
_archive-fa-bilingual/     the earlier Farsi/English site, kept for the FA layer
```

## Where the content comes from

Everything factual is taken from Farzin's LinkedIn profile: the role and dates
at Wira Bonyan Apadana (Founder and CEO, Jul 2013 to present, Isfahan), the
earlier post at Aris Vira Vision (Project Development Manager, part-time,
Mar 2011 – Mar 2012, Tehran), the three schools, and the About line in his own
words. The Career section is built entirely from that profile.

Three things are **drafts written from that material, not quoted from him**, and
each is marked with an HTML comment in `index.html`:

| Block | Status |
|---|---|
| "What we do" bullet lists | drafted from the two areas LinkedIn tags on his role |
| Selected Work, cards 1–2 | drafted; cards 3 (Aris Vira Vision) and 4 (Wira Bonyan) are from LinkedIn |
| Notes & Insights | **switched off** — the whole section is wrapped in a comment in `index.html`; delete the wrapper to bring it back |
| `work-1-materials`, `work-4-company`, `note-1`, `note-2` | still abstract stand-ins — real photographs needed |

Contact details are live: phone/WhatsApp +98 913 106 7381, Telegram and
Instagram @farzinfaghihi, LinkedIn. No email address is published — none was
given, and an invented one is worse than none.

`work-2-training` and `work-3-aris-vira` are CC0/public-domain photographs from
Flickr (no attribution required). Unsplash and Pexels are behind bot walls from
this machine, so the polished dental stock they hold could not be reached.

The four `work-*` and two `note-*` images are placeholder covers named after the
slot they fill; drop replacements in under the same names and nothing else needs
to change.

## The contact form

There is no server behind this page, so a submit cannot be posted anywhere on
its own. Rather than fake it, the form validates and then hands the finished
message to WhatsApp with every field already written out — the visitor only
presses send. Fill `ENDPOINT` in at the top of `initForm()` in `assets/js/main.js`
and it POSTs there as JSON instead, falling back to WhatsApp if the request fails.

## The 3D card (§3)

`#stage` wraps hero + services + about. Inside it a zero-height
`position: sticky` rail pins the card mid-viewport while those three sections
scroll past behind it. Rotation is a **pure function of scroll progress** —
`rotateY = 360deg × p` — so scrolling back plays it exactly in reverse, and the
two faces (`backface-visibility: hidden`, back pre-rotated 180°) alternate on
their own.

Below 768px the card is switched off and each section shows its own static
image instead.

## The project stack (§4.4)

Each cover is `position: sticky` at `108px + 18px × index`, so the next card
slides over the previous one instead of pushing it away; JS eases the covered
card to `scale(.91)` so the pile reads as depth. Off below 768px.

## Hand-rolled instead of libraries

The spec names Lenis and GSAP ScrollTrigger. Both are replaced with ~40 lines
in a single rAF loop: a wheel-driven lerp for smooth scroll (keyboard, anchors,
scrollbar and touch keep native behaviour), and direct progress maths for the
scrub. Same behaviour, zero dependencies, works offline.

## Verified

- 390px (real device emulation): no horizontal scroll, no image taller than
  the viewport, every tap target at least 44px, no text under 13px.
- 1440px: no horizontal scroll, no console errors, every `#` anchor resolves.
- Accordions: closed `0px`, open sized to content, one open per list.
- Every `<img>` carries explicit `width`/`height`; off-screen images are lazy.
- `prefers-reduced-motion` drops the 3D rotation, count-up and custom cursor.

> Two traps worth remembering. An `<img>` `width`/`height` attribute is a
> presentational hint for the CSS **height** as well, so without a global
> `height: auto` every image renders at its raw pixel height and `aspect-ratio`
> never applies. And under headless Chrome's `--virtual-time-budget` the CSS
> transition and rAF clocks do not advance, so animated values read as their
> start state — disable transitions before measuring.
