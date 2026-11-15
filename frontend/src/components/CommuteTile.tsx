import { useQuery } from '@tanstack/react-query'
import { fetchAdvice } from '../api/commutes'
import type { Advice, Commute } from '../api/types'
import { adviceHeadline, describeDelay, formatTime, sourceLabel, stopLabel } from '../lib/format'
import { useStop } from '../lib/useStop'
import CountdownRing from './CountdownRing'
import { EditIcon, TrashIcon } from './icons'

// The advice depends on live departures, so it is asked for again this often.
const REFRESH_MS = 30_000

interface CommuteTileProps {
  commute: Commute
  // The featured tile is the large one with the countdown ring.
  featured: boolean
  onEdit: () => void
  onDelete: () => void
}

// Picks the colour group of the tile from what the advice says.
function tileTone(advice: Advice | undefined, failed: boolean): string {
  if (failed) {
    return 'error'
  }
  if (!advice) {
    return 'loading'
  }
  if (advice.status === 'noDeparture') {
    return 'none'
  }
  return advice.leaveInMinutes === 0 ? 'go' : 'wait'
}

// One saved commute with its live answer: when to leave, and for which departure.
function CommuteTile({ commute, featured, onEdit, onDelete }: CommuteTileProps) {
  const advice = useQuery({
    queryKey: ['advice', commute.id],
    queryFn: () => fetchAdvice(commute.id),
    refetchInterval: REFRESH_MS,
  })

    const stop = useStop(commute.stopId)

  const line = commute.routeShortName ? `Line ${commute.routeShortName}` : 'Any line'
  // Name, stop, line and walk. The stop is left out until (or unless) its name is known.
  const kicker = [commute.name, stop.data && stopLabel(stop.data), line, `${commute.walkMinutes} min walk`]
    .filter(Boolean)
    .join(' · ')

  const tone = tileTone(advice.data, advice.isError)
  const departure = advice.data?.departure
  const leaveInMinutes = advice.data?.leaveInMinutes

  return (
    <article className={`commute commute-${tone}${featured ? ' commute-featured' : ''}`}>
      {featured && typeof leaveInMinutes === 'number' && <CountdownRing minutes={leaveInMinutes} />}

      <div className="commute-body">
        <div className="commute-top">
          <p className="commute-kicker">{kicker}</p>
          <div className="commute-actions">
            {/* The buttons show only an icon, so the label is what a screen reader says. */}
            <button type="button" className="icon-button" aria-label={`Edit ${commute.name}`} onClick={onEdit}>
              <EditIcon />
            </button>
            <button type="button" className="icon-button" aria-label={`Delete ${commute.name}`} onClick={onDelete}>
              <TrashIcon />
            </button>
          </div>
        </div>
        {advice.isPending && (
          <p className="commute-headline" role="status">
            Checking the trams…
          </p>
        )}

        {advice.isError && (
          <p className="commute-headline" role="alert">
            Live departures are not answering
          </p>
        )}

        {/* The key makes React draw a new heading when the words change, which replays its fade-in. */}
        {advice.data && !advice.isError && (
          <h2 key={adviceHeadline(advice.data)} className="commute-headline">
            {adviceHeadline(advice.data)}
          </h2>
        )}

        {advice.data && !departure && (
          <p className="commute-detail">Nothing you can still catch right now</p>
        )}

        {advice.data?.leaveBy && departure && !advice.isError && (
          <>
            <p className="commute-detail">{`Out of the door by ${formatTime(advice.data.leaveBy)}`}</p>
            <ul className="pill-list">
              <li className="pill">{`${departure.route} → ${departure.headsign}`}</li>
              <li className="pill">{`Scheduled ${formatTime(departure.scheduledTime)}`}</li>
              <li className="pill pill-strong">{`Predicted ${formatTime(departure.predictedTime)}`}</li>
              <li className="pill">
                {`${describeDelay(departure.predictedDelaySeconds).text} · ${sourceLabel(departure.source)}`}
              </li>
            </ul>
          </>
        )}
      </div>
    </article>
  )
}

export default CommuteTile
