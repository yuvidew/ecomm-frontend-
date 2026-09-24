import type { CSSProperties } from 'react'
import { Outlet } from 'react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { RequireAuth } from '@/components/require-auth'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

// sizing tokens consumed by the dashboard-01 sidebar/header styles
const DASHBOARD_VARS = {
  '--sidebar-width': 'calc(var(--spacing) * 64)',
  '--header-height': 'calc(var(--spacing) * 12)',
} as CSSProperties

/**
 * AdminLayout — shell for every /admin route: admin-only guard, sidebar, and
 * a flat content area. Each page renders its own `SiteHeader` so it can set
 * its title and actions.
 */
export const AdminLayout = () => {
  return (
    <RequireAuth role="admin">
      <TooltipProvider>
        <SidebarProvider style={DASHBOARD_VARS}>
          <AppSidebar />
          <SidebarInset>
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </RequireAuth>
  )
}
