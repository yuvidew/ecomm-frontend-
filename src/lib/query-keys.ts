/**
 * authKeys — TanStack Query keys for the auth feature, shared between
 * `src/features/auth/hooks/` and `src/lib/http.ts` (the axios interceptors
 * read/write the session cache directly, outside of React).
 */
export const authKeys = {
  session: ['auth', 'session'] as const,
}

/** productKeys — TanStack Query keys for the products feature. */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: { page: number; limit: number; categoryId?: number; search?: string }) =>
    [...productKeys.lists(), params] as const,
  detail: (id: number) => [...productKeys.all, 'detail', id] as const,
}

/** categoryKeys — TanStack Query keys for the categories feature. */
export const categoryKeys = {
  all: ['categories'] as const,
  list: ['categories', 'list'] as const,
}

/** reviewKeys — TanStack Query keys for the reviews feature. */
export const reviewKeys = {
  all: ['reviews'] as const,
  listsByProduct: (productId: number) => [...reviewKeys.all, 'product', productId] as const,
  listByProduct: (productId: number, params: { page: number; limit: number }) =>
    [...reviewKeys.listsByProduct(productId), params] as const,
}
