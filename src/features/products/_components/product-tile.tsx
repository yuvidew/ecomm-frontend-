import { ImageIcon } from 'lucide-react'
import { Link } from 'react-router'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/format'
import type { Product } from '../types/products'

/**
 * ProductTile — storefront product preview: cover image, name, and price,
 * linking to that product's detail page. Used by the trending section and
 * the public products catalog; distinct from the admin `ProductCard`, which
 * links to the admin detail page instead.
 * @param product - product returned from GET /api/products
 */
export const ProductTile = ({ product }: { product: Product }) => {
  const [cover] = product.images

  return (
    <Link
      to={`/shop/${product.id}`}
      className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full gap-0 py-0 transition-shadow group-hover:shadow-md">
        <AspectRatio ratio={16 / 10} className="overflow-hidden bg-muted">
          {cover ? (
            <img
              src={cover}
              alt={product.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
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
    </Link>
  )
}
