import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import { GYM_ID, WORK_ID } from '../test/fixtures'
import ShareButton from './ShareButton'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// What the link for these two commutes looks like on the page the test runs on.
function expectedLink() {
  return `${window.location.origin}${window.location.pathname}#commutes=${WORK_ID},${GYM_ID}`
}

test('copies a link with every commute id and confirms it', async () => {
  // userEvent gives the test page a working clipboard.
  const user = userEvent.setup()
  render(<ShareButton ids={[WORK_ID, GYM_ID]} />)

  await user.click(screen.getByRole('button', { name: 'Copy link' }))

  expect(await screen.findByText('Link copied. Open it on another device to add these commutes.')).toBeTruthy()
  expect(await navigator.clipboard.readText()).toBe(expectedLink())
})

test('shows the link to copy by hand when the browser refuses to copy', async () => {
  const user = userEvent.setup()
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('not allowed'))
  render(<ShareButton ids={[WORK_ID, GYM_ID]} />)

  await user.click(screen.getByRole('button', { name: 'Copy link' }))

  const field = (await screen.findByLabelText('Copy this link by hand')) as HTMLInputElement
  expect(field.value).toBe(expectedLink())
  expect(field.readOnly).toBe(true)
  expect(screen.queryByText(/Link copied/)).toBeNull()
})
