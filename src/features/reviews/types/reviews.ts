/**
 * Review — a review row as returned by the backend. `name` (the reviewer's
 * display name, joined from `users`) is only present on the list endpoint —
 * the create/update responses return the bare row without it.
 */
export type Review = {
  id: number
  user_id: number
  product_id: number
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
  name?: string
}

/** ReviewsPagination — paging metadata returned alongside a review list. */
export type ReviewsPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** ListReviewsParams — query string for GET /api/reviews/product/:productId. */
export type ListReviewsParams = {
  page: number
  limit: number
}

/** ListReviewsResponse — body returned by GET /api/reviews/product/:productId. */
export type ListReviewsResponse = {
  reviews: Review[]
  pagination: ReviewsPagination
}

/** CreateReviewInput — body sent to POST /api/reviews. */
export type CreateReviewInput = {
  productId: number
  rating: number
  comment?: string
}

/** UpdateReviewInput — body sent to PUT /api/reviews/:id. */
export type UpdateReviewInput = {
  rating?: number
  comment?: string
}

/** DeleteReviewResponse — body returned by DELETE /api/reviews/:id. */
export type DeleteReviewResponse = {
  message: string
}
