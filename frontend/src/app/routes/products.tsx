import { ProductTable } from '@/features/products'

export function ProductsRoute() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Products
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage SKU catalog, pricing, and stock movements.
        </p>
      </div>

      <ProductTable />
    </div>
  )
}
