import { useState, type ReactNode } from 'react'
import { useParams } from 'react-router'
import { Avatar, avatarOf, type AvatarSize } from '@/components/ui/Avatar'
import { BackLink } from '@/components/ui/BackLink'
import { FormMessage } from '@/components/ui/FormMessage'
import { SectionTitle } from '@/components/ui/Typography'
import { clubAwards, rankMembers, type RankingMode, type RankingRow } from '@/lib/domain/ranking'
import { formatAverage } from '@/lib/domain/ratings'
import { useClub, useClubYearReadings, type ClubMember } from './api'
import { clubPath } from './ClubsPage'

const MODES: { mode: RankingMode; label: string }[] = [
  { mode: 'books', label: 'livros lidos' },
  { mode: 'stars', label: 'média de estrelas' },
]

/** Lugar no pódio → altura da coluna e tamanho do avatar. */
const PODIUM = {
  1: { bar: 'h-podium-1', avatar: 'podium-1' },
  2: { bar: 'h-podium-2', avatar: 'podium-2' },
  3: { bar: 'h-podium-3', avatar: 'podium-3' },
} as const satisfies Record<number, { bar: string; avatar: AvatarSize }>

const firstName = (name: string) => name.split(/\s+/)[0] ?? name

/** /clubes/:clubId/ranking — ranking do ano entre os membros e os prêmios do clube. */
export function RankingPage() {
  const { clubId = '' } = useParams()
  const year = new Date().getFullYear()
  const [mode, setMode] = useState<RankingMode>('books')
  const { data: club, isLoading, isError } = useClub(clubId)
  const memberIds = club?.members.map((m) => m.user_id) ?? []
  const yearReadings = useClubYearReadings(clubId, memberIds, year)

  if (isLoading || yearReadings.isLoading) return <p className="font-serif italic text-lg text-primary">Contando os livros…</p>
  if (isError || !club) return <FormMessage tone="error">Clube não encontrado.</FormMessage>

  const readings = yearReadings.data ?? []
  const rows = rankMembers(memberIds, readings, year, mode)
  const memberOf = (userId: string) => club.members.find((m) => m.user_id === userId)!
  const show = (row: RankingRow) =>
    row.value == null ? '–' : mode === 'books' ? String(row.value) : `${formatAverage(row.value)}★`
  const clubBookIds = club.books.filter((b) => b.status === 'finished' || b.status === 'reading').map((b) => b.book.id)
  const awards = clubAwards(memberIds, readings, clubBookIds, year)
  // Pódio na ordem 2º, 1º, 3º.
  const podium = [rows[1], rows[0], rows[2]].filter((r): r is RankingRow => r != null)

  return (
    <div className="flex flex-col gap-3.5">
      <BackLink to={clubPath(club.id)}>clube</BackLink>
      <header className="flex items-center gap-2.5">
        <span className="rule" aria-hidden="true" />
        <h1 className="font-display italic font-semibold text-5xl leading-none text-primary">Ranking</h1>
        <span className=" -ml-1.5 font-sans font-semibold text-xs uppercase tracking-label">{year}</span>
        <span className="rule" aria-hidden="true" />
      </header>

      <div role="group" aria-label="Critério do ranking" className="grid grid-cols-2 gap-1 rounded-full border border-primary p-1">
        {MODES.map((m) => (
          <button
            key={m.mode}
            type="button"
            aria-pressed={mode === m.mode}
            onClick={() => setMode(m.mode)}
            className={
              'min-h-pill-h rounded-full font-sans font-semibold text-xs uppercase tracking-label ' +
              (mode === m.mode ? 'bg-primary text-inverse' : 'text-primary')
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      <ol aria-label="Pódio" className="bg-tag grid grid-cols-3 items-end gap-2 rounded-card border border-line px-3 pt-4">
        {podium.map((row) => {
          const place = PODIUM[row.position as 1 | 2 | 3] ?? PODIUM[3]
          const member = memberOf(row.userId)
          return (
            <li key={row.userId} className="flex flex-col items-center gap-1">
              <Avatar {...avatarOf(member.profile)} size={place.avatar} />
              <span className="rounded-sm bg-card px-1.5 font-display italic text-2xl leading-none">{firstName(member.profile.name)}</span>
              <div className={`flex w-full flex-col items-center rounded-t-card bg-primary pt-2 text-inverse ${place.bar}`}>
                <span className="font-display text-3xl leading-none">{show(row)}</span>
                <span className="font-sans font-semibold text-2xs uppercase tracking-label text-blush">{row.position}º lugar</span>
              </div>
            </li>
          )
        })}
      </ol>

      {rows.length > 3 && (
        <ol start={4} aria-label="Demais posições" className="flex flex-col gap-2">
          {rows.slice(3).map((row) => {
            const member = memberOf(row.userId)
            return (
              <li key={row.userId} className="flex items-center gap-3 rounded-card border border-primary bg-card px-3 py-2">
                <span className="w-5 font-display text-2xl text-primary">{row.position}</span>
                <Avatar {...avatarOf(member.profile)} size="xs" />
                <span className="flex-1 font-display italic text-primary-md leading-none">{firstName(member.profile.name)}</span>
                <span className="font-display text-2xl">{show(row)}</span>
              </li>
            )
          })}
        </ol>
      )}

      <section className="flex flex-col gap-2" aria-labelledby="club-awards">
        <SectionTitle>
          <span id="club-awards">Prêmios do clube</span>
        </SectionTitle>
        <ul className="grid grid-cols-3 gap-2">
          <AwardCard title="maratonista" member={awards.marathoner && memberOf(awards.marathoner.userId)}>
            {awards.marathoner && `${awards.marathoner.count} ${awards.marathoner.count === 1 ? 'livro' : 'livros'} fora do clube`}
          </AwardCard>
          <AwardCard title="mão aberta" member={awards.openHand && memberOf(awards.openHand.userId)}>
            {awards.openHand && `${awards.openHand.count}× 5★ no clube`}
          </AwardCard>
          <AwardCard title="crítica oficial" member={awards.critic && memberOf(awards.critic.userId)}>
            {awards.critic && `menor média: ${formatAverage(awards.critic.average)}★`}
          </AwardCard>
        </ul>
      </section>
    </div>
  )
}

function AwardCard({ title, member, children }: { title: string; member: ClubMember | null; children: ReactNode }) {
  return (
    <li className="flex flex-col items-center gap-1 rounded-card border border-primary bg-card px-1.5 py-2.5 text-center">
      {member ? (
        <Avatar {...avatarOf(member.profile)} size="xs" />
      ) : (
        <span aria-hidden="true" className="size-avatar-xs rounded-full border border-dashed border-border" />
      )}
      <span className="rounded-xs bg-tag px-1 font-sans font-semibold text-2xs uppercase tracking-label">{title}</span>
      <span className="font-serif italic text-sm leading-tight">
        {member ? (
          <>
            <span className="sr-only">{member.profile.name}: </span>
            {children}
          </>
        ) : (
          'ninguém ainda'
        )}
      </span>
    </li>
  )
}
