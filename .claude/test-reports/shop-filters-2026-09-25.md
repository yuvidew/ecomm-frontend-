# Test report: shop-filters

Date: 2026-09-25
Plan: .claude/plan/phase-13-shop-filters.md

## Files added/changed

Added:
- `src/features/products/__tests__/product-search.test.tsx`
- `src/features/products/__tests__/product-filters.test.tsx`
- `src/features/products/__tests__/product-catalog.test.tsx`
- `src/pages/__tests__/shop-page.test.tsx`

Changed (test infra only, following existing conventions):
- `src/test/render.tsx` — added `SearchParamsProbe`, a helper that renders `location.search` so tests can assert on `useSearchParams` writes without reaching into implementation state.
- `src/test/setup.ts` — added a `ResizeObserver` stub (jsdom doesn't implement it; Radix's `Slider`, used by the price filter, reads it).

## Results

- New shop-feature tests: **22/22 passing**, 0 failed, 0 skipped (verified independently by the test-runner agent).
- Full suite: 67/68 passing — the 1 failure (`src/components/__tests__/nav-bar.test.tsx`, "renders the authenticated customer state") is pre-existing and unrelated to this feature; it fails identically with the test-infra changes fully reverted, and `nav-bar.tsx`/`site-header.tsx` were already modified/uncommitted before this task started.
- Type-check (`tsc -b --noEmit`): clean, no errors.
- No repair round was needed — no test bugs were reported.

## Coverage

**`ProductSearch`**
- seeds input text from `?search=`, renders empty when absent
- does not write `?search=` before the 400ms debounce elapses
- writes `?search=` and resets `?page=` once the debounce settles
- clears `?search=` when the input is emptied

**`ProductFilters`**
- renders one checkbox per category from `GET /api/categories`
- shows no checkboxes while categories are loading
- checking a category writes `?category=<id>` and resets `?page=`
- category selection is exclusive (checking one unchecks any other)
- clicking the already-checked category clears back to "All categories"
- "Clear All" resets `category`, `search`, `minPrice`, `maxPrice`, `page`
- moving the price slider via keyboard commits `?minPrice=&maxPrice=` and resets `?page=`

**`ProductCatalog`**
- batch request shape: `page=1&limit=100`, forwards `categoryId`/`search` from the URL
- omits `categoryId`/`search` when no filters are active
- "Showing X–Y of Z results" text + correct page of tiles
- loading state ("Loading products…")
- `{ message }` error shown via `QueryErrorAlert`
- empty state ("No products found")
- client-side price filtering over the fetched batch
- pagination against the client-filtered set at `PAGE_SIZE = 12`, updates `?page=`
- mobile "Filters" button opens `ProductFilters` inside a Sheet

**`ShopPage`**
- banner renders above the catalog; "Shop Now" CTA anchors to `#shop-results`

## Implementation bugs

None that violate the phase-13 spec — every test written to the plan's stated contracts (request shape, results text, single-select category behavior, price-range commit/omit logic, Clear All, debounce, pagination, empty/loading/error states) passed against the current implementation.

**Flagged accessibility issue (not a spec violation, not fixed):**
`ProductFilters` renders category checkboxes with `id={`category-${category.id}`}`. The desktop `<aside>` instance stays mounted (only CSS-hidden) while the mobile `Sheet` renders a second `<ProductFilters>` instance simultaneously, so both instances emit duplicate DOM `id`s whenever the Sheet is open. This breaks `<Label htmlFor>` accessible-name association for the second instance — only the first-in-DOM checkbox resolves an accessible name via `screen.debug()`. The catalog test's Sheet coverage was written to assert checkbox count within the dialog rather than by accessible name to work around this. Suggested fix if you want it: scope the ids per instance (e.g. prefix with `mobile-`/`desktop-`, or accept an `idPrefix` prop).
File: `src/features/products/_components/product-filters.tsx` (`id={`category-${category.id}`}` / matching `htmlFor`).

## Spec ambiguities / open questions

- The plan doesn't specify when "Clear All" should be visible (always vs. only when filters are active) — tests only cover its click behavior when visible, not the visibility condition itself, since that's left as an implementation detail by the plan.

## Environment issues

None.
