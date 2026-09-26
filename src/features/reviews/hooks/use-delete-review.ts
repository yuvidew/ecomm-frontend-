import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productKeys, reviewKeys } from '@/lib/query-keys'
import { deleteReview } from '../api/reviews'

/**
 * useDeleteReview — mutation hook for DELETE /api/reviews/:id. `productId`
 * isn't sent to the backend — it's only used to invalidate that product's
 * review list and detail (avg_rating/num_reviews) after a successful delete.
 * @returns TanStack mutation result: call `mutate({ id, productId })`.
 */
export const useDeleteReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: number; productId: number }) => deleteReview(id),
    onSuccess: (_data, { productId }) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.listsByProduct(productId) })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) })
    },
  })
}
