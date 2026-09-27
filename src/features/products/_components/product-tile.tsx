import { HeartIcon, ImageIcon, ShoppingCartIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useSession } from '@/features/auth/hooks/use-session'
import { useAddToCart } from '@/features/cart/hooks/use-add-to-cart'
import { useCart } from '@/features/cart/hooks/use-cart'
import { useAddFavorite } from '@/features/favorites/hooks/use-add-favorite'
import { useFavorites } from '@/features/favorites/hooks/use-favorites'
import { useRemoveFavorite } from '@/features/favorites/hooks/use-remove-favorite'
import { formatPrice } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/http'
import { cn } from '@/lib/utils'
import type { Product } from '../types/products'

/**
 * ProductTile — storefront product preview: cover image, name, price, a
 * hover-revealed favorite toggle (top-left over the image), and "View
 * Details"/"Add to Cart" actions. Used by the trending section and the
 * public products catalog; distinct from the admin `ProductCard`, which
 * links to the admin detail page instead. Signed-out visitors are sent to
 * `/sign-in` when they try to add to cart or favorite.
 * @param product - product returned from GET /api/products
 */
export const ProductTile = ({ product }: { product: Product }) => {
  const [cover] = product.images
  const { session } = useSession()
  const navigate = useNavigate()

  const { data: cart } = useCart()
  const { favorites } = useFavorites()
  const addToCart = useAddToCart()
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()

  const isInCart = cart?.items.some((item) => item.product_id === product.id) ?? false
  const isFavorited = favorites.some((favorite) => favorite.product_id === product.id)
  const isFavoritePending = addFavorite.isPending || removeFavorite.isPending

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

  const handleToggleFavorite = () => {
    if (!session) {
      navigate('/sign-in')
      return
    }
    if (isFavorited) {
      removeFavorite.mutate(
        { productId: product.id },
        { onError: (error) => toast.error(getApiErrorMessage(error, 'Could not remove favorite')) },
      )
    } else {
      addFavorite.mutate(
        { productId: product.id },
        { onError: (error) => toast.error(getApiErrorMessage(error, 'Could not add favorite')) },
      )
    }
  }

  return (
    <Card className="group relative h-full gap-0 py-0 transition-shadow hover:shadow-md">
      <Link
        to={`/shop/${product.id}`}
        className="block rounded-t-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <AspectRatio ratio={16 / 10} className="overflow-hidden bg-muted">
          {cover ? (
            <img
              src={cover}
              alt={product.name}
              loading="lazy"
              className="size-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-10" />
            </div>
          )}
        </AspectRatio>
        <CardContent className="flex flex-col gap-2 p-4 pb-2">
          <h3 className="line-clamp-1 text-base font-medium">{product.name}</h3>
          <span className="text-base font-semibold tabular-nums">{formatPrice(product.price)}</span>
        </CardContent>
      </Link>

      <Button
        type="button"
        variant="secondary"
        size="icon"
        onClick={handleToggleFavorite}
        disabled={isFavoritePending}
        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        aria-pressed={isFavorited}
        className={cn(
          'absolute top-3 left-3 size-8 rounded-full shadow transition-opacity',
          isFavorited ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
        )}
      >
        <HeartIcon className={cn('size-4', isFavorited && 'fill-destructive text-destructive')} />
      </Button>

      <div className="flex items-center gap-2 p-4 pt-2">
        <Link
          to={`/shop/${product.id}`}
          className={"p-0"}
        >
          <Button variant={"outline"} >
          View Details
          </Button>
        </Link>
        <Button size="sm" className="flex-1" onClick={handleAddToCart} disabled={addToCart.isPending}>
          {addToCart.isPending ? <Spinner /> : <ShoppingCartIcon />}
          {isInCart ? 'In Cart' : 'Add to Cart'}
        </Button>
      </div>
    </Card>
  )
}
