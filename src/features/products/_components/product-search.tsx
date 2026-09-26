import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { SearchIcon } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

// how long to wait after the user stops typing before updating ?search=
const SEARCH_DEBOUNCE_MS = 400

/**
 * ProductSearch — debounced search box for the shop page. Reads/writes the
 * `?search=` URL param and resets `?page=` whenever the query changes.
 */
export const ProductSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [text, setText] = useState(searchParams.get('search') ?? '')
  const debouncedText = useDebouncedValue(text, SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    const current = searchParams.get('search') ?? ''
    if (debouncedText === current) return

    const next = new URLSearchParams(searchParams)
    if (debouncedText) {
      next.set('search', debouncedText)
    } else {
      next.delete('search')
    }
    next.delete('page')
    setSearchParams(next)
    // only re-run when the debounced query itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedText])

  return (
    <InputGroup className="h-10 w-full sm:max-w-sm">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        placeholder="Search products..."
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-label="Search products"
      />
    </InputGroup>
  )
}
