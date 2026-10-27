/**
 * Google Books API v1 — usada só para completar livros da Open Library com a
 * edição em português (sinopse da editora e capa). Não há conceito de "obra":
 * cada edição é um volume, por isso a identidade do livro continua sendo da OL.
 */

import { authorMatches, normalize, titleScore } from './textMatch.ts'

export { authorMatches, normalize, titleScore }

const API = 'https://www.googleapis.com/books/v1/volumes'

export type GoogleVolume = {
  id: string
  volumeInfo: {
    title?: string
    subtitle?: string
    authors?: string[]
    publisher?: string
    language?: string
    description?: string
    pageCount?: number
    imageLinks?: { smallThumbnail?: string; thumbnail?: string }
    industryIdentifiers?: { type: string; identifier: string }[]
  }
}

export type BookToEnrich = { title: string; author: string | null }

export type Enrichment = {
  volumeId: string
  summary: string | null
  pages: number | null
  /** URLs da capa, da maior para a menor resolução. */
  coverUrls: string[]
  /** Edição de Portugal (a capa brasileira da Open Library, se houver, é preferível). */
  fromPortugal: boolean
}

/**
 * Consultas, na ordem: busca livre (título + autor) e, se ela não achar, com filtros
 * intitle/inauthor. Nenhuma das duas sozinha encontra tudo (a API é inconsistente:
 * "Torto arado" só aparece na livre; "O massacre da família Hope", às vezes só na filtrada).
 */
export function searchQueries(book: BookToEnrich): string[] {
  const free = [book.title, book.author].filter(Boolean).join(' ')
  const surname = book.author?.trim().split(/\s+/).at(-1)
  const filtered = `intitle:${book.title}${surname ? ` inauthor:${surname}` : ''}`
  return [free, filtered]
}

export function buildSearchUrl(book: BookToEnrich, apiKey: string, query = searchQueries(book)[0]!) {
  const params = new URLSearchParams({
    q: query,
    langRestrict: 'pt',
    printType: 'books',
    maxResults: '10',
    key: apiKey,
  })
  return `${API}?${params}`
}

/**
 * País da edição pelo prefixo do ISBN (978-65/978-85 = Brasil; 978-972/978-989 = Portugal).
 * O campo `language` não ajuda: edições portuguesas também vêm como "pt-BR".
 */
export function editionCountry(volume: GoogleVolume): 'BR' | 'PT' | null {
  const isbns = (volume.volumeInfo.industryIdentifiers ?? [])
    .filter((i) => i.type === 'ISBN_13')
    .map((i) => i.identifier.replace(/\D/g, ''))
  if (isbns.some((i) => /^978(65|85)/.test(i))) return 'BR'
  if (isbns.some((i) => /^978(972|989)/.test(i))) return 'PT'
  return null
}

/** Adaptações e pacotes não são a edição do livro (ex.: "Torto arado: Romance gráfico em quadrinhos"). */
const ADAPTATION = /\b(quadrinhos|graphic novel|romance grafico|hq|box|kit|colecao|box set|edicao de colecionador)\b/

/**
 * Escolhe a melhor edição em português: título e autor precisam bater e
 * adaptações ficam de fora; entre as válidas, vence quem tem sinopse, capa,
 * título mais parecido e ISBN brasileiro.
 */
export function pickBestVolume(volumes: GoogleVolume[], book: BookToEnrich): GoogleVolume | null {
  let best: { volume: GoogleVolume; score: number } | null = null
  for (const volume of volumes) {
    const info = volume.volumeInfo
    if (!(info.language ?? '').toLowerCase().startsWith('pt')) continue
    const tScore = titleScore(info.title ?? '', book.title)
    if (tScore === 0 || !authorMatches(info.authors, book.author)) continue
    const fullTitle = normalize(`${info.title ?? ''} ${info.subtitle ?? ''}`)
    if (ADAPTATION.test(fullTitle) && !ADAPTATION.test(normalize(book.title))) continue
    const country = editionCountry(volume)
    const score =
      tScore * 2 +
      (info.description ? 3 : 0) +
      (info.imageLinks?.thumbnail ? 3 : 0) +
      (info.pageCount ? 1 : 0) +
      (country === 'BR' ? 1 : country === 'PT' ? -1 : 0)
    if (!best || score > best.score) best = { volume, score }
  }
  return best?.volume ?? null
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

/** A sinopse da Google vem com HTML simples (<p>, <br>, <b>…). */
export function cleanGoogleDescription(html: string | undefined): string | null {
  if (!html) return null
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
      if (entity.startsWith('#x')) return String.fromCodePoint(parseInt(entity.slice(2), 16))
      if (entity.startsWith('#')) return String.fromCodePoint(Number(entity.slice(1)))
      return ENTITIES[entity.toLowerCase()] ?? match
    })
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text.length >= 40 ? text.slice(0, 20000) : null
}

/** Capa em https, sem a "dobra" decorativa, do zoom 3 (~575 px) ao 1 (~128 px). */
export function coverUrls(volume: GoogleVolume): string[] {
  const thumb = volume.volumeInfo.imageLinks?.thumbnail ?? volume.volumeInfo.imageLinks?.smallThumbnail
  if (!thumb) return []
  const base = thumb.replace(/^http:/, 'https:').replace(/&edge=curl/, '')
  return [3, 2, 1].map((zoom) => (/zoom=\d/.test(base) ? base.replace(/zoom=\d/, `zoom=${zoom}`) : `${base}&zoom=${zoom}`))
}

export function toEnrichment(volume: GoogleVolume): Enrichment {
  const pages = volume.volumeInfo.pageCount
  return {
    volumeId: volume.id,
    summary: cleanGoogleDescription(volume.volumeInfo.description),
    pages: pages && pages > 0 ? pages : null,
    coverUrls: coverUrls(volume),
    fromPortugal: editionCountry(volume) === 'PT',
  }
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

/** Busca com novas tentativas: a API costuma responder 503 de forma intermitente. */
export async function searchPortugueseEdition(
  book: BookToEnrich,
  apiKey: string,
  { fetchFn = fetch as FetchLike, sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)), attempts = 4 } = {},
): Promise<Enrichment | null> {
  let answered = false
  for (const query of searchQueries(book)) {
    const url = buildSearchUrl(book, apiKey, query)
    for (let i = 0; i < attempts; i++) {
      if (i > 0) await sleep(800 * i)
      let res: Response
      try {
        res = await fetchFn(url, { signal: AbortSignal.timeout(10_000) })
      } catch {
        continue
      }
      if (res.status >= 500 || res.status === 429) continue
      if (!res.ok) throw new Error(`Google Books respondeu ${res.status}`)
      answered = true
      const json = (await res.json()) as { items?: GoogleVolume[] }
      const best = pickBestVolume(json.items ?? [], book)
      if (best) return toEnrichment(best)
      break // respondeu sem resultado útil: tenta a próxima consulta
    }
  }
  if (answered) return null
  throw new Error('Google Books indisponível')
}
