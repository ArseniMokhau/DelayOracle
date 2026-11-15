// The ring is full when it is time to leave and empty when that is this far away or more.
const FULL_SCALE_MINUTES = 30
const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface CountdownRingProps {
  minutes: number
}

// The big number of the featured commute, with a ring that fills up as leaving time comes closer.
// The headline next to it says the same in words, so the whole ring is hidden from screen readers.
function CountdownRing({ minutes }: CountdownRingProps) {
  const closeness = 1 - Math.min(minutes, FULL_SCALE_MINUTES) / FULL_SCALE_MINUTES
  const filled = closeness * CIRCUMFERENCE

  return (
    <div className="ring" aria-hidden="true">
      <svg className="ring-svg" viewBox="0 0 120 120">
        <circle className="ring-track" cx="60" cy="60" r={RADIUS} />
        <circle
          className="ring-progress"
          cx="60"
          cy="60"
          r={RADIUS}
          strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
        />
      </svg>
      <div className="ring-label">
        {/* The key makes React draw a new element for each number, which replays its fade-in. */}
        <span key={minutes} className="ring-number">
          {minutes}
        </span>
        <span className="ring-unit">{minutes === 1 ? 'minute' : 'minutes'}</span>
      </div>
    </div>
  )
}

export default CountdownRing
