import { apiClient } from '@/lib/api-client'
import type { CreateOrderRequest, Order } from '../types/order.types'

export async function createOrder(payload: CreateOrderRequest): Promise<Order> {
  const response = await apiClient.post<Order>('/api/orders', payload)
  return response.data
}
