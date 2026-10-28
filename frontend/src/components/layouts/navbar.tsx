import { Link, NavLink } from 'react-router-dom'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Name */}
        <Link
          to="/"
          className="text-base font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
        >
          Stockflow
        </Link>

        {/* Right: Navigation Links */}
        <nav className="flex items-center gap-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            Products
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
