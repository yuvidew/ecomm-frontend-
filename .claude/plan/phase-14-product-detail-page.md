# Phase 14 — Product Detail Page + Reviews

## Context

The shop page (`/shop`) lists products via `ProductTile`, but the tiles aren't clickable — there's
no way to open a single product today. The user wants a customer-facing product detail page (Figma:
[Product Detail Page — Community](https://www.figma.com/design/bQHezJ26yJvrBWxeSvFsBq)), reachable
by clicking any product card in the shop, using the project's existing `NavBar`/`Footer` chrome and
current theme (emerald primary, Zilla Slab headings, Public Sans body) instead of the Figma mock's
own header/footer/fonts. It also adds a Product Reviews section backed by a **new `reviews` feature**
hitting the backend's `/api/reviews` routes.

Backend investigation (`D:\learn(backend)\e-comm\backend`, read-only) found `GET /api/products/:id`
and `GET /api/reviews/product/:productId` work correctly, but **`POST/PUT/DELETE /api/reviews` are
currently broken**:

| Bug | File |
|---|---|
| `createReviewSchema` requires `rarting` (typo) instead of `rating`, and types `comment` as `z.number()` instead of a string | `src/types/review.types.ts` |
| Controller has `req.body.productId.` then `req.body.rating` on the next line — parses as one broken member-access expression, throws before calling the service | `src/controllers/review.controller.ts` (`createReviewController`) |
| `updateReviewById` SQL has a trailing comma: `"...comment = ?, WHERE id = ?"` → SQL syntax error | `src/repositories/review.repository.ts` |
| `deleteReviewController` never sends a response on success (request hangs); its args are also swapped vs. the service signature (`deleteReview(reviewId, role, userId)` called as `(userId, role, reviewId)`) | `src/controllers/review.controller.ts` / `review.service.ts` |
| `recalculateProductRating` destructures `numReview` but the SQL selects `numReviews`, so the recalculated review count written to `products.num_review`/`num_reviews` is `undefined` | `src/repositories/product.repository.ts` |

**The user has confirmed they will fix these bugs themselves** (backend is read-only from this
project). The frontend is built against the **corrected** contract below; review-writing features
will not work until those fixes land.

Decisions confirmed with the user:
- Route: **`/shop/:id`** (sibling of `/shop`, inherits `NavBar`/`Footer` via `RootLayout`).
- Figma's Color/Size swatches are **omitted entirely** — the `Product` model has no variant fields.
- Figma's Add to Cart button, wishlist heart, and share icon are rendered as **inert placeholders**
  (no click handler / no backend call) — same convention `NavBar` already uses for its own
  currently-inert search/user/bag icons. Real cart/wishlist integration is a future phase.
- "Related Products" and "Popular this week" carousels from Figma are **out of scope** for this
  phase.
- Figma's "1,238 Sold" stat has no backing field anywhere in the `Product` model (only `stock`,
  `avg_rating`, `num_reviews` exist) — **omitted**.
- Figma's review "Market Topics" checkboxes and "With photo/video" tab have no backing data (no
  topic/tag field, no photo attachments on a review) — **omitted**. The "All reviews / With
  description" tab and the star-rating filter are kept since they're derivable from fields that do
  exist (`comment`, `rating`).
- The backend has no aggregate endpoint for the per-star rating breakdown (bars for 5★ down to 1★) —
  only `avg_rating`/`num_reviews` on the product. This phase fetches reviews with `limit=100` (the
  backend's max) once per product and computes the breakdown, the "All/With description" filter, and
  the rating checkboxes client-side from that page. Products with >100 reviews will show an
  approximate breakdown based on the most recent 100 — acceptable for now, flagged here for later if
  it matters.

## Confirmed API contracts (post-fix)

```
GET /api/products/:id
  → 200 { id, category_id, name, slug, description, price, stock,
          avg_rating: string, num_reviews: number, created_at, updated_at, images: string[] }
  → 404 { message }

GET /api/reviews/product/:productId?page=&limit=
  → 200 { reviews: [{ id, user_id, product_id, rating, comment, created_at, updated_at, name }],
          pagination: { page, limit, total, totalPages } }
  → 404 { message }

POST /api/reviews   (auth required)
  body { productId: number, rating: number (1-5), comment?: string (max 1000) }
  → 201 { id, user_id, product_id, rating, comment, created_at, updated_at }   (no joined `name`)
  → 400 { message, errors } | 404 { message } | 409 { message: "You have already reviewed this product" }

PUT /api/reviews/:id   (auth required, owner only)
  body { rating?: number, comment?: string }
  → 200 { ...updated row }   (no joined `name`)
  → 400 | 403 | 404

DELETE /api/reviews/:id   (auth required, owner or admin)
  → 200 { message }
  → 403 | 404
```

Note: `AuthUser` (`src/types/auth.ts`) only carries `{ id, email, role }` — no `name`. After creating
a review we can't optimistically render the reviewer's name, so mutations just invalidate the reviews
query and let the refetch supply the joined `name` from the backend.

## New files

**Reviews feature** (`src/features/reviews/`, new feature folder):
- `types/reviews.ts` — `Review`, `ReviewsPagination`, `ListReviewsResponse`, `CreateReviewInput`, `UpdateReviewInput`.
- `api/reviews.ts` — `listProductReviews(productId, params)`, `createReview(input)`, `updateReview(id, input)`, `deleteReview(id)`, all via the shared `http` client (`src/lib/http.ts`).
- `hooks/use-product-reviews.ts` — `useQuery` wrapping `listProductReviews`.
- `hooks/use-create-review.ts`, `hooks/use-update-review.ts`, `hooks/use-delete-review.ts` — mutations; each invalidates `reviewKeys.listsByProduct(productId)` **and** `productKeys.detail(productId)` (rating/count live on the product row).
- `_components/review-summary.tsx` — big average number + stars + total count + per-star bar breakdown (computed client-side, see above).
- `_components/review-list.tsx` — tabs (All / With description) + star-rating checkbox filter (client-side over the fetched page) + maps `ReviewItem`; pagination controls using the real `pagination` metadata.
- `_components/review-item.tsx` — one review: stars, `comment`, formatted date (`formatDate` from `src/lib/format.ts`), reviewer `name`; shows Edit/Delete only when `review.user_id === session.user.id` (via `useSession`).
- `_components/review-form.tsx` — star input + textarea, used both to create (when the signed-in user has no existing review in the fetched page) and to edit (pre-filled, via `useUpdateReview`); hidden entirely when signed out, with a "Sign in to leave a review" prompt instead.

**Product detail page** (storefront, in `src/features/products/` since it's product-specific):
- `_components/product-gallery.tsx` — extracted/adapted from the existing thumbnail-select logic in `product-details.tsx`: main image + thumbnail strip, plus inert wishlist/share icon buttons.
- `_components/product-info.tsx` — name, `avg_rating`/`num_reviews` stars (linking down to the reviews section via anchor), price (`formatPrice`), stock badge (reuse the in-stock/out-of-stock pattern from `product-details.tsx`), description with a "See more" clamp/expand toggle, and inert Add to Cart / Checkout buttons.

**Page + route**:
- `src/pages/product-detail-page.tsx` — thin route component: `useParams<{id}>()` → `useProduct(id)` (existing hook, unchanged), loading `Spinner` / `QueryErrorAlert` pattern copied from `admin-product-detail-page.tsx`, a `Breadcrumb` (shadcn, `src/components/ui/breadcrumb.tsx`) reading Home / Shop / `<category name via useCategories>` / product name, then `ProductGallery` + `ProductInfo` in a two-column grid, then the reviews section (`ReviewSummary` + `ReviewList` + `ReviewForm`).
- Add `{ path: '/shop/:id', element: <ProductDetailPage /> }` to `src/app/router.tsx`, as a sibling of `/shop` under the existing `RootLayout` children array (inherits `NavBar`/`Footer`/admin-redirect for free).

## Changed files

- `src/features/products/_components/product-tile.tsx` — wrap the card in a `Link` (react-router) to `` `/shop/${product.id}` ``, mirroring the existing `Link`-wrapped `ProductCard` (admin) pattern. Update its doc comment (no longer "non-clickable"). This makes both the shop grid (`ProductCatalog`) and the home page's `TrendingProducts` clickable, since both reuse `ProductTile`.
- `src/features/products/types/products.ts` — add `avg_rating: string` and `num_reviews: number` to the `Product` type (present in the backend response today but missing from the frontend type).
- `src/lib/query-keys.ts` — add:
  ```ts
  export const reviewKeys = {
    all: ['reviews'] as const,
    listsByProduct: (productId: number) => [...reviewKeys.all, 'product', productId] as const,
    listByProduct: (productId: number, params: { page: number; limit: number }) =>
      [...reviewKeys.listsByProduct(productId), params] as const,
  }
  ```

## Out of scope

- Fixing the backend review bugs (user is doing this separately).
- Real Add to Cart / wishlist wiring against `/api/cart` and `/api/favorites`.
- "Related Products" / "Popular this week" sections.
- Color/size variant selection.
- Admin ability to delete any user's review (only the review owner gets edit/delete controls here).
- Rating breakdown beyond the most recent 100 reviews per product.

## Verification

1. `npm run lint` and `npm run build`.
2. Use the `test-writer` agent to add tests for: `ProductTile` navigation, the new route rendering a product by id (MSW-mocked `GET /api/products/:id` + `GET /api/reviews/product/:id`), and the review form's create/edit/delete flows (mocked mutations) — following the existing MSW + `renderWithProviders` pattern in `src/pages/__tests__/shop-page.test.tsx`. Then run them with `test-runner`.
3. Manually run the dev server, go to `/shop`, click a product card, confirm it opens `/shop/:id` with the right product, images, price, description (see-more works), stock badge, and reviews list/summary render correctly against the real backend (once the user's backend fixes are in place) — including signed-out (no review form) vs. signed-in (form shown, own review gets edit/delete) states.
4. Run the `web-design-guidelines` skill against the new page/components for an accessibility/UX pass, matching the phase-4 convention.
