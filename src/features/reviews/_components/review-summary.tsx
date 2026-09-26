import { StarRating } from '@/components/star-rating'
import type { Product } from '@/features/products/types/products'
import type { Review } from '../types/reviews'

const RATING_VALUES = [5, 4, 3, 2, 1]

/**
 * ReviewSummary — average rating, total review count, and a per-star bar
 * breakdown. The average/total come from the product row (accounts for every
 * review); the breakdown is computed client-side from the reviews fetched for
 * this page, so it's approximate for products with more than the fetched batch.
 * @param product - the product, for `avg_rating`/`num_reviews`
 * @param reviews - the fetched batch of reviews for this product
 */
export const ReviewSummary = ({ product, reviews }: { product: Product; reviews: Review[] }) => {
  const average = Number(product.avg_rating) || 0
  const total = product.num_reviews

  const counts = RATING_VALUES.map((stars) => reviews.filter((review) => review.rating === stars).length)
  const maxCount = Math.max(1, ...counts)

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
      <div className="flex shrink-0 flex-col items-center gap-1">
        <span className="font-heading text-4xl font-bold">{average.toFixed(1)}</span>
        <StarRating value={average} size="size-5" />
        <span className="text-sm text-muted-foreground">
          {total} review{total === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        {RATING_VALUES.map((stars, index) => (
          <div key={stars} className="flex items-center gap-3 text-sm">
            <span className="w-3 shrink-0 text-muted-foreground">{stars}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${(counts[index] / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-muted-foreground">{counts[index]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
