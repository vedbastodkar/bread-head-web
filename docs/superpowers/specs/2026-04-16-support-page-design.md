# Support Page Design

**Date:** 2026-04-16
**Status:** Approved

---

## Overview

Add a `/support` page to the Bread Head marketing site — a simple contact form for general inquiries, bug reports, feedback, and media. The page also prominently displays the direct email address `breadhead.org@gmail.com` for users who prefer email over forms.

---

## Route & Files

| Item | Path |
|------|------|
| Page | `app/support/page.tsx` |
| Form component | `app/support/SupportForm.tsx` |
| API route | `app/api/support/route.ts` |
| Footer (updated) | `app/components/Footer.tsx` |

---

## Page Layout (`/support`)

### Hero section — bgSage (`#E6EDD9`)
- Eyebrow: "Get Help" (green bar + uppercase label, matches partners page)
- H1: *"We're here to help."* (Playfair Display italic)
- Subtext: "Fill out the form below or email us directly — we respond to every message."
- Direct email shown as a clickable mailto link: `breadhead.org@gmail.com` styled as an inline text link in brandGreen

### Form section — bgSage, centered white card
- Max-width 680px, centered
- White card (`#FFFFFF`) with border-radius 16px, padding 40px — matches `PartnerForm` card style
- Fields (top to bottom):
  1. **Name** — single text input (not split first/last), required
  2. **Email** — email input, required
  3. **Subject** — dropdown (required), options:
     - General Question
     - Want to Reach Out
     - Feedback
     - Report App Bug
     - Media / Press
     - Other
  4. **Message** — textarea, 5 rows, optional placeholder "How can we help?"
- Submit button: full-width, brandGreen pill, "Send message →"
- Success state: inline confirmation message "✓ Message sent. We'll get back to you soon." (no page reload)
- Loading state: button opacity 0.6, text "Sending…"

### Footer
- No reassurance strip needed (page is simple enough)
- Standard `<Footer />` component

---

## Form Component (`SupportForm.tsx`)

Client component (`'use client'`). Mirrors `PartnerForm.tsx` patterns exactly:
- `useState` for `submitted` and `loading`
- `onFocus`/`onBlur` handlers for green border highlight
- POSTs JSON to `/api/support`
- Shared `inputStyle`, `labelStyle` inline style objects
- Custom chevron on the select dropdown

---

## API Route (`/api/support`)

New route at `app/api/support/route.ts`. Does NOT reuse `/api/contact` — that route is partner-specific with partner-type logic.

**Fields received:** `name`, `email`, `subject`, `message`

**Subject line:** `[{subject}] — {name}`

Example: `[Report App Bug] — Jordan Smith`

**Recipients:** `['breadhead.org@gmail.com']`

**Reply-to:** sender's email

**Email template:** matches existing contact email HTML style — dark green header (`#1A2E1A`), white body, detail rows table (name, email, subject), message block, "Reply to {name} →" CTA button.

**Error handling:** catches Resend errors, returns `{ ok: false }` with 500. Client always shows success (same pattern as `PartnerForm`).

**Resend client:** initialized inside the POST handler (not at module level — per existing convention to avoid build errors when key is undefined).

---

## Footer Update

Add "Support" link in the right-side cluster, alongside "Privacy Notice":

```
[Instagram icon]   Support   Privacy Notice
```

Uses same `footer-legal-link` CSS class as Privacy Notice.

---

## What's Not Included

- No nav change — support is not a primary destination
- No Playwright snapshot update needed at design time (will be needed after implementation)
- No org / reach fields — this is general support, not partner inquiry
- No "reassurance strip" section (used on partners page only)
