import { ReceiptIcon } from 'lucide-react'
import { QueryErrorAlert } from '@/components/query-error-alert'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatPrice } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/http'
import { useOrderPayments } from '../hooks/use-order-payments'
import { PaymentStatusBadge } from './payment-status-badge'

const METHOD_LABEL = { card: 'Card', upi: 'UPI', wallet: 'Wallet' }

/**
 * PaymentHistory — every payment attempt for an order (GET /api/payments/order/:orderId),
 * newest first. Self-contained: fetches its own data so it can be dropped into both the
 * customer's pay page and the admin payments dialog unchanged.
 * @param orderId - order whose payment attempts to list
 */
export const PaymentHistory = ({ orderId }: { orderId: number }) => {
  const { data: payments, isLoading, isError, error } = useOrderPayments(orderId)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <QueryErrorAlert message={getApiErrorMessage(error, 'Could not load payment history')} />
  }

  if (!payments?.length) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ReceiptIcon />
          </EmptyMedia>
          <EmptyTitle>No payment attempts yet</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Transaction ref</TableHead>
            <TableHead className="text-right">Attempted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{METHOD_LABEL[payment.method]}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <PaymentStatusBadge status={payment.status} />
                  {payment.failure_reason && (
                    <span className="text-xs text-muted-foreground">{payment.failure_reason}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatPrice(payment.amount)}</TableCell>
              <TableCell>
                <span className="font-mono text-xs" title={payment.transaction_ref}>
                  {payment.transaction_ref.slice(0, 14)}&hellip;
                </span>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{formatDate(payment.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
