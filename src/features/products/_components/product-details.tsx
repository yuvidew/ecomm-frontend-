import { useState } from 'react'
import { CircleCheckIcon, CircleXIcon, ImageIcon } from 'lucide-react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { formatDate, formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Product } from '../types/products'

/**
 * ProductDetails — full view of one product: a large main image with a
 * clickable thumbnail strip on the left; name, price, stock status,
 * description, and a "Product Details" spec list on the right.
 * @param product - product returned from GET /api/products/:id
 */
export const ProductDetails = ({ product }: { product: Product }) => {
  const { data: categories } = useCategories()
  const [selectedIndex, setSelectedIndex] = useState(0)
  // the product row only carries category_id, so resolve the name from the cached list
  const categoryName = categories?.find((category) => category.id === product.category_id)?.name
  // fall back to the first image if the selected index no longer exists (e.g. product changed)
  const mainImage = product.images[selectedIndex] ?? product.images[0]
  const inStock = product.stock > 0

  const specs = [
    { label: 'Category', value: categoryName ?? '—' },
    { label: 'Stock', value: inStock ? `${product.stock} units` : 'Out of stock' },
    { label: 'Slug', value: product.slug },
    { label: 'Created', value: formatDate(product.created_at) },
    { label: 'Updated', value: formatDate(product.updated_at) },
  ]

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="flex flex-col gap-4">
        <AspectRatio ratio={1} className="overflow-hidden rounded-xl bg-muted">
          {mainImage ? (
            <img src={mainImage} alt={product.name} className="size-full object-contain" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-10" />
            </div>
          )}
        </AspectRatio>

        {product.images.length > 1 && (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
            {product.images.map((url, index) => (
              <button
                key={url}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Show image ${index + 1}`}
                aria-pressed={url === mainImage}
                className={cn(
                  'overflow-hidden rounded-lg bg-muted ring-2 ring-transparent transition outline-none focus-visible:ring-ring',
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

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
            <h2 className="font-heading text-3xl font-bold tracking-tight lg:text-4xl">{product.name}</h2>
            <p className="text-2xl font-semibold tabular-nums lg:text-3xl">{formatPrice(product.price)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={inStock ? 'secondary' : 'destructive'} className="gap-1 rounded-full">
              {inStock ? <CircleCheckIcon /> : <CircleXIcon />}
              {inStock ? 'In Stock' : 'Out of Stock'}
            </Badge>
            {categoryName && (
              <Badge variant="outline" className="rounded-full">
                {categoryName}
              </Badge>
            )}
          </div>
        </div>

        <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
          {product.description || 'No description.'}
        </p>

        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold">Product Details</h3>
          <dl className="divide-y">
            {specs.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4 py-4">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
