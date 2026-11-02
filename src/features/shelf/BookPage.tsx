import { useState, type ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { ReviewCard } from '@/components/ReviewCard'
import { BookCover } from '@/components/ui/BookCover'
import { Button, ButtonLink } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { Icon, type IconName } from '@/components/ui/Icon'
import { HandText } from '@/components/ui/Typography'
import { formatCount } from '@/lib/domain/stats'
import {
  useBook,
  useBookEnrichment,
  useIsInWishlist,
  useMyReadingOf,
  useSummaryTranslation,
  useWishlistToggle,
  type BookDetail,
} from './api'

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
    <article className="flex flex-col gap-3">
      <div className="stripes -mx-5 -mt-12 flex h-header items-start justify-between px-4 pt-11 lg:mx-0 lg:mt-0 lg:rounded-card">
        <PillLink to="/meus-livros" icon="back">
          livros
        </PillLink>
        {reading && (
          <PillLink to={`/leituras/${reading.id}/editar`} icon="feed" solid>
            Editar
          </PillLink>
        )}
      </div>

      <div className="-mt-13 flex items-end gap-3.5 px-1">
        <BookCover title={book.title} url={book.cover_url} size="md" stamp decorative className="tilt-l2" />
        <div className="flex min-w-0 flex-1 flex-col gap-1 pb-1">
          <h1 className="font-type font-normal text-xl leading-tight break-words">{book.title}</h1>
          {book.author && <p className="font-hand text-lg leading-none">{book.author}</p>}
          {book.pages && (
            <span className="self-start rounded-pill bg-pill px-2 py-0.5 font-mono font-bold text-2xs uppercase tracking-label">
              {formatCount(book.pages)} páginas
            </span>
          )}
        </div>
      </div>

      {flash && <FormMessage tone="success">{flash}</FormMessage>}

      <Summary book={book} />

      {readingLoading ? null : reading ? <ReviewCard title="seus dados" review={reading} /> : <NotStarted bookId={book.id} />}
    </article>
  )
}

function PillLink({ to, icon, solid = false, children }: { to: string; icon: IconName; solid?: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={
        'inline-flex min-h-pill-h items-center gap-1 rounded-full border border-primary px-3 font-mono font-bold text-xs uppercase tracking-label no-underline ' +
        (solid ? 'bg-primary text-inverse hover:text-inverse' : 'bg-page text-primary')
      }
    >
      <Icon name={icon} className="size-icon-sm" />
      {children}
    </Link>
  )
}

export const SUMMARY_PREVIEW_CHARS = 360

/**
 * Resumo da Open Library, traduzido pela IA na primeira visita quando não está
 * em português. Textos longos começam recolhidos.
 */
function Summary({ book }: { book: BookDetail }) {
  const [expanded, setExpanded] = useState(false)
  const enrichment = useBookEnrichment(book)
  const translation = useSummaryTranslation(book)
  const text = book.summary
  if (!text) {
    return (
      <SummaryBox>
        <HandText className="text-muted">
          {enrichment.isFetching ? 'buscando a sinopse em português…' : 'sem resumo disponível'}
        </HandText>
      </SummaryBox>
    )
  }
  const long = text.length > SUMMARY_PREVIEW_CHARS
  const shown = long && !expanded ? `${text.slice(0, SUMMARY_PREVIEW_CHARS).trimEnd()}…` : text
  return (
    <SummaryBox>
      <p className="font-sans text-sm leading-relaxed whitespace-pre-line">{shown}</p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="self-start font-hand text-md text-primary underline underline-offset-4"
        >
          {expanded ? 'mostrar menos' : 'ler resumo completo'}
        </button>
      )}
      {enrichment.isFetching && (
        <p role="status" className="font-mono font-bold text-2xs uppercase tracking-label text-primary">
          buscando a edição em português…
        </p>
      )}
      {translation.isFetching && (
        <p role="status" className="font-mono font-bold text-2xs uppercase tracking-label text-primary">
          traduzindo para o português…
        </p>
      )}
      {book.summary_source === 'ai_translation' && (
        <p className="font-hand text-lg text-accentStrong">resumo traduzido por IA</p>
      )}
    </SummaryBox>
  )
}

function SummaryBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-dashed border-slot px-3 py-2.5">
      <span className="font-mono font-bold text-2xs uppercase tracking-label">resumo</span>
      {children}
    </div>
  )
}

function NotStarted({ bookId }: { bookId: string }) {
  const { data: inWishlist } = useIsInWishlist(bookId)
  const toggle = useWishlistToggle()
  return (
    <div className="flex flex-col gap-2">
      <ButtonLink to={`/publicar?livro=${bookId}`}>Começar a ler</ButtonLink>
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
