import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

/** NavMainItem — one sidebar link. */
export type NavMainItem = {
  title: string
  url: string
  icon?: ReactNode
  // extra path prefix that also marks this item active (e.g. "/admin/products" for nested product pages)
  activePrefix?: string
}

/**
 * NavMain — primary sidebar navigation list, highlighting the current route.
 * @param items - links to render, in order
 */
export const NavMain = ({ items }: { items: NavMainItem[] }) => {
  const { pathname } = useLocation()

  const isActive = (item: NavMainItem) =>
    pathname === item.url || (item.activePrefix !== undefined && pathname.startsWith(item.activePrefix))

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Catalog</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive(item)}
                className="data-[active=true]:font-semibold"
              >
                <NavLink to={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
