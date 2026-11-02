import type { ReactNode } from 'react'

type Props = { children: ReactNode; className?: string }

/** Título de página: cursivo rosa grande (ex.: "Meus livros"). */
export function PageTitle({ children, className = '' }: Props) {
  return (
    <h1 className={`font-script font-normal text-5xl leading-none text-title ${className}`}>
      {children}
    </h1>
  )
}

/** Título de seção entre dois fios rosa (ex.: "Leituras recentes"); `aside` aparece logo depois (contagem). */
export function SectionTitle({ children, className = '', aside }: Props & { aside?: ReactNode }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="rule" aria-hidden="true" />
      <h2 className="font-script font-normal text-3xl leading-none text-title whitespace-nowrap">{children}</h2>
      {aside != null && <span className="font-mono font-bold text-2xs uppercase tracking-label">{aside}</span>}
      <span className="rule" aria-hidden="true" />
    </div>
  )
}

/** Título secundário cursivo (nomes de membros, saudação). */
export function ScriptTitle({ children, className = '' }: Props) {
  return <p className={`font-script text-3xl leading-tight text-primary ${className}`}>{children}</p>
}

/** Rótulo em máquina de escrever, caixa alta (ex.: "E-MAIL", "LIVROS LIDOS"). */
export function Label({ children, className = '' }: Props) {
  return (
    <span className={`font-mono font-bold text-xs uppercase tracking-label text-primary ${className}`}>
      {children}
    </span>
  )
}

/** Texto manuscrito para comentários e citações. */
export function HandText({ children, className = '' }: Props) {
  return <p className={`font-hand text-lg leading-tight text-primary ${className}`}>{children}</p>
}

/** Título de livro em tipo de máquina gasta. */
export function BookTitle({ children, className = '' }: Props) {
  return <span className={`font-type text-md leading-tight text-primary ${className}`}>{children}</span>
}
