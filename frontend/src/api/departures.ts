import { apiGet } from './client'
import type { Departure } from './types'

// The next departures from a stop, each with its predicted time.
export function fetchDepartures(stopId: number): Promise<Departure[]> {
  return apiGet<Departure[]>(`/api/stops/${stopId}/departures`)
}
