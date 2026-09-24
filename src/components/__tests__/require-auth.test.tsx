import { screen, waitFor } from '@testing-library/react'
import { http as mswHttp, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { RequireAuth } from '../require-auth'
import { authKeys } from '@/lib/query-keys'
import { createTestQueryClient, renderWithProviders } from '@/test/render'
import type { AuthSession } from '@/types/auth'
import { server } from '@/test/server'

const BASE_URL = 'http://localhost:5000'

const renderProtectedRoute = (options: { role?: string; route?: string; session?: AuthSession } = {}) => {
  const queryClient = createTestQueryClient()
  // seed the cache before mount so useSession sees data immediately (staleTime: Infinity,
  // refetchOnMount: false means it won't be overwritten by a later queryFn resolution)
  if (options.session) {
    queryClient.setQueryData(authKeys.session, options.session)
  }

  return renderWithProviders(
    <Routes>
      <Route
        path="/protected"
        element={
          <RequireAuth role={options.role}>
            <div>Protected content</div>
          </RequireAuth>
        }
      />
      <Route path="/sign-in" element={<div>Sign in page</div>} />
      <Route path="/" element={<div>Home page</div>} />
    </Routes>,
    { route: options.route ?? '/protected', queryClient },
  )
}

describe('RequireAuth', () => {
  it('shows a spinner while the session bootstrap is loading', async () => {
    // never-resolving handler keeps useSession() in its loading state
    server.use(mswHttp.post(`${BASE_URL}/api/auth/refresh-token`, () => new Promise(() => {})))

    renderProtectedRoute()

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('redirects an unauthenticated user to /sign-in', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/refresh-token`, () =>
        HttpResponse.json({ message: 'No refresh token required' }, { status: 401 }),
      ),
    )

    renderProtectedRoute()

    await waitFor(() => expect(screen.getByText('Sign in page')).toBeInTheDocument())
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders the protected children for an authenticated user when no role is required', async () => {
    renderProtectedRoute({
      session: { accessToken: 'tok', user: { id: 1, email: 'ada@example.com', role: 'customer' } },
    })

    await waitFor(() => expect(screen.getByText('Protected content')).toBeInTheDocument())
  })

  it('renders the protected children for an authenticated user whose role matches the required role', async () => {
    renderProtectedRoute({
      role: 'admin',
      session: { accessToken: 'tok', user: { id: 1, email: 'root@example.com', role: 'admin' } },
    })

    await waitFor(() => expect(screen.getByText('Protected content')).toBeInTheDocument())
  })

  it('redirects an authenticated user with the wrong role to "/"', async () => {
    renderProtectedRoute({
      role: 'admin',
      session: { accessToken: 'tok', user: { id: 1, email: 'ada@example.com', role: 'customer' } },
    })

    await waitFor(() => expect(screen.getByText('Home page')).toBeInTheDocument())
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })
})
