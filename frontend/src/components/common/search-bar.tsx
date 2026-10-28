import * as React from 'react'
import { Search, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks'

export interface SearchBarProps {
  placeholder?: string
}

export function SearchBar({ placeholder = 'Search...' }: SearchBarProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('search') ?? ''
  const [value, setValue] = React.useState(urlQuery)
  const [prevUrlQuery, setPrevUrlQuery] = React.useState(urlQuery)
  const debouncedValue = useDebounce(value, 400)

  if (prevUrlQuery !== urlQuery) {
    setPrevUrlQuery(urlQuery)
    setValue(urlQuery)
  }

  React.useEffect(() => {
    const currentParam = searchParams.get('search') ?? ''
    const trimmed = debouncedValue.trim()

    if (trimmed === currentParam) {
      return
    }

    const nextParams = new URLSearchParams(searchParams)
    if (trimmed) {
      nextParams.set('search', trimmed)
    } else {
      nextParams.delete('search')
    }

    if (nextParams.has('page')) {
      nextParams.delete('page')
    }

    setSearchParams(nextParams, { replace: true })
  }, [debouncedValue, searchParams, setSearchParams])

  const handleClear = () => {
    setValue('')
    if (searchParams.has('search')) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('search')

      if (nextParams.has('page')) {
        nextParams.delete('page')
      }

      setSearchParams(nextParams, { replace: true })
    }
  }

  return (
    <div className="relative flex items-center w-full">
      <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8 h-9 bg-background"
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
