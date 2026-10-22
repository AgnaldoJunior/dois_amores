import { Link, useLocation } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { Stars } from '@/components/ui/Stars'
import { HandText, Label, ScriptTitle, SectionTitle } from '@/components/ui/Typography'
import { memberAverage } from '@/lib/domain/ratings'
import { formatCount } from '@/lib/domain/stats'
import { useProfile } from '@/features/profile/api'
import { useMyStats, useRecentReadings, type Reading } from '@/features/readings/api'

function StatCard({ value, label }: { value: number | undefined; label: string }) {
  return (
    <Card className="flex-1 p-3 text-center flex flex-col gap-1">
      <span className="font-display text-5xl leading-none text-primary">
        {value === undefined ? '–' : formatCount(value)}
      </span>
      <Label className="text-2xs tracking-normal">{label}</Label>
    </Card>
  )
}

function RecentReading({ reading }: { reading: Reading }) {
  const average = memberAverage(reading)
  return (
    <Link to={`/leituras/${reading.id}/editar`} className="block">
      <Card className="flex flex-col gap-1.5">
        <p className="font-sans text-base text-primary">
          {[reading.book.title, reading.book.author].filter(Boolean).join(' · ')}
        </p>
        {reading.finished_on ? (
          <Stars value={average} size="md" />
        ) : (
          <Label className="text-2xs">Em andamento</Label>
        )}
        {reading.comment && <HandText>{reading.comment}</HandText>}
      </Card>
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
      <Link to="/perfil" className="flex items-center gap-3 self-start" aria-label="Abrir meu perfil">
        <Avatar name={profile?.name ?? ''} url={profile?.avatar_url} size="md" />
        <ScriptTitle>{firstName ? `Olá, ${firstName}` : 'Olá!'}</ScriptTitle>
      </Link>

      {flash && <FormMessage tone="success">{flash}</FormMessage>}

      <section aria-label="Suas estatísticas" className="flex gap-2">
        <StatCard value={stats?.booksRead} label="Livros lidos" />
        <StatCard value={stats?.pagesRead} label="Páginas lidas" />
        <StatCard value={stats?.clubs} label="Clubes" />
      </section>

      <ButtonLink to="/publicar" className="text-base">
        PUBLICAR NOVA LEITURA
      </ButtonLink>

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
    </div>
  )
}
