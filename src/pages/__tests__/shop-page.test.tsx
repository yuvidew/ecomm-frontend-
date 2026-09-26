import { screen } from '@testing-library/react'
import { http as mswHttp, HttpResponse } from 'msw'
import ShopPage from '../shop-page'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'

// the price Slider's percentage math divides by (max - min), which is 0 (and unrenderable in
// jsdom's stricter CSS parser) for this test's empty product batch; this suite only asserts
// ShopPage's composition, not the slider's internals (covered by product-filters.test.tsx)
vi.mock('@/components/ui/slider', () => ({ Slider: () => null }))

const BASE_URL = 'http://localhost:5000'

describe('ShopPage', () => {
  it('renders the banner above the product catalog, with the CTA anchored to the results section', async () => {
    server.use(
      mswHttp.get(`${BASE_URL}/api/categories`, () => HttpResponse.json({ categories: [] })),
      mswHttp.get(`${BASE_URL}/api/products`, () =>
        HttpResponse.json({ products: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 1 } }),
      ),
    )

    renderWithProviders(<ShopPage />, { route: '/shop' })

    expect(screen.getByRole('heading', { name: 'New arrivals every week' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Shop Now/ })).toHaveAttribute('href', '#shop-results')

    expect(await screen.findByText('No products found')).toBeInTheDocument()
  })
})
