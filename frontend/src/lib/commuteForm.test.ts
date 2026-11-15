import { expect, test } from 'vitest'
import { LATE_TRAM, TIMETABLE_BUS, WORK_COMMUTE } from '../test/fixtures'
import {
  type CommuteFormValues,
  emptyCommuteForm,
  formValuesOf,
  linesAt,
  toCommuteInput,
  validateCommuteForm,
} from './commuteForm'

const VALID: CommuteFormValues = {
  name: 'Home to work',
  stopId: 1028,
  routeShortName: '154',
  walkMinutes: '5',
}

test('a valid form has no errors', () => {
  expect(validateCommuteForm(VALID)).toEqual({})
})

test('the empty form asks for a name and a stop, and starts with a walk of 5 minutes', () => {
  expect(emptyCommuteForm.walkMinutes).toBe('5')
  expect(validateCommuteForm(emptyCommuteForm)).toEqual({
    name: 'Enter a name',
    stopId: 'Pick a stop from the list',
  })
})

test.each(['', '   '])('a name of "%s" is missing', (name) => {
  expect(validateCommuteForm({ ...VALID, name }).name).toBe('Enter a name')
})

test('a name may be 60 characters long but not 61', () => {
  expect(validateCommuteForm({ ...VALID, name: 'x'.repeat(60) })).toEqual({})
  expect(validateCommuteForm({ ...VALID, name: 'x'.repeat(61) }).name).toBe('Use at most 60 characters')
})

test('the line is optional', () => {
  expect(validateCommuteForm({ ...VALID, routeShortName: '' })).toEqual({})
})

test('a line may be 8 characters long but not 9', () => {
  expect(validateCommuteForm({ ...VALID, routeShortName: '12345678' })).toEqual({})
  expect(validateCommuteForm({ ...VALID, routeShortName: '123456789' }).routeShortName).toBe(
    'Use at most 8 characters',
  )
})

test.each(['0', '60', ' 12 '])('a walk of "%s" minutes is accepted', (walkMinutes) => {
  expect(validateCommuteForm({ ...VALID, walkMinutes })).toEqual({})
})

test.each(['', '-1', '61', '5.5', 'ten', '1e1'])('a walk of "%s" minutes is rejected', (walkMinutes) => {
  expect(validateCommuteForm({ ...VALID, walkMinutes }).walkMinutes).toBe(
    'Enter a walk between 0 and 60 minutes',
  )
})

test('toCommuteInput trims the texts and turns the walk into a number', () => {
  const input = toCommuteInput({ name: '  Home to work ', stopId: 1028, routeShortName: ' 154 ', walkMinutes: ' 5 ' })

  expect(input).toEqual({ name: 'Home to work', stopId: 1028, routeShortName: '154', walkMinutes: 5 })
})

test('toCommuteInput sends an empty line as null, which means any line', () => {
  expect(toCommuteInput({ ...VALID, routeShortName: '  ' }).routeShortName).toBeNull()
})

test('formValuesOf fills the form from an existing commute', () => {
  expect(formValuesOf(WORK_COMMUTE)).toEqual({
    name: 'Morning to work',
    stopId: 1028,
    routeShortName: '6',
    walkMinutes: '5',
  })
  expect(formValuesOf({ ...WORK_COMMUTE, routeShortName: null }).routeShortName).toBe('')
})

test('linesAt lists each line once, numbers in counting order and letters after them', () => {
  const departures = [
    { ...LATE_TRAM, route: 'N1' },
    { ...LATE_TRAM, route: '154' },
    TIMETABLE_BUS,
    LATE_TRAM,
    { ...TIMETABLE_BUS, route: '6' },
  ]

  expect(linesAt(departures)).toEqual(['6', '111', '154', 'N1'])
})

test('linesAt gives an empty list when nothing departs', () => {
  expect(linesAt([])).toEqual([])
})
