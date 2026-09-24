# Admin UI remap — data surfaces, dashboard stats, breadcrumbs

## Context
Follow-on to `phase-4-storefront-shell.md`. Phase 3 (`phase-3-admin-ui-polish.md`) already
redesigned the admin sidebar, page flatness, global button sizing, and `ProductCard`. The user
asked to look at the admin pages more broadly and remap the admin UI, beyond the narrower "data
surfaces polish" this file originally scoped — this revision expands it into a fuller pass across
everything in `/admin` that Phase 3 didn't touch.

Research found, beyond what was originally flagged:
- `AdminProductsPage` (the `/admin` landing page) drops straight into the product grid with no
  overview/context — no sense of "how many products", "how many categories" at a glance.
- `ProductGrid` capped at `xl:grid-cols-3` — doesn't use extra width on wide screens, and its
  error state was a plain destructive `<p>`.
- `SiteHeader` wasn't sticky, unlike the public `NavBar` (phase 4) — on a long admin page the
  header scrolled away, inconsistent with the rest of the app.
- `SiteHeader` only ever rendered a flat `title` string; the product detail/edit pages each built
  a one-off "back to all products" ghost button instead of a real breadcrumb trail, even though
  the shadcn `Breadcrumb` primitive was already installed and unused.
- `ListProductsParams`/the backend contract only support `page`/`limit` — no `search` param on
  either side. A search/filter bar or a "low stock" aggregate stat would need a new backend
  endpoint or query param, so both stayed **out of scope** (feature work, not a UI remap) unless
  the backend contract is confirmed first.
- Categories are fully loaded client-side already (`useCategories()` returns the whole list), so a
  categories count and a client-side name filter were safe — no new API calls.

Everything below is pure UI/visual work reusing existing data and existing shadcn primitives — no
new mutations, no new query params, no backend changes.

## Design direction (frontend-design skill pass)
Phase 3 already spent this app's one bold visual move on the emerald sidebar. An admin/CRUD
surface is a working tool, not a marketing page, so this pass stayed quiet and functional rather
than introducing new decoration — the restraint principle applies in the opposite direction from
phase 4's hero: here the job is information density and clarity, not a memorable moment.

- **One repeated motif, not three ad hoc ones**: the stats strip reuses the exact
  label + `tabular-nums` value, divider-separated pattern already established twice this
  project — the home page's value-prop rows and `product-details.tsx`'s spec list. Plain text
  pairs, no icon-in-a-rounded-card (avoids the generic SaaS-stat-tile look), no border/shadow.
- **Breadcrumbs are wayfinding, not decoration**: muted color, small type, no icons on each
  crumb — just `Products / {name}`.
- **Color stays disciplined**: no new hex values or tokens — everything uses `--muted`,
  `--border`, `--foreground`/`--muted-foreground`, and `--destructive` (via `Alert`) exactly as
  already defined. Emerald primary stays reserved for actions, not spent on new chrome.
- **Motion**: none new. The category-table row hover and the sticky header reuse the hover/scroll
  conventions already shipped (product-card lift, phase-4 `NavBar`'s stickiness).

## 1. Shared error display — `src/components/query-error-alert.tsx`
Wraps `Alert`/`AlertTitle`/`AlertDescription`: `<QueryErrorAlert message={...} />`. Replaces the
plain `<p className="text-destructive">…</p>` pattern in `product-grid.tsx`,
`categories-table.tsx`, `admin-product-detail-page.tsx`, and `product-form-page.tsx`.

## 2. `SiteHeader` — sticky + breadcrumb support — `src/components/site-header.tsx`
- `sticky top-0 z-30 bg-background` (matches the public `NavBar`'s stickiness from phase 4).
- New optional prop `breadcrumb?: { label: string; href?: string }[]`; when present, renders the
  shadcn `Breadcrumb` primitives instead of the plain `<h1>{title}</h1>` (last item has no `href`,
  rendered as `BreadcrumbPage`). `title` stays required as the fallback for pages without a trail.

## 3. `AdminProductsPage` — lightweight stats strip — `src/pages/admin-products-page.tsx`
Above `ProductGrid`, a single-row strip with two numbers already available with zero new
requests: total products (`useProducts`'s `data.pagination.total`, fetched with a cheap
`limit: 1` lookup) and total categories (`useCategories()`'s `data.length`). Plain text pairs,
divided by a `Separator`, not clickable KPI cards.

## 4. `ProductGrid` — `src/features/products/_components/product-grid.tsx`
`GRID_CLASSES`: `xl:grid-cols-3` → `xl:grid-cols-4`. Error state uses `<QueryErrorAlert />`.

## 5. `CategoriesTable` — `src/features/categories/_components/categories-table.tsx`
- Loading: real `<Table>`/`<TableRow>` skeleton (3 `Skeleton` cells per row).
- Empty state: `CreateCategoryDialog` as the trigger, matching `product-grid.tsx`'s pattern.
- Client-side name filter (`Input` above the table, `autoComplete="off"`, decorative `SearchIcon`
  marked `aria-hidden`).
- Row hover state (`hover:bg-muted/50`); name/slug cells truncate for unexpectedly long values.
- `<QueryErrorAlert />` instead of the plain error `<p>`.

## 6. `ProductForm` sectioning — `src/features/products/_components/product-form.tsx`
Single scrollable form (no `Tabs`). Section labels + `<Separator />` between: Basic info (name,
category) → Pricing & inventory (price, stock) → Media (images) → Description.

## 7. `ImageUploader` — drag-and-drop + real progress
Files: `image-uploader.tsx`, `api/uploads.ts`, `hooks/use-upload-images.ts`.
- `uploadImages(files, onProgress?)` passes axios's native `onUploadProgress` through `http.post`;
  `useUploadImages`'s `mutationFn` takes `{ files, onProgress }`.
- `ImageUploader` renders the `Progress` primitive (real percent) instead of a bare `Spinner`
  while uploading; thumbnails get explicit `width`/`height` on `<img>`.
- The dashed "Add images" tile is now also an HTML5 drop target (`onDragOver`/`onDrop`) alongside
  the existing click-to-pick.

## 8. Breadcrumbs on nested product pages
`admin-product-detail-page.tsx` and `product-form-page.tsx`: `SiteHeader`'s `breadcrumb` prop
replaces the one-off "All products" ghost button: `Products / {name}` (detail),
`Products / {name} / Edit` (edit), `Products / New` (create). Error states use
`<QueryErrorAlert />`.

## Files touched
`src/components/query-error-alert.tsx` (new), `src/components/site-header.tsx`,
`src/pages/admin-products-page.tsx`, `src/features/products/_components/product-grid.tsx`,
`src/features/categories/_components/categories-table.tsx`,
`src/features/products/_components/product-form.tsx`,
`src/features/products/_components/image-uploader.tsx`, `src/features/products/api/uploads.ts`,
`src/features/products/hooks/use-upload-images.ts`, `src/pages/admin-product-detail-page.tsx`,
`src/pages/product-form-page.tsx`.

## Out of scope
Category edit/delete, product search/filter (both need the backend contract confirmed first — no
`search` param exists today), a "low stock" aggregate stat (would need fetching every product or
a new backend aggregate endpoint), tabbed product form, image reordering/cropping, any change to
`product-card.tsx`, `app-sidebar.tsx`, or `admin-layout.tsx` (Phase 3 territory).

## Accessibility/UX pass
Ran the `web-design-guidelines` skill against every changed/new file and fixed what it flagged:
a decorative icon in `QueryErrorAlert` and the categories filter's `SearchIcon` needed
`aria-hidden="true"`, the filter `Input` needed `autoComplete="off"`, the category name/slug
cells needed `truncate`, and the image-uploader thumbnails needed explicit `width`/`height`.

## Verification
1. `npm run build` (tsc + vite) and `npm run lint` pass — done, clean.
2. `npm run dev`, sign in as admin (not run live in the session that authored this — verified via
   `tsc --noEmit`, build, lint, and an unauthenticated check that `/admin` still redirects
   correctly to the newly-styled `/sign-in` with no console errors):
   - `/admin`: stats strip shows correct totals, grid goes to 4 columns on a wide viewport, header
     stays visible while scrolling a long list.
   - `/admin/categories`: table-shaped skeleton, name filter works, empty state has a working
     "Create category" trigger, row hover.
   - Product create/edit form: sections visually separated, still validates and submits.
   - Image upload: drag-and-drop works, progress bar shows real percent.
   - Product detail/edit pages: breadcrumb trail replaces the old back button and navigates
     correctly; every error state renders through `QueryErrorAlert`.
3. Ran the `web-design-guidelines` skill against the touched files and resolved its findings.
