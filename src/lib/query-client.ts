import { QueryClient } from '@tanstack/react-query'

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
