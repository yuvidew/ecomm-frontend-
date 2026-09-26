import { screen } from '@testing-library/react'
import { ProductTile } from '../_components/product-tile'
import { renderWithProviders } from '@/test/render'
import type { Product } from '../types/products'

const product: Product = {
  id: 42,
  category_id: 1,
  name: 'Classic Tee',
  slug: 'classic-tee',
  description: null,
  price: '19.99',
  stock: 5,
  avg_rating: '4.5',
  num_reviews: 3,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  images: [],
}

describe('ProductTile', () => {
  it('links to that product\'s detail page at /shop/:id', () => {
    renderWithProviders(<ProductTile product={product} />)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/shop/42')
  })
})
