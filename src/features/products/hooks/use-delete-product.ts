import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productKeys } from '@/lib/query-keys'
import { deleteProduct } from '../api/products'

/**
 * useDeleteProduct — mutation hook for DELETE /api/products/:id. Drops the
 * product's detail cache and refetches product lists.
 * @returns TanStack mutation result: call `mutate(productId)`.
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: productKeys.detail(id) })
      return queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}
