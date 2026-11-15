import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import { LATE_TRAM, MODEL_CARD, STOP } from '../test/fixtures'
import { jsonResponse, renderWithQuery, stubApi } from '../test/renderWithQuery'
import DeparturesPage from './DeparturesPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function stubWholeApi() {
  return stubApi({
    '/departures': jsonResponse([LATE_TRAM]),
    '/api/stops?query=': jsonResponse([STOP]),
    '/api/model': jsonResponse(MODEL_CARD),
  })
}

test('asks the user to pick a stop before any is chosen, and loads no departures', async () => {
  const fetchMock = stubWholeApi()

  renderWithQuery(<DeparturesPage />)

  expect(screen.getByText('Pick a stop to see its departures')).toBeTruthy()
  // The model card does not depend on a stop, so it is already there.
  expect(await screen.findByText('113.0')).toBeTruthy()
  const requested = fetchMock.mock.calls.map((call) => call[0])
  expect(requested.some((url) => url.includes('/departures'))).toBe(false)
})

test('searching for a stop and clicking it shows its departures', async () => {
  stubWholeApi()
  renderWithQuery(<DeparturesPage />)

  await userEvent.type(screen.getByLabelText('Stop name'), 'brama')
  await userEvent.click(await screen.findByRole('button', { name: 'Brama Wyżynna 01' }))

  expect(await screen.findByText('Łostowice Świętokrzyska')).toBeTruthy()
  expect(screen.getByRole('heading', { level: 2, name: 'Brama Wyżynna' })).toBeTruthy()
  expect(screen.queryByText('Pick a stop to see its departures')).toBeNull()
  // The chosen stop stays marked in the search results.
  const chosen = screen.getByRole('button', { name: 'Brama Wyżynna 01' })
  expect(chosen.getAttribute('aria-pressed')).toBe('true')
})
