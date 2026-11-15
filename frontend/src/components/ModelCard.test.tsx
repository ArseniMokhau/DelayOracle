import { cleanup, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { MODEL_CARD } from '../test/fixtures'
import { jsonResponse, renderWithQuery, stubApi } from '../test/renderWithQuery'
import ModelCard from './ModelCard'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('shows the model error, the baseline error and the row counts from the API', async () => {
  const fetchMock = stubApi({ '/api/model': jsonResponse(MODEL_CARD) })

  renderWithQuery(<ModelCard />)

  expect(await screen.findByText('113.0')).toBeTruthy()
  expect(screen.getByText('159.2')).toBeTruthy()
  expect(screen.getByText(/Measured on 5,622 test departures/)).toBeTruthy()
  expect(screen.getByText(/Trained on 22,488 departures/)).toBeTruthy()
  expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/model$/)
})

test('says the card is loading until the answer arrives', () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

  renderWithQuery(<ModelCard />)

  expect(screen.getByRole('status').textContent).toContain('Loading the model card')
})

test('explains the fallback when the worker is unavailable', async () => {
  stubApi({ '/api/model': jsonResponse(null, 503) })

  renderWithQuery(<ModelCard />)

  expect(await screen.findByText(/The model is offline/)).toBeTruthy()
  expect(screen.getByText(/ZTM's own live delay/)).toBeTruthy()
})
