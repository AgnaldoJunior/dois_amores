import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { enrichBookWithin } from '@/lib/books/enrich'
import { computeReadingStats } from '@/lib/domain/stats'
import { coverUrl, getWorkSummary, type BookSearchResult } from '@/lib/openlibrary/client'
import { supabase, type Tables } from '@/lib/supabase'

export type Book = Pick<Tables<'books'>, 'id' | 'title' | 'author' | 'pages' | 'cover_url' | 'summary'>

export type ReadingValues = Pick<
  Tables<'user_books'>,
  | 'started_on'
  | 'finished_on'
  | 'rank_characters'
  | 'rank_plot'
  | 'rank_writing'
  | 'rank_ending'
  | 'favorite_character'
  | 'favorite_quote'
  | 'comment'
>

export type Reading = ReadingValues & { id: string; book: Book }

const BOOK_FIELDS = 'id, title, author, pages, cover_url, summary'
const READING_FIELDS = `id, started_on, finished_on, rank_characters, rank_plot, rank_writing, rank_ending,
  favorite_character, favorite_quote, comment, book:books(${BOOK_FIELDS})`

export const readingKeys = {
  all: ['readings'] as const,
  detail: (id: string) => ['readings', 'detail', id] as const,
  recent: (userId: string) => ['readings', 'recent', userId] as const,
  stats: (userId: string) => ['readings', 'stats', userId] as const,
}

/** Tempo máximo esperando a Google Books ao escolher o livro (depois completa na página do livro). */
export const ENRICH_WAIT_MS = 8000

/** Livro vindo da busca ou de uma sugestão da IA (já confirmado na Open Library). */
export type CatalogInput = {
  workKey: string
  title: string
  author: string | null
  pages: number | null
  coverUrl: string | null
}

/** Livro escolhido na busca. */
export const ensureBook = (result: BookSearchResult) =>
  ensureCatalogBook({
    workKey: result.workKey,
    title: result.title,
    author: result.author,
    pages: result.pages,
    coverUrl: result.coverId ? coverUrl(result.coverId, 'L') : null,
  })

/**
 * Salva o livro no catálogo (se ainda não existir), com resumo da Works API,
 * e tenta completar com a edição em português da Google Books (capa e sinopse).
 */
export async function ensureCatalogBook(input: CatalogInput): Promise<Book> {
  const summary = await getWorkSummary(input.workKey).catch(() => null)
  const { data, error } = await supabase
    .rpc('upsert_book', {
      p_work_key: input.workKey,
      p_title: input.title,
      p_author: input.author ?? undefined,
      p_pages: input.pages ?? undefined,
      p_cover_url: input.coverUrl ?? undefined,
      p_summary: summary ?? undefined,
    })
    .select(BOOK_FIELDS)
    .single()
  if (error) throw error
  const book = data as Book
  const enriched = await enrichBookWithin(book.id, ENRICH_WAIT_MS)
  return enriched ? { ...book, ...pickBook(enriched) } : book
}

const pickBook = ({ id, title, author, pages, cover_url, summary }: Book): Book => ({
  id,
  title,
  author,
  pages,
  cover_url,
  summary,
})

/** Leitura já registrada pelo usuário para este livro (uma por livro). */
export async function findMyReadingId(userId: string, bookId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_books')
    .select('id')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .maybeSingle()
  if (error) throw error
  return data?.id ?? null
}

export function useReading(id: string) {
  return useQuery({
    queryKey: readingKeys.detail(id),
    queryFn: async (): Promise<Reading> => {
      const { data, error } = await supabase.from('user_books').select(READING_FIELDS).eq('id', id).single()
      if (error) throw error
      return data as Reading
    },
  })
}

export function useRecentReadings(limit = 3) {
  const user = useCurrentUser()
  return useQuery({
    queryKey: readingKeys.recent(user.id),
    queryFn: async (): Promise<Reading[]> => {
      const { data, error } = await supabase
        .from('user_books')
        .select(READING_FIELDS)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as Reading[]
    },
  })
}

export function useMyStats() {
  const user = useCurrentUser()
  return useQuery({
    queryKey: readingKeys.stats(user.id),
    queryFn: async () => {
      const [readings, clubs] = await Promise.all([
        supabase.from('user_books').select('finished_on, book:books(pages)').eq('user_id', user.id),
        supabase.from('club_members').select('club_id', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      if (readings.error) throw readings.error
      if (clubs.error) throw clubs.error
      return computeReadingStats(
        readings.data.map((r) => ({ finished_on: r.finished_on, pages: r.book?.pages ?? null })),
        clubs.count ?? 0,
      )
    },
  })
}

export function useSaveReading() {
  const user = useCurrentUser()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, bookId, values }: { id?: string; bookId: string; values: ReadingValues }) => {
      const query = id
        ? supabase.from('user_books').update(values).eq('id', id)
        : supabase.from('user_books').insert({ ...values, book_id: bookId, user_id: user.id })
      const { data, error } = await query.select('id').single()
      if (error) throw error
      return data.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: readingKeys.all })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useDeleteReading() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_books').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: readingKeys.all })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}
