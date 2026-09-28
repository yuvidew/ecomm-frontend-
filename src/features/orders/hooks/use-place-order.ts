import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartKeys, orderKeys } from '@/lib/query-keys'
import { placeOrder } from '../api/orders'

/**
 * usePlaceOrder — mutation hook for POST /api/orders. The backend converts
 * the caller's current cart into the order and clears it, so both the
 * orders list and the cart need to be refetched afterward.
 * @returns TanStack mutation result: call `mutate({ shippingAddress })`.
 */
export const usePlaceOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: placeOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.mine() })
      queryClient.invalidateQueries({ queryKey: cartKeys.cart() })
    },
  })
}
