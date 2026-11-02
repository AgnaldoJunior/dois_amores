import { Link, useLocation } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { ButtonLink } from '@/components/ui/Button'
import { BookCover } from '@/components/ui/BookCover'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { Stars } from '@/components/ui/Stars'
import { StatTiles } from '@/components/ui/StatTiles'
import { BookTitle, HandText, Label, SectionTitle } from '@/components/ui/Typography'
import { formatDayMonth } from '@/lib/dates'
import { formatEdition } from '@/lib/domain/clubs'
import { memberAverage } from '@/lib/domain/ratings'
import { formatCount } from '@/lib/domain/stats'
import { useMyClubBooks, useMyClubs } from '@/features/clubs/api'
import { clubBookPath } from '@/features/clubs/ClubReviewPage'
import { clubPath } from '@/features/clubs/ClubsPage'
import { useProfile } from '@/features/profile/api'
import { useMyStats, useRecentReadings, type Reading } from '@/features/readings/api'
import { ProgressCard } from '@/features/readings/ProgressCard'
import { useShelf } from '@/features/shelf/api'

/** "Lendo agora": leituras em andamento com a barra de progresso. */
function ReadingNow() {
  const { data: shelf } = useShelf()
  const reading = shelf?.reading ?? []
  if (reading.length === 0) return null
  return (
    <section className="flex flex-col gap-2.5" aria-labelledby="reading-now">
      <SectionTitle>
        <span id="reading-now">Lendo agora</span>
      </SectionTitle>
      <ul className="flex flex-col gap-2.5">
        {reading.map((r) => (
          <li key={r.id}>
            <ProgressCard reading={r} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Ingresso verde com o livro que cada clube está lendo agora, e o atalho para o ranking. */
function ClubNow() {
  const { data: books } = useMyClubBooks()
  const { data: clubs } = useMyClubs()
  const reading = books?.filter((b) => b.status === 'reading') ?? []
  if (reading.length === 0) return null
  const multi = (clubs?.length ?? 0) > 1
  return (
    <ul aria-label="Leituras dos clubes" className="flex flex-col gap-2">
      {reading.map((cb) => {
        const club = clubs?.find((c) => c.id === cb.club_id)
        const label = ['no clube agora', multi && club?.name, formatEdition(cb.edition_number)].filter(Boolean).join(' · ')
        return (
          <li key={cb.id} className="flex flex-col gap-1">
            <Link
              to={clubBookPath(cb.club_id, cb.id)}
              className="ticket flex items-center gap-3 bg-primary px-7 py-3 text-inverse no-underline hover:text-inverse"
            >
              <BookCover title={cb.book.title} url={cb.book.cover_url} size="xs" decorative framed={false} className="tilt-l2 border-thick border-inverse" />
              <span className="flex min-w-0 flex-col">
                <span className="font-mono font-bold text-2xs uppercase tracking-label text-pill">{label}</span>
                <span className="font-display text-xl leading-none">{cb.book.title}</span>
              </span>
            </Link>
            <Link to={`${clubPath(cb.club_id)}/ranking`} className="self-end font-hand text-md underline underline-offset-4">
              ver o ranking do clube
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

const count = (n: number | undefined) => (n === undefined ? '–' : formatCount(n))

function RecentReading({ reading }: { reading: Reading }) {
  const average = memberAverage(reading)
  return (
    <Link to={`/livros/${reading.book.id}`} className="flex gap-3.5 rounded-card border border-primary bg-card p-3 no-underline">
      <BookCover title={reading.book.title} url={reading.book.cover_url} size="stamp" stamp decorative />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <BookTitle>{reading.book.title}</BookTitle>
        {reading.book.author && <span className="font-hand text-md leading-none">{reading.book.author}</span>}
        {reading.finished_on ? (
          <>
            <Stars value={average} size="md" />
            <Label className="text-2xs">terminou em {formatDayMonth(reading.finished_on)}</Label>
          </>
        ) : (
          <Label className="text-2xs">Em andamento</Label>
        )}
        {reading.comment && <HandText>“{reading.comment}”</HandText>}
      </div>
    </Link>
  )
}

export function HomePage() {
  const location = useLocation()
  const flash = (location.state as { flash?: string } | null)?.flash
  const { data: profile } = useProfile()
  const { data: stats } = useMyStats()
  const { data: recent, isLoading: recentLoading } = useRecentReadings()
  const firstName = profile?.name.split(/\s+/)[0] ?? ''

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <Label className="text-xs">dois amores · clube do livro</Label>
          <h1 className="font-hand font-normal text-4xl leading-tight">{firstName ? `Olá, ${firstName}!` : 'Olá!'}</h1>
        </div>
        <Link to="/perfil" aria-label="Abrir meu perfil" className="rounded-full">
          <Avatar name={profile?.name ?? ''} url={profile?.avatar_url} size="md" />
        </Link>
      </header>

      {flash && <FormMessage tone="success">{flash}</FormMessage>}

      <StatTiles
        label="Suas estatísticas"
        items={[
          { value: count(stats?.booksRead), label: 'Livros lidos' },
          { value: count(stats?.pagesRead), label: 'Páginas lidas' },
          { value: count(stats?.clubs), label: stats?.clubs === 1 ? 'Clube' : 'Clubes' },
        ]}
      />

      <ButtonLink to="/publicar">
        <Icon name="plus" className="size-icon-sm" />
        Publicar nova leitura
      </ButtonLink>

      <ReadingNow />

      <ClubNow />

      <section className="flex flex-col gap-2.5">
        <SectionTitle>Leituras recentes</SectionTitle>
        {!recentLoading && (!recent || recent.length === 0) ? (
          <EmptyState>Suas leituras vão aparecer aqui.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {recent?.map((r) => (
              <li key={r.id}>
                <RecentReading reading={r} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
