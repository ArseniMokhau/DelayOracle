import { isCommuteId } from './commuteIds'

// A share link carries commute ids after the # of the page address:
// https://…/#commutes=<id>,<id>. Opening it on another device adds those commutes there.

const HASH_PREFIX = '#commutes='

export function buildShareLink(ids: string[], pageUrl: string): string {
  const url = new URL(pageUrl)
  url.hash = `commutes=${ids.join(',')}`
  return url.toString()
}

// Reads the ids out of location.hash. Anything that is not a share link gives an empty list.
export function readSharedIds(hash: string): string[] {
  if (!hash.startsWith(HASH_PREFIX)) {
    return []
  }
  const ids = hash.slice(HASH_PREFIX.length).split(',').filter(isCommuteId)
  return [...new Set(ids)]
}
