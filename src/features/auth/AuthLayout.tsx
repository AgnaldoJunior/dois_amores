import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** Moldura das telas de acesso: logotipo "Dois Amores · clube do livro" e uma coluna central. */
export function AuthLayout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-page">
      <div className="mx-auto flex w-full max-w-content-max flex-col gap-4 px-6 pt-16 pb-8">
        <Link to="/entrar" className="flex flex-col items-center gap-1 pb-4 text-center">
          <span className="font-display text-6xl leading-none text-primary">DOIS AMORES</span>
          {/* Logotipo: o rosa claro é decorativo e não precisa do contraste de texto funcional. */}
          <span className="font-script text-3xl leading-tight text-accent">clube do livro</span>
        </Link>
        {title && <h1 className="font-display text-2xl uppercase leading-none text-primary">{title}</h1>}
        {children}
      </div>
    </main>
  )
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="self-center font-sans text-sm text-primary underline underline-offset-4">
      {children}
    </Link>
  )
}
