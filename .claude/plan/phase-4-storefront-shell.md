# Storefront shell — nav, footer, landing page, and the font system

## Context
The user asked to "remap this UI" into something better and more interactive, using the
`frontend-design` skill for visual direction and `web-design-guidelines` for an accessibility/UX
pass. Research (2 Explore agents + direct reads) found:
- The public-facing shell is essentially unbuilt: `RootLayout` renders a bare `<Outlet/>` despite
  its own comment claiming it wraps every route with a nav bar. `NavBar` exists but is imported
  nowhere. `/`, `/sign-in`, `/sign-up` have zero header/footer/branding today.
- `HomePage` is two lines of static text — no real landing content.
- The brand system (emerald primary, Zilla Slab heading font + Public Sans body, tight 0.45rem
  radius) is already deliberately chosen and partly wired (used in the admin sidebar since
  Phase 3), but the font `@import`/`@theme` lines in `index.css` are commented out, so
  `font-heading` currently renders as the browser default everywhere it's used.
- `src/assets/hero.png` is an unused, off-brand purple gradient isometric-box graphic (generic
  stock-illustration look) — dead scaffolding, not worth reviving into the redesign.
- Phase 3 (`phase-3-admin-ui-polish.md`) already redesigned the admin sidebar (solid emerald),
  removed the inset/floating-card look, bumped button sizes globally, and rebuilt `ProductCard`.
  This plan does **not** re-touch any of that.
- Confirmed with the user: the home page redesign stays a **marketing/landing page** (hero +
  brand content, no live product/category data fetching — avoids opening new public-API
  questions). Admin data-surface polish is deferred to `phase-5-admin-data-surfaces.md`.

## Design direction (frontend-design skill pass)
**Don't fight the existing brand — finish it.** Emerald + neutral + a slab-serif heading font is
already a specific, non-generic choice (not the cream/serif/terracotta or near-black/neon
defaults the skill warns about). The job is to *turn it on* everywhere and use it with more
intention, not replace it.

- **Color** — reuse existing tokens only, no new hex values: `--primary` (emerald) spent
  surgically on CTAs, the brand mark, hairline accents, and hover/focus states; background stays
  neutral (`--background`/`--foreground`); `--border`/`--muted` for structure.
- **Type** — `--font-heading` (Zilla Slab, weights 500/600/700) for the brand wordmark, the hero
  headline, and section headings only. `--font-sans` (Public Sans Variable) for everything else.
  No single-word color/italic accents in headlines.
- **Layout concept** — left-aligned "directory" hero (not centered), playing on the brand name
  "Index" and the existing tagline "Every category, in one place, easy to find.": big Zilla Slab
  headline + one supporting line + two CTAs. Below it, a short value-prop list laid out as
  divider-separated rows (reusing the label/description-row pattern already established in
  `product-details.tsx`'s spec list) — not icon-cards, not numbered steps.
- **One deliberate interactive moment**: a single on-load fade/slide-up for the hero block, plus a
  sticky header that adds a `border-b`/subtle backdrop blur once scrolled. Everything else reuses
  existing hover conventions rather than inventing new motion per component.
- Drop `hero.png` from the design — off-brand color, generic isometric-box style. Flag for
  deletion but leave the actual `rm` for the user to confirm.

## 1. Turn on the font system — `src/index.css`
Uncomment the two `@fontsource` `@import` lines and the `--font-heading`/`--font-sans` lines
inside `@theme inline`. No other token changes (colors/radius stay as-is).

## 2. Rebuild `NavBar` into the real site header — `src/components/nav-bar.tsx`
Keep the component name/contract (`session`-aware, no props), redesign it:
- Sticky (`sticky top-0 z-40`), `border-b`, subtle `bg-background/95 backdrop-blur`.
- Brand: `StoreIcon` + "Index" in `font-heading font-semibold`, matching the icon already used for
  the admin brand mark (`app-sidebar.tsx`) for cross-shell continuity.
- Right side: reuse the existing session branching —
  - Signed out: "Sign in" (ghost) + "Create account" (primary) buttons instead of the current bare
    underlined text links.
  - Signed in: email text + "Log out" button (kept), plus a link to `/admin` when
    `session.user.role === 'admin'`.
  - `<ModeToggle />` always visible here (today it's only reachable inside `/admin`).

## 3. New `Footer` component — `src/components/footer.tsx`
Global reusable component (goes in `src/components/`, not a feature folder): brand mark, the
existing tagline, a copyright line, `<Separator />` on top. Static content only, no data fetching.

## 4. Wire the shell into the route tree — `src/app/root-layout.tsx`
```
<NavBar />
<Outlet />
<Footer />
```
Replaces the bare `<><Outlet /></>` and fixes its own stale doc comment.

## 5. Redesign `HomePage` — `src/pages/home-page.tsx`
Static content only (no query hooks):
- Hero: left-aligned, `font-heading` headline, supporting paragraph (existing tagline), two CTAs
  (`Link` to `/sign-up` primary, `/sign-in` ghost) — swapped for a "Go to admin"/welcome state via
  `useSession` when a session exists.
- Value-prop section: 3 short rows (label + one-line description, divider between rows), static
  copy — no icons-in-cards, no live data.
- One CSS entrance transition on the hero block (`tw-animate-css`, already a dependency).

## 6. Auth page chrome — `src/pages/sign-in-page.tsx`, `sign-up-page.tsx`
Remove the stray leading blank line in both files. Layout itself stays centered/card-based (Phase
1's form work is out of scope) — the new global header/footer now frames these pages
automatically.

## 7. Dead auth-form links — `src/features/auth/_components/sign-in-form.tsx`, `sign-up-form.tsx`
Terms of Service / Privacy Policy text currently links to `href="#"`. Drop the `<a>` tags and keep
the sentence as plain disclaimer text.

## 8. Small cross-shell typography consistency — `src/components/app-sidebar.tsx`, `src/components/site-header.tsx`
Add `font-heading` to the admin brand mark ("Index Admin") and to `SiteHeader`'s `title`, so the
heading font reads consistently in both shells now that it's actually enabled. This is the one
admin-facing touch in this phase; deeper admin visual work stays in phase 5.

## Files touched
`src/index.css`, `src/components/nav-bar.tsx`, `src/components/footer.tsx` (new),
`src/app/root-layout.tsx`, `src/pages/home-page.tsx`, `src/pages/sign-in-page.tsx`,
`src/pages/sign-up-page.tsx`, `src/features/auth/_components/sign-in-form.tsx`,
`src/features/auth/_components/sign-up-form.tsx`, `src/components/app-sidebar.tsx`,
`src/components/site-header.tsx`.

## Out of scope
Live product/category data on the home page, a public product-browsing route, redesigning the
auth form itself (fields/validation/layout), deleting `hero.png` (flagged only), any admin visual
work beyond the one heading-font touch above.

## Accessibility/UX pass
After implementing, run the `web-design-guidelines` skill against the new/changed files
(`nav-bar.tsx`, `footer.tsx`, `home-page.tsx`, plus the touched auth/admin files) and resolve its
`file:line` findings before calling this phase done.

## Verification
1. `npm run build` (tsc + vite) and `npm run lint` pass.
2. `npm run dev`: visit `/`, `/sign-in`, `/sign-up` signed out and signed in — header/footer
   render, brand font renders, mode toggle works from the public shell, CTAs route correctly, hero
   entrance animation plays once, sticky header behaves on scroll, admin pages still render (only
   the heading font changed there).
3. Run the `web-design-guidelines` skill against the touched files and resolve its findings.
