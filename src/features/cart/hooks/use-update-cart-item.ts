import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartKeys } from '@/lib/query-keys'
import { updateCartItem } from '../api/cart'

/**
 * useUpdateCartItem — mutation hook for PUT /api/cart/:itemId. Seeds the
 * cart cache straight from the response.
 * @returns TanStack mutation result: call `mutate({ itemId, input: { quantity } })`.
 */
export const useUpdateCartItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCartItem,
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.cart(), cart)
    },
  })
}
