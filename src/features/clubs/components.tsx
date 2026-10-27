import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { BookCover } from '@/components/ui/BookCover'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormMessage } from '@/components/ui/FormMessage'
import { Stars } from '@/components/ui/Stars'
import { HandText, Label } from '@/components/ui/Typography'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { proposalState } from '@/lib/domain/clubs'
import { useVote, useWithdrawProposal, type ClubBook, type ClubMember } from './api'

/** Capa do livro do clube com a média do clube e uma linha de rodapé. */
export function ClubBookTile({ clubBook, average, footer }: { clubBook: ClubBook; average?: number | null; footer?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Link to={`/livros/${clubBook.book.id}`} className="rounded-card" aria-label={clubBook.book.title}>
        <BookCover title={clubBook.book.title} url={clubBook.book.cover_url} size="md" decorative />
      </Link>
      {average !== undefined && <Stars value={average} size="sm" />}
      {footer}
    </div>
  )
}

export function ClubBookGrid({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul aria-label={label} className="grid grid-cols-3 gap-3 md:grid-cols-5">
      {children}
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
    <Card className="flex flex-col gap-3">
      <div className="flex gap-3">
        <BookCover title={clubBook.book.title} url={clubBook.book.cover_url} size="sm" decorative />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <h3 className="font-display text-title-sm uppercase leading-none text-primary">{clubBook.book.title}</h3>
          {clubBook.book.author && <p className="font-mono text-xs text-primary">{clubBook.book.author}</p>}
          {proposer && <HandText>Proposto por {proposer}</HandText>}
        </div>
      </div>
      <Label className="tracking-normal normal-case">
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
        <p className="font-sans text-sm text-primary">Você entrou no clube depois desta proposta e não vota nela.</p>
      )}
      {clubBook.proposed_by === user.id && (
        <button
          type="button"
          onClick={() => withdraw.mutate(clubBook.id)}
          className="self-start font-sans text-sm text-primary underline underline-offset-4"
        >
          Retirar proposta
        </button>
      )}
      {error && <FormMessage tone="error">{error}</FormMessage>}
    </Card>
  )
}
