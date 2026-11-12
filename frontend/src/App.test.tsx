import { render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'

afterEach(() => {
  vi.unstubAllGlobals()
})

test('shows that the API is up when the health check succeeds', async () => {
  const okResponse = { ok: true, json: async () => ({ status: 'ok' }) }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse))

  render(<App />)

  expect(await screen.findByText('API is up')).toBeTruthy()
})

test('shows an error when the health check fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

  render(<App />)

  expect(await screen.findByText('API is not reachable')).toBeTruthy()
})
