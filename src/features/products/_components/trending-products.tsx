import { QueryErrorAlert } from '@/components/query-error-alert'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiErrorMessage } from '@/lib/http'
import { useProducts } from '../hooks/use-products'
import { ProductTile } from './product-tile'

const GRID_CLASSES = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

/**
 * TrendingProducts — home page "Trending Products" grid. Shows the 8 newest
 * products (the backend has no trending/featured concept, so newest stands
 * in for it). Renders nothing when the catalog is empty.
 */
export const TrendingProducts = () => {
  const { data, isLoading, isError, error } = useProducts({ page: 1, limit: 8 })

  if (isLoading) {
    return (
      <div className={GRID_CLASSES}>
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="aspect-[4/4.1] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <QueryErrorAlert message={getApiErrorMessage(error, 'Could not load trending products')} />
  }

  if (!data?.products.length) {
    return null
  }

  return (
    <div className={GRID_CLASSES}>
      {data.products.map((product) => (
        <ProductTile key={product.id} product={product} />
      ))}
    </div>
  )
}
