export { ProductTable } from './components/product-table'
export { AdjustStockDialog } from './components/adjust-stock-dialog'
export { formatRupiah, formatRelativeTime } from './utils/format'
export { getProduct } from './api/get-product'
export { updateStock } from './api/update-stock'
export { useGetProducts } from './hooks/use-get-products'
export { useUpdateStock } from './hooks/use-update-stock'
export type {
  Product,
  GetProductsParams,
  ProductsResponse,
  ProductStatusFilter,
  StockMovementType,
  UpdateStockPayload,
  UpdateStockResponse,
} from './types/product.types'
