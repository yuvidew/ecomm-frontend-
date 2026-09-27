import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '../types/orders'

const STATUS_LABEL: Record<OrderStatus, string> = {
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUS_VARIANT: Record<OrderStatus, 'outline' | 'secondary' | 'default' | 'destructive'> = {
  processing: 'outline',
  shipped: 'secondary',
  delivered: 'default',
  cancelled: 'destructive',
}

/**
 * OrderStatusBadge — colored pill for an order's lifecycle status.
 * @param status - order status to render
 */
export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => (
  <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
)
