import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import { LATE_TRAM, STOP, TIMETABLE_BUS } from '../test/fixtures'
import { jsonResponse, renderWithQuery, stubApi } from '../test/renderWithQuery'
import DepartureList from './DepartureList'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('shows the stop name as the heading and asks the API for that stop', async () => {
  const fetchMock = stubApi({ '/departures': jsonResponse([LATE_TRAM]) })

  renderWithQuery(<DepartureList stop={STOP} />)

  expect(screen.getByRole('heading', { level: 2, name: 'Brama Wyżynna' })).toBeTruthy()
  await screen.findByText('Łostowice Świętokrzyska')
  expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/stops\/1028\/departures$/)
})

test('says that departures are loading until the answer arrives', () => {
  // A request that never finishes keeps the component in its loading state.
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

  renderWithQuery(<DepartureList stop={STOP} />)

  expect(screen.getByRole('status').textContent).toContain('Loading departures')
})

test('shows a live departure with Gdańsk times, the delay in words and its source', async () => {
  stubApi({ '/departures': jsonResponse([LATE_TRAM]) })

  renderWithQuery(<DepartureList stop={STOP} />)

  const row = (await screen.findByText('Łostowice Świętokrzyska')).closest('li')!
  expect(within(row).getByText('6')).toBeTruthy()
  expect(within(row).getByText('18:18')).toBeTruthy()
  expect(within(row).getByText('18:20')).toBeTruthy()
  expect(within(row).getByText('3 min late')).toBeTruthy()
  expect(within(row).getByText('Model')).toBeTruthy()
})

test('shows a departure without live data as "No live data" from the timetable', async () => {
  stubApi({ '/departures': jsonResponse([TIMETABLE_BUS]) })

  renderWithQuery(<DepartureList stop={STOP} />)

  const row = (await screen.findByText('Gościnna')).closest('li')!
  expect(within(row).getByText('No live data')).toBeTruthy()
  expect(within(row).getByText('Timetable')).toBeTruthy()
})

test('keeps the order the API sent', async () => {
  stubApi({ '/departures': jsonResponse([LATE_TRAM, TIMETABLE_BUS]) })

  renderWithQuery(<DepartureList stop={STOP} />)

  await screen.findByText('Gościnna')
  const rows = screen.getAllByRole('listitem')
  expect(rows).toHaveLength(2)
  expect(rows[0].textContent).toContain('Łostowice Świętokrzyska')
  expect(rows[1].textContent).toContain('Gościnna')
})

test('says so when the stop has no departures', async () => {
  stubApi({ '/departures': jsonResponse([]) })

  renderWithQuery(<DepartureList stop={STOP} />)

  expect(await screen.findByText('No departures right now')).toBeTruthy()
})

test('shows an error with a retry button when ZTM is unavailable, and retries on click', async () => {
  const fetchMock = stubApi({ '/departures': jsonResponse(null, 503) })
  renderWithQuery(<DepartureList stop={STOP} />)
  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toContain('Live departures are not answering')

  // ZTM is back before the user retries.
  fetchMock.mockResolvedValue(jsonResponse([LATE_TRAM]))
  await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }))

  expect(await screen.findByText('Łostowice Świętokrzyska')).toBeTruthy()
  expect(screen.queryByRole('alert')).toBeNull()
})
