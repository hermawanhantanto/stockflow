export interface Product {
  id: number
  sku: string
  name: string
  price: number
  stock: number
  is_active: boolean
  created_at: string
  last_movement_at: string | null
}

export type ProductStatusFilter = 'all' | 'active' | 'inactive'

export interface GetProductsParams {
  search?: string
  status?: ProductStatusFilter | string
  page?: number
  limit?: number
}

export interface ProductsResponse {
  data: Product[]
  page: number
  limit: number
  total: number
}
