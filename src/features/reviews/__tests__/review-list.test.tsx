import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReviewList } from '../_components/review-list'
import { authKeys } from '@/lib/query-keys'
import { createTestQueryClient, renderWithProviders } from '@/test/render'
import type { AuthSession } from '@/types/auth'
import type { Review } from '../types/reviews'

const makeReview = (overrides: Partial<Review> = {}): Review => ({
  id: 1,
  user_id: 1,
  product_id: 7,
  rating: 5,
  comment: 'Amazing',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  name: 'Ada',
  ...overrides,
})

// ReviewItem nests the reviewer name three levels below the header row that
// also holds the (conditionally rendered) Edit/Delete buttons as a sibling
const headerRowFor = (reviewerName: string) => screen.getByText(reviewerName).parentElement!.parentElement!.parentElement!

const renderList = (reviews: Review[], session: AuthSession | null) => {
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(authKeys.session, session)
  return renderWithProviders(
    <ReviewList productId={7} reviews={reviews} isLoading={false} isError={false} error={null} />,
    { queryClient },
  )
}

describe('ReviewList', () => {
  it('prompts a signed-out visitor to sign in instead of showing the review form', () => {
    renderList([makeReview()], null)

    expect(screen.getByText(/Sign in/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in')
    expect(screen.queryByRole('button', { name: 'Submit review' })).not.toBeInTheDocument()
  })

  it('shows the review form to a signed-in user who has not yet reviewed this product', () => {
    const session: AuthSession = { accessToken: 'tok', user: { id: 99, email: 'grace@example.com', role: 'customer' } }
    renderList([makeReview({ user_id: 1 })], session)

    expect(screen.getByRole('button', { name: 'Submit review' })).toBeInTheDocument()
  })

  it('hides the review form and shows Edit/Delete only on the signed-in user\'s own review', () => {
    const session: AuthSession = { accessToken: 'tok', user: { id: 2, email: 'grace@example.com', role: 'customer' } }
    const reviews = [
      makeReview({ id: 1, user_id: 1, name: 'Ada' }),
      makeReview({ id: 2, user_id: 2, name: 'Grace' }),
      makeReview({ id: 3, user_id: 3, name: 'Alan' }),
    ]

    renderList(reviews, session)

    expect(screen.queryByRole('button', { name: 'Submit review' })).not.toBeInTheDocument()
    expect(within(headerRowFor('Grace')).getByRole('button', { name: 'Edit review' })).toBeInTheDocument()
    expect(within(headerRowFor('Grace')).getByRole('button', { name: 'Delete review' })).toBeInTheDocument()
    expect(within(headerRowFor('Ada')).queryByRole('button', { name: 'Edit review' })).not.toBeInTheDocument()
    expect(within(headerRowFor('Alan')).queryByRole('button', { name: 'Edit review' })).not.toBeInTheDocument()
  })

  it('filters out reviews with no comment when "With description" is selected', async () => {
    const reviews = [
      makeReview({ id: 1, user_id: 1, name: 'Ada', comment: 'Amazing' }),
      makeReview({ id: 2, user_id: 2, name: 'Grace', comment: null }),
      makeReview({ id: 3, user_id: 3, name: 'Alan', comment: 'Also great' }),
    ]
    const user = userEvent.setup()

    renderList(reviews, null)

    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Grace')).toBeInTheDocument()
    expect(screen.getByText('Alan')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'With description' }))

    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Alan')).toBeInTheDocument()
    expect(screen.queryByText('Grace')).not.toBeInTheDocument()
  })

  it('narrows the list to reviews matching a checked star rating', async () => {
    const reviews = [
      makeReview({ id: 1, user_id: 1, name: 'Ada', rating: 5 }),
      makeReview({ id: 2, user_id: 2, name: 'Grace', rating: 3 }),
      makeReview({ id: 3, user_id: 3, name: 'Alan', rating: 5 }),
    ]
    const user = userEvent.setup()

    renderList(reviews, null)

    await user.click(screen.getByRole('checkbox', { name: '5 stars' }))

    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Alan')).toBeInTheDocument()
    expect(screen.queryByText('Grace')).not.toBeInTheDocument()
  })
})
