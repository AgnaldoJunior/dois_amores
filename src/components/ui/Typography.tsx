import type { ReactNode } from 'react'

type Props = { children: ReactNode; className?: string }

/** Título de página: display condensado em caixa alta (ex.: "FEED"). */
export function PageTitle({ children, className = '' }: Props) {
  return (
    <h1 className={`font-display text-4xl leading-none uppercase text-primary ${className}`}>
      {children}
    </h1>
  )
}

/** Título de seção (ex.: "LEITURAS RECENTES", "LIDOS"). */
export function SectionTitle({ children, className = '' }: Props) {
  return (
    <h2 className={`font-display text-2xl leading-none uppercase text-primary ${className}`}>
      {children}
    </h2>
  )
}

/** Título secundário cursivo (nomes de membros, saudação). */
export function ScriptTitle({ children, className = '' }: Props) {
  return <p className={`font-script text-3xl leading-tight text-primary ${className}`}>{children}</p>
}

/** Rótulo em máquina de escrever, caixa alta (ex.: "E-MAIL", "LIVROS LIDOS"). */
export function Label({ children, className = '' }: Props) {
  return (
    <span className={`font-mono text-xs uppercase tracking-label text-primary ${className}`}>
      {children}
    </span>
  )
}

/** Texto manuscrito para comentários e citações. */
export function HandText({ children, className = '' }: Props) {
  return <p className={`font-hand text-lg leading-tight text-primary ${className}`}>{children}</p>
}
