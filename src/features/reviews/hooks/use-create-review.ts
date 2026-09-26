import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productKeys, reviewKeys } from '@/lib/query-keys'
import { createReview } from '../api/reviews'

/**
 * useCreateReview — mutation hook for POST /api/reviews. Refetches the
 * product's review list and its detail (avg_rating/num_reviews live there).
 * @returns TanStack mutation result: call `mutate({ productId, rating, comment })`.
 */
export const useCreateReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createReview,
    onSuccess: (_review, input) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.listsByProduct(input.productId) })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(input.productId) })
    },
  })
}
