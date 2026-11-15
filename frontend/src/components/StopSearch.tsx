import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { searchStops } from '../api/stops'
import type { Stop } from '../api/types'
import { stopLabel } from '../lib/format'
import { useDebouncedValue } from '../lib/useDebouncedValue'

// The API rejects searches shorter than this.
const MIN_QUERY_LENGTH = 2
// How long the user has to stop typing before a search is sent.
const TYPING_PAUSE_MS = 300

interface StopSearchProps {
  selectedStop: Stop | null
  onSelect: (stop: Stop) => void
  // The compact form has no big title; it is used inside the commute form.
  compact?: boolean
  // Lets a parent remember the text: it gives the starting text and hears every change.
  initialText?: string
  onTextChange?: (text: string) => void
}

// A text field and the matching stops as buttons: the search tile of the Departures tab,
// and the stop picker of the commute form.
function StopSearch({
  selectedStop,
  onSelect,
  compact = false,
  initialText = '',
  onTextChange,
}: StopSearchProps) {
  const [text, setText] = useState(initialText)
  const query = useDebouncedValue(text.trim(), TYPING_PAUSE_MS)
  const canSearch = query.length >= MIN_QUERY_LENGTH

  const stops = useQuery({
    queryKey: ['stops', query],
    queryFn: () => searchStops(query),
    enabled: canSearch,
    // While the next search loads, the stops of the previous one stay on screen.
    placeholderData: keepPreviousData,
  })

  const found = stops.data ?? []
  // True while `found` still belongs to the previous search.
  const isStale = stops.isPlaceholderData
  const isSearching = stops.isPending || (isStale && found.length === 0)
  const hasNoMatch = stops.isSuccess && !isStale && found.length === 0

  function handleTextChange(newText: string) {
    setText(newText)
    onTextChange?.(newText)
  }

  return (
    <section className={compact ? 'search-tile search-compact' : 'search-tile'} aria-label="Stop search">
      {!compact && <h2 className="search-title">Where are you leaving from?</h2>}
      <div className="search-field">
        <label htmlFor="stop-search" className="search-label">
          Stop name
        </label>
        <input
          id="stop-search"
          type="search"
          className="search-input"
          value={text}
          onChange={(event) => handleTextChange(event.target.value)}
        />
      </div>

      {!canSearch && <p className="search-message">Type at least two letters</p>}

      {canSearch && isSearching && (
        <p className="search-message" role="status">
          Searching…
        </p>
      )}

      {canSearch && stops.isError && (
        <p className="search-message" role="alert">
          Stops could not be loaded. Try again in a moment.
        </p>
      )}

      {canSearch && hasNoMatch && <p className="search-message">No stop matches “{query}”</p>}

      {canSearch && found.length > 0 && (
        <ul className={isStale ? 'stop-list is-stale' : 'stop-list'}>
          {found.map((stop) => (
            <li key={stop.id}>
              <button
                type="button"
                className="stop-pill"
                aria-pressed={stop.id === selectedStop?.id}
                onClick={() => onSelect(stop)}
              >
                {stopLabel(stop)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default StopSearch
