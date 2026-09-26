import { QueryClient } from '@tanstack/react-query'
import { persistAuthSession } from './auth-storage'
import { authKeys } from './query-keys'
import type { AuthSession } from '@/types/auth'

/**
 * queryClient — single shared TanStack Query client for the app.
 * All feature `hooks/` files read/write against this instance via
 * `useQuery`/`useMutation`; don't create separate QueryClients per feature.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// keeps localStorage in sync with the session cache -- covers sign-in, the
// bootstrap refresh, the 401 silent refresh, and logout in one place, since
// they all write through this same query cache entry
queryClient.getQueryCache().subscribe((event) => {
  // only settled fetches -- the 'fetch' event fired when a query starts has
  // `data` still undefined, which would otherwise wipe the localStorage
  // fallback before bootstrapSession() gets a chance to read it back
  if (
    event.type === 'updated' &&
    event.query.state.fetchStatus === 'idle' &&
    event.query.queryKey.join('.') === authKeys.session.join('.')
  ) {
    persistAuthSession((event.query.state.data as AuthSession | null | undefined) ?? null)
  }
})
