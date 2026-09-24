import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productKeys } from '@/lib/query-keys'
import { createProduct } from '../api/products'

/**
 * useCreateProduct — mutation hook for POST /api/products. Seeds the new
 * product's detail cache and refetches product lists.
 * @returns TanStack mutation result: call `mutate(productInput)`.
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProduct,
    onSuccess: (product) => {
      queryClient.setQueryData(productKeys.detail(product.id), product)
      return queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}
