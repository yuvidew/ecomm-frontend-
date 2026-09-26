import { ArrowRightIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// hosted on Appwrite storage — reused from the home page hero, same bucket as promo-banner.tsx
const BANNER_IMAGE_URL ="https://fra.cloud.appwrite.io/v1/storage/buckets/6ab3749700041e900e41/files/6ab670010030e1aae920/view?project=6ab374240038d71f92db"
/**
 * ShopBanner — promo section at the top of the shop page: copy + CTA on the
 * left, a lifestyle photo on the right. CTA scrolls down to the product grid.
 */
export const ShopBanner = () => {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 pt-10 lg:px-6">
      <div className="flex flex-col overflow-hidden justify-between rounded-2xl bg-muted sm:flex-row sm:items-center">
        <div className="flex flex-col items-start gap-4 px-8 py-12 sm:px-12">
          <span className="rounded-full bg-background px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Full Collection
          </span>
          <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
            New arrivals every week
          </h1>
          <p className="max-w-md text-muted-foreground">
            Discover our full collection, curated for your style. Filter by category and price to
            find exactly what you&apos;re looking for.
          </p>
          <a href="#shop-results" className={cn(buttonVariants({ size: 'lg' }), 'mt-2 gap-2')}>
            Shop Now
            <ArrowRightIcon className="size-4" />
          </a>
        </div>

        <div className="h-48 w-full shrink-0 sm:h-72 sm:w-80 sm:self-stretch">
          <img
            src={BANNER_IMAGE_URL}
            alt=""
            aria-hidden="true"
            className="size-full object-contain"
          />
        </div>
      </div>
    </section>
  )
}
