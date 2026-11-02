import { clubBookAverage, type ReadingLike } from './clubs'
import { bookAverage, memberAverage } from './ratings'

export type RankingMode = 'books' | 'stars'

export type RankingRow = {
  userId: string
  /** Livros terminados no ano. */
  booksRead: number
  /** Média das médias dos livros terminados no ano (null sem nenhuma nota). */
  average: number | null
  /** Valor usado na ordenação do modo escolhido. */
  value: number | null
  /** 1, 2, 3… (empates dividem a posição). */
  position: number
}

const inYear = (r: ReadingLike, year: number) => r.finished_on?.slice(0, 4) === String(year)

/**
 * Ranking do ano entre os membros: por livros lidos ou pela média das estrelas.
 * Quem não tem valor no modo (sem notas) fica no fim, sem posição de pódio.
 */
export function rankMembers(memberIds: string[], readings: ReadingLike[], year: number, mode: RankingMode): RankingRow[] {
  const rows = memberIds.map((userId) => {
    const mine = readings.filter((r) => r.user_id === userId && inYear(r, year))
    const average = bookAverage(mine.map(memberAverage))
    return { userId, booksRead: mine.length, average, value: mode === 'books' ? mine.length : average }
  })
  const sorted = rows
    .map((row, i) => ({ row, i }))
    .sort((a, b) => {
      if (a.row.value == null || b.row.value == null) return a.row.value == null ? (b.row.value == null ? a.i - b.i : 1) : -1
      return b.row.value - a.row.value || a.i - b.i
    })
    .map(({ row }) => row)
  let position = 0
  return sorted.map((row, i) => {
    if (i === 0 || row.value !== sorted[i - 1]!.value) position = i + 1
    return { ...row, position }
  })
}

export type Award<T> = { userId: string } & T

export type ClubAwards = {
  /** Mais livros terminados no ano fora do clube. */
  marathoner: Award<{ count: number }> | null
  /** Mais livros do clube avaliados com 5 estrelas (média 5). */
  openHand: Award<{ count: number }> | null
  /** Menor média dada aos livros do clube. */
  critic: Award<{ average: number }> | null
}

/** Prêmios do clube no ano. Empates ficam com quem aparece primeiro na lista de membros. */
export function clubAwards(memberIds: string[], readings: ReadingLike[], clubBookIds: string[], year: number): ClubAwards {
  const club = new Set(clubBookIds)
  const pick = <T extends { userId: string }>(items: T[], better: (a: T, b: T) => boolean) =>
    items.reduce<T | null>((top, item) => (!top || better(item, top) ? item : top), null)
  const mine = (userId: string) => readings.filter((r) => r.user_id === userId)

  const marathoner = pick(
    memberIds
      .map((userId) => ({ userId, count: mine(userId).filter((r) => inYear(r, year) && !club.has(r.book_id)).length }))
      .filter((a) => a.count > 0),
    (a, b) => a.count > b.count,
  )
  const openHand = pick(
    memberIds
      .map((userId) => ({ userId, count: mine(userId).filter((r) => club.has(r.book_id) && memberAverage(r) === 5).length }))
      .filter((a) => a.count > 0),
    (a, b) => a.count > b.count,
  )
  const critic = pick(
    memberIds.flatMap((userId) => {
      const average = bookAverage(mine(userId).filter((r) => club.has(r.book_id)).map(memberAverage))
      return average == null ? [] : [{ userId, average }]
    }),
    (a, b) => a.average < b.average,
  )
  return { marathoner, openHand, critic }
}

/** Os livros mais bem avaliados do clube (média das médias), do maior para o menor. */
export function mostLoved<T extends { book: { id: string } }>(
  clubBooks: T[],
  readings: ReadingLike[],
  memberIds: string[],
  limit = 3,
): (T & { average: number })[] {
  return clubBooks
    .map((cb) => ({ ...cb, average: clubBookAverage(cb.book.id, readings, memberIds) }))
    .filter((cb): cb is T & { average: number } => cb.average != null)
    .sort((a, b) => b.average - a.average)
    .slice(0, limit)
}

export type ShelfFavorite<B> = { book: B; average: number; raters: number }

/**
 * Os favoritos das estantes dos membros, fora do clube: livros terminados com nota,
 * pela média das médias (desempate: mais membros leram).
 */
export function shelfFavorites<B extends { id: string }>(
  readings: (ReadingLike & { book: B })[],
  excludeBookIds: string[],
  limit = 5,
): ShelfFavorite<B>[] {
  const exclude = new Set(excludeBookIds)
  const byBook = new Map<string, { book: B; averages: number[] }>()
  for (const r of readings) {
    const avg = memberAverage(r)
    if (!r.finished_on || avg == null || exclude.has(r.book_id)) continue
    const entry = byBook.get(r.book_id) ?? { book: r.book, averages: [] }
    entry.averages.push(avg)
    byBook.set(r.book_id, entry)
  }
  return [...byBook.values()]
    .map(({ book, averages }) => ({ book, average: bookAverage(averages)!, raters: averages.length }))
    .sort((a, b) => b.average - a.average || b.raters - a.raters)
    .slice(0, limit)
}
