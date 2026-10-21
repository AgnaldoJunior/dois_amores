import { approvalProgress, eligibleMembers, evaluateProposal } from './clubApproval'
import { bookAverage, bookAverageFromRanks, formatAverage, memberAverage, roundToHalf } from './ratings'
import { computeReadingStats, formatCount } from './stats'

const ranks = (c: number | null, p: number | null, w: number | null, e: number | null) => ({
  rank_characters: c,
  rank_plot: p,
  rank_writing: w,
  rank_ending: e,
})

describe('memberAverage', () => {
  it('é a média das quatro notas', () => {
    expect(memberAverage(ranks(5, 4, 4, 3))).toBe(4)
  })

  it('ignora notas vazias', () => {
    expect(memberAverage(ranks(5, null, 4, null))).toBe(4.5)
  })

  it('é null quando não há nenhuma nota', () => {
    expect(memberAverage(ranks(null, null, null, null))).toBeNull()
  })
})

describe('bookAverage (média das médias dos membros)', () => {
  it('cada membro pesa igual, mesmo com quantidades diferentes de notas', () => {
    // Leyna: (5+5+5+5)/4 = 5 ; Irla: só personagens = 2 → média das médias = 3.5
    // (a média simples de todas as notas daria (20+2)/5 = 4.4)
    expect(bookAverageFromRanks([ranks(5, 5, 5, 5), ranks(2, null, null, null)])).toBe(3.5)
  })

  it('ignora membros sem nota', () => {
    expect(bookAverage([4, null, 3])).toBe(3.5)
  })

  it('é null quando ninguém avaliou', () => {
    expect(bookAverage([null, null])).toBeNull()
    expect(bookAverage([])).toBeNull()
  })

  it('exemplo com os quatro membros do clube', () => {
    const avg = bookAverageFromRanks([
      ranks(5, 4, 5, 4), // Leyna 4.5
      ranks(4, 4, 3, 5), // Irla 4
      ranks(3, 3, 4, 2), // Wanessa 3
      ranks(5, 5, 5, 4), // Thaís 4.75
    ])
    expect(avg).toBeCloseTo(4.0625)
    expect(roundToHalf(avg!)).toBe(4)
    expect(formatAverage(avg!)).toBe('4,1')
  })
})

describe('computeReadingStats', () => {
  it('conta livros concluídos, soma páginas e clubes', () => {
    const stats = computeReadingStats(
      [
        { finished_on: '2026-05-28', pages: 213 },
        { finished_on: '2026-06-27', pages: 192 },
        { finished_on: null, pages: 672 }, // em andamento: não conta
        { finished_on: '2026-07-25', pages: null }, // sem páginas: conta o livro, 0 páginas
      ],
      2,
    )
    expect(stats).toEqual({ booksRead: 3, pagesRead: 405, clubs: 2 })
  })

  it('zera tudo sem leituras', () => {
    expect(computeReadingStats([], 0)).toEqual({ booksRead: 0, pagesRead: 0, clubs: 0 })
  })

  it('formata números no padrão brasileiro', () => {
    expect(formatCount(3480)).toBe('3.480')
  })
})

describe('evaluateProposal (aprovação de livro no clube)', () => {
  const members = ['leyna', 'irla', 'wanessa', 'thais']

  it('fica pendente até todos aprovarem', () => {
    const votes = [
      { userId: 'wanessa', approved: true },
      { userId: 'leyna', approved: true },
      { userId: 'irla', approved: true },
    ]
    expect(evaluateProposal({ eligibleMemberIds: members, votes })).toBe('pending')
    expect(approvalProgress({ eligibleMemberIds: members, votes })).toEqual({ approved: 3, total: 4 })
  })

  it('entra no clube quando todos aprovam', () => {
    const votes = members.map((userId) => ({ userId, approved: true }))
    expect(evaluateProposal({ eligibleMemberIds: members, votes })).toBe('reading')
  })

  it('uma reprovação rejeita o livro', () => {
    const votes = [
      { userId: 'leyna', approved: true },
      { userId: 'irla', approved: false },
    ]
    expect(evaluateProposal({ eligibleMemberIds: members, votes })).toBe('rejected')
  })

  it('ignora votos de quem entrou depois da proposta', () => {
    const votes = [
      { userId: 'leyna', approved: true },
      { userId: 'irla', approved: true },
      { userId: 'novata', approved: false },
    ]
    expect(evaluateProposal({ eligibleMemberIds: ['leyna', 'irla'], votes })).toBe('reading')
  })

  it('clube sem membros elegíveis nunca aprova sozinho', () => {
    expect(evaluateProposal({ eligibleMemberIds: [], votes: [] })).toBe('pending')
  })

  it('elegíveis são os que entraram até a proposta', () => {
    const list = [
      { userId: 'leyna', joinedAt: '2026-04-20T10:00:00Z' },
      { userId: 'irla', joinedAt: '2026-10-19T12:00:00Z' },
      { userId: 'novata', joinedAt: '2026-10-20T09:00:00Z' },
    ]
    expect(eligibleMembers(list, '2026-10-19T12:00:00Z')).toEqual(['leyna', 'irla'])
  })
})
