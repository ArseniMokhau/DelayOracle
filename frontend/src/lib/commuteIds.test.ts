import { beforeEach, expect, test } from 'vitest'
import { addCommuteIds, isCommuteId, loadCommuteIds, removeCommuteId, saveCommuteIds } from './commuteIds'

// Synthetic ids, only for these tests.
const FIRST = 'c0ffee00-0000-4000-8000-000000000001'
const SECOND = 'c0ffee00-0000-4000-8000-000000000002'
const THIRD = 'c0ffee00-0000-4000-8000-000000000003'
const STORAGE_KEY = 'delayoracle.commuteIds'

beforeEach(() => {
  localStorage.clear()
})

test('isCommuteId accepts a GUID in either letter case', () => {
  expect(isCommuteId(FIRST)).toBe(true)
  expect(isCommuteId(FIRST.toUpperCase())).toBe(true)
})

test.each(['', '42', 'not-a-guid', `${FIRST}x`, ` ${FIRST}`])('isCommuteId rejects "%s"', (text) => {
  expect(isCommuteId(text)).toBe(false)
})

test('loadCommuteIds returns an empty list when nothing was saved', () => {
  expect(loadCommuteIds()).toEqual([])
})

test('saved ids come back in the same order', () => {
  saveCommuteIds([SECOND, FIRST])

  expect(loadCommuteIds()).toEqual([SECOND, FIRST])
})

test('loadCommuteIds ignores stored text that is not JSON', () => {
  localStorage.setItem(STORAGE_KEY, 'this is not json')

  expect(loadCommuteIds()).toEqual([])
})

test('loadCommuteIds ignores stored JSON that is not a list', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ids: [FIRST] }))

  expect(loadCommuteIds()).toEqual([])
})

test('loadCommuteIds drops entries that are not commute ids', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([FIRST, 42, 'junk', null, SECOND]))

  expect(loadCommuteIds()).toEqual([FIRST, SECOND])
})

test('addCommuteIds appends new ids and skips ones already in the list', () => {
  expect(addCommuteIds([FIRST], [SECOND, FIRST, THIRD, SECOND])).toEqual([FIRST, SECOND, THIRD])
})

test('addCommuteIds does not change the list it was given', () => {
  const current = [FIRST]

  addCommuteIds(current, [SECOND])

  expect(current).toEqual([FIRST])
})

test('removeCommuteId removes only that id', () => {
  expect(removeCommuteId([FIRST, SECOND, THIRD], SECOND)).toEqual([FIRST, THIRD])
})

test('removeCommuteId leaves the list as it is when the id is not in it', () => {
  expect(removeCommuteId([FIRST], SECOND)).toEqual([FIRST])
})
