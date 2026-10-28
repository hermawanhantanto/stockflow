import { apiClient } from '@/lib/api-client'
import type { UpdateStockPayload, UpdateStockResponse } from '../types/product.types'

export const updateStock = async (
  productId: number,
  payload: UpdateStockPayload
): Promise<UpdateStockResponse> => {
  const response = await apiClient.post<UpdateStockResponse>(
    `/api/products/${productId}/stock`,
    {
      type: payload.type,
      qty: payload.qty,
      note: payload.note ?? '',
      text: payload.note ?? '',
    }
  )
  
  return response.data
}
