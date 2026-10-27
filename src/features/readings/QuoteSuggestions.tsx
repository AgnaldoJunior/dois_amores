import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormMessage } from '@/components/ui/FormMessage'
import { AI_ERROR_MESSAGES, AiError, suggestQuotes } from '@/lib/ai/client'

export const AI_DISCLAIMER = 'sugerido por IA, confira se é literal'

type Props = {
  bookId: string | null
  /** Coloca a citação escolhida no campo (a pessoa ainda revisa e salva). */
  onUse: (quote: string) => void
}

/**
 * Botão "Sugerir com IA" da citação favorita (Figma 04). As sugestões só
 * entram no campo se a pessoa tocar em "Usar esta citação"; nada é salvo sozinho.
 */
export function QuoteSuggestions({ bookId, onUse }: Props) {
  const suggest = useMutation({ mutationFn: (id: string) => suggestQuotes(id) })
  const error = suggest.error instanceof AiError ? suggest.error.message : suggest.error ? AI_ERROR_MESSAGES.unknown : ''

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        className="text-base"
        disabled={!bookId}
        loading={suggest.isPending}
        onClick={() => bookId && suggest.mutate(bookId)}
      >
        SUGERIR COM IA
      </Button>
      {!bookId && <p className="font-hand text-lg text-primary">escolha o livro para receber sugestões</p>}
      {error && <FormMessage tone="error">{error}</FormMessage>}

      {suggest.data && (
        <section aria-label="Citações sugeridas pela IA" className="flex flex-col gap-2">
          <p className="font-hand text-lg text-accentStrong">{AI_DISCLAIMER}</p>
          {suggest.data.length === 0 ? (
            <p className="font-sans text-sm text-primary">
              A IA não encontrou citações com segurança para este livro. Que tal escrever a sua?
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {suggest.data.map((quote) => (
                <li key={quote.text}>
                  <Card className="flex flex-col gap-2 p-3">
                    <blockquote className="font-hand text-lg leading-tight text-primary">“{quote.text}”</blockquote>
                    {quote.context && <p className="font-mono text-2xs uppercase text-primary">{quote.context}</p>}
                    <Button variant="outline" fullWidth={false} className="self-start" onClick={() => onUse(quote.text)}>
                      Usar esta citação
                    </Button>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
