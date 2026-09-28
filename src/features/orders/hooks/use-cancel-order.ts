import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orderKeys } from '@/lib/query-keys'
import { cancelOrder } from '../api/orders'
import type { Order } from '../types/orders'

/**
 * useCancelOrder — mutation hook for PATCH /api/orders/:orderId/cancel.
 * Seeds the "my orders" cache straight from the response, since the backend
 * returns the full updated order.
 * @returns TanStack mutation result: call `mutate(orderId)`.
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.mine(), (orders: Order[] | undefined) =>
        orders?.map((existing) => (existing.id === order.id ? order : existing)),
      )
    },
  })
}
