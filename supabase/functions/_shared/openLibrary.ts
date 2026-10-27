/**
 * Confirmação de livros na Open Library (usada para validar sugestões da IA:
 * só aparece para a pessoa o que existe de verdade no catálogo).
 */
import { authorMatches, titleScore } from './textMatch.ts'

const SEARCH = 'https://openlibrary.org/search.json'
const FIELDS = 'key,title,author_name,cover_i,number_of_pages_median,editions,editions.title,editions.cover_i,editions.language'

export type VerifiedBook = {
  workKey: string
  title: string
  author: string | null
  coverUrl: string | null
  pages: number | null
}

type Doc = {
  key?: string
  title?: string
  author_name?: string[]
  cover_i?: number
  number_of_pages_median?: number
  editions?: { docs?: { title?: string; cover_i?: number; language?: string[] }[] }
}

/** Escolhe o resultado cujo título e autor batem com a sugestão; prefere título e capa da edição em português. */
export function pickVerified(docs: Doc[], title: string, author: string | null): VerifiedBook | null {
  for (const doc of docs) {
    if (!doc.key || !/^\/works\/OL\d+W$/.test(doc.key) || !doc.title) continue
    const edition = doc.editions?.docs?.[0]
    const pt = edition?.language?.includes('por') ? edition : undefined
    const titles = [doc.title, pt?.title].filter((t): t is string => Boolean(t))
    if (!titles.some((t) => titleScore(t, title) >= 2)) continue
    if (!authorMatches(doc.author_name, author)) continue
    const coverId = pt?.cover_i ?? doc.cover_i
    return {
      workKey: doc.key,
      title: pt?.title?.trim() || doc.title,
      author: doc.author_name?.[0] ?? author,
      coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
      pages: doc.number_of_pages_median && doc.number_of_pages_median > 0 ? doc.number_of_pages_median : null,
    }
  }
  return null
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

export async function verifyBook(
  title: string,
  author: string | null,
  fetchFn: FetchLike = fetch as FetchLike,
): Promise<VerifiedBook | null> {
  const params = new URLSearchParams({
    q: [title, author].filter(Boolean).join(' '),
    limit: '5',
    lang: 'pt',
    fields: FIELDS,
  })
  try {
    const res = await fetchFn(`${SEARCH}?${params}`, {
      headers: { 'User-Agent': 'DoisAmores/1.0 (clube do livro)' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { docs?: Doc[] }
    return pickVerified(json.docs ?? [], title, author)
  } catch {
    return null
  }
}
