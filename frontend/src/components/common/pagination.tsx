import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export interface PaginationProps {
  page: number
  limit: number
  total: number
}

export function Pagination({ page, limit, total }: PaginationProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1
  const to = Math.min(currentPage * limit, total)

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) {
      return
    }

    const nextParams = new URLSearchParams(searchParams)
    if (newPage <= 1) {
      nextParams.delete('page')
    } else {
      nextParams.set('page', String(newPage))
    }
    setSearchParams(nextParams)
  }

  return (
    <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
      {/* Left: Summary */}
      <div>
        {total === 0 ? (
          <span>No products</span>
        ) : (
          <span>
            Showing <strong className="font-medium text-foreground">{from}</strong>-
            <strong className="font-medium text-foreground">{to}</strong> of{' '}
            <strong className="font-medium text-foreground">{total}</strong>
          </span>
        )}
      </div>

      {/* Right: Previous, Page X / Y, Next */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 gap-1 px-2.5 text-xs"
        >
          <ChevronLeft className="size-3.5" />
          <span>Previous</span>
        </Button>

        <span className="px-1 text-xs font-medium text-foreground select-none">
          {currentPage} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 gap-1 px-2.5 text-xs"
        >
          <span>Next</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
