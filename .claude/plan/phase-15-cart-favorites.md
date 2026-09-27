# Phase 15 — Cart & Favorites

## Context

The backend now exposes working `/api/cart` and `/api/favorites` endpoints (the user just fixed two
bugs in `cart.repository.ts` — the `products.price` join alias and the `quanticty`→`quantity` column
typo — confirmed fixed by reading the current repository file). The storefront currently has no way to
add a product to a cart or favorites list: `ProductTile` (the shop-grid/trending card) is a bare
image+name+price card with no actions, `ProductInfo`'s "Add to Cart"/"Checkout" buttons on the product
detail page are hard-coded `disabled`, and `ProductGallery`'s wishlist heart icon is inert. `NavBar`
already has (one committed, one uncommitted-by-the-user) icon-only `ShoppingBagIcon` and `HeartIcon`
buttons with no click handlers. This phase wires all of that up against the real API, following this
codebase's existing feature-folder/hooks/query-key conventions exactly (see `products` and `reviews`
features as the reference pattern).

Decisions already confirmed with the user:
1. Backend bugs are fixed — build against the contract as documented below.
2. `GET /api/favorites` has no pagination (returns the full array every time), but per explicit
   request it's still implemented with `useInfiniteQuery` — as a single-page infinite query (one page,
   `hasNextPage` always `false`) so the shape is ready if the backend adds real pagination later.
3. A signed-out visitor clicking "Add to cart" or a favorite heart is redirected to `/sign-in`.
4. Scope includes wiring the existing inert placeholders on `/shop/:id` (`ProductInfo`'s Add to Cart
   button, `ProductGallery`'s wishlist heart), not just the shop-grid cards.

## Confirmed backend contract

**Cart** — `/api/cart`, every route behind `authenticate` (JWT bearer; 401 `{message}` if missing/invalid):
| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/cart` | — | `200 { items: CartItem[], total: number }` |
| POST | `/api/cart` | `{ productId: number, quantity?: number }` (default 1) | `200 { items, total }` |
| PUT | `/api/cart/:itemId` | `{ quantity: number }` | `200 { items, total }` |
| DELETE | `/api/cart/:itemId` | — | `200 { items, total }` |
| DELETE | `/api/cart` | — | `200 { message: string }` |

`CartItem`: `{ id, user_id, product_id, quantity, created_at, updated_at, name, slug, price: string, stock }`
(no `images` field — cart rows don't carry product images).

Errors: 404 `{message: "Product not found"}` / `{message: "Cart item not found"}`; 400
`{message: "Validation failed", errors}` from zod.

**Favorites** — `/api/favorites`, every route behind `authenticate`:
| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/favorites` | — | `200` bare array `Favorite[]` |
| POST | `/api/favorites` | `{ productId: number }` | `200` bare array (full updated list) |
| DELETE | `/api/favorites/:productId` | — | `200` bare array (full updated list) |

`Favorite`: `{ id, user_id, product_id, created_at, name, slug, price: string, stock }` (no `images`).

Errors: 404 `{message: "Product not found"}` / `{message: "Favorite not found"}`; 400 validation errors
same shape as cart.

Neither endpoint takes `page`/`limit`/cursor params.

## New files

**`src/features/cart/types/cart.ts`** — `CartItem`, `Cart` (`{items, total}`), `AddToCartInput`
(`{productId, quantity?}`), `UpdateCartItemInput` (`{quantity}`), `ClearCartResponse` (`{message}`).

**`src/features/cart/api/cart.ts`** — plain functions via `http` (mirror
`src/features/products/api/products.ts` style exactly):
- `getCart(): Promise<Cart>` → `GET /api/cart`
- `addToCart(input: AddToCartInput): Promise<Cart>` → `POST /api/cart`
- `updateCartItem({itemId, input}): Promise<Cart>` → `PUT /api/cart/:itemId`
- `removeCartItem(itemId: number): Promise<Cart>` → `DELETE /api/cart/:itemId`
- `clearCart(): Promise<ClearCartResponse>` → `DELETE /api/cart`

**`src/features/cart/hooks/`** (one hook per file, matching `use-create-product.ts` style):
- `use-cart.ts` — `useCart()`: `useQuery({queryKey: cartKeys.cart(), queryFn: getCart, enabled: !!session})`.
  Reads `session` itself via `useSession()` so every call site is automatically signed-out-safe (cart
  endpoints 401 without a token, and NavBar/ProductTile/ProductInfo all need this hook, including from
  places with no surrounding `session &&` guard).
- `use-add-to-cart.ts` — `useAddToCart()`: mutation, `onSuccess: (cart) => queryClient.setQueryData(cartKeys.cart(), cart)`
  (use the response body directly instead of `invalidateQueries`, since every cart endpoint already
  returns the full updated cart — saves a redundant GET; this is not an optimistic update, just reusing
  the response). Call as `mutate({productId, quantity})`.
- `use-update-cart-item.ts` — `useUpdateCartItem()`: same `setQueryData` pattern. Call as
  `mutate({itemId, input: {quantity}})`.
- `use-remove-cart-item.ts` — `useRemoveCartItem()`: same `setQueryData` pattern. Call as `mutate(itemId)`.
- `use-clear-cart.ts` — `useClearCart()`: `onSuccess: () => queryClient.setQueryData(cartKeys.cart(), {items: [], total: 0})`
  (response is `{message}`, not a `Cart`, so seed the known-empty shape directly).

**`src/features/favorites/types/favorites.ts`** — `Favorite`, `AddFavoriteInput` (`{productId}`). No
`ListParams`/`ListResponse` types — the endpoint takes no params and returns a bare array.

**`src/features/favorites/api/favorites.ts`**:
- `getFavorites(): Promise<Favorite[]>` → `GET /api/favorites`
- `addFavorite(input: AddFavoriteInput): Promise<Favorite[]>` → `POST /api/favorites`
- `removeFavorite(productId: number): Promise<Favorite[]>` → `DELETE /api/favorites/:productId`

**`src/features/favorites/hooks/`**:
- `use-favorites.ts` — `useFavorites()`: wraps `useInfiniteQuery({queryKey: favoriteKeys.list(), queryFn: getFavorites, initialPageParam: undefined, getNextPageParam: () => undefined, enabled: !!session})`.
  Returns `{...query, favorites: query.data?.pages.flatMap((page) => page) ?? []}` so consumers read a
  flat array instead of repeating `.pages.flatMap(...)` everywhere. `getNextPageParam` always returning
  `undefined` means `hasNextPage` is always `false` — no "Load more" UI needed; only `getFavorites`,
  `getNextPageParam`, and `initialPageParam` would need to change if the backend later adds real
  pagination.
- `use-add-favorite.ts` — `useAddFavorite()`: `onSuccess: (favorites) => queryClient.setQueryData(favoriteKeys.list(), {pages: [favorites], pageParams: [undefined]})`
  — **important**: because this is an infinite query, the cache write must use the `{pages, pageParams}`
  envelope, not a bare array, or `data.pages` breaks on next render. Call as `mutate({productId})`.
- `use-remove-favorite.ts` — `useRemoveFavorite()`: same envelope-shaped `setQueryData`. `mutationFn: ({productId}) => removeFavorite(productId)`, call as `mutate({productId})`.

**`src/lib/query-keys.ts`** — add, following the existing factory style:
```ts
export const cartKeys = {
  all: ['cart'] as const,
  cart: () => [...cartKeys.all, 'detail'] as const,
}
export const favoriteKeys = {
  all: ['favorites'] as const,
  list: () => [...favoriteKeys.all, 'list'] as const,
}
```
Deliberately flat (no page/param-keyed lists) since neither endpoint takes params.

**`src/features/cart/_components/cart-sheet.tsx`** — `CartSheet` component, rendered inside `NavBar`'s
cart `Sheet`. Uses `useCart`, `useUpdateCartItem`, `useRemoveCartItem`, `useClearCart`.
- `SheetHeader`/`SheetTitle` = "Your Cart".
- Loading: a few `Skeleton` rows.
- Error: `<QueryErrorAlert message={getApiErrorMessage(error, 'Could not load your cart')} />`.
- Empty (`items.length === 0`): `Empty`/`EmptyHeader`/`EmptyMedia`/`EmptyTitle` (same primitives as
  `ProductCatalog`'s no-results state) with `ShoppingBagIcon` + "Your cart is empty".
- Each row: name, unit price (`formatPrice(item.price)`), a quantity stepper (`-`/`+` buttons calling
  `useUpdateCartItem().mutate({itemId, input: {quantity}})`, decrement disabled at 1, increment clamped
  at `item.stock`, both disabled while `isPending`), line subtotal, remove button (`XIcon`, calls
  `useRemoveCartItem().mutate(item.id)`). No product thumbnail — `CartItem` carries no `images` field;
  use a plain icon placeholder block instead of fetching each product individually (would reintroduce
  N+1 requests).
- Footer: total (`formatPrice(cart.total)`) + a "Clear cart" button (`useClearCart().mutate()`). No
  checkout button — no checkout endpoint exists, don't add another dead-end placeholder.
- All mutation `onError` handlers show `toast.error(getApiErrorMessage(error, '...'))`.

**`src/features/favorites/_components/favorites-sheet.tsx`** — `FavoritesSheet`, rendered inside
`NavBar`'s favorites `Sheet`. Uses `useFavorites`, `useRemoveFavorite`. Same loading/error/empty
structure as `CartSheet` (empty: `HeartIcon` + "No favorites yet"). Each row: name, price, remove button
(`useRemoveFavorite().mutate({productId: favorite.product_id})`). No "Load more" — `hasNextPage` is
always false by construction.

## Modified files

**`src/features/products/_components/product-tile.tsx`** — currently the whole `Card` is one
`<Link to="/shop/:id">`. Restructure so the `Link` wraps only the image (click-to-navigate stays), and
add, as siblings of that `Link` (not nested inside it, to avoid invalid nested-interactive-element HTML
and unreliable click handling):
- A heart icon button absolutely positioned top-left over the image, `opacity-0 group-hover:opacity-100`
  unless `isFavorited` (then always visible), filled vs outline based on `isFavorited`.
- Below the image: name + price (plain text, not a link), then a row with two explicit buttons per the
  user's request — **"View Details"** (`Link` to `/shop/:id` styled via `buttonVariants({variant:
  'outline', size: 'sm'})`, same technique the admin `ProductCard` already uses for its "View details"
  affordance) and **"Add to Cart"** (`Button`, calls `useAddToCart().mutate({productId: product.id})`).
- Both the heart button and Add to Cart button: if signed out (`useSession().session` is `null`),
  `navigate('/sign-in')` instead of calling the mutation. Show `Spinner` (from `@/components/ui/spinner`,
  the codebase's existing `isPending` convention — see `product-form.tsx`, `sign-in-form.tsx`) and
  `disabled` while the relevant mutation `isPending`. `onError` → `toast.error(getApiErrorMessage(...))`.
- Derive `isInCart`/`isFavorited` inline from `useCart()`/`useFavorites()` data
  (`cart?.items.some(i => i.product_id === product.id)`, `favorites.some(f => f.product_id === product.id)`)
  — no separate lookup hook needed; TanStack Query dedupes the shared query key across every rendered
  tile into one cached request.
- Update the component's doc comment to describe the new actions.

**`src/features/products/_components/product-info.tsx`** — remove `disabled` from the "Add to Cart"
button (lines 63-66), wire `onClick` to `useAddToCart().mutate({productId: product.id})` gated by
`session` (redirect to `/sign-in` when signed out), `Spinner`+`disabled` while `isPending`. Leave
"Checkout Now" disabled (out of scope, no checkout endpoint). Rewrite the doc comment — it currently
says these are placeholders that don't integrate `/api/cart`, which will no longer be true.

**`src/features/products/_components/product-gallery.tsx`** — wire the wishlist `Button` (lines 32-34)
to `useAddFavorite`/`useRemoveFavorite`, toggling on `isFavorited` (derived from `useFavorites()`), fill
the heart icon when favorited, same `session` gate + redirect. Rewrite the doc comment (currently says
"inert placeholders"). Leave the Share button untouched.

**`src/components/nav-bar.tsx`** — wrap the existing `ShoppingBagIcon` button in
`Sheet`/`SheetTrigger`/`SheetContent` (mirror `ProductCatalog`'s mobile-filter `Sheet` structure, but
`side="right"`) rendering `<CartSheet />`; same treatment for `HeartIcon` → `<FavoritesSheet />`. Both
stay inside the existing `session ? (...) : (...)` branch, so `useCart`/`useFavorites` never mount for
signed-out users. Add small count badges on each icon (`cart.items.length` / `favorites.length`, hidden
at 0) by calling `useCart()`/`useFavorites()` directly in `NavBar` — this is not a duplicate network
request, TanStack Query shares the one cached entry with whatever `CartSheet`/`FavoritesSheet` mount.

## Out of scope

- No checkout flow/endpoint.
- No new `/cart` or `/favorites` page routes — both are Sheet-based per the request.
- No product-image thumbnails in cart/favorites rows (the backend doesn't join `images` into these
  responses; fixing that is a backend change, out of scope here).
- No optimistic updates (matches the rest of this codebase — every existing mutation invalidates or
  reuses the response after the round trip completes, none patches the cache ahead of the server).
- Admin's `product-card.tsx`/`product-grid.tsx` are untouched (admin-only, no cart/favorites there).

## Verification

- `npm run dev`, sign in as a normal (non-admin) user.
- Shop grid (`/shop`) and home page trending section: hover a card → heart icon appears top-left;
  click it → `POST /api/favorites`, icon fills; click again → `DELETE /api/favorites/:productId`, icon
  outlines. Click "Add to Cart" → `POST /api/cart`, toast on error (e.g. try with `stock: 0`, though the
  backend contract doesn't currently block over-stock adds — verify actual behavior). Click "View
  Details" → navigates to `/shop/:id`.
- Product detail page: "Add to Cart" button in `ProductInfo` now enabled and functional; wishlist heart
  in `ProductGallery` toggles favorite state.
- Nav bar: cart icon badge reflects item count; click it → `Sheet` opens from the right listing cart
  items with working quantity steppers, remove, and clear-cart; heart icon badge reflects favorites
  count; click it → `Sheet` lists favorites with working remove.
- Sign out, revisit `/shop`: clicking Add to Cart or the heart icon redirects to `/sign-in` instead of
  calling the API; the nav's cart/heart icons (and their badges) don't render at all when signed out.
- Confirm no console errors from the favorites `useInfiniteQuery` cache shape (`data.pages` access) after
  add/remove.
