import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** Marca "dois amores" com estrelinhas, em papel sobre o vinho escuro. */
export function Wordmark({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  return (
    <span className="relative inline-block">
      <span className={`font-display italic font-bold leading-none text-inverse ${size === 'lg' ? 'text-6xl' : 'text-4xl'}`}>
        dois amores
      </span>
      <span aria-hidden="true" className="twinkle -top-3 -left-3 text-lg">✦</span>
      <span aria-hidden="true" className="twinkle twinkle-late -top-1 -right-4 text-sm">✧</span>
      <span aria-hidden="true" className="twinkle twinkle-later -bottom-3 left-1/2 text-xs">✦</span>
    </span>
  )
}

/**
 * Telas de acesso: topo vinho escuro com a marca e a frase "a estante ao lado da cama",
 * e uma folha de papel que sobe com o título e o formulário.
 */
export function AuthLayout({ title, subtitle, back, children }: { title?: string; subtitle?: string; back?: { to: string; label: string }; children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-primaryHover lg:bg-backdrop lg:py-10">
      <div className="mx-auto flex min-h-dvh max-w-content-max flex-col overflow-hidden bg-primaryHover lg:min-h-0 lg:rounded-sheet">
        <header className="relative flex flex-col items-center px-6 pt-12 pb-10 text-center">
          {back && (
            <Link to={back.to} className="absolute top-4.5 left-6 font-sans text-base font-semibold text-blush no-underline">
              ‹ {back.label}
            </Link>
          )}
          <Link to="/entrar" aria-label="Dois Amores · início" className="mt-6 no-underline">
            <Wordmark />
          </Link>
          <p className="rise delay-2 m-0 mt-4 font-serif italic text-xl text-blush">a estante ao lado da cama</p>
        </header>
        <section className="rise delay-1 flex flex-1 flex-col gap-4 rounded-t-sheet bg-page px-7 pt-8 pb-10">
          {title && <h1 className="m-0 font-display italic font-semibold text-3xl leading-tight text-primary">{title}</h1>}
          {subtitle && <p className="-mt-2 m-0 font-sans text-md leading-relaxed text-muted">{subtitle}</p>}
          {children}
        </section>
      </div>
    </main>
  )
}

export function TextLink({ to, children, className = 'self-center' }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={`font-sans text-sm font-semibold text-primary no-underline hover:underline ${className}`}>
      {children}
    </Link>
  )
}

/** Divisória "ou" entre dois fios. */
export function OrDivider() {
  return (
    <div className="flex items-center gap-2.5" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      <span className="font-serif italic text-md text-muted">ou</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}
