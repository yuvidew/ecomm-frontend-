import { useParams } from 'react-router'
import { QueryErrorAlert } from '@/components/query-error-alert'
import { SiteHeader } from '@/components/site-header'
import { Spinner } from '@/components/ui/spinner'
import { ProductForm } from '@/features/products/_components/product-form'
import { useProduct } from '@/features/products/hooks/use-product'
import { getApiErrorMessage } from '@/lib/http'

/**
 * ProductFormPage — /admin/products/new (create) and
 * /admin/products/:id/edit (edit). In edit mode it loads the product first
 * and renders the form prefilled.
 */
const ProductFormPage = () => {
  const { id: idParam } = useParams()
  const id = Number(idParam)
  const isEdit = idParam !== undefined
  const { data: product, isLoading, isError, error } = useProduct(id)

  return (
    <>
      <SiteHeader
        title={isEdit ? 'Edit product' : 'New product'}
        breadcrumb={[
          { label: 'Products', href: '/admin' },
          ...(isEdit
            ? [{ label: product?.name ?? 'Product', href: `/admin/products/${idParam}` }, { label: 'Edit' }]
            : [{ label: 'New' }]),
        ]}
      />
      <main className="p-4 lg:p-6">
        {!isEdit && <ProductForm />}
        {isEdit && isLoading && <Spinner className="mx-auto size-6" />}
        {isEdit && isError && <QueryErrorAlert message={getApiErrorMessage(error, 'Could not load product')} />}
        {/* keyed so navigating between products resets the form's local state */}
        {isEdit && product && <ProductForm key={product.id} product={product} />}
      </main>
    </>
  )
}

export default ProductFormPage
