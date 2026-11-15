import { useQuery } from '@tanstack/react-query'
import { fetchModelCard } from '../api/model'

// Shows how far off the model was on average, next to the baseline it has to beat.
function ModelCard() {
  const card = useQuery({
    queryKey: ['model'],
    queryFn: fetchModelCard,
    // The card changes only when the model is retrained, so one load per visit is enough.
    staleTime: Infinity,
  })

  return (
    <section className="model-card" aria-label="Prediction model">
      <h2 className="model-title">The model</h2>

      {card.isPending && (
        <p className="model-note" role="status">
          Loading the model card…
        </p>
      )}

      {card.isError && (
        <p className="model-note">
          The model is offline. Predicted times use ZTM's own live delay until it is back.
        </p>
      )}

      {card.data && (
        <>
          <p className="model-figure">
            <span className="model-number">{card.data.maeSeconds.model.toFixed(1)}</span>
            s average error
          </p>
          <div
            className="model-bar"
            aria-hidden="true"
            style={{ width: `${(card.data.maeSeconds.model / card.data.maeSeconds.baseline) * 100}%` }}
          />
          <p className="model-figure">
            <span className="model-number model-number-small">
              {card.data.maeSeconds.baseline.toFixed(1)}
            </span>
            s using ZTM's delay as is
          </p>
          <div className="model-bar model-bar-baseline" aria-hidden="true" />
          <p className="model-note">
            Measured on {card.data.rows.test.toLocaleString('en-GB')} test departures; shorter is
            better. Trained on {card.data.rows.train.toLocaleString('en-GB')} departures.
          </p>
        </>
      )}
    </section>
  )
}

export default ModelCard
