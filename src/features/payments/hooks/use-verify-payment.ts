import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Order } from '@/features/orders/types/orders'
import { orderKeys, paymentKeys } from '@/lib/query-keys'
import { verifyPayment } from '../api/payments'
import type { PaymentRow } from '../types/payments'

/**
 * useVerifyPayment — mutation hook for POST /api/payments/:transactionRef/verify.
 * Patches the one payment row in place, and — since a `"success"` verification
 * also flips the order to `"paid"` server-side without that change appearing in
 * this response — patches the cached order in both the customer and admin order
 * lists to match, so the UI reflects it without a refetch.
 * @returns TanStack mutation result: call `mutate({ transactionRef, simulate })`.
 */
export const useVerifyPayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: verifyPayment,
    onSuccess: (payment) => {
      queryClient.setQueryData(paymentKeys.byOrder(payment.order_id), (rows: PaymentRow[] | undefined) =>
        rows?.map((row) => (row.id === payment.id ? payment : row)) ?? [payment],
      )

      if (payment.status === 'success') {
        const markPaid = (orders: Order[] | undefined) =>
          orders?.map((order) => (order.id === payment.order_id ? { ...order, status: 'paid' as const } : order))

        queryClient.setQueryData(orderKeys.mine(), markPaid)
        queryClient.setQueryData(orderKeys.admin(), markPaid)
      }
    },
  })
}
