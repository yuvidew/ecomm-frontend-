import { useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentKeys } from '@/lib/query-keys'
import { initiatePayment } from '../api/payments'
import type { PaymentRow } from '../types/payments'

/**
 * useInitiatePayment — mutation hook for POST /api/payments/. Prepends the new
 * attempt to the order's payment history cache, since the list is newest-first
 * and this row is provably the newest.
 * @returns TanStack mutation result: call `mutate({ orderId, method })`.
 */
export const useInitiatePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: initiatePayment,
    onSuccess: (payment) => {
      queryClient.setQueryData(paymentKeys.byOrder(payment.order_id), (rows: PaymentRow[] | undefined) =>
        rows ? [payment, ...rows] : [payment],
      )
    },
  })
}
