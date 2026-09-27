import { useState } from 'react'
import { CircleCheckIcon, CircleXIcon, ShoppingCartIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { StarRating } from '@/components/star-rating'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useSession } from '@/features/auth/hooks/use-session'
import { useAddToCart } from '@/features/cart/hooks/use-add-to-cart'
import { formatPrice } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/http'
import type { Product } from '../types/products'

// descriptions longer than this get truncated behind a "See more" toggle
const DESCRIPTION_PREVIEW_LENGTH = 220

/**
 * ProductInfo — name, rating summary (links down to the reviews section),
 * price, stock badge, an expandable description, and Add to Cart/Checkout
 * buttons. Add to Cart calls `POST /api/cart` (redirecting signed-out
 * visitors to `/sign-in`); Checkout stays a disabled placeholder since no
 * checkout endpoint exists yet.
 * @param product - product returned from GET /api/products/:id
 */
export const ProductInfo = ({ product }: { product: Product }) => {
  const [expanded, setExpanded] = useState(false)
  const { session } = useSession()
  const navigate = useNavigate()
  const addToCart = useAddToCart()
  const inStock = product.stock > 0
  const rating = Number(product.avg_rating) || 0
  const description = product.description || 'No description.'
  const isLong = description.length > DESCRIPTION_PREVIEW_LENGTH
  const shownDescription = expanded || !isLong ? description : `${description.slice(0, DESCRIPTION_PREVIEW_LENGTH)}…`

  const handleAddToCart = () => {
    if (!session) {
      navigate('/sign-in')
      return
    }
    addToCart.mutate(
      { productId: product.id },
      { onError: (error) => toast.error(getApiErrorMessage(error, 'Could not add to cart')) },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl font-bold tracking-tight lg:text-4xl">{product.name}</h1>

        <div className="flex flex-wrap items-center gap-3">
          <a href="#reviews" className="flex items-center gap-2">
            <StarRating value={rating} />
            <span className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              {rating.toFixed(1)} ({product.num_reviews} review{product.num_reviews === 1 ? '' : 's'})
            </span>
          </a>
          <Badge variant={inStock ? 'secondary' : 'destructive'} className="gap-1 rounded-full">
            {inStock ? <CircleCheckIcon /> : <CircleXIcon />}
            {inStock ? 'In Stock' : 'Out of Stock'}
          </Badge>
        </div>

        <p className="text-2xl font-semibold tabular-nums lg:text-3xl">{formatPrice(product.price)}</p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Description</h2>
        <p className="leading-relaxed whitespace-pre-line text-muted-foreground">{shownDescription}</p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="w-fit text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {expanded ? 'See less' : 'See more'}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={addToCart.isPending}>
          {addToCart.isPending ? <Spinner /> : <ShoppingCartIcon />}
          Add to Cart
        </Button>
        <Button size="lg" variant="outline" disabled className="flex-1">
          Checkout Now
        </Button>
      </div>
    </div>
  )
}
