import { http } from '@/lib/http'
import type { Order, PlaceOrderInput, UpdateOrderStatusInput } from '../types/orders'

/** getOrders — calls GET /api/orders (the caller's own orders). */
export const getOrders = async (): Promise<Order[]> => {
  const { data } = await http.get<Order[]>('/api/orders')
  return data
}

/** placeOrder — calls POST /api/orders, converting the caller's cart into an order. */
export const placeOrder = async (input: PlaceOrderInput): Promise<Order> => {
  const { data } = await http.post<Order>('/api/orders', input)
  return data
}

/** cancelOrder — calls PATCH /api/orders/:orderId/cancel. */
export const cancelOrder = async (orderId: number): Promise<Order> => {
  const { data } = await http.patch<Order>(`/api/orders/${orderId}/cancel`)
  return data
}

/** getAllOrders — calls GET /api/orders/admin (every user's orders, admin-only). */
export const getAllOrders = async (): Promise<Order[]> => {
  const { data } = await http.get<Order[]>('/api/orders/admin')
  return data
}

/** updateOrderStatus — calls PATCH /api/orders/:orderId/status (admin-only). */
export const updateOrderStatus = async ({
  orderId,
  input,
}: {
  orderId: number
  input: UpdateOrderStatusInput
}): Promise<Order> => {
  const { data } = await http.patch<Order>(`/api/orders/${orderId}/status`, input)
  return data
}
