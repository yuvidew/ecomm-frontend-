import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/use-session'
import { paymentKeys } from '@/lib/query-keys'
import { getOrderPayments } from '../api/payments'

/**
 * useOrderPayments — query hook for GET /api/payments/order/:orderId. Serves
 * both the customer's own pay page and the admin payments dialog, since the
 * backend itself allows owner-or-admin access.
 * @param orderId - order whose payment attempt history to fetch
 * @returns TanStack query result whose `data` is the order's payment attempts, newest first.
 */
export const useOrderPayments = (orderId: number) => {
  const { session } = useSession()

  return useQuery({
    queryKey: paymentKeys.byOrder(orderId),
    queryFn: () => getOrderPayments(orderId),
    enabled: !!session && Number.isFinite(orderId),
  })
}
