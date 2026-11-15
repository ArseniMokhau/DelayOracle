// The browser's personal list of commutes: only their ids, kept in localStorage.
// The commutes themselves live on the server; an id is the only key to one.

const STORAGE_KEY = 'delayoracle.commuteIds'
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// True for text in the shape of a GUID, which is what the API uses as a commute id.
export function isCommuteId(value: unknown): value is string {
  return typeof value === 'string' && GUID_PATTERN.test(value)
}

// Reads the saved ids. Anything unexpected in storage counts as "no commutes yet".
export function loadCommuteIds(): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(stored) ? stored.filter(isCommuteId) : []
  } catch {
    return []
  }
}

export function saveCommuteIds(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

// Returns a new list with the added ids at the end, each id at most once.
export function addCommuteIds(current: string[], added: string[]): string[] {
  return [...new Set([...current, ...added])]
}

// Returns a new list without this id.
export function removeCommuteId(current: string[], id: string): string[] {
  return current.filter((existing) => existing !== id)
}
