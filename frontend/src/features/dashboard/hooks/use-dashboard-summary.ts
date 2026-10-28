import * as React from 'react'
import { useGetProducts } from '@/features/products/hooks/use-get-products'
import type { Product } from '@/features/products/types/product.types'

export interface DashboardSummary {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  totalStockValue: number
  lowStockCount: number
  lowStockProducts: Product[]
  totalUnits: number
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

export function useDashboardSummary(): DashboardSummary {
  const { data, isLoading, isError, refetch } = useGetProducts({
    limit: 500,
    status: 'all',
  })

  const summary = React.useMemo(() => {
    const products = data?.data || []
    const totalProducts = data?.total ?? products.length
    const activeProducts = products.filter((p) => p.is_active).length
    const inactiveProducts = totalProducts - activeProducts

    const totalStockValue = products.reduce((acc, p) => acc + p.price * p.stock, 0)
    const totalUnits = products.reduce((acc, p) => acc + p.stock, 0)

    const lowStockProducts = products.filter((p) => p.stock <= 5)
    const lowStockCount = lowStockProducts.length

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      totalStockValue,
      lowStockCount,
      lowStockProducts,
      totalUnits,
    }
  }, [data])

  return {
    ...summary,
    isLoading,
    isError,
    refetch,
  }
}
