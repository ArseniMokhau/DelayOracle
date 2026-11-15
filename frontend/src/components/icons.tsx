import type { ReactNode } from 'react'

// Small line icons. They are decoration next to a label or inside a button that has
// an aria-label, so all of them are hidden from screen readers.
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export function EditIcon() {
  return (
    <Icon>
      <path d="M13.5 3.5l3 3L7 16H4v-3z" />
    </Icon>
  )
}

export function TrashIcon() {
  return (
    <Icon>
      <path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" />
    </Icon>
  )
}

export function LinkIcon() {
  return (
    <Icon>
      <path d="M8.5 11.5a3 3 0 0 0 4.2 0l3-3a3 3 0 0 0-4.2-4.2l-1 1" />
      <path d="M11.5 8.5a3 3 0 0 0-4.2 0l-3 3a3 3 0 0 0 4.2 4.2l1-1" />
    </Icon>
  )
}
