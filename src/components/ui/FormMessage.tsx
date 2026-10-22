import type { ReactNode } from 'react'

/** Mensagem de erro ou sucesso de um formulário, anunciada por leitores de tela. */
export function FormMessage({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  if (!children) return null
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={
        'rounded-card px-4 py-3 font-sans text-sm ' +
        (tone === 'error' ? 'border border-danger text-danger' : 'bg-card text-primary')
      }
    >
      {children}
    </p>
  )
}
