import type { ReadingLike } from './clubs'
import { clubAwards, mostLoved, rankMembers, shelfFavorites } from './ranking'

const r = (user_id: string, book_id: string, finished_on: string | null, rank: number | null): ReadingLike => ({
  user_id,
  book_id,
  started_on: '2026-01-01',
  finished_on,
  rank_characters: rank,
  rank_plot: rank,
  rank_writing: rank,
  rank_ending: rank,
})

const members = ['leyna', 'irla', 'wanessa', 'thais']
const readings = [
  r('leyna', 'tres', '2026-09-27', 5),
  r('leyna', 'duna', '2026-03-01', 4),
  r('leyna', 'velho', '2025-12-30', 5), // ano anterior: não conta no ranking
  r('irla', 'tres', '2026-09-29', 5),
  r('irla', 'outro', '2026-02-10', 5),
  r('irla', 'mais', '2026-04-10', 5),
  r('wanessa', 'tres', '2026-09-28', 3),
  r('wanessa', 'lendo', null, null), // em andamento: não conta
]

describe('rankMembers', () => {
  it('por livros lidos no ano, com empate dividindo a posição', () => {
    const rows = rankMembers(members, readings, 2026, 'books')
    expect(rows.map((x) => [x.userId, x.value, x.position])).toEqual([
      ['irla', 3, 1],
      ['leyna', 2, 2],
      ['wanessa', 1, 3],
      ['thais', 0, 4],
    ])
  })

  it('pela média das estrelas: quem não tem nota fica no fim', () => {
    const rows = rankMembers(members, readings, 2026, 'stars')
    expect(rows.map((x) => [x.userId, x.value])).toEqual([
      ['irla', 5],
      ['leyna', 4.5],
      ['wanessa', 3],
      ['thais', null],
    ])
    expect(rows[1]!.booksRead).toBe(2)
  })

  it('empates em valor mantêm a ordem dos membros e a mesma posição', () => {
    const rows = rankMembers(['a', 'b'], [r('a', 'x', '2026-01-02', 4), r('b', 'y', '2026-01-03', 4)], 2026, 'stars')
    expect(rows.map((x) => [x.userId, x.position])).toEqual([
      ['a', 1],
      ['b', 1],
    ])
  })
})

describe('clubAwards', () => {
  const clubBooks = ['tres']

  it('maratonista, mão aberta e crítica oficial', () => {
    const awards = clubAwards(members, readings, clubBooks, 2026)
    expect(awards.marathoner).toEqual({ userId: 'irla', count: 2 })
    expect(awards.openHand).toEqual({ userId: 'leyna', count: 1 }) // empate com Irla: primeira da lista
    expect(awards.critic).toEqual({ userId: 'wanessa', average: 3 })
  })

  it('sem leituras, nenhum prêmio', () => {
    expect(clubAwards(members, [], clubBooks, 2026)).toEqual({ marathoner: null, openHand: null, critic: null })
  })
})

describe('mostLoved', () => {
  it('ordena pela média do clube e ignora livros sem nota', () => {
    const books = [{ book: { id: 'tres' } }, { book: { id: 'duna' } }, { book: { id: 'sem-nota' } }]
    const top = mostLoved(books, readings, members)
    expect(top.map((b) => [b.book.id, b.average])).toEqual([
      ['tres', (5 + 5 + 3) / 3],
      ['duna', 4],
    ])
  })
})

describe('shelfFavorites', () => {
  it('fora do clube, pela média e depois por quantas leram', () => {
    const withBook = readings.map((x) => ({ ...x, book: { id: x.book_id } }))
    const extra = { ...r('wanessa', 'duna', '2026-05-01', 4), book: { id: 'duna' } }
    const favs = shelfFavorites([...withBook, extra], ['tres'])
    expect(favs.map((f) => [f.book.id, f.average, f.raters])).toEqual([
      ['velho', 5, 1],
      ['outro', 5, 1],
      ['mais', 5, 1],
      ['duna', 4, 2],
    ])
  })
})
