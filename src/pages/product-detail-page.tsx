import { useParams } from 'react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { QueryErrorAlert } from '@/components/query-error-alert'
import { Spinner } from '@/components/ui/spinner'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { ProductGallery } from '@/features/products/_components/product-gallery'
import { ProductInfo } from '@/features/products/_components/product-info'
import { useProduct } from '@/features/products/hooks/use-product'
import { ReviewList } from '@/features/reviews/_components/review-list'
import { ReviewSummary } from '@/features/reviews/_components/review-summary'
import { useProductReviews } from '@/features/reviews/hooks/use-product-reviews'
import { getApiErrorMessage } from '@/lib/http'

// backend's max page size -- fetched once to derive the rating breakdown client-side (see phase-14 plan)
const REVIEWS_BATCH_LIMIT = 100

/**
 * ProductDetailPage — /shop/:id: image gallery, product info, and the
 * reviews section for one product.
 */
const ProductDetailPage = () => {
  const id = Number(useParams().id)
  const { data: product, isLoading, isError, error } = useProduct(id)
  const { data: categories } = useCategories()
  const reviewsQuery = useProductReviews(id, { page: 1, limit: REVIEWS_BATCH_LIMIT })
  const reviews = reviewsQuery.data?.reviews ?? []

  const categoryName = categories?.find((category) => category.id === product?.category_id)?.name

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-10 lg:px-6">
      {isLoading && <Spinner className="size-6 self-center" />}
      {isError && <QueryErrorAlert message={getApiErrorMessage(error, 'Could not load product')} />}

      {product && (
        <>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/shop">Shop</BreadcrumbLink>
              </BreadcrumbItem>
              {categoryName && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{categoryName}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <ProductGallery product={product} />
            <ProductInfo product={product} />
          </div>

          <section id="reviews" className="flex flex-col gap-6 border-t pt-10">
            <h2 className="font-heading text-2xl font-semibold">Product Reviews</h2>
            <ReviewSummary product={product} reviews={reviews} />
            <ReviewList
              productId={id}
              reviews={reviews}
              isLoading={reviewsQuery.isLoading}
              isError={reviewsQuery.isError}
              error={reviewsQuery.error}
            />
          </section>
        </>
      )}
    </main>
  )
}

export default ProductDetailPage
