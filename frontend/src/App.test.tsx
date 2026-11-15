import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
})

test('shows the brand and both tabs', () => {
  render(<App />)

  expect(screen.getByText('DelayOracle')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Departures' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'My commutes' })).toBeTruthy()
})

test('starts on the My commutes tab', () => {
  render(<App />)

  expect(screen.getByRole('heading', { level: 1, name: 'My commutes' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'My commutes' }).getAttribute('aria-current')).toBe('page')
  expect(screen.getByRole('button', { name: 'Departures' }).getAttribute('aria-current')).toBeNull()
})

test('clicking the Departures tab shows the departures screen', async () => {
  render(<App />)

  await userEvent.click(screen.getByRole('button', { name: 'Departures' }))

  expect(screen.getByRole('heading', { level: 1, name: 'Departures' })).toBeTruthy()
  expect(screen.queryByRole('heading', { level: 1, name: 'My commutes' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Departures' }).getAttribute('aria-current')).toBe('page')
})
