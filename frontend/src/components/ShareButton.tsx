import { useState } from 'react'
import { buildShareLink } from '../lib/shareLink'
import { LinkIcon } from './icons'

interface ShareButtonProps {
  ids: string[]
}

type ShareState = 'idle' | 'copied' | 'failed'

// Copies a link that carries this browser's commute ids, to open on another device.
function ShareButton({ ids }: ShareButtonProps) {
  const [state, setState] = useState<ShareState>('idle')
  const link = buildShareLink(ids, window.location.href)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      setState('copied')
    } catch {
      // Copying is refused on pages without HTTPS and when the user denies it.
      setState('failed')
    }
  }

  return (
    <div className="share">
      {state === 'copied' && (
        <p className="share-status" role="status">
          Link copied. Open it on another device to add these commutes.
        </p>
      )}
      <button type="button" className="button button-secondary share-button" onClick={copyLink}>
        <LinkIcon />
        Copy link
      </button>
      {state === 'failed' && (
        <div className="share-fallback">
          <label htmlFor="share-link" className="field-label">
            Copy this link by hand
          </label>
          <input
            id="share-link"
            className="input"
            readOnly
            value={link}
            onFocus={(event) => event.target.select()}
          />
        </div>
      )}
    </div>
  )
}

export default ShareButton
