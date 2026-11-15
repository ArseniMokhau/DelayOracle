import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import { deleteCommute, fetchCommutes } from '../api/commutes'
import type { Commute } from '../api/types'
import CommuteForm from '../components/CommuteForm'
import CommuteTile from '../components/CommuteTile'
import ConfirmDialog from '../components/ConfirmDialog'
import ShareButton from '../components/ShareButton'
import StateTile from '../components/StateTile'
import { useCommuteIds } from '../lib/useCommuteIds'

// Deletes a commute. One that is already gone on the server counts as deleted.
async function deleteIfPresent(commute: Commute): Promise<void> {
  try {
    await deleteCommute(commute.id)
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      throw error
    }
  }
}

// The "My commutes" tab: this browser's saved commutes, each with its live answer.
function CommutesPage() {
  const queryClient = useQueryClient()
  const { ids, importedCount, addId, forgetIds } = useCommuteIds()
  // True while the form for a new commute is open in place of the list.
  const [isAdding, setIsAdding] = useState(false)
  // The commute open in the edit form, and the one the delete dialog asks about.
  const [editing, setEditing] = useState<Commute | null>(null)
  const [deleting, setDeleting] = useState<Commute | null>(null)

  const commutes = useQuery({
    queryKey: ['commutes', ids],
    queryFn: () => fetchCommutes(ids),
    enabled: ids.length > 0,
  })

  const remove = useMutation({
    mutationFn: deleteIfPresent,
    onSuccess: (_nothing, commute) => {
      forgetIds([commute.id])
      setDeleting(null)
    },
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

  function handleSaved(commute: Commute) {
    // A new id changes the query key above, so the list reloads with the new commute in it.
    addId(commute.id)
    setIsAdding(false)
  }

  function handleEdited(commute: Commute) {
    // The ids did not change, so the cached list and advice have to be marked as out of date.
    queryClient.invalidateQueries({ queryKey: ['commutes'] })
    queryClient.invalidateQueries({ queryKey: ['advice', commute.id] })
    setEditing(null)
  }

  function askToDelete(commute: Commute) {
    // Clears the error of an earlier failed attempt.
    remove.reset()
    setDeleting(commute)
  }

  if (isAdding || editing) {
    return (
      <main className="page">
        <h1 className="visually-hidden">My commutes</h1>
        {editing ? (
          <CommuteForm commute={editing} onSaved={handleEdited} onCancel={() => setEditing(null)} />
        ) : (
          <CommuteForm onSaved={handleSaved} onCancel={() => setIsAdding(false)} />
        )}
      </main>
    )
  }

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
          actionLabel="Add your first commute"
          onAction={() => setIsAdding(true)}
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
        <>
          <ShareButton ids={ids} />
          <div className="commute-grid">
            {commutes.data.map((commute, index) => (
              <CommuteTile
                key={commute.id}
                commute={commute}
                featured={index === 0}
                onEdit={() => setEditing(commute)}
                onDelete={() => askToDelete(commute)}
              />
            ))}
            <button type="button" className="commute-add" onClick={() => setIsAdding(true)}>
              + New commute
            </button>
          </div>
        </>
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete “${deleting.name}”?`}
          text="It also disappears on every device you shared it with. This cannot be undone."
          confirmLabel="Delete commute"
          cancelLabel="Keep it"
          busy={remove.isPending}
          errorText={remove.isError ? 'The commute could not be deleted. Try again in a moment.' : undefined}
          onConfirm={() => remove.mutate(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </main>
  )
}

export default CommutesPage