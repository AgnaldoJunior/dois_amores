import type { ReactNode } from 'react'
import { Link } from 'react-router'

type Props = { children: ReactNode; className?: string }

/** Título de página: Playfair Display itálico em vinho (ex.: "minhas estantes"). */
export function PageTitle({ children, className = '' }: Props) {
  return (
    <h1 className={`font-display italic font-semibold text-4xl leading-tight text-primary ${className}`}>{children}</h1>
  )
}

/**
 * Título de seção ("favoritos", "estantes"); `action` é o link "ver todos →" à direita
 * e `aside` um número logo depois do título.
 */
export function SectionTitle({
  children,
  className = '',
  aside,
  action,
}: Props & { aside?: ReactNode; action?: { to: string; label: string } }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${className}`}>
      <h2 className="flex items-baseline gap-2 font-display italic font-semibold text-title-md leading-tight text-primary">
        {children}
        {aside != null && <span className="font-sans not-italic text-xs font-semibold tracking-label text-muted">{aside}</span>}
      </h2>
      {action && (
        <Link to={action.to} className="shrink-0 font-sans text-2xs font-semibold uppercase tracking-label text-primary no-underline">
          {action.label}
        </Link>
      )}
    </div>
  )
}

/** Sobretítulo em caixa alta (ex.: "CITAÇÃO DO DIA"). */
export function Eyebrow({ children, className = '' }: Props) {
  return <p className={`m-0 font-sans text-2xs font-semibold uppercase tracking-eyebrow text-primary ${className}`}>{children}</p>
}

/** Rótulo em caixa alta (cinza por padrão; passe text-primary para vinho). */
export function Label({ children, className = '' }: Props) {
  return (
    <span className={`font-sans text-2xs font-semibold uppercase tracking-label text-muted ${className}`}>{children}</span>
  )
}

/** Nota em DM Serif itálico (subtítulos, autores, legendas). */
export function HandText({ children, className = '' }: Props) {
  return <p className={`m-0 font-serif italic text-md leading-normal text-muted ${className}`}>{children}</p>
}

/** Título de livro em Playfair itálico. */
export function BookTitle({ children, className = '' }: Props) {
  return <span className={`font-display italic font-semibold text-xl leading-tight text-ink ${className}`}>{children}</span>
}

/** Citação (DM Serif itálico), com aspas tipográficas. */
export function Quote({ children, className = '' }: Props) {
  return <blockquote className={`m-0 font-serif italic text-base leading-normal text-ink ${className}`}>“{children}”</blockquote>
}
