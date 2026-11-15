import { expect, test } from 'vitest'
import { LEAVE_IN_SIX, NO_DEPARTURE } from '../test/fixtures'
import { adviceHeadline, describeDelay, formatTime, sourceLabel } from './format'

test('formatTime shows a UTC time as Gdańsk clock time in winter', () => {
  // In November Gdańsk is one hour ahead of UTC.
  expect(formatTime('2026-11-14T17:21:00Z')).toBe('18:21')
})

test('formatTime shows a UTC time as Gdańsk clock time in summer', () => {
  // In July Gdańsk is two hours ahead of UTC.
  expect(formatTime('2026-07-01T05:05:00Z')).toBe('07:05')
})

test('describeDelay says "No live data" when there is no delay value', () => {
  expect(describeDelay(null)).toEqual({ text: 'No live data', tone: 'none' })
})

test.each([0, 29, -29])('describeDelay treats %i seconds as on time', (seconds) => {
  expect(describeDelay(seconds)).toEqual({ text: 'On time', tone: 'onTime' })
})

test.each([
  [31, '1 min late'],
  [70, '1 min late'],
  [170, '3 min late'],
  [1500, '25 min late'],
])('describeDelay rounds %i seconds to "%s"', (seconds, text) => {
  expect(describeDelay(seconds)).toEqual({ text, tone: 'late' })
})

test.each([
  [-31, '1 min early'],
  [-100, '2 min early'],
])('describeDelay rounds %i seconds to "%s"', (seconds, text) => {
  expect(describeDelay(seconds)).toEqual({ text, tone: 'early' })
})

test('sourceLabel names where a prediction came from', () => {
  expect(sourceLabel('model')).toBe('Model')
  expect(sourceLabel('fallback')).toBe('ZTM live')
  expect(sourceLabel('schedule')).toBe('Timetable')
})

test.each([
  [6, 'Leave in 6 minutes'],
  [1, 'Leave in 1 minute'],
  [0, 'Leave now'],
])('adviceHeadline says "%s" minutes as "%s"', (leaveInMinutes, headline) => {
  expect(adviceHeadline({ ...LEAVE_IN_SIX, leaveInMinutes })).toBe(headline)
})

test('adviceHeadline says "No departure" when nothing can be caught', () => {
  expect(adviceHeadline(NO_DEPARTURE)).toBe('No departure')
})
