import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import type { GetProductsParams, ProductsResponse } from '../types/product.types'
import { getProduct } from '../api/get-product'

export interface UseGetProductsOptions
  extends Omit<
    UseQueryOptions<ProductsResponse, Error, ProductsResponse, (string | GetProductsParams | undefined)[]>,
    'queryKey' | 'queryFn'
  > {}

/**
 * React Query hook to fetch products using getProduct handler.
 * Includes automated retry mechanism (up to 3 retries with exponential backoff).
 */
export const useGetProducts = (
  params?: GetProductsParams,
  options?: UseGetProductsOptions
) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => getProduct(params),
    // Retry up to 3 times for network/server errors; bypass for 4xx client errors
    retry: (failureCount, error) => {
      const status = (error as unknown as { status?: number })?.status
      if (status && status >= 400 && status < 500) {
        return false
      }
      return failureCount < 3
    },
    // Exponential backoff delay (1s, 2s, 4s, capped at 10s)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    ...options,
  })
}
