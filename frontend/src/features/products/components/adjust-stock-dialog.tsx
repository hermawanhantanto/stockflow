import * as React from 'react'
import { AlertTriangle, ArrowDown, ArrowUp, Loader2 } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { useUpdateStock } from '../hooks/use-update-stock'
import type { Product, StockMovementType } from '../types/product.types'

export interface AdjustStockDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AdjustStockFormProps {
  product: Product
  onClose: () => void
}

function AdjustStockForm({ product, onClose }: AdjustStockFormProps) {
  const [direction, setDirection] = React.useState<StockMovementType>('in')
  const [qty, setQty] = React.useState('1')
  const [note, setNote] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [insufficientStockInfo, setInsufficientStockInfo] = React.useState<{ available: number } | null>(null)

  const { mutateAsync, isPending } = useUpdateStock()

  const parsedQty = Number(qty)
  const isInteger = Number.isInteger(parsedQty)
  const isValidQty = qty.trim() !== '' && !isNaN(parsedQty) && isInteger && parsedQty > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidQty) {
      setErrorMessage('Quantity must be an integer greater than 0.')
      return
    }

    setErrorMessage(null)
    setInsufficientStockInfo(null)

    try {
      const res = await mutateAsync({
        productId: product.id,
        payload: {
          type: direction,
          qty: parsedQty,
          note: note.trim() || undefined,
        },
      })

      toast.success('Stock updated successfully', {
        description: `${direction === 'in' ? 'Added' : 'Deducted'} ${parsedQty} unit(s) for ${product.name}. Current stock: ${res.new_stock}`,
      })

      onClose()
    } catch (error: any) {
      const errorData = error?.data?.error || error?.response?.data?.error
      let message = error?.message || 'Failed to update stock. Please try again.'

      if (errorData?.code === 'INSUFFICIENT_STOCK') {
        const available = errorData.available ?? product.stock
        setInsufficientStockInfo({ available })
        message = `Insufficient stock: Only ${available} item(s) available in stock.`
      }

      setErrorMessage(message)

      toast.error(errorData?.code === 'INSUFFICIENT_STOCK' ? 'Insufficient Stock' : 'Stock Adjustment Failed', {
        description: message,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Adjust Stock</DialogTitle>
        <DialogDescription>
          Update inventory for <strong className="font-medium text-foreground">{product.name}</strong> ({product.sku}).
        </DialogDescription>
      </DialogHeader>

      {/* Current stock indicator */}
      <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3.5 py-2 text-xs">
        <span className="text-muted-foreground">Current available stock:</span>
        <span className="font-semibold text-foreground">{product.stock} units</span>
      </div>

      {/* 409 Insufficient Stock or general error alert */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">
              {insufficientStockInfo ? 'Insufficient Stock' : 'Adjustment Error'}
            </p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Direction toggle */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Direction</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setDirection('in')
              setErrorMessage(null)
            }}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all cursor-pointer',
              direction === 'in'
                ? 'border-emerald-600/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                : 'border-border bg-background text-muted-foreground hover:bg-muted'
            )}
          >
            <ArrowUp className="size-3.5" />
            <span>Stock In (+ Add)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDirection('out')
              setErrorMessage(null)
            }}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all cursor-pointer',
              direction === 'out'
                ? 'border-rose-600/30 bg-rose-500/15 text-rose-700 dark:text-rose-400 font-semibold shadow-xs'
                : 'border-border bg-background text-muted-foreground hover:bg-muted'
            )}
          >
            <ArrowDown className="size-3.5" />
            <span>Stock Out (- Deduct)</span>
          </button>
        </div>
      </div>

      {/* Quantity */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="adjust-qty" className="text-xs font-medium text-foreground">
            Quantity <span className="text-destructive">*</span>
          </label>
          {!isValidQty && qty.trim() !== '' && (
            <span className="text-[11px] text-destructive">Must be integer &gt; 0</span>
          )}
        </div>
        <Input
          id="adjust-qty"
          type="number"
          min="1"
          step="1"
          value={qty}
          onChange={(e) => {
            setQty(e.target.value)
            setErrorMessage(null)
          }}
          placeholder="Enter quantity..."
          required
          className={cn(!isValidQty && qty.trim() !== '' && 'border-destructive focus-visible:ring-destructive/30')}
        />
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label htmlFor="adjust-note" className="text-xs font-medium text-foreground">
          Note <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          id="adjust-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Restock shipment #104, Damaged items"
        />
      </div>

      {/* Action buttons */}
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
          disabled={!isValidQty || isPending}
          className="gap-1.5"
        >
          {isPending && <Loader2 className="size-3.5 animate-spin" />}
          <span>{isPending ? 'Saving...' : 'Confirm'}</span>
        </Button>
      </DialogFooter>
    </form>
  )
}

export function AdjustStockDialog({
  product,
  open,
  onOpenChange,
}: AdjustStockDialogProps) {
  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <AdjustStockForm
          key={`${product.id}-${open}`}
          product={product}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
