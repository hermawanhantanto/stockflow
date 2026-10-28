import * as React from 'react'
import { Search, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks'
import { cn } from '@/lib/utils'

export interface SearchBarProps
  extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  /**
   * Query parameter key to sync with in the URL. Defaults to 'search'.
   */
  paramKey?: string
  /**
   * Debounce delay in milliseconds. Defaults to 400ms.
   */
  debounceMs?: number
}

export function SearchBar({
  paramKey = 'search',
  debounceMs = 400,
  placeholder = 'Search...',
  className,
  ...props
}: SearchBarProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get(paramKey) ?? ''
  const [value, setValue] = React.useState(urlQuery)
  const [prevUrlQuery, setPrevUrlQuery] = React.useState(urlQuery)
  const debouncedValue = useDebounce(value, debounceMs)

  // Keep local input in sync if URL parameter is modified externally
  if (prevUrlQuery !== urlQuery) {
    setPrevUrlQuery(urlQuery)
    setValue(urlQuery)
  }

  // Sync debounced search value to the URL query string
  React.useEffect(() => {
    const currentParam = searchParams.get(paramKey) ?? ''
    const trimmed = debouncedValue.trim()

    // Don't update URL if the search value already matches the URL
    if (trimmed === currentParam) {
      return
    }

    const nextParams = new URLSearchParams(searchParams)
    if (trimmed) {
      nextParams.set(paramKey, trimmed)
    } else {
      nextParams.delete(paramKey)
    }

    if (nextParams.has('page')) {
      nextParams.set('page', '1')
    }

    setSearchParams(nextParams, { replace: true })
  }, [debouncedValue, paramKey, searchParams, setSearchParams])

  const handleClear = () => {
    setValue('')
    if (searchParams.has(paramKey)) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete(paramKey)

      if (nextParams.has('page')) {
        nextParams.set('page', '1')
      }

      setSearchParams(nextParams, { replace: true })
    }
  }

  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8 h-9 bg-background"
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 rounded-sm p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Clear search"
        >
          <X className="size-3.5" />
          <span className="sr-only">Clear search</span>
        </button>
      ) : null}
    </div>
  )
}
