import { apiGet, apiSend } from './client'
import type { Advice, Commute, CommuteInput } from './types'

// The commutes with these ids, oldest first. Ids the server does not know are left out.
export function fetchCommutes(ids: string[]): Promise<Commute[]> {
  const query = ids.map((id) => `ids=${id}`).join('&')
  return apiGet<Commute[]>(`/api/commutes?${query}`)
}

// When to leave home for one commute, from the live departures of its stop.
export function fetchAdvice(commuteId: string): Promise<Advice> {
  return apiGet<Advice>(`/api/commutes/${commuteId}/advice`)
}

// Saves a new commute. The answer carries the id the server gave it.
export function createCommute(input: CommuteInput): Promise<Commute> {
  return apiSend<Commute>('POST', '/api/commutes', input)
}

// Replaces every editable field of an existing commute.
export function updateCommute(id: string, input: CommuteInput): Promise<Commute> {
  return apiSend<Commute>('PUT', `/api/commutes/${id}`, input)
}
