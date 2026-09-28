import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/use-session'
import { orderKeys } from '@/lib/query-keys'
import { getAllOrders } from '../api/orders'

/**
 * useAllOrders — query hook for GET /api/orders/admin. Disabled unless the
 * signed-in user is an admin, since the endpoint 403s otherwise.
 * @returns TanStack query result whose `data` is every user's orders.
 */
export const useAllOrders = () => {
  const { session } = useSession()

  return useQuery({
    queryKey: orderKeys.admin(),
    queryFn: getAllOrders,
    enabled: session?.user.role === 'admin',
  })
}
