import { useState } from 'react'
import { useParams } from 'react-router'
import { Field, ReviewCard } from '@/components/ReviewCard'
import { Avatar, avatarOf } from '@/components/ui/Avatar'
import { BackLink } from '@/components/ui/BackLink'
import { BookCover } from '@/components/ui/BookCover'
import { ButtonLink } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { Stars } from '@/components/ui/Stars'
import { Label } from '@/components/ui/Typography'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { formatMonthYear } from '@/lib/dates'
import { clubBookAverage, formatEdition } from '@/lib/domain/clubs'
import { formatAverage, memberAverage } from '@/lib/domain/ratings'
import { formatCount } from '@/lib/domain/stats'
import { withPet } from '@/lib/pets'
import { useClub, type ClubBook, type ClubMember, type ClubReading } from './api'
import { clubPath } from './ClubsPage'

export const clubBookPath = (clubId: string, clubBookId: string) => `${clubPath(clubId)}/livros/${clubBookId}`

const firstName = (name: string) => name.split(/\s+/)[0] ?? name

/** /clubes/:clubId/livros/:clubBookId — "Book Review": a ficha de cada membro para o livro do clube. */
export function ClubReviewPage() {
  const { clubId = '', clubBookId = '' } = useParams()
  const { data: club, isLoading, isError } = useClub(clubId)

  if (isLoading) return <p className="font-hand text-lg text-primary">Abrindo as reviews…</p>
  const clubBook = club?.books.find((b) => b.id === clubBookId)
  if (isError || !club || !clubBook) return <FormMessage tone="error">Livro do clube não encontrado.</FormMessage>

  const memberIds = club.members.map((m) => m.user_id)
  const readings = club.readings.filter((r) => r.book_id === clubBook.book.id)
  return <Review clubId={club.id} clubBook={clubBook} members={club.members} readings={readings} average={clubBookAverage(clubBook.book.id, readings, memberIds)} />
}

type ReviewProps = {
  clubId: string
  clubBook: ClubBook
  members: ClubMember[]
  readings: ClubReading[]
  average: number | null
}

function Review({ clubId, clubBook, members, readings, average }: ReviewProps) {
  const user = useCurrentUser()
  const readingOf = (userId: string) => readings.find((r) => r.user_id === userId)
  const [selected, setSelected] = useState(() => (readingOf(user.id) ? user.id : (members.find((m) => readingOf(m.user_id))?.user_id ?? user.id)))
  const member = members.find((m) => m.user_id === selected) ?? members[0]!
  const reading = readingOf(member.user_id)
  const book = clubBook.book
  const when = formatMonthYear(clubBook.started_on ?? clubBook.finished_on)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <BackLink to={clubPath(clubId)}>clube</BackLink>
        <div className="tilt-l2 flex flex-col items-end font-mono font-bold text-xs uppercase leading-tight tracking-label">
          {when && <span>{when}</span>}
          {clubBook.edition_number != null && <span className="text-accentStrong">{formatEdition(clubBook.edition_number)}</span>}
        </div>
      </div>

      <header className="-mt-1.5 flex items-end gap-3">
        <BookCover title={book.title} url={book.cover_url} size="stamp" stamp decorative />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="font-script text-5xl leading-none text-title" aria-hidden="true">
            Book Review
          </p>
          <h1 className="self-start rounded-pill bg-pill px-2.5 py-1 font-type font-normal text-sm uppercase leading-tight">
            {book.title}
          </h1>
          <div className="flex items-center gap-1.5">
            <Stars value={average} size="md" />
            <Label className="text-2xs">{average == null ? 'sem notas ainda' : `${formatAverage(average)} · média do clube`}</Label>
          </div>
        </div>
      </header>

      <div role="tablist" aria-label="Reviews por membro" className="flex gap-1.5">
        {members.map((m) => {
          const on = m.user_id === member.user_id
          return (
            <button
              key={m.user_id}
              type="button"
              role="tab"
              id={`tab-${m.user_id}`}
              aria-selected={on}
              aria-controls="review-panel"
              onClick={() => setSelected(m.user_id)}
              className={
                'flex min-h-11 min-w-0 flex-1 items-center gap-1.5 rounded-full border border-primary py-1 pr-1.5 pl-1 ' +
                (on ? 'bg-primary text-inverse' : 'bg-page text-primary')
              }
            >
              <Avatar {...avatarOf(m.profile)} size="xs" border="thin" />
              <span className="truncate font-hand text-sm">{withPet(firstName(m.profile.name), m.profile.pet)}</span>
            </button>
          )
        })}
      </div>

      <div id="review-panel" role="tabpanel" aria-labelledby={`tab-${member.user_id}`}>
        {reading ? (
          <ReviewCard
            title={firstName(member.profile.name)}
            review={reading}
            extraFields={
              <div className="grid grid-cols-2 gap-1.5">
                <Field label="autor">{book.author ?? '—'}</Field>
                <Field label="nº págs">{book.pages ? formatCount(book.pages) : '—'}</Field>
              </div>
            }
          />
        ) : (
          <PendingReview member={member} isMe={member.user_id === user.id} bookId={book.id} bookTitle={book.title} others={readings} />
        )}
      </div>
    </div>
  )
}

function PendingReview({ member, isMe, bookId, bookTitle, others }: { member: ClubMember; isMe: boolean; bookId: string; bookTitle: string; others: ClubReading[] }) {
  const given = others
    .map(memberAverage)
    .filter((v): v is number => v != null)
    .map((v) => formatAverage(v).replace(/,0$/, ''))
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-card border border-dashed border-primary bg-card px-5 py-7 text-center">
      <p className="font-script text-4xl leading-none text-title">{firstName(member.profile.name)}</p>
      <p className="font-hand text-lg leading-tight">
        {isMe ? `sua review de ${bookTitle} ainda está em branco…` : `${firstName(member.profile.name)} ainda não escreveu a review de ${bookTitle}.`}
      </p>
      {given.length > 0 && (
        <Label className="text-2xs">
          {isMe ? 'as amigas já deram' : 'o clube já deu'} {joinPt(given)} {given.length === 1 && given[0] === '1' ? 'estrela' : 'estrelas'}
        </Label>
      )}
      {isMe && (
        <ButtonLink to={`/publicar?livro=${bookId}`} fullWidth={false}>
          escrever minha review
        </ButtonLink>
      )}
    </div>
  )
}

/** ["4", "4", "3"] → "4, 4 e 3" */
export const joinPt = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`
