// The logo: a clock face on a violet tile. Decorative, so it is hidden from screen readers.
function BrandMark() {
  return (
    <svg aria-hidden="true" width="40" height="40" viewBox="0 0 40 40">
      <rect width="40" height="40" rx="12" fill="var(--brand)" />
      <circle cx="20" cy="20" r="10" fill="none" stroke="var(--mint)" strokeWidth="4" />
      <path
        d="M20 14v6l4 3"
        fill="none"
        stroke="var(--on-brand)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default BrandMark
