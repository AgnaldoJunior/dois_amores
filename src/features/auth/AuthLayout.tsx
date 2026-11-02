import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** Moldura das telas de acesso: fundo listrado, cartão com fita e o ingresso "Dois Amores". */
export function AuthLayout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <main className="stripes min-h-dvh flex items-center justify-center px-5 py-12">
      <div className="relative flex w-full max-w-content-max flex-col gap-3.5 rounded-card bg-page px-6 pt-8 pb-6 shadow-lift">
        <span aria-hidden="true" className="tilt-l2 absolute -top-3 left-1/2 h-tape-h w-tape-w -translate-x-1/2 bg-card opacity-90" />
        <Link to="/entrar" className="flex flex-col items-center pb-2 text-center no-underline">
          <span className="ticket tilt-l1 whitespace-nowrap bg-primary px-10 pt-2.5 pb-1 font-display text-5xl leading-none text-inverse">
            Dois Amores
          </span>
          <span className="font-script text-3xl leading-tight text-title">clube do livro</span>
        </Link>
        {title && <h1 className="font-script text-4xl font-normal leading-none text-title">{title}</h1>}
        {children}
      </div>
    </main>
  )
}

export function TextLink({ to, children, className = 'self-center' }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={`font-hand text-md text-primary underline underline-offset-4 ${className}`}>
      {children}
    </Link>
  )
}

/** Divisória "ou" entre dois fios rosa. */
export function OrDivider() {
  return (
    <div className="flex items-center gap-2.5" aria-hidden="true">
      <span className="rule" />
      <span className="font-hand text-lg">ou</span>
      <span className="rule" />
    </div>
  )
}
