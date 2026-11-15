import type { KeyboardEvent } from 'react'

interface ConfirmDialogProps {
  title: string
  text: string
  confirmLabel: string
  cancelLabel: string
  // True while the confirmed action is running.
  busy?: boolean
  // Shown when the confirmed action failed.
  errorText?: string
  onConfirm: () => void
  onCancel: () => void
}

// Asks "are you sure?" before something that cannot be undone.
function ConfirmDialog({
  title,
  text,
  confirmLabel,
  cancelLabel,
  busy = false,
  errorText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="dialog-backdrop">
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-text"
        onKeyDown={handleKeyDown}
      >
        <h2 id="dialog-title" className="dialog-title">
          {title}
        </h2>
        <p id="dialog-text" className="dialog-text">
          {text}
        </p>
        {errorText && (
          <p className="field-error" role="alert">
            {errorText}
          </p>
        )}
        <div className="dialog-actions">
          {/* The safe choice gets the focus, so pressing Enter by reflex deletes nothing. */}
          <button type="button" className="button button-secondary" onClick={onCancel} autoFocus>
            {cancelLabel}
          </button>
          <button type="button" className="button button-danger" onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
