/** PaymentMethod — how a payment attempt is made. */
export type PaymentMethod = 'card' | 'upi' | 'wallet'

/** PaymentStatus — lifecycle state of a single payment attempt. */
export type PaymentStatus = 'initiated' | 'success' | 'failed'

/** PaymentRow — a single payment attempt against an order, as returned by every /api/payments endpoint. */
export type PaymentRow = {
  id: number
  order_id: number
  user_id: number
  // MySQL DECIMAL — mysql2 serializes it as a string; mirrors order.total at initiation time
  amount: string
  method: PaymentMethod
  status: PaymentStatus
  transaction_ref: string
  failure_reason: string | null
  created_at: string
  updated_at: string
}

/** InitiatePaymentInput — body sent to POST /api/payments/. */
export type InitiatePaymentInput = {
  orderId: number
  method: PaymentMethod
}

/** VerifyPaymentInput — body sent to POST /api/payments/:transactionRef/verify. */
export type VerifyPaymentInput = {
  transactionRef: string
  simulate?: 'success' | 'failure'
}
