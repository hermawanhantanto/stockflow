import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateStock } from '../api/update-stock'
import type { UpdateStockPayload, UpdateStockResponse } from '../types/product.types'

export interface UpdateStockVariables {
  productId: number
  payload: UpdateStockPayload
}

export function useUpdateStock() {
  const queryClient = useQueryClient()

  return useMutation<UpdateStockResponse, Error, UpdateStockVariables>({
    mutationFn: ({ productId, payload }) => updateStock(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
