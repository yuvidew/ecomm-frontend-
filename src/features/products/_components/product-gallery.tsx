import { useState } from 'react'
import { HeartIcon, ImageIcon, Share2Icon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/use-session'
import { useAddFavorite } from '@/features/favorites/hooks/use-add-favorite'
import { useFavorites } from '@/features/favorites/hooks/use-favorites'
import { useRemoveFavorite } from '@/features/favorites/hooks/use-remove-favorite'
import { getApiErrorMessage } from '@/lib/http'
import { cn } from '@/lib/utils'
import type { Product } from '../types/products'

/**
 * ProductGallery — main product image with a clickable thumbnail strip, plus
 * wishlist/share icon buttons. The wishlist heart calls `/api/favorites`
 * (redirecting signed-out visitors to `/sign-in`); Share stays an inert
 * placeholder.
 * @param product - product returned from GET /api/products/:id
 */
export const ProductGallery = ({ product }: { product: Product }) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const mainImage = product.images[selectedIndex] ?? product.images[0]
  const { session } = useSession()
  const navigate = useNavigate()

  const { favorites } = useFavorites()
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()
  const isFavorited = favorites.some((favorite) => favorite.product_id === product.id)
  const isFavoritePending = addFavorite.isPending || removeFavorite.isPending

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
    <div className="flex flex-col gap-4">
      <div className="relative">
        <AspectRatio ratio={1} className="overflow-hidden rounded-xl bg-muted">
          {mainImage ? (
            <img src={mainImage} alt={product.name} className="size-full object-contain" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-10" />
            </div>
          )}
        </AspectRatio>
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow"
            onClick={handleToggleFavorite}
            disabled={isFavoritePending}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorited}
          >
            <HeartIcon className={cn('size-4', isFavorited && 'fill-destructive text-destructive')} />
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full shadow" aria-label="Share this product">
            <Share2Icon className="size-4" />
          </Button>
        </div>
      </div>

      {product.images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {product.images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Show image ${index + 1}`}
              aria-pressed={url === mainImage}
              className={cn(
                'overflow-hidden rounded-lg bg-muted cursor-pointer ring-2 ring-transparent transition outline-none focus-visible:ring-ring',
                url === mainImage ? 'ring-primary' : 'opacity-70 hover:opacity-100',
              )}
            >
              <AspectRatio ratio={1}>
                <img src={url} alt="" className="size-full object-contain" />
              </AspectRatio>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
