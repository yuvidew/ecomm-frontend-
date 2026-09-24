# Phase 7 — Storefront Home Page, Header & Footer Redesign

> On approval, save as `.claude/plan/phase-7-storefront-home-redesign.md` per this repo's workflow.

## Context

The current `HomePage` (`src/pages/home-page.tsx`) is a minimal placeholder built in an earlier
phase: a hero headline + 3-line value-props list, deliberately built with no live data. The user
shared a reference screenshot (a "Minimog"-style Shopify storefront home page) and wants the real
home page — the one signed-in users land on after login, and what any visitor sees at `/` — to
look like a real e-commerce landing page: announcement bar, rich header nav, hero, category grid,
promo banner, trending products grid, trust badges, and a full footer.

The backend's `products` and `categories` tables are currently **empty**, and the user explicitly
asked to build the UI first with **dummy/static data**, deferring real API wiring (`useProducts`,
`useCategories`) to a later phase once there's real data to show. This keeps the phase scoped to
visual/structural work only — no new TanStack Query hooks, no new routes, no backend reads beyond
what's already established (session).

`NavBar` and `Footer` already exist as the global header/footer (wired into `RootLayout`, used by
every public route) — this phase redesigns those two files in place rather than creating new ones.

## What this phase consumes from the backend

Nothing new. No new endpoints are called. The hero's session-aware CTA area continues to use the
existing `useSession()` hook (`src/features/auth/hooks/use-session.ts`) exactly as today. All
product/category content on the page is hardcoded dummy data, explicitly typed as page-local
`DummyProduct`/`DummyCategory` shapes — **not** the real `Product`/`Category` types from
`src/features/products/types/products.ts` / `src/features/categories/types/categories.ts` — so
nothing here accidentally gets treated as a real API contract.

## Design tokens to reuse (already live, no changes)

- Fonts: `font-heading` (Zilla Slab) for headings, `font-sans` (Public Sans) for body — already
  imported in `src/index.css` and used throughout the app.
- Color: emerald `--primary` token + full shadcn palette (`--background`, `--card`, `--secondary`,
  `--muted`, `--accent`, `--destructive`, `--border`, `--chart-1..5`), dark mode via `.dark` class.
- Radii scale (`--radius-*`) already defined; use existing `rounded-*` utilities.

## 1. Header — `src/components/nav-bar.tsx` (redesign in place)

- **Announcement strip** (new, inline in this file — not a separate component; it's one static
  text line with no props/logic, so a new file would be a speculative abstraction): full-bleed
  `bg-primary text-primary-foreground py-2 text-center text-xs font-medium sm:text-sm` bar above
  the existing header row, static dummy copy (e.g. "Free shipping on orders over ₹999 · Free
  returns within 30 days").
- **Main row** (restructure the existing `mx-auto flex h-16 w-full max-w-6xl ...` row into three
  zones):
  - Left: unchanged brand mark (`StoreIcon` + "Index").
  - Center (new, `hidden items-center gap-6 md:flex`):
    - "Home" → `Link to="/"`.
    - "Shop" → plain `<a href="#trending-products">` (same-page anchor scroll, not a `Link`).
    - "Categories" → `DropdownMenu` (reuse the pattern already in `src/components/nav-user.tsx`:
      `DropdownMenuTrigger asChild` + `DropdownMenuContent`), trigger styled like the other nav
      links with a trailing `ChevronDownIcon`. Each `DropdownMenuItem` wraps an
      `<a href="#shop-by-category">` labeled with a dummy category name — all items point to the
      same grid anchor since there's no per-category filtering yet; the label is just the visible
      hint of what's below.
  - Right: **unchanged** — existing session-aware block (admin link / email + logout, or sign-in +
    create-account) and `ModeToggle`. Do not modify this JSX.
- Mobile: center nav stays `hidden md:flex`. No hamburger/`Sheet` mobile menu this phase (explicit
  scope cut — see Out of Scope). Small-screen users reach sections by scrolling normally.
- The dummy category name list used here is a short duplicate of the one in `home-page.tsx` (see
  §6) — acceptable for throwaway dummy content; a future API-integration phase should replace both
  with one shared `useCategories()` call.

## 2. Footer — `src/components/footer.tsx` (redesign in place)

Keep `<footer className="mt-auto"><Separator />...`, replace the single row with:

- **Columns row** (`grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-5`):
  1. Brand column (`lg:col-span-2`): `StoreIcon` + "Index", existing one-line blurb, and a plain
     **text** link row for socials — "Instagram", "X", "Facebook", "YouTube" as `<a href="#">`.
     (Note: this lucide-react version, 1.47, ships no brand/logo icons — `Instagram`, `Facebook`,
     `Twitter`, `Youtube` are all absent — so socials are text links, not icon buttons. Don't
     substitute unrelated generic icons for brand marks.)
  2. "Shop" column: dummy `<a href="#">` links — New Arrivals, Best Sellers, Sale, Trending.
  3. "Customer Service" column: Contact Us, FAQs, Shipping & Returns, Track Order.
  4. "Company" column: About Us, Careers, Privacy Policy, Terms of Service.
  - List items: `text-sm text-muted-foreground transition-colors hover:text-foreground`.
- **Newsletter strip**: `<Separator />` then a flex row with heading/subcopy + a non-functional
  `<form onSubmit={(e) => e.preventDefault()}>` wrapping `Input type="email"` + `Button`. No
  `useState`, no mutation — nothing to submit to yet.
- **Bottom bar**: `<Separator />` then existing copyright text + the existing "Admin sign in"
  `Link to="/sign-in"`, relocated here.

## 3. Home page — `src/pages/home-page.tsx` (full rewrite)

Keep `id="main-content"` on the root `<main>` (required by `RootLayout`'s skip link) and keep
`useSession()` wired exactly as today for the hero CTA logic. Sections, top to bottom:

1. **Hero** — two-column on `lg:`: left = badge ("New Collection") + headline (keep
   `font-heading text-5xl font-semibold tracking-tight lg:text-6xl` sizing, refresh copy to a
   retail tone) + subcopy + CTA row. CTA row keeps today's exact session-aware logic (admin →
   "Go to admin dashboard"; signed-in non-admin → "Signed in as {email}"; signed-out → "Create
   account" + "Sign in") and adds one static "Shop Now" anchor-link button
   (`href="#trending-products"`) so there's always a path into the page. Right column
   (`hidden lg:flex`) is a **decorative CSS-only** panel (no image) — a `rounded-3xl` gradient/tint
   block with 2–3 overlapping accent cards — per the user's decision to drop `hero.png` and not use
   any placeholder photo.
2. **Feature-icons row** — `bg-muted/30 border-y` strip, 4-up grid: Free Shipping (`TruckIcon`),
   Easy Returns (`RotateCcwIcon`), Secure Payment (`ShieldCheckIcon`), 24/7 Support
   (`HeadsetIcon`) — all confirmed present in the installed lucide-react version.
3. **"Shop by Category"** (`id="shop-by-category"`) — heading + `grid grid-cols-2 gap-4
   sm:grid-cols-3 lg:grid-cols-6` of 6 dummy categories. Each tile is a **plain non-clickable
   `<div>`** built from `Card`: a lucide icon centered on a flat color swatch (`bg-chart-1/15
   text-chart-1`-style, cycling through `--chart-1..5`) instead of a placeholder photo, + name
   below. Suggested set (all icons confirmed present): Electronics (`SmartphoneIcon`), Fashion
   (`ShirtIcon`), Home & Living (`SofaIcon`), Beauty (`SparklesIcon`), Sports (`DumbbellIcon`),
   Books (`BookOpenIcon`).
4. **Promo banner** — one static `rounded-2xl bg-primary text-primary-foreground` panel: badge
   ("Limited Time") + heading ("Up to 40% off selected items") + subcopy + a "Shop the Sale"
   button anchor-linking to `#trending-products`. No countdown timer, no real discount math —
   purely decorative copy.
5. **"Trending Products"** (`id="trending-products"`) — heading + grid using the same class
   pattern as `product-grid.tsx`'s `GRID_CLASSES` (`grid grid-cols-1 gap-4 sm:grid-cols-2
   lg:grid-cols-3 xl:grid-cols-4`) defined as a local constant here (don't import the admin file's
   internal constant — it isn't exported and is coupled to admin pagination). 8 dummy products,
   each a **plain non-clickable `<div>`**: `Card` with an icon-on-muted-tile image area
   (`PackageIcon` on `bg-muted`, `AspectRatio ratio={16/10}`, consistent with the category tiles'
   "no fake photos" treatment), optional corner `Badge` ("Sale"/"New"), name, a star-rating row
   (`StarIcon`, filled vs muted by rounded dummy rating) + review count, and price via
   `formatPrice()` from `src/lib/format.ts` (plus a strikethrough original price for at least one
   "Sale" item). No "View details" affordance — cards are plainly non-interactive.
6. **Trust badges row** — 4-up stat strip, distinct copy from the feature-icons row (social proof,
   not policies): "4.8★ Average Rating", "50k+ Happy Customers", "100% Secure Checkout", "24/7
   Customer Support".
7. **Remove** the existing `VALUE_PROPS` `<dl>` section — superseded by items 2 and 6 above; kept
   it as a fourth "features" section would be redundant and stylistically inconsistent.
8. No newsletter block on the page body — that lives in the redesigned footer only.

### Dummy data shape (page-local, in `home-page.tsx`)

```ts
type DummyProduct = {
  id: number
  name: string
  price: number
  originalPrice?: number
  rating: number // 0–5, may be fractional
  reviews: number
  badge?: "Sale" | "New"
}

type DummyCategory = {
  id: number
  name: string
  icon: LucideIcon
  swatchClassName: string // e.g. "bg-chart-1/15 text-chart-1"
}
```

- `DUMMY_TRENDING_PRODUCTS`: 8 entries, mixed badges, at least one with `originalPrice`.
- `DUMMY_CATEGORIES`: 6 entries per item 3 above.
- Feature-icons and trust-badges content: simple inline arrays, no exported types needed.
- One short comment above each constant noting it's placeholder data for this UI-first phase,
  to be replaced by real `useProducts()`/`useCategories()` data later.

If `home-page.tsx` gets unwieldy, split purely-presentational pieces (`CategoryTile`,
`ProductTile`, `FeatureItem`) into local top-level `const` components **within the same file**
(no new `_components/` folder — that convention is feature-scoped, and a page isn't a feature).
Every such component still needs the CLAUDE.md-required `@param` doc comment above it, arrow
function, even if trivial.

## 4. Asset cleanup

Delete `src/assets/hero.png` — confirmed unreferenced anywhere in `src/` (grep found no imports).

## 5. Files touched

**Modified:** `src/pages/home-page.tsx`, `src/components/nav-bar.tsx`, `src/components/footer.tsx`

**Deleted:** `src/assets/hero.png`

**Not touched:** `src/app/root-layout.tsx`, `src/app/router.tsx`, everything under `src/features/`
(including `product-card.tsx`/`product-grid.tsx` — only their grid class *pattern* is mirrored, not
imported), `src/components/mode-toggle.tsx`. No new routes, no new query hooks/keys, no new `api/`
functions.

## Out of scope for this phase

- Real API integration for products/categories on the home page (`useProducts`/`useCategories`).
- Public product-detail or category-listing routes — cards stay non-clickable.
- Cart icon/state, "Add to cart", search bar, wishlist.
- Newsletter backend — footer form is inert (`preventDefault`, no request).
- Mobile hamburger/`Sheet` navigation for the new header links.
- Countdown timers or real discount computation in the promo banner.
- A shared categories data module unifying header/home-page dummy lists (accepted short-lived
  duplication until real data lands).

## Verification

- `npm run dev`, visit `/` logged out and logged in (both roles) — confirm hero CTA area matches
  each session state exactly as it does today, and all anchor links (`Shop`, `Categories` dropdown
  items, "Shop Now", "Shop the Sale") scroll to the correct section.
- Toggle light/dark mode — confirm new sections use theme tokens correctly (no hardcoded colors
  outside the swatch/badge treatments, which should use `--chart-*`/`--primary` tokens).
- Resize to mobile width — confirm grids reflow (`grid-cols-2` etc.) and header center-nav hides
  below `md` without layout breakage.
- `npm run lint` / `npm run build` (or `tsc -b`) to confirm no type errors from the new dummy types
  and removed `VALUE_PROPS` section.
