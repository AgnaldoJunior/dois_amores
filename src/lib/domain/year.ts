import { bookAverage, memberAverage, type Ranks } from './ratings'

export type YearReading = Ranks & {
  finished_on: string | null
  book: { id: string; title: string; author: string | null; pages: number | null; cover_url?: string | null }
}

export const MONTH_INITIALS = ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd']
export const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export type AuthorCount = { author: string; books: number; average: number | null }

/**
 * Os números do ano ("seus números"): livros e páginas terminados no ano, média das
 * notas, livros por mês, o mês mais forte, o livro do ano (maior média) e as autoras
 * mais lidas.
 */
export function yearStats<T extends YearReading>(readings: T[], year: number) {
  const read = readings.filter((r) => r.finished_on?.startsWith(`${year}-`))
  const pages = read.reduce((sum, r) => sum + (r.book.pages ?? 0), 0)
  const withPages = read.filter((r) => r.book.pages)
  const byMonth = Array.from({ length: 12 }, () => 0)
  for (const r of read) byMonth[Number(r.finished_on!.slice(5, 7)) - 1]! += 1
  const max = Math.max(...byMonth)
  const bestMonth = max > 0 ? byMonth.indexOf(max) : null

  let bookOfYear: (T & { average: number }) | null = null
  for (const r of read) {
    const average = memberAverage(r)
    if (average != null && (!bookOfYear || average > bookOfYear.average)) bookOfYear = { ...r, average }
  }

  const authors = new Map<string, number[]>()
  const counts = new Map<string, number>()
  for (const r of read) {
    if (!r.book.author) continue
    counts.set(r.book.author, (counts.get(r.book.author) ?? 0) + 1)
    const avg = memberAverage(r)
    const list = authors.get(r.book.author) ?? []
    if (avg != null) list.push(avg)
    authors.set(r.book.author, list)
  }
  const topAuthors: AuthorCount[] = [...counts.entries()]
    .map(([author, books]) => ({ author, books, average: bookAverage(authors.get(author) ?? []) }))
    .sort((a, b) => b.books - a.books || (b.average ?? 0) - (a.average ?? 0))
    .slice(0, 3)

  return {
    books: read.length,
    pages,
    average: bookAverage(read.map(memberAverage)),
    pagesPerBook: withPages.length ? Math.round(withPages.reduce((s, r) => s + r.book.pages!, 0) / withPages.length) : null,
    byMonth,
    bestMonth,
    bestMonthCount: max,
    bookOfYear,
    topAuthors,
  }
}

/**
 * Meta de leitura: quantos faltam e o ritmo necessário até o fim do ano
 * (livros por semana, arredondado para cima).
 */
export function goalPace(read: number, goal: number, today: Date) {
  const left = Math.max(0, goal - read)
  const end = new Date(today.getFullYear(), 11, 31)
  const weeks = Math.max(1, Math.ceil((end.getTime() - today.getTime()) / (7 * 24 * 3600 * 1000)))
  const start = new Date(today.getFullYear(), 0, 1)
  const elapsed = (today.getTime() - start.getTime()) / (end.getTime() - start.getTime())
  return { left, perWeek: left === 0 ? 0 : Math.ceil(left / weeks), onTrack: read >= Math.floor(goal * elapsed) }
}

/** Citação do dia: a mesma o dia inteiro, girando entre as citações disponíveis. */
export function pickOfTheDay<T>(items: T[], isoDate: string): T | null {
  if (items.length === 0) return null
  const day = Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / (24 * 3600 * 1000))
  return items[day % items.length] ?? null
}
