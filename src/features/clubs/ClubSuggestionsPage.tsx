import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router'
import { BackLink } from '@/components/ui/BackLink'
import { BookCover } from '@/components/ui/BookCover'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormMessage } from '@/components/ui/FormMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { Stars } from '@/components/ui/Stars'
import { HandText, Label, PageTitle, SectionTitle } from '@/components/ui/Typography'
import { AI_ERROR_MESSAGES, AiError, suggestClubReads, type BookSuggestion } from '@/lib/ai/client'
import { shelfFavorites, type ShelfFavorite } from '@/lib/domain/ranking'
import { formatAverage } from '@/lib/domain/ratings'
import { useClub, useClubShelfReadings, useProposeBook, type ShelfReading } from './api'
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
      <div className="flex flex-col gap-1">
        <BackLink to={clubPath(clubId)}>clube</BackLink>
        <PageTitle>Sugestão do clube</PageTitle>
      </div>

      <ShelfFavorites clubId={clubId} />

      <SectionTitle>Ideias da IA</SectionTitle>
      <p className="-mt-2 font-hand text-md text-accentStrong">
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
    </div>
  )
}

/** "Os favoritos das estantes de vocês, fora do clube" — sem IA: médias das notas dos membros. */
function ShelfFavorites({ clubId }: { clubId: string }) {
  const { data: club } = useClub(clubId)
  const memberIds = club?.members.map((m) => m.user_id) ?? []
  const { data: readings, isLoading } = useClubShelfReadings(clubId, memberIds)
  const favorites = shelfFavorites(readings ?? [], club?.books.map((b) => b.book.id) ?? [])
  if (isLoading || !club) return null
  return (
    <section className="flex flex-col gap-2.5" aria-labelledby="shelf-favorites">
      <SectionTitle>
        <span id="shelf-favorites">Das estantes</span>
      </SectionTitle>
      <p className="-mt-1.5 text-center font-hand text-md">os favoritos das estantes de vocês, fora do clube</p>
      {favorites.length === 0 ? (
        <EmptyState>Quando alguém do clube terminar um livro por conta própria, ele aparece aqui.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Favoritos das estantes">
          {favorites.map((f) => (
            <li key={f.book.id}>
              <ShelfFavoriteCard clubId={clubId} favorite={f} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ShelfFavoriteCard({ clubId, favorite }: { clubId: string; favorite: ShelfFavorite<ShelfReading['book']> }) {
  const propose = useProposeBook(clubId)
  const [error, setError] = useState('')
  const { book } = favorite
  async function onPropose() {
    setError('')
    try {
      await propose.mutateAsync({ bookId: book.id })
    } catch (err) {
      setError(proposeErrorMessage(err))
    }
  }
  return (
    <article className="flex gap-3 rounded-card border border-primary bg-card p-2.5">
      <BookCover title={book.title} url={book.cover_url} size="feed" decorative />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="font-type font-normal text-sm leading-tight">{book.title}</h3>
        {book.author && <p className="font-hand text-md leading-none">{book.author}</p>}
        <div className="flex flex-wrap items-center gap-1.5">
          <Stars value={favorite.average} size="sm" />
          <Label className="text-2xs">
            {formatAverage(favorite.average)} · média de {favorite.raters} {favorite.raters === 1 ? 'membro' : 'membros'}
          </Label>
        </div>
        {propose.isSuccess ? (
          <p role="status" className="font-hand text-md">✓ proposto ao clube</p>
        ) : (
          <Button variant="secondary" fullWidth={false} onClick={onPropose} loading={propose.isPending} className="self-start min-h-button-sm-h text-2xs">
            propor ao clube
          </Button>
        )}
        {error && <FormMessage tone="error">{error}</FormMessage>}
      </div>
    </article>
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
          <h2 className="font-type font-normal text-md leading-tight text-primary">{suggestion.title}</h2>
          {suggestion.author && <p className="font-hand text-md leading-none text-primary">{suggestion.author}</p>}
          {suggestion.reason && <HandText>{suggestion.reason}</HandText>}
        </div>
      </div>
      {propose.isSuccess ? (
        <p role="status" className="font-hand text-md text-primary">
          ✓ Proposto ao clube. Agora é esperar os votos!
        </p>
      ) : (
        <Button variant="outline" onClick={onPropose} loading={propose.isPending}>
          PROPOR AO CLUBE
        </Button>
      )}
      {error && <FormMessage tone="error">{error}</FormMessage>}
    </Card>
  )
}
