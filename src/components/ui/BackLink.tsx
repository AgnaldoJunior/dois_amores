import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** "‹ estantes": volta para a tela anterior da hierarquia. */
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center gap-1 self-start font-sans text-base font-semibold text-primary no-underline">
      <span aria-hidden="true">‹</span>
      {children}
    </Link>
  )
}

/** Barra do topo das telas internas: voltar à esquerda, título no meio e ação à direita. */
export function TopBar({ back, title, action }: { back?: { to: string; label: string }; title?: ReactNode; action?: ReactNode }) {
  return (
    <div className="grid min-h-11 grid-cols-[1fr_auto_1fr] items-center gap-2">
      <div>{back && <BackLink to={back.to}>{back.label}</BackLink>}</div>
      <div className="text-center font-display italic font-semibold text-xl text-ink">{title}</div>
      <div className="flex justify-end">{action}</div>
    </div>
  )
}
