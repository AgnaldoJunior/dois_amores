import { useState } from 'react'
import { useLocation, useParams } from 'react-router'
import { BookCover } from '@/components/ui/BookCover'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormMessage } from '@/components/ui/FormMessage'
import { Stars } from '@/components/ui/Stars'
import { HandText } from '@/components/ui/Typography'
import type { Reading } from '@/features/readings/api'
import { RANK_FIELDS } from '@/features/readings/validation'
import { formatDateShort } from '@/lib/dates'
import { memberAverage } from '@/lib/domain/ratings'
import { formatCount } from '@/lib/domain/stats'
import { useBook, useIsInWishlist, useMyReadingOf, useWishlistToggle } from './api'

/** /livros/:bookId — página do livro (Figma 06) com os dados de leitura do usuário. */
export function BookPage() {
  const { bookId = '' } = useParams()
  const location = useLocation()
  const flash = (location.state as { flash?: string } | null)?.flash
  const { data: book, isLoading, isError } = useBook(bookId)
  const { data: reading, isLoading: readingLoading } = useMyReadingOf(bookId)

  if (isLoading) return <p className="font-hand text-lg text-primary">Abrindo o livro…</p>
  if (isError || !book) return <FormMessage tone="error">Livro não encontrado.</FormMessage>

  return (
    <article className="flex flex-col gap-4">
      {flash && <FormMessage tone="success">{flash}</FormMessage>}

      <div className="flex justify-center">
        <BookCover title={book.title} url={book.cover_url} size="lg" decorative />
      </div>
      <h1 className="text-center font-display text-4xl uppercase leading-none text-primary">{book.title}</h1>
      {book.author && <p className="text-center font-mono text-xs uppercase text-primary">{book.author}</p>}
      {book.pages && (
        <p className="text-center font-mono text-xs uppercase text-primary">{formatCount(book.pages)} páginas</p>
      )}
      <Summary text={book.summary} />

      {readingLoading ? null : reading ? (
        <>
          <MyReading reading={reading} />
          <ButtonLink to={`/leituras/${reading.id}/editar`} variant="outline" className="text-base">
            EDITAR
          </ButtonLink>
        </>
      ) : (
        <NotStarted bookId={book.id} />
      )}
    </article>
  )
}

export const SUMMARY_PREVIEW_CHARS = 360

/** Resumo da Open Library; textos longos começam recolhidos. */
function Summary({ text }: { text: string | null }) {
  const [expanded, setExpanded] = useState(false)
  if (!text) return <HandText className="text-center">sem resumo disponível</HandText>
  const long = text.length > SUMMARY_PREVIEW_CHARS
  const shown = long && !expanded ? `${text.slice(0, SUMMARY_PREVIEW_CHARS).trimEnd()}…` : text
  return (
    <div className="flex flex-col items-center gap-1">
      <HandText className="text-center whitespace-pre-line">{shown}</HandText>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="font-sans text-sm text-primary underline underline-offset-4"
        >
          {expanded ? 'mostrar menos' : 'ler resumo completo'}
        </button>
      )}
    </div>
  )
}

function DataLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs text-primary">
      {label}: {children}
    </p>
  )
}

function MyReading({ reading }: { reading: Reading }) {
  const average = memberAverage(reading)
  return (
    <Card className="flex flex-col gap-2.5">
      <h2 className="font-display text-title-sm uppercase leading-none text-primary">Seus dados</h2>
      <DataLine label="Início">{formatDateShort(reading.started_on)}</DataLine>
      <DataLine label="Fim">{reading.finished_on ? formatDateShort(reading.finished_on) : 'em andamento'}</DataLine>

      {average != null && <Stars value={average} size="lg" />}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
        {RANK_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <dt className="font-mono text-2xs uppercase tracking-label text-primary">{label}</dt>
            <dd>
              <Stars value={reading[key]} size="sm" />
            </dd>
          </div>
        ))}
      </dl>

      <p className="font-sans text-sm text-primary">
        Personagem favorito: {reading.favorite_character ?? <span className="opacity-70">não informado</span>}
      </p>
      <HandText>Citação favorita: {reading.favorite_quote ?? 'nenhuma ainda'}</HandText>
      <HandText>Comentário: {reading.comment ?? 'nenhum ainda'}</HandText>
    </Card>
  )
}

function NotStarted({ bookId }: { bookId: string }) {
  const { data: inWishlist } = useIsInWishlist(bookId)
  const toggle = useWishlistToggle()
  return (
    <div className="flex flex-col gap-2">
      <ButtonLink to={`/publicar?livro=${bookId}`} className="text-base">
        COMEÇAR A LER
      </ButtonLink>
      <Button
        variant="outline"
        loading={toggle.isPending}
        onClick={() => toggle.mutate({ bookId, add: !inWishlist })}
      >
        {inWishlist ? 'Remover de "Quero ler"' : 'Adicionar a "Quero ler"'}
      </Button>
    </div>
  )
}
