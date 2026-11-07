import { MONTH_NAMES } from '@/lib/domain/year'
import { filterShelf, fromReadings, groupByMonth, type ReadingRow } from './shelves'

const row = (id: string, finished_on: string | null, rank: number | null): ReadingRow => ({
  id,
  started_on: '2026-01-01',
  finished_on,
  rank_characters: rank,
  rank_plot: rank,
  rank_writing: rank,
  rank_ending: rank,
  book: { id: `b-${id}`, title: id, author: null, cover_url: null, pages: null },
})

describe('estantes', () => {
  const items = fromReadings([row('a', '2026-10-20', 2), row('b', '2026-10-15', 4.5), row('c', '2025-07-22', 5)], 'finished')

  it('filtra por ano e por nota', () => {
    expect(filterShelf(items, 'todos', 2026).map((i) => i.key)).toEqual(['a', 'b', 'c'])
    expect(filterShelf(items, 'ano', 2026).map((i) => i.key)).toEqual(['a', 'b'])
    expect(filterShelf(items, 'top', 2026).map((i) => i.key)).toEqual(['b', 'c'])
  })

  it('agrupa por mês na ordem da estante', () => {
    expect(groupByMonth(items, MONTH_NAMES).map((g) => [g.label, g.items.length])).toEqual([
      ['outubro de 2026', 2],
      ['julho de 2025', 1],
    ])
  })

  it('leitura em andamento não tem nota', () => {
    expect(fromReadings([row('x', null, 4)], 'started')[0]).toMatchObject({ date: '2026-01-01', rating: null })
  })
})
