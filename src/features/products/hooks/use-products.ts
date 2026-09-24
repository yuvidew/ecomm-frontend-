import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { productKeys } from '@/lib/query-keys'
import { listProducts } from '../api/products'
import type { ListProductsParams } from '../types/products'

/**
 * useProducts — query hook for GET /api/products. Keeps the previous page
 * on screen while the next one loads, so pagination doesn't flash.
 * @param params - page and page size
 * @returns TanStack query result with `data.products` and `data.pagination`.
 */
export const useProducts = (params: ListProductsParams) => {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => listProducts(params),
    placeholderData: keepPreviousData,
  })
}
