import { screen, waitFor } from '@testing-library/react'
import { http as mswHttp, HttpResponse } from 'msw'
import { NavBar } from '../nav-bar'
import { authKeys } from '@/lib/query-keys'
import { createTestQueryClient, renderWithProviders } from '@/test/render'
import type { AuthSession } from '@/types/auth'
import { server } from '@/test/server'

const BASE_URL = 'http://localhost:5000'

const stubCategories = () =>
  server.use(mswHttp.get(`${BASE_URL}/api/categories`, () => HttpResponse.json({ categories: [] })))

const renderNavBar = (session?: AuthSession) => {
  stubCategories()
  const queryClient = createTestQueryClient()
  // seed the cache before mount so useSession sees the session immediately (staleTime:
  // Infinity, refetchOnMount: false means it won't be overwritten by a later bootstrap call)
  if (session) {
    queryClient.setQueryData(authKeys.session, session)
  }
  return renderWithProviders(<NavBar />, { queryClient })
}

describe('NavBar', () => {
  it('shows sign-in/sign-up links and no account info when signed out', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/refresh-token`, () =>
        HttpResponse.json({ message: 'No refresh token required' }, { status: 401 }),
      ),
    )
    renderNavBar()

    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create account' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()
  })

  it("shows the signed-in user's email and a log-out button, but no Admin link, for a customer session", async () => {
    renderNavBar({ accessToken: 'tok', user: { id: 1, email: 'ada@example.com', role: 'customer' } })

    await waitFor(() => expect(screen.getByText('ada@example.com')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('shows an Admin link for an admin session', async () => {
    renderNavBar({ accessToken: 'tok', user: { id: 1, email: 'root@example.com', role: 'admin' } })

    await waitFor(() => expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument())
  })
})
