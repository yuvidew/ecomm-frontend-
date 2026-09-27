# Phase 18 — My Orders page (UI only, placeholder data)

## Context

The user wants a **view-only "My Orders" page** — no backend order endpoints exist yet
(confirmed: no `src/features/orders/` folder, no orders page, and the backend's order
contract hasn't been read/confirmed). Per `CLAUDE.md` §7, this is a UI-first phase: build the
feature folder and page against local placeholder data now, and swap in a real `api/`/`hooks/`
layer once the backend order endpoints exist and their contract is confirmed with the user.

This follows the same structural pattern as `cart` and `reviews` (`.claude/plan/phase-15-cart-favorites.md`,
reviews feature) — a `_components/` list view with per-row cards, status badges, and an
empty state — but with a local `MOCK_ORDERS` array standing in for a query hook.

Today the `NavBar`'s account icon (`src/components/nav-bar.tsx:145-147`) is a dead `Button`
with no action. This phase wires it to link to the new page so the view is actually reachable
in the UI, otherwise it stays orphaned behind a manually-typed URL.

## Design

- **Types** (`src/features/orders/types/orders.ts`): `OrderStatus =
  'processing' | 'shipped' | 'delivered' | 'cancelled'`, `OrderItem { id, name, image, quantity, price }`,
  `Order { id, placedAt, status, items, total }`. Doc comment on the file notes these are a
  placeholder shape to reconcile against the real `GET /api/orders` contract later — not to be
  treated as a confirmed backend contract.
- **Mock data** (`src/features/orders/_components/mock-orders.ts`): `MOCK_ORDERS` array,
  ~5 orders covering all four statuses (including at least one `cancelled`), multiple items on
  at least one order, dates spread across the last few weeks, sorted newest-first.
- **Status badge** (`order-status-badge.tsx`): maps status → `Badge` variant + label,
  mirroring `CartRow`'s stock-badge variant mapping in `cart-sheet.tsx` (`processing` →
  `outline`, `shipped`/`delivered` → `secondary`/`default`, `cancelled` → `destructive`).
- **Item row** (`order-item-row.tsx`): thumbnail + fallback `ImageIcon`, name, qty × price,
  line total — same `size-14`/`size-16` thumbnail + `ImageIcon` fallback pattern as `CartRow`.
- **Order card** (`order-card.tsx`): `Card` with header (order id, `formatDate(placedAt)` from
  `@/lib/format`, `OrderStatusBadge`), an `Accordion` (`type="single" collapsible`) whose
  trigger reads `"View N item(s)"` and expands to the `OrderItemRow` list, then a `Separator`
  and a total row using `formatPrice(order.total)`.
- **List** (`order-list.tsx`): page heading + `Tabs` (`All` / `Processing` / `Shipped` /
  `Delivered` / `Cancelled`) filtering `MOCK_ORDERS` client-side by status; renders a
  `flex flex-col gap-4` of `OrderCard`s, or the shadcn `Empty` primitive (icon + title, same
  pattern as `CartSheet`'s empty state) when the filtered list is empty.
- **Page** (`src/pages/orders-page.tsx`): thin route component, same shape as `shop-page.tsx`
  (`<main id="main-content" ...>` wrapper), renders `<OrderList />`.
- **Route**: add `/orders` under the storefront `RootLayout` children in `src/app/router.tsx`,
  wrapped in the existing `RequireAuth` (`src/components/require-auth.tsx`) since order
  history is per-account — same wrapping pattern already used for `/admin` in `admin-layout.tsx`.
- **Nav entry point**: in `src/components/nav-bar.tsx`, turn the inert account `UserIcon`
  button into `<Button asChild ...><Link to="/orders" aria-label="My orders"><UserIcon /></Link></Button>`,
  matching the existing `asChild`+`Link` pattern already used for the Admin/Sign-in buttons
  in the same file.

## Files to change

- `src/features/orders/types/orders.ts` — new: `OrderStatus`, `OrderItem`, `Order` (placeholder
  shapes, doc-commented as such).
- `src/features/orders/_components/mock-orders.ts` — new: `MOCK_ORDERS` array.
- `src/features/orders/_components/order-status-badge.tsx` — new.
- `src/features/orders/_components/order-item-row.tsx` — new.
- `src/features/orders/_components/order-card.tsx` — new.
- `src/features/orders/_components/order-list.tsx` — new: status `Tabs` + filtered card list +
  empty state.
- `src/pages/orders-page.tsx` — new: thin route wrapper.
- `src/app/router.tsx` — add `OrdersPage` import + `RequireAuth`-wrapped `/orders` route under
  the storefront children.
- `src/components/nav-bar.tsx` — wire the account icon button to `<Link to="/orders">`.

All new UI is built from existing shadcn primitives already installed (`Card`, `Badge`,
`Tabs`, `Accordion`, `Separator`, `Empty*`) and existing helpers (`formatPrice`, `formatDate`
from `@/lib/format`, `cn`) — no new dependencies.

## Out of scope

- No `api/` or `hooks/` folder for `orders` — no real HTTP calls, no TanStack Query, no
  `orderKeys` entry in `query-keys.ts`. Added only once the backend order endpoints exist and
  their contract is confirmed.
- No order-detail sub-page/route — the accordion-expand-in-card covers "view" for this phase.
- No cancel/reorder/track actions — view only, per the user's request.
- No changes to the backend (read-only from this project).
- No loading/error states in `order-list.tsx` (no query yet to be loading/erroring) — those
  get added when the real hook replaces `MOCK_ORDERS`.

## Verification

- `npm run dev`, sign in, click the account icon in the nav bar → lands on `/orders`.
- Visiting `/orders` while signed out redirects to `/sign-in` (via `RequireAuth`).
- All 5 status tabs render the right subset of `MOCK_ORDERS`; a tab with no matching orders
  shows the empty state.
- Each order card's accordion expands to show its item rows (thumbnail/fallback icon, qty,
  price) and collapses again; total matches the sum of its item lines.
- Responsive check at mobile width — cards and tabs don't overflow.
