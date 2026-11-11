import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  children: ReactNode
}

export function Pill({ icon, children, className = '', ...rest }: PillProps) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-pill border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-colors active:bg-white/20 ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
