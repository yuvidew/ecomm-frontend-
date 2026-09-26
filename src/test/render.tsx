import type { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { Toaster } from '@/components/ui/sonner'

/**
 * createTestQueryClient — a fresh QueryClient per test, with retries disabled
 * so failed queries/mutations settle immediately instead of retrying.
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

/**
 * createProvidersWrapper — builds the same QueryClientProvider + MemoryRouter
 * + Toaster tree used by `renderWithProviders`, for use as a `renderHook`
 * wrapper where a full `render` call isn't appropriate.
 * @param queryClient - client shared between the hook and any components under test
 * @param route - initial MemoryRouter entry, defaults to "/"
 */
export const createProvidersWrapper = (queryClient: QueryClient, route = '/') => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        <Toaster />
      </QueryClientProvider>
  )
  return Wrapper
}

/**
 * renderWithProviders — wraps `ui` in a fresh QueryClientProvider, a
 * MemoryRouter, and the Sonner Toaster, mirroring the app's real provider
 * tree for the pieces components/hooks under test rely on.
 * @param ui - the element to render
 * @param options.route - initial MemoryRouter entry, defaults to "/"
 * @param options.queryClient - reuse a specific QueryClient instead of creating one
 */
export const renderWithProviders = (
  ui: ReactElement,
  options: { route?: string; queryClient?: QueryClient } = {},
) => {
  const client = options.queryClient ?? createTestQueryClient()
  const result = render(ui, { wrapper: createProvidersWrapper(client, options.route) })
  return { ...result, queryClient: client }
}

/**
 * SearchParamsProbe — renders the current URL's search string so tests can
 * assert on `?category=`/`?search=`/`?page=` etc. changes driven by
 * components under test that write via `useSearchParams`.
 */
export const SearchParamsProbe = () => {
  const location = useLocation()
  return <div data-testid="search-params-probe">{location.search}</div>
}
