// Placeholder shapes for the UI-only "My Orders" phase (.claude/plan/phase-18-my-orders-page.md).
// No backend orders endpoint exists yet -- reconcile these against the real GET /api/orders
// contract (and confirm with the user) before adding an api/ or hooks/ layer for this feature.

/** OrderStatus — lifecycle state of a placed order. */
export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled'

/** OrderItem — one line item within an order. */
export interface OrderItem {
  id: string
  name: string
  image: string | null
  quantity: number
  price: number
}

/** Order — a single placed order and its line items. */
export interface Order {
  id: string
  placedAt: string
  status: OrderStatus
  items: OrderItem[]
  total: number
}
