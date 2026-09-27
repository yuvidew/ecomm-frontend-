import { useInfiniteQuery } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/use-session'
import { favoriteKeys } from '@/lib/query-keys'
import { getFavorites } from '../api/favorites'

/**
 * useFavorites — query hook for GET /api/favorites. The backend returns the
 * whole list in one response (no page/cursor params), so this is wired as a
 * single-page `useInfiniteQuery` — `getNextPageParam` always returns
 * `undefined`, so `hasNextPage` stays `false`. Keeping the infinite-query
 * shape now means only `getFavorites`/`getNextPageParam` need to change if
 * the backend later adds real pagination. Disabled while signed out, since
 * the endpoint requires a JWT and would otherwise 401.
 * @returns TanStack infinite query result plus a flattened `favorites` array.
 */
export const useFavorites = () => {
  const { session } = useSession()

  const query = useInfiniteQuery({
    queryKey: favoriteKeys.list(),
    queryFn: getFavorites,
    initialPageParam: undefined as void,
    getNextPageParam: () => undefined,
    enabled: !!session,
  })

  const favorites = query.data?.pages.flatMap((page) => page) ?? []

  return { ...query, favorites }
}
