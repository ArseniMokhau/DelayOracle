// All calls to the backend live in src/api/. The address comes from VITE_API_URL (see .env.example).
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export interface Health {
  status: string
}

export async function fetchHealth(): Promise<Health> {
  const response = await fetch(`${API_URL}/api/health`)
  // fetch only rejects on network errors; an error status has to be checked by hand.
  if (!response.ok) {
    throw new Error(`API responded with status ${response.status}`)
  }
  return response.json()
}
