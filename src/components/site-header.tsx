import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ModeToggle } from '@/components/mode-toggle'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

/** SiteHeaderCrumb — one entry in an admin page's breadcrumb trail. */
export type SiteHeaderCrumb = { label: string; href?: string }

/**
 * SiteHeader — sticky top bar of the admin dashboard with the current page
 * title (or a breadcrumb trail), page actions, and the light/dark toggle.
 * @param title - page title shown when `breadcrumb` isn't given
 * @param breadcrumb - optional trail (e.g. Products / Edit product) rendered instead of `title`
 * @param actions - optional right-aligned controls (e.g. a "New product" button)
 */
export const SiteHeader = ({
  title,
  breadcrumb,
  actions,
}: {
  title: string
  breadcrumb?: SiteHeaderCrumb[]
  actions?: ReactNode
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-1 h-4" />
        {breadcrumb ? (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumb.map((crumb, index) => (
                <Fragment key={crumb.label}>
                  <BreadcrumbItem>
                    {crumb.href ? (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumb.length - 1 && <BreadcrumbSeparator />}
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <h1 className="font-heading text-base font-medium">{title}</h1>
        )}
        <div className="ml-auto flex items-center gap-2">
          {actions}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
