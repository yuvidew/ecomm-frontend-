import { ArrowRightIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useCountdown } from '@/hooks/use-countdown'
import { cn } from '@/lib/utils'

// hosted on Appwrite storage — promo banner lifestyle photos, shown side by side on the right
const PROMO_IMAGE_URLS = [
  'https://fra.cloud.appwrite.io/v1/storage/buckets/6ab3749700041e900e41/files/6ab4fe03001c6dd3bac0/view?project=6ab374240038d71f92db',
  'https://fra.cloud.appwrite.io/v1/storage/buckets/6ab3749700041e900e41/files/6ab4f87e0005c39564a4/view?project=6ab374240038d71f92db',
]

// decorative-only duration — no backend sale-expiry field yet, so this just resets on every
// page load rather than counting down to a real date
const SALE_COUNTDOWN_MS = ((2 * 24 + 14) * 60 + 36) * 60 * 1000 + 45 * 1000

const COUNTDOWN_UNITS = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hrs' },
  { key: 'minutes', label: 'Mins' },
  { key: 'seconds', label: 'Secs' },
] as const

/**
 * PromoBanner — home page "Limited Time" sale section: copy + CTA on the left, a live
 * countdown circle in the middle, and two lifestyle photos on the right.
 */
const PromoBanner = () => {
  const countdown = useCountdown(SALE_COUNTDOWN_MS)

  return (
    <section className="mx-auto w-full max-w-7xl px-6 lg:px-6">
      <div className="flex flex-col overflow-hidden rounded-2xl bg-muted sm:flex-row sm:items-center">
        <div className="flex  flex-col items-start gap-4 px-8 py-12 sm:px-12">
          <span className="rounded-full bg-background px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Limited Time Offer
          </span>
          <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
            Up to 40% off selected items
          </h2>
          <p className="text-muted-foreground">
            Get up to 40% off on selected items while supplies last.
          </p>
          <a
            href="#trending-products"
            className={cn(buttonVariants({ size: 'lg' }), 'mt-2 gap-2')}
          >
            Shop the Sale
            <ArrowRightIcon className="size-4" />
          </a>
        </div>

        <div className="flex shrink-0 items-center justify-center px-8 py-6 sm:px-4">
          <div className="flex size-40 shrink-0 flex-col items-center justify-center gap-1 rounded-full bg-background text-center shadow-sm">
            <p className="text-[11px] font-medium text-muted-foreground">Hurry Up!</p>
            <p className="text-[11px] font-medium text-muted-foreground">Offer ends in</p>
            <div className="mt-1 flex items-baseline gap-1 font-heading text-lg font-semibold text-foreground">
              {COUNTDOWN_UNITS.map((unit, index) => (
                <span key={unit.key} className="flex items-baseline">
                  {index > 0 && <span className="mx-0.5 text-muted-foreground">:</span>}
                  {String(countdown[unit.key]).padStart(2, '0')}
                </span>
              ))}
            </div>
            <div className="flex gap-2.5 text-[9px] text-muted-foreground">
              {COUNTDOWN_UNITS.map((unit) => (
                <span key={unit.key}>{unit.label}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex h-48 flex-1 w-full shrink-0 sm:h-auto sm:w-72 sm:self-stretch">
          {PROMO_IMAGE_URLS.map((src) => (
            <img
              key={src}
              src={src}
              alt=""
              aria-hidden="true"
              className="h-full w-1/2 object-cover"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default PromoBanner
