import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { BookCover } from '@/components/ui/BookCover'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormMessage } from '@/components/ui/FormMessage'
import { HandText, PageTitle } from '@/components/ui/Typography'
import { AI_ERROR_MESSAGES, AiError, suggestNextReads, type BookSuggestion } from '@/lib/ai/client'
import { useAddSuggestionToWishlist } from './api'
import { bookPath } from './ShelfPage'

/** /meus-livros/sugestoes — "Sugestão para você" (Figma 07). */
export function SuggestionsPage() {
  // Cada geração usa uma chamada da cota diária: mantém o resultado enquanto o app estiver aberto.
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['ai', 'next-reads'],
    queryFn: suggestNextReads,
    staleTime: Infinity,
    gcTime: 60 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  })
  const message = error instanceof AiError ? error.message : error ? AI_ERROR_MESSAGES.unknown : ''

  return (
    <div className="flex flex-col gap-4">
      <PageTitle>Sugestão para você</PageTitle>
      <p className="font-hand text-lg text-accentStrong">
        sugerido por IA a partir dos seus livros e notas; cada livro foi conferido na Open Library
      </p>

      {isFetching && <p className="font-hand text-lg text-primary">Escolhendo livros para você…</p>}
      {message && <FormMessage tone="error">{message}</FormMessage>}
      {!isFetching && data?.length === 0 && (
        <FormMessage tone="success">Não encontramos sugestões confirmadas desta vez. Tente gerar outras.</FormMessage>
      )}

      {!isFetching && (
        <ul className="flex flex-col gap-4" aria-label="Sugestões de leitura">
          {data?.map((s) => (
            <li key={s.workKey}>
              <SuggestionCard suggestion={s} />
            </li>
          ))}
        </ul>
      )}

      {!isFetching && (
        <Button variant="outline" onClick={() => refetch()}>
          Gerar outras sugestões
        </Button>
      )}
      <Link to="/meus-livros" className="self-center font-sans text-sm text-primary underline underline-offset-4">
        Voltar para Meus livros
      </Link>
    </div>
  )
}

function SuggestionCard({ suggestion }: { suggestion: BookSuggestion }) {
  const add = useAddSuggestionToWishlist()
  const [error, setError] = useState('')

  async function onAdd() {
    setError('')
    try {
      await add.mutateAsync(suggestion)
    } catch {
      setError('Não foi possível adicionar agora. Tente de novo.')
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
      {add.data ? (
        <p role="status" className="flex flex-wrap items-center justify-between gap-2 font-sans text-sm text-primary">
          ✓ Na sua lista "Quero ler"
          <Link to={bookPath(add.data.id)} className="underline underline-offset-4">
            ver livro
          </Link>
        </p>
      ) : (
        <Button variant="outline" onClick={onAdd} loading={add.isPending} className="text-base">
          ADICIONAR À LISTA
        </Button>
      )}
      {error && <FormMessage tone="error">{error}</FormMessage>}
    </Card>
  )
}
