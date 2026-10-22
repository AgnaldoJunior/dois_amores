import { BookCover } from '@/components/ui/BookCover'
import { Card } from '@/components/ui/Card'
import { Stars } from '@/components/ui/Stars'
import { formatDateShort } from '@/lib/dates'
import { memberAverage } from '@/lib/domain/ratings'
import type { FeedPost } from './api'

/** Card do feed (Figma 03): nome cursivo, título, autor, nota média, data e comentário. */
export function PostCard({ post }: { post: FeedPost }) {
  const reading = post.reading
  const book = reading?.book
  if (!reading || !book) return null
  const average = memberAverage(reading)
  const name = post.author?.name || 'Alguém'

  return (
    <Card className="flex gap-3">
      <BookCover title={book.title} url={book.cover_url} size="sm" decorative />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="font-script text-title-sm leading-tight text-primary">{name}</p>
        <h2 className="font-display text-title-md uppercase leading-none text-primary break-words">{book.title}</h2>
        {book.author && <p className="font-mono text-xs uppercase text-primary">{book.author}</p>}
        <Stars value={average} size="post" label={average == null ? 'Sem nota' : undefined} />
        {reading.finished_on && (
          <p className="font-mono text-xs text-primary">
            <span className="sr-only">Terminou em </span>
            <time dateTime={reading.finished_on}>{formatDateShort(reading.finished_on)}</time>
          </p>
        )}
        {reading.comment && <p className="font-hand text-lg leading-tight text-primary break-words">{reading.comment}</p>}
      </div>
    </Card>
  )
}
