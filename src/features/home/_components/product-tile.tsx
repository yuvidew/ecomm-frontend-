import { PackageIcon, StarIcon } from 'lucide-react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DummyProduct } from '../types/home'

/**
 * ProductTile — non-clickable trending-product preview tile: placeholder
 * image, optional sale/new badge, rating, and price (with strikethrough
 * original price when the product has one).
 * @param product - dummy product to display
 */
export const ProductTile = ({ product }: { product: DummyProduct }) => {
  const filledStars = Math.round(product.rating)

  return (
    <Card className="h-full gap-0 py-0">
      <div className="relative">
        <AspectRatio ratio={16 / 10} className="flex items-center justify-center overflow-hidden bg-muted">
          <PackageIcon className="size-10 text-muted-foreground" />
        </AspectRatio>
        {product.badge && (
          <Badge
            className="absolute top-3 left-3"
            variant={product.badge === 'Sale' ? 'destructive' : 'secondary'}
          >
            {product.badge}
          </Badge>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-base font-medium">{product.name}</h3>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <StarIcon
              key={i}
              className={cn('size-3.5', i < filledStars ? 'fill-primary text-primary' : 'text-muted-foreground')}
            />
          ))}
          <span className="ml-1 text-xs text-muted-foreground">({product.reviews})</span>
        </div>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <span className="text-base font-semibold tabular-nums">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through tabular-nums">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
