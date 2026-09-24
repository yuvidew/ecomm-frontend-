import { FolderIcon } from 'lucide-react'
import { QueryErrorAlert } from '@/components/query-error-alert'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiErrorMessage } from '@/lib/http'
import { useCategories } from '../hooks/use-categories'
import { CategoryTile } from './category-tile'

const GRID_CLASSES = 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6'

/**
 * CategoryGrid — storefront "Shop by Category" grid. Fetches the real
 * category list and renders a tile per category, with loading/error/empty
 * states.
 * @param limit - caps how many categories are shown (e.g. a home page teaser); shows all when omitted
 */
export const CategoryGrid = ({ limit }: { limit?: number }) => {
  const { data: categories, isLoading, isError, error } = useCategories()

  if (isLoading) {
    return (
      <div className={GRID_CLASSES}>
        {Array.from({ length: limit ?? 6 }, (_, index) => (
          <Skeleton key={index} className="aspect-square w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <QueryErrorAlert message={getApiErrorMessage(error, 'Could not load categories')} />
  }

  if (!categories?.length) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderIcon />
          </EmptyMedia>
          <EmptyTitle>No categories yet</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  const visibleCategories = limit ? categories.slice(0, limit) : categories

  return (
    <div className={GRID_CLASSES}>
      {visibleCategories.map((category) => (
        <CategoryTile key={category.id} category={category} />
      ))}
    </div>
  )
}
