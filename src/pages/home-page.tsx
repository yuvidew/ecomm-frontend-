import { Link } from 'react-router'
import { HeadsetIcon, RotateCcwIcon, ShieldCheckIcon, TruckIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/use-session'
import { CategoryGrid } from '@/features/categories/_components/category-grid'
import { FeatureItem } from '@/features/home/_components/feature-item'
import { ProductTile } from '@/features/home/_components/product-tile'
import PromoBanner from '@/features/home/_components/promo-banner'
import type { DummyProduct, Feature, TrustStat } from '@/features/home/types/home'

// hosted on Appwrite storage — the hero's background product photo
const HERO_IMAGE_URL =
  'https://fra.cloud.appwrite.io/v1/storage/buckets/6ab3749700041e900e41/files/6ab4d75d002d339bbffc/view?project=6ab374240038d71f92db'

// placeholder catalog for this UI-first phase — will be replaced by
// useProducts()/useCategories() once the backend has real rows to show
const DUMMY_TRENDING_PRODUCTS: DummyProduct[] = [
  { id: 1, name: 'Urban Backpack', price: 4899, originalPrice: 6499, rating: 4.5, reviews: 128, badge: 'Sale' },
  { id: 2, name: 'Minimal White Sneakers', price: 6499, rating: 4.2, reviews: 96 },
  { id: 3, name: 'Classic Brown Watch', price: 10599, rating: 4.7, reviews: 64, badge: 'New' },
  { id: 4, name: 'Polarized Sunglasses', price: 4099, rating: 4.3, reviews: 82 },
  { id: 5, name: 'Hydrating Face Serum', price: 1999, originalPrice: 2799, rating: 4.1, reviews: 45, badge: 'Sale' },
  { id: 6, name: 'Everyday Tote Bag', price: 3299, rating: 4.6, reviews: 58 },
  { id: 7, name: 'Wireless Earbuds', price: 5499, rating: 4.4, reviews: 210, badge: 'New' },
  { id: 8, name: 'Ceramic Table Lamp', price: 2899, rating: 4.0, reviews: 37 },
]

const FEATURES: Feature[] = [
  { icon: TruckIcon, label: 'Free Shipping', description: 'On orders over ₹999' },
  { icon: RotateCcwIcon, label: 'Easy Returns', description: '30-day return policy' },
  { icon: ShieldCheckIcon, label: 'Secure Payment', description: '100% protected checkout' },
  { icon: HeadsetIcon, label: '24/7 Support', description: 'Dedicated support team' },
]

const TRUST_STATS: TrustStat[] = [
  { label: 'Average Rating', value: '4.8★' },
  { label: 'Happy Customers', value: '50k+' },
  { label: 'Secure Checkout', value: '100%' },
  { label: 'Customer Support', value: '24/7' },
]

/**
 * HomePage — landing route ("/"). Storefront marketing page: hero, feature
 * highlights, category grid, promo banner, trending products, and trust
 * stats. Categories are real data via `CategoryGrid`; trending products are
 * still placeholder data for this UI-first phase — see
 * DUMMY_TRENDING_PRODUCTS above.
 */
const HomePage = () => {
  const { session } = useSession()

  return (
    <main id="main-content" className="flex flex-1 flex-col">
      <section className="relative isolate min-h-[420px] overflow-hidden lg:min-h-[560px]">
        <img
          src={HERO_IMAGE_URL}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full object-cover object-[70%_center]"
        />

        <div className="mx-auto flex min-h-[420px] w-full max-w-7xl items-center px-6 py-16 lg:min-h-[560px] lg:px-6">
          <div className="max-w-xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
            <Badge variant="secondary">New Collection</Badge>
            <h1 className="mt-4 font-heading text-5xl text-primary font-semibold tracking-tight text-pretty lg:text-6xl">
              Shop the styles you&apos;ll love this season.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Discover carefully curated products designed for quality, style, and everyday
              comfort.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {session ? (
                session.user.role === 'admin' ? (
                  <Button asChild size="lg">
                    <Link to="/admin">Go to admin dashboard</Link>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">Signed in as {session.user.email}.</p>
                )
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link to="/sign-up">Create account</Link>
                  </Button>
                  <Button asChild variant="ghost" size="lg">
                    <Link to="/sign-in">Sign in</Link>
                  </Button>
                </>
              )}
              <a href="#trending-products" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Shop Now
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-6 px-6 py-10 sm:grid-cols-4 lg:px-6">
          {FEATURES.map((feature) => (
            <FeatureItem key={feature.label} {...feature} />
          ))}
        </div>
      </section>

      <section id="shop-by-category" className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-semibold text-foreground">Shop by Category</h2>
            <p className="mt-1 text-muted-foreground">Find exactly what you&apos;re looking for.</p>
          </div>
          {/* not wired to a route yet — no public category-listing page exists */}
          <a href="#shop-by-category" className="text-sm font-medium text-primary hover:underline">
            View all categories
          </a>
        </div>
        <CategoryGrid limit={6} />
      </section>

      <PromoBanner />

      <section id="trending-products" className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-6">
        <div className="mb-8">
          <h2 className="font-heading text-3xl font-semibold text-foreground">Trending Products</h2>
          <p className="mt-1 text-muted-foreground">Our customers&apos; current favorites.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DUMMY_TRENDING_PRODUCTS.map((product) => (
            <ProductTile key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-2">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {TRUST_STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-heading text-2xl font-semibold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default HomePage
