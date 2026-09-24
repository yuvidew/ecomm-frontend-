import { useQuery } from '@tanstack/react-query'
import { authKeys } from '@/lib/query-keys'
import { refreshSession } from '../api/auth'

/**
 * useSession — the app-wide session read. Its query function doubles as the
 * one-time app-load bootstrap call (POST /api/auth/refresh-token); after
 * that, the cache is only ever written by sign-in/logout/the axios
 * interceptor, never refetched, so `staleTime` is infinite.
 * @returns `session` (null when signed out) and `isLoading` for the initial bootstrap.
 */
export const useSession = () => {
  const { data, isLoading } = useQuery({
    queryKey: authKeys.session,
    queryFn: refreshSession,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  return { session: data ?? null, isLoading }
}
