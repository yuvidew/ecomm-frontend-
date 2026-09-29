import { createBrowserRouter } from 'react-router'
import { RedirectIfRole } from '@/components/redirect-if-role'
import { RequireAuth } from '@/components/require-auth'
import AdminCategoriesPage from '@/pages/admin-categories-page'
import AdminOrdersPage from '@/pages/admin-orders-page'
import AdminProductDetailPage from '@/pages/admin-product-detail-page'
import AdminProductsPage from '@/pages/admin-products-page'
import CheckoutPage from '@/pages/checkout-page'
import HomePage from '@/pages/home-page'
import OrdersPage from '@/pages/orders-page'
import PayOrderPage from '@/pages/pay-order-page'
import ProductDetailPage from '@/pages/product-detail-page'
import ShopPage from '@/pages/shop-page'
import SignInPage from '@/pages/sign-in-page'
import SignUpPage from '@/pages/sign-up-page'
import { AdminLayout } from './admin-layout'
import { RootLayout } from './root-layout'

/**
 * router — top-level route table for the app.
 * Add one entry per page here; page-level components live in `src/pages/`.
 */
export const router = createBrowserRouter([
  {
    // storefront is customer/anonymous-only -- a signed-in admin is sent to /admin
    element: (
      <RedirectIfRole role="admin" to="/admin">
        <RootLayout />
      </RedirectIfRole>
    ),
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/shop', element: <ShopPage /> },
      { path: '/shop/:id', element: <ProductDetailPage /> },
      {
        path: '/orders',
        element: (
          <RequireAuth>
            <OrdersPage />
          </RequireAuth>
        ),
      },
      {
        path: '/checkout',
        element: (
          <RequireAuth>
            <CheckoutPage />
          </RequireAuth>
        ),
      },
      {
        path: '/orders/:orderId/pay',
        element: (
          <RequireAuth>
            <PayOrderPage />
          </RequireAuth>
        ),
      },
      { path: '/sign-in', element: <SignInPage /> },
      { path: '/sign-up', element: <SignUpPage /> },
    ],
  },
  {
    // admin-only dashboard (guarded inside AdminLayout)
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminProductsPage /> },
      { path: 'products/:id', element: <AdminProductDetailPage /> },
      { path: 'categories', element: <AdminCategoriesPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
    ],
  },
])
