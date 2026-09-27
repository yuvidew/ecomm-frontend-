/**
 * CartItem — a cart row joined with its product, as returned by every
 * /api/cart endpoint.
 */
export type CartItem = {
  id: number
  user_id: number
  product_id: number
  quantity: number
  created_at: string
  updated_at: string
  name: string
  slug: string
  description: string | null
  images: string[]
  // MySQL DECIMAL — mysql2 serializes it as a string
  price: string
  stock: number
}

/** Cart — body shape returned by GET/POST /api/cart and PUT/DELETE /api/cart/:itemId. */
export type Cart = {
  items: CartItem[]
  total: number
}

/** AddToCartInput — body sent to POST /api/cart. */
export type AddToCartInput = {
  productId: number
  quantity?: number
}

/** UpdateCartItemInput — body sent to PUT /api/cart/:itemId. */
export type UpdateCartItemInput = {
  quantity: number
}

/** ClearCartResponse — body returned by DELETE /api/cart. */
export type ClearCartResponse = {
  message: string
}
