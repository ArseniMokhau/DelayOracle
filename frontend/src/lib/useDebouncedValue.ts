import { useEffect, useState } from 'react'

// Returns the value only after it has stopped changing for delayMs.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    // Runs when the value changes again before the timer fires: the old timer is cancelled.
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
