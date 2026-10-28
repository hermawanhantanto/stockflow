import { useQuery } from '@tanstack/react-query'
import { getOrderById } from '../api/get-order-by-id'
import type { Order } from '../types/order.types'

export function useGetOrderById(orderId: number | string | undefined) {
  return useQuery<Order, Error>({
    queryKey: ['order', String(orderId)],
    queryFn: () => getOrderById(orderId!),
    enabled: Boolean(orderId),
  })
}
