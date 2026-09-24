# Phase 9 — Promo Banner Right-Side Images

## Context

Phase 7 (`storefront-home-redesign`) built the home page's "Promo banner" section as a single
static `bg-primary` panel: badge + heading + subcopy + "Shop the Sale" button, with countdown
timers explicitly marked out of scope. The user shared a reference screenshot (a "Spring Sale"
banner with a lifestyle photo pair — folded apparel/sneakers on a stool, and a person in a jacket —
filling the right side of the panel) and asked for two of their own product photos, hosted on
Appwrite storage, to be placed there the same way: side by side, flush to the right edge of the
banner.

The countdown timer visible in the reference image is explicitly **out of scope** for this
phase (confirmed with the user) — phase-7 already made that call for the same section and nothing
here changes it. This phase is scoped to the image layout only.

This documents and formalizes a change already applied directly to `src/pages/home-page.tsx` in
this session (done before this plan was requested) — the plan below matches what's currently live
in the file.

## What this phase consumes from the backend

Nothing. No new endpoints, no new types. The two image URLs are static Appwrite-hosted assets,
following the exact same pattern as the existing `HERO_IMAGE_URL` constant in the same file (a
top-level `const`, no `types/home.ts` entry needed since it's just `string[]`).

## Change — `src/pages/home-page.tsx`

1. Add `PROMO_IMAGE_URLS: string[]` (two Appwrite view URLs) as a top-level constant, right after
   `HERO_IMAGE_URL`, with a one-line comment matching that constant's style.
2. Restructure the promo banner `<section>` (previously a single flex row with
   `justify-between`) into:
   - Outer `<div>`: `flex flex-col overflow-hidden rounded-2xl bg-primary text-primary-foreground
     sm:flex-row sm:items-center` — `overflow-hidden` clips the images to the panel's rounded
     corners.
   - Left `<div>` (flex-1): unchanged badge/heading/subcopy/button content from phase-7, just
     re-wrapped so it can sit beside the image block instead of spanning full width.
   - Right `<div>`: `flex h-48 w-full shrink-0 sm:h-auto sm:w-80 sm:self-stretch` containing
     `PROMO_IMAGE_URLS.map(...)` → two `<img>` tags, each `h-full w-1/2 object-cover`, `alt=""
     aria-hidden="true"` (decorative, same treatment as `HERO_IMAGE_URL`'s hero photo — no
     meaningful alt text since the surrounding copy already conveys the sale message). On mobile
     the image row stacks below the text at a fixed `h-48`; from `sm:` up it sits to the right at a
     fixed `w-80` and stretches to the panel's full height.

No new component file — this is a two-image `.map()` inline in the existing section, consistent
with how `HERO_IMAGE_URL` is used directly in JSX rather than through a wrapper component.

## Files touched

**Modified:** `src/pages/home-page.tsx` only.

**Not touched:** everything else from phase-7 (header, footer, hero, category grid, trending
products, trust stats) — this phase only touches the promo banner section.

## Out of scope for this phase

- Countdown timer / offer-expiry logic (per user decision above — matches phase-7's original scope
  cut).
- Making the images clickable or linking them to specific products/categories.
- Replacing the hardcoded URLs with a CMS-driven or backend-driven image list.

## Verification

- `npm run dev`, visit `/` — confirm the promo banner shows text + button on the left and the two
  product photos side by side, flush right, with rounded corners on the panel's outer edges only.
- Resize to mobile width — confirm the image pair moves below the text and stays full-width at
  `h-48`, then reflows back to the fixed-width right column at `sm:` and above.
- Toggle light/dark mode — confirm no layout shift (images are theme-independent).
- `npx tsc --noEmit -p tsconfig.app.json` — already run clean in this session after the edit.
