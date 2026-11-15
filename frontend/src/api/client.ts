// All calls to the backend go through this file. The address comes from VITE_API_URL (see .env.example).
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

// Thrown when the API answers with an error status, so callers can tell a 404 from a 503.
export class ApiError extends Error {
    status: number

    constructor(status: number) {
        super('API responds with status ${status}')
        this.status = status
    }
}

// Turns a response into data, or throws when the API reported an error.
async function readResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        throw new ApiError(response.status)
    }
    // 204 No Content has no body, so there is nothing to parse.
    if (response.status === 204) {
        return undefined as T
    }
    return response.json()
}

export async function apiGet<T>(path: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`)
    return readResponse<T>(response)
}

export async function apiSend<T>(
    method: 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown,
): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    })
    return readResponse<T>(response)
}