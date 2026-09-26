import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http as mswHttp, HttpResponse } from 'msw'
import { ProductFilters } from '../_components/product-filters'
import { renderWithProviders, SearchParamsProbe } from '@/test/render'
import { server } from '@/test/server'
import type { Category } from '@/features/categories/types/categories'

const BASE_URL = 'http://localhost:5000'

const CATEGORIES: Category[] = [
  { id: 1, name: 'Shirts', slug: 'shirts', image: 'https://example.com/shirts.jpg', created_at: '2024-01-01' },
  { id: 2, name: 'Shoes', slug: 'shoes', image: 'https://example.com/shoes.jpg', created_at: '2024-01-01' },
]

const mockCategories = (categories: Category[] = CATEGORIES) =>
  server.use(
    mswHttp.get(`${BASE_URL}/api/categories`, () => HttpResponse.json({ categories })),
  )

const renderFilters = (route: string, priceBounds: [number, number] = [0, 200], isPriceLoading = false) =>
  renderWithProviders(
    <>
      <ProductFilters priceBounds={priceBounds} isPriceLoading={isPriceLoading} />
      <SearchParamsProbe />
    </>,
    { route },
  )

const probe = () => screen.getByTestId('search-params-probe')

describe('ProductFilters', () => {
  it('renders a checkbox per category from GET /api/categories', async () => {
    mockCategories()
    renderFilters('/shop')

    expect(await screen.findByRole('checkbox', { name: 'Shirts' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Shoes' })).toBeInTheDocument()
  })

  it('shows no category checkboxes while categories are loading', async () => {
    server.use(
      mswHttp.get(`${BASE_URL}/api/categories`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json({ categories: CATEGORIES })
      }),
    )
    renderFilters('/shop')

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
    await waitFor(() => expect(screen.getAllByRole('checkbox')).toHaveLength(2))
  })

  it('checking a category writes ?category=<id> and resets ?page=', async () => {
    mockCategories()
    const user = userEvent.setup()
    renderFilters('/shop?page=2')

    await user.click(await screen.findByRole('checkbox', { name: 'Shoes' }))

    expect(probe()).toHaveTextContent('category=2')
    expect(probe()).not.toHaveTextContent('page=2')
  })

  it('selects a category exclusively, unchecking the previously selected one', async () => {
    mockCategories()
    const user = userEvent.setup()
    renderFilters('/shop?category=1')

    expect(await screen.findByRole('checkbox', { name: 'Shirts' })).toBeChecked()

    await user.click(screen.getByRole('checkbox', { name: 'Shoes' }))

    expect(screen.getByRole('checkbox', { name: 'Shoes' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Shirts' })).not.toBeChecked()
    expect(probe()).toHaveTextContent('category=2')
  })

  it('clicking the already-checked category clears back to "All categories"', async () => {
    mockCategories()
    const user = userEvent.setup()
    renderFilters('/shop?category=1')

    await user.click(await screen.findByRole('checkbox', { name: 'Shirts' }))

    expect(screen.getByRole('checkbox', { name: 'Shirts' })).not.toBeChecked()
    expect(probe()).not.toHaveTextContent('category=')
  })

  it('"Clear All" resets category, search, minPrice, maxPrice, and page', async () => {
    mockCategories()
    const user = userEvent.setup()
    renderFilters('/shop?category=1&search=shirt&minPrice=10&maxPrice=50&page=3')

    await user.click(await screen.findByRole('button', { name: 'Clear All' }))

    const search = probe().textContent ?? ''
    expect(search).not.toMatch(/category=|search=|minPrice=|maxPrice=|page=/)
  })

  it('moving the price slider with the keyboard commits ?minPrice=&maxPrice=, resetting ?page=', async () => {
    mockCategories()
    const user = userEvent.setup()
    renderFilters('/shop?page=2', [0, 200])

    const [minThumb] = screen.getAllByRole('slider')
    minThumb.focus()
    await user.keyboard('{ArrowRight}')

    await waitFor(() => expect(probe()).toHaveTextContent('minPrice=1'))
    expect(probe()).toHaveTextContent('maxPrice=200')
    expect(probe()).not.toHaveTextContent('page=2')
  })
})
