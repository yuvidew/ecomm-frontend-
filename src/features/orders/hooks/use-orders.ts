import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/use-session'
import { orderKeys } from '@/lib/query-keys'
import { getOrders } from '../api/orders'

/**
 * useOrders — query hook for GET /api/orders. Disabled while signed out,
 * since the endpoint requires a JWT and would otherwise 401.
 * @returns TanStack query result whose `data` is the caller's own orders.
 */
export const useOrders = () => {
  const { session } = useSession()

  return useQuery({
    queryKey: orderKeys.mine(),
    queryFn: getOrders,
    enabled: !!session,
  })
}
