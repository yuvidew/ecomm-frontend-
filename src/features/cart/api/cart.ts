import { http } from '@/lib/http'
import type { AddToCartInput, Cart, ClearCartResponse, UpdateCartItemInput } from '../types/cart'

/** getCart — calls GET /api/cart. */
export const getCart = async (): Promise<Cart> => {
  const { data } = await http.get<Cart>('/api/cart')
  return data
}

/** addToCart — calls POST /api/cart. */
export const addToCart = async (input: AddToCartInput): Promise<Cart> => {
  const { data } = await http.post<Cart>('/api/cart', input)
  return data
}

/** updateCartItem — calls PUT /api/cart/:itemId. */
export const updateCartItem = async ({
  itemId,
  input,
}: {
  itemId: number
  input: UpdateCartItemInput
}): Promise<Cart> => {
  const { data } = await http.put<Cart>(`/api/cart/${itemId}`, input)
  return data
}

/** removeCartItem — calls DELETE /api/cart/:itemId. */
export const removeCartItem = async (itemId: number): Promise<Cart> => {
  const { data } = await http.delete<Cart>(`/api/cart/${itemId}`)
  return data
}

/** clearCart — calls DELETE /api/cart. */
export const clearCart = async (): Promise<ClearCartResponse> => {
  const { data } = await http.delete<ClearCartResponse>('/api/cart')
  return data
}
