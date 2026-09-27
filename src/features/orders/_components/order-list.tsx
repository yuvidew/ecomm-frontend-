import { PackageIcon } from 'lucide-react'
import { useState } from 'react'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MOCK_ORDERS } from './mock-orders'
import { OrderCard } from './order-card'
import type { OrderStatus } from '../types/orders'

const STATUS_TABS: { value: 'all' | OrderStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

/**
 * OrderList — "My Orders" view: status tabs filtering the order history,
 * a card per matching order, and an empty state when a filter has no matches.
 * Reads from MOCK_ORDERS placeholder data (.claude/plan/phase-18-my-orders-page.md)
 * until a real orders API/hook exists.
 */
export const OrderList = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')

  const filteredOrders =
    statusFilter === 'all' ? MOCK_ORDERS : MOCK_ORDERS.filter((order) => order.status === statusFilter)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">My Orders</h1>
        <p className="text-sm text-muted-foreground">Track and review your order history.</p>
      </div>

      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | OrderStatus)}>
        <TabsList className="w-full sm:w-fit">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filteredOrders.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon />
            </EmptyMedia>
            <EmptyTitle>No orders here</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
