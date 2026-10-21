/**
 * Aprovação de livro proposto ao clube. Espelha public.evaluate_club_book
 * (supabase/migrations/*_functions.sql) — mantenha as duas em sincronia.
 *
 *  - votam os membros que já estavam no clube quando o livro foi proposto;
 *  - uma reprovação → 'rejected';
 *  - todos os elegíveis aprovaram → 'reading';
 *  - senão continua 'pending'.
 */
export type ProposalStatus = 'pending' | 'reading' | 'rejected'

export type Vote = { userId: string; approved: boolean }

export type ProposalInput = {
  eligibleMemberIds: string[]
  votes: Vote[]
}

export function evaluateProposal({ eligibleMemberIds, votes }: ProposalInput): ProposalStatus {
  const eligible = new Set(eligibleMemberIds)
  const counted = votes.filter((v) => eligible.has(v.userId))

  if (counted.some((v) => !v.approved)) return 'rejected'

  const approvedBy = new Set(counted.filter((v) => v.approved).map((v) => v.userId))
  if (eligible.size > 0 && approvedBy.size === eligible.size) return 'reading'

  return 'pending'
}

/** Progresso para exibir "3 de 4 membros aprovaram". */
export function approvalProgress({ eligibleMemberIds, votes }: ProposalInput) {
  const eligible = new Set(eligibleMemberIds)
  const approved = new Set(votes.filter((v) => v.approved && eligible.has(v.userId)).map((v) => v.userId))
  return { approved: approved.size, total: eligible.size }
}

/** Membros elegíveis: entraram no clube até o momento da proposta. */
export function eligibleMembers(
  members: { userId: string; joinedAt: string }[],
  proposedAt: string,
): string[] {
  const proposed = Date.parse(proposedAt)
  return members.filter((m) => Date.parse(m.joinedAt) <= proposed).map((m) => m.userId)
}
