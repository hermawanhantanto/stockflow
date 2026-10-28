import { useQuery } from '@tanstack/react-query'
import { getProductOrders } from '../api/get-product-orders'
import type { Order } from '../types/order.types'

export function useGetProductOrders(productId: number | string | undefined) {
  return useQuery<Order[], Error>({
    queryKey: ['product-orders', String(productId)],
    queryFn: () => getProductOrders(productId!),
    enabled: Boolean(productId),
  })
}
