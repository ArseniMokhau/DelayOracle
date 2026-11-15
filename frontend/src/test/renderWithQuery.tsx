import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { vi } from 'vitest'

// Renders a component that uses TanStack Query. Every call gets its own empty cache,
// so one test never sees data another test loaded. Retries are off, so a failing
// request shows its error state at once instead of after several attempts.
export function renderWithQuery(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

// A fake fetch answer with this JSON body and status.
export function jsonResponse(data: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data }
}

// Replaces the global fetch with a fake API. `routes` maps a part of the address to the
// answer for it; the first part found in the requested address wins. An address that
// matches nothing fails the test, so no request can go unnoticed.
export function stubApi(routes: Record<string, ReturnType<typeof jsonResponse>>) {
  // The second parameter is what the app passed as method, headers and body; tests read it back.
  const fetchMock = vi.fn(async (url: string, _options?: RequestInit) => {
    const match = Object.keys(routes).find((part) => url.includes(part))
    if (!match) {
      throw new Error(`Unexpected request in a test: ${url}`)
    }
    return routes[match]
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
