import { ProductCatalog } from '@/features/products/_components/product-catalog'
import { ShopBanner } from '@/features/products/_components/shop-banner'

/**
 * ShopPage — route ("/shop"): promo banner, then the filterable, searchable
 * product catalog (category + price range filters, side-by-side with the grid).
 */
const ShopPage = () => {
  return (
    <main id="main-content" className="flex flex-1 flex-col">
      <ShopBanner />
      <ProductCatalog />
    </main>
  )
}

export default ShopPage
