import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import type { Stop } from '../api/types'
import { jsonResponse, renderWithQuery } from '../test/renderWithQuery'
import StopSearch from './StopSearch'

// Synthetic stops, only for these tests.
const PLATFORM_1: Stop = { id: 1028, name: 'Brama Wyżynna', code: '01', zone: 'Gdańsk' }
const PLATFORM_2: Stop = { id: 1029, name: 'Brama Wyżynna', code: '02', zone: 'Gdańsk' }
const NO_CODE: Stop = { id: 2000, name: 'Brama Oliwska', code: null, zone: 'Gdańsk' }

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function stubFetch(response: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function typeInSearch(text: string) {
  return userEvent.type(screen.getByLabelText('Stop name'), text)
}

test('asks for at least two letters before anything is typed', () => {
  const fetchMock = stubFetch(jsonResponse([]))

  renderWithQuery(<StopSearch selectedStop={null} onSelect={() => {}} />)

  expect(screen.getByText('Type at least two letters')).toBeTruthy()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('searches once after typing stops and shows a button per stop', async () => {
  const fetchMock = stubFetch(jsonResponse([PLATFORM_1, PLATFORM_2, NO_CODE]))
  renderWithQuery(<StopSearch selectedStop={null} onSelect={() => {}} />)

  await typeInSearch('brama')

  expect(await screen.findByRole('button', { name: 'Brama Wyżynna 01' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Brama Wyżynna 02' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Brama Oliwska' })).toBeTruthy()
  // Five letters were typed, but only the finished word was sent.
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/stops\?query=brama$/)
})

test('encodes spaces and Polish letters in the address', async () => {
  const fetchMock = stubFetch(jsonResponse([PLATFORM_1]))
  renderWithQuery(<StopSearch selectedStop={null} onSelect={() => {}} />)

  await typeInSearch('brama wyż')

  await screen.findByRole('button', { name: 'Brama Wyżynna 01' })
  expect(fetchMock.mock.calls[0][0]).toMatch(/query=brama%20wy%C5%BC$/)
})

test('does not search for a single letter', async () => {
  const fetchMock = stubFetch(jsonResponse([]))
  renderWithQuery(<StopSearch selectedStop={null} onSelect={() => {}} />)

  await typeInSearch('b')
  // Longer than the typing pause, so a search would have started by now.
  await new Promise((resolve) => setTimeout(resolve, 450))

  expect(fetchMock).not.toHaveBeenCalled()
  expect(screen.getByText('Type at least two letters')).toBeTruthy()
})

test('clicking a stop reports it to the parent', async () => {
  stubFetch(jsonResponse([PLATFORM_1, PLATFORM_2]))
  const onSelect = vi.fn()
  renderWithQuery(<StopSearch selectedStop={null} onSelect={onSelect} />)
  await typeInSearch('brama')

  await userEvent.click(await screen.findByRole('button', { name: 'Brama Wyżynna 02' }))

  expect(onSelect).toHaveBeenCalledWith(PLATFORM_2)
})

test('marks the selected stop as pressed', async () => {
  stubFetch(jsonResponse([PLATFORM_1, PLATFORM_2]))
  renderWithQuery(<StopSearch selectedStop={PLATFORM_2} onSelect={() => {}} />)

  await typeInSearch('brama')

  const selected = await screen.findByRole('button', { name: 'Brama Wyżynna 02' })
  expect(selected.getAttribute('aria-pressed')).toBe('true')
  const other = screen.getByRole('button', { name: 'Brama Wyżynna 01' })
  expect(other.getAttribute('aria-pressed')).toBe('false')
})

test('says so when no stop matches', async () => {
  stubFetch(jsonResponse([]))
  renderWithQuery(<StopSearch selectedStop={null} onSelect={() => {}} />)

  await typeInSearch('zzz')

  expect(await screen.findByText('No stop matches “zzz”')).toBeTruthy()
})

test('shows an error when the stops cannot be loaded', async () => {
  stubFetch(jsonResponse(null, 503))
  renderWithQuery(<StopSearch selectedStop={null} onSelect={() => {}} />)

  await typeInSearch('brama')

  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toBe('Stops could not be loaded. Try again in a moment.')
})

test('keeps the previous stops on screen while the next search is loading', async () => {
  // The first search answers; the second one never does.
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(jsonResponse([PLATFORM_1]))
    .mockReturnValue(new Promise(() => {}))
  vi.stubGlobal('fetch', fetchMock)
  renderWithQuery(<StopSearch selectedStop={null} onSelect={() => {}} />)
  await typeInSearch('bra')
  await screen.findByRole('button', { name: 'Brama Wyżynna 01' })

  await typeInSearch('ma')
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

  expect(screen.getByRole('button', { name: 'Brama Wyżynna 01' })).toBeTruthy()
  expect(screen.queryByText('Searching…')).toBeNull()
})

test('starts from the text it is given and reports every change of it', async () => {
  stubFetch(jsonResponse([PLATFORM_1]))
  const onTextChange = vi.fn()
  renderWithQuery(
    <StopSearch selectedStop={null} onSelect={() => {}} initialText="brama" onTextChange={onTextChange} />,
  )
  const field = screen.getByLabelText('Stop name') as HTMLInputElement
  expect(field.value).toBe('brama')
  // The given text is searched for without any typing.
  await screen.findByRole('button', { name: 'Brama Wyżynna 01' })

  await typeInSearch(' w')

  expect(onTextChange).toHaveBeenLastCalledWith('brama w')
})
