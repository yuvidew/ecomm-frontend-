import { Link } from 'react-router'
import { PlusIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { ProductGrid } from '@/features/products/_components/product-grid'
import { useProducts } from '@/features/products/hooks/use-products'

/**
 * AdminProductsPage — /admin: the dashboard landing page, a grid of every
 * product with a "New product" action.
 */
const AdminProductsPage = () => {
  // cheap lookup just for the totals below — the grid itself owns its own paginated query
  const { data: productsPage } = useProducts({ page: 1, limit: 1 })
  const { data: categories } = useCategories()

  return (
    <>
      <SiteHeader
        title="Products"
        actions={
          <Button asChild size="sm">
            <Link to="/admin/products/new">
              <PlusIcon />
              New product
            </Link>
          </Button>
        }
      />
      <main className="flex flex-col gap-6 p-4 lg:p-6">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">
              {productsPage?.pagination.total ?? '—'}
            </span>{' '}
            products
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">{categories?.length ?? '—'}</span>{' '}
            categories
          </span>
        </div>
        <ProductGrid />
      </main>
    </>
  )
}

export default AdminProductsPage
