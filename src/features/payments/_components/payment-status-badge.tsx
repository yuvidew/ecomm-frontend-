import { Badge } from '@/components/ui/badge'
import type { PaymentStatus } from '../types/payments'

const STATUS_LABEL: Record<PaymentStatus, string> = {
  initiated: 'Initiated',
  success: 'Success',
  failed: 'Failed',
}

const STATUS_VARIANT: Record<PaymentStatus, 'outline' | 'default' | 'destructive'> = {
  initiated: 'outline',
  success: 'default',
  failed: 'destructive',
}

/**
 * PaymentStatusBadge — colored pill for a payment attempt's status.
 * @param status - payment status to render
 */
export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => (
  <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
)
