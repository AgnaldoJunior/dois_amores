import { useParams } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { Stars } from '@/components/ui/Stars'
import { StatTiles } from '@/components/ui/StatTiles'
import { HandText, Label, SectionTitle } from '@/components/ui/Typography'
import { useBackgroundEnrichment } from '@/lib/books/useBackgroundEnrichment'
import { formatEdition, memberStats } from '@/lib/domain/clubs'
import { formatAverage, memberAverage } from '@/lib/domain/ratings'
import { formatCount } from '@/lib/domain/stats'
import { useClub, useMemberProfile } from './api'
import { clubPath } from './ClubsPage'
import { ShelfGrid, ShelfTile } from '@/features/shelf/ShelfTile'

/** /clubes/:clubId/membros/:userId — resumo do membro (Figma 10). */
export function MemberPage() {
  const { clubId = '', userId = '' } = useParams()
  const { data, isLoading, isError } = useMemberProfile(userId)
  const { data: club } = useClub(clubId)
  useBackgroundEnrichment(data?.readings.map((r) => r.book))

  if (isLoading) return <p className="font-hand text-lg text-primary">Carregando…</p>
  if (isError || !data) return <FormMessage tone="error">Membro não encontrado.</FormMessage>

  const stats = memberStats(data.readings)
  const finished = data.readings.filter((r) => r.finished_on)
  const chosen = (club?.books ?? [])
    .filter((b) => b.proposed_by === userId && b.edition_number != null)
    .map((b) => b.edition_number!)
    .sort((a, b) => a - b)

  return (
    <div className="flex flex-col gap-4">
      <BackLink to={clubPath(clubId)}>clube</BackLink>
      <header className="flex items-center gap-4">
        <Avatar name={data.profile.name} url={data.profile.avatar_url} size="lg" />
        <div className="flex min-w-0 flex-col">
          <h1 className="font-script font-normal text-5xl leading-none text-title">
            {data.profile.name}
            {data.profile.pet && <span aria-hidden="true" className="ml-2 font-sans text-3xl">{data.profile.pet}</span>}
          </h1>
          {data.profile.bio && <HandText>{data.profile.bio}</HandText>}
          {chosen.length > 0 && (
            <Label className="text-2xs">
              escolheu {formatEdition(chosen[0])}
              {chosen.length > 1 && `, ${chosen.slice(1).map((n) => String(n).padStart(2, '0')).join(', ')}`}
            </Label>
          )}
        </div>
      </header>

      <StatTiles
        label="Dados literários"
        items={[
          { value: formatCount(stats.booksRead), label: 'Lidos' },
          { value: formatCount(stats.pagesRead), label: 'Páginas' },
          { value: stats.average == null ? '–' : formatAverage(stats.average), label: 'Média' },
        ]}
      />

      <section className="flex flex-col gap-3" aria-labelledby="member-shelf">
        <SectionTitle aside={finished.length || undefined}>
          <span id="member-shelf">Estante</span>
        </SectionTitle>
        {finished.length === 0 ? (
          <EmptyState>Nenhum livro terminado ainda.</EmptyState>
        ) : (
          <ShelfGrid label={`Livros de ${data.profile.name}`} count={finished.length}>
            {finished.map((r) => (
              <ShelfTile
                key={r.book_id}
                to={`/livros/${r.book.id}`}
                title={r.book.title}
                coverUrl={r.book.cover_url}
                footer={<Stars value={memberAverage(r)} size="sm" className="gap-px" />}
              />
            ))}
          </ShelfGrid>
        )}
      </section>
    </div>
  )
}
