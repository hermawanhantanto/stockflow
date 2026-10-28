import { apiClient } from '@/lib/api-client'
import type { GetProductsParams, ProductsResponse } from '../types/product.types'

export const getProduct = async (params?: GetProductsParams): Promise<ProductsResponse> => {
  const response = await apiClient.get<ProductsResponse>('/api/products', {
    params,
  })
  
  return response.data
}
