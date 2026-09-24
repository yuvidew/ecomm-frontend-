import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryKeys } from '@/lib/query-keys'
import { createCategory } from '../api/categories'

/**
 * useCreateCategory — mutation hook for POST /api/categories. Refetches the
 * category list on success so the table and product-form select pick it up.
 * @returns TanStack mutation result: call `mutate({ name })`.
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  })
}
