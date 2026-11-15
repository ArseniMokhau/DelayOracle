import { apiGet } from './client'
import type { Advice, Commute } from './types'

// The commutes with these ids, oldest first. Ids the server does not know are left out.
export function fetchCommutes(ids: string[]): Promise<Commute[]> {
  const query = ids.map((id) => `ids=${id}`).join('&')
  return apiGet<Commute[]>(`/api/commutes?${query}`)
}

// When to leave home for one commute, from the live departures of its stop.
export function fetchAdvice(commuteId: string): Promise<Advice> {
  return apiGet<Advice>(`/api/commutes/${commuteId}/advice`)
}
