import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { BookCover } from '@/components/ui/BookCover'
import { Button } from '@/components/ui/Button'
import { BackLink, CornerNote } from '@/components/ui/BackLink'
import { FormMessage } from '@/components/ui/FormMessage'
import { PageTitle } from '@/components/ui/Typography'
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
      <div className="flex items-center justify-between">
        <BackLink to="/meus-livros">livros</BackLink>
        <CornerNote>feito pra você</CornerNote>
      </div>
      <div className="-mt-2.5 flex flex-col">
        <PageTitle>Próxima leitura</PageTitle>
        <p className="font-hand text-lg">a partir dos seus livros e das suas estrelas</p>
        <p className="font-hand text-md text-accentStrong">
          sugerido por IA; cada livro foi conferido na Open Library
        </p>
      </div>

      {isFetching && <p className="font-hand text-lg text-primary">Escolhendo livros para você…</p>}
      {message && <FormMessage tone="error">{message}</FormMessage>}
      {!isFetching && data?.length === 0 && (
        <FormMessage tone="success">Não encontramos sugestões confirmadas desta vez. Tente gerar outras.</FormMessage>
      )}

      {!isFetching && (
        <ul className="flex flex-col gap-3.5" aria-label="Sugestões de leitura">
          {data?.map((s, i) => (
            <li key={s.workKey} className={i % 2 ? 'tilt-r-half' : 'tilt-l-half'}>
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
    <article className="flex gap-3.5 rounded-card border border-primary bg-card p-3">
      <BookCover title={suggestion.title} url={suggestion.coverUrl} size="stamp" stamp decorative />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="font-type font-normal text-base leading-tight">{suggestion.title}</h2>
        {suggestion.author && <p className="font-hand text-md leading-none">{suggestion.author}</p>}
        {suggestion.reason && (
          <p className="border-t border-dashed border-slot pt-1 font-hand text-base leading-tight">
            <span className="mr-1 rounded-xs bg-pill px-1 font-mono font-bold text-2xs uppercase tracking-label">por quê?</span>
            {suggestion.reason}
          </p>
        )}
        {add.data ? (
          <p role="status" className="mt-auto flex flex-wrap items-center gap-2 font-mono font-bold text-2xs uppercase tracking-label">
            <span className="rounded-sm bg-primary px-3 py-2 text-inverse">✓ na lista "Quero ler"</span>
            <Link to={bookPath(add.data.id)} className="underline underline-offset-4">
              ver livro
            </Link>
          </p>
        ) : (
          <Button variant="secondary" fullWidth={false} onClick={onAdd} loading={add.isPending} className="mt-auto self-start min-h-9 text-2xs">
            ADICIONAR À LISTA
          </Button>
        )}
        {error && <FormMessage tone="error">{error}</FormMessage>}
      </div>
    </article>
  )
}
