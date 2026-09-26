import { useMemo, useState, type MouseEvent } from 'react'
import { Link } from 'react-router'
import { QueryErrorAlert } from '@/components/query-error-alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSession } from '@/features/auth/hooks/use-session'
import { getApiErrorMessage } from '@/lib/http'
import { cn } from '@/lib/utils'
import type { Review } from '../types/reviews'
import { ReviewForm } from './review-form'
import { ReviewItem } from './review-item'

// reviews shown per page in the (client-side) list
const REVIEWS_PAGE_SIZE = 5
const RATING_VALUES = [5, 4, 3, 2, 1]

/**
 * ReviewList — the write-a-review prompt/form, an All/With-description tab
 * filter, a star-rating checkbox filter, and the paginated review list. All
 * filtering/pagination happens client-side over the reviews batch fetched by
 * the parent page.
 * @param productId - product these reviews belong to
 * @param reviews - the fetched batch of reviews for this product
 * @param isLoading - whether the batch is still loading
 * @param isError - whether the fetch failed
 * @param error - the fetch error, passed to `getApiErrorMessage`
 */
export const ReviewList = ({
  productId,
  reviews,
  isLoading,
  isError,
  error,
}: {
  productId: number
  reviews: Review[]
  isLoading: boolean
  isError: boolean
  error: unknown
}) => {
  const { session } = useSession()
  const [tab, setTab] = useState<'all' | 'with-description'>('all')
  const [ratingFilter, setRatingFilter] = useState<number[]>([])
  const [page, setPage] = useState(1)

  const ownReview = reviews.find((review) => review.user_id === session?.user.id)

  const filtered = useMemo(
    () =>
      reviews.filter((review) => {
        if (tab === 'with-description' && !review.comment) return false
        if (ratingFilter.length && !ratingFilter.includes(review.rating)) return false
        return true
      }),
    [reviews, tab, ratingFilter],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / REVIEWS_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * REVIEWS_PAGE_SIZE, safePage * REVIEWS_PAGE_SIZE)

  const toggleRating = (stars: number) => {
    setPage(1)
    setRatingFilter((current) => (current.includes(stars) ? current.filter((value) => value !== stars) : [...current, stars]))
  }

  const goToPage = (event: MouseEvent<HTMLAnchorElement>, next: number) => {
    event.preventDefault()
    setPage(next)
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 lg:w-56">
        <h3 className="mb-3 text-sm font-medium">Filter by rating</h3>
        <div className="flex flex-col gap-2">
          {RATING_VALUES.map((stars) => (
            <label key={stars} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={ratingFilter.includes(stars)} onCheckedChange={() => toggleRating(stars)} />
              {stars} star{stars > 1 ? 's' : ''}
            </label>
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {session ? (
          !ownReview && <ReviewForm productId={productId} />
        ) : (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            <Link to="/sign-in" className="font-medium text-primary underline underline-offset-4">
              Sign in
            </Link>{' '}
            to leave a review.
          </p>
        )}

        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value as typeof tab)
            setPage(1)
          }}
          className="mt-6"
        >
          <TabsList>
            <TabsTrigger value="all">All reviews</TabsTrigger>
            <TabsTrigger value="with-description">With description</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-2 flex flex-col">
          {isLoading ? (
            <p className="py-6 text-sm text-muted-foreground">Loading reviews…</p>
          ) : isError ? (
            <QueryErrorAlert message={getApiErrorMessage(error, 'Could not load reviews')} />
          ) : !pageItems.length ? (
            <p className="py-6 text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            pageItems.map((review) => <ReviewItem key={review.id} review={review} productId={productId} />)
          )}
        </div>

        {totalPages > 1 && (
          <Pagination className="mt-4 justify-start">
            <PaginationContent>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href={`#page-${pageNumber}`}
                    isActive={pageNumber === safePage}
                    onClick={(event) => goToPage(event, pageNumber)}
                    className={cn(pageNumber === safePage && 'pointer-events-none')}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ))}
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  )
}
