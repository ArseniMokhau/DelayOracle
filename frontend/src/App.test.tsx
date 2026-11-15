import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import { LATE_TRAM, MODEL_CARD, STOP } from './test/fixtures'
import { jsonResponse, renderWithQuery, stubApi } from './test/renderWithQuery'

// The pages load data as soon as they appear, so every test gets a fake API.
beforeEach(() => {
  stubApi({ '/api/model': jsonResponse(MODEL_CARD) })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('shows the brand and both tabs', () => {
  renderWithQuery(<App />)

  expect(screen.getByText('DelayOracle')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Departures' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'My commutes' })).toBeTruthy()
})

test('starts on the My commutes tab', () => {
  renderWithQuery(<App />)

  expect(screen.getByRole('heading', { level: 1, name: 'My commutes' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'My commutes' }).getAttribute('aria-current')).toBe('page')
  expect(screen.getByRole('button', { name: 'Departures' }).getAttribute('aria-current')).toBeNull()
})

test('clicking the Departures tab shows the departures screen', async () => {
  renderWithQuery(<App />)

  await userEvent.click(screen.getByRole('button', { name: 'Departures' }))

  expect(screen.getByRole('heading', { level: 1, name: 'Departures' })).toBeTruthy()
  expect(screen.queryByRole('heading', { level: 1, name: 'My commutes' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Departures' }).getAttribute('aria-current')).toBe('page')
  // Wait for the model card, so its request finishes inside the test.
  expect(await screen.findByText('113.0')).toBeTruthy()
})

test('the Departures tab remembers its search and stop while another tab is open', async () => {
  stubApi({
    '/departures': jsonResponse([LATE_TRAM]),
    '/api/stops?query=': jsonResponse([STOP]),
    '/api/model': jsonResponse(MODEL_CARD),
  })
  renderWithQuery(<App />)
  await userEvent.click(screen.getByRole('button', { name: 'Departures' }))
  await userEvent.type(screen.getByLabelText('Stop name'), 'brama')
  await userEvent.click(await screen.findByRole('button', { name: 'Brama Wyżynna 01' }))
  await screen.findByText('Łostowice Świętokrzyska')

  await userEvent.click(screen.getByRole('button', { name: 'My commutes' }))
  await userEvent.click(screen.getByRole('button', { name: 'Departures' }))

  expect((screen.getByLabelText('Stop name') as HTMLInputElement).value).toBe('brama')
  expect(await screen.findByText('Łostowice Świętokrzyska')).toBeTruthy()
  const chosen = await screen.findByRole('button', { name: 'Brama Wyżynna 01' })
  expect(chosen.getAttribute('aria-pressed')).toBe('true')
})
