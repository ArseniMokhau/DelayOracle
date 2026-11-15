import { expect, test } from 'vitest'
import { buildShareLink, readSharedIds } from './shareLink'

// Synthetic ids, only for these tests.
const FIRST = 'c0ffee00-0000-4000-8000-000000000001'
const SECOND = 'c0ffee00-0000-4000-8000-000000000002'

test('buildShareLink puts the ids after the # of the page address', () => {
  const link = buildShareLink([FIRST, SECOND], 'https://example.github.io/DelayOracle/')

  expect(link).toBe(`https://example.github.io/DelayOracle/#commutes=${FIRST},${SECOND}`)
})

test('buildShareLink replaces a # part the address already has', () => {
  const link = buildShareLink([FIRST], 'http://localhost:5173/#commutes=old')

  expect(link).toBe(`http://localhost:5173/#commutes=${FIRST}`)
})

test('readSharedIds reads the ids back from a link made by buildShareLink', () => {
  const link = buildShareLink([FIRST, SECOND], 'http://localhost:5173/')
  const hash = new URL(link).hash

  expect(readSharedIds(hash)).toEqual([FIRST, SECOND])
})

test.each(['', '#', '#commutes=', '#something-else', '#other=1'])(
  'readSharedIds finds nothing in "%s"',
  (hash) => {
    expect(readSharedIds(hash)).toEqual([])
  },
)

test('readSharedIds keeps only real commute ids and drops repeats', () => {
  const hash = `#commutes=${FIRST},junk,,${SECOND},${FIRST}`

  expect(readSharedIds(hash)).toEqual([FIRST, SECOND])
})
