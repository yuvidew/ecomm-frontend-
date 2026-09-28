import { PackageIcon } from 'lucide-react'
import { useState } from 'react'
import { QueryErrorAlert } from '@/components/query-error-alert'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getApiErrorMessage } from '@/lib/http'
import { useOrders } from '../hooks/use-orders'
import { OrderCard } from './order-card'
import type { OrderStatus } from '../types/orders'

const STATUS_TABS: { value: 'all' | OrderStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

/**
 * OrderList — "My Orders" view: status tabs filtering the order history,
 * a card per matching order, and loading/error/empty states.
 */
export const OrderList = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const { data: orders, isLoading, isError, error } = useOrders()

  const filteredOrders =
    statusFilter === 'all' ? orders : orders?.filter((order) => order.status === statusFilter)

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

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <QueryErrorAlert message={getApiErrorMessage(error, 'Could not load your orders')} />
      ) : !filteredOrders?.length ? (
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
