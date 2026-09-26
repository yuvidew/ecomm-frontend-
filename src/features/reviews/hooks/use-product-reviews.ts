import { useQuery } from '@tanstack/react-query'
import { reviewKeys } from '@/lib/query-keys'
import { listProductReviews } from '../api/reviews'
import type { ListReviewsParams } from '../types/reviews'

/**
 * useProductReviews — query hook for GET /api/reviews/product/:productId.
 * @param productId - product id; the query stays disabled until it's a valid number
 * @param params - page/limit for the review list
 * @returns TanStack query result whose `data` is `{ reviews, pagination }`.
 */
export const useProductReviews = (productId: number, params: ListReviewsParams) => {
  return useQuery({
    queryKey: reviewKeys.listByProduct(productId, params),
    queryFn: () => listProductReviews(productId, params),
    enabled: Number.isInteger(productId) && productId > 0,
  })
}
