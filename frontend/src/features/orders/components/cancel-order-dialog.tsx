import * as React from 'react'
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react'
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
import { formatRupiah } from '@/features/products/utils/format'
import { useCancelOrder } from '../hooks/use-cancel-order'
import type { Order } from '../types/order.types'

export interface CancelOrderDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CancelOrderDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: CancelOrderDialogProps) {
  const { mutateAsync, isPending } = useCancelOrder()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  if (!order) return null

  const handleConfirmCancel = async () => {
    setErrorMessage(null)
    try {
      await mutateAsync(order.id)
      toast.success('Order cancelled successfully', {
        description: `Order #${order.id} for ${order.customer} has been cancelled and stock has been restored.`,
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      const errorData = error?.data?.error || error?.response?.data?.error
      const message =
        typeof errorData === 'string'
          ? errorData
          : errorData?.code === 'ORDER_ALREADY_CANCELLED'
            ? 'This order is already cancelled.'
            : error?.message || 'Failed to cancel order.'
      setErrorMessage(message)
      toast.error('Cancellation Failed', {
        description: message,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <DialogTitle>Cancel Order #{order.id}</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to cancel this order? This action will restore all items back into product stock.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {errorMessage}
          </div>
        )}

        <div className="rounded-lg border bg-muted/40 p-3.5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-semibold text-foreground">{order.customer}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Order Total:</span>
            <span className="font-semibold text-foreground">{formatRupiah(order.total)}</span>
          </div>

          <div className="border-t pt-2 space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Inventory to be restored:
            </span>
            <div className="space-y-1">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between font-mono text-[11px] bg-background/80 px-2 py-1 rounded"
                >
                  <span className="font-medium text-foreground">{item.sku}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    +{item.qty} units
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="cursor-pointer"
          >
            Keep Order
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmCancel}
            disabled={isPending}
            className="gap-1.5 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RotateCcw className="size-3.5" />
            )}
            <span>{isPending ? 'Cancelling...' : 'Confirm Cancellation'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
