import type {
  MagazineBook,
  MagazineData,
  MagazineEdition,
  MemberReview,
} from '@templates/revista/_shared/types'
import { parseIsoDate } from '@/lib/dates'
import { bookAverage, memberAverage, type Ranks as DbRanks } from '@/lib/domain/ratings'

type SourceBook = { id: string; title: string; author: string | null; pages: number | null; cover_url: string | null }

export type MagazineSource = {
  club: { name: string; cover_url: string | null }
  members: { user_id: string; joined_at: string; profile: { name: string; avatar_url: string | null } }[]
  clubBooks: {
    status: string
    started_on: string | null
    finished_on: string | null
    edition_number: number | null
    book: SourceBook
  }[]
  readings: (DbRanks & {
    user_id: string
    book_id: string
    started_on: string
    finished_on: string | null
    favorite_character: string | null
    favorite_quote: string | null
    comment: string | null
    book: SourceBook
  })[]
}

/** Período da revista, em meses "AAAA-MM" (inclusive). */
export type Period = { from: string; to: string }

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const monthOf = (iso: string | null) => (iso ? iso.slice(0, 7) : null)
const inPeriod = (iso: string | null, p: Period) => {
  const m = monthOf(iso)
  return m != null && m >= p.from && m <= p.to
}

export function periodLabel({ from, to }: Period): string {
  const [fy, fm] = from.split('-').map(Number) as [number, number]
  const [ty, tm] = to.split('-').map(Number) as [number, number]
  if (from === to) return `${MONTHS[fm - 1]} de ${fy}`
  if (fy === ty) return `${MONTHS[fm - 1]} a ${MONTHS[tm - 1]} de ${fy}`
  return `${MONTHS[fm - 1]} de ${fy} a ${MONTHS[tm - 1]} de ${ty}`
}

/** Mês de referência de uma edição: quando o clube começou a ler (ou terminou, se não houver início). */
const editionMonth = (cb: MagazineSource['clubBooks'][number]) => cb.started_on ?? cb.finished_on

/** Período padrão: da primeira à última edição concluída. */
export function defaultPeriod(source: MagazineSource): Period | null {
  const months = source.clubBooks
    .filter((cb) => cb.status === 'finished')
    .map((cb) => monthOf(editionMonth(cb)))
    .filter((m): m is string => m != null)
    .sort()
  return months.length ? { from: months[0]!, to: months.at(-1)! } : null
}

const toBook = (b: SourceBook): MagazineBook => ({ title: b.title, author: b.author, pages: b.pages, cover: b.cover_url })

const ranksOf = (r: DbRanks) => ({
  characters: r.rank_characters,
  plot: r.rank_plot,
  writing: r.rank_writing,
  ending: r.rank_ending,
})

const EMPTY_RANKS = { characters: null, plot: null, writing: null, ending: null }

export function buildMagazineData(source: MagazineSource, period: Period): MagazineData {
  const members = [...source.members].sort((a, b) => a.joined_at.localeCompare(b.joined_at))

  const finished = source.clubBooks
    .filter((cb) => cb.status === 'finished' && inPeriod(editionMonth(cb), period))
    .sort((a, b) => (a.edition_number ?? 0) - (b.edition_number ?? 0))

  const editions: MagazineEdition[] = finished.map((cb) => {
    const reviews: MemberReview[] = members.map((m) => {
      const r = source.readings.find((x) => x.user_id === m.user_id && x.book_id === cb.book.id)
      if (!r) {
        return {
          memberId: m.user_id,
          memberName: m.profile.name,
          startedOn: null,
          finishedOn: null,
          ranks: EMPTY_RANKS,
          average: null,
          favoriteCharacter: null,
          favoriteQuote: null,
          comment: null,
        }
      }
      return {
        memberId: m.user_id,
        memberName: m.profile.name,
        startedOn: r.started_on,
        finishedOn: r.finished_on,
        ranks: ranksOf(r),
        average: memberAverage(r),
        favoriteCharacter: r.favorite_character,
        favoriteQuote: r.favorite_quote,
        comment: r.comment,
      }
    })
    const date = parseIsoDate(editionMonth(cb) ?? '')
    return {
      number: cb.edition_number ?? 0,
      month: date ? MONTHS[date.month - 1]!.toUpperCase() : '',
      year: date?.year ?? 0,
      book: toBook(cb.book),
      // Média geral = média das médias dos membros (cada membro pesa igual).
      average: bookAverage(reviews.map((r) => r.average)),
      reviews,
    }
  })

  const reading = source.clubBooks.filter((cb) => cb.status === 'reading')
  const track = [
    ...editions.map((e) => ({ book: e.book, average: e.average })),
    ...reading.map((cb) => ({ book: toBook(cb.book), average: null })),
  ]

  const clubBookIds = new Set(source.clubBooks.map((cb) => cb.book.id))
  const outside = members.map((m) => ({
    member: { id: m.user_id, name: m.profile.name, avatar: m.profile.avatar_url },
    books: source.readings
      .filter((r) => r.user_id === m.user_id && !clubBookIds.has(r.book_id) && inPeriod(r.finished_on, period))
      .sort((a, b) => (a.finished_on ?? '').localeCompare(b.finished_on ?? ''))
      .map((r) => ({ book: toBook(r.book), average: memberAverage(r) })),
  }))

  return {
    club: { name: source.club.name, photo: source.club.cover_url },
    periodLabel: periodLabel(period),
    members: members.map((m) => ({ id: m.user_id, name: m.profile.name, avatar: m.profile.avatar_url })),
    track,
    editions,
    outside,
  }
}
