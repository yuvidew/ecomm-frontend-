import { useEffect, useState } from 'react'

/**
 * useDebouncedValue — returns `value`, but only after it has stopped
 * changing for `delayMs`. Used to avoid firing a request on every keystroke.
 * @param value - the fast-changing value to debounce
 * @param delayMs - how long `value` must stay unchanged before updating
 */
export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timeout)
  }, [value, delayMs])

  return debounced
}
