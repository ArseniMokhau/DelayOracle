interface StateTileProps {
  tone: 'empty' | 'error'
  title: string
  text: string
  // The button is only shown when both of these are given.
  actionLabel?: string
  onAction?: () => void
}

// A coloured tile for "nothing here yet" and "something went wrong".
function StateTile({ tone, title, text, actionLabel, onAction }: StateTileProps) {
  return (
    // role="alert" makes a screen reader announce an error as soon as it appears.
    <div className={`state-tile state-${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <h3 className="state-title">{title}</h3>
      <p className="state-text">{text}</p>
      {actionLabel && onAction && (
        <button type="button" className="button button-dark" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default StateTile
