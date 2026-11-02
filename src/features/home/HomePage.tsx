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
import { memberAverage } from '@/lib/domain/ratings'
import { formatCount } from '@/lib/domain/stats'
import { useProfile } from '@/features/profile/api'
import { useMyStats, useRecentReadings, type Reading } from '@/features/readings/api'

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
