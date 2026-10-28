import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layouts/app-layout'
import { HomeRoute } from './home'
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
        path: '*',
        element: <NotFoundRoute />,
      },
    ],
  },
])

export function AppRoutes() {
  return <RouterProvider router={router} />
}
