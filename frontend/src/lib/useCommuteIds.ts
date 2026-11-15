import { useCallback, useEffect, useState } from 'react'
import { addCommuteIds, loadCommuteIds, saveCommuteIds } from './commuteIds'
import { readSharedIds } from './shareLink'

interface StartingIds {
  ids: string[]
  // How many of them came from a share link and were not saved here before.
  importedCount: number
}

// The saved ids, plus any that arrived in the address as a share link.
function readStartingIds(): StartingIds {
  const saved = loadCommuteIds()
  const ids = addCommuteIds(saved, readSharedIds(window.location.hash))
  return { ids, importedCount: ids.length - saved.length }
}

// This browser's list of commute ids. Every change is written to localStorage.
export function useCommuteIds() {
  const [start] = useState(readStartingIds)
  const [ids, setIds] = useState(start.ids)

  useEffect(() => {
    saveCommuteIds(ids)
  }, [ids])

  // Once the ids from a share link are taken over, remove them from the address,
  // so reloading or bookmarking the page does not import them again.
  useEffect(() => {
    if (window.location.hash.startsWith('#commutes=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])

  const addId = useCallback((id: string) => {
    setIds((current) => addCommuteIds(current, [id]))
  }, [])

  const forgetIds = useCallback((gone: string[]) => {
    setIds((current) => current.filter((id) => !gone.includes(id)))
  }, [])

  return { ids, importedCount: start.importedCount, addId, forgetIds }
}
