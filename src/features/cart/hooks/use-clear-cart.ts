import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartKeys } from '@/lib/query-keys'
import { clearCart } from '../api/cart'

/**
 * useClearCart — mutation hook for DELETE /api/cart. The response is just
 * `{ message }`, so seed the cache with the known-empty cart directly.
 * @returns TanStack mutation result: call `mutate()`.
 */
export const useClearCart = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      queryClient.setQueryData(cartKeys.cart(), { items: [], total: 0 })
    },
  })
}
