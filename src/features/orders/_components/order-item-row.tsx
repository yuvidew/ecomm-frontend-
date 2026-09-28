import { ImageIcon } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import type { OrderItem } from '../types/orders'

/**
 * OrderItemRow — one line item within an expanded order card: product
 * thumbnail, name, quantity × unit price, and the line total.
 * @param item - order line item to render
 */
export const OrderItemRow = ({ item }: { item: OrderItem }) => {
  const [cover] = item.images

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted text-muted-foreground">
        {cover ? (
          <img src={cover} alt={item.name} loading="lazy" className="size-full object-contain" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-5" />
          </div>
        )}
      </div>
      <div className="flex flex-1 items-center justify-between gap-2">
        <div>
          <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            Qty {item.quantity} &times; {formatPrice(item.price)}
          </p>
        </div>
        <span className="text-sm font-semibold tabular-nums">{formatPrice(Number(item.price) * item.quantity)}</span>
      </div>
    </div>
  )
}
