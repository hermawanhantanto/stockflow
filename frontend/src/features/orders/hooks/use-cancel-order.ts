import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelOrder } from '../api/cancel-order'
import type { Order } from '../types/order.types'

export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation<Order, Error, number | string>({
    mutationFn: (orderId) => cancelOrder(orderId),
    onSuccess: () => {
      // Invalidate products query to visibly restore stock in the products catalog
      queryClient.invalidateQueries({ queryKey: ['products'] })
      // Invalidate current product orders query
      queryClient.invalidateQueries({ queryKey: ['product-orders'] })
    },
  })
}
