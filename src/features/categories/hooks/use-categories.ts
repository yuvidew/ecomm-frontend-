import { useQuery } from '@tanstack/react-query'
import { categoryKeys } from '@/lib/query-keys'
import { listCategories } from '../api/categories'

/**
 * useCategories — query hook for GET /api/categories.
 * @returns TanStack query result whose `data` is the full category list.
 */
export const useCategories = () => {
  return useQuery({
    queryKey: categoryKeys.list,
    queryFn: listCategories,
  })
}
