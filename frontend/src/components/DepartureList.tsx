import { useQuery } from '@tanstack/react-query'
import { fetchDepartures } from '../api/departures'
import type { Stop } from '../api/types'
import DepartureRow from './DepartureRow'
import StateTile from './StateTile'

// Live data goes stale quickly, so the list reloads itself this often.
const REFRESH_MS = 30_000

interface DepartureListProps {
  stop: Stop
}

// The departures panel of one stop, with its loading, empty and error states.
function DepartureList({ stop }: DepartureListProps) {
  const departures = useQuery({
    queryKey: ['departures', stop.id],
    queryFn: () => fetchDepartures(stop.id),
    refetchInterval: REFRESH_MS,
  })

  return (
    <section className="panel" aria-label="Departures">
      <h2 className="panel-title">{stop.name}</h2>

      {departures.isPending && (
        <div className="skeleton-list" role="status">
          <span className="visually-hidden">Loading departures…</span>
          <div className="skeleton" aria-hidden="true" />
          <div className="skeleton" aria-hidden="true" />
          <div className="skeleton" aria-hidden="true" />
        </div>
      )}

      {departures.isError && (
        <StateTile
          tone="error"
          title="Live departures are not answering"
          text="ZTM Gdańsk did not respond, so there is nothing to show right now."
          actionLabel="Try again"
          onAction={() => departures.refetch()}
        />
      )}

      {departures.data?.length === 0 && (
        <StateTile
          tone="empty"
          title="No departures right now"
          text="Nothing is scheduled to leave this stop in the near future."
        />
      )}

      {departures.data && departures.data.length > 0 && (
        <ul className="departure-list">
          {departures.data.map((departure) => (
            <DepartureRow
              key={`${departure.route}-${departure.headsign}-${departure.scheduledTime}`}
              departure={departure}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

export default DepartureList
