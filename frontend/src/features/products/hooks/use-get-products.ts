import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import type { GetProductsParams, ProductsResponse } from '../types/product.types'
import { getProduct } from '../api/get-product'

export interface UseGetProductsOptions
  extends Omit<
    UseQueryOptions<ProductsResponse, Error, ProductsResponse, (string | GetProductsParams | undefined)[]>,
    'queryKey' | 'queryFn'
  > {}

export const useGetProducts = (
  params?: GetProductsParams,
  options?: UseGetProductsOptions
) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => getProduct(params),
    retry: (failureCount, error) => {
      const status = (error as unknown as { status?: number })?.status
      if (status && status >= 400 && status < 500) {
        return false
      }
      return failureCount < 3
    },
  
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    ...options,
  })
}
