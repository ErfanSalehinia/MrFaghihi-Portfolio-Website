# Design System — Portavia rebuild

Source of truth for the clone. Where this document and the live site disagree,
the live site wins (spec §0.2).

## 1. Tokens (spec §1)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#1B1D1C` | Page ground |
| `--surface` | `#333333` | Cards, form fields |
| `--lime` | `#CFFF70` | Accent: buttons, tags, stars, footer, cursor |
| `--text` | `#FFFFFF` | Primary text |
| `--text-muted` | `rgba(255,255,255,.72)` | Secondary text |
| `--on-lime` | `#1B1D1C` | Ink on lime |
| `--accent-ink` | `#CFFF70` dark / `#52700F` light | The accent **as ink** |
| `--white-card` | `#FFFFFF` | The white stat card |

Radii: cards **16px**, large images **20px**, inputs and buttons **999px**.
Container **1120px**, gutter **24px**.

**Light is the ground state.** `data-theme="light"` ships on `<html>`, and only
a choice the visitor made before overrides it — the OS preference deliberately
does not, so everyone lands on the same site.

Lime is as bright as white (relative luminance .86), so it vanishes as ink on
the light ground: 1.05:1 against `#F4F4F2`. Every use of the accent as **text,
a border, an outline or a hairline** therefore reads `--accent-ink`, which is
lime on dark and a deep olive-lime on light (5.3:1). Solid lime *fills* with
dark ink on top — footer, tags, stat card, the Hi badge — stay lime in both.
`.scard--white` follows `--white-card`, so the card that breaks the grid
rhythm inverts to dark on the light page instead of disappearing into it.

Grain: fixed full-viewport `feTurbulence` tile at **5% opacity** — a texture,
not a visible background.

## 2. Type — measured, not estimated

Read out of Framer's style presets on the live page:

| Role | Preset | Font | Size (desktop / tablet / mobile) | Weight | Line-height | Tracking |
|---|---|---|---|---|---|---|
| Display h1 | `monjet` | Antonio | 120 / 96 / 56 | 700 | 1.1 | -.03em |
| Section h2 | `1yryej1` | Antonio | 60 / 48 / 42 | 700 | 1.3 | 0 |
| Sub-head, accordion row | `12q7ivy` | Antonio | 32 / 24 | **400** | 1.3 | 0 |
| Body | `17cdd8a` | Inter | 16 | 400 | 1.55 | 0 |

Headings are written lowercase in the markup and uppercased with
`text-transform`, matching the original (spec §1).

## 3. The scroll-linked card (spec §3)

| Property | Value |
|---|---|
| Size | 280 × 390, radius 16px |
| Faces | 2 — front `card-front.jpg`, back `card-back.jpeg` at `rotateY(180deg)` |
| Pin | zero-height `position: sticky; top: 50vh` rail inside `#stage` |
| Span | hero → end of About |
| `rotateY` | `360deg × p` (p = stage scroll progress, 0→1) |
| `rotateZ` | constant `-4deg` |
| `rotateX` | `sin(p·π) × 5deg` — a slight float |
| Horizontal | centre 50% → 66% of viewport width over the first half |
| Damping | `lerp(p, target, .14)` — lag without bounce |
| Perspective | 1200px on the pin; `preserve-3d` + `backface-visibility: hidden` |

Only `transform` animates. Disabled below 768px.

**Why no image swap at 90°:** the spec's v1 called for three images and a
mid-flip swap. v2 corrected this — with two faces and a full 360° turn the
front simply comes back around, so nothing needs swapping and there is no
seam to hide.

## 4. Motion contract

Single rAF loop drives smooth scroll, cursor, card and the nav pill, so
scrolling never queues more than a frame of work.

| Behaviour | Timing |
|---|---|
| Smooth scroll | wheel-driven lerp, factor .2, written with `behavior:"instant"` |
| Cursor follow | lerp .18; a plain lime dot, 10px → 76px over interactive targets |
| Section reveal | fade + 26px rise, .6s easeOut, once |
| Counters | 0 → target, 1.5s easeOut, on 60% visibility |
| Accordion | measured height, .35s |
| Nav pill collapse | past 80px scroll, width + fade |
| Project stack | each cover pins at `108px + 18px × index`; the covered card scales to .91 |

## 5. Accordion height

The `grid-template-rows: 0fr → 1fr` trick is **not** used: with `min-height: 0`
on the child the automatic minimum collapses to zero and `1fr` has no free
space to distribute, so the row only ever grew to the child's padding
(measured: 22px against 96px of content). Instead JS measures `scrollHeight`
while collapsed and writes it to `--h`; CSS transitions `height` to that value
and back to `0`. Re-measured on resize for any open panel.

## 6. Accessibility (spec §6)

- `prefers-reduced-motion` removes the 3D rotation, count-up and custom cursor,
  and collapses every duration.
- Accordions are real `<button>`s with `aria-expanded` and `aria-controls`, so
  Enter/Space work for free.
- Visible `:focus-visible` ring on every link, button and field; never removed.
- Skip link to `#main`; mobile nav closes on `Escape`.
- Every image carries explicit `width`/`height` (no layout shift) and
  off-screen images are `loading="lazy"`.
- Form errors sit next to their field; status region is `role="status"`.

## 7. Anti-patterns

- Animating `top`/`left`/`width` instead of `transform`.
- Colour-only state changes without a shape or text cue.
- Driving `window.scrollTo()` from a rAF loop while `html { scroll-behavior:
  smooth }` is set. Each call starts a *new* browser-side smooth animation and
  they compound, so the page crawls behind the wheel. Pass
  `behavior: "instant"` in the loop; the CSS value still serves anchor links.
- Reading animated values in headless Chrome under `--virtual-time-budget`:
  the transition and rAF clocks are frozen there and every animated property
  reports its start value.
