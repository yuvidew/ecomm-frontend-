import { http } from '@/lib/http'
import type {
  DeleteProductResponse,
  ListProductsParams,
  ListProductsResponse,
  Product,
  ProductInput,
} from '../types/products'

/** listProducts — calls GET /api/products (newest first, paginated). */
export const listProducts = async (params: ListProductsParams): Promise<ListProductsResponse> => {
  const { data } = await http.get<ListProductsResponse>('/api/products', { params })
  return data
}

/** getProduct — calls GET /api/products/:id. */
export const getProduct = async (id: number): Promise<Product> => {
  const { data } = await http.get<Product>(`/api/products/${id}`)
  return data
}

/** createProduct — calls POST /api/products (admin only). */
export const createProduct = async (input: ProductInput): Promise<Product> => {
  const { data } = await http.post<Product>('/api/products', input)
  return data
}

/**
 * updateProduct — calls PUT /api/products/:id (admin only). The backend
 * replaces all images whenever `images` is present, so callers send the
 * complete list.
 */
export const updateProduct = async ({ id, input }: { id: number; input: ProductInput }): Promise<Product> => {
  const { data } = await http.put<Product>(`/api/products/${id}`, input)
  return data
}

/** deleteProduct — calls DELETE /api/products/:id (admin only). */
export const deleteProduct = async (id: number): Promise<DeleteProductResponse> => {
  const { data } = await http.delete<DeleteProductResponse>(`/api/products/${id}`)
  return data
}
