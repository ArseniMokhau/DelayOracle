import type { Stop } from '../api/types'

// What the Departures tab has to remember while another tab is open.
export interface DeparturesSearch {
  // The text in the stop search field.
  text: string
  // The stop whose departures are showing; null until the user picks one.
  stop: Stop | null
}

export const emptyDeparturesSearch: DeparturesSearch = { text: '', stop: null }
