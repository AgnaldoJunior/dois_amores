import { Link } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { BookCover } from '@/components/ui/BookCover'
import { Stars } from '@/components/ui/Stars'
import { formatDayMonth } from '@/lib/dates'
import { memberAverage } from '@/lib/domain/ratings'
import type { FeedPost } from './api'

/** Post do feed: avatar e nome cursivo, carimbo "terminou", capa, título, autor, nota e comentário. */
export function PostCard({ post }: { post: FeedPost }) {
  const reading = post.reading
  const book = reading?.book
  if (!reading || !book) return null
  const average = memberAverage(reading)
  const name = post.author?.name || 'Alguém'
  const firstName = name.split(/\s+/)[0]

  return (
    <article className="flex flex-col gap-2 rounded-card border border-primary bg-card p-3">
      <div className="flex items-center gap-2.5">
        <Avatar name={name} url={post.author?.avatar_url} size="xs" />
        <p className="min-w-0 flex-1 truncate font-script text-title-md leading-tight" title={name}>
          {firstName}
        </p>
        {reading.finished_on && (
          <span className="rounded-xs bg-pill px-1.5 py-0.5 font-mono font-bold text-2xs uppercase tracking-label">
            terminou <time dateTime={reading.finished_on}>{formatDayMonth(reading.finished_on)}</time>
          </span>
        )}
      </div>
      <div className="flex gap-3">
        <BookCover title={book.title} url={book.cover_url} size="feed" decorative framed={false} className="border-thick border-primary" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="font-type font-normal text-sm leading-tight break-words">
            <Link to={`/livros/${book.id}`} className="no-underline hover:underline underline-offset-4">
              {book.title}
            </Link>
          </h2>
          {book.author && <p className="font-hand text-base leading-none">{book.author}</p>}
          <Stars value={average} size="md" label={average == null ? 'Sem nota' : undefined} />
          {reading.comment && <p className="font-hand text-sm leading-tight break-words">{reading.comment}</p>}
        </div>
      </div>
    </article>
  )
}
