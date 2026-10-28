import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelOrder } from '../api/cancel-order'
import type { Order } from '../types/order.types'

export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation<Order, Error, number | string>({
    mutationFn: (orderId) => cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product-orders'] })
    },
  })
}
