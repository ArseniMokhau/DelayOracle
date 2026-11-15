import { apiGet } from './client'
import type { Stop } from './types'

// Stops whose name contains the text. The API needs at least two characters.
export function searchStops(query: string): Promise<Stop[]> {
  return apiGet<Stop[]>(`/api/stops?query=${encodeURIComponent(query)}`)
}
