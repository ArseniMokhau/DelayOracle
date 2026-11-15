import { afterEach, expect, test, vi } from 'vitest'
import { ApiError, apiGet, apiSend } from './client'

// The tests replace the global fetch, so no request leaves the test process.
afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetch(response: { ok: boolean; status: number; json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

test('apiGet requests the path on the API address and returns the parsed JSON', async () => {
  const stops = [{ id: 1028, name: 'Brama Wyżynna', code: '01', zone: 'Gdańsk' }]
  const fetchMock = stubFetch({ ok: true, status: 200, json: async () => stops })

  const result = await apiGet('/api/stops?query=brama')

  expect(result).toEqual(stops)
  expect(fetchMock.mock.calls[0][0]).toMatch(/^https?:\/\/.+\/api\/stops\?query=brama$/)
})

test('apiGet rejects with an ApiError that carries the status code', async () => {
  stubFetch({ ok: false, status: 503 })

  const error = await apiGet('/api/model').catch((caught: unknown) => caught)

  expect(error).toBeInstanceOf(ApiError)
  expect((error as ApiError).status).toBe(503)
})

test('apiGet rejects when the network fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

  await expect(apiGet('/api/model')).rejects.toThrow()
})

test('apiSend posts the body as JSON and returns the parsed answer', async () => {
  const input = { name: 'Home to work', stopId: 1028, routeShortName: null, walkMinutes: 5 }
  const created = { ...input, id: 'c0ffee00-0000-4000-8000-000000000001' }
  const fetchMock = stubFetch({ ok: true, status: 201, json: async () => created })

  const result = await apiSend('POST', '/api/commutes', input)

  expect(result).toEqual(created)
  const [url, options] = fetchMock.mock.calls[0]
  expect(url).toMatch(/\/api\/commutes$/)
  expect(options.method).toBe('POST')
  expect(new Headers(options.headers).get('Content-Type')).toBe('application/json')
  expect(JSON.parse(options.body)).toEqual(input)
})

test('apiSend returns nothing for 204 No Content, without reading a body', async () => {
  const json = vi.fn()
  const fetchMock = stubFetch({ ok: true, status: 204, json })

  const result = await apiSend('DELETE', '/api/commutes/c0ffee00-0000-4000-8000-000000000001')

  expect(result).toBeUndefined()
  expect(json).not.toHaveBeenCalled()
  expect(fetchMock.mock.calls[0][1].method).toBe('DELETE')
})

test('apiSend rejects with an ApiError when the API answers with an error status', async () => {
  stubFetch({ ok: false, status: 404 })

  const error = await apiSend('PUT', '/api/commutes/unknown', {}).catch((caught: unknown) => caught)

  expect(error).toBeInstanceOf(ApiError)
  expect((error as ApiError).status).toBe(404)
})
