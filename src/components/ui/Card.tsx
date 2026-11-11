import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`rounded-card border border-white/10 bg-white/5 backdrop-blur-md ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
