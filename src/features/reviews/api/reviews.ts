import { http } from '@/lib/http'
import type {
  CreateReviewInput,
  DeleteReviewResponse,
  ListReviewsParams,
  ListReviewsResponse,
  Review,
  UpdateReviewInput,
} from '../types/reviews'

/** listProductReviews — calls GET /api/reviews/product/:productId. */
export const listProductReviews = async (
  productId: number,
  params: ListReviewsParams,
): Promise<ListReviewsResponse> => {
  const { data } = await http.get<ListReviewsResponse>(`/api/reviews/product/${productId}`, { params })
  return data
}

/** createReview — calls POST /api/reviews (any signed-in user). */
export const createReview = async (input: CreateReviewInput): Promise<Review> => {
  const { data } = await http.post<Review>('/api/reviews', input)
  return data
}

/** updateReview — calls PUT /api/reviews/:id (owner only). */
export const updateReview = async ({ id, input }: { id: number; input: UpdateReviewInput }): Promise<Review> => {
  const { data } = await http.put<Review>(`/api/reviews/${id}`, input)
  return data
}

/** deleteReview — calls DELETE /api/reviews/:id (owner or admin). */
export const deleteReview = async (id: number): Promise<DeleteReviewResponse> => {
  const { data } = await http.delete<DeleteReviewResponse>(`/api/reviews/${id}`)
  return data
}
