import { apiClient } from '@/lib/api-client'
import type { Order } from '../types/order.types'

export async function getOrderById(orderId: number | string): Promise<Order> {
  const response = await apiClient.get<Order>(`/api/orders/${orderId}`)
  return response.data
}
