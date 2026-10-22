/**
 * Open Library — Search API e Works API (sem chave, CORS liberado).
 * https://openlibrary.org/dev/docs/api/search
 */

const BASE = 'https://openlibrary.org'
const COVERS = 'https://covers.openlibrary.org'

export type BookSearchResult = {
  workKey: string
  title: string
  author: string | null
  coverId: number | null
  pages: number | null
  year: number | null
}

type SearchDoc = {
  key?: string
  title?: string
  author_name?: string[]
  cover_i?: number
  number_of_pages_median?: number
  first_publish_year?: number
}

const SEARCH_FIELDS = 'key,title,author_name,cover_i,number_of_pages_median,first_publish_year'

export function normalizeSearchDoc(doc: SearchDoc): BookSearchResult | null {
  if (!doc.key || !/^\/works\/OL\d+W$/.test(doc.key) || !doc.title) return null
  return {
    workKey: doc.key,
    title: doc.title,
    author: doc.author_name?.[0] ?? null,
    coverId: doc.cover_i ?? null,
    pages: doc.number_of_pages_median && doc.number_of_pages_median > 0 ? doc.number_of_pages_median : null,
    year: doc.first_publish_year ?? null,
  }
}

export async function searchBooks(query: string, { limit = 5, signal }: { limit?: number; signal?: AbortSignal } = {}) {
  const params = new URLSearchParams({ q: query.trim(), limit: String(limit), fields: SEARCH_FIELDS })
  const res = await fetch(`${BASE}/search.json?${params}`, { signal })
  if (!res.ok) throw new Error(`Open Library respondeu ${res.status}`)
  const json = (await res.json()) as { docs?: SearchDoc[] }
  return (json.docs ?? []).map(normalizeSearchDoc).filter((b): b is BookSearchResult => b !== null).slice(0, limit)
}

/** Resumo do livro (Works API). Remove notas de rodapé e links em markdown que a OL costuma trazer. */
export function cleanDescription(description: unknown): string | null {
  const raw =
    typeof description === 'string'
      ? description
      : description && typeof description === 'object' && 'value' in description
        ? String((description as { value: unknown }).value)
        : null
  if (!raw) return null
  const text = raw
    .split(/\r?\n-{3,}/)[0]! // trecho "----------" com fontes e links
    .replace(/\[([^\]]+)\]\[\d+\]/g, '$1') // [texto][1]
    .replace(/\[([^\]]+)\]\((?:https?:)?[^)]+\)/g, '$1') // [texto](url)
    .replace(/^\s*\[\d+\]:.*$/gm, '') // [1]: https://...
    .replace(/\(\[source\]\)/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text || null
}

export async function getWorkSummary(workKey: string, signal?: AbortSignal): Promise<string | null> {
  const res = await fetch(`${BASE}${workKey}.json`, { signal })
  if (!res.ok) return null
  const json = (await res.json()) as { description?: unknown }
  return cleanDescription(json.description)
}

export const coverUrl = (coverId: number, size: 'S' | 'M' | 'L' = 'L') => `${COVERS}/b/id/${coverId}-${size}.jpg`

/** Troca o tamanho de uma URL de capa já salva (ex.: miniatura no autocomplete). */
export const resizeCoverUrl = (url: string, size: 'S' | 'M' | 'L') => url.replace(/-[SML]\.jpg$/, `-${size}.jpg`)
