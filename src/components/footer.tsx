import { Link } from 'react-router'
import { StoreIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

// dummy link columns — no real destinations yet, purely visual footer chrome
const FOOTER_COLUMNS = [
  { heading: 'Shop', links: ['New Arrivals', 'Best Sellers', 'Sale', 'Trending'] },
  { heading: 'Customer Service', links: ['Contact Us', 'FAQs', 'Shipping & Returns', 'Track Order'] },
  { heading: 'Company', links: ['About Us', 'Careers', 'Privacy Policy', 'Terms of Service'] },
]

// lucide-react ships no brand/logo icons in this version, so socials are plain text links
const SOCIAL_LINKS = ['Instagram', 'X', 'Facebook', 'YouTube']

/**
 * Footer — site-wide footer shown under every public route via `RootLayout`.
 * Static brand/link content and an inert newsletter form, no data fetching.
 */
export const Footer = () => {
  return (
    <footer className="mt-auto">
      <Separator />
      <div className="mx-auto w-full max-w-7xl px-4 py-12 lg:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="col-span-2 flex flex-col gap-3 lg:col-span-2">
            <div className="flex items-center gap-2">
              <StoreIcon className="size-4 text-primary" />
              <span className="font-heading text-sm font-semibold">Index</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Every category, in one place, easy to find.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading} className="flex flex-col gap-3">
              <h3 className="font-heading text-sm font-semibold">{column.heading}</h3>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-heading text-sm font-semibold">Subscribe to our newsletter</h3>
            <p className="text-sm text-muted-foreground">Get updates on new arrivals and offers.</p>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full max-w-sm items-center gap-2"
          >
            <Input type="email" placeholder="Enter your email" required />
            <Button type="submit" size="sm">
              Subscribe
            </Button>
          </form>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Index. All rights reserved.
          </p>
          <Link
            to="/sign-in"
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Admin sign in
          </Link>
        </div>
      </div>
    </footer>
  )
}
