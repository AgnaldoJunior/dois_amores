import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Avatar, avatarOf } from '@/components/ui/Avatar'
import { BookCover } from '@/components/ui/BookCover'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormMessage } from '@/components/ui/FormMessage'
import { Stars } from '@/components/ui/Stars'
import { Label } from '@/components/ui/Typography'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { proposalState } from '@/lib/domain/clubs'
import { useVote, useWithdrawProposal, type ClubBook, type ClubMember } from './api'

/** Livro do clube na prateleira: capa de pé, nota e edição embaixo. */
export function ClubBookTile({
  clubBook,
  to,
  average,
  footer,
}: {
  clubBook: { book: { id: string; title: string; cover_url: string | null } }
  to?: string
  average?: number | null
  footer?: ReactNode
}) {
  return (
    <li className="flex w-cover-feed-w shrink-0 flex-col items-center gap-1.5">
      <Link to={to ?? `/livros/${clubBook.book.id}`} className="block" aria-label={clubBook.book.title}>
        <BookCover title={clubBook.book.title} url={clubBook.book.cover_url} size="feed" decorative />
      </Link>
      {average !== undefined && <Stars value={average} size="xs" className="gap-px" />}
      {footer}
    </li>
  )
}

/** Prateleira horizontal (rola de lado quando não cabe) com a tábua embaixo das capas. */
export function ClubBookGrid({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <ul aria-label={label} className="no-scrollbar -mx-6 flex items-start gap-3 overflow-x-auto px-6 pb-1">
        {children}
      </ul>
    </div>
  )
}

/** Proposta aguardando aprovação (Figma 11): quem propôs, andamento e votos. */
export function ProposalCard({ clubBook, members }: { clubBook: ClubBook; members: ClubMember[] }) {
  const user = useCurrentUser()
  const vote = useVote()
  const withdraw = useWithdrawProposal()
  const [error, setError] = useState('')
  const state = proposalState(clubBook, members, user.id)
  const proposer = members.find((m) => m.user_id === clubBook.proposed_by)?.profile.name

  async function cast(approved: boolean) {
    setError('')
    try {
      await vote.mutateAsync({ clubBookId: clubBook.id, approved })
    } catch {
      setError('Não foi possível registrar o voto. Tente de novo.')
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-3.5">
      <div className="flex gap-3.5">
        <BookCover title={clubBook.book.title} url={clubBook.book.cover_url} size="feed" decorative />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          {proposer && <Label className="text-primary">sugerido por {proposer.split(/\s+/)[0]?.toLowerCase()}</Label>}
          <h3 className="m-0 font-display italic font-semibold text-xl leading-tight">{clubBook.book.title}</h3>
          {clubBook.book.author && <p className="m-0 font-serif italic text-sm text-muted">{clubBook.book.author}</p>}
          {proposer && <span className="sr-only">Proposto por {proposer}</span>}
        </div>
      </div>
      <ul aria-label="Votos" className="flex flex-wrap gap-1.5">
        {members
          .filter((m) => state.eligible.includes(m.user_id))
          .map((m) => {
            const v = clubBook.votes.find((x) => x.user_id === m.user_id)
            const mark = v == null ? '…' : v.approved ? '✓' : '✗'
            const label = v == null ? 'ainda não votou' : v.approved ? 'aprovou' : 'recusou'
            return (
              <li
                key={m.user_id}
                className={
                  'flex items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-0.5 font-sans text-xs font-semibold ' +
                  (v?.approved ? 'border-primary bg-primary text-inverse' : 'border-border bg-card text-ink')
                }
              >
                <Avatar {...avatarOf(m.profile)} size="xs" />
                <span>{m.profile.name.split(/\s+/)[0]}</span>
                <span aria-hidden="true">{mark}</span>
                <span className="sr-only">{label}</span>
              </li>
            )
          })}
      </ul>
      <Label>
        {state.approved} de {state.total} {state.total === 1 ? 'membro aprovou' : 'membros aprovaram'}
      </Label>

      {state.canVote && (
        <div className="grid grid-cols-2 gap-3" role="group" aria-label={`Votar em ${clubBook.book.title}`}>
          <Button
            size="sm"
            variant={state.myVote === true ? 'primary' : 'outline'}
            aria-pressed={state.myVote === true}
            loading={vote.isPending && vote.variables?.approved === true}
            onClick={() => cast(true)}
          >
            votar ♡
          </Button>
          <Button
            size="sm"
            variant={state.myVote === false ? 'danger' : 'outline'}
            aria-pressed={state.myVote === false}
            loading={vote.isPending && vote.variables?.approved === false}
            onClick={() => cast(false)}
          >
            recusar
          </Button>
        </div>
      )}
      {!state.canVote && (
        <p className="m-0 font-serif italic text-md text-muted">Você entrou no clube depois desta proposta e não vota nela.</p>
      )}
      {clubBook.proposed_by === user.id && (
        <button
          type="button"
          onClick={() => withdraw.mutate(clubBook.id)}
          className="min-h-11 self-start font-sans text-sm font-semibold text-primary"
        >
          retirar sugestão
        </button>
      )}
      {error && <FormMessage tone="error">{error}</FormMessage>}
    </Card>
  )
}
