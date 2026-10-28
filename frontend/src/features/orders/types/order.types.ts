import type { Product } from '@/features/products/types/product.types'

export interface OrderItemRequest {
  sku: string
  qty: number
}

export interface CreateOrderRequest {
  customer: string
  items: OrderItemRequest[]
}

export interface OrderItem {
  id: number
  order_id: number
  sku: string
  qty: number
  unit_price: number
}

export interface Order {
  id: number
  customer: string
  status: string
  total: number
  created_at: string
  cancelled_at: string | null
  items: OrderItem[]
}

export interface InsufficientStockError {
  code: 'INSUFFICIENT_STOCK'
  sku: string
  available: number
}

export interface ProductOrdersResponse {
  product: Product
  orders: Order[]
}
