import * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Package, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SummaryCards, LowStockAlertCard } from '@/features/dashboard'
import { CreateOrderDialog } from '@/features/orders'

export function HomeRoute() {
  const [isCreateOrderOpen, setIsCreateOrderOpen] = React.useState(false)

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Inventory Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time overview of inventory valuation, catalog metrics, and stock alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            asChild
            className="gap-2 cursor-pointer"
          >
            <Link to="/products">
              <Package className="size-4" />
              <span>Products Catalog</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>

          <Button
            onClick={() => setIsCreateOrderOpen(true)}
            className="gap-2 cursor-pointer shadow-xs"
          >
            <ShoppingCart className="size-4" />
            <span>Create Order</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Key Metrics
          </h2>
        </div>
        <SummaryCards />
      </section>

      {/* Low Stock Alert Section */}
      <section className="space-y-3">
        <LowStockAlertCard />
      </section>

      {/* Quick Order Dialog */}
      <CreateOrderDialog
        open={isCreateOrderOpen}
        onOpenChange={setIsCreateOrderOpen}
      />
    </div>
  )
}
