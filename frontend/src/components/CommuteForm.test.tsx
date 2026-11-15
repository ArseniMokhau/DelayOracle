import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import { STOP, WORK_COMMUTE, WORK_ID } from '../test/fixtures'
import { jsonResponse, renderWithQuery, stubApi } from '../test/renderWithQuery'
import CommuteForm from './CommuteForm'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

// The request that saved the commute, if there was one.
function savedRequest(fetchMock: ReturnType<typeof stubApi>) {
  return fetchMock.mock.calls.find((call) => (call[1] as RequestInit | undefined)?.method !== undefined)
}

async function pickStop() {
  await userEvent.type(screen.getByLabelText('Stop name'), 'brama')
  await userEvent.click(await screen.findByRole('button', { name: 'Brama Wyżynna 01' }))
}

test('a new form is titled "New commute" and has a labelled field for every value', () => {
  stubApi({})

  renderWithQuery(<CommuteForm onSaved={() => {}} onCancel={() => {}} />)

  expect(screen.getByRole('heading', { name: 'New commute' })).toBeTruthy()
  expect(screen.getByLabelText('Name')).toBeTruthy()
  expect(screen.getByLabelText('Stop name')).toBeTruthy()
  expect(screen.getByLabelText('Line (optional)')).toBeTruthy()
  expect(screen.getByLabelText('Walk to the stop, minutes')).toBeTruthy()
})

test('saving an empty form shows what is missing and sends nothing', async () => {
  const fetchMock = stubApi({})
  renderWithQuery(<CommuteForm onSaved={() => {}} onCancel={() => {}} />)

  await userEvent.click(screen.getByRole('button', { name: 'Save commute' }))

  expect(screen.getByText('Enter a name')).toBeTruthy()
  expect(screen.getByText('Pick a stop from the list')).toBeTruthy()
  expect(screen.getByLabelText('Name').getAttribute('aria-invalid')).toBe('true')
  expect(fetchMock).not.toHaveBeenCalled()
})

test('a wrong walking time is explained next to its field', async () => {
  stubApi({})
  renderWithQuery(<CommuteForm onSaved={() => {}} onCancel={() => {}} />)
  const walk = screen.getByLabelText('Walk to the stop, minutes')

  await userEvent.clear(walk)
  await userEvent.type(walk, '75')
  await userEvent.click(screen.getByRole('button', { name: 'Save commute' }))

  expect(screen.getByText('Enter a walk between 0 and 60 minutes')).toBeTruthy()
  expect(walk.getAttribute('aria-invalid')).toBe('true')
})

test('picking a stop names it under the search', async () => {
  stubApi({ '/api/stops?query=': jsonResponse([STOP]) })
  renderWithQuery(<CommuteForm onSaved={() => {}} onCancel={() => {}} />)

  await pickStop()

  expect(screen.getByText('Selected: Brama Wyżynna 01')).toBeTruthy()
})

test('a valid form is posted to the API and the saved commute is reported', async () => {
  const fetchMock = stubApi({
    '/api/stops?query=': jsonResponse([STOP]),
    '/api/commutes': jsonResponse(WORK_COMMUTE, 201),
  })
  const onSaved = vi.fn()
  renderWithQuery(<CommuteForm onSaved={onSaved} onCancel={() => {}} />)

  await userEvent.type(screen.getByLabelText('Name'), 'Morning to work')
  await pickStop()
  await userEvent.type(screen.getByLabelText('Line (optional)'), '6')
  await userEvent.click(screen.getByRole('button', { name: 'Save commute' }))

  await vi.waitFor(() => expect(onSaved).toHaveBeenCalledWith(WORK_COMMUTE))
  const [url, options] = savedRequest(fetchMock)!
  expect(url).toMatch(/\/api\/commutes$/)
  expect((options as RequestInit).method).toBe('POST')
  expect(JSON.parse((options as RequestInit).body as string)).toEqual({
    name: 'Morning to work',
    stopId: 1028,
    routeShortName: '6',
    walkMinutes: 5,
  })
})

test('editing starts from the commute, keeps its stop and replaces it with PUT', async () => {
  const renamed = { ...WORK_COMMUTE, name: 'Evening to work' }
  const fetchMock = stubApi({ '/api/commutes/': jsonResponse(renamed) })
  const onSaved = vi.fn()
  renderWithQuery(<CommuteForm commute={WORK_COMMUTE} onSaved={onSaved} onCancel={() => {}} />)
  expect(screen.getByRole('heading', { name: 'Edit commute' })).toBeTruthy()
  const name = screen.getByLabelText('Name') as HTMLInputElement
  expect(name.value).toBe('Morning to work')
  expect(screen.getByText('Keeps stop number 1028 unless you pick another')).toBeTruthy()

  await userEvent.clear(name)
  await userEvent.type(name, 'Evening to work')
  await userEvent.click(screen.getByRole('button', { name: 'Save commute' }))

  await vi.waitFor(() => expect(onSaved).toHaveBeenCalledWith(renamed))
  const [url, options] = savedRequest(fetchMock)!
  expect(url).toMatch(new RegExp(`/api/commutes/${WORK_ID}$`))
  expect((options as RequestInit).method).toBe('PUT')
  expect(JSON.parse((options as RequestInit).body as string)).toEqual({
    name: 'Evening to work',
    stopId: 1028,
    routeShortName: '6',
    walkMinutes: 5,
  })
})

test('says so when the API cannot save the commute, and does not report success', async () => {
  stubApi({ '/api/commutes/': jsonResponse(null, 500) })
  const onSaved = vi.fn()
  renderWithQuery(<CommuteForm commute={WORK_COMMUTE} onSaved={onSaved} onCancel={() => {}} />)

  await userEvent.click(screen.getByRole('button', { name: 'Save commute' }))

  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toBe('The commute could not be saved. Try again in a moment.')
  expect(onSaved).not.toHaveBeenCalled()
})

test('Cancel reports back without saving', async () => {
  const fetchMock = stubApi({})
  const onCancel = vi.fn()
  renderWithQuery(<CommuteForm onSaved={() => {}} onCancel={onCancel} />)

  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

  expect(onCancel).toHaveBeenCalled()
  expect(fetchMock).not.toHaveBeenCalled()
})
