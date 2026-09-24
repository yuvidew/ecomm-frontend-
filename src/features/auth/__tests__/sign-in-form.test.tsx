import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http as mswHttp, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { SignInForm } from '../_components/sign-in-form'
import { renderWithProviders } from '@/test/render'
import { makeTestToken } from '@/test/jwt'
import { server } from '@/test/server'

const BASE_URL = 'http://localhost:5000'

const renderSignInForm = () =>
  renderWithProviders(
    <Routes>
      <Route path="/sign-in" element={<SignInForm />} />
      <Route path="/" element={<div>Home page</div>} />
      <Route path="/admin" element={<div>Admin dashboard</div>} />
    </Routes>,
    { route: '/sign-in' },
  )

const fillAndSubmit = async (email: string, password: string) => {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('SignInForm', () => {
  it('signs a customer in and redirects to "/"', async () => {
    const token = makeTestToken({ id: 1, email: 'ada@example.com', role: 'customer' })
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-in`, () =>
        HttpResponse.json({ message: 'Welcome to e-comm', accessToken: token, role: 'customer' }, { status: 201 }),
      ),
    )
    renderSignInForm()

    await fillAndSubmit('ada@example.com', 'password1')

    await waitFor(() => expect(screen.getByText('Home page')).toBeInTheDocument())
  })

  it('signs an admin in and redirects to "/admin"', async () => {
    const token = makeTestToken({ id: 1, email: 'root@example.com', role: 'admin' })
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-in`, () =>
        HttpResponse.json({ message: 'Welcome to e-comm', accessToken: token, role: 'admin' }, { status: 201 }),
      ),
    )
    renderSignInForm()

    await fillAndSubmit('root@example.com', 'password1')

    await waitFor(() => expect(screen.getByText('Admin dashboard')).toBeInTheDocument())
  })

  it('shows "Invalid email or password" on a 401 without navigating away', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-in`, () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 401 }),
      ),
    )
    renderSignInForm()

    await fillAndSubmit('ada@example.com', 'wrongpass')

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
    expect(screen.queryByText('Home page')).not.toBeInTheDocument()
  })

  it('disables the submit button and shows a spinner while the request is pending', async () => {
    const token = makeTestToken({ id: 1, email: 'ada@example.com', role: 'customer' })
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-in`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 30))
        return HttpResponse.json({ message: 'Welcome to e-comm', accessToken: token, role: 'customer' }, { status: 201 })
      }),
    )
    renderSignInForm()

    await fillAndSubmit('ada@example.com', 'password1')

    // the spinner's "Loading" label is prepended to the button's accessible name while pending
    expect(screen.getByRole('button', { name: /Sign in/ })).toBeDisabled()
    expect(screen.getByRole('status')).toBeInTheDocument()

    await waitFor(() => expect(screen.getByText('Home page')).toBeInTheDocument())
  })
})
