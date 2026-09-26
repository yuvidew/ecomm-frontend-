import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productKeys, reviewKeys } from '@/lib/query-keys'
import { updateReview } from '../api/reviews'
import type { UpdateReviewInput } from '../types/reviews'

/**
 * useUpdateReview — mutation hook for PUT /api/reviews/:id. `productId` isn't
 * sent to the backend — it's only used to invalidate that product's review
 * list and detail (avg_rating/num_reviews) after a successful edit.
 * @returns TanStack mutation result: call `mutate({ id, productId, input })`.
 */
export const useUpdateReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; productId: number; input: UpdateReviewInput }) =>
      updateReview({ id, input }),
    onSuccess: (_review, { productId }) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.listsByProduct(productId) })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) })
    },
  })
}
