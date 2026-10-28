import { SearchBar, StatusFilter } from '@/components/common'
import { ProductTable } from '@/features/products'

export function ProductsRoute() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Products
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage SKU catalog, pricing, and stock movements.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <StatusFilter />
          <div className="w-full sm:w-72">
            <SearchBar placeholder="Search by name or SKU..." />
          </div>
        </div>
      </div>

      <ProductTable />
    </div>
  )
}
