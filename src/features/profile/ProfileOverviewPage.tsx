import { Link } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { StatTiles } from '@/components/ui/StatTiles'
import { Stars } from '@/components/ui/Stars'
import { HandText, Label, SectionTitle } from '@/components/ui/Typography'
import { useMyClubBooks } from '@/features/clubs/api'
import { clubBookPath } from '@/features/clubs/ClubReviewPage'
import { ClubBookGrid, ClubBookTile } from '@/features/clubs/components'
import { useShelf } from '@/features/shelf/api'
import { ShelfGrid, ShelfTag, ShelfTile } from '@/features/shelf/ShelfTile'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { formatEdition } from '@/lib/domain/clubs'
import { bookAverage, formatAverage, memberAverage } from '@/lib/domain/ratings'
import { formatCount } from '@/lib/domain/stats'
import { useProfile } from './api'

/** /perfil — quem é a leitora: números do ano, o que lê fora do clube e os livros que escolheu. */
export function ProfileOverviewPage() {
  const user = useCurrentUser()
  const { data: profile } = useProfile()
  const { data: shelf } = useShelf()
  const { data: clubBooks } = useMyClubBooks()
  const year = new Date().getFullYear()

  const clubBookIds = new Set(clubBooks?.map((b) => b.book.id))
  const readThisYear = shelf?.read.filter((r) => r.finished_on?.startsWith(String(year))) ?? []
  const average = bookAverage(readThisYear.map(memberAverage))
  const outside = shelf ? [...shelf.reading, ...shelf.read].filter((r) => !clubBookIds.has(r.book.id)) : []
  const mine = clubBooks?.filter((b) => b.proposed_by === user.id) ?? []

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-4">
        <Avatar name={profile?.name ?? ''} url={profile?.avatar_url} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="font-script font-normal text-5xl leading-none text-title">{profile?.name}</h1>
          {profile?.bio && <HandText>{profile.bio}</HandText>}
          {mine.length > 0 && (
            <Label className="text-2xs">escolheu {mine.map((b) => formatEdition(b.edition_number)).filter(Boolean).join(', ') || 'o livro atual'}</Label>
          )}
        </div>
      </header>

      <ButtonLink to="/perfil/editar" variant="outline">
        <Icon name="person" className="size-icon-sm" />
        Editar perfil
      </ButtonLink>

      <StatTiles
        label={`Seus números em ${year}`}
        items={[
          { value: formatCount(readThisYear.length), label: `lidos em ${year}` },
          { value: formatCount(readThisYear.filter((r) => clubBookIds.has(r.book.id)).length), label: 'do clube' },
          { value: average == null ? '–' : `${formatAverage(average)}★`, label: 'média' },
        ]}
      />

      <section className="flex flex-col gap-3" aria-labelledby="profile-outside">
        <SectionTitle>
          <span id="profile-outside">Fora do clube</span>
        </SectionTitle>
        <HandText className="-mt-1.5 text-center">enquanto isso, fora do clube…</HandText>
        {outside.length === 0 ? (
          <EmptyState>Os livros que você lê por conta própria aparecem aqui.</EmptyState>
        ) : (
          <ShelfGrid label="Livros fora do clube" count={outside.length}>
            {outside.map((r) => (
              <ShelfTile
                key={r.id}
                to={`/livros/${r.book.id}`}
                title={r.book.title}
                coverUrl={r.book.cover_url}
                footer={r.finished_on ? <Stars value={memberAverage(r)} size="sm" className="gap-px" /> : <ShelfTag>lendo</ShelfTag>}
              />
            ))}
          </ShelfGrid>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="profile-choices">
        <SectionTitle aside={mine.length || undefined}>
          <span id="profile-choices">Minhas escolhas</span>
        </SectionTitle>
        {mine.length === 0 ? (
          <EmptyState>
            Os livros que você propõe e o clube aprova aparecem aqui. <Link to="/clubes">Ir para os clubes</Link>
          </EmptyState>
        ) : (
          <ClubBookGrid label="Livros que escolhi para o clube">
            {mine.map((cb) => (
              <ClubBookTile
                key={cb.id}
                clubBook={cb}
                to={clubBookPath(cb.club_id, cb.id)}
                footer={<Label className="text-2xs">{formatEdition(cb.edition_number) || 'lendo'}</Label>}
              />
            ))}
          </ClubBookGrid>
        )}
      </section>
    </div>
  )
}
