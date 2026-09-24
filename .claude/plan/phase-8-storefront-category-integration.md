# Phase 8 — Storefront Category Integration

## Context

The backend's category API (`/api/categories`) is now complete and seeded with real
categories. The admin side (`AdminCategoriesPage` → `CategoriesTable` → `useCategories()`)
already consumes it correctly. The public storefront, however, was deliberately built with
**dummy category data** in phase 7 (`phase-7-storefront-home-redesign.md`), which explicitly
deferred "real API integration for products/categories on the home page" to a later phase —
this is that phase, scoped to categories only (products stay dummy for now).

Today two places duplicate a hardcoded 6-item category list:
- `src/pages/home-page.tsx` → `DUMMY_CATEGORIES` (icon + swatch color per category) → rendered
  by `src/features/home/_components/category-tile.tsx`
- `src/components/nav-bar.tsx` → `NAV_CATEGORIES` (plain name strings) → rendered in the
  "Categories" dropdown

Both will be replaced by the real `useCategories()` hook (already implemented and working —
`src/features/categories/hooks/use-categories.ts`, wraps `GET /api/categories`).

**Confirmed with user:**
- Tiles render the backend's real `image` URL (not icon+swatch).
- No new route — tiles and the nav dropdown stay anchor-only, scrolling to
  `#shop-by-category` on the home page, same as today.
- The nav bar dropdown is also wired to the same shared `useCategories()` data (not just the
  home page), removing the duplicated dummy list phase 7 flagged for a future cleanup.

**API contract** (verified by reading the backend directly — `category.routes.ts`,
`category.controller.ts`, `category.service.ts`):
- `GET /api/categories` — public, no auth, no query params, returns `200 { categories: Category[] }`
  sorted by name ascending. Each row: `{ id: number, name: string, slug: string, image: string, created_at: string }`.
- This matches what `listCategories()` in `src/features/categories/api/categories.ts` already
  calls and unwraps — no API-layer changes needed, only the `Category` type is missing `image`.

**Known issue found while reading the backend (flagging, not fixing this phase):**
`POST /api/categories` now requires `{ name, image }` (`image` must be a valid URL), but
`create-category-dialog.tsx` / `useCreateCategory` only send `{ name }`. Creating a category
from the admin UI will currently fail against the real backend. Out of scope for this listing
phase — worth a follow-up phase to add an image field to the create form.

## Changes

**1. `src/features/categories/types/categories.ts`**
Add the missing `image` field so the type matches the real backend row:
```ts
export type Category = {
  id: number
  name: string
  slug: string
  image: string
  created_at: string
}
```
Also widen `CreateCategoryResponse` to `Pick<Category, 'id' | 'name' | 'slug' | 'image'>` for
accuracy (backend's create response does include `image`), even though the create dialog
doesn't use it yet.

**2. `src/features/categories/_components/category-tile.tsx`** (new)
Single category tile, real `Category` data, non-clickable — same visual pattern as
`ProductCard`'s cover image (`src/features/products/_components/product-card.tsx`): `Card` +
`AspectRatio` (square) + `img` with `object-cover`, falling back to a centered `ImageIcon` when
there's no image, name below. Reuses `@/components/ui/card`, `@/components/ui/aspect-ratio`.

**3. `src/features/categories/_components/category-grid.tsx`** (new)
Owns the `useCategories()` call and renders the same responsive grid classes currently inline
in `home-page.tsx` (`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6`). Follows the same
loading/error/empty convention as `ProductGrid`
(`src/features/products/_components/product-grid.tsx`):
- loading → `Skeleton` tiles in the same grid
- error → `QueryErrorAlert` with `getApiErrorMessage(error, 'Could not load categories')`
- empty (`!data?.length`) → simple empty state (reuse `Empty`/`EmptyHeader`/`EmptyTitle` from
  `@/components/ui/empty`, or omit the section — keep it minimal since this is a storefront
  page, not admin)
- success → grid of `CategoryTile`
- accepts an optional `limit` prop to cap how many categories render (used by the home page
  teaser below; slices client-side since the list endpoint has no pagination)

**4. `src/pages/home-page.tsx`**
- Pass `<CategoryGrid limit={6} />` so the home page only teases the first 6 categories, plus
  a "View all categories" text link next to the section heading. Per user request, this link
  is a placeholder — not wired to a real route (none exists yet), just present in the UI.
- Remove `DUMMY_CATEGORIES` array and the now-unused category icon imports
  (`SmartphoneIcon`, `ShirtIcon`, `SofaIcon`, `SparklesIcon`, `DumbbellIcon`, `BookOpenIcon` —
  confirmed unused elsewhere in this file; `FEATURES` uses a different icon set).
- Remove `CategoryTile` import and the `DummyCategory` import from `home/types/home`.
- In the `#shop-by-category` section, replace the manual `<div className="grid...">
  {DUMMY_CATEGORIES.map(...)}</div>` with `<CategoryGrid />` imported from
  `@/features/categories/_components/category-grid`.

**5. Remove dead scaffolding**
- Delete `src/features/home/_components/category-tile.tsx` (superseded by
  `features/categories/_components/category-tile.tsx`).
- Remove the `DummyCategory` type from `src/features/home/types/home.ts` (no longer used by
  anything once home-page.tsx stops importing it).

**6. `src/components/nav-bar.tsx`**
- Remove the hardcoded `NAV_CATEGORIES` string array.
- Call `useCategories()` (`@/features/categories/hooks/use-categories`) inside `NavBar`.
- Render `DropdownMenuItem`s from `categories` (`<a href="#shop-by-category">{category.name}</a>`,
  same as today), keyed by `category.id`.
- Handle the query states minimally, matching the size of this UI element (a dropdown, not a
  page): while `isLoading`, show a single disabled `DropdownMenuItem` ("Loading…"); on
  `isError` or an empty list, show nothing extra (dropdown trigger still renders, just no
  items) — no need for a full `QueryErrorAlert` in a nav dropdown.

## Out of scope
- Fixing `create-category-dialog.tsx` to send `image` (flagged above as a follow-up).
- Any new public category route/page (`/categories`, `/categories/:slug`) — tiles and nav
  items stay anchor-only per user's decision.
- Wiring real product data on the home page — still dummy, untouched by this phase.
- Category edit/delete UI changes — admin side is already fully wired and untouched.

## Verification
- `npm run dev`, visit `/` — confirm the "Shop by Category" grid renders real categories from
  the backend (names + images), with a loading skeleton on first load and no dummy data left.
- Open the nav bar "Categories" dropdown — confirm it lists the same real category names and
  each item still scrolls to `#shop-by-category`.
- Temporarily stop the backend (or block `/api/categories` in devtools) and reload `/` to
  confirm the error state renders via `QueryErrorAlert` instead of crashing.
- `npm run build` (or `tsc -p tsconfig.app.json --noEmit`) to confirm no leftover references to
  the removed `DummyCategory` type or the deleted `home/_components/category-tile.tsx`.
- Confirm `/admin/categories` (existing admin table) still works unaffected.
