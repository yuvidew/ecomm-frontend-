import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/use-session'
import { cartKeys } from '@/lib/query-keys'
import { getCart } from '../api/cart'

/**
 * useCart — query hook for GET /api/cart. Disabled while signed out, since
 * every cart endpoint requires a JWT and would otherwise 401.
 * @returns TanStack query result whose `data` is `{ items, total }`.
 */
export const useCart = () => {
  const { session } = useSession()

  return useQuery({
    queryKey: cartKeys.cart(),
    queryFn: getCart,
    enabled: !!session,
  })
}
