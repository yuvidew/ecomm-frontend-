import type { ComponentProps } from 'react'
import { Link } from 'react-router'
import { PackageIcon, ReceiptIcon, StoreIcon, TagsIcon } from 'lucide-react'
import { NavMain, type NavMainItem } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

// admin dashboard sections shown in the sidebar
const ADMIN_NAV: NavMainItem[] = [
  {
    title: 'Products',
    url: '/admin',
    icon: <PackageIcon aria-hidden="true" />,
    activePrefix: '/admin/products',
  },
  { title: 'Categories', url: '/admin/categories', icon: <TagsIcon aria-hidden="true" /> },
  { title: 'Orders', url: '/admin/orders', icon: <ReceiptIcon aria-hidden="true" /> },
]

/**
 * AppSidebar — admin dashboard sidebar: brand link, section nav, and the
 * signed-in user menu.
 * @param props - forwarded to the shadcn `Sidebar` root
 */
export const AppSidebar = (props: ComponentProps<typeof Sidebar>) => {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Index Admin">
              <Link to="/admin">
                <StoreIcon aria-hidden="true" className="size-5!" />
                <span className="font-heading text-base font-semibold">Index Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={ADMIN_NAV} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
