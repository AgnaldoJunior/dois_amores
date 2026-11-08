import { useState, type ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { ReviewCard } from '@/components/ReviewCard'
import { Avatar, avatarOf } from '@/components/ui/Avatar'
import { BackLink } from '@/components/ui/BackLink'
import { BookCover } from '@/components/ui/BookCover'
import { FormMessage } from '@/components/ui/FormMessage'
import { Stars } from '@/components/ui/Stars'
import { Eyebrow, HandText, Quote } from '@/components/ui/Typography'
import { useMyClubBooks, useMyClubs } from '@/features/clubs/api'
import { clubBookPath } from '@/features/clubs/ClubReviewPage'
import { ProgressCard } from '@/features/readings/ProgressCard'
import { bookAverage, formatAverage, memberAverage } from '@/lib/domain/ratings'
import { formatCount } from '@/lib/domain/stats'
import {
  useBook,
  useBookEnrichment,
  useBookReaders,
  useIsInWishlist,
  useMyReadingOf,
  useSummaryTranslation,
  useWishlistToggle,
  type BookDetail,
} from './api'
import { shelfErrorMessage } from './AddBookToShelf'
import { useCustomShelves, useToggleShelfBook } from './shelvesApi'

const statusClass = (on: boolean) =>
  'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-card border px-2 py-2 font-sans text-sm font-semibold no-underline ' +
  (on ? 'border-primary bg-primary text-inverse hover:text-inverse' : 'border-border bg-card text-ink hover:text-ink')

/** /livros/:bookId — "o livro": capa, nota, status (lendo, já li, quero ler), sinopse, amigas e clube. */
export function BookPage() {
  const { bookId = '' } = useParams()
  const location = useLocation()
  const flash = (location.state as { flash?: string } | null)?.flash
  const { data: book, isLoading, isError } = useBook(bookId)
  const { data: reading, isLoading: readingLoading } = useMyReadingOf(bookId)

  if (isLoading) return <p className="m-0 font-serif italic text-md text-muted">abrindo o livro…</p>
  if (isError || !book) return <FormMessage tone="error">Livro não encontrado.</FormMessage>

  const average = reading ? memberAverage(reading) : null
  const finished = Boolean(reading?.finished_on)

  return (
    <article className="relative flex flex-col gap-5">
      <span aria-hidden="true" className="twinkle top-20 right-8 text-sm">✧</span>
      <span aria-hidden="true" className="twinkle twinkle-rose twinkle-later top-56 left-4 text-2xs">✦</span>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <BackLink to="/estantes">estantes</BackLink>
        <span className="font-display italic font-semibold text-xl text-ink">o livro</span>
        <span />
      </div>

      {flash && <FormMessage tone="success">{flash}</FormMessage>}

      <header className="flex flex-col items-center gap-2 text-center">
        <BookCover title={book.title} url={book.cover_url} size="hero" decorative className="rise" />
        <h1 className="m-0 mt-3 font-display italic font-semibold text-4xl leading-tight text-primary">{book.title}</h1>
        {book.author && <p className="m-0 font-serif italic text-xl text-muted">{book.author}</p>}
        {book.pages && <p className="m-0 font-sans text-2xs font-semibold uppercase tracking-label text-muted">{formatCount(book.pages)} páginas</p>}
      </header>

      {!readingLoading && finished && (
        <div className="flex items-center justify-center gap-2">
          <Eyebrow>sua nota</Eyebrow>
          <Stars value={average} size="md" />
        </div>
      )}

      {!readingLoading && <StatusButtons bookId={book.id} readingId={reading?.id ?? null} finished={finished} />}
      <AddToShelf bookId={book.id} />

      {reading && !reading.finished_on && <ProgressCard reading={{ ...reading, book: { ...reading.book, pages: book.pages } }} />}

      <Summary book={book} />
      <Readers bookId={book.id} />
      <InMyClubs bookId={book.id} />

      {reading?.finished_on && (reading.favorite_quote || reading.comment) && (
        <section aria-labelledby="my-note" className="flex flex-col gap-2 rounded-card border border-line bg-card p-4">
          <Eyebrow>
            <span id="my-note">sua anotação</span>
          </Eyebrow>
          {reading.favorite_quote && <Quote className="text-lg">{reading.favorite_quote}</Quote>}
          {reading.comment && <p className="m-0 font-sans text-base leading-relaxed">{reading.comment}</p>}
        </section>
      )}
      {reading?.finished_on && <ReviewCard title="sua ficha" review={reading} />}
    </article>
  )
}

/** "lendo · já li · quero ler": começar, avaliar/terminar e guardar na lista. */
function StatusButtons({ bookId, readingId, finished }: { bookId: string; readingId: string | null; finished: boolean }) {
  const { data: inWishlist } = useIsInWishlist(bookId)
  const toggle = useWishlistToggle()
  const reading = Boolean(readingId) && !finished
  return (
    <div role="group" aria-label="Status do livro" className="flex gap-2">
      <Link to={readingId ? `/leituras/${readingId}/editar` : `/publicar?livro=${bookId}`} className={statusClass(reading)} aria-current={reading ? 'true' : undefined}>
        <span aria-hidden="true">📖</span> {reading ? 'lendo' : 'começar a ler'}
      </Link>
      <Link to={readingId ? `/leituras/${readingId}/editar` : `/publicar?livro=${bookId}`} className={statusClass(finished)} aria-current={finished ? 'true' : undefined}>
        <span aria-hidden="true">✓</span> {finished ? 'já li · editar' : 'já li'}
      </Link>
      {!readingId && (
        <button
          type="button"
          onClick={() => toggle.mutate({ bookId, add: !inWishlist })}
          disabled={toggle.isPending}
          aria-pressed={Boolean(inWishlist)}
          className={statusClass(Boolean(inWishlist))}
        >
          <span aria-hidden="true">♡</span> quero ler
        </button>
      )}
    </div>
  )
}

/** "+ estante": marca em quais estantes próprias o livro está. */
function AddToShelf({ bookId }: { bookId: string }) {
  const { data: shelves } = useCustomShelves()
  const toggle = useToggleShelfBook()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  if (!shelves || shelves.length === 0) {
    return (
      <Link to="/estantes/nova" className="self-center font-sans text-sm font-semibold text-primary no-underline">
        + criar uma estante própria
      </Link>
    )
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="min-h-11 font-sans text-sm font-semibold text-primary">
        + estante
      </button>
      {open && (
        <fieldset className="w-full rounded-card border border-line bg-card px-4 py-2">
          <legend className="sr-only">Estantes</legend>
          {shelves.map((s) => {
            const has = s.books.some((b) => b.book.id === bookId)
            return (
              <label key={s.id} className="flex min-h-11 cursor-pointer items-center justify-between gap-3 border-b border-line last:border-b-0">
                <span className="font-display italic font-semibold text-lg">{s.name}</span>
                <input
                  type="checkbox"
                  checked={has}
                  disabled={toggle.isPending}
                  onChange={() => {
                    setError('')
                    toggle.mutate({ shelfId: s.id, bookId, add: !has }, { onError: (err) => setError(shelfErrorMessage(err)) })
                  }}
                  className="size-5 accent-primary"
                />
              </label>
            )
          })}
        </fieldset>
      )}
      {error && <FormMessage tone="error">{error}</FormMessage>}
    </div>
  )
}

/** "Quem leu entre seus amigos": avatares e a média de quem terminou. */
function Readers({ bookId }: { bookId: string }) {
  const { data } = useBookReaders(bookId)
  if (!data || data.length === 0) return null
  const average = bookAverage(data.map(memberAverage))
  const names = data.slice(0, 2).map((r) => r.user.name.split(/\s+/)[0]?.toLowerCase())
  return (
    <section aria-labelledby="readers" className="flex flex-col gap-2.5">
      <h2 id="readers" className="m-0 font-display italic font-semibold text-title-md text-primary">
        quem leu entre seus amigos
      </h2>
      <div className="flex items-center gap-3">
        <span className="flex">
          {data.slice(0, 4).map((r) => (
            <Link key={r.user.id} to={`/pessoas/${r.user.id}`} aria-label={r.user.name} className="-ml-2 first:ml-0">
              <Avatar {...avatarOf(r.user)} size="xs" border="thick" />
            </Link>
          ))}
        </span>
        <p className="m-0 font-sans text-sm text-muted">
          {names.join(', ')}
          {data.length > 2 && ` e mais ${data.length - 2}`}
          {average != null && ` · média ${formatAverage(average)}★`}
        </p>
      </div>
    </section>
  )
}

/** "No seu clube": o livro nas leituras dos clubes de que você participa. */
function InMyClubs({ bookId }: { bookId: string }) {
  const { data: clubBooks } = useMyClubBooks()
  const { data: clubs } = useMyClubs()
  const here = clubBooks?.filter((cb) => cb.book.id === bookId) ?? []
  if (here.length === 0) return null
  return (
    <section aria-labelledby="in-club" className="flex flex-col gap-2">
      <h2 id="in-club" className="m-0 font-display italic font-semibold text-title-md text-primary">
        no seu clube
      </h2>
      {here.map((cb) => (
        <Link key={cb.id} to={clubBookPath(cb.club_id, cb.id)} className="flex items-center justify-between rounded-card border border-line bg-card px-4 py-3 text-ink no-underline">
          <span className="flex flex-col">
            <span className="font-display italic font-semibold text-xl">{clubs?.find((c) => c.id === cb.club_id)?.name ?? 'clube'}</span>
            <span className="font-sans text-sm text-muted">
              {cb.status === 'finished' ? 'lido no clube' : cb.status === 'reading' ? 'lendo agora no clube' : 'na fila do clube'}
            </span>
          </span>
          <span className="font-sans text-2xs font-semibold uppercase tracking-label text-primary">ver fichas →</span>
        </Link>
      ))}
    </section>
  )
}

export const SUMMARY_PREVIEW_CHARS = 360

/**
 * Sinopse em português (Google Books ou tradução da IA na primeira visita).
 * Textos longos começam recolhidos.
 */
function Summary({ book }: { book: BookDetail }) {
  const [expanded, setExpanded] = useState(false)
  const enrichment = useBookEnrichment(book)
  const translation = useSummaryTranslation(book)
  const text = book.summary
  if (!text) {
    return (
      <SummaryBox>
        <HandText>{enrichment.isFetching ? 'buscando a sinopse em português…' : 'sem resumo disponível'}</HandText>
      </SummaryBox>
    )
  }
  const long = text.length > SUMMARY_PREVIEW_CHARS
  const shown = long && !expanded ? `${text.slice(0, SUMMARY_PREVIEW_CHARS).trimEnd()}…` : text
  return (
    <SummaryBox>
      <p className="m-0 font-sans text-base leading-relaxed whitespace-pre-line">{shown}</p>
      {long && (
        <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="self-start font-sans text-sm font-semibold text-primary">
          {expanded ? 'mostrar menos' : 'ler resumo completo'}
        </button>
      )}
      {enrichment.isFetching && (
        <p role="status" className="m-0 font-sans text-2xs font-semibold uppercase tracking-label text-primary">
          buscando a edição em português…
        </p>
      )}
      {translation.isFetching && (
        <p role="status" className="m-0 font-sans text-2xs font-semibold uppercase tracking-label text-primary">
          traduzindo para o português…
        </p>
      )}
      {book.summary_source === 'ai_translation' && <p className="m-0 font-serif italic text-md text-primary">resumo traduzido por IA</p>}
    </SummaryBox>
  )
}

function SummaryBox({ children }: { children: ReactNode }) {
  return (
    <section aria-labelledby="synopsis" className="flex flex-col gap-1.5">
      <h2 id="synopsis" className="m-0 font-display italic font-semibold text-title-md text-primary">
        sinopse
      </h2>
      {children}
    </section>
  )
}
