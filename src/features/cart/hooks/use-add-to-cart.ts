import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartKeys } from '@/lib/query-keys'
import { addToCart } from '../api/cart'

/**
 * useAddToCart — mutation hook for POST /api/cart. Seeds the cart cache
 * straight from the response, since the backend already returns the full
 * updated cart.
 * @returns TanStack mutation result: call `mutate({ productId, quantity? })`.
 */
export const useAddToCart = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addToCart,
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.cart(), cart)
    },
  })
}
