import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http as mswHttp, HttpResponse } from 'msw'
import { ProductCatalog } from '../_components/product-catalog'
import { renderWithProviders, SearchParamsProbe } from '@/test/render'
import { server } from '@/test/server'
import type { Product } from '../types/products'
import type { Category } from '@/features/categories/types/categories'

// the price Slider's percentage math divides by (max - min), which is 0 -- and unrenderable in
// jsdom's stricter CSS parser -- whenever a mocked batch happens to have a single distinct price;
// this suite only asserts ProductCatalog's own fetching/filtering/pagination behavior, not the
// slider's internals (covered by product-filters.test.tsx), so it's stubbed out here
vi.mock('@/components/ui/slider', () => ({ Slider: () => null }))

const BASE_URL = 'http://localhost:5000'

const CATEGORIES: Category[] = [
  { id: 1, name: 'Shirts', slug: 'shirts', image: 'https://example.com/c1.jpg', created_at: '2024-01-01' },
]

const makeProduct = (id: number, price = '10.00'): Product => ({
  id,
  category_id: 1,
  name: `Product ${id}`,
  slug: `product-${id}`,
  description: null,
  price,
  stock: 5,
  avg_rating: '0.0',
  num_reviews: 0,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  images: [],
})

const mockCategories = () =>
  server.use(mswHttp.get(`${BASE_URL}/api/categories`, () => HttpResponse.json({ categories: CATEGORIES })))

const mockProducts = (products: Product[], onRequest?: (url: URL) => void) =>
  server.use(
    mswHttp.get(`${BASE_URL}/api/products`, ({ request }) => {
      onRequest?.(new URL(request.url))
      return HttpResponse.json({
        products,
        pagination: { page: 1, limit: 100, total: products.length, totalPages: 1 },
      })
    }),
  )

const renderCatalog = (route = '/shop') =>
  renderWithProviders(
    <>
      <ProductCatalog />
      <SearchParamsProbe />
    </>,
    { route },
  )

describe('ProductCatalog', () => {
  it('requests a batch of up to 100 products, forwarding categoryId and search', async () => {
    mockCategories()
    let requestUrl: URL | undefined
    mockProducts([makeProduct(1)], (url) => {
      requestUrl = url
    })

    renderCatalog('/shop?category=3&search=shoe')

    await screen.findByText('Product 1')

    expect(requestUrl?.searchParams.get('page')).toBe('1')
    expect(requestUrl?.searchParams.get('limit')).toBe('100')
    expect(requestUrl?.searchParams.get('categoryId')).toBe('3')
    expect(requestUrl?.searchParams.get('search')).toBe('shoe')
  })

  it('omits categoryId and search from the request when no filters are active', async () => {
    mockCategories()
    let requestUrl: URL | undefined
    mockProducts([makeProduct(1)], (url) => {
      requestUrl = url
    })

    renderCatalog('/shop')

    await screen.findByText('Product 1')

    expect(requestUrl?.searchParams.has('categoryId')).toBe(false)
    expect(requestUrl?.searchParams.has('search')).toBe(false)
  })

  it('renders the results-count text and the current page of product tiles', async () => {
    mockCategories()
    mockProducts(Array.from({ length: 15 }, (_, index) => makeProduct(index + 1)))

    renderCatalog('/shop')

    expect(await screen.findByText('Showing 1–12 of 15 results')).toBeInTheDocument()
    const productHeadings = screen.getAllByRole('heading', { level: 3 }).filter((heading) =>
      /^Product \d+$/.test(heading.textContent ?? ''),
    )
    expect(productHeadings).toHaveLength(12)
    expect(screen.getByText('Product 1')).toBeInTheDocument()
    expect(screen.queryByText('Product 13')).not.toBeInTheDocument()
  })

  it('shows the loading state while the batch is pending', async () => {
    mockCategories()
    server.use(
      mswHttp.get(`${BASE_URL}/api/products`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json({
          products: [makeProduct(1)],
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        })
      }),
    )

    renderCatalog('/shop')

    expect(screen.getByText('Loading products…')).toBeInTheDocument()
    await screen.findByText('Showing 1–1 of 1 results')
  })

  it('shows the { message } error via QueryErrorAlert on a failed request', async () => {
    mockCategories()
    server.use(
      mswHttp.get(`${BASE_URL}/api/products`, () =>
        HttpResponse.json({ message: 'Server exploded' }, { status: 500 }),
      ),
    )

    renderCatalog('/shop')

    expect(await screen.findByRole('alert')).toHaveTextContent('Server exploded')
  })

  it('shows the empty state when no products match the filters', async () => {
    mockCategories()
    mockProducts([])

    renderCatalog('/shop')

    expect(await screen.findByText('No products found')).toBeInTheDocument()
  })

  it('filters the fetched batch by the committed price range and resets the count', async () => {
    mockCategories()
    mockProducts([makeProduct(1, '10.00'), makeProduct(2, '20.00'), makeProduct(3, '30.00')])

    renderCatalog('/shop?minPrice=15&maxPrice=25')

    expect(await screen.findByText('Showing 1–1 of 1 results')).toBeInTheDocument()
    expect(screen.getByText('Product 2')).toBeInTheDocument()
    expect(screen.queryByText('Product 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Product 3')).not.toBeInTheDocument()
  })

  it('paginates the client-side-filtered set at PAGE_SIZE=12 and updates ?page=', async () => {
    mockCategories()
    mockProducts(Array.from({ length: 20 }, (_, index) => makeProduct(index + 1)))
    const user = userEvent.setup()

    renderCatalog('/shop')

    await screen.findByText('Showing 1–12 of 20 results')

    await user.click(screen.getByRole('link', { name: '2' }))

    expect(await screen.findByText('Showing 13–20 of 20 results')).toBeInTheDocument()
    expect(screen.getByText('Product 20')).toBeInTheDocument()
    expect(screen.queryByText('Product 1')).not.toBeInTheDocument()
    expect(screen.getByTestId('search-params-probe')).toHaveTextContent('page=2')
  })

  it('opens ProductFilters in a Sheet from the mobile "Filters" button', async () => {
    mockCategories()
    mockProducts([makeProduct(1)])
    const user = userEvent.setup()

    renderCatalog('/shop')

    await screen.findByText('Product 1')
    expect(await screen.findAllByRole('checkbox', { name: 'Shirts' })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Filters' }))

    const sheet = await screen.findByRole('dialog', { name: 'Filters' })
    expect(within(sheet).getAllByRole('checkbox')).toHaveLength(1)
  })
})
