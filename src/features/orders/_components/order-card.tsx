import { toast } from 'sonner'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { formatDate, formatPrice } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/http'
import { useCancelOrder } from '../hooks/use-cancel-order'
import { OrderItemRow } from './order-item-row'
import { OrderStatusBadge } from './order-status-badge'
import type { Order } from '../types/orders'

/**
 * OrderCard — one order as a card: id/date/status header, shipping address,
 * an expandable accordion listing its line items, the order total, and a
 * cancel action while the order is still pending.
 * @param order - order to render
 */
export const OrderCard = ({ order }: { order: Order }) => {
  const cancelOrder = useCancelOrder()
  const itemLabel = order.items.length === 1 ? '1 item' : `${order.items.length} items`

  const handleCancel = () => {
    cancelOrder.mutate(order.id, {
      onError: (error) => toast.error(getApiErrorMessage(error, 'Could not cancel order')),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order #{order.id}</CardTitle>
        <CardDescription>Placed on {formatDate(order.created_at)}</CardDescription>
        <CardAction>
          <OrderStatusBadge status={order.status} />
        </CardAction>
      </CardHeader>

      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">Shipping to {order.shipping_address}</p>

        <Accordion type="single" collapsible>
          <AccordionItem value="items">
            <AccordionTrigger>View {itemLabel}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col divide-y">
                {order.items.map((item) => (
                  <OrderItemRow key={item.id} item={item} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Separator className="my-3" />

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-base font-semibold tabular-nums">{formatPrice(order.total)}</span>
        </div>
      </CardContent>

      {order.status === 'pending' && (
        <CardFooter className="justify-end">
          <Button variant="outline" size="sm" disabled={cancelOrder.isPending} onClick={handleCancel}>
            {cancelOrder.isPending && <Spinner />}
            Cancel order
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
