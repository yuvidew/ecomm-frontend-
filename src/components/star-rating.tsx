import { StarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const STARS = [1, 2, 3, 4, 5]

/**
 * StarRating — a row of 5 stars. Read-only (rounds `value` to the nearest
 * whole star) unless `onChange` is given, in which case it renders as an
 * interactive 1-5 star picker.
 * @param value - current rating, 0-5 (fractional allowed in read-only mode)
 * @param onChange - when provided, clicking a star calls this with 1-5
 * @param size - icon size class
 */
export const StarRating = ({
  value,
  onChange,
  size = 'size-4',
}: {
  value: number
  onChange?: (rating: number) => void
  size?: string
}) => {
  if (onChange) {
    return (
      <div role="radiogroup" aria-label="Rating" className="flex items-center gap-1">
        {STARS.map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onClick={() => onChange(star)}
            className="rounded-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <StarIcon className={cn(size, star <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
          </button>
        ))}
      </div>
    )
  }

  const rounded = Math.round(value)
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {STARS.map((star) => (
        <StarIcon
          key={star}
          className={cn(size, star <= rounded ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')}
        />
      ))}
    </div>
  )
}
