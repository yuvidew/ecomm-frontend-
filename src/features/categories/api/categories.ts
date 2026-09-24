import { http } from '@/lib/http'
import type {
  Category,
  CreateCategoryInput,
  CreateCategoryResponse,
  ListCategoriesResponse,
} from '../types/categories'

/** listCategories — calls GET /api/categories (sorted by name server-side). */
export const listCategories = async (): Promise<Category[]> => {
  const { data } = await http.get<ListCategoriesResponse>('/api/categories')
  return data.categories
}

/** createCategory — calls POST /api/categories (admin only). */
export const createCategory = async (input: CreateCategoryInput): Promise<CreateCategoryResponse> => {
  const { data } = await http.post<CreateCategoryResponse>('/api/categories', input)
  return data
}
