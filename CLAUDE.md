# Bread Head — CLAUDE.md

Working directory: `/Users/Vedu/Developer/bread-head-web`

---

## Required: before every commit + push

```bash
npm run build        # must pass with zero errors
npx playwright test  # all 21 visual regression tests must pass
```

Never commit or push if either fails. Fix the root cause first.

---

## Project overview

**Bread Head** is a teen financial literacy web app (bread-head.org). This repo is the marketing website — Next.js 14 App Router, TypeScript, Tailwind CSS. The iOS app lives in a separate repo.

**Stack:**
- Next.js 14.2.5 (App Router)
- TypeScript (strict)
- Tailwind CSS v3 (custom config at `tailwind.config.js`)
- Framer Motion + GSAP for animations
- Lenis for smooth scroll
- Resend for transactional email
- Playwright for visual regression tests

---

## Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Homepage — all marketing sections |
| `/about` | `app/about/page.tsx` | About, team, founder, Congressional win |
| `/partners` | `app/partners/page.tsx` | Partnership inquiry page |
| `/api/contact` | `app/api/contact/route.ts` | Partner form → email via Resend |
| `/api/subscribe` | `app/api/subscribe/route.ts` | Early access signup → email via Resend |

---

## Section order — Homepage (`app/page.tsx`)

1. `Hero` — bgSage (#E6EDD9)
2. `Problem` — white
3. `WhyItMatters` — dark (#1A2E1A)
4. `Pillars` — bgSage
5. `Ticker` — bgSage (seamless with Pillars)
6. `LessonsPreview` — white
7. `Gamification` — dark (#1A2E1A)
8. `Journal` — bgSage
9. `AwardStrip` — white (Congressional App Challenge teaser)
10. `Partners` — bgSage
11. `FinalCTA` — dark (#1A2E1A)
12. `Footer`

---

## Section order — About page (`app/about/page.tsx`)

1. Hero — bgSage
2. `CongressionalWin` — full-bleed dark (wide photo bg + navy overlay)
3. Mission — dark (#1A2E1A)
4. Values — white
5. Founder (Ved Bastodkar) — bgSage
6. Dorian Matuszak — bgSage (thin divider above)
7. Mason Thies — bgSage (thin divider above)
8. Stats bar — dark (#1A2E1A)
9. Final CTA — bgSage
10. `Footer`

---

## Component locations

```
app/components/          # Shared/utility components
  CountUp.tsx            # Animated number counter
  FadeUp.tsx             # Scroll-triggered fade-up wrapper
  Footer.tsx
  MagneticButton.tsx     # Cursor-following magnetic effect
  Nav.tsx                # Fixed top nav
  PageTransition.tsx     # Route transition (Framer Motion)
  PhoneParallax.tsx      # Phone mockup parallax (Hero)
  SmoothScroll.tsx       # Lenis smooth scroll init
  WordReveal.tsx         # Word-by-word reveal animation
  XPBar.tsx              # XP progress bar (Gamification)

components/sections/     # Full-width page sections
  AwardStrip.tsx         # Compact homepage award recognition (white bg)
  CongressionalWin.tsx   # Full editorial award section (About page)
  FinalCTA.tsx           # Email signup CTA (dark bg)
  Gamification.tsx       # XP / achievement section (dark bg)
  Hero.tsx               # Homepage hero
  Journal.tsx            # Journal / reflection section
  LessonsPreview.tsx     # 10-unit curriculum waterfall
  Partners.tsx           # Partner types + inquiry CTA
  Pillars.tsx            # 3 product pillars
  Problem.tsx            # Problem statement
  Ticker.tsx             # Scrolling curriculum ticker
  WhyItMatters.tsx       # Data/stat bridge section

app/about/
  AboutCTA.tsx           # CTA buttons (client component)
  page.tsx               # About page

app/partners/
  PartnerForm.tsx        # Contact form (client component, POSTs to /api/contact)
  page.tsx               # Partners page
```

---

## Color palette (source of truth: `tailwind.config.js`)

| Token | Hex | Usage |
|-------|-----|-------|
| `brandGreen` | `#4A5D4A` | CTAs, primary accents — never on dark backgrounds |
| `accentGold` | `#D1A945` | Gamification (§5) and Final CTA (§8) only |
| `textTitle` | `#1A2E1A` | Headlines and dark section backgrounds |
| `bgSage` | `#E6EDD9` | Dominant page background |
| `cardBg` | `#FFFFFF` | Card surfaces |

**Congressional Win sections use a separate civic palette:**
- Navy overlay: `rgba(7,11,38,...)`
- Gold: `#D4AF5A` (badge/CTA) and `#B8922A` (AwardStrip on white)
- Cream text: `#F5F0E8`

---

## Typography

- **Display font** (`--font-display`): Playfair Display — italic, used on `h1`, `h2` only
- **Body font** (`--font-body`): DM Sans — all other text, nav, buttons, labels

**Font size convention:**
- H1 Hero: 48px desktop / 42px tablet / 34px mobile (fixed px — no clamp/vh)
- H2 sections: `clamp(...)` is acceptable for non-hero sections
- Body default: 15px, line-height 1.7, color `rgba(26,46,26,0.65)`
- Eyebrow labels: 11px, `font-semibold`, `uppercase`, `tracking-[0.13em]`, `#4A5D4A`

---

## Responsive breakpoints

| Name | Width | Notes |
|------|-------|-------|
| mobile | ≤767px | Single column, stacked layouts |
| tablet | 768–1023px | Transitional — phone mockup hidden (hero shows text only) |
| desktop | ≥1024px | Full two-column layouts, phone mockups visible |

**Key rule:** Hero phone mockup uses `hidden lg:flex` — phone only appears at 1024px+. Do not change to `md`.

Mobile and tablet overrides live in `app/globals.css` using explicit class names (e.g. `.hero-section`, `.lessons-layout`) with `!important`. Tailwind responsive prefixes (`md:`, `lg:`) are used for show/hide only.

---

## Email (Resend)

- API key in `.env.local` as `RESEND_API_KEY` (must also be set in Vercel env vars)
- Resend client is initialized **inside the POST handler** — never at module level (causes build errors when key is undefined)
- All emails send to: `breadhead.org@gmail.com` (forwards to vedbastodkar@gmail.com)
- `/api/contact` — partner form, subject prefixed by partner type
- `/api/subscribe` — early access signup

---

## Visual regression tests

**Config:** `playwright.config.ts` — excluded from Next.js tsconfig (`tsconfig.json` exclude list includes `playwright.config.ts` and `tests`).

**Projects:** mobile (375×812), tablet (768×1024), desktop (1440×900) — all Chromium.

**Tests:** `tests/sections.spec.ts` — 7 tests × 3 viewports = 21 snapshots.
Snapshots: `tests/snapshots/sections.spec.ts-snapshots/`

```bash
npm run test:visual      # run against existing snapshots
npm run test:update      # regenerate all snapshots (run after intentional visual changes)
npx playwright test --project=mobile   # single viewport
```

`stabilise()` helper: waits for `networkidle`, injects animation-disabling CSS, waits 300ms.

**After any intentional visual change:** run `npm run test:update` to regenerate snapshots, then commit them with the code change.

---

## Assets (`public/assets/`)

| File | Used in |
|------|---------|
| `icon_green.png` | Favicon |
| `icon_clear.png` | (legacy — not used on site) |
| `logo_w_text.png` | Nav |
| `bread.png` | Values cards (About) |
| `welcome_screen.png` | Hero phone mockup |
| `lesson_home_screen.png` | LessonsPreview phone mockup |
| `journal_photo.png` | Journal section |
| `ved_photo.png` | Founder section (About) |
| `dorian_photo.png` | Dorian section (About) |
| `mason_photo.png` | Mason section (About) |
| `omar_townhall_wide.png` | CongressionalWin background |
| `omar_townhall_presenting_award.png` | CongressionalWin + AwardStrip photo |

---

## Key decisions / rules

- **No eyebrow icons** — icon_clear.png was removed from all eyebrow labels (tacky)
- **No viewport-height units in Hero** — `100vh`/`100svh` caused sizing inconsistency between fullscreen and windowed browser. Hero uses fixed px padding only.
- **Scroll offset** — `scroll-padding-top: 84px` on `html` in globals.css keeps anchors clear of the fixed nav
- **No "Start unit" links** in LessonsPreview — units show a detail description instead
- **Partner form org field** is optional (not required)
- **Congressional Win caption** is neutral: "Presented at a congressional district townhall, Minneapolis" — do not name the presenter
