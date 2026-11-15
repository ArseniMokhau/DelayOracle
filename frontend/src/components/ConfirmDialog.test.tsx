import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import ConfirmDialog from './ConfirmDialog'

afterEach(() => {
  cleanup()
})

function renderDialog(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <ConfirmDialog
      title="Delete “Gym”?"
      text="This cannot be undone."
      confirmLabel="Delete commute"
      cancelLabel="Keep it"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  )
  return { onConfirm, onCancel }
}

test('is an alert dialog named by its title and described by its text', () => {
  renderDialog()

  const dialog = screen.getByRole('alertdialog', { name: 'Delete “Gym”?' })
  expect(dialog.getAttribute('aria-modal')).toBe('true')
  expect(dialog.textContent).toContain('This cannot be undone.')
})

test('starts with the focus on the safe choice', () => {
  renderDialog()

  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Keep it' }))
})

test('the confirm button confirms', async () => {
  const { onConfirm, onCancel } = renderDialog()

  await userEvent.click(screen.getByRole('button', { name: 'Delete commute' }))

  expect(onConfirm).toHaveBeenCalledOnce()
  expect(onCancel).not.toHaveBeenCalled()
})

test('the cancel button cancels', async () => {
  const { onConfirm, onCancel } = renderDialog()

  await userEvent.click(screen.getByRole('button', { name: 'Keep it' }))

  expect(onCancel).toHaveBeenCalledOnce()
  expect(onConfirm).not.toHaveBeenCalled()
})

test('the Escape key cancels', async () => {
  const { onCancel } = renderDialog()

  await userEvent.keyboard('{Escape}')

  expect(onCancel).toHaveBeenCalledOnce()
})

test('while busy, the confirm button cannot be pressed again', () => {
  renderDialog({ busy: true })

  const confirm = screen.getByRole('button', { name: 'Delete commute' }) as HTMLButtonElement
  expect(confirm.disabled).toBe(true)
})

test('shows an error when it is given one', () => {
  renderDialog({ errorText: 'The commute could not be deleted.' })

  expect(screen.getByRole('alert').textContent).toBe('The commute could not be deleted.')
})
