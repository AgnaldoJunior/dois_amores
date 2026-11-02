import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from './Icon'

/** "‹ livros": volta para a tela anterior da hierarquia. */
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center gap-1 self-start font-mono font-bold text-xs uppercase tracking-label no-underline"
    >
      <Icon name="back" className="size-icon-sm" />
      {children}
    </Link>
  )
}

/** Carimbo pequeno e torto no canto da tela ("feito pra você", "book track 2026"). */
export function CornerNote({ children }: { children: ReactNode }) {
  return <span className="tilt-l2 font-mono font-bold text-2xs uppercase tracking-label">{children}</span>
}
