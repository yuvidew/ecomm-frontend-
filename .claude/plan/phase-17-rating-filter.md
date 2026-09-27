# Phase 17 — Rating filter on the shop page

## Context

The user wants a "filter by rating" section added to the shop's `ProductFilters` sidebar
(`src/features/products/_components/product-filters.tsx`, currently open in their IDE). Read the
backend (`D:\learn(backend)\e-comm\backend`) to confirm the contract: `GET /api/products`
(`product.types.ts`'s `productQuerySchema`, `product.repository.ts`'s `findProduct`) only accepts
`page`, `limit`, `categoryId`, `search` — there is no `minRating`/`rating` param, and none should
be added (backend is read-only from this project). This mirrors the existing **price** filter,
which the codebase already documented as client-side-only for the same reason
(`.claude/plan/phase-13-shop-filters.md`, referenced in `product-catalog.tsx`'s doc comment) — the
rating filter follows that exact established pattern: filter the already-fetched `BATCH_LIMIT`
(100) batch client-side by `Number(product.avg_rating)`, no new query params sent to the backend.

`Product.avg_rating` (`products/types/products.ts`) is a `string` (MySQL DECIMAL) — must
`Number(...)` it before comparing, same as `product-info.tsx`/`review-summary.tsx` already do.

The codebase already has a reusable `<StarRating value={n} />` component
(`src/components/star-rating.tsx`) used read-only in `product-info.tsx` and `review-summary.tsx` —
reuse it here instead of drawing new star icons.

## Design

Single-select thresholds, exclusive, exactly mirroring the existing **Category** section's
checkbox-styled-as-radio toggle behavior (`toggleCategory` in `product-filters.tsx`) — "4 stars &
up" and "3 stars & up" are cumulative/mutually exclusive, so only one can be active. New URL param:
`minRating` (`'4' | '3' | '2' | '1'`), deleted alongside the others in `clearAll`, resets `page`
same as the category/price handlers do.

## Files to change

**`src/features/products/_components/product-filters.tsx`**
- Add a `RATING_THRESHOLDS = [4, 3, 2, 1]` constant near the top (alongside imports).
- Read `const selectedRating = searchParams.get('minRating')`.
- Add `toggleRating(rating: number)`, mirroring `toggleCategory`: clone `searchParams`, if
  `selectedRating === String(rating)` delete `minRating`, else `set('minRating', String(rating))`,
  delete `page`, `setSearchParams(next)`.
- Add a new filter section after the existing `Price` section (its own `<Separator />` above it,
  matching the Category→Price separator already there): heading `"Rating"`, then one
  `flex items-center gap-2` row per threshold in `RATING_THRESHOLDS`, each with a `Checkbox`
  (`checked={selectedRating === String(rating)}`, `onCheckedChange={() => toggleRating(rating)}`)
  and a `Label` containing `<StarRating value={rating} size="size-4" />` + `"& up"` text. No
  loading-skeleton branch needed (thresholds are a static array, not fetched).
- Extend `clearAll`'s deleted-key list to include `'minRating'`.
- Extend `hasActiveFilters` to `searchParams.has('category') || searchParams.has('minPrice') || searchParams.has('minRating')`.
- Update the component doc comment to mention the rating section.

**`src/features/products/_components/product-catalog.tsx`**
- Read `const minRating = searchParams.has('minRating') ? Number(searchParams.get('minRating')) : 0`
  next to the existing `minPrice`/`maxPrice` reads (after line 63).
- Extend the `filtered` `useMemo` (lines 65-71) to also require
  `Number(product.avg_rating) >= minRating`, alongside the existing price check, and add
  `minRating` to its dependency array.
- Update the doc comment (currently documents `?page=&category=&search=&minPrice=&maxPrice=`) to
  add `&minRating=`.
- No change to `useProducts`/`ListProductsParams`/`productKeys`/`listProducts` — rating stays out
  of the server request entirely, same as price.

## Out of scope

- No backend changes (no `minRating` query param added server-side).
- No change to `product-tile.tsx`'s own rating display (if any) or to `product-info.tsx` — this is
  purely a shop-grid filter.
- Rating filtering, like price filtering, only applies within the currently fetched
  `BATCH_LIMIT` batch — `pagination.total`/`totalPages` from the API are already unused for the
  grid's own pagination (client-side `filtered.length`/`PAGE_SIZE` drives that), so no inconsistency
  is introduced beyond what price filtering already has.

## Verification

- `npm run dev`, open `/shop`.
- Click "4 stars & up" → URL gets `?minRating=4`, grid narrows to only products with
  `avg_rating >= 4`, "Clear All" appears and removes it. Click "3 stars & up" while "4" is active →
  swaps exclusively (only one checked at a time). Combine with an active category and/or price
  range → all three filters apply together (AND).
- Confirm behavior identical in both the desktop sidebar and the mobile filters `Sheet` (same
  `ProductFilters` instance, both already re-render off the shared `searchParams`).
