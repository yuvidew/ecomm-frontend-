import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orderKeys } from '@/lib/query-keys'
import { updateOrderStatus } from '../api/orders'
import type { Order } from '../types/orders'

/**
 * useUpdateOrderStatus — mutation hook for PATCH /api/orders/:orderId/status.
 * Seeds the admin orders cache straight from the response.
 * @returns TanStack mutation result: call `mutate({ orderId, input: { status } })`.
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.admin(), (orders: Order[] | undefined) =>
        orders?.map((existing) => (existing.id === order.id ? order : existing)),
      )
    },
  })
}
