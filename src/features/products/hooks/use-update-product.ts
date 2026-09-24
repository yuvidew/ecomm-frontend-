import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productKeys } from '@/lib/query-keys'
import { updateProduct } from '../api/products'

/**
 * useUpdateProduct — mutation hook for PUT /api/products/:id. Writes the
 * updated product into its detail cache and refetches product lists.
 * @returns TanStack mutation result: call `mutate({ id, input })`.
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (product) => {
      queryClient.setQueryData(productKeys.detail(product.id), product)
      return queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}
