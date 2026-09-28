/** OrderStatus — lifecycle state of a placed order. */
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'

/** OrderItem — one line item within an order, as returned by every /api/orders endpoint. */
export type OrderItem = {
  id: number
  order_id: number
  product_id: number
  quantity: number
  // MySQL DECIMAL — mysql2 serializes it as a string
  price: string
  name: string
  slug: string
  images: string[]
}

/** Order — a single order and its line items. */
export type Order = {
  id: number
  user_id: number
  status: OrderStatus
  // MySQL DECIMAL — mysql2 serializes it as a string
  total: string
  shipping_address: string
  created_at: string
  updated_at: string
  items: OrderItem[]
}

/** PlaceOrderInput — body sent to POST /api/orders. */
export type PlaceOrderInput = {
  shippingAddress: string
}

/** UpdateOrderStatusInput — body sent to PATCH /api/orders/:orderId/status. */
export type UpdateOrderStatusInput = {
  status: OrderStatus
}
