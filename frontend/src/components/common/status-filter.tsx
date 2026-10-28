import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

export function StatusFilter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentStatus = searchParams.get('status') || 'all'

  const handleSelect = (value: string) => {
    const nextParams = new URLSearchParams(searchParams)

    if (value === 'all') {
      nextParams.delete('status')
    } else {
      nextParams.set('status', value)
    }

    if (nextParams.has('page')) {
      nextParams.delete('page')
    }

    setSearchParams(nextParams, { replace: true })
  }

  return (
    <div
      className="inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground border border-border/50"
      role="group"
      aria-label="Filter by status"
    >
      {OPTIONS.map((option) => {
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
