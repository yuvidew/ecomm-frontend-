# Phase 10 — Promo Banner Redesign (countdown + light panel)

## Context

Phase 9 added the two Appwrite lifestyle photos to the right side of the promo banner but kept
the section's original `bg-primary` (emerald) panel and left the countdown timer out of scope,
matching phase-7's original call. The user has now shared the same "Spring Sale" reference image
again and asked to "remap this section UI" to match it more closely — not just the images, but the
whole visual structure: a light/cream panel, a "LIMITED TIME OFFER"-style pill, a CTA button with
a trailing arrow, and a circular live countdown ("Hurry Up! Offer ends in DD:HH:MM:SS") sitting
between the copy and the two photos.

Clarified with the user:
- **Panel color**: switch this section to a light/neutral panel (using theme tokens, not the
  reference's literal hex values) rather than keeping the brand-green `bg-primary` panel. This is
  an intentional one-section departure from the site's dark-themed nav/footer.
- **Countdown**: there's no backend field for a real sale end-date, so it's decorative — a fixed
  duration (2 days 14 hrs 36 min 45 sec, matching the reference's numbers) that starts counting
  down from the moment the page loads and resets on every reload/revisit. No persistence needed.

## What this phase consumes from the backend

Nothing — same as phase-7/9. Purely presentational, client-only countdown, no new endpoints/types.

## New hook — `src/hooks/use-countdown.ts`

A generic, reusable countdown hook (global `src/hooks/`, not feature-scoped, since it has no
server/feature dependency — matches the "global reusable hooks" bucket in this repo's folder
structure convention).

Implementation: on mount, compute `endAt = Date.now() + durationMs`; a `setInterval(1000)` derives
remaining ms as `Math.max(0, endAt - Date.now())` (drift-resistant vs. naive decrementing);
`clearInterval` on unmount. Returns `{ days, hours, minutes, seconds }`, clamped at 0.

## New component — `src/features/home/_components/promo-banner.tsx`

Extracts the promo section out of `home-page.tsx` into its own feature component (it's now
non-trivial: pill + heading + subcopy + button + countdown widget + two images), matching the
existing pattern of other `home/_components` (`feature-item.tsx`, `product-tile.tsx`). Moves
`PROMO_IMAGE_URLS` (from phase-9, unchanged URLs) and a new `SALE_COUNTDOWN_MS` constant into this
file, since both are now purely internal to this component with no reason to live in the page.

Structure (`flex flex-col sm:flex-row` outer panel, `overflow-hidden rounded-2xl bg-muted`):

1. **Left — copy block** (`flex-1`): a small uppercase pill (`bg-background text-muted-foreground
   rounded-full px-3 py-1 text-xs tracking-wide`) reading "Limited Time Offer" in place of the
   current `Badge`, heading + subcopy unchanged from phase-7/9 copy (`text-foreground` /
   `text-muted-foreground` now that the panel is light, not `text-primary-foreground`), and the
   CTA restyled as a solid `Button`-variant pill with a trailing `ArrowRightIcon` (confirmed
   exported from the installed `lucide-react@1.47`) instead of plain text.
2. **Middle — countdown circle**: a fixed-size (`size-40`) `rounded-full bg-background shadow-sm`
   circle, centered content: "Hurry Up!" / "Offer ends in" in small muted text, then the four
   `useCountdown(SALE_COUNTDOWN_MS)` values rendered `DD : HH : MM : SS` (zero-padded via
   `padStart`) in `font-heading`, with "Days / Hrs / Mins / Secs" micro-labels beneath. Font sizes
   are kept small (`text-[10px]`–`text-lg`) so the four numbers fit inside a true circle — this is
   a close approximation of the reference's circle, not a pixel clone.
3. **Right — image pair**: unchanged from phase-9 — `PROMO_IMAGE_URLS.map()` → two `object-cover`
   `<img>` tags filling a fixed-width column, flush to the panel's right edge.

On mobile (`< sm`): stacks copy block → countdown circle → image row, each full width, matching
the same collapse behavior phase-9 already established for the images.

Component gets the required CLAUDE.md `@param`-style doc comment (no props, so just a one-line
description of what it renders).

## Change — `src/pages/home-page.tsx`

Replace the inline promo `<section>...</section>` block with `<PromoBanner />` (imported from
`@/features/home/_components/promo-banner`). Remove the now-unused `PROMO_IMAGE_URLS` constant
from this file (it moves into the new component). `Badge` and `buttonVariants` imports stay —
both are still used by the hero section above.

## Files touched

**New:** `src/hooks/use-countdown.ts`, `src/features/home/_components/promo-banner.tsx`

**Modified:** `src/pages/home-page.tsx` (promo section replaced with `<PromoBanner />`, dead
`PROMO_IMAGE_URLS` constant removed)

**Not touched:** header, footer, hero, category grid, trending products, trust stats — everything
outside the promo banner.

## Out of scope for this phase

- Wiring the countdown to any real/persisted end-date (still fully decorative, resets on reload).
- Making the images or countdown clickable/interactive beyond the existing "Shop the Sale" link.
- Changing copy text (headline/subcopy) — only the visual structure/styling changes, not wording.
- Light/dark mode token additions — reusing existing `bg-muted`/`bg-background`/`text-foreground`
  tokens rather than introducing new "cream" colors, so both themes stay coherent.

## Verification

- `npm run dev`, visit `/` — confirm the promo banner now shows: light panel, pill, heading,
  subcopy, arrow button on the left; a circular ticking countdown in the middle; the two photos
  flush right. Watch the countdown for a few seconds to confirm it's actually decrementing.
- Reload the page — countdown restarts from the fixed duration (no persistence, as decided).
- Resize to mobile width — confirm the three blocks (copy / countdown / images) stack vertically
  and remain readable.
- Toggle light/dark mode — confirm `bg-muted`/`bg-background`/`text-foreground` tokens keep
  sufficient contrast in both themes (no hardcoded colors left over from the old `bg-primary`
  version).
- `npx tsc --noEmit -p tsconfig.app.json` and `npm run lint` — confirm no type/lint errors from the
  new hook, component, and the icon import.
