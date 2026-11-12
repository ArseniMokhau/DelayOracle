const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export interface Health {
  status: string
}

export async function fetchHealth(): Promise<Health> {
  const response = await fetch(`${API_URL}/api/health`)
  if (!response.ok) {
    throw new Error(`API responded with status ${response.status}`)
  }
  return response.json()
}
