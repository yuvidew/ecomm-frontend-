import { http } from '@/lib/http'
import type { AddFavoriteInput, Favorite } from '../types/favorites'

/** getFavorites — calls GET /api/favorites. */
export const getFavorites = async (): Promise<Favorite[]> => {
  const { data } = await http.get<Favorite[]>('/api/favorites')
  return data
}

/** addFavorite — calls POST /api/favorites. */
export const addFavorite = async (input: AddFavoriteInput): Promise<Favorite[]> => {
  const { data } = await http.post<Favorite[]>('/api/favorites', input)
  return data
}

/** removeFavorite — calls DELETE /api/favorites/:productId. */
export const removeFavorite = async (productId: number): Promise<Favorite[]> => {
  const { data } = await http.delete<Favorite[]>(`/api/favorites/${productId}`)
  return data
}
