import { Outlet } from 'react-router'
import { NavBar } from '@/components/nav-bar'
import { Footer } from '@/components/footer'

/**
 * RootLayout — persistent app shell (nav bar + footer) wrapping every public
 * route ("/", "/sign-in", "/sign-up").
 */
export const RootLayout = () => {
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      <NavBar />
      <Outlet />
      <Footer />
    </div>
  )
}
