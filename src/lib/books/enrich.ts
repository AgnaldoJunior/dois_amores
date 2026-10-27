import { supabase } from '@/lib/supabase'

export type EnrichedBook = {
  id: string
  title: string
  author: string | null
  pages: number | null
  cover_url: string | null
  summary: string | null
  summary_source: 'openlibrary' | 'google_books' | 'ai_translation'
  summary_lang: string | null
  enriched_at: string | null
}

/**
 * Completa o livro com a edição em português da Google Books (Edge Function "books"):
 * sinopse da editora, capa copiada para o nosso Storage e páginas.
 */
export async function enrichBook(bookId: string): Promise<EnrichedBook> {
  const { data, error } = await supabase.functions.invoke<EnrichedBook>('books', {
    body: { action: 'enrich', bookId },
  })
  if (error || !data) throw error ?? new Error('Resposta vazia')
  return data
}

/** Igual a enrichBook, mas desiste depois de `ms` (o livro continua salvo e é completado depois). */
export function enrichBookWithin(bookId: string, ms: number): Promise<EnrichedBook | null> {
  return Promise.race([
    enrichBook(bookId).catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}
