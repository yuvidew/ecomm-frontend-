import { OrderList } from '@/features/orders/_components/order-list'

/**
 * OrdersPage — route ("/orders"): the signed-in customer's order history view.
 */
const OrdersPage = () => {
  return (
    <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 lg:px-6">
      <OrderList />
    </main>
  )
}

export default OrdersPage
