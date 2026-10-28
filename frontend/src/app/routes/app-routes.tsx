import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layouts/app-layout'
import { HomeRoute } from './home'
import { ProductsRoute } from './products'
import { NotFoundRoute } from './not-found'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomeRoute />,
      },
      {
        path: 'products',
        element: <ProductsRoute />,
      },
      {
        path: '*',
        element: <NotFoundRoute />,
      },
    ],
  },
])

export function AppRoutes() {
  return <RouterProvider router={router} />
}
