import { useParams } from 'react-router'
import { PaymentPanel } from '@/features/payments/_components/payment-panel'

/**
 * PayOrderPage — route ("/orders/:orderId/pay"): pay for a pending order,
 * or view/retry its payment attempts.
 */
const PayOrderPage = () => {
  const orderId = Number(useParams().orderId)

  return (
    <main id="main-content" className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 lg:px-6">
      <h1 className="mb-6 font-heading text-2xl font-semibold">Payment</h1>
      <PaymentPanel orderId={orderId} />
    </main>
  )
}

export default PayOrderPage
