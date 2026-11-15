import { describeDelay } from '../lib/format'

interface DelayBadgeProps {
  delaySeconds: number | null
}

// The delay in words. The colour repeats the words, it never replaces them.
function DelayBadge({ delaySeconds }: DelayBadgeProps) {
  const delay = describeDelay(delaySeconds)

  return <span className={`badge badge-${delay.tone}`}>{delay.text}</span>
}

export default DelayBadge
