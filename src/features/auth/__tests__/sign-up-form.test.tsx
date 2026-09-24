import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http as mswHttp, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import { SignUpForm } from '../_components/sign-up-form'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'

const BASE_URL = 'http://localhost:5000'

const renderSignUpForm = () =>
  renderWithProviders(
    <Routes>
      <Route path="/sign-up" element={<SignUpForm />} />
      <Route path="/sign-in" element={<div>Sign in page</div>} />
    </Routes>,
    { route: '/sign-up' },
  )

const fillForm = async (values: { name: string; email: string; password: string; confirmPassword: string }) => {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Full Name'), values.name)
  await user.type(screen.getByLabelText('Email'), values.email)
  await user.type(screen.getByLabelText('Password'), values.password)
  await user.type(screen.getByLabelText('Confirm Password'), values.confirmPassword)
  await user.click(screen.getByRole('button', { name: 'Create Account' }))
}

describe('SignUpForm', () => {
  it('signs up, toasts success, and navigates to /sign-in (no auto-login)', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-up`, () =>
        HttpResponse.json({ message: 'Account is creted successfully' }, { status: 201 }),
      ),
    )
    renderSignUpForm()

    await fillForm({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'password1', confirmPassword: 'password1' })

    await waitFor(() => expect(screen.getByText('Sign in page')).toBeInTheDocument())
    expect(await screen.findByText('Account created -- sign in to continue')).toBeInTheDocument()
  })

  it('shows a client-side "Passwords don\'t match." error and does not submit when confirmation differs', async () => {
    let requested = false
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-up`, () => {
        requested = true
        return HttpResponse.json({ message: 'Account is creted successfully' }, { status: 201 })
      }),
    )
    renderSignUpForm()

    await fillForm({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'password1', confirmPassword: 'password2' })

    expect(await screen.findByRole('alert')).toHaveTextContent("Passwords don't match.")
    expect(requested).toBe(false)
  })

  it('maps a 400 { message, errors } response onto the matching form fields', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-up`, () =>
        HttpResponse.json(
          {
            message: 'Validation failed',
            errors: { email: ['Invalid email address'], password: ['Name must be 8 charachter'] },
          },
          { status: 400 },
        ),
      ),
    )
    renderSignUpForm()

    // values are HTML5-valid (satisfy the inputs' own required/type/minLength constraints) so the
    // form actually submits; the 400 body is what simulates the backend rejecting them
    await fillForm({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'password1', confirmPassword: 'password1' })

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument()
    expect(screen.getByText('Name must be 8 charachter')).toBeInTheDocument()
  })

  it('shows "Email already registered" on a 409', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-up`, () =>
        HttpResponse.json({ message: 'Email already registered' }, { status: 409 }),
      ),
    )
    renderSignUpForm()

    await fillForm({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'password1', confirmPassword: 'password1' })

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered')
  })

  it('disables the submit button and shows a spinner while the request is pending', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/auth/sign-up`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 30))
        return HttpResponse.json({ message: 'Account is creted successfully' }, { status: 201 })
      }),
    )
    renderSignUpForm()

    await fillForm({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'password1', confirmPassword: 'password1' })

    // the spinner's "Loading" label is prepended to the button's accessible name while pending
    expect(screen.getByRole('button', { name: /Create Account/ })).toBeDisabled()
    expect(screen.getByRole('status')).toBeInTheDocument()

    await waitFor(() => expect(screen.getByText('Sign in page')).toBeInTheDocument())
  })
})
