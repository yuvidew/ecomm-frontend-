import { Link } from 'react-router'
import { ImageIcon, SearchIcon, ShoppingBagIcon, StoreIcon, UserIcon } from 'lucide-react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/features/auth/hooks/use-session'
import { useCategories } from '@/features/categories/hooks/use-categories'

/**
 * NavBar — sticky top-of-app navigation: announcement strip, brand mark,
 * primary nav (Home / Shop / Categories), and session-aware account actions.
 * Wraps every public route via `RootLayout`.
 */
export const NavBar = () => {
  const { session } = useSession()
  // same-page anchor links only — no public category-browsing route exists yet
  const { data: categories, isLoading } = useCategories()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="bg-primary py-2 text-center text-xs font-medium text-primary-foreground sm:text-sm">
        Free shipping on orders over &#8377;999 &middot; Free returns within 30 days
      </div>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
          <StoreIcon className="size-5 text-primary" />
          Index
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <Link
            to="/shop"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Shop
          </Link>
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-auto bg-transparent p-0 text-sm font-medium text-muted-foreground hover:bg-transparent focus:bg-transparent data-open:bg-transparent data-popup-open:bg-transparent">
                  Categories
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-105 grid-cols-3 gap-2 p-2">
                    {isLoading
                      ? Array.from({ length: 6 }, (_, index) => (
                          <li key={index}>
                            <Skeleton className="aspect-square w-full rounded-lg" />
                          </li>
                        ))
                      : categories?.map((category) => (
                          <li key={category.id}>
                            <NavigationMenuLink asChild>
                              <a
                                href="#shop-by-category"
                                className="flex flex-col items-center gap-2 rounded-lg p-2 text-center"
                              >
                                <AspectRatio
                                  ratio={1}
                                  className="w-full overflow-hidden rounded-lg bg-muted"
                                >
                                  {category.image ? (
                                    <img
                                      src={category.image}
                                      alt={category.name}
                                      loading="lazy"
                                      className="size-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex size-full items-center justify-center text-muted-foreground">
                                      <ImageIcon className="size-6" />
                                    </div>
                                  )}
                                </AspectRatio>
                                <span className="line-clamp-1 text-xs font-medium text-foreground">
                                  {category.name}
                                </span>
                              </a>
                            </NavigationMenuLink>
                          </li>
                        ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        <div className="flex items-center ">
          {session ? (
            <>
              {session.user.role === 'admin' && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">Admin</Link>
                </Button>
              )}
              <Button variant={"ghost"} className='bg-transparent! p-0' size={"icon"}>
                <SearchIcon/>
              </Button>
              <Button variant={"ghost"} className='bg-transparent! p-0' size={"icon"} >
                <UserIcon/>
              </Button>
              <Button variant={"ghost"} className='bg-transparent! p-0' size={"icon"} >
                <ShoppingBagIcon/>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/sign-up">Create account</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
