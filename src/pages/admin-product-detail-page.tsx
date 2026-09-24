import { Link, useParams } from 'react-router'
import { PencilIcon } from 'lucide-react'
import { QueryErrorAlert } from '@/components/query-error-alert'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { DeleteProductDialog } from '@/features/products/_components/delete-product-dialog'
import { ProductDetails } from '@/features/products/_components/product-details'
import { useProduct } from '@/features/products/hooks/use-product'
import { getApiErrorMessage } from '@/lib/http'

/**
 * AdminProductDetailPage — /admin/products/:id: full product view with
 * Edit and Delete actions.
 */
const AdminProductDetailPage = () => {
  const id = Number(useParams().id)
  const { data: product, isLoading, isError, error } = useProduct(id)

  return (
    <>
      <SiteHeader
        title={product?.name ?? 'Product'}
        breadcrumb={[{ label: 'Products', href: '/admin' }, { label: product?.name ?? 'Product' }]}
        actions={
          product && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to={`/admin/products/${product.id}/edit`}>
                  <PencilIcon />
                  Edit
                </Link>
              </Button>
              <DeleteProductDialog product={product} />
            </>
          )
        }
      />
      <main className="flex flex-col gap-6 p-4 lg:p-6">
        {isLoading && <Spinner className="size-6 self-center" />}
        {isError && <QueryErrorAlert message={getApiErrorMessage(error, 'Could not load product')} />}
        {product && <ProductDetails key={product.id} product={product} />}
      </main>
    </>
  )
}

export default AdminProductDetailPage
