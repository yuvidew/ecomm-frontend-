import { CheckoutForm } from '@/features/orders/_components/checkout-form'

/**
 * CheckoutPage — route ("/checkout"): converts the signed-in customer's cart
 * into an order.
 */
const CheckoutPage = () => {
  return (
    <main id="main-content" className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 lg:px-6">
      <h1 className="mb-6 font-heading text-2xl font-semibold">Checkout</h1>
      <CheckoutForm />
    </main>
  )
}

export default CheckoutPage
