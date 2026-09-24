import type { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ThemeProvider } from '@/components/theme-provider'
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
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
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
