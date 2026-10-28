import * as React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useGetProducts } from '@/features/products/hooks/use-get-products'
import { formatRupiah } from '@/features/products/utils/format'
import { useCreateOrder } from '../hooks/use-create-order'
import type { Order } from '../types/order.types'

export interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormItem {
  sku: string
  qty: string
  isCustomSku: boolean
}

interface InsufficientStockDetail {
  sku: string
  available: number
}

function CreateOrderForm({ onClose }: { onClose: () => void }) {
  const [customer, setCustomer] = React.useState('')
  const [items, setItems] = React.useState<FormItem[]>([
    { sku: '', qty: '1', isCustomSku: false },
  ])
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const [conflictError, setConflictError] = React.useState<InsufficientStockDetail | null>(null)
  const [createdOrder, setCreatedOrder] = React.useState<Order | null>(null)

  const { data: productsData, isLoading: isLoadingProducts } = useGetProducts({
    limit: 100,
    status: 'all',
  })
  const products = React.useMemo(() => productsData?.data || [], [productsData?.data])

  const { mutateAsync, isPending } = useCreateOrder()

  const handleAddItem = () => {
    setItems((prev) => [...prev, { sku: '', qty: '1', isCustomSku: false }])
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
    setValidationError(null)
    setConflictError(null)
  }

  const handleItemSkuChange = (index: number, sku: string, isCustomSku = false) => {
    setItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], sku, isCustomSku }
      return next
    })
    setValidationError(null)
    if (conflictError && conflictError.sku.toLowerCase() === sku.toLowerCase()) {
      setConflictError(null)
    }
  }

  const handleItemQtyChange = (index: number, qty: string) => {
    setItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], qty }
      return next
    })
    setValidationError(null)
    const itemSku = items[index]?.sku
    if (conflictError && conflictError.sku.toLowerCase() === itemSku?.toLowerCase()) {
      setConflictError(null)
    }
  }

  const handleResetForm = () => {
    setCustomer('')
    setItems([{ sku: '', qty: '1', isCustomSku: false }])
    setValidationError(null)
    setConflictError(null)
    setCreatedOrder(null)
  }

  // Calculate estimated total based on catalog prices
  const estimatedTotal = React.useMemo(() => {
    return items.reduce((acc, item) => {
      const prod = products.find((p) => p.sku === item.sku)
      const q = Number(item.qty)
      if (prod && !isNaN(q) && q > 0) {
        return acc + prod.price * q
      }
      return acc
    }, 0)
  }, [items, products])

  // Validation checks
  const isCustomerValid = customer.trim().length > 0
  const areItemsValid =
    items.length > 0 &&
    items.every((item) => {
      const q = Number(item.qty)
      return (
        item.sku.trim().length > 0 &&
        item.qty.trim() !== '' &&
        !isNaN(q) &&
        Number.isInteger(q) &&
        q > 0
      )
    })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isCustomerValid) {
      setValidationError('Customer name is required.')
      return
    }

    if (items.length === 0) {
      setValidationError('Order must have at least one item.')
      return
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.sku.trim()) {
        setValidationError(`Item #${i + 1}: Please select or enter a SKU.`)
        return
      }
      const q = Number(item.qty)
      if (item.qty.trim() === '' || isNaN(q) || !Number.isInteger(q) || q <= 0) {
        setValidationError(`Item #${i + 1} (${item.sku}): Quantity must be an integer greater than 0.`)
        return
      }
    }

    setValidationError(null)
    setConflictError(null)

    try {
      const res = await mutateAsync({
        customer: customer.trim(),
        items: items.map((item) => ({
          sku: item.sku.trim(),
          qty: Number(item.qty),
        })),
      })

      setCreatedOrder(res)
      toast.success('Order placed successfully', {
        description: `Order #${res.id} for ${res.customer} placed. Total: ${formatRupiah(res.total)}`,
      })
    } catch (error: any) {
      const status = error?.status || error?.response?.status
      const errorData = error?.data?.error || error?.response?.data?.error

      if (status === 409 || errorData?.code === 'INSUFFICIENT_STOCK') {
        const failedSku = errorData?.sku || ''
        const available = typeof errorData?.available === 'number' ? errorData.available : 0
        setConflictError({ sku: failedSku, available })
        const message = `Insufficient stock for ${failedSku}: only ${available} available in stock.`
        setValidationError(message)
        toast.error('Insufficient Stock', {
          description: message,
        })
      } else if (status === 400 || typeof errorData === 'string') {
        const message = typeof errorData === 'string' ? errorData : error?.message || 'Invalid order data.'
        setValidationError(message)
        toast.error('Invalid Order Details', {
          description: message,
        })
      } else {
        const message = error?.message || 'Failed to create order. Please try again.'
        setValidationError(message)
        toast.error('Order Error', {
          description: message,
        })
      }
    }
  }

  // --- Order Confirmed View ---
  if (createdOrder) {
    return (
      <div className="space-y-5">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-5" />
            <DialogTitle className="text-xl">Order Confirmed</DialogTitle>
          </div>
          <DialogDescription>
            Your order has been placed successfully.
          </DialogDescription>
        </DialogHeader>

        {/* Order Details Card */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div>
              <span className="text-xs text-muted-foreground">Order ID</span>
              <p className="text-sm font-semibold text-foreground">#{createdOrder.id}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Customer</span>
              <p className="text-sm font-semibold text-foreground">{createdOrder.customer}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Status</span>
              <div>
                <Badge variant="outline" className="border-emerald-600/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-medium">
                  {createdOrder.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Items Summary */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Ordered Items</span>
            <div className="divide-y rounded-md border bg-background text-xs">
              {createdOrder.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2.5">
                  <div className="space-y-0.5">
                    <span className="font-mono font-medium text-foreground">{item.sku}</span>
                    <p className="text-[11px] text-muted-foreground">
                      {formatRupiah(item.unit_price)} × {item.qty}
                    </p>
                  </div>
                  <div className="text-right font-medium text-foreground">
                    {formatRupiah(item.unit_price * item.qty)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-600/20 px-4 py-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Amount
            </span>
            <span className="text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              {formatRupiah(createdOrder.total)}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetForm}
            className="cursor-pointer"
          >
            Create Another Order
          </Button>
          <Button
            type="button"
            onClick={onClose}
            className="cursor-pointer"
          >
            Done
          </Button>
        </DialogFooter>
      </div>
    )
  }

  // --- Order Form View ---
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-5 text-primary" />
          <DialogTitle>Create Sales Order</DialogTitle>
        </div>
        <DialogDescription>
          Select a customer and add items to place a new order.
        </DialogDescription>
      </DialogHeader>

      {/* Error Banner */}
      {validationError && (
        <div
          className={cn(
            'flex items-start gap-2.5 rounded-lg border p-3 text-xs',
            conflictError
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          )}
        >
          {conflictError ? (
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
          ) : (
            <AlertTriangle className="size-4 shrink-0 mt-0.5 text-destructive" />
          )}
          <div className="space-y-0.5">
            <p className="font-semibold">
              {conflictError ? 'Insufficient Stock' : 'Order Notice'}
            </p>
            <p>{validationError}</p>
            {conflictError && (
              <p className="mt-1 font-medium">
                SKU <span className="font-mono font-semibold">{conflictError.sku}</span> only has{' '}
                <span className="font-bold">{conflictError.available}</span> unit(s) available.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Customer Name */}
      <div className="space-y-1.5">
        <label htmlFor="customer-name" className="text-xs font-medium text-foreground">
          Customer Name <span className="text-destructive">*</span>
        </label>
        <Input
          id="customer-name"
          type="text"
          value={customer}
          onChange={(e) => {
            setCustomer(e.target.value)
            setValidationError(null)
          }}
          placeholder="e.g. PT Maju Bersama, Alice Smith"
          required
          autoFocus
        />
      </div>

      {/* Items Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">
            Order Items <span className="text-destructive">*</span>
          </label>
          <span className="text-[11px] text-muted-foreground">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Column Headers for perfect vertical alignment */}
        <div className="grid grid-cols-[1fr_80px_36px] items-center gap-2 px-3 text-[11px] font-medium text-muted-foreground">
          <span>Product / SKU</span>
          <span className="text-center">Qty</span>
          <span className="sr-only">Actions</span>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {items.map((item, index) => {
            const isFailingSku =
              conflictError !== null &&
              conflictError.sku.trim().toLowerCase() === item.sku.trim().toLowerCase()
            const parsedQty = Number(item.qty)
            const isQtyInvalid =
              item.qty.trim() !== '' &&
              (isNaN(parsedQty) || !Number.isInteger(parsedQty) || parsedQty <= 0)

            const selectedProduct = products.find((p) => p.sku === item.sku)

            return (
              <div
                key={index}
                className={cn(
                  'rounded-lg border p-2.5 transition-colors space-y-1.5',
                  isFailingSku
                    ? 'border-destructive bg-destructive/5 ring-1 ring-destructive'
                    : 'border-border bg-card'
                )}
              >
                {/* Inputs Row - Exactly Centered and Aligned */}
                <div className="grid grid-cols-[1fr_80px_36px] items-center gap-2">
                  {/* SKU Selection or Custom Entry */}
                  <div className="min-w-0">
                    {item.isCustomSku ? (
                      <Input
                        type="text"
                        value={item.sku}
                        onChange={(e) => handleItemSkuChange(index, e.target.value, true)}
                        placeholder="Type SKU (e.g. SKU-LAP-001)"
                        className={cn(
                          'h-9 text-xs font-mono',
                          isFailingSku && 'border-destructive focus-visible:ring-destructive/30'
                        )}
                      />
                    ) : (
                      <select
                        value={item.sku}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            handleItemSkuChange(index, '', true)
                          } else {
                            handleItemSkuChange(index, e.target.value, false)
                          }
                        }}
                        disabled={isLoadingProducts}
                        className={cn(
                          'flex h-9 w-full rounded-md border border-input bg-background text-foreground px-2.5 py-1 text-xs shadow-xs transition-colors outline-none cursor-pointer truncate',
                          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                          isFailingSku && 'border-destructive focus-visible:ring-destructive/30'
                        )}
                      >
                        <option value="" disabled className="bg-background text-foreground">
                          {isLoadingProducts ? 'Loading products...' : '-- Select Product --'}
                        </option>
                        {products.map((p) => (
                          <option key={p.id} value={p.sku} className="bg-background text-foreground">
                            {p.sku} — {p.name} (Stock: {p.stock}, {formatRupiah(p.price)})
                          </option>
                        ))}
                        <option value="__custom__" className="bg-background text-foreground font-medium">
                          + Enter custom SKU...
                        </option>
                      </select>
                    )}
                  </div>

                  {/* Quantity Input */}
                  <div>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={item.qty}
                      onChange={(e) => handleItemQtyChange(index, e.target.value)}
                      placeholder="1"
                      required
                      className={cn(
                        'h-9 text-xs text-center font-medium',
                        (isQtyInvalid || isFailingSku) &&
                          'border-destructive focus-visible:ring-destructive/30'
                      )}
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="flex items-center justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length <= 1 || isPending}
                      title="Remove item"
                      className="size-9 text-muted-foreground hover:text-destructive cursor-pointer disabled:opacity-20"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Subtitle Details: Stock, Subtotal, or Toggle Custom */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                  {selectedProduct ? (
                    <>
                      <span>
                        Available: <strong className="text-foreground">{selectedProduct.stock}</strong>
                      </span>
                      <span>
                        Subtotal:{' '}
                        <strong className="text-foreground">
                          {formatRupiah(selectedProduct.price * (parsedQty > 0 ? parsedQty : 0))}
                        </strong>
                      </span>
                    </>
                  ) : item.isCustomSku ? (
                    <button
                      type="button"
                      onClick={() => handleItemSkuChange(index, '', false)}
                      className="text-primary hover:underline cursor-pointer text-[10px]"
                    >
                      ← Select from catalog
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleItemSkuChange(index, '', true)}
                      className="text-muted-foreground hover:text-primary hover:underline cursor-pointer text-[10px]"
                    >
                      + Enter custom SKU
                    </button>
                  )}
                </div>

                {/* 409 Insufficient Stock Inline Row Highlight Alert */}
                {isFailingSku && conflictError && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive font-medium px-1 pt-0.5">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>
                      Only <strong>{conflictError.available}</strong> unit(s) available for{' '}
                      <span className="font-mono">{conflictError.sku}</span>.
                    </span>
                  </div>
                )}

                {/* Inline Qty Validation Alert */}
                {isQtyInvalid && (
                  <div className="text-[11px] text-destructive px-1">
                    Quantity must be an integer &gt; 0
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Add Item Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          disabled={isPending}
          className="w-full gap-1.5 border-dashed cursor-pointer text-xs"
        >
          <Plus className="size-3.5" />
          <span>Add Another Item</span>
        </Button>
      </div>

      {/* Estimated Total Bar */}
      {estimatedTotal > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-muted/40 border px-3.5 py-2 text-xs">
          <span className="text-muted-foreground font-medium">Estimated Total</span>
          <span className="text-sm font-semibold text-foreground">
            {formatRupiah(estimatedTotal)}
          </span>
        </div>
      )}

      {/* Dialog Footer Actions */}
      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isCustomerValid || !areItemsValid || isPending}
          className="gap-1.5 cursor-pointer"
        >
          {isPending && <Loader2 className="size-3.5 animate-spin" />}
          <span>{isPending ? 'Placing Order...' : 'Place Order'}</span>
        </Button>
      </DialogFooter>
    </form>
  )
}

export function CreateOrderDialog({ open, onOpenChange }: CreateOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <CreateOrderForm
          key={open ? 'open' : 'closed'}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
