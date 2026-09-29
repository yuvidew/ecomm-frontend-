# Phase 20 — Payments integration

## Context

The backend's payments API (`/api/payments/*`) is now complete. It is a **mocked payment gateway**: there is no real card/UPI/wallet processor, no webhook, and no SDK. "Verification" is a client-triggered simulation (`simulate: "success" | "failure"` in the request body) rather than a callback from a real provider. This phase wires that up as a genuinely testable UI flow — after a payment is initiated, the user gets explicit "Simulate Success" / "Simulate Failure" controls, so both the happy path and the retry-after-failure path can actually be exercised through the UI (confirmed with the user; an auto-success-only spinner was rejected because it can't exercise the failure/retry path).

This phase consumes the three endpoints on `/api/payments`. It slots in right after phase 19 (orders API integration): a payment always targets an existing order, and a successful `verify` call flips that order's status server-side from `pending` to `paid` — so this phase's cache strategy has to keep the orders feature's caches in sync, not just the new payments cache.

There is no `currency` field anywhere in this system — single currency (INR), and `formatPrice` (`src/lib/format.ts`) is already hardcoded to that. Nothing in this phase touches currency selection.

**Known upstream risk, not to be fixed here** (backend is read-only to this project, per project rules): `order.repository.ts`'s cart-clearing query may reference a mismatched `cart_item` vs `cart_items` table name, flagged as unverified during phase 19. Since a payment can only be initiated against an order that already exists and is `pending`, this sits entirely upstream of payments — if `POST /api/orders` fails, there's no order to pay for. Noted as a dependency risk only; no workaround is in scope.

## Goal / endpoints consumed

| Method | Path | Guard | Body | Response |
|---|---|---|---|---|
| POST | `/api/payments/` | signed-in; order must belong to caller and be `status: "pending"` | `{ orderId: number, method: "card" \| "upi" \| "wallet" }` | `201 PaymentRow` |
| POST | `/api/payments/:transactionRef/verify` | signed-in; payment must belong to caller | `{ simulate?: "success" \| "failure" }` (defaults `"success"`) | `200 PaymentRow` (idempotent — a finalized payment returns as-is) |
| GET | `/api/payments/order/:orderId` | owner, or `role === "admin"` for any order | — | `200 PaymentRow[]`, `created_at DESC` (full attempt history) |

Errors follow the existing convention: `{ message }` for 404/409, `{ message, errors }` (zod) for 400 — handled with the existing `getApiErrorMessage` / `getApiFieldErrors` from `src/lib/http.ts`.

## Request/response contracts

```ts
// src/features/payments/types/payments.ts

export type PaymentMethod = 'card' | 'upi' | 'wallet'
export type PaymentStatus = 'initiated' | 'success' | 'failed'

export type PaymentRow = {
  id: number
  order_id: number
  user_id: number
  amount: string          // DECIMAL -> string, mirrors order.total at initiation time
  method: PaymentMethod
  status: PaymentStatus
  transaction_ref: string // "TXN_<24 hex chars>"
  failure_reason: string | null
  created_at: string      // ISO date string
  updated_at: string
}

export type InitiatePaymentInput = {
  orderId: number
  method: PaymentMethod
}

export type VerifyPaymentInput = {
  transactionRef: string
  simulate?: 'success' | 'failure'  // omit -> backend defaults to "success"
}
```

No response envelope — bare object/array, same convention as `orders`/`cart`.

## New feature folder/files

```
src/features/payments/
  types/payments.ts            # PaymentRow, PaymentMethod, PaymentStatus, InitiatePaymentInput, VerifyPaymentInput
  api/payments.ts               # initiatePayment, verifyPayment, getOrderPayments
  hooks/
    use-initiate-payment.ts     # useInitiatePayment()
    use-verify-payment.ts       # useVerifyPayment()
    use-order-payments.ts       # useOrderPayments(orderId)
  _components/
    payment-method-form.tsx     # method radio-group + "Pay now" submit (calls useInitiatePayment)
    payment-simulator.tsx       # "Simulate Success" / "Simulate Failure" buttons (calls useVerifyPayment)
    payment-status-badge.tsx    # colored pill for PaymentStatus, sibling to order-status-badge.tsx
    payment-history.tsx         # PaymentRow[] table, shared by the customer pay page and admin dialog
    payment-panel.tsx           # orchestrator: derives state from order + history, renders the right sub-component

src/pages/
  pay-order-page.tsx            # route "/orders/:orderId/pay"
```

`src/lib/query-keys.ts` — add:
```ts
/** paymentKeys — TanStack Query keys for the payments feature. */
export const paymentKeys = {
  all: ['payments'] as const,
  byOrder: (orderId: number) => [...paymentKeys.all, 'order', orderId] as const,
}
```

`src/app/router.tsx` — add one child route inside the existing storefront `RootLayout` children array (same array that already holds `/orders` and `/checkout`), so it automatically inherits the parent `<RedirectIfRole role="admin" to="/admin">` guard:
```tsx
{
  path: '/orders/:orderId/pay',
  element: (
    <RequireAuth>
      <PayOrderPage />
    </RequireAuth>
  ),
},
```

Existing files touched (no other new files beyond the above):
- `src/features/orders/_components/checkout-form.tsx` — success handler change (see below).
- `src/features/orders/_components/order-card.tsx` — add a "Pay now" action for `pending` orders.
- `src/features/orders/_components/admin-orders-table.tsx` — add a "Payments" action per row opening a `Dialog` with `PaymentHistory`.

## Components to build

All built from primitives already installed under `src/components/ui/` (confirmed present: `radio-group`, `table`, `dialog`, `badge`, `empty`, `alert`, `accordion`, `skeleton`, `spinner`) — nothing new needed via the shadcn CLI.

- **`PaymentMethodForm`** (`_components/payment-method-form.tsx`) — `RadioGroup`/`RadioGroupItem` with three options (`card`, `upi`, `wallet`, icons from `lucide-react` as other features do), wrapped in `Field`/`FieldGroup`/`FieldLabel` (same pattern as `checkout-form.tsx`'s shipping-address field), and a `Button` + `Spinner` submit calling `useInitiatePayment().mutate({ orderId, method })`. `toast.error(getApiErrorMessage(error, 'Could not start payment'))` on failure (covers the 409 "only pending orders can be paid for" case).
- **`PaymentSimulator`** (`_components/payment-simulator.tsx`) — two `Button`s ("Simulate Success" default variant, "Simulate Failure" `variant="destructive"`), each calling `useVerifyPayment().mutate({ transactionRef, simulate: 'success' | 'failure' })`, disabled while pending with `Spinner`. Takes the in-flight `PaymentRow` (status `"initiated"`) as a prop.
- **`PaymentStatusBadge`** (`_components/payment-status-badge.tsx`) — `Badge`, mapping `initiated → outline`, `success → default`, `failed → destructive`; same shape as `order-status-badge.tsx`.
- **`PaymentHistory`** (`_components/payment-history.tsx`) — `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableCell`, columns: Method, Status (`PaymentStatusBadge`), Amount (`formatPrice`), Transaction ref (monospace, truncated with a `title` attribute holding the full ref), Attempted (`formatDate`), and a Failure reason cell (only rendered when `failure_reason` is non-null). Loading state via `Skeleton` rows (same pattern as `admin-orders-table.tsx`), error via `QueryErrorAlert`, empty via `Empty`/`EmptyHeader`/`EmptyMedia`/`EmptyTitle` ("No payment attempts yet"). Pure presentational: takes `orderId` and calls `useOrderPayments(orderId)` itself so it can be dropped into both the customer pay page and the admin dialog unchanged.
- **`PaymentPanel`** (`_components/payment-panel.tsx`) — the stateful orchestrator for `/orders/:orderId/pay`. Reads the order from `useOrders()` (find by `id` in the caller's own order list — no new `getOrderById` call, since phase 19 never needed the single-order endpoint) and the attempt history from `useOrderPayments(orderId)`. Renders:
  - `Skeleton` while either query is loading.
  - `QueryErrorAlert` if either errors, or an `Empty` "Order not found" state if the order isn't in the caller's list (covers the 404/ownership case).
  - If `order.status !== 'pending'` and there's no `'initiated'` attempt in history: an info `Card` ("This order is already {status}") with a `Button asChild` link back to `/orders`.
  - Otherwise, derive the latest attempt as `history[0]` (already `created_at DESC`):
    - no history yet, or latest attempt is `'failed'` → render `PaymentMethodForm` (labelled "Retry payment" when latest is `'failed'`, showing `latest.failure_reason` above it via `QueryErrorAlert`).
    - latest attempt is `'initiated'` → render `PaymentSimulator` for that transaction ref.
    - latest attempt is `'success'` → a success `Card`/`Empty` state ("Payment received") with a link back to `/orders`.
  - `PaymentHistory` rendered underneath regardless of the state above, inside an `Accordion` "View payment attempts" (consistent with how `order-card.tsx` already collapses line items).
- **Admin payments dialog** — no new component beyond reusing `PaymentHistory`; `admin-orders-table.tsx` gains a `Dialog`/`DialogTrigger`/`DialogContent` per row with a "Payments" `Button` trigger, `DialogTitle` "Payments for order #{id}", body `<PaymentHistory orderId={order.id} />`. A `Dialog` (not `AlertDialog`) is correct since this is non-destructive and view-only.

## TanStack Query hooks

- **`useInitiatePayment`** (`hooks/use-initiate-payment.ts`) — `useMutation({ mutationFn: initiatePayment })`. On success, `setQueryData(paymentKeys.byOrder(payment.order_id), (rows) => rows ? [payment, ...rows] : [payment])` — prepend, since the list is `created_at DESC` and this is provably the newest row. No order-cache change (initiating doesn't change order status).
- **`useVerifyPayment`** (`hooks/use-verify-payment.ts`) — `useMutation({ mutationFn: verifyPayment })`. On success:
  1. `setQueryData(paymentKeys.byOrder(payment.order_id), (rows) => rows?.map((r) => (r.id === payment.id ? payment : r)) ?? [payment])` — patch the one row in place.
  2. If `payment.status === 'success'`, the backend has also flipped the order to `'paid'` as a side effect the response doesn't carry — patch the *order* caches directly (same `setQueryData` reasoning `useCancelOrder` already uses): `setQueryData(orderKeys.mine(), (orders) => orders?.map((o) => (o.id === payment.order_id ? { ...o, status: 'paid' } : o)))` and the same for `orderKeys.admin()` (safe no-op if that cache isn't populated). This is a cross-feature cache write (`orderKeys` imported into a `payments` hook), mirroring how `use-place-order.ts` already reaches into `cartKeys` — the query-keys module is the shared surface, not a features-leaking-into-features violation.
  3. On `'failed'`, no order-cache change (order stays `pending`, matching the backend leaving it untouched for retry).
- **`useOrderPayments`** (`hooks/use-order-payments.ts`) — `useQuery({ queryKey: paymentKeys.byOrder(orderId), queryFn: () => getOrderPayments(orderId), enabled: !!session && Number.isFinite(orderId) })`, gated on `useSession()` the same way `useOrders`/`useAllOrders` are. No role check needed in `enabled` — the backend itself allows owner-or-admin, so the same hook serves both the customer pay page and the admin dialog.

## Routing/auth

- New route `/orders/:orderId/pay`, added as a child of the existing storefront `RootLayout` route in `src/app/router.tsx` (verified: same array as `/orders`, `/checkout`), wrapped in `RequireAuth` with no `role` prop (any signed-in user; the backend enforces ownership via its own 404 — an admin visiting another user's pay link gets "Order not found" from `useOrders()` not finding it in their own list, which is acceptable since admins have no product reason to pay for someone else's order).
- Because it's declared inside `RootLayout`'s children, it automatically inherits the parent `<RedirectIfRole role="admin" to="/admin">` guard — a signed-in admin hitting this route is redirected to `/admin`, same as `/orders`/`/checkout` today.
- No new admin route: the payment-history view for admins is a `Dialog` inside the existing `/admin/orders` page, not a separate route.

## Checkout integration change

`src/features/orders/_components/checkout-form.tsx` (verified current code at lines 29–39) — change the `mutate(...)` success callback from:
```tsx
onSuccess: () => {
  toast.success('Order placed')
  navigate('/orders')
},
```
to route into the payment flow using the created order (`usePlaceOrder`'s mutation resolves to `Order`, so the inline `onSuccess` receives it as its first argument regardless of the hook's own `onSuccess`):
```tsx
onSuccess: (order) => {
  toast.success('Order placed')
  navigate(`/orders/${order.id}/pay`)
},
```
No other change to `checkout-form.tsx` — `usePlaceOrder`'s existing cache invalidation is untouched.

`src/features/orders/_components/order-card.tsx` — inside the existing `{order.status === 'pending' && <CardFooter>...}` block (verified present), add a link next to "Cancel order":
```tsx
<Button size="sm" asChild>
  <Link to={`/orders/${order.id}/pay`}>Pay now</Link>
</Button>
```
This covers a user backing out of the pay page without paying, and a user whose last attempt failed returning later — both leave the order `pending`, so "Pay now" reappears on `/orders` either way.

## Out of scope

- Any real payment gateway SDK, redirect flow, or webhook — stays entirely client-simulated via the `simulate` field, per the backend's mocked design.
- Currency selection or multi-currency display — `formatPrice` stays hardcoded to INR.
- Admin ability to mutate, refund, or cancel a payment — no such backend endpoint exists; the admin surface is view-only.
- A dedicated `GET /api/orders/:orderId` hook/API function — `PaymentPanel` reuses the already-cached `useOrders()` list, consistent with phase 19.
- Any fix for the `cart_item`/`cart_items` backend mismatch — noted as a dependency risk only; backend is read-only to this project.
- Auto-polling or auto-verifying a payment — verification is always an explicit "Simulate Success"/"Simulate Failure" click, never a timer.
- Pagination or filtering on the payment history list — the backend returns the full unpaginated array.

## Verification plan

1. `npm run dev`, sign in as a customer, add items to cart, complete checkout with a valid shipping address.
2. Confirm `POST /api/orders` succeeds and the app navigates to `/orders/:orderId/pay` (not `/orders`).
3. On the pay page, pick a method (card/upi/wallet) and submit → confirm `POST /api/payments/` fires, a `PaymentRow` with `status: "initiated"` appears, and the UI swaps to "Simulate Success"/"Simulate Failure".
4. Click "Simulate Failure" → confirm `POST /api/payments/:transactionRef/verify` is called with `{ simulate: "failure" }`, the row updates to `status: "failed"` with the failure reason shown, and the panel offers "Retry payment" (order still `pending`).
5. Retry: pick a method again → confirm a **new** `transaction_ref` is issued (new `PaymentRow`; the old `failed` one still visible in history).
6. Click "Simulate Success" on the new attempt → confirm the row flips to `status: "success"`, the panel shows "Payment received", and — without a manual refresh — the order's status badge on `/orders` now reads "Paid" (validates the `setQueryData` patch on the order cache).
7. Confirm `PaymentHistory` under the pay page shows both attempts (failed then succeeded), newest-first, with correct amounts/methods/timestamps.
8. On `/orders`, confirm a separate still-`pending` order shows "Pay now" and links to the correct `/orders/:orderId/pay` route.
9. Sign in as an admin, go to `/admin/orders`, open the "Payments" dialog for the order paid in step 6 → confirm the same history is visible, and also open it for an order belonging to a different customer to confirm cross-user admin access works.
10. Attempt to initiate a payment against an order that's already `paid` and confirm the toast surfaces the backend's exact "Only pending orders can be paid for" message.

### Critical files
- `src/features/payments/api/payments.ts`
- `src/features/payments/hooks/use-verify-payment.ts`
- `src/features/payments/_components/payment-panel.tsx`
- `src/lib/query-keys.ts`
- `src/app/router.tsx`
- `src/features/orders/_components/checkout-form.tsx`
- `src/features/orders/_components/order-card.tsx`
- `src/features/orders/_components/admin-orders-table.tsx`
