import type { Commute, CommuteInput } from '../api/types'

// What the form holds while the user types. Text fields stay text until saving,
// so a half-typed number like "" or "5." can be shown as it is.
export interface CommuteFormValues {
  name: string
  stopId: number | null
  routeShortName: string
  walkMinutes: string
}

// One message per field that has a mistake; a valid form gives an empty object.
export type CommuteFormErrors = Partial<Record<keyof CommuteFormValues, string>>

// The same limits as the API (CommuteRequest in the backend).
const MAX_NAME_LENGTH = 60
const MAX_LINE_LENGTH = 8
const MAX_WALK_MINUTES = 60
const WHOLE_NUMBER = /^\d+$/

export const emptyCommuteForm: CommuteFormValues = {
  name: '',
  stopId: null,
  routeShortName: '',
  walkMinutes: '5',
}

export function formValuesOf(commute: Commute): CommuteFormValues {
  return {
    name: commute.name,
    stopId: commute.stopId,
    routeShortName: commute.routeShortName ?? '',
    walkMinutes: String(commute.walkMinutes),
  }
}

export function validateCommuteForm(values: CommuteFormValues): CommuteFormErrors {
  const errors: CommuteFormErrors = {}
  const name = values.name.trim()
  const walk = values.walkMinutes.trim()

  if (name.length === 0) {
    errors.name = 'Enter a name'
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = `Use at most ${MAX_NAME_LENGTH} characters`
  }

  if (values.stopId === null) {
    errors.stopId = 'Pick a stop from the list'
  }

  if (values.routeShortName.trim().length > MAX_LINE_LENGTH) {
    errors.routeShortName = `Use at most ${MAX_LINE_LENGTH} characters`
  }

  if (!WHOLE_NUMBER.test(walk) || Number(walk) > MAX_WALK_MINUTES) {
    errors.walkMinutes = `Enter a walk between 0 and ${MAX_WALK_MINUTES} minutes`
  }

  return errors
}

// Turns a valid form into the body the API expects. Call it only after validation passed.
export function toCommuteInput(values: CommuteFormValues): CommuteInput {
  const line = values.routeShortName.trim()

  return {
    name: values.name.trim(),
    stopId: values.stopId ?? 0,
    routeShortName: line === '' ? null : line,
    walkMinutes: Number(values.walkMinutes.trim()),
  }
}
