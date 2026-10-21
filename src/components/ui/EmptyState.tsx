import type { ReactNode } from 'react'
import { Card } from './Card'
import { HandText } from './Typography'

/** Estado vazio elegante, usado no lugar de listas sem itens. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Card className="text-center py-8">
      <HandText>{children}</HandText>
    </Card>
  )
}
