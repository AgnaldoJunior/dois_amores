import type { ReactNode } from 'react'

/** Mensagem de erro ou sucesso de um formulário, anunciada por leitores de tela. */
export function FormMessage({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  if (!children) return null
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={
        'm-0 rounded-card border px-4 py-3 font-sans text-base ' +
        (tone === 'error' ? 'border-danger bg-card text-danger' : 'border-line bg-petal text-primary')
      }
    >
      {children}
    </p>
  )
}
