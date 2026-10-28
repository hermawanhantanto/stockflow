import { apiClient } from '@/lib/api-client'
import type { GetProductsParams, ProductsResponse } from '../types/product.types'

/**
 * API handler to get products from server.
 * Calls GET /api/products
 */
export const getProduct = async (params?: GetProductsParams): Promise<ProductsResponse> => {
  const response = await apiClient.get<ProductsResponse>('/api/products', {
    params,
  })
  
  return response.data
}
