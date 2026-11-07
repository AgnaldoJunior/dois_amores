import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Avatar, avatarOf } from '@/components/ui/Avatar'
import { BookCover } from '@/components/ui/BookCover'
import { Stars } from '@/components/ui/Stars'
import { Quote } from '@/components/ui/Typography'
import { formatDayMonthShort } from '@/lib/dates'
import { memberAverage } from '@/lib/domain/ratings'
import type { FeedPost } from './api'

/** Ficha no feed: quem avaliou, capa, título, nota e o comentário (ou a citação favorita). */
export function PostCard({ post, footer }: { post: FeedPost; footer?: ReactNode }) {
  const reading = post.reading
  const book = reading?.book
  if (!reading || !book) return null
  const average = memberAverage(reading)
  const name = post.author?.name || 'Alguém'
  const firstName = name.split(/\s+/)[0]
  const text = reading.comment ?? reading.favorite_quote

  return (
    <article className="rounded-card border border-line bg-card p-4">
      <div className="flex items-center gap-2.5">
        <Avatar {...(post.author ? avatarOf(post.author) : { name })} size="xs" />
        <p className="m-0 min-w-0 truncate font-sans text-sm font-semibold" title={name}>
          {post.author ? (
            <Link to={`/pessoas/${post.author.id}`} className="text-ink no-underline hover:underline">
              {firstName}
            </Link>
          ) : (
            firstName
          )}{' '}
          <span className="font-normal text-muted">avaliou</span>
        </p>
        {reading.finished_on && (
          <time dateTime={reading.finished_on} className="ml-auto shrink-0 font-sans text-2xs font-semibold uppercase tracking-label text-muted">
            {formatDayMonthShort(reading.finished_on)}
          </time>
        )}
      </div>
      <div className="mt-3 flex gap-3.5">
        <Link to={`/livros/${book.id}`} tabIndex={-1} aria-hidden="true">
          <BookCover title={book.title} url={book.cover_url} size="feed" decorative />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="m-0 font-display italic font-semibold text-xl leading-tight break-words">
            <Link to={`/livros/${book.id}`} className="text-ink no-underline hover:underline">
              {book.title}
            </Link>
          </h2>
          {book.author && <p className="m-0 font-serif italic text-sm text-muted">{book.author}</p>}
          <Stars value={average} size="sm" label={average == null ? 'Sem nota' : undefined} className="mt-0.5" />
          {text && <Quote className="mt-1.5 break-words">{text}</Quote>}
        </div>
      </div>
      {footer && <div className="mt-3 flex items-center gap-4.5 font-sans text-xs font-semibold text-muted">{footer}</div>}
    </article>
  )
}
