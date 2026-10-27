import type { Enrichment } from './googleBooks.ts'

export type BookRow = {
  id: string
  title: string
  author: string | null
  pages: number | null
  cover_url: string | null
  summary: string | null
  summary_source: string
  summary_lang: string | null
  enriched_at: string | null
}

export const isOpenLibraryCover = (url: string | null): url is string =>
  !!url && url.startsWith('https://covers.openlibrary.org/')

/** Campos do livro que mudam com o resultado da Google Books (capa é tratada à parte). */
export function plannedChanges(book: BookRow, enrichment: Enrichment | null) {
  const changes: Record<string, unknown> = {}
  if (enrichment?.summary) {
    changes.summary = enrichment.summary
    changes.summary_source = 'google_books'
    changes.summary_lang = 'pt'
    // Guarda o texto da Open Library (a tradução por IA já guardou o original antes).
    if (book.summary && book.summary_source === 'openlibrary') changes.summary_original = book.summary
  }
  if (!book.pages && enrichment?.pages) changes.pages = enrichment.pages
  if (enrichment) changes.google_volume_id = enrichment.volumeId
  return changes
}

/**
 * Ordem de tentativa da capa: edição em português da Google, depois a da Open Library.
 * Se a Google só tiver a edição de Portugal, a capa da Open Library vem primeiro
 * (costuma ser a brasileira, já que a busca pede edições em português).
 */
export function coverSources(book: BookRow, enrichment: Enrichment | null) {
  const google = enrichment?.coverUrls ?? []
  const openLibrary = isOpenLibraryCover(book.cover_url) ? [book.cover_url] : []
  return enrichment?.fromPortugal ? [...openLibrary, ...google] : [...google, ...openLibrary]
}
