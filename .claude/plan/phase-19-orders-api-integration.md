# Phase 19 — Orders API integration

## Context

The backend's orders API (`/api/orders/*`) is now complete. The frontend currently only has a
**UI-only "My Orders" page** (phase 18) built against placeholder mock data
(`src/features/orders/_components/mock-orders.ts`), with no `api/` or `hooks/` layer — that
file's own header comment flags it as needing reconciliation against the real contract. This
phase replaces the mock data with real API calls and, per your scope decision, also adds the
place-order (checkout) flow and admin order management in the same phase, since all three are
the same "orders" feature area.

Confirmed backend contract (read from `D:\learn(backend)\e-comm\backend`, routes/controllers/
services/types for orders — see `router.use(authenticate)` in `order.routes.ts`, all routes
require a JWT):

| Method | Path | Guard | Body | Response |
|---|---|---|---|---|
| GET | `/api/orders` | any signed-in user | — | `Order[]` (caller's own, newest first) |
| POST | `/api/orders` | any signed-in user | `{ shippingAddress: string (min 5) }` | `201 Order` |
| GET | `/api/orders/:orderId` | owner or 404 | — | `Order` (not used this phase — list already embeds items) |
| PATCH | `/api/orders/:orderId/cancel` | owner; only if `status === 'pending'` | — | `Order` |
| GET | `/api/orders/admin` | `role: admin` | — | `Order[]` (all users) |
| PATCH | `/api/orders/:orderId/status` | `role: admin` | `{ status: OrderStatus }` | `Order` |

`Order` shape (bare object/array, no envelope — same convention as cart/products):
```ts
{
  id: number, user_id: number,
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled',
  total: string,              // DECIMAL -> string, same as CartItem.price
  shipping_address: string,
  created_at: string, updated_at: string,
  items: { id, order_id, product_id, quantity, price: string, name, slug }[]
}
```
Errors: standard `{ message }` (404 order not found, 400 empty cart, 409 stock/cancel-state
conflicts, 401/403 auth), plus `{ message, errors }` from zod on `POST` / `PATCH .../status`
(fields: `shippingAddress`, `status`).

`POST /api/orders` takes **no items** — it converts the user's *current server-side cart* into
an order (reads `cartRepository.findCartByUser`, computes `total` server-side, decrements
stock, then clears the cart) and only needs a `shippingAddress` string from the client. This
matches the existing `useCart`/cart feature already being real (`src/features/cart/`), so
checkout naturally reads from that cart data for the order summary.

**Known backend risk to flag, not fix (backend is read-only to me):** `order.repository.ts`'s
`createOrderFromCart` clears the cart with `DELETE FROM cart_item` (singular), while
`cart.repository.ts` uses `cart_items` (plural) everywhere else. If `cart_item` doesn't exist,
this throws inside the same transaction as the order insert, and — since Express error
middleware returns `{ message }` from whatever the thrown error was — `POST /api/orders` could
fail outright (likely a 500) instead of succeeding. This isn't something the frontend can work
around; if checkout fails immediately when testing, this table-name mismatch is the first thing
to check on the backend before assuming the frontend integration is wrong.

Admin order list has no user name/email joined in — only `user_id`. The admin table will show
`User #<user_id>`; no backend support exists yet for a nicer label, pagination, or status
filtering on either list endpoint.

## Approach

Follow the exact conventions already established by the cart/categories features: `api/`
(plain axios calls), `hooks/` (`useQuery`/`useMutation`, cache-owning), presentational
components consuming hooks, shared `orderKeys` in `src/lib/query-keys.ts`, `getApiErrorMessage`
/ `getApiFieldErrors` for error display, `formatPrice`/`formatDate` from `src/lib/format.ts`.

### 1. Types — `src/features/orders/types/orders.ts` (replace placeholder content)
Real `OrderStatus`, `OrderItem`, `Order` (per table above), plus `PlaceOrderInput`
(`{ shippingAddress: string }`) and `UpdateOrderStatusInput` (`{ status: OrderStatus }`).
Delete `src/features/orders/_components/mock-orders.ts` (dead scaffolding once real data flows).

### 2. API — `src/features/orders/api/orders.ts` (new)
`getOrders`, `placeOrder`, `cancelOrder`, `getAllOrders`, `updateOrderStatus` — same shape as
`src/features/cart/api/cart.ts` (typed `http.get/post/patch` calls, doc-commented with method
+ path). No `getOrderById` — not needed since both list endpoints already embed `items`.

### 3. Query keys — `src/lib/query-keys.ts` (add `orderKeys`)
```ts
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  mine: () => [...orderKeys.lists(), 'mine'] as const,
  admin: () => [...orderKeys.lists(), 'admin'] as const,
}
```

### 4. Hooks — `src/features/orders/hooks/` (new)
- `use-orders.ts` — `useOrders()`: `useQuery({ queryKey: orderKeys.mine(), queryFn: getOrders, enabled: !!session })`, mirroring `use-cart.ts`.
- `use-place-order.ts` — `usePlaceOrder()`: `useMutation({ mutationFn: placeOrder })`; on success, `invalidateQueries(orderKeys.mine())` and `invalidateQueries(cartKeys.cart())` (backend clears the cart as part of the transaction).
- `use-cancel-order.ts` — `useCancelOrder()`: mutation over `cancelOrder`; on success, patch the returned order into the `orderKeys.mine()` cache via `setQueryData` (map by id), same pattern as `useAddToCart` seeding the cache from the response.
- `use-all-orders.ts` — `useAllOrders()`: `useQuery({ queryKey: orderKeys.admin(), queryFn: getAllOrders, enabled: session?.user.role === 'admin' })`.
- `use-update-order-status.ts` — `useUpdateOrderStatus()`: mutation over `updateOrderStatus`; on success, patch into `orderKeys.admin()` cache the same way.

### 5. "My Orders" page — update existing components in place
- `order-status-badge.tsx` — remap `STATUS_LABEL`/`STATUS_VARIANT` to the real enum (`pending`, `paid`, `shipped`, `delivered`, `cancelled`).
- `order-item-row.tsx` — drop the `image` field (backend doesn't join a product image here); render name/slug, `qty × formatPrice(item.price)`, and `formatPrice(Number(item.price) * item.quantity)` for the line total.
- `order-card.tsx` — use `order.id`/`order.created_at`/`order.total` (real field names), show `order.shipping_address`, and add a "Cancel order" button (only rendered when `status === 'pending'`) wired to `useCancelOrder`, with `toast.error(getApiErrorMessage(...))` on failure — same instant-mutate-no-confirm-dialog pattern as `CartSheet`'s "Clear cart".
- `order-list.tsx` — replace `MOCK_ORDERS` with `useOrders()`; update `STATUS_TABS` to the real enum; add loading (skeleton cards) and `QueryErrorAlert` error states matching `CategoriesTable`'s pattern; keep the existing empty state.

### 6. Checkout flow (new)
- `src/features/orders/_components/checkout-form.tsx` (new) — reads `useCart()` for an order summary (items + total, reusing `CartItem`/`formatPrice`), a controlled `shippingAddress` textarea (`required`, `minLength={5}` to match the zod schema), and a submit button calling `usePlaceOrder().mutate({ shippingAddress })`. On success: `toast.success(...)` and `navigate('/orders')`. On error: `toast.error(getApiErrorMessage(error, 'Could not place order'))` — this is where the empty-cart (400) and insufficient-stock (409) backend messages surface directly. Follows `CreateCategoryDialog`'s controlled-input-plus-`getApiFieldErrors` pattern rather than introducing a form library.
- `src/pages/checkout-page.tsx` (new) — thin route wrapper rendering `<CheckoutForm />`, same shape as `orders-page.tsx`.
- `src/app/router.tsx` — add `{ path: '/checkout', element: <RequireAuth><CheckoutPage /></RequireAuth> }` under the storefront `RootLayout` children, alongside `/orders`.
- `src/features/cart/_components/cart-sheet.tsx` — add a "Checkout" button/link (`<SheetClose asChild><Link to="/checkout"><Button>...</Button></Link></SheetClose>`) next to "Clear cart", enabled only when the cart has items. This is a plain route link, not a cross-feature component import, so it doesn't violate the "no leaking feature internals" rule.

### 7. Admin order management (new)
- `src/features/orders/_components/admin-orders-table.tsx` (new) — same structure as `categories-table.tsx`: loading skeleton rows, `QueryErrorAlert`, empty state, then a `Table` with columns Order ID, User (`User #{user_id}`), Status (badge + an inline shadcn `Select` bound to `useUpdateOrderStatus` for admins), Total (`formatPrice`), Placed (`formatDate`). No filtering/search needed to match — backend has no query params to filter by, so this is a flat list like `CategoriesTable`'s (client-side filter can be added later if needed, but isn't requested here).
- `src/pages/admin-orders-page.tsx` (new) — `<SiteHeader title="Orders" />` + `<AdminOrdersTable />`, same shape as `admin-categories-page.tsx`.
- `src/app/router.tsx` — add `{ path: 'orders', element: <AdminOrdersPage /> }` to the `/admin` children in `AdminLayout` (already role-guarded via `RequireAuth role="admin"` at the layout level — no extra guard needed).
- `src/components/app-sidebar.tsx` — add an "Orders" entry to `ADMIN_NAV` (e.g. `ReceiptIcon` from `lucide-react`, `url: '/admin/orders'`).

## Out of scope for this phase
- `GET /api/orders/:orderId` (dedicated order detail route/page) — the list already embeds items.
- Pagination, status filtering, or search on either order list — backend doesn't support it.
- Showing customer name/email on the admin orders table — backend doesn't join it.
- Any backend fix for the `cart_item`/`cart_items` mismatch (backend is read-only to this project).

## Verification
1. `npm run dev`, sign in as a regular customer with items in the cart.
2. Open the cart sheet → "Checkout" → submit a shipping address → confirm it POSTs to `/api/orders`, redirects to `/orders`, and the new order appears with status `pending` and the right items/total.
3. Confirm the cart sheet is empty afterward (validates both the invalidation and, indirectly, whether the `cart_item`/`cart_items` backend bug above is real).
4. On a `pending` order in `/orders`, click "Cancel order" → confirm status flips to `cancelled` and the button disappears.
5. Sign in as an admin, visit `/admin/orders` → confirm all users' orders list, and that changing an order's status via the `Select` persists (refresh to confirm) and reflects immediately without a refetch.
6. Trigger the 400 (empty cart) and 409 (insufficient stock) error paths at least once each and confirm the toast shows the backend's exact message.
