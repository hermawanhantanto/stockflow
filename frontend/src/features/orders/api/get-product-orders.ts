import { apiClient } from '@/lib/api-client'
import { getOrderById } from './get-order-by-id'
import type { Order } from '../types/order.types'

export interface StockMovement {
  id: number
  product_id: number
  type: 'in' | 'out'
  qty: number
  note: string
  created_at: string
}

/**
 * Retrieves all order details for a specific product by:
 * 1. Fetching product movements from GET /api/products/{id}/movements
 * 2. Parsing the associated order IDs from movements (e.g. "Sales Order #1", "Cancelled Order #1")
 * 3. Fetching each order using GetOrderByID (GET /api/orders/{id})
 */
export async function getProductOrders(productId: number | string): Promise<Order[]> {
  const movementsRes = await apiClient.get<{ data: StockMovement[] }>(
    `/api/products/${productId}/movements`
  )
  const movements = movementsRes.data?.data || []

  const orderIdSet = new Set<number>()
  for (const mov of movements) {
    if (mov.note) {
      const match = mov.note.match(/Order #(\d+)/i)
      if (match && match[1]) {
        orderIdSet.add(parseInt(match[1], 10))
      }
    }
  }

  if (orderIdSet.size === 0) {
    return []
  }

  // Fetch each order using GetOrderByID endpoint
  const orderPromises = Array.from(orderIdSet).map((orderId) =>
    getOrderById(orderId).catch(() => null)
  )

  const orders = await Promise.all(orderPromises)
  const validOrders = orders.filter((o): o is Order => o !== null)

  // Sort newest first
  validOrders.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return validOrders
}
