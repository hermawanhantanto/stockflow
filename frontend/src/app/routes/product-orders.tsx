import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  ReceiptText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDateTime, formatRupiah } from '@/features/products/utils/format'
import { useGetProducts } from '@/features/products/hooks/use-get-products'
import { useGetProductOrders } from '@/features/orders/hooks/use-get-product-orders'
import { CancelOrderDialog } from '@/features/orders/components/cancel-order-dialog'
import type { Order } from '@/features/orders/types/order.types'

export function ProductOrdersRoute() {
  const { id } = useParams<{ id: string }>()

  // Fetch product from catalog
  const { data: productsData, isLoading: isLoadingProducts } = useGetProducts({
    limit: 100,
    status: 'all',
  })
  const product = React.useMemo(() => {
    return productsData?.data.find((p) => p.id === Number(id))
  }, [productsData?.data, id])

  // Fetch orders associated with this product using GetOrderByID (via movements)
  const { data: orders = [], isLoading: isLoadingOrders, error } = useGetProductOrders(id)

  const [orderToCancel, setOrderToCancel] = React.useState<Order | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false)

  const handleOpenCancelDialog = (order: Order) => {
    setOrderToCancel(order)
    setIsCancelDialogOpen(true)
  }

  const isLoading = isLoadingProducts || isLoadingOrders

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12 flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading product orders...</p>
      </div>
    )
  }

  if (error || (!isLoadingProducts && !product)) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Products</span>
        </Link>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-destructive">
            {error?.message || 'Product could not be found.'}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/products">Return to Products Catalog</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Products</span>
        </Link>
      </div>

      {/* Product Summary Header Card */}
      {product && (
        <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {product.name}
              </h1>
              <Badge variant="outline" className="font-mono text-xs">
                {product.sku}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'font-medium text-xs',
                  product.is_active
                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800/60 dark:bg-green-950/40 dark:text-green-300'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300'
                )}
              >
                {product.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Price: <span className="font-medium text-foreground">{formatRupiah(product.price)}</span>
            </p>
          </div>

          {/* Live Available Stock Badge */}
          <div className="flex items-center gap-3">
            <div className="rounded-lg border bg-muted/40 px-4 py-2.5 text-right sm:min-w-[140px]">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Available Stock
              </span>
              <span
                className={cn(
                  'text-xl font-bold tracking-tight',
                  product.stock === 0
                    ? 'text-destructive'
                    : product.stock <= 5
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-foreground'
                )}
              >
                {product.stock} units
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Orders Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <ReceiptText className="size-4 text-primary" />
            <span>Order Details</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            All customer sales orders associated with this product.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs font-medium">
          {orders.length} Order{orders.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-3 bg-muted/20">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <Package className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">No orders found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              This product has not been included in any sales orders yet.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link to="/products">Back to Products</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isCancelled = order.status === 'CANCELLED'

            return (
              <div
                key={order.id}
                className={cn(
                  'rounded-xl border bg-card transition-all shadow-xs overflow-hidden',
                  isCancelled && 'opacity-85 border-border/60 bg-muted/15'
                )}
              >
                {/* Order Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b px-4 py-3 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm text-foreground">
                      Order #{order.id}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Customer:{' '}
                      <strong className="font-medium text-foreground">{order.customer}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Clock className="size-3.5" />
                      <span>{formatDateTime(order.created_at)}</span>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        'font-medium text-xs gap-1',
                        isCancelled
                          ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                      )}
                    >
                      {isCancelled ? (
                        <>
                          <Ban className="size-3" />
                          <span>Cancelled</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-3" />
                          <span>Active Order</span>
                        </>
                      )}
                    </Badge>
                  </div>
                </div>

                {/* Items Breakdown Table */}
                <div className="p-4 space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b text-muted-foreground font-medium text-left">
                          <th className="pb-2">SKU</th>
                          <th className="pb-2 text-center">Quantity</th>
                          <th className="pb-2 text-right">Unit Price</th>
                          <th className="pb-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {order.items.map((item) => {
                          const isCurrentProduct = product && item.sku === product.sku

                          return (
                            <tr
                              key={item.id}
                              className={cn(
                                'transition-colors',
                                isCurrentProduct && 'bg-primary/5 font-medium'
                              )}
                            >
                              <td className="py-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-foreground">{item.sku}</span>
                                  {isCurrentProduct && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] px-1.5 py-0 font-normal"
                                    >
                                      This Product
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 text-center font-medium text-foreground">
                                {item.qty}
                              </td>
                              <td className="py-2.5 text-right text-muted-foreground">
                                {formatRupiah(item.unit_price)}
                              </td>
                              <td className="py-2.5 text-right font-medium text-foreground">
                                {formatRupiah(item.unit_price * item.qty)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Order Footer: Total and Cancel Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-muted-foreground">Total:</span>
                      <span className="text-base font-bold text-foreground">
                        {formatRupiah(order.total)}
                      </span>
                    </div>

                    <div>
                      {isCancelled ? (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Ban className="size-3 text-rose-500" />
                          <span>
                            {order.cancelled_at
                              ? `Cancelled on ${formatDateTime(order.cancelled_at)}`
                              : 'Cancelled'}
                          </span>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenCancelDialog(order)}
                          className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer gap-1.5 text-xs h-8"
                        >
                          <Ban className="size-3.5" />
                          <span>Cancel Order</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <CancelOrderDialog
        order={orderToCancel}
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
      />
    </div>
  )
}
