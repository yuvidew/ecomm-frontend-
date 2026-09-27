import { Link } from 'react-router'
import { ImageIcon } from 'lucide-react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Product } from '../types/products'

// stock at or below this count gets a "Only N left" badge
const LOW_STOCK_THRESHOLD = 5

/**
 * ProductCard — clickable product tile: cover image with an optional stock
 * badge, name, one-line description, and a price row with a "View details"
 * call to action. The whole card links to the admin detail page.
 * @param product - product returned from GET /api/products
 */
export const ProductCard = ({ product }: { product: Product }) => {
  const [cover] = product.images
  const outOfStock = product.stock <= 0
  const lowStock = !outOfStock && product.stock <= LOW_STOCK_THRESHOLD

  return (
    <Link
      to={`/admin/products/${product.id}`}
      className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full gap-0 py-0">
        <div className="relative">
          <AspectRatio ratio={16 / 10} className="overflow-hidden bg-muted">
            {cover ? (
              <img
                src={cover}
                alt={product.name}
                loading="lazy"
                className={cn(
                  'size-full object-contain transition-transform duration-300 group-hover:scale-105',
                  outOfStock && 'opacity-60 grayscale',
                )}
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <ImageIcon className="size-10" />
              </div>
            )}
          </AspectRatio>
          {(outOfStock || lowStock) && (
            <Badge className="absolute top-3 left-3 bg-destructive text-white">
              {outOfStock ? 'Out of stock' : `Only ${product.stock} left`}
            </Badge>
          )}
        </div>
        <CardContent className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-1 text-base font-medium">{product.name}</h3>
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {product.description || 'No description'}
          </p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-1">
            <span className="text-base font-semibold tabular-nums">{formatPrice(product.price)}</span>
            {/* styled as a button but rendered as a span -- the whole card is already the link */}
            <span className={buttonVariants({ variant: 'secondary', size: 'sm' })}>View details</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
