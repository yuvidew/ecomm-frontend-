import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http as mswHttp, HttpResponse } from 'msw'
import { ReviewForm } from '../_components/review-form'
import { queryClient } from '@/lib/query-client'
import { authKeys } from '@/lib/query-keys'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import type { AuthSession } from '@/types/auth'

const BASE_URL = 'http://localhost:5000'

const session: AuthSession = { accessToken: 'test-token', user: { id: 1, email: 'ada@example.com', role: 'customer' } }

// http.ts's request interceptor reads the token from the shared `queryClient` singleton (not
// whatever client a component happens to be rendered under), so the session is seeded there and
// that same instance is threaded through renderWithProviders for the mutation hooks to share it
const renderForm = () => {
  queryClient.setQueryData(authKeys.session, session)
  return renderWithProviders(<ReviewForm productId={5} />, { queryClient })
}

describe('ReviewForm', () => {
  it('submits POST /api/reviews with { productId, rating, comment } and an auth header, then toasts success', async () => {
    let requestBody: unknown
    let authHeader: string | null = null
    server.use(
      mswHttp.post(`${BASE_URL}/api/reviews`, async ({ request }) => {
        authHeader = request.headers.get('Authorization')
        requestBody = await request.json()
        return HttpResponse.json(
          { id: 1, user_id: 1, product_id: 5, rating: 4, comment: 'Great fit', created_at: '2024-01-01', updated_at: '2024-01-01' },
          { status: 201 },
        )
      }),
    )
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('radio', { name: '4 stars' }))
    await user.type(
      screen.getByPlaceholderText('Share your thoughts about this product (optional)'),
      'Great fit',
    )
    await user.click(screen.getByRole('button', { name: 'Submit review' }))

    await waitFor(() => expect(requestBody).toEqual({ productId: 5, rating: 4, comment: 'Great fit' }))
    expect(authHeader).toBe('Bearer test-token')
    expect(await screen.findByText('Review submitted')).toBeInTheDocument()
  })

  it('omits comment from the request body when left blank', async () => {
    let requestBody: unknown
    server.use(
      mswHttp.post(`${BASE_URL}/api/reviews`, async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json(
          { id: 1, user_id: 1, product_id: 5, rating: 3, comment: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
          { status: 201 },
        )
      }),
    )
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('radio', { name: '3 stars' }))
    await user.click(screen.getByRole('button', { name: 'Submit review' }))

    await waitFor(() => expect(requestBody).toEqual({ productId: 5, rating: 3 }))
  })

  it('disables the submit button until a star rating is chosen', () => {
    renderForm()

    expect(screen.getByRole('button', { name: 'Submit review' })).toBeDisabled()
  })

  it('shows the spinner and disables the button while the request is pending', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/reviews`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 30))
        return HttpResponse.json(
          { id: 1, user_id: 1, product_id: 5, rating: 5, comment: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
          { status: 201 },
        )
      }),
    )
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('radio', { name: '5 stars' }))
    await user.click(screen.getByRole('button', { name: 'Submit review' }))

    expect(screen.getByRole('button', { name: /Submit review/ })).toBeDisabled()
    expect(screen.getByRole('status')).toBeInTheDocument()

    // the request settling clears the pending state; a lingering toast from an earlier test in
    // this file could otherwise make a toast-text assertion here match more than one element
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit review' })).not.toBeDisabled())
  })

  it('shows the { message } error from a failed submit', async () => {
    server.use(
      mswHttp.post(`${BASE_URL}/api/reviews`, () =>
        HttpResponse.json({ message: 'You have already reviewed this product' }, { status: 409 }),
      ),
    )
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('radio', { name: '2 stars' }))
    await user.click(screen.getByRole('button', { name: 'Submit review' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('You have already reviewed this product')
  })
})
