import type { HTMLAttributes } from 'react'

/** Cartão kraft com contorno verde. */
export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-card border border-primary rounded-card p-4 ${className}`} {...props} />
}
