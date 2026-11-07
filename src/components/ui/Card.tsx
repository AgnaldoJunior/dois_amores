import type { HTMLAttributes } from 'react'

/** Cartão de papel com fio claro e cantos arredondados. */
export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-card border border-line rounded-card p-4 ${className}`} {...props} />
}
