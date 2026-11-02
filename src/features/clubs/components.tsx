import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { BookCover } from '@/components/ui/BookCover'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormMessage } from '@/components/ui/FormMessage'
import { Stars } from '@/components/ui/Stars'
import { HandText, Label } from '@/components/ui/Typography'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { proposalState } from '@/lib/domain/clubs'
import { useVote, useWithdrawProposal, type ClubBook, type ClubMember } from './api'

/** Livro do clube de pé na prateleira: capa, tábua e, embaixo, nota e edição. */
export function ClubBookTile({ clubBook, to, average, footer }: { clubBook: { book: { id: string; title: string; cover_url: string | null } }; to?: string; average?: number | null; footer?: ReactNode }) {
  return (
    <li className="flex shrink-0 flex-col justify-end">
      <Link to={to ?? `/livros/${clubBook.book.id}`} className="relative z-1 block px-1" aria-label={clubBook.book.title}>
        <BookCover title={clubBook.book.title} url={clubBook.book.cover_url} size="feed" decorative framed={false} className="shadow-spine" />
      </Link>
      <span aria-hidden="true" className="plank -mt-0.5 rounded-none" />
      <div className="flex flex-col items-center gap-0.5 px-1 pt-1">
        {average !== undefined && <Stars value={average} size="xs" className="gap-px" />}
        {footer}
      </div>
    </li>
  )
}

/** Prateleira horizontal (rola de lado quando não cabe); a tábua continua até o fim da linha. */
export function ClubBookGrid({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul aria-label={label} className="flex items-stretch overflow-x-auto pb-1">
      {children}
      <li aria-hidden="true" className="flex min-w-4 flex-1 flex-col justify-end">
        <span className="plank rounded-none" />
        <span className="min-h-star-lg" />
      </li>
    </ul>
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
    <Card className="flex flex-col gap-3 p-3">
      <div className="flex gap-3">
        <BookCover title={clubBook.book.title} url={clubBook.book.cover_url} size="stamp" stamp decorative />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <h3 className="font-type font-normal text-md leading-tight">{clubBook.book.title}</h3>
          {clubBook.book.author && <p className="font-hand text-md leading-none">{clubBook.book.author}</p>}
          {proposer && <HandText className="text-accentStrong">Proposto por {proposer}</HandText>}
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
                  'flex items-center gap-1 rounded-full border border-primary py-0.5 pr-2 pl-0.5 font-hand text-sm ' +
                  (v?.approved ? 'bg-primary text-inverse' : 'bg-page')
                }
              >
                <Avatar name={m.profile.name} url={m.profile.avatar_url} size="xs" border="thin" />
                <span>{m.profile.name.split(/\s+/)[0]}</span>
                <span aria-hidden="true" className="font-mono font-bold">{mark}</span>
                <span className="sr-only">{label}</span>
              </li>
            )
          })}
      </ul>
      <Label className="text-2xs">
        {state.approved} de {state.total} {state.total === 1 ? 'membro aprovou' : 'membros aprovaram'}
      </Label>

      {state.canVote && (
        <div className="grid grid-cols-2 gap-3" role="group" aria-label={`Votar em ${clubBook.book.title}`}>
          <Button
            variant={state.myVote === true ? 'primary' : 'outline'}
            aria-pressed={state.myVote === true}
            loading={vote.isPending && vote.variables?.approved === true}
            onClick={() => cast(true)}
          >
            APROVAR
          </Button>
          <Button
            variant={state.myVote === false ? 'danger' : 'outline'}
            aria-pressed={state.myVote === false}
            loading={vote.isPending && vote.variables?.approved === false}
            onClick={() => cast(false)}
          >
            RECUSAR
          </Button>
        </div>
      )}
      {!state.canVote && (
        <p className="font-hand text-md">Você entrou no clube depois desta proposta e não vota nela.</p>
      )}
      {clubBook.proposed_by === user.id && (
        <button
          type="button"
          onClick={() => withdraw.mutate(clubBook.id)}
          className="self-start font-hand text-md text-primary underline underline-offset-4"
        >
          Retirar proposta
        </button>
      )}
      {error && <FormMessage tone="error">{error}</FormMessage>}
    </Card>
  )
}
