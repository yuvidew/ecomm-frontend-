import { ReceiptIcon } from 'lucide-react'
import { toast } from 'sonner'
import { QueryErrorAlert } from '@/components/query-error-alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PaymentHistory } from '@/features/payments/_components/payment-history'
import { formatDate, formatPrice } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/http'
import { useAllOrders } from '../hooks/use-all-orders'
import { useUpdateOrderStatus } from '../hooks/use-update-order-status'
import { OrderStatusBadge } from './order-status-badge'
import type { Order, OrderStatus } from '../types/orders'

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

/**
 * OrderStatusSelect — dropdown that updates one order's status
 * (PATCH /api/orders/:orderId/status).
 * @param order - order whose status this select controls
 */
const OrderStatusSelect = ({ order }: { order: Order }) => {
  const updateStatus = useUpdateOrderStatus()

  const handleChange = (status: OrderStatus) => {
    updateStatus.mutate(
      { orderId: order.id, input: { status } },
      { onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update order status')) },
    )
  }

  return (
    <Select value={order.status} onValueChange={handleChange} disabled={updateStatus.isPending}>
      <SelectTrigger size="sm" className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((status) => (
          <SelectItem key={status} value={status}>
            <OrderStatusBadge status={status} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * AdminOrdersTable — lists every order across all users (order id, customer,
 * status, total, placed date), with an inline status-update control, a dialog
 * to view an order's payment attempt history, plus loading, error, and empty states.
 */
export const AdminOrdersTable = () => {
  const { data: orders, isLoading, isError, error } = useAllOrders()

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Placed</TableHead>
              <TableHead className="text-right">Payments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }, (_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-4 w-16" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-4 w-20" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-8 w-20" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (isError) {
    return <QueryErrorAlert message={getApiErrorMessage(error, 'Could not load orders')} />
  }

  if (!orders?.length) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ReceiptIcon />
          </EmptyMedia>
          <EmptyTitle>No orders yet</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Placed</TableHead>
            <TableHead className="text-right">Payments</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">#{order.id}</TableCell>
              <TableCell className="text-muted-foreground">User #{order.user_id}</TableCell>
              <TableCell>
                <OrderStatusSelect order={order} />
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatPrice(order.total)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatDate(order.created_at)}</TableCell>
              <TableCell className="text-right">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Payments
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Payments for order #{order.id}</DialogTitle>
                    </DialogHeader>
                    <PaymentHistory orderId={order.id} />
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
