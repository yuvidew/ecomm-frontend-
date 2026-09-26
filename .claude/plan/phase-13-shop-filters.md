# Phase 13 — Shop page redesign: banner + category/price filters + search

## Context

The user supplied a Figma design ("Product List Page (side bar)",
`node-id=402-5658`, file `rsmokiAJJv9QzPoWAruSNr`) and asked to fully replace
the current `/shop` page (`src/pages/shop-page.tsx`, currently just a heading
+ the plain paginated `ProductCatalog`) with a layout that matches the
design's structure: banner first, then a filter sidebar + product grid side
by side, plus a search box. Confirmed with the user:

- Filters are **category + price range only** this phase — no brand, ratings,
  or size controls, even though the Figma design has them.
- Reuse the **project's existing theme** (green `--primary`, Zilla
  Slab/Public Sans fonts, existing shadcn primitives) — not Figma's literal
  purple palette/typeface.
- Add a working search box (not present in the Figma design at all).

## API contract (read from the backend, no backend changes)

`GET /api/products?page=&limit=&categoryId=&search=` (public) — confirmed by
reading `backend/src/types/product.types.ts` (`productQuerySchema`),
`backend/src/repositories/product.repository.ts` (`findProduct`), and
`backend/src/routers/product.routes.ts`:

```ts
{ products: Product[]; pagination: { page, limit, total, totalPages } }
```

- `categoryId` — single number, filters `WHERE category_id = ?`. **Not an
  array** — the backend has no multi-category filter.
- `search` — `WHERE name LIKE '%search%'` (name only, not description).
- **No price filter of any kind exists in the backend** (`productQuerySchema`
  has no `minPrice`/`maxPrice`, and `findProduct`'s WHERE-clause builder never
  touches `price`).
- No sort param either (repository always orders `created_at DESC`) — the
  Figma "Popularity" sort dropdown is **out of scope**, matching phase-12's
  precedent.
- `GET /api/categories` (already integrated) returns `{ id, name, slug,
  image, created_at }` — **no per-category product count**, so the Figma
  design's `(18)`/`(12)` counts next to each category are not buildable from
  real data and are dropped.

**Two decisions made with the user's input, both because of backend gaps:**

1. **Price range — confirmed with the user:** since there's no server-side
   price filter, fetch one larger batch (`limit: 100`, the backend's max)
   with `categoryId`/`search` applied server-side, then filter by price and
   paginate entirely client-side. This works correctly for catalogs up to 100
   matching products; beyond that, items past the first 100 aren't
   considered. To keep the fetching logic single-path (no separate
   server-paginated vs. client-paginated branches), **the whole `/shop` page
   uses this batch-fetch + client-paginate strategy**, not just when a price
   filter is actively applied — this also gives us the price bounds to render
   the slider before the user has touched it.
2. **Category filter is single-select**, not multi-select, even though the
   Figma design shows checkboxes (which usually imply multi-select) — because
   `categoryId` only accepts one value server-side. Checking a category
   selects it exclusively; clicking the already-checked one clears back to
   "All categories". This is a UI/behavior call, flagged here for review
   before implementation.

## URL state (`/shop`)

Search params, all optional except `page`:
- `page` — current page of the *client-side-paginated* filtered result set
- `category` — selected category id (string form of a number)
- `search` — search text
- `minPrice`, `maxPrice` — only present once the user has moved the slider
  away from the full computed range

Changing `category`, `search`, or the price range resets `page` back to 1.

## New files

**`src/hooks/use-debounced-value.ts`** (global reusable hook — search input
needs debouncing and nothing in `src/hooks/` currently provides it)
```ts
export const useDebouncedValue = <T>(value: T, delayMs: number): T => { ... }
```

**`src/features/products/_components/shop-banner.tsx`**
`ShopBanner` — promo section for the top of `/shop`, structurally modeled on
`src/features/home/_components/promo-banner.tsx` (rounded-2xl card, copy +
CTA on the left, image on the right) but with shop-appropriate copy ("New
arrivals every week" / "Discover our full collection curated for your
style.") and a "Shop Now" CTA that's a same-page anchor down to the results
grid (`#shop-results`), reusing the project's theme tokens
(`bg-muted`/`text-primary`/`font-heading`) instead of Figma's palette. Reuses
an existing hosted image URL already used elsewhere in the codebase (one of
the `PROMO_IMAGE_URLS` from `promo-banner.tsx`, or `HERO_IMAGE_URL` from
`home-page.tsx`) rather than pulling a new asset from Figma, since the visual
target is "match the project's theme," not a pixel-for-pixel Figma port.

**`src/features/products/_components/product-search.tsx`**
`ProductSearch` — shadcn `Input` with a `SearchIcon` (from
`@/components/ui/input-group` or plain `Input` + absolutely-positioned icon,
matching whatever pattern `src/components/ui/input-group.tsx` already
provides). Local `text` state seeded from `?search=`, debounced via
`useDebouncedValue` (400 ms), pushes to `?search=` (and resets `?page=`) via
`useSearchParams`. Placeholder: "Search products...".

**`src/features/products/_components/product-filters.tsx`**
`ProductFilters` — the sidebar content, reused both in the always-visible
desktop `<aside>` and inside a mobile `Sheet`:
- **Category** section: heading + `useCategories()` list rendered as
  `Checkbox` + `Label` rows (visual only — see single-select note above),
  reading/writing `?category=`.
- **Price** section: heading + shadcn `Slider` (range, two thumbs) bound to
  `[minPrice ?? batchMin, maxPrice ?? batchMax]`, `onValueCommit` writes
  `?minPrice=&maxPrice=` (omitted entirely when equal to the full batch
  range). Two small number `Input`s below the slider mirror the current
  bounds (matches the Figma layout's `0` / `$200` boxes). Takes `batchMin` /
  `batchMax` / `isLoading` as props from `ProductCatalog` (it already has the
  fetched batch).
- "Clear All" — resets `category`, `search`, `minPrice`, `maxPrice`, `page`.
- Loading state: `Skeleton` rows while `useCategories()`/the product batch
  are loading.

**`src/pages/shop-page.tsx`** (rewritten in place, per the user's request to
replace its current UI — see Changed files)

## Changed files

**`src/features/products/_components/product-catalog.tsx`** (rewritten)
Becomes the single owner of `/shop`'s filtering + fetching + layout:
- Reads `page`, `category`, `search`, `minPrice`, `maxPrice` from
  `useSearchParams`.
- `useProducts({ page: 1, limit: 100, categoryId: category ? Number(category)
  : undefined, search: search || undefined })` — the batch fetch described
  above.
- Computes `batchMin`/`batchMax` from `data.products` (price is a string —
  `Number(p.price)`), filters the batch by the effective price range, then
  slices to `PAGE_SIZE = 12` using `page`.
- Renders: results-count text ("Showing X–Y of Z results"), a mobile-only
  "Filters" trigger button that opens `ProductFilters` in a `Sheet`, a
  desktop two-column layout (`<aside>` with `ProductFilters` +
  `<div>` grid of `ProductTile`), loading skeletons, `QueryErrorAlert` on
  error, the existing shadcn `Empty` state when the filtered result is empty,
  and `Pagination` (same click-intercept pattern already in the file) driven
  by the client-computed `totalPages`.
- `id="shop-results"` on the section root, as the banner's CTA anchor target.

**`src/features/products/types/products.ts`**
`ListProductsParams` gains `categoryId?: number` and `search?: string`.

**`src/lib/query-keys.ts`**
`productKeys.list`'s param type widens to
`{ page: number; limit: number; categoryId?: number; search?: string }` so
the query key changes correctly when filters change.

**`src/pages/shop-page.tsx`**
Thin shell: `<ShopBanner />` then `<ProductCatalog />` (which now owns its
own heading/filter/search chrome internally — no more standalone "Shop" `h1`
+ paragraph, since the banner now carries that framing).

## Out of scope

- Brand, ratings, and size filters (explicitly excluded by the user).
- The Figma "Popularity" sort dropdown (no backend sort support).
- Per-category product counts in the filter list (no backend support).
- Multi-category selection (backend only accepts one `categoryId`).
- Wishlist heart, star ratings/review counts, "Add to Cart"/"Add to
  Shortlist" buttons on product cards — no ratings or cart feature/backend
  exists yet; `ProductTile` stays as-is (image, name, price, non-clickable).
- Any change to the global `NavBar`'s existing (currently inert) search icon
  button — this phase's search box lives on the shop page itself.
- Filtering beyond the first 100 matching products (documented client-side
  price-filter limitation above).

## Verification

1. `npm run dev`, open `/shop` — banner renders first, then filters (desktop:
   left sidebar; mobile: "Filters" button opening a sheet) beside the product
   grid.
2. Checking a category narrows results to that category and unchecks any
   previously-checked one; clicking it again clears back to all categories.
   `?category=` updates accordingly.
3. Moving the price slider filters the currently-fetched batch and resets to
   page 1; `?minPrice=&maxPrice=` reflect the committed values.
4. Typing in the search box filters by name after the debounce delay,
   `?search=` updates, `?page=` resets to 1.
5. "Clear All" resets every filter param.
6. Pagination still works against the client-side-filtered/sliced set;
   "Showing X–Y of Z results" text matches what's rendered.
7. Confirm the home page's `TrendingProducts` (shares `ProductTile`,
   untouched) and the admin products dashboard (`ProductGrid`/`ProductCard`,
   untouched) still work.
8. `npm run build` / `tsc` with no leftover type errors from the widened
   `ListProductsParams`/`productKeys.list`.
