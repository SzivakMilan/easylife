import type { ReactElement } from 'react'

type IconProps = { className?: string }

export function GearIcon({ className }: IconProps = {}) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z" />
    </svg>
  )
}

export function SearchIcon({ className }: IconProps = {}) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

export const SECTION_ICONS: Record<string, (props: IconProps) => ReactElement> = {
  home: (p) => (
    <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  ),
  flag: (p) => (
    <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 3v18" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </svg>
  ),
  calendar: (p) => (
    <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  wallet: (p) => (
    <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 10h18" />
      <circle cx="16" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  receipt: (p) => (
    <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 3h14v18l-2.5-1.5L14 21l-2.5-1.5L9 21l-2.5-1.5L4 21Z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  ),
  users: (p) => (
    <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="18" cy="9" r="2.4" />
      <path d="M15.8 13.2A5.3 5.3 0 0 1 21.5 18" />
    </svg>
  ),
  settings: (p) => <GearIcon {...p} />,
  bolt: (p) => (
    <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  ),
  cart: (p) => (
    <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20.4 8H6" />
      <circle cx="9.5" cy="20.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="20.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  ),
  car: (p) => (
    <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3.5 16V12l2-5h13l2 5v4" />
      <path d="M3.5 16h17M6 16v2.5M18 16v2.5" />
      <circle cx="7.5" cy="16" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="16" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  ),
  baby: (p) => (
    <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21c0-4 3-6 7-6s7 2 7 6" />
    </svg>
  ),
  heart: (p) => (
    <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20.3 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9a4.6 4.6 0 0 1 6.5 6.5Z" />
    </svg>
  ),
  droplet: (p) => (
    <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3.5s6.5 7.1 6.5 11.3a6.5 6.5 0 0 1-13 0C5.5 10.6 12 3.5 12 3.5Z" />
    </svg>
  ),
  utensils: (p) => (
    <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 3v7a2 2 0 1 1-4 0V3M5 10v11M9 3v6a1.5 1.5 0 0 0 3 0V3M10.5 11v10" />
      <path d="M19 3c-2.2 0-4 2.2-4 6s1.8 3.5 4 3.5V3Zm0 9.5V21" />
    </svg>
  ),
  scale: (p) => (
    <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 9v3l2.2 2.2" />
    </svg>
  ),
  newspaper: (p) => (
    <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5h13a3 3 0 0 1 3 3v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" />
      <path d="M4 5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2M8 9h7M8 13h7M8 17h4" />
    </svg>
  ),
  ticket: (p) => (
    <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 8 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-8Z" />
      <path d="M10 6v12" strokeDasharray="2 2" />
    </svg>
  ),
}

export function SectionIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = SECTION_ICONS[icon] ?? SECTION_ICONS.home
  return <Icon className={className} />
}
