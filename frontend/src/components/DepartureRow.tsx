import type { Departure } from '../api/types'
import { formatTime, sourceLabel } from '../lib/format'
import DelayBadge from './DelayBadge'

interface DepartureRowProps {
  departure: Departure
}

// One line of the departures list: line number, direction, both times, delay and source.
function DepartureRow({ departure }: DepartureRowProps) {
  return (
    <li className="departure">
      <span className="route">{departure.route}</span>
      <span className="headsign">{departure.headsign}</span>
      <span className="times">
        <span className="time-scheduled">
          <span className="visually-hidden">Scheduled </span>
          {formatTime(departure.scheduledTime)}
        </span>
        <span className="time-arrow" aria-hidden="true">
          →
        </span>
        <span className="time-predicted">
          <span className="visually-hidden">Predicted </span>
          {formatTime(departure.predictedTime)}
        </span>
      </span>
      <DelayBadge delaySeconds={departure.predictedDelaySeconds} />
      <span className="source">{sourceLabel(departure.source)}</span>
    </li>
  )
}

export default DepartureRow
