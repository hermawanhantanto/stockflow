import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createOrder } from '../api/create-order'
import type { CreateOrderRequest, Order } from '../types/order.types'

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation<Order, Error, CreateOrderRequest>({
    mutationFn: createOrder,
    onSuccess: () => {
      // Refresh products table to reflect deducted stock and new movements
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
