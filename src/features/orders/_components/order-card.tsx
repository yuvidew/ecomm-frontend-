import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatPrice } from '@/lib/format'
import { OrderItemRow } from './order-item-row'
import { OrderStatusBadge } from './order-status-badge'
import type { Order } from '../types/orders'

/**
 * OrderCard — one order as a card: id/date/status header, an expandable
 * accordion listing its line items, and the order total.
 * @param order - order to render
 */
export const OrderCard = ({ order }: { order: Order }) => {
  const itemLabel = order.items.length === 1 ? '1 item' : `${order.items.length} items`

  return (
    <Card>
      <CardHeader>
        <CardTitle>{order.id}</CardTitle>
        <CardDescription>Placed on {formatDate(order.placedAt)}</CardDescription>
        <CardAction>
          <OrderStatusBadge status={order.status} />
        </CardAction>
      </CardHeader>

      <CardContent>
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
    </Card>
  )
}
