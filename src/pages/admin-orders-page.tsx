import { SiteHeader } from '@/components/site-header'
import { AdminOrdersTable } from '@/features/orders/_components/admin-orders-table'

/**
 * AdminOrdersPage — /admin/orders: every user's orders with a status-update control.
 */
const AdminOrdersPage = () => {
  return (
    <>
      <SiteHeader title="Orders" />
      <main className="p-4 lg:p-6">
        <AdminOrdersTable />
      </main>
    </>
  )
}

export default AdminOrdersPage
