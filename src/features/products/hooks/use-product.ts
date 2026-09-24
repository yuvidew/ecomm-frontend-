import { useQuery } from '@tanstack/react-query'
import { productKeys } from '@/lib/query-keys'
import { getProduct } from '../api/products'

/**
 * useProduct — query hook for GET /api/products/:id.
 * @param id - product id; the query stays disabled until it's a valid number
 * @returns TanStack query result whose `data` is the product.
 */
export const useProduct = (id: number) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProduct(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}
