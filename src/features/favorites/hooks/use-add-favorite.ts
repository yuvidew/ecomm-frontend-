import { useMutation, useQueryClient } from '@tanstack/react-query'
import { favoriteKeys } from '@/lib/query-keys'
import { addFavorite } from '../api/favorites'

/**
 * useAddFavorite — mutation hook for POST /api/favorites. Seeds the
 * favorites cache from the response — since `useFavorites` is an infinite
 * query, the cache must be written back as a `{ pages, pageParams }`
 * envelope, not a bare array.
 * @returns TanStack mutation result: call `mutate({ productId })`.
 */
export const useAddFavorite = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addFavorite,
    onSuccess: (favorites) => {
      queryClient.setQueryData(favoriteKeys.list(), { pages: [favorites], pageParams: [undefined] })
    },
  })
}
