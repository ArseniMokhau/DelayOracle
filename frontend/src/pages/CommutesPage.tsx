import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { fetchCommutes } from '../api/commutes'
import CommuteTile from '../components/CommuteTile'
import StateTile from '../components/StateTile'
import { useCommuteIds } from '../lib/useCommuteIds'

// The "My commutes" tab: this browser's saved commutes, each with its live answer.
function CommutesPage() {
  const { ids, importedCount, forgetIds } = useCommuteIds()

  const commutes = useQuery({
    queryKey: ['commutes', ids],
    queryFn: () => fetchCommutes(ids),
    enabled: ids.length > 0,
  })

  // The API leaves out commutes that no longer exist (deleted on another device).
  // Their ids are dropped here, so the list does not keep asking for them.
  useEffect(() => {
    if (!commutes.data) {
      return
    }
    const known = commutes.data.map((commute) => commute.id)
    const gone = ids.filter((id) => !known.includes(id))
    if (gone.length > 0) {
      forgetIds(gone)
    }
  }, [commutes.data, ids, forgetIds])

  return (
    <main className="page">
      <h1 className="visually-hidden">My commutes</h1>

      {importedCount > 0 && (
        <p className="notice" role="status">
          {`${importedCount} ${importedCount === 1 ? 'commute' : 'commutes'} added from the link`}
        </p>
      )}

      {ids.length === 0 && (
        <StateTile
          tone="empty"
          title="No commutes yet"
          text="Add the trip you make most often and you will see when to leave, every time you open the app."
        />
      )}

      {ids.length > 0 && commutes.isPending && (
        <div className="skeleton-list" role="status">
          <span className="visually-hidden">Loading your commutes…</span>
          <div className="skeleton" aria-hidden="true" />
          <div className="skeleton" aria-hidden="true" />
        </div>
      )}

      {commutes.isError && (
        <StateTile
          tone="error"
          title="Your commutes could not be loaded"
          text="The server did not answer. Your commutes are still saved."
          actionLabel="Try again"
          onAction={() => commutes.refetch()}
        />
      )}

      {commutes.data && commutes.data.length > 0 && (
        <div className="commute-grid">
          {commutes.data.map((commute, index) => (
            <CommuteTile key={commute.id} commute={commute} featured={index === 0} />
          ))}
        </div>
      )}
    </main>
  )
}

export default CommutesPage
