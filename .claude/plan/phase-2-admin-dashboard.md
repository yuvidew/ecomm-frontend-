# Phase 2 — Admin Dashboard (products + categories)

## Context

The backend now has category list/create, product CRUD, and image upload to Appwrite. The
user wants admins sent to an admin dashboard after sign-in. The dashboard lists products as
cards, and each card opens a product details page. Admins can create, edit and delete
products and manage categories. The shell comes from shadcn `dashboard-01`, trimmed down to
the sidebar and header.

### Backend fixes the user is making (prerequisites, don't touch the backend)

| # | Bug | Effect until fixed |
|---|-----|--------------------|
| 1 | `category.routes.ts` registers create as `router.get("/")` | `POST /api/categories` returns 404 |
| 2 | `product.service.createProduct` has `if (!existingProducts) throw 409` (inverted) | every product create returns 409 |
| 3 | `product.repository.deleteProduct` runs `DELETE FROM product` | delete returns 500 |
| 4 | createProduct's missing-category error uses `messages:` (typo) | shows "Internal Server Error" |
| 5 ✅ fixed | **`auth.service.signin` calls `issueTokens(user.id, email, role)` with the role from the request body** | the frontend sends `"customer"`, so the JWT says customer. `authorize("admin")` then returns 403 on every admin call, even though the response body says `role: "admin"`. Fix: `issueTokens(user.id, email, user.role)`. |
| — | Delete route is now `router.delete("/:id")` ✅ | already done |

Known and unchanged from phase 1: refresh-token signing bug, so a hard reload drops the
session and the admin has to sign in again.

## API contracts (from the backend source)

- `GET /api/categories` → `200 { categories: Category[] }`, where `Category = { id, name, slug, created_at }`
- `POST /api/categories` (admin) body `{ name }` (min 2) → `200 { id, name, slug }`; 409 if it already exists
- `GET /api/products?page&limit&categoryId&search` → `200 { products: Product[], pagination: { page, limit, total, totalPages } }`
- `GET /api/products/:id` → `200 Product`; 404
- `POST /api/products` (admin) body `{ categoryId:number, name, description?, price:number>0, stock:int>=0, images?: url[] }` → `201 Product`
- `PUT /api/products/:id` (admin), all body fields optional → `200 Product`. **If `images` is sent, it replaces all existing images**, so the form always sends the full current list.
- `DELETE /api/products/:id` (admin) → `200 { message }`
- `POST /api/uploads/images` (admin), multipart field `images`, up to 10 files, 5 MB each, `image/*` only → `200 { images: string[] }`
- `Product = { id, category_id, name, slug, description: string|null, price: string /* DECIMAL */, stock, created_at, updated_at, images: string[] }`, in snake_case exactly as the DB row returns it
- Errors: `{ message }`, or `{ message, errors }` for a 400 validation failure

## Auth changes (role handling)

- The frontend still sends `role: "customer"` because the backend's signin zod schema
  requires the field. No role picker is added.
- `session.user.role` keeps coming from the decoded JWT (`src/lib/jwt.ts`). That is the
  claim the backend authorizes on, and it's the only role source after a refresh-token
  call. Once bug #5 is fixed, it matches the `role` in the response body.
- Add `role: string` to `SignInResponse` in `src/features/auth/types/auth.ts`.
- `sign-in-form.tsx` `onSuccess`: go to `/admin` if the decoded role is `"admin"`,
  otherwise `/`. Read it from the session that `useSignIn` just wrote.
- `src/components/require-auth.tsx`: add an optional `role?: string` prop instead of
  creating a second guard. If signed out, go to `/sign-in` as before. If signed in with the
  wrong role, `<Navigate to="/" replace />`.

## shadcn `dashboard-01`: install, then trim

1. `npx shadcn@latest add dashboard-01`. **Don't overwrite** existing `src/components/ui/*`
   primitives when prompted.
2. Keep and adapt: `app-sidebar.tsx`, `nav-main.tsx`, `nav-user.tsx`, `site-header.tsx`
   (in `src/components/`).
3. Delete: `chart-area-interactive`, `data-table`, `section-cards`, `nav-documents`,
   `nav-secondary`, and the generated `app/dashboard/page.tsx` + `data.json`.
4. Uninstall the deps only those used: `@dnd-kit/*`, `@tanstack/react-table`, and `zod`
   (if it was newly added and nothing else uses it).
5. Convert the kept files to the project conventions: arrow functions, `@param` doc
   comments, and `react-router` `Link`/`NavLink` instead of `<a href>`.
   - `AppSidebar` links: **Products** (`/admin`) and **Categories** (`/admin/categories`)
   - `NavUser`: `session.user.email` + a Log out item using the existing `useLogout`
   - `SiteHeader`: page title passed as a prop

## Routes (`src/app/router.tsx`)

`/admin` is a new top-level layout route, a sibling of the existing `RootLayout` group:

```
/admin                     AdminProductsPage      product card grid + "New product"
/admin/products/new        ProductFormPage        create
/admin/products/:id        AdminProductDetailPage images, details, Edit/Delete
/admin/products/:id/edit   ProductFormPage        edit (prefilled)
/admin/categories          AdminCategoriesPage    table + "New category" dialog
```

`src/app/admin-layout.tsx`: `<RequireAuth role="admin">` › `TooltipProvider` › `SidebarProvider` ›
`AppSidebar` + `SidebarInset` › `<Outlet />`. Each page renders its own `SiteHeader` (title +
actions such as "New product"), so the layout doesn't need to know page titles.

## Feature folders

### `src/features/categories/`
- `types/categories.ts`: `Category`, `ListCategoriesResponse`, `CreateCategoryInput`, `CreateCategoryResponse`
- `api/categories.ts`: `listCategories()`, `createCategory(input)`
- `hooks/use-categories.ts`: `useQuery(categoryKeys.list)`
- `hooks/use-create-category.ts`: mutation; `onSuccess` invalidates `categoryKeys.all`
- `_components/categories-table.tsx`: shadcn `Table` (name, slug, created date), with `Empty` and `Skeleton` states
- `_components/create-category-dialog.tsx`: `Dialog` + `Field`/`Input`; shows the 400 field error or the 409 message; toast and close on success

### `src/features/products/`
- `types/products.ts`: `Product`, `Pagination`, `ListProductsParams`, `ListProductsResponse`, `ProductInput` (the create/update body), `DeleteProductResponse`, `UploadImagesResponse`
- `api/products.ts`: `listProducts(params)`, `getProduct(id)`, `createProduct(input)`, `updateProduct(id, input)`, `deleteProduct(id)`
- `api/uploads.ts`: `uploadImages(files: File[])` builds a `FormData` with an `images` field per file and returns `string[]`
- `hooks/use-products.ts`: `useQuery(productKeys.list(params))` with `placeholderData: keepPreviousData` so paging doesn't flash
- `hooks/use-product.ts`: `useQuery(productKeys.detail(id))`
- `hooks/use-create-product.ts` / `use-update-product.ts`: `onSuccess` calls `setQueryData(detail)` and invalidates `productKeys.lists()`
- `hooks/use-delete-product.ts`: `onSuccess` calls `removeQueries(detail)` and invalidates the lists
- `hooks/use-upload-images.ts`: mutation around `uploadImages`
- `_components/product-card.tsx`: `Card` with the first image in `AspectRatio` (placeholder icon if there are no images), name, formatted price, a stock `Badge`; the whole card `Link`s to the detail page
- `_components/product-grid.tsx`: responsive grid of cards, a `Skeleton` grid while loading, `Empty` with a "Create product" CTA, and shadcn `Pagination` driven by `pagination.totalPages` (`?page=` kept in the URL via `useSearchParams`)
- `_components/product-details.tsx`: `Carousel` of images, name, category name (looked up from `useCategories`), price, stock, description, dates
- `_components/delete-product-dialog.tsx`: `AlertDialog` confirm → `useDeleteProduct`; on success, toast and navigate to `/admin`
- `_components/product-form.tsx`: **one form for create and edit** (optional `product` prop). Controlled state, the same pattern as the auth forms: name `Input`, category `Select` (from `useCategories`), price `Input type=number step=0.01`, stock `Input type=number`, description `Textarea`, and `ImageUploader`. Submit converts price and stock to numbers and always sends `images`. Shows 400 errors per field and other errors as one message.
- `_components/image-uploader.tsx`: file input (`multiple`, `accept="image/*"`). Checks client-side for 5 MB per file and 10 per batch, uploads right away via `useUploadImages`, shows a thumbnail grid with a remove button and a spinner while uploading. The value is a `string[]` of URLs.

### Pages (`src/pages/`)
`admin-products-page.tsx`, `admin-product-detail-page.tsx`, `product-form-page.tsx` (it
reads `:id`; if an id is present it loads `useProduct` and renders the form in edit mode),
`admin-categories-page.tsx`.

### Shared / lib
- `src/lib/query-keys.ts`: add
  `productKeys = { all: ['products'], lists: () => ['products','list'], list: (p) => ['products','list',p], detail: (id) => ['products','detail',id] }`
  and `categoryKeys = { all: ['categories'], list: ['categories','list'] }`
- `src/lib/http.ts`: add `getApiFieldErrors(error)` for the zod `errors` map and switch
  `sign-up-form.tsx` to use it, so the product form, category dialog and sign-up form don't
  each carry their own copy
- `src/lib/format.ts`: `formatPrice(price: string | number)` using `Intl.NumberFormat`, with
  one `CURRENCY` constant (default `"INR"`, change it in one place)

Existing code to reuse: `http`, `getApiErrorMessage` (`src/lib/http.ts`), `useSession`,
`useLogout`, `RequireAuth`, and the ui primitives `card`, `aspect-ratio`, `badge`,
`carousel`, `pagination`, `empty`, `skeleton`, `select`, `textarea`, `dialog`,
`alert-dialog`, `table`, `sidebar`, `field`, `spinner`, and `sonner`. No new shadcn
primitives are needed beyond what `dashboard-01` pulls in.

## Sequencing
1. Save the plan file. Update the auth types, sign-in redirect and `RequireAuth` role prop.
2. `query-keys`, `http.getApiFieldErrors` (+ the sign-up refactor), `format.ts`.
3. Install `dashboard-01`, trim it, convert it to conventions. Add `admin-layout.tsx` and the routes.
4. Categories feature and page.
5. Products api/hooks, then card, grid and list page, then detail page and delete, then image uploader, form and create/edit pages.

## Out of scope
- Search and category filter on the product list (the backend supports them; add later)
- Public/customer storefront product pages
- Category edit/delete (no backend endpoints)
- Reordering images, and deleting Appwrite files when images are removed
- Any backend change (the user owns the fixes listed above)

## Verification
1. `npm run build` (runs `tsc -b`) and `npm run lint` are clean.
2. `npm run dev`. Sign in with the admin account: it should land on `/admin`. A customer
   account lands on `/`, and visiting `/admin` as a customer redirects to `/`.
3. In DevTools, decode the token's `role`. If admin calls return 403, backend bug #5 is still
   unfixed.
4. Categories: create one. It appears in the table, and a duplicate shows the 409 message.
5. Products: create one with 2 images. The card appears in the grid. Open it: the carousel
   and details are right. Edit it: change the price, remove one image, add another, then save
   and check the detail page updates. Delete it: confirm, go back to `/admin`, and the card is
   gone.
6. Upload a file over 5 MB or a non-image: it should be blocked client-side with a message.
