import { AlertCircle, Loader2, MoreHorizontal, RotateCcw } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useGetProducts } from '../hooks/use-get-products'
import { formatRelativeTime, formatRupiah } from '../utils/format'

export interface ProductTableProps {
  /**
   * Optional search filter override. If omitted, uses URL ?search= query param.
   */
  search?: string
  /**
   * Optional status filter override. If omitted, uses URL ?status= query param.
   */
  status?: string
}

export function ProductTable({ search: customSearch, status: customStatus }: ProductTableProps = {}) {
  const [searchParams] = useSearchParams()
  const search = customSearch ?? (searchParams.get('search')?.trim() || undefined)
  const statusParam = customStatus ?? searchParams.get('status')?.trim()
  const status = statusParam && statusParam !== 'all' ? statusParam : undefined

  const { data, isLoading, isError, error, refetch, isFetching } = useGetProducts({ search, status })

  const products = data?.data ?? []

  return (
    <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[140px] font-semibold">SKU</TableHead>
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="w-[160px] font-semibold">Price</TableHead>
            <TableHead className="w-[100px] font-semibold">Stock</TableHead>
            <TableHead className="w-[130px] font-semibold">Status</TableHead>
            <TableHead className="w-[160px] font-semibold">Last Movement</TableHead>
            <TableHead className="w-[100px] text-right font-semibold">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-32 text-center text-sm text-muted-foreground"
              >
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  <span>Loading products...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-44 text-center"
              >
                <div className="flex flex-col items-center justify-center gap-2.5 py-6">
                  <div className="rounded-full bg-destructive/10 p-2.5 text-destructive">
                    <AlertCircle className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Failed to load products
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      {error instanceof Error ? error.message : 'An unexpected error occurred'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="mt-1 h-8 gap-1.5"
                  >
                    <RotateCcw className={cn("size-3.5", isFetching && "animate-spin")} />
                    <span>{isFetching ? 'Retrying...' : 'Try Again'}</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-32 text-center text-sm text-muted-foreground"
              >
                {search || status ? (
                  <span>
                    No products found matching your filter criteria.
                  </span>
                ) : (
                  'No products available yet.'
                )}
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-xs font-medium text-muted-foreground">
                  {product.sku}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {product.name}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {formatRupiah(product.price)}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'font-medium',
                      product.stock <= 5 && product.stock > 0 && 'text-amber-600 dark:text-amber-400',
                      product.stock === 0 && 'text-destructive font-semibold'
                    )}
                  >
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-medium gap-1.5',
                      product.is_active
                        ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800/60 dark:bg-green-950/40 dark:text-green-300'
                        : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300'
                    )}
                  >
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        product.is_active
                          ? 'bg-green-600 dark:bg-green-400'
                          : 'bg-red-600 dark:bg-red-400'
                      )}
                    />
                    {product.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatRelativeTime(product.last_movement_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Product actions"
                  >
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Actions for {product.name}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
