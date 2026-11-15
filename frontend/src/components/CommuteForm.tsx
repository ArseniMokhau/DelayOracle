import { useMutation } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { createCommute, updateCommute } from '../api/commutes'
import type { Commute, Stop } from '../api/types'
import {
  type CommuteFormErrors,
  type CommuteFormValues,
  emptyCommuteForm,
  formValuesOf,
  toCommuteInput,
  validateCommuteForm,
} from '../lib/commuteForm'
import { stopLabel } from '../lib/format'
import StopSearch from './StopSearch'

interface CommuteFormProps {
  // The commute to edit. Without it the form creates a new one.
  commute?: Commute
  onSaved: (commute: Commute) => void
  onCancel: () => void
}

// The create and edit screen of a commute. It checks the values itself before asking the API.
function CommuteForm({ commute, onSaved, onCancel }: CommuteFormProps) {
  const [values, setValues] = useState<CommuteFormValues>(
    commute ? formValuesOf(commute) : emptyCommuteForm,
  )
  const [errors, setErrors] = useState<CommuteFormErrors>({})
  // The stop picked in this form; null while an edited commute still has its old stop.
  const [pickedStop, setPickedStop] = useState<Stop | null>(null)

  const save = useMutation({
    mutationFn: () => {
      const input = toCommuteInput(values)
      return commute ? updateCommute(commute.id, input) : createCommute(input)
    },
    onSuccess: (saved) => onSaved(saved),
  })

  function handleSubmit(event: FormEvent) {
    // Without this the browser would reload the page, as forms did before JavaScript.
    event.preventDefault()
    const found = validateCommuteForm(values)
    setErrors(found)
    if (Object.keys(found).length === 0) {
      save.mutate()
    }
  }

  function pickStop(stop: Stop) {
    setPickedStop(stop)
    setValues({ ...values, stopId: stop.id })
  }

  return (
    <div className="form-layout">
      <div className="form-intro">
        <h2 className="form-title">{commute ? 'Edit commute' : 'New commute'}</h2>
        <p className="form-lead">
          Tell us the stop and how long the walk is. We will tell you when to leave the house.
        </p>
      </div>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="commute-name" className="field-label">
            Name
          </label>
          <input
            id="commute-name"
            className="input"
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'commute-name-error' : undefined}
          />
          {errors.name && (
            <p id="commute-name-error" className="field-error">
              {errors.name}
            </p>
          )}
        </div>

        <div className="field">
          <StopSearch compact selectedStop={pickedStop} onSelect={pickStop} />
          {pickedStop && <p className="field-hint">{`Selected: ${stopLabel(pickedStop)}`}</p>}
          {!pickedStop && values.stopId !== null && (
            <p className="field-hint">{`Keeps stop number ${values.stopId} unless you pick another`}</p>
          )}
          {errors.stopId && <p className="field-error">{errors.stopId}</p>}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="commute-line" className="field-label">
              Line <span className="field-optional">(optional)</span>
            </label>
            <input
              id="commute-line"
              className="input"
              value={values.routeShortName}
              onChange={(event) => setValues({ ...values, routeShortName: event.target.value })}
              aria-invalid={errors.routeShortName ? true : undefined}
              aria-describedby={errors.routeShortName ? 'commute-line-error' : 'commute-line-hint'}
            />
            {errors.routeShortName ? (
              <p id="commute-line-error" className="field-error">
                {errors.routeShortName}
              </p>
            ) : (
              <p id="commute-line-hint" className="field-hint">
                Leave empty for any line
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="commute-walk" className="field-label">
              Walk to the stop, minutes
            </label>
            <input
              id="commute-walk"
              className="input"
              inputMode="numeric"
              value={values.walkMinutes}
              onChange={(event) => setValues({ ...values, walkMinutes: event.target.value })}
              aria-invalid={errors.walkMinutes ? true : undefined}
              aria-describedby={errors.walkMinutes ? 'commute-walk-error' : undefined}
            />
            {errors.walkMinutes && (
              <p id="commute-walk-error" className="field-error">
                {errors.walkMinutes}
              </p>
            )}
          </div>
        </div>

        {save.isError && (
          <p className="field-error" role="alert">
            The commute could not be saved. Try again in a moment.
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="button button-primary" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save commute'}
          </button>
          <button type="button" className="button button-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default CommuteForm
