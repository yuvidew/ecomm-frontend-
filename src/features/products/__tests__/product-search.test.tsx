import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductSearch } from '../_components/product-search'
import { renderWithProviders, SearchParamsProbe } from '@/test/render'

const renderSearch = (route: string) =>
  renderWithProviders(
    <>
      <ProductSearch />
      <SearchParamsProbe />
    </>,
    { route },
  )

const probe = () => screen.getByTestId('search-params-probe')

describe('ProductSearch', () => {
  it('seeds its text from the current ?search= param', () => {
    renderSearch('/shop?search=shoes')

    expect(screen.getByRole('textbox', { name: 'Search products' })).toHaveValue('shoes')
  })

  it('renders empty when there is no ?search= param', () => {
    renderSearch('/shop')

    expect(screen.getByRole('textbox', { name: 'Search products' })).toHaveValue('')
  })

  it('does not update ?search= before the 400ms debounce elapses', async () => {
    const user = userEvent.setup()
    renderSearch('/shop')

    await user.type(screen.getByRole('textbox', { name: 'Search products' }), 'shirt')

    expect(probe()).toHaveTextContent('')
  })

  it('updates ?search= and resets ?page= after the debounce settles', async () => {
    const user = userEvent.setup()
    renderSearch('/shop?page=3')

    await user.type(screen.getByRole('textbox', { name: 'Search products' }), 'shirt')

    await waitFor(() => expect(probe()).toHaveTextContent('search=shirt'), { timeout: 1000 })
    expect(probe()).not.toHaveTextContent('page=3')
  })

  it('clears ?search= once the input is emptied', async () => {
    const user = userEvent.setup()
    renderSearch('/shop?search=shirt')

    await user.clear(screen.getByRole('textbox', { name: 'Search products' }))

    await waitFor(() => expect(probe()).not.toHaveTextContent('search='), { timeout: 1000 })
  })
})
