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

**Bread Head** is a teen financial literacy platform (bread-head.org). This repo serves the **whole web presence under one domain** — code.org-style — combining the **marketing site** (`/`, `/about`, `/partners`, …) *and* the **full web app**: a teacher/student dashboard, the 95-lesson curriculum player, journals, and Budget Challenges. Next.js 14 App Router, TypeScript, Tailwind CSS, Firebase (Auth + Firestore), Resend. The native iOS app lives in a separate repo (`../breadhead`), which is the source of truth for the deployed Firestore security rules.

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

The table above is the **marketing** surface. The **app** surface (auth-gated) also lives in this repo: `/login`, the teacher dashboard + content authoring under `app/dashboard/**`, the student experience (`/dashboard`, `/lesson`, `/grades`, `/mybudget`), the challenge solver `app/challenge/[assignmentId]`, and the `app/api/**` routes backing them (assign, submit, roster, overview). Server writes go through the Firebase Admin SDK; client reads are gated by the Firestore rules in the iOS repo.

---

## Section order — Homepage (`app/page.tsx`)

Narrative order: this is real → it has already won → real organisations already
run it → here is the problem → here is the product → your organisation could be next.

1. `Hero3D` — bgSage (#E6EDD9), 200vh scroll-tied barrel loop
2. `Traction` — white (Congressional App Challenge win + program partners + facts)
3. `Problem` — **dark (#1A2E1A)**, mission strip → bgSage
4. `Ticker` — bgSage (thin band, continues the mission strip's sage)
5. `LessonsScroll` — **white** (the product tour: Learn / Journal / Budget / Progress)
6. `Partners` — dark (#1A2E1A) — the partnership value proposition
7. `JoinTeamStrip` — **bgSage** (TEMPORARY recruiting strip)
8. `FinalCTA` — dark (#1A2E1A)
9. `Footer`

**Background rhythm is a hard rule:** every neighbouring pair must differ, and two
large blocks of the same colour must never end up adjacent. Sage → white → dark →
sage → white → dark → sage → dark. Changing any section's background means
re-checking its neighbours. Two long white sections in a row read as one dead
block with no section boundary, and mission + ticker + a 4000px sage tour read as
one endless green field — both were shipped bugs, fixed Sept 2026.

**Removed in the Sept 2026 hierarchy pass** — do not re-add without a reason:
- `WhyItMatters` — its stat grid restated `Problem`; the three tightest sourced
  numbers now live inside `Problem`.
- `Pillars` (Learn / Simulate / Reflect) — restated the `LessonsScroll` tour.
- `Gamification` — restated the tour's "04 · Progress" block, and used XP / Level
  wording the app itself does not use (the app has Crumbs, Behavior Score, Sandwich).
- `AwardStrip` — replaced by `Traction`, which carries the award plus partners.
- `Hero`, `LessonsPreview`, `Journal`, `XPBar` — already superseded by `Hero3D`
  and `LessonsScroll`; deleted with the pass.

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

components/sections/     # Full-width page sections
  CongressionalWin.tsx   # Full editorial award section (About page)
  FinalCTA.tsx           # Email signup CTA (dark bg)
  Hero3D.tsx             # Homepage hero — scroll-tied 3D barrel loop
  JoinTeamStrip.tsx      # TEMPORARY recruiting strip (homepage)
  LessonsScroll.tsx      # Pinned four-screen product tour (the curriculum + app)
  Partners.tsx           # Partnership value proposition + CTA (dark bg)
  PilotPartner.tsx       # Program partner band — variant="compact" | "full"
  Problem.tsx            # The Gap: statement + three sourced numbers + mission
  Ticker.tsx             # Scrolling curriculum ticker
  Traction.tsx           # Award + program partners + at-a-glance facts (white bg)

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
| `accentGold` | `#D1A945` | Partnership (§6) eyebrow and Final CTA (§8) only |
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
- All emails send to: `ved@bread-head.org`
- `/api/contact` — partner form, subject prefixed by partner type
- `/api/subscribe` — early access signup

---

## Visual regression tests

**Config:** `playwright.config.ts` — excluded from Next.js tsconfig (`tsconfig.json` exclude list includes `playwright.config.ts` and `tests`).

**Projects:** mobile (375×812), tablet (768×1024), desktop (1440×900) — all Chromium.

**Tests:** `tests/sections.spec.ts` — 6 tests × 3 viewports = 18 snapshots.

**Known pre-existing failures** (not caused by any recent change): `Nav` at all three
viewports, `Team` at mobile + desktop, and `About full page` at all three. Playwright
captures these as blank/partial — a capture-timing issue with the client components,
present on a clean checkout. Do NOT blanket-run `npm run test:update` to "fix" them:
that bakes a blank nav into the baseline and permanently hides real nav regressions.
Regenerate only the snapshots you intentionally changed, by deleting those files and
re-running (`updateSnapshots: 'missing'` recreates them).
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
| `icon_clear.png` | 404 bouncing logo, Footer mark, Ticker separator (512x512 — 192px is its largest render) |
| `logo_w_text.webp` | Hero app-icon, login, lesson player, parent letter |
| `bread.png` | Values cards (About) |
| `welcome_screen.webp` | Hero phone mockup |
| `lesson_home_screen.webp` | LessonsScroll + /lessons phone mockup |
| `app_journal.webp`, `app_budget.webp`, `app_progress.webp` | LessonsScroll barrel faces |
| `og_card.png` | 1200x630 social preview card (OG + Twitter) |
| `journal_photo.png` | (unreferenced — no code points at it) |
| `ved_photo.png` | Founder section (About) |
| `dorian_photo.png` | Dorian section (About) |
| `mason_photo.png` | Mason section (About) |
| `omar_townhall_wide.png` | CongressionalWin background |
| `omar_townhall_presenting_award.png` | CongressionalWin + AwardStrip photo |
| `breakthroughmlps_logo.png` | PilotPartner band (homepage Partners + /partners) |

---

## Key decisions / rules

- **No eyebrow icons** — icon_clear.png was removed from all eyebrow labels (tacky)
- **No viewport-height units in Hero** — `100vh`/`100svh` caused sizing inconsistency between fullscreen and windowed browser. Hero uses fixed px padding only.
- **Scroll offset** — `scroll-padding-top: 84px` on `html` in globals.css keeps anchors clear of the fixed nav
- **No "Start unit" links** in LessonsPreview — units show a detail description instead
- **Partner form org field** is optional (not required)
- **Congressional Win caption** is neutral: "Presented at a congressional district townhall, Minneapolis" — do not name the presenter
