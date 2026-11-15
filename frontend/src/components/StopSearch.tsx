import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { searchStops } from '../api/stops'
import type { Stop } from '../api/types'
import { useDebouncedValue } from '../lib/useDebouncedValue.ts'
import { stopLabel } from '../lib/format'

// The API rejects searches shorter than this.
const MIN_QUERY_LENGTH = 2
// How long the user has to stop typing before a search is sent.
const TYPING_PAUSE_MS = 300

interface StopSearchProps {
  selectedStop: Stop | null
  onSelect: (stop: Stop) => void
  // The compact form has no big title; it is used inside the commute form.
  compact?: boolean
}

// The search tile of the Departures tab: a text field and the matching stops as buttons.
function StopSearch({ selectedStop, onSelect, compact = false }: StopSearchProps) {
  const [text, setText] = useState('')
  const query = useDebouncedValue(text.trim(), TYPING_PAUSE_MS)
  const canSearch = query.length >= MIN_QUERY_LENGTH

  const stops = useQuery({
    queryKey: ['stops', query],
    queryFn: () => searchStops(query),
    enabled: canSearch,
  })

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
          onChange={(event) => setText(event.target.value)}
        />
      </div>

      {!canSearch && <p className="search-message">Type at least two letters</p>}

      {canSearch && stops.isPending && (
        <p className="search-message" role="status">
          Searching…
        </p>
      )}

      {canSearch && stops.isError && (
        <p className="search-message" role="alert">
          Stops could not be loaded. Try again in a moment.
        </p>
      )}

      {canSearch && stops.data?.length === 0 && (
        <p className="search-message">No stop matches “{query}”</p>
      )}

      {canSearch && stops.data && stops.data.length > 0 && (
        <ul className="stop-list">
          {stops.data.map((stop) => (
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