import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { formatPrice } from '@/lib/format'

/**
 * ProductFilters — shop page sidebar content: category (single-select) and
 * price range (client-side, over the currently fetched batch). Rendered both
 * in the always-visible desktop sidebar and inside the mobile filters sheet.
 * @param priceBounds - `[min, max]` computed from the currently fetched product batch
 * @param isPriceLoading - true while the batch the price bounds come from is still loading
 */
export const ProductFilters = ({
  priceBounds,
  isPriceLoading,
}: {
  priceBounds: [number, number]
  isPriceLoading: boolean
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: categories, isLoading: categoriesLoading } = useCategories()

  const selectedCategory = searchParams.get('category')
  const [batchMin, batchMax] = priceBounds
  const minPrice = searchParams.has('minPrice') ? Number(searchParams.get('minPrice')) : batchMin
  const maxPrice = searchParams.has('maxPrice') ? Number(searchParams.get('maxPrice')) : batchMax

  // local drag state so the slider moves smoothly; the URL (and refetch) only
  // updates once the user releases the thumb, via onValueCommit. Reset it
  // during render (not an effect) whenever the committed range changes
  // externally -- e.g. a category switch shifts the batch's price bounds.
  const [draftRange, setDraftRange] = useState<[number, number]>([minPrice, maxPrice])
  const [committedRange, setCommittedRange] = useState<[number, number]>([minPrice, maxPrice])
  if (committedRange[0] !== minPrice || committedRange[1] !== maxPrice) {
    setCommittedRange([minPrice, maxPrice])
    setDraftRange([minPrice, maxPrice])
  }

  // toggles a category on (exclusively) or off -- the backend only accepts one categoryId
  const toggleCategory = (categoryId: number) => {
    const next = new URLSearchParams(searchParams)
    if (selectedCategory === String(categoryId)) {
      next.delete('category')
    } else {
      next.set('category', String(categoryId))
    }
    next.delete('page')
    setSearchParams(next)
  }

  const commitPriceRange = ([min, max]: number[]) => {
    const next = new URLSearchParams(searchParams)
    if (min <= batchMin && max >= batchMax) {
      next.delete('minPrice')
      next.delete('maxPrice')
    } else {
      next.set('minPrice', String(min))
      next.set('maxPrice', String(max))
    }
    next.delete('page')
    setSearchParams(next)
  }

  const clearAll = () => {
    const next = new URLSearchParams(searchParams)
    for (const key of ['category', 'search', 'minPrice', 'maxPrice', 'page']) {
      next.delete(key)
    }
    setSearchParams(next)
  }

  const hasActiveFilters = searchParams.has('category') || searchParams.has('minPrice')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-foreground">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-sm font-medium text-primary hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 border-b pb-6">
        <h3 className="text-sm font-semibold text-foreground">Category</h3>
        {categoriesLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-5 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {categories?.map((category) => (
              <div key={category.id} className="flex items-center gap-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategory === String(category.id)}
                  onCheckedChange={() => toggleCategory(category.id)}
                />
                <Label htmlFor={`category-${category.id}`} className="text-sm font-normal text-foreground">
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Price</h3>
        {isPriceLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="flex flex-col gap-4">
            <Slider
              min={batchMin}
              max={batchMax}
              step={1}
              value={draftRange}
              onValueChange={(value) => setDraftRange(value as [number, number])}
              onValueCommit={(value) => commitPriceRange(value)}
              disabled={batchMin === batchMax}
            />
            <div className="flex items-center gap-2">
              <Input value={formatPrice(draftRange[0])} readOnly className="h-8 text-sm" />
              <span className="text-muted-foreground">-</span>
              <Input value={formatPrice(draftRange[1])} readOnly className="h-8 text-sm" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
