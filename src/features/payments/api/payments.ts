import { http } from '@/lib/http'
import type { InitiatePaymentInput, PaymentRow, VerifyPaymentInput } from '../types/payments'

/** initiatePayment — calls POST /api/payments/, starting a payment attempt for an order. */
export const initiatePayment = async (input: InitiatePaymentInput): Promise<PaymentRow> => {
  const { data } = await http.post<PaymentRow>('/api/payments/', input)
  return data
}

/** verifyPayment — calls POST /api/payments/:transactionRef/verify, simulating the gateway callback. */
export const verifyPayment = async ({ transactionRef, simulate }: VerifyPaymentInput): Promise<PaymentRow> => {
  const { data } = await http.post<PaymentRow>(`/api/payments/${transactionRef}/verify`, { simulate })
  return data
}

/** getOrderPayments — calls GET /api/payments/order/:orderId (full attempt history, newest first). */
export const getOrderPayments = async (orderId: number): Promise<PaymentRow[]> => {
  const { data } = await http.get<PaymentRow[]>(`/api/payments/order/${orderId}`)
  return data
}
