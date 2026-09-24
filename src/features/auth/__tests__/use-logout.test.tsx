import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http as mswHttp, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { useLogout } from '../hooks/use-logout'
import { authKeys } from '@/lib/query-keys'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'

const BASE_URL = 'http://localhost:5000'

const LogoutHarness = () => {
  const { mutate } = useLogout()
  return (
    <button type="button" onClick={() => mutate()}>
      Log out
    </button>
  )
}

const renderLogoutHarness = () =>
  renderWithProviders(
    <Routes>
      <Route path="/" element={<LogoutHarness />} />
      <Route path="/sign-in" element={<div>Sign in page</div>} />
    </Routes>,
    { route: '/' },
  )

describe('useLogout', () => {
  it('clears the session cache and navigates to /sign-in when the logout call succeeds', async () => {
    server.use(mswHttp.post(`${BASE_URL}/api/auth/logout`, () => HttpResponse.json({ message: 'Logged ou successfully' })))
    const user = userEvent.setup()
    const { queryClient } = renderLogoutHarness()
    queryClient.setQueryData(authKeys.session, { accessToken: 'tok', user: { id: 1, email: 'a@b.com', role: 'customer' } })

    await user.click(screen.getByRole('button', { name: 'Log out' }))

    await waitFor(() => expect(screen.getByText('Sign in page')).toBeInTheDocument())
    expect(queryClient.getQueryData(authKeys.session)).toBeNull()
  })

  it('still clears the session and navigates to /sign-in when the network call fails', async () => {
    server.use(mswHttp.post(`${BASE_URL}/api/auth/logout`, () => HttpResponse.json({ message: 'Server error' }, { status: 500 })))
    const user = userEvent.setup()
    const { queryClient } = renderLogoutHarness()
    queryClient.setQueryData(authKeys.session, { accessToken: 'tok', user: { id: 1, email: 'a@b.com', role: 'customer' } })

    await user.click(screen.getByRole('button', { name: 'Log out' }))

    await waitFor(() => expect(screen.getByText('Sign in page')).toBeInTheDocument())
    expect(queryClient.getQueryData(authKeys.session)).toBeNull()
  })
})
