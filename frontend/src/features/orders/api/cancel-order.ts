import { apiClient } from '@/lib/api-client'
import type { Order } from '../types/order.types'

export async function cancelOrder(orderId: number | string): Promise<Order> {
  const response = await apiClient.post<Order>(`/api/orders/${orderId}/cancel`)
  return response.data
}
