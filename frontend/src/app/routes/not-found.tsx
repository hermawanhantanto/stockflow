import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundRoute() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-extrabold tracking-tight text-primary">404</h1>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">Page Not Found</h2>
      <p className="mt-2 text-muted-foreground max-w-sm">
        The page you are looking for doesn't exist or has been moved.
      </p>
      
      <Button asChild className="mt-6">
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  )
}
