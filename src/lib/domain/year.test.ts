import { goalPace, pickOfTheDay, yearStats, type YearReading } from './year'

const r = (title: string, author: string, finished_on: string | null, rank: number | null, pages: number | null = 300): YearReading => ({
  finished_on,
  rank_characters: rank,
  rank_plot: rank,
  rank_writing: rank,
  rank_ending: rank,
  book: { id: title, title, author, pages },
})

describe('yearStats', () => {
  const readings = [
    r('Três', 'Valérie Perrin', '2026-04-02', 5, 672),
    r('Água fresca', 'Valérie Perrin', '2026-04-20', 4, 480),
    r('Recursão', 'Blake Crouch', '2026-04-28', 4, 336),
    r('Vidas secas', 'Graciliano Ramos', '2026-10-15', 4.5, null),
    r('Antigo', 'Alguém', '2025-12-30', 5),
    r('Lendo', 'Alguém', null, null),
  ]

  it('conta só os livros terminados no ano', () => {
    const s = yearStats(readings, 2026)
    expect(s.books).toBe(4)
    expect(s.pages).toBe(672 + 480 + 336)
    expect(s.pagesPerBook).toBe(Math.round((672 + 480 + 336) / 3))
    expect(s.average).toBeCloseTo((5 + 4 + 4 + 4.5) / 4)
  })

  it('livros por mês e o mês mais forte', () => {
    const s = yearStats(readings, 2026)
    expect(s.byMonth[3]).toBe(3)
    expect(s.byMonth[9]).toBe(1)
    expect(s.bestMonth).toBe(3)
    expect(s.bestMonthCount).toBe(3)
  })

  it('o livro do ano e as autoras mais lidas', () => {
    const s = yearStats(readings, 2026)
    expect(s.bookOfYear?.book.title).toBe('Três')
    expect(s.topAuthors[0]).toEqual({ author: 'Valérie Perrin', books: 2, average: 4.5 })
  })

  it('ano vazio', () => {
    const s = yearStats(readings, 2020)
    expect(s.books).toBe(0)
    expect(s.bestMonth).toBeNull()
    expect(s.bookOfYear).toBeNull()
    expect(s.pagesPerBook).toBeNull()
  })
})

describe('goalPace', () => {
  it('quantos faltam e quantos por semana', () => {
    const pace = goalPace(14, 40, new Date(2026, 10, 7))
    expect(pace.left).toBe(26)
    expect(pace.perWeek).toBeGreaterThanOrEqual(3)
    expect(pace.onTrack).toBe(false)
  })

  it('meta batida', () => {
    expect(goalPace(41, 40, new Date(2026, 10, 7))).toEqual({ left: 0, perWeek: 0, onTrack: true })
  })
})

describe('pickOfTheDay', () => {
  it('é estável no mesmo dia e gira entre os dias', () => {
    const items = ['a', 'b', 'c']
    expect(pickOfTheDay(items, '2026-11-07')).toBe(pickOfTheDay(items, '2026-11-07'))
    expect(pickOfTheDay(items, '2026-11-07')).not.toBe(pickOfTheDay(items, '2026-11-08'))
    expect(pickOfTheDay([], '2026-11-07')).toBeNull()
  })
})

describe('prazo da leitura do clube', () => {
  it('dia X de Y e quantos faltam', async () => {
    const { dueProgress } = await import('@/features/clubs/schedule')
    expect(dueProgress('2026-11-04', '2026-11-23', '2026-11-15')).toEqual({ day: 12, total: 20, left: 8 })
    expect(dueProgress('2026-11-04', '2026-11-23', '2026-11-30')).toMatchObject({ day: 20, left: -7 })
    expect(dueProgress(null, '2026-11-23', '2026-11-15')).toBeNull()
  })
})
