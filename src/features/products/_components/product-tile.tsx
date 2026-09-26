import { ImageIcon } from 'lucide-react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/format'
import type { Product } from '../types/products'

/**
 * ProductTile — non-clickable storefront product preview: cover image, name,
 * and price. Used by the trending section and the public products catalog;
 * distinct from the admin `ProductCard`, which links to the admin detail page.
 * @param product - product returned from GET /api/products
 */
export const ProductTile = ({ product }: { product: Product }) => {
  const [cover] = product.images

  return (
    <Card className="h-full gap-0 py-0">
      <AspectRatio ratio={16 / 10} className="overflow-hidden bg-muted">
        {cover ? (
          <img src={cover} alt={product.name} loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-10" />
          </div>
        )}
      </AspectRatio>
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-base font-medium">{product.name}</h3>
        <span className="mt-auto text-base font-semibold tabular-nums">{formatPrice(product.price)}</span>
      </CardContent>
    </Card>
  )
}
