import { ImageIcon } from 'lucide-react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Card, CardContent } from '@/components/ui/card'
import type { Category } from '../types/categories'

/**
 * CategoryTile — non-clickable storefront category preview: cover image on a
 * square tile plus the category name below.
 * @param category - category returned from GET /api/categories
 */
export const CategoryTile = ({ category }: { category: Category }) => {
  return (
    <Card className="gap-0 py-0 border-none border-0 ring-0">
      <CardContent className="flex flex-col items-center gap-3 p-0 border-none">
        <AspectRatio ratio={1} className="w-full overflow-hidden rounded-lg bg-muted">
          {category.image ? (
            <img
              src={category.image}
              alt={category.name}
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-8" />
            </div>
          )}
        </AspectRatio>
        <p className="text-center text-sm font-medium text-foreground">{category.name}</p>
      </CardContent>
    </Card>
  )
}
