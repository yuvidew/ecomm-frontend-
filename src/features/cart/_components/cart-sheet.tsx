import { ImageIcon, MinusIcon, PlusIcon, ShoppingBagIcon } from 'lucide-react'
import { toast } from 'sonner'
import { QueryErrorAlert } from '@/components/query-error-alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/http'
import { useCart } from '../hooks/use-cart'
import { useClearCart } from '../hooks/use-clear-cart'
import { useRemoveCartItem } from '../hooks/use-remove-cart-item'
import { useUpdateCartItem } from '../hooks/use-update-cart-item'
import type { CartItem } from '../types/cart'

// stock at or below this count gets a "Low Stock" badge instead of "In Stock"
const LOW_STOCK_THRESHOLD = 5

/**
 * CartRow — one cart line as a card: product thumbnail, name, stock badge,
 * description preview, unit price, and a quantity stepper. Decrementing
 * below 1 removes the line from the cart.
 * @param item - cart line to render
 */
const CartRow = ({ item }: { item: CartItem }) => {
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const isPending = updateItem.isPending || removeItem.isPending
  const outOfStock = item.stock <= 0
  const lowStock = !outOfStock && item.stock <= LOW_STOCK_THRESHOLD
  const [cover] = item.images

  const handleDecrement = () => {
    if (item.quantity <= 1) {
      removeItem.mutate(item.id, {
        onError: (error) => toast.error(getApiErrorMessage(error, 'Could not remove item')),
      })
      return
    }
    updateItem.mutate(
      { itemId: item.id, input: { quantity: item.quantity - 1 } },
      { onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update quantity')) },
    )
  }

  const handleIncrement = () => {
    updateItem.mutate(
      { itemId: item.id, input: { quantity: item.quantity + 1 } },
      { onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update quantity')) },
    )
  }

  return (
    <Card className="p-3">
      <div className="flex gap-3">
        <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted text-muted-foreground">
          {cover ? (
            <img src={cover} alt={item.name} loading="lazy" className="size-full object-contain" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageIcon className="size-6" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between gap-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-1 text-sm font-medium">{item.name}</h4>
            <Badge variant={outOfStock ? 'destructive' : lowStock ? 'outline' : 'secondary'} className="shrink-0">
              {outOfStock ? 'Out of Stock' : lowStock ? `Low Stock: ${item.stock}` : `In Stock: ${item.stock}`}
            </Badge>
          </div>
          {item.description && <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
          <div className="flex items-center justify-between gap-2">
            <span className="text-base font-semibold tabular-nums">{formatPrice(item.price)}</span>
            <div className="flex items-center gap-1 rounded-full border p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 rounded-full"
                disabled={isPending}
                onClick={handleDecrement}
                aria-label="Decrease quantity"
              >
                <MinusIcon className="size-3" />
              </Button>
              <span className="w-4 text-center text-sm tabular-nums">{item.quantity}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 rounded-full"
                disabled={isPending || item.quantity >= item.stock}
                onClick={handleIncrement}
                aria-label="Increase quantity"
              >
                <PlusIcon className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

/**
 * CartSheet — Sheet content listing the signed-in user's cart: each item's
 * name/stock/price and a quantity stepper, plus a running total. Rendered
 * inside NavBar's cart Sheet, opened by the ShoppingBagIcon button.
 */
export const CartSheet = () => {
  const { data: cart, isLoading, isError, error } = useCart()
  const clearCart = useClearCart()

  return (
    <div className="flex h-full flex-col">
      <SheetHeader>
        <SheetTitle>Your Cart</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-4">
        {isLoading ? (
          <div className="flex flex-col gap-3 py-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <QueryErrorAlert message={getApiErrorMessage(error, 'Could not load your cart')} />
        ) : !cart?.items.length ? (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShoppingBagIcon />
              </EmptyMedia>
              <EmptyTitle>Your cart is empty</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3 py-3">
            {cart.items.map((item) => (
              <CartRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {!!cart?.items.length && (
        <div className="border-t p-4">
          <div className="flex items-center justify-between pb-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-semibold tabular-nums">{formatPrice(cart.total)}</span>
          </div>
          <Separator className="mb-3" />
          <Button
            variant="outline"
            className="w-full"
            disabled={clearCart.isPending}
            onClick={() =>
              clearCart.mutate(undefined, {
                onError: (error) => toast.error(getApiErrorMessage(error, 'Could not clear cart')),
              })
            }
          >
            Clear cart
          </Button>
        </div>
      )}
    </div>
  )
}
