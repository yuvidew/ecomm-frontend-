import { useQuery } from '@tanstack/react-query'
import { readStoredSession } from '@/lib/auth-storage'
import { authKeys } from '@/lib/query-keys'
import { refreshSession } from '../api/auth'

// app-load bootstrap: prefer a fresh token from the refresh cookie, else fall
// back to the unexpired access token kept in localStorage so a hard refresh
// doesn't sign the user out
const bootstrapSession = async () => (await refreshSession()) ?? readStoredSession()

/**
 * useSession — the app-wide session read. Its query function doubles as the
 * one-time app-load bootstrap call (POST /api/auth/refresh-token, with a
 * localStorage fallback); after that, the cache is only ever written by
 * sign-in/logout/the axios interceptor, never refetched, so `staleTime` is infinite.
 * @returns `session` (null when signed out) and `isLoading` for the initial bootstrap.
 */
export const useSession = () => {
  const { data, isLoading } = useQuery({
    queryKey: authKeys.session,
    queryFn: bootstrapSession,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  return { session: data ?? null, isLoading }
}
