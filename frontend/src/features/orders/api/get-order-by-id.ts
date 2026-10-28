import { apiClient } from '@/lib/api-client'
import type { Order } from '../types/order.types'

/**
 * Fetches order details by ID using the backend's GetOrderByID endpoint (GET /api/orders/{id}).
 */
export async function getOrderById(orderId: number | string): Promise<Order> {
  const response = await apiClient.get<Order>(`/api/orders/${orderId}`)
  return response.data
}
