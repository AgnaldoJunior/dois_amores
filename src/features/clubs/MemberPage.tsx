import { Link, useParams } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { BookCover } from '@/components/ui/BookCover'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { Stars } from '@/components/ui/Stars'
import { HandText, Label, SectionTitle } from '@/components/ui/Typography'
import { useBackgroundEnrichment } from '@/lib/books/useBackgroundEnrichment'
import { memberStats } from '@/lib/domain/clubs'
import { formatAverage, memberAverage } from '@/lib/domain/ratings'
import { formatCount } from '@/lib/domain/stats'
import { useMemberProfile } from './api'
import { clubPath } from './ClubsPage'
import { ClubBookGrid } from './components'

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card className="flex flex-1 flex-col gap-1 p-3 text-center">
      <span className="font-display text-4xl leading-none text-primary">{value}</span>
      <Label className="text-2xs tracking-normal">{label}</Label>
    </Card>
  )
}

/** /clubes/:clubId/membros/:userId — resumo do membro (Figma 10). */
export function MemberPage() {
  const { clubId = '', userId = '' } = useParams()
  const { data, isLoading, isError } = useMemberProfile(userId)
  useBackgroundEnrichment(data?.readings.map((r) => r.book))

  if (isLoading) return <p className="font-hand text-lg text-primary">Carregando…</p>
  if (isError || !data) return <FormMessage tone="error">Membro não encontrado.</FormMessage>

  const stats = memberStats(data.readings)
  const finished = data.readings.filter((r) => r.finished_on)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <Avatar name={data.profile.name} url={data.profile.avatar_url} size="lg" />
      </div>
      <h1 className="text-center font-script text-4xl leading-tight text-primary">{data.profile.name}</h1>
      {data.profile.bio && <HandText className="text-center">{data.profile.bio}</HandText>}

      <section aria-label="Dados literários" className="flex gap-2">
        <Stat value={formatCount(stats.booksRead)} label="Lidos" />
        <Stat value={formatCount(stats.pagesRead)} label="Páginas" />
        <Stat value={stats.average == null ? '–' : formatAverage(stats.average)} label="Média" />
      </section>

      <SectionTitle>Livros</SectionTitle>
      {finished.length === 0 ? (
        <EmptyState>Nenhum livro terminado ainda.</EmptyState>
      ) : (
        <ClubBookGrid label={`Livros de ${data.profile.name}`}>
          {finished.map((r) => (
            <li key={r.book_id} className="flex flex-col gap-1.5">
              <Link to={`/livros/${r.book.id}`} aria-label={r.book.title} className="rounded-card">
                <BookCover title={r.book.title} url={r.book.cover_url} size="md" decorative />
              </Link>
              <Stars value={memberAverage(r)} size="sm" />
            </li>
          ))}
        </ClubBookGrid>
      )}

      <Link to={clubPath(clubId)} className="self-center font-sans text-sm text-primary underline underline-offset-4">
        Voltar para o clube
      </Link>
    </div>
  )
}
