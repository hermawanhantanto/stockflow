import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

function Home() {
  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-3xl font-bold tracking-tight">StockFlow</h1>
      <p className="text-muted-foreground">React + Vite + Tailwind CSS + shadcn/ui</p>
      <div className="flex gap-2">
        <Button asChild>
          <Link to="/about">Go to About</Link>
        </Button>
        <Button variant="outline">Learn More</Button>
      </div>
    </div>
  )
}

function About() {
  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-semibold">About Page</h1>
      <p className="text-muted-foreground">This is an example route using React Router and shadcn/ui.</p>
      <Button variant="secondary" asChild>
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <main className="flex min-h-screen items-center justify-center p-8 bg-background text-foreground">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
