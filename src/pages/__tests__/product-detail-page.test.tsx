import { screen } from '@testing-library/react'
import { http as mswHttp, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router'
import ProductDetailPage from '../product-detail-page'
import { authKeys } from '@/lib/query-keys'
import { formatPrice } from '@/lib/format'
import { createTestQueryClient, renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import type { Category } from '@/features/categories/types/categories'
import type { Product } from '@/features/products/types/products'
import type { Review } from '@/features/reviews/types/reviews'

const BASE_URL = 'http://localhost:5000'

const CATEGORIES: Category[] = [
  { id: 3, name: 'Outerwear', slug: 'outerwear', image: 'https://example.com/c3.jpg', created_at: '2024-01-01' },
]

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 7,
  category_id: 3,
  name: 'Alpine Jacket',
  slug: 'alpine-jacket',
  description: 'Warm and windproof.',
  price: '129.99',
  stock: 5,
  avg_rating: '4.5',
  num_reviews: 12,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  images: ['https://example.com/jacket.jpg'],
  ...overrides,
})

const makeReview = (overrides: Partial<Review> = {}): Review => ({
  id: 1,
  user_id: 9,
  product_id: 7,
  rating: 5,
  comment: 'Great jacket',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  name: 'Grace Hopper',
  ...overrides,
})

const mockCategories = () =>
  server.use(mswHttp.get(`${BASE_URL}/api/categories`, () => HttpResponse.json({ categories: CATEGORIES })))

const mockReviews = (reviews: Review[]) =>
  server.use(
    mswHttp.get(`${BASE_URL}/api/reviews/product/:productId`, () =>
      HttpResponse.json({ reviews, pagination: { page: 1, limit: 100, total: reviews.length, totalPages: 1 } }),
    ),
  )

const renderPage = (route = '/shop/7') => {
  const queryClient = createTestQueryClient()
  // sign the viewer out so mounting ReviewList's useSession() resolves from cache instead of hitting the network
  queryClient.setQueryData(authKeys.session, null)

  return renderWithProviders(
    <Routes>
      <Route path="/shop/:id" element={<ProductDetailPage />} />
    </Routes>,
    { route, queryClient },
  )
}

describe('ProductDetailPage', () => {
  it('renders the product, its resolved category breadcrumb, and the review summary from the product row', async () => {
    mockCategories()
    mockReviews([makeReview()])
    server.use(mswHttp.get(`${BASE_URL}/api/products/7`, () => HttpResponse.json(makeProduct())))

    renderPage()

    expect(await screen.findByRole('heading', { level: 1, name: 'Alpine Jacket' })).toBeInTheDocument()
    expect(screen.getByText(formatPrice('129.99'))).toBeInTheDocument()
    expect(screen.getByText('Warm and windproof.')).toBeInTheDocument()

    const breadcrumb = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/shop')
    expect(breadcrumb).toHaveTextContent('Outerwear')

    // ReviewSummary's average/count come from the product row (avg_rating/num_reviews), not a client count of the fetched batch
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('12 reviews')).toBeInTheDocument()
  })

  it('shows a loading spinner while the product request is pending', async () => {
    mockCategories()
    mockReviews([])
    server.use(
      mswHttp.get(`${BASE_URL}/api/products/7`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json(makeProduct())
      }),
    )

    renderPage()

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Alpine Jacket' })).toBeInTheDocument()
  })

  it('shows the { message } error via QueryErrorAlert when the product fetch 404s', async () => {
    mockCategories()
    mockReviews([])
    server.use(
      mswHttp.get(`${BASE_URL}/api/products/7`, () => HttpResponse.json({ message: 'Product not found' }, { status: 404 })),
    )

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Product not found')
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
  })

  it('shows "No reviews yet." when the product has no reviews', async () => {
    mockCategories()
    mockReviews([])
    server.use(
      mswHttp.get(`${BASE_URL}/api/products/7`, () =>
        HttpResponse.json(makeProduct({ avg_rating: '0.0', num_reviews: 0 })),
      ),
    )

    renderPage()

    await screen.findByRole('heading', { level: 1, name: 'Alpine Jacket' })
    expect(await screen.findByText('No reviews yet.')).toBeInTheDocument()
  })
})
