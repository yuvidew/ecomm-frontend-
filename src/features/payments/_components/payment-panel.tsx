import { CircleCheckIcon, PackageSearchIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { QueryErrorAlert } from '@/components/query-error-alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrders } from '@/features/orders/hooks/use-orders'
import { OrderStatusBadge } from '@/features/orders/_components/order-status-badge'
import { formatPrice } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/http'
import { useOrderPayments } from '../hooks/use-order-payments'
import { PaymentHistory } from './payment-history'
import { PaymentMethodForm } from './payment-method-form'
import { PaymentSimulator } from './payment-simulator'

/**
 * PaymentPanel — the "/orders/:orderId/pay" page's stateful body: derives the
 * order's current payment state from the caller's order list and the order's
 * payment attempt history, and renders the matching step (start payment, retry,
 * simulate the in-flight attempt's outcome, or a "payment received" summary),
 * plus the attempt history underneath.
 * @param orderId - order to show the payment flow for
 */
export const PaymentPanel = ({ orderId }: { orderId: number }) => {
  const { data: orders, isLoading: isOrderLoading, isError: isOrderError, error: orderError } = useOrders()
  const { data: payments, isLoading: isPaymentsLoading, isError: isPaymentsError, error: paymentsError } =
    useOrderPayments(orderId)

  if (isOrderLoading || isPaymentsLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />
  }

  if (isOrderError || isPaymentsError) {
    return (
      <QueryErrorAlert message={getApiErrorMessage(orderError ?? paymentsError, 'Could not load this order')} />
    )
  }

  const order = orders?.find((candidate) => candidate.id === orderId)

  if (!order) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackageSearchIcon />
          </EmptyMedia>
          <EmptyTitle>Order not found</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  const latest = payments?.[0]

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Order #{order.id}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <OrderStatusBadge status={order.status} />
          <span className="text-base font-semibold tabular-nums">{formatPrice(order.total)}</span>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {latest?.status === 'success' ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CircleCheckIcon />
                </EmptyMedia>
                <EmptyTitle>Payment received</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild variant="outline">
                  <Link to="/orders">Back to my orders</Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : latest?.status === 'initiated' ? (
            <PaymentSimulator transactionRef={latest.transaction_ref} />
          ) : order.status !== 'pending' ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">This order is already {order.status}.</p>
              <Button asChild variant="outline">
                <Link to="/orders">Back to my orders</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {latest?.status === 'failed' && (
                <QueryErrorAlert title="Last attempt failed" message={latest.failure_reason ?? 'Payment failed'} />
              )}
              <PaymentMethodForm orderId={order.id} retry={latest?.status === 'failed'} />
            </div>
          )}
        </CardContent>
      </Card>

      <Accordion type="single" collapsible>
        <AccordionItem value="history">
          <AccordionTrigger>View payment attempts</AccordionTrigger>
          <AccordionContent>
            <PaymentHistory orderId={order.id} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
