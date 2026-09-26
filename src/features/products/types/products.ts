/**
 * Product — a product as returned by the backend: the raw `products` row
 * (snake_case) plus its image URLs ordered by `sort_order`.
 */
export type Product = {
  id: number
  category_id: number
  name: string
  slug: string
  description: string | null
  // MySQL DECIMAL — mysql2 serializes it as a string
  price: string
  stock: number
  created_at: string
  updated_at: string
  images: string[]
}

/** Pagination — paging metadata returned alongside a product list. */
export type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** ListProductsParams — query string for GET /api/products. */
export type ListProductsParams = {
  page: number
  limit: number
  categoryId?: number
  search?: string
}

/** ListProductsResponse — body returned by GET /api/products. */
export type ListProductsResponse = {
  products: Product[]
  pagination: Pagination
}

/** ProductInput — body sent to POST /api/products and PUT /api/products/:id. */
export type ProductInput = {
  categoryId: number
  name: string
  description?: string
  price: number
  stock: number
  images: string[]
}

/** ProductFieldName — fields that can carry zod validation errors from the backend. */
export type ProductFieldName = keyof ProductInput

/** DeleteProductResponse — body returned by DELETE /api/products/:id. */
export type DeleteProductResponse = {
  message: string
}

/** UploadImagesResponse — body returned by POST /api/uploads/images. */
export type UploadImagesResponse = {
  images: string[]
}
