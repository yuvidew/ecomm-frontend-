import { HeartIcon, ImageIcon, Trash2Icon } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { QueryErrorAlert } from '@/components/query-error-alert'
import { Card } from '@/components/ui/card'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/http'
import { useFavorites } from '../hooks/use-favorites'
import { useRemoveFavorite } from '../hooks/use-remove-favorite'
import type { Favorite } from '../types/favorites'


/**
 * FavoriteRow — one favorited product as a card: product thumbnail, name
 * (links to the product's detail page), description preview, price, and a
 * round remove button.
 * @param favorite - favorite to render
 */
const FavoriteRow = ({ favorite }: { favorite: Favorite }) => {
  const removeFavorite = useRemoveFavorite()
  const [cover] = favorite.images

  return (
    <Card className="p-3">
      <div className="flex gap-3">
        <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted text-muted-foreground">
          {cover ? (
            <img src={cover} alt={favorite.name} loading="lazy" className="size-full object-contain" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageIcon className="size-6" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Link to={`/shop/${favorite.product_id}`} className="line-clamp-1 text-sm font-medium hover:underline">
              {favorite.name}
            </Link>

            {favorite.description && (
              <p className="line-clamp-2 text-xs text-muted-foreground">{favorite.description}</p>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-base font-semibold tabular-nums">{formatPrice(favorite.price)}</span>
            <button
              type="button"
              className="p-0! cursor-pointer text-destructive"
              disabled={removeFavorite.isPending}
              onClick={() =>
                removeFavorite.mutate(
                  { productId: favorite.product_id },
                  { onError: (error) => toast.error(getApiErrorMessage(error, 'Could not remove favorite')) },
                )
              }
              aria-label="Remove from favorites"
            >
              <Trash2Icon className='size-5'/>
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}

/**
 * FavoritesSheet — Sheet content listing the signed-in user's favorited
 * products via the single-page `useFavorites` infinite query. Rendered
 * inside NavBar's favorites Sheet, opened by the HeartIcon button.
 */
export const FavoritesSheet = () => {
  const { favorites, isLoading, isError, error } = useFavorites()

  return (
    <div className="flex h-full flex-col">
      <SheetHeader>
        <SheetTitle>Your Favorites</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-4">
        {isLoading ? (
          <div className="flex flex-col gap-3 py-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <QueryErrorAlert message={getApiErrorMessage(error, 'Could not load your favorites')} />
        ) : !favorites.length ? (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HeartIcon />
              </EmptyMedia>
              <EmptyTitle>No favorites yet</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3 py-3">
            {favorites.map((favorite) => (
              <FavoriteRow key={favorite.id} favorite={favorite} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
