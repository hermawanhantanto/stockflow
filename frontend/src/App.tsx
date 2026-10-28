import { AppProviders } from '@/app/providers'
import { AppRoutes } from '@/app/routes/app-routes'

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  )
}
