import { Outlet } from 'react-router-dom'
import { Navbar } from './navbar'

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
