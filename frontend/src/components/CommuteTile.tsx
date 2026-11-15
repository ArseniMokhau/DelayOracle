import { useQuery } from '@tanstack/react-query'
import { fetchAdvice } from '../api/commutes'
import type { Advice, Commute } from '../api/types'
import { adviceHeadline, describeDelay, formatTime, sourceLabel } from '../lib/format'
import CountdownRing from './CountdownRing'

// The advice depends on live departures, so it is asked for again this often.
const REFRESH_MS = 30_000

interface CommuteTileProps {
  commute: Commute
  // The featured tile is the large one with the countdown ring.
  featured: boolean
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
function CommuteTile({ commute, featured }: CommuteTileProps) {
  const advice = useQuery({
    queryKey: ['advice', commute.id],
    queryFn: () => fetchAdvice(commute.id),
    refetchInterval: REFRESH_MS,
  })

  const line = commute.routeShortName ? `Line ${commute.routeShortName}` : 'Any line'
  const tone = tileTone(advice.data, advice.isError)
  const departure = advice.data?.departure
  const leaveInMinutes = advice.data?.leaveInMinutes

  return (
    <article className={`commute commute-${tone}${featured ? ' commute-featured' : ''}`}>
      {featured && typeof leaveInMinutes === 'number' && <CountdownRing minutes={leaveInMinutes} />}

      <div className="commute-body">
        <p className="commute-kicker">{`${commute.name} · ${line} · ${commute.walkMinutes} min walk`}</p>

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

        {advice.data && <h2 className="commute-headline">{adviceHeadline(advice.data)}</h2>}

        {advice.data && !departure && (
          <p className="commute-detail">Nothing you can still catch right now</p>
        )}

        {advice.data?.leaveBy && departure && (
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
