import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { BookCover } from '@/components/ui/BookCover'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormMessage } from '@/components/ui/FormMessage'
import { HandText, PageTitle } from '@/components/ui/Typography'
import { AI_ERROR_MESSAGES, AiError, suggestClubReads, type BookSuggestion } from '@/lib/ai/client'
import { useProposeBook } from './api'
import { clubPath } from './ClubsPage'
import { proposeErrorMessage } from './ProposePage'

function errorMessage(error: unknown) {
  if (!(error instanceof AiError)) return error ? AI_ERROR_MESSAGES.unknown : ''
  return error.code === 'not_enough_data'
    ? 'O clube precisa ter pelo menos um livro lido ou em leitura para receber sugestões.'
    : error.message
}

/** /clubes/:clubId/sugestoes — "Sugestão do clube" (Figma 12). */
export function ClubSuggestionsPage() {
  const { clubId = '' } = useParams()
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['ai', 'club-reads', clubId],
    queryFn: () => suggestClubReads(clubId),
    staleTime: Infinity,
    gcTime: 60 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  })
  const message = errorMessage(error)

  return (
    <div className="flex flex-col gap-4">
      <PageTitle>Sugestão do clube</PageTitle>
      <p className="font-hand text-lg text-accentStrong">
        sugerido por IA a partir dos livros do clube e das notas de cada membro; cada livro foi conferido na Open Library
      </p>

      {isFetching && <p className="font-hand text-lg text-primary">Pensando no gosto de todo mundo…</p>}
      {message && <FormMessage tone="error">{message}</FormMessage>}
      {!isFetching && data?.length === 0 && (
        <FormMessage tone="success">Não encontramos sugestões confirmadas desta vez. Tente gerar outras.</FormMessage>
      )}

      {!isFetching && (
        <ul className="flex flex-col gap-4" aria-label="Sugestões para o clube">
          {data?.map((s) => (
            <li key={s.workKey}>
              <ClubSuggestionCard clubId={clubId} suggestion={s} />
            </li>
          ))}
        </ul>
      )}

      {!isFetching && (
        <Button variant="outline" onClick={() => refetch()}>
          Gerar outras sugestões
        </Button>
      )}
      <Link to={clubPath(clubId)} className="self-center font-sans text-sm text-primary underline underline-offset-4">
        Voltar para o clube
      </Link>
    </div>
  )
}

function ClubSuggestionCard({ clubId, suggestion }: { clubId: string; suggestion: BookSuggestion }) {
  const propose = useProposeBook(clubId)
  const [error, setError] = useState('')

  async function onPropose() {
    setError('')
    try {
      await propose.mutateAsync(suggestion)
    } catch (err) {
      setError(proposeErrorMessage(err))
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex gap-3">
        <BookCover title={suggestion.title} url={suggestion.coverUrl} size="sm" decorative />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <h2 className="font-display text-title-sm uppercase leading-none text-primary">{suggestion.title}</h2>
          {suggestion.author && <p className="font-mono text-xs text-primary">{suggestion.author}</p>}
          {suggestion.reason && <HandText>{suggestion.reason}</HandText>}
        </div>
      </div>
      {propose.isSuccess ? (
        <p role="status" className="font-sans text-sm text-primary">
          ✓ Proposto ao clube. Agora é esperar os votos!
        </p>
      ) : (
        <Button variant="outline" onClick={onPropose} loading={propose.isPending} className="text-base">
          PROPOR AO CLUBE
        </Button>
      )}
      {error && <FormMessage tone="error">{error}</FormMessage>}
    </Card>
  )
}
