import { approvalProgress, eligibleMembers } from './clubApproval'
import { bookAverage, memberAverage, type Ranks } from './ratings'

export type ClubBookStatus = 'pending' | 'reading' | 'finished' | 'rejected'

export type ClubBookLike = {
  id: string
  status: ClubBookStatus
  created_at: string
  edition_number: number | null
  finished_on: string | null
  started_on: string | null
  book: { id: string }
  votes: { user_id: string; approved: boolean }[]
}

export type MemberLike = { user_id: string; joined_at: string }

export type ReadingLike = Ranks & {
  user_id: string
  book_id: string
  started_on: string
  finished_on: string | null
  pages?: number | null
}

/** Prateleiras do clube: em andamento (início mais recente), concluídos (edição mais recente) e propostas (mais antigas primeiro). */
export function groupClubBooks<T extends ClubBookLike>(books: T[]) {
  const byDesc = (a: string | null, b: string | null) => (b ?? '').localeCompare(a ?? '')
  return {
    reading: books.filter((b) => b.status === 'reading').sort((a, b) => byDesc(a.started_on, b.started_on)),
    finished: books
      .filter((b) => b.status === 'finished')
      .sort((a, b) => (b.edition_number ?? 0) - (a.edition_number ?? 0)),
    pending: books.filter((b) => b.status === 'pending').sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }
}

/**
 * Média do livro no clube: média das médias dos membros atuais que avaliaram
 * (mesma regra da revista; ver bookAverage em ratings.ts).
 */
export function clubBookAverage(bookId: string, readings: ReadingLike[], memberIds: string[]): number | null {
  const members = new Set(memberIds)
  return bookAverage(
    readings.filter((r) => r.book_id === bookId && members.has(r.user_id)).map((r) => memberAverage(r)),
  )
}

/** Andamento da votação de uma proposta e o voto da pessoa logada. */
export function proposalState(clubBook: ClubBookLike, members: MemberLike[], userId: string) {
  const eligible = eligibleMembers(
    members.map((m) => ({ userId: m.user_id, joinedAt: m.joined_at })),
    clubBook.created_at,
  )
  const votes = clubBook.votes.map((v) => ({ userId: v.user_id, approved: v.approved }))
  const mine = clubBook.votes.find((v) => v.user_id === userId)
  return {
    ...approvalProgress({ eligibleMemberIds: eligible, votes }),
    canVote: eligible.includes(userId),
    myVote: mine ? mine.approved : null,
  }
}

/** Resumo literário de um membro: livros lidos, páginas e média das suas notas. */
export function memberStats(readings: ReadingLike[]) {
  const finished = readings.filter((r) => r.finished_on)
  return {
    booksRead: finished.length,
    pagesRead: finished.reduce((sum, r) => sum + (r.pages ?? 0), 0),
    average: bookAverage(finished.map((r) => memberAverage(r))),
  }
}

/** Código de convite digitado: maiúsculas, sem espaços (o banco aceita 6 caracteres sem 0/O/1/I). */
export const normalizeInviteCode = (code: string) => code.replace(/\s+/g, '').toUpperCase()

export const isValidInviteCode = (code: string) => /^[A-HJ-NP-Z2-9]{6}$/.test(normalizeInviteCode(code))
