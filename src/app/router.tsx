import { createBrowserRouter } from 'react-router'
import { RedirectIfRole } from '@/components/redirect-if-role'
import AdminCategoriesPage from '@/pages/admin-categories-page'
import AdminProductDetailPage from '@/pages/admin-product-detail-page'
import AdminProductsPage from '@/pages/admin-products-page'
import HomePage from '@/pages/home-page'
import ProductFormPage from '@/pages/product-form-page'
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
      { path: 'products/new', element: <ProductFormPage /> },
      { path: 'products/:id', element: <AdminProductDetailPage /> },
      { path: 'products/:id/edit', element: <ProductFormPage /> },
      { path: 'categories', element: <AdminCategoriesPage /> },
    ],
  },
])
