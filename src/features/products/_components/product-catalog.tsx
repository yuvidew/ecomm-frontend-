import { useMemo, type MouseEvent } from 'react'
import { useSearchParams } from 'react-router'
import { PackageIcon, SlidersHorizontalIcon } from 'lucide-react'
import { QueryErrorAlert } from '@/components/query-error-alert'
import { Button } from '@/components/ui/button'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiErrorMessage } from '@/lib/http'
import { cn } from '@/lib/utils'
import { useProducts } from '../hooks/use-products'
import { ProductFilters } from './product-filters'
import { ProductSearch } from './product-search'
import { ProductTile } from './product-tile'

// products shown per page on the shop grid
const PAGE_SIZE = 12
// size of the batch fetched for client-side price filtering -- the backend's max `limit`
const BATCH_LIMIT = 100

const GRID_CLASSES = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'

/**
 * ProductCatalog — the shop page's filtered, paginated product grid. Owns
 * the `?page=&category=&search=&minPrice=&maxPrice=&minRating=` URL state,
 * fetches one batch of up to `BATCH_LIMIT` products (server-filtered by
 * category/search), then filters that batch by price and rating and
 * paginates it client-side -- see `.claude/plan/phase-13-shop-filters.md` for
 * why price (and, by the same reasoning, rating) filtering can't be done
 * server-side.
 */
export const ProductCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const categoryParam = searchParams.get('category')
  const categoryId = categoryParam ? Number(categoryParam) : undefined
  const search = searchParams.get('search') || undefined

  const { data, isLoading, isError, error, isPlaceholderData } = useProducts({
    page: 1,
    limit: BATCH_LIMIT,
    categoryId,
    search,
  })

  const products = data?.products
  const batch = useMemo(() => products ?? [], [products])

  const [batchMin, batchMax] = useMemo(() => {
    if (!batch.length) return [0, 0]
    const prices = batch.map((product) => Number(product.price))
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]
  }, [batch])

  const minPrice = searchParams.has('minPrice') ? Number(searchParams.get('minPrice')) : batchMin
  const maxPrice = searchParams.has('maxPrice') ? Number(searchParams.get('maxPrice')) : batchMax
  const minRating = searchParams.has('minRating') ? Number(searchParams.get('minRating')) : 0

  const filtered = useMemo(
    () => batch.filter((product) => {
      const price = Number(product.price)
      return price >= minPrice && price <= maxPrice && Number(product.avg_rating) >= minRating
    }),
    [batch, minPrice, maxPrice, minRating],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // keeps pagination client-side (PaginationLink renders a plain <a>)
  const goToPage = (event: MouseEvent<HTMLAnchorElement>, next: number) => {
    event.preventDefault()
    const nextParams = new URLSearchParams(searchParams)
    if (next === 1) {
      nextParams.delete('page')
    } else {
      nextParams.set('page', String(next))
    }
    setSearchParams(nextParams)
  }

  return (
    <section id="shop-results" className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Shop</h1>
          <p className="mt-1 text-muted-foreground">Browse our full catalog.</p>
        </div>
        <ProductSearch />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="hidden overflow-hidden w-72 shrink-0 lg:sticky lg:top-28 lg:block bg-accent p-4 rounded-md border  ">
          <ProductFilters priceBounds={[batchMin, batchMax]} isPriceLoading={isLoading} />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading products…' : `Showing ${filtered.length ? (safePage - 1) * PAGE_SIZE + 1 : 0}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} results`}
            </p>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 lg:hidden">
                  <SlidersHorizontalIcon className="size-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full overflow-y-auto p-4 sm:max-w-xs">
                <SheetHeader className="p-0">
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <ProductFilters priceBounds={[batchMin, batchMax]} isPriceLoading={isLoading} />
              </SheetContent>
            </Sheet>
          </div>

          {isLoading ? (
            <div className={GRID_CLASSES}>
              {Array.from({ length: PAGE_SIZE }, (_, index) => (
                <Skeleton key={index} className="aspect-[4/4.1] w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <QueryErrorAlert message={getApiErrorMessage(error, 'Could not load products')} />
          ) : !pageItems.length ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PackageIcon />
                </EmptyMedia>
                <EmptyTitle>No products found</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-6">
              <div className={cn(GRID_CLASSES, isPlaceholderData && 'opacity-60 transition-opacity')}>
                {pageItems.map((product) => (
                  <ProductTile key={product.id} product={product} />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={`?page=${safePage - 1}`}
                        aria-disabled={safePage === 1}
                        className={cn(safePage === 1 && 'pointer-events-none opacity-50')}
                        onClick={(event) => goToPage(event, safePage - 1)}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href={`?page=${pageNumber}`}
                          isActive={pageNumber === safePage}
                          onClick={(event) => goToPage(event, pageNumber)}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href={`?page=${safePage + 1}`}
                        aria-disabled={safePage === totalPages}
                        className={cn(safePage === totalPages && 'pointer-events-none opacity-50')}
                        onClick={(event) => goToPage(event, safePage + 1)}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
