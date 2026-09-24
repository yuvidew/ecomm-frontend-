import type { MouseEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PackageIcon, PlusIcon } from 'lucide-react'
import { QueryErrorAlert } from '@/components/query-error-alert'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiErrorMessage } from '@/lib/http'
import { cn } from '@/lib/utils'
import { useProducts } from '../hooks/use-products'
import { ProductCard } from './product-card'

// products per page on the admin grid (backend max is 100)
const PAGE_SIZE = 12

const GRID_CLASSES = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

/**
 * ProductGrid — paginated grid of product cards for the admin dashboard.
 * The current page lives in the `?page=` search param so it survives
 * navigating to a product and back.
 */
export const ProductGrid = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const { data, isLoading, isError, error, isPlaceholderData } = useProducts({ page, limit: PAGE_SIZE })

  // keeps pagination client-side (PaginationLink renders a plain <a>)
  const goToPage = (event: MouseEvent<HTMLAnchorElement>, next: number) => {
    event.preventDefault()
    setSearchParams(next === 1 ? {} : { page: String(next) })
  }

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
    return <QueryErrorAlert message={getApiErrorMessage(error, 'Could not load products')} />
  }

  if (!data?.products.length) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackageIcon />
          </EmptyMedia>
          <EmptyTitle>No products yet</EmptyTitle>
          <EmptyDescription>Products you create will show up here.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild size="sm">
            <Link to="/admin/products/new">
              <PlusIcon />
              Create product
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  const { totalPages } = data.pagination

  return (
    <div className="flex flex-col gap-6">
      <div className={cn(GRID_CLASSES, isPlaceholderData && 'opacity-60 transition-opacity')}>
        {data.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={`?page=${page - 1}`}
                aria-disabled={page === 1}
                className={cn(page === 1 && 'pointer-events-none opacity-50')}
                onClick={(event) => goToPage(event, page - 1)}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href={`?page=${pageNumber}`}
                  isActive={pageNumber === page}
                  onClick={(event) => goToPage(event, pageNumber)}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href={`?page=${page + 1}`}
                aria-disabled={page === totalPages}
                className={cn(page === totalPages && 'pointer-events-none opacity-50')}
                onClick={(event) => goToPage(event, page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
