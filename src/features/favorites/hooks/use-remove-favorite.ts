import { useMutation, useQueryClient } from '@tanstack/react-query'
import { favoriteKeys } from '@/lib/query-keys'
import { removeFavorite } from '../api/favorites'

/**
 * useRemoveFavorite — mutation hook for DELETE /api/favorites/:productId.
 * Seeds the favorites cache from the response, matching the infinite
 * query's `{ pages, pageParams }` cache shape.
 * @returns TanStack mutation result: call `mutate({ productId })`.
 */
export const useRemoveFavorite = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId }: { productId: number }) => removeFavorite(productId),
    onSuccess: (favorites) => {
      queryClient.setQueryData(favoriteKeys.list(), { pages: [favorites], pageParams: [undefined] })
    },
  })
}
