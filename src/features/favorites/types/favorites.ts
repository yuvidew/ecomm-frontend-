/**
 * Favorite — a favorite row joined with its product, as returned by every
 * /api/favorites endpoint.
 */
export type Favorite = {
  id: number
  user_id: number
  product_id: number
  created_at: string
  name: string
  slug: string
  description: string | null
  images: string[]
  // MySQL DECIMAL — mysql2 serializes it as a string
  price: string
  stock: number
}

/** AddFavoriteInput — body sent to POST /api/favorites. */
export type AddFavoriteInput = {
  productId: number
}
