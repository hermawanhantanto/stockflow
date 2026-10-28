import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface StatusFilterOption {
  label: string
  value: string
}

export interface StatusFilterProps {
  /**
   * The query parameter name in the URL. Defaults to 'status'.
   */
  paramKey?: string
  options?: StatusFilterOption[]
  className?: string
}

const DEFAULT_OPTIONS: StatusFilterOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

export function StatusFilter({
  paramKey = 'status',
  options = DEFAULT_OPTIONS,
  className,
}: StatusFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentStatus = searchParams.get(paramKey) || 'all'

  const handleSelect = (value: string) => {
    const nextParams = new URLSearchParams(searchParams)

    if (value === 'all') {
      nextParams.delete(paramKey)
    } else {
      nextParams.set(paramKey, value)
    }

    if (nextParams.has('page')) {
      nextParams.set('page', '1')
    }

    setSearchParams(nextParams, { replace: true })
  }

  return (
    <div
      className={cn(
        'inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground border border-border/50',
        className
      )}
      role="group"
      aria-label="Filter by status"
    >
      {options.map((option) => {
        const isSelected = currentStatus.toLowerCase() === option.value.toLowerCase()
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={cn(
              'inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer select-none',
              isSelected
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'hover:text-foreground hover:bg-background/40'
            )}
            aria-pressed={isSelected}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
