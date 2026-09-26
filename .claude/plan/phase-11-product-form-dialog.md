# Phase 11 — Product create/edit in a dialog

## Goal
Replace the full-page product form (`/admin/products/new`, `/admin/products/:id/edit`)
with a dialog opened in place from the admin screens. No new backend endpoints — reuses
`POST /api/products` and `PUT /api/products/:id` through the existing `useCreateProduct` /
`useUpdateProduct` hooks (both already seed the detail cache and invalidate list queries,
so the page underneath refreshes without navigation).

## Changes
- `src/features/products/_components/product-form.tsx` — no longer navigates or wraps
  itself in a `Card`. Takes `onSuccess(saved)` and `onCancel` callbacks so the dialog
  decides what happens after save/cancel.
- New `src/features/products/_components/product-form-dialog.tsx` — `ProductFormDialog`
  built on shadcn `Dialog`. Props: `product?` (edit mode when given) and `trigger`
  (the button that opens it). Controlled `open` state; closes on save or cancel. The form
  only mounts while open, so each opening starts from fresh state.
- Triggers:
  - `src/pages/admin-products-page.tsx` — header "New product" button.
  - `src/features/products/_components/product-grid.tsx` — empty-state "Create product".
  - `src/pages/admin-product-detail-page.tsx` — "Edit" button (edit mode).
- Removed: `src/pages/product-form-page.tsx` and its two routes in `src/app/router.tsx`.

## Behavior
- Create: dialog closes, success toast, admin stays on the product grid (list refetches).
- Edit: dialog closes, success toast, detail page shows the updated product from cache.
- Cancel / Esc / outside click: closes without saving (disabled while a save is pending).

## Out of scope
- Delete flow (already an `AlertDialog`), product detail layout, storefront pages.
