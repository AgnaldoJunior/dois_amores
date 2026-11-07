import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

/** Estado vazio: ícone num círculo, título em Playfair e uma linha de explicação. */
export function EmptyState({ children, title, icon = 'book', action }: { children: ReactNode; title?: string; icon?: IconName; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-line bg-card px-5 py-6 text-center">
      <span className="flex size-15 items-center justify-center rounded-full border border-line bg-page text-primary">
        <Icon name={icon} className="size-icon-lg" />
      </span>
      {title && <p className="m-0 mt-1 font-display italic font-semibold text-2xl leading-tight text-primary">{title}</p>}
      <p className="m-0 font-sans text-base leading-relaxed text-muted">{children}</p>
      {action}
    </div>
  )
}
