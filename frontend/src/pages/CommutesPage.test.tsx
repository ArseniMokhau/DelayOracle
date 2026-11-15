import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { loadCommuteIds, saveCommuteIds } from '../lib/commuteIds'
import {
  GYM_COMMUTE,
  GYM_ID,
  LEAVE_IN_SIX,
  NO_DEPARTURE,
  STOP,
  WORK_COMMUTE,
  WORK_ID,
} from '../test/fixtures'
import { jsonResponse, renderWithQuery, stubApi } from '../test/renderWithQuery'
import CommutesPage from './CommutesPage'

beforeEach(() => {
  localStorage.clear()
  window.location.hash = ''
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

// The tile of one commute, found by the commute's name.
async function findTile(name: string) {
  const kicker = await screen.findByText((text) => text.startsWith(name))
  return within(kicker.closest('article')!)
}

test('says there are no commutes yet when none are saved, and asks the API for nothing', () => {
  const fetchMock = stubApi({})

  renderWithQuery(<CommutesPage />)

  expect(screen.getByText('No commutes yet')).toBeTruthy()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('loads the saved commutes by their ids and shows a tile for each', async () => {
  saveCommuteIds([WORK_ID, GYM_ID])
  const fetchMock = stubApi({
    '/advice': jsonResponse(NO_DEPARTURE),
    '/api/commutes?': jsonResponse([WORK_COMMUTE, GYM_COMMUTE]),
  })

  renderWithQuery(<CommutesPage />)

  const work = await findTile('Morning to work')
  expect(work.getByText('Morning to work · Line 6 · 5 min walk')).toBeTruthy()
  const gym = await findTile('Gym')
  expect(gym.getByText('Gym · Any line · 3 min walk')).toBeTruthy()
  const listRequest = fetchMock.mock.calls.map((call) => call[0]).find((url) => url.includes('?'))
  expect(listRequest).toMatch(new RegExp(`/api/commutes\\?ids=${WORK_ID}&ids=${GYM_ID}$`))
})

test('says the commutes are loading until the answer arrives', () => {
  saveCommuteIds([WORK_ID])
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

  renderWithQuery(<CommutesPage />)

  expect(screen.getByRole('status').textContent).toContain('Loading your commutes')
})

test('shows when to leave, with the departure it is based on', async () => {
  saveCommuteIds([WORK_ID])
  stubApi({
    [`${WORK_ID}/advice`]: jsonResponse(LEAVE_IN_SIX),
    '/api/commutes?': jsonResponse([WORK_COMMUTE]),
  })

  renderWithQuery(<CommutesPage />)

  const tile = await findTile('Morning to work')
  expect(await tile.findByRole('heading', { name: 'Leave in 6 minutes' })).toBeTruthy()
  expect(tile.getByText('Out of the door by 18:14')).toBeTruthy()
  expect(tile.getByText('6 → Łostowice Świętokrzyska')).toBeTruthy()
  expect(tile.getByText('Scheduled 18:18')).toBeTruthy()
  expect(tile.getByText('Predicted 18:20')).toBeTruthy()
  expect(tile.getByText('3 min late · Model')).toBeTruthy()
})

test('says "No departure" when nothing can be caught', async () => {
  saveCommuteIds([GYM_ID])
  stubApi({
    '/advice': jsonResponse(NO_DEPARTURE),
    '/api/commutes?': jsonResponse([GYM_COMMUTE]),
  })

  renderWithQuery(<CommutesPage />)

  const tile = await findTile('Gym')
  expect(await tile.findByRole('heading', { name: 'No departure' })).toBeTruthy()
  expect(tile.getByText('Nothing you can still catch right now')).toBeTruthy()
})

test('each commute shows its own advice', async () => {
  saveCommuteIds([WORK_ID, GYM_ID])
  stubApi({
    [`${WORK_ID}/advice`]: jsonResponse(LEAVE_IN_SIX),
    [`${GYM_ID}/advice`]: jsonResponse(NO_DEPARTURE),
    '/api/commutes?': jsonResponse([WORK_COMMUTE, GYM_COMMUTE]),
  })

  renderWithQuery(<CommutesPage />)

  expect(await (await findTile('Morning to work')).findByText('Leave in 6 minutes')).toBeTruthy()
  expect(await (await findTile('Gym')).findByText('No departure')).toBeTruthy()
})

test('a commute whose advice cannot be loaded says that ZTM is not answering', async () => {
  saveCommuteIds([WORK_ID])
  stubApi({
    '/advice': jsonResponse(null, 503),
    '/api/commutes?': jsonResponse([WORK_COMMUTE]),
  })

  renderWithQuery(<CommutesPage />)

  const tile = await findTile('Morning to work')
  expect((await tile.findByRole('alert')).textContent).toBe('Live departures are not answering')
})

test('forgets an id the server no longer knows', async () => {
  saveCommuteIds([WORK_ID, GYM_ID])
  // The gym commute was deleted on another device: the API leaves it out.
  stubApi({
    '/advice': jsonResponse(NO_DEPARTURE),
    '/api/commutes?': jsonResponse([WORK_COMMUTE]),
  })

  renderWithQuery(<CommutesPage />)

  await findTile('Morning to work')
  await waitFor(() => expect(loadCommuteIds()).toEqual([WORK_ID]))
})

test('opened from a share link, it adds those commutes, says so and cleans the address', async () => {
  saveCommuteIds([WORK_ID])
  window.location.hash = `#commutes=${GYM_ID}`
  stubApi({
    '/advice': jsonResponse(NO_DEPARTURE),
    '/api/commutes?': jsonResponse([WORK_COMMUTE, GYM_COMMUTE]),
  })

  renderWithQuery(<CommutesPage />)

  await findTile('Gym')
  expect(screen.getByText('1 commute added from the link')).toBeTruthy()
  expect(loadCommuteIds()).toEqual([WORK_ID, GYM_ID])
  expect(window.location.hash).toBe('')
})

test('a share link with commutes this browser already has adds nothing', async () => {
  saveCommuteIds([WORK_ID])
  window.location.hash = `#commutes=${WORK_ID}`
  stubApi({
    '/advice': jsonResponse(NO_DEPARTURE),
    '/api/commutes?': jsonResponse([WORK_COMMUTE]),
  })

  renderWithQuery(<CommutesPage />)

  await findTile('Morning to work')
  expect(screen.queryByText(/added from the link/)).toBeNull()
  expect(loadCommuteIds()).toEqual([WORK_ID])
})

test('shows an error with a retry button when the commutes cannot be loaded', async () => {
  saveCommuteIds([WORK_ID])
  const fetchMock = stubApi({ '/api/commutes?': jsonResponse(null, 500) })
  renderWithQuery(<CommutesPage />)
  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toContain('Your commutes could not be loaded')

  // The API is back before the user retries.
  fetchMock.mockImplementation(async (url: string) =>
    url.includes('/advice') ? jsonResponse(NO_DEPARTURE) : jsonResponse([WORK_COMMUTE]),
  )
  await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }))

  await findTile('Morning to work')
  // The failed load must not make the browser forget the commute.
  expect(loadCommuteIds()).toEqual([WORK_ID])
})

test('the empty state offers to add the first commute, which opens the form', async () => {
  stubApi({})
  renderWithQuery(<CommutesPage />)

  await userEvent.click(screen.getByRole('button', { name: 'Add your first commute' }))

  expect(screen.getByRole('heading', { name: 'New commute' })).toBeTruthy()
  expect(screen.queryByText('No commutes yet')).toBeNull()
})

test('saving a new commute remembers its id and shows its tile', async () => {
  stubApi({
    '/advice': jsonResponse(NO_DEPARTURE),
    '/api/stops?query=': jsonResponse([STOP]),
    '/api/commutes?': jsonResponse([WORK_COMMUTE]),
    '/api/commutes': jsonResponse(WORK_COMMUTE, 201),
  })
  renderWithQuery(<CommutesPage />)
  await userEvent.click(screen.getByRole('button', { name: 'Add your first commute' }))

  await userEvent.type(screen.getByLabelText('Name'), 'Morning to work')
  await userEvent.type(screen.getByLabelText('Stop name'), 'brama')
  await userEvent.click(await screen.findByRole('button', { name: 'Brama Wyżynna 01' }))
  await userEvent.click(screen.getByRole('button', { name: 'Save commute' }))

  await findTile('Morning to work')
  expect(screen.queryByRole('heading', { name: 'New commute' })).toBeNull()
  expect(loadCommuteIds()).toEqual([WORK_ID])
})

test('the list has a "New commute" button, and Cancel in the form returns to the list', async () => {
  saveCommuteIds([WORK_ID])
  stubApi({
    '/advice': jsonResponse(NO_DEPARTURE),
    '/api/commutes?': jsonResponse([WORK_COMMUTE]),
  })
  renderWithQuery(<CommutesPage />)
  await findTile('Morning to work')

  await userEvent.click(screen.getByRole('button', { name: '+ New commute' }))
  expect(screen.getByRole('heading', { name: 'New commute' })).toBeTruthy()
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

  await findTile('Morning to work')
  expect(screen.queryByRole('heading', { name: 'New commute' })).toBeNull()
})
