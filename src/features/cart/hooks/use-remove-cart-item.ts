import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartKeys } from '@/lib/query-keys'
import { removeCartItem } from '../api/cart'

/**
 * useRemoveCartItem — mutation hook for DELETE /api/cart/:itemId. Seeds the
 * cart cache straight from the response.
 * @returns TanStack mutation result: call `mutate(itemId)`.
 */
export const useRemoveCartItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.cart(), cart)
    },
  })
}
