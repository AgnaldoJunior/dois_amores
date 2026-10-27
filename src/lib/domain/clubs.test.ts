import {
  clubBookAverage,
  groupClubBooks,
  isValidInviteCode,
  memberStats,
  normalizeInviteCode,
  proposalState,
  type ClubBookLike,
  type ReadingLike,
} from './clubs'

const cb = (id: string, over: Partial<ClubBookLike> = {}): ClubBookLike => ({
  id,
  status: 'finished',
  created_at: '2026-05-01T12:00:00Z',
  edition_number: null,
  finished_on: null,
  started_on: null,
  book: { id: `book-${id}` },
  votes: [],
  ...over,
})

const reading = (user: string, book: string, ranks: (number | null)[], finished: string | null = '2026-05-20'): ReadingLike => ({
  user_id: user,
  book_id: book,
  started_on: '2026-05-01',
  finished_on: finished,
  rank_characters: ranks[0] ?? null,
  rank_plot: ranks[1] ?? null,
  rank_writing: ranks[2] ?? null,
  rank_ending: ranks[3] ?? null,
})

describe('prateleiras do clube', () => {
  it('separa em andamento, concluídos (edição mais recente primeiro) e propostas', () => {
    const groups = groupClubBooks([
      cb('a', { status: 'finished', edition_number: 1 }),
      cb('b', { status: 'finished', edition_number: 6 }),
      cb('c', { status: 'reading', started_on: '2026-10-21' }),
      cb('d', { status: 'pending', created_at: '2026-10-20T00:00:00Z' }),
      cb('e', { status: 'pending', created_at: '2026-10-19T00:00:00Z' }),
      cb('f', { status: 'rejected' }),
    ])
    expect(groups.finished.map((b) => b.id)).toEqual(['b', 'a'])
    expect(groups.reading.map((b) => b.id)).toEqual(['c'])
    expect(groups.pending.map((b) => b.id)).toEqual(['e', 'd'])
  })
})

describe('média do livro no clube', () => {
  const readings = [
    reading('leyna', 'b1', [5, 4, 5, 4]), // 4,5
    reading('irla', 'b1', [4, 4, 3, 5]), // 4
    reading('wanessa', 'b1', [3, 3, 4, 2]), // 3
    reading('thais', 'b1', [null, null, null, null], null), // sem nota
    reading('ex-membro', 'b1', [1, 1, 1, 1]),
    reading('leyna', 'b2', [1, 1, 1, 1]),
  ]

  it('é a média das médias dos membros atuais que avaliaram', () => {
    expect(clubBookAverage('b1', readings, ['leyna', 'irla', 'wanessa', 'thais'])).toBeCloseTo((4.5 + 4 + 3) / 3)
  })

  it('sem avaliações é null', () => {
    expect(clubBookAverage('b3', readings, ['leyna'])).toBeNull()
  })
})

describe('votação', () => {
  const members = [
    { user_id: 'leyna', joined_at: '2026-04-20T10:00:00Z' },
    { user_id: 'irla', joined_at: '2026-04-20T18:30:00Z' },
    { user_id: 'novata', joined_at: '2026-10-25T00:00:00Z' },
  ]
  const proposal = cb('p', {
    status: 'pending',
    created_at: '2026-10-19T20:00:00Z',
    votes: [{ user_id: 'leyna', approved: true }],
  })

  it('mostra quantos aprovaram entre os que podem votar', () => {
    expect(proposalState(proposal, members, 'irla')).toEqual({ approved: 1, total: 2, canVote: true, myVote: null })
  })

  it('quem entrou depois da proposta não vota', () => {
    expect(proposalState(proposal, members, 'novata').canVote).toBe(false)
  })

  it('indica o voto de quem está logado', () => {
    expect(proposalState(proposal, members, 'leyna').myVote).toBe(true)
  })
})

describe('resumo do membro', () => {
  it('conta lidos, soma páginas e tira a média', () => {
    expect(
      memberStats([
        { ...reading('irla', 'b1', [5, 5, 5, 5]), pages: 200 },
        { ...reading('irla', 'b2', [3, 3, 3, 3]), pages: 100 },
        { ...reading('irla', 'b3', [null, null, null, null], null), pages: 999 },
      ]),
    ).toEqual({ booksRead: 2, pagesRead: 300, average: 4 })
  })
})

describe('código de convite', () => {
  it('aceita minúsculas e espaços e recusa caracteres ambíguos', () => {
    expect(normalizeInviteCode(' dam s26 ')).toBe('DAMS26')
    expect(isValidInviteCode('dams26')).toBe(true)
    expect(isValidInviteCode('DAMS20')).toBe(false) // 0 não existe nos códigos
    expect(isValidInviteCode('DAMS2')).toBe(false)
  })
})
