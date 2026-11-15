import { apiGet } from './client'
import type { ModelCard } from './types'

// How the prediction model scored against the baseline when it was trained.
export function fetchModelCard(): Promise<ModelCard> {
  return apiGet<ModelCard>('/api/model')
}
