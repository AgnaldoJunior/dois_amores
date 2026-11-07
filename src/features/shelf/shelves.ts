import { memberAverage, type Ranks } from '@/lib/domain/ratings'

/** Um livro numa estante, venha de leituras (lidos, lendo), da lista "quero ler" ou de uma estante própria. */
export type ShelfItem = {
  key: string
  book: { id: string; title: string; author: string | null; cover_url: string | null; pages: number | null }
  /** Data que ordena e agrupa a estante (fim da leitura, início ou quando entrou). */
  date: string | null
  rating: number | null
}

export type ReadingRow = Ranks & {
  id: string
  started_on: string
  finished_on: string | null
  book: ShelfItem['book']
}

export const fromReadings = (rows: ReadingRow[], by: 'finished' | 'started'): ShelfItem[] =>
  rows.map((r) => ({
    key: r.id,
    book: r.book,
    date: by === 'finished' ? r.finished_on : r.started_on,
    rating: r.finished_on ? memberAverage(r) : null,
  }))

export type ShelfFilter = 'todos' | 'ano' | 'top'

/** Filtros da estante: todos, só deste ano ou só 4 estrelas ou mais. */
export function filterShelf(items: ShelfItem[], filter: ShelfFilter, year: number): ShelfItem[] {
  if (filter === 'ano') return items.filter((i) => i.date?.startsWith(`${year}-`))
  if (filter === 'top') return items.filter((i) => (i.rating ?? 0) >= 4)
  return items
}

/** Agrupa por mês ("outubro de 2026"), na ordem em que os itens vieram. */
export function groupByMonth(items: ShelfItem[], months: string[]): { label: string; items: ShelfItem[] }[] {
  const groups: { label: string; items: ShelfItem[] }[] = []
  for (const item of items) {
    const label = item.date ? `${months[Number(item.date.slice(5, 7)) - 1]} de ${item.date.slice(0, 4)}` : 'sem data'
    const last = groups[groups.length - 1]
    if (last?.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  return groups
}
