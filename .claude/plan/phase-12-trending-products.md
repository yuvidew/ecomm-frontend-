# Phase 12 — Trending Products (real data) + "View more" products page

## Context

The home page's "Trending Products" section currently renders a hardcoded
`DUMMY_TRENDING_PRODUCTS` array through `ProductTile` — it was built as UI-first
placeholder work (see the comment at `src/pages/home-page.tsx:44-48`) ahead of real
backend integration. Now that the products API is live and already consumed by the
admin dashboard, this phase wires the trending section to real data and gives it a
working "View more" destination, which doesn't exist yet — there is currently no
public products-listing route at all, only the admin-gated `/admin` products screens.

**Confirmed with the user:**
- "Trending" = the newest 8 products. The backend has no trending/featured flag or
  configurable sort at all (`GET /api/products` always orders `created_at DESC`), so
  this phase does not touch the backend — it just calls `?page=1&limit=8`.
- "View more" navigates to a new public `/products` page showing the full paginated
  catalog.
- Product tiles/cards stay non-clickable this phase — no product detail page/route yet
  (future phase).

## API contract (already live, no backend changes)

`GET /api/products?page=&limit=` (public) →
```ts
{ products: Product[]; pagination: { page, limit, total, totalPages } }
```
`Product = { id, category_id, name, slug, description, price /* string */, stock, created_at, updated_at, images: string[] }`

Already fully typed and callable via existing, unmodified code:
- `src/features/products/api/products.ts` → `listProducts(params)`
- `src/features/products/hooks/use-products.ts` → `useProducts(params)` (TanStack Query, `productKeys.list(params)`, `keepPreviousData`)
- `src/features/products/types/products.ts` → `Product`, `Pagination`, `ListProductsParams`, `ListProductsResponse`

No new hook, query key, or HTTP setup needed. `formatPrice` (`src/lib/format.ts`) already accepts the string `price`.

## Design precedent to follow

This mirrors how "Shop by Category" already works: `CategoryGrid` (a `categories`-feature
component) is dropped straight into `home-page.tsx`, which keeps ownership of the section
heading and CTA link. Do the same for products instead of inventing a `home`-feature
wrapper — keeps product-fetching internals inside the `products` feature.

Reuse the loading/error/empty/pagination patterns already proven in the admin
`src/features/products/_components/product-grid.tsx` + `product-card.tsx`, but build new,
public-facing components — the admin ones hardlink to `/admin/products/:id` and open an
admin create-product dialog on empty state, so they can't be reused directly.

## New files

**`src/features/products/_components/product-tile.tsx`**
Public, non-clickable tile for a real `Product` (distinct name/file from admin's
`product-card.tsx` to avoid collision). Mirrors `ProductCard`'s image/`AspectRatio`/`Card`
structure minus the `Link` wrapper and "View details" CTA. Cover image from
`product.images[0]` with an `ImageIcon` fallback. Shows name + `formatPrice(product.price)`
only — no rating/reviews/badge/originalPrice, since the API returns none of that (today's
`DummyProduct` fields were always fake).

**`src/features/products/_components/trending-products.tsx`**
`useProducts({ page: 1, limit: 8 })`. Loading → 8-skeleton grid (reuse
`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`). Error →
`QueryErrorAlert` (`src/components/query-error-alert.tsx`, already generic/reusable).
Empty (`products.length === 0`) → render `null` (a homepage marketing section has no
business showing an empty-state box to a storefront visitor). Success → grid of the new
`ProductTile`.

**`src/features/products/_components/product-catalog.tsx`**
Public equivalent of admin `product-grid.tsx`: `useSearchParams` for `?page=`,
`useProducts({ page, limit: 12 })`, same shadcn `Pagination` + `goToPage` click-intercept
pattern, same loading skeleton grid, `QueryErrorAlert` on error. Empty state uses shadcn
`Empty` primitives with a "No products found" message — no create-product dialog. Success →
grid of `ProductTile` (non-clickable) + `Pagination` when `totalPages > 1`.

**`src/pages/products-page.tsx`** (flat, per repo convention — no nested folder)
Thin route shell: heading ("All Products") + `<ProductCatalog />`, same container styling
as other sections (`mx-auto w-full max-w-7xl px-6 py-16`).

## Changed files

**`src/app/router.tsx`**
Add `{ path: '/products', element: <ProductsPage /> }` to the storefront `RootLayout`
children array, alongside `/`, `/sign-in`, `/sign-up`.

**`src/pages/home-page.tsx`**
- Remove `DUMMY_TRENDING_PRODUCTS` and the now-unused `ProductTile`/`DummyProduct` imports.
- Change the trending section's header `<div>` (`src/pages/home-page.tsx:125-128`) to the
  same `flex items-end justify-between gap-4` shape already used by "Shop by Category"
  (`home-page.tsx:109-118`), adding a real router `Link` on the right:
  `<Link to="/products" className="text-sm font-medium text-primary hover:underline">View more</Link>`
  (this is a real cross-route link, unlike the existing same-page `#trending-products` /
  `#shop-by-category` hash anchors, which stay untouched).
- Replace the inner product grid `<div>` (`home-page.tsx:129-133`) with
  `<TrendingProducts />`.
- Update the file's top doc comment (`home-page.tsx:44-48`) to stop describing trending
  products as placeholder data.

**`src/features/home/types/home.ts`**
Remove the now-unused `DummyProduct` type; keep `Feature` and `TrustStat`.

## Deleted files

**`src/features/home/_components/product-tile.tsx`** — superseded by
`src/features/products/_components/product-tile.tsx`; dead once `home-page.tsx` no longer
imports it.

## Out of scope

- Product detail page/route — tiles stay non-clickable everywhere this phase.
- Any backend trending/featured flag or custom sort.
- Search, category filtering, or sort controls on `/products` — plain pagination only.
- Changing the hero/`PromoBanner` CTA anchors — they keep scrolling to
  `#trending-products` on the home page itself.

## Verification

1. `npm run dev`, open `/` — Trending Products section should show up to 8 real products
   from the database (skeleton while loading, real `QueryErrorAlert` if the API is down,
   nothing rendered if the catalog is empty).
2. Click "View more" — navigates to `/products`, which paginates the full catalog using
   the same shadcn `Pagination` control as the admin grid; `?page=` in the URL should
   update and survive back/forward navigation.
3. Confirm `/admin` products dashboard is untouched (still uses `ProductGrid`/`ProductCard`
   linking to `/admin/products/:id`).
4. `npm run build` / `tsc` to confirm no leftover references to `DummyProduct` or the
   deleted `src/features/home/_components/product-tile.tsx`.
