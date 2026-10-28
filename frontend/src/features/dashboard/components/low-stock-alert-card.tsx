import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, ArrowUpDown, CheckCircle, ReceiptText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatRupiah } from '@/features/products/utils/format'
import { AdjustStockDialog } from '@/features/products/components/adjust-stock-dialog'
import { useDashboardSummary } from '../hooks/use-dashboard-summary'
import type { Product } from '@/features/products/types/product.types'

export function LowStockAlertCard() {
  const navigate = useNavigate()
  const { lowStockProducts, lowStockCount, isLoading } = useDashboardSummary()
  const [selectedProductToAdjust, setSelectedProductToAdjust] = React.useState<Product | null>(null)
  const [isAdjustOpen, setIsAdjustOpen] = React.useState(false)

  const handleOpenAdjust = (product: Product) => {
    setSelectedProductToAdjust(product)
    setIsAdjustOpen(true)
  }

  if (isLoading) {
    return null
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Low Stock Attention
            </h3>
            <p className="text-xs text-muted-foreground">
              Products with 5 or fewer units remaining in warehouse
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(
            'text-xs font-medium w-fit',
            lowStockCount > 0
              ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300'
          )}
        >
          {lowStockCount} Item{lowStockCount !== 1 ? 's' : ''} Require Attention
        </Badge>
      </div>

      {lowStockProducts.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="size-5" />
          </div>
          <p className="text-sm font-medium text-foreground">Healthy Inventory</p>
          <p className="text-xs text-muted-foreground">All products have sufficient stock levels.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {lowStockProducts.map((product) => (
            <div
              key={product.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 first:pt-1 last:pb-1"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {product.name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    ({product.sku})
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Unit Price: <span className="font-medium text-foreground">{formatRupiah(product.price)}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span
                    className={cn(
                      'text-sm font-bold',
                      product.stock === 0
                        ? 'text-destructive'
                        : 'text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {product.stock === 0 ? 'Out of Stock (0)' : `${product.stock} units left`}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAdjust(product)}
                    className="h-8 gap-1 text-xs cursor-pointer"
                    title={`Restock ${product.name}`}
                  >
                    <ArrowUpDown className="size-3.5" />
                    <span>Restock</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/products/${product.id}/orders`)}
                    className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                    title={`View orders for ${product.name}`}
                  >
                    <ReceiptText className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <div className="pt-1 text-right">
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <span>View all products in catalog</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      )}

      <AdjustStockDialog
        product={selectedProductToAdjust}
        open={isAdjustOpen}
        onOpenChange={setIsAdjustOpen}
      />
    </div>
  )
}
