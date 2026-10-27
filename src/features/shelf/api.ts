import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ensureCatalogBook, readingKeys, type CatalogInput, type Reading } from '@/features/readings/api'
import { translateSummary } from '@/lib/ai/client'
import { enrichBook } from '@/lib/books/enrich'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { getWorkSummary } from '@/lib/openlibrary/client'
import { supabase, type Tables } from '@/lib/supabase'

export type ShelfBook = Pick<Tables<'books'>, 'id' | 'title' | 'author' | 'pages' | 'cover_url'>
export type BookDetail = Pick<
  Tables<'books'>,
  | 'id'
  | 'title'
  | 'author'
  | 'pages'
  | 'cover_url'
  | 'summary'
  | 'openlibrary_work_key'
  | 'summary_lang'
  | 'summary_source'
  | 'enriched_at'
>
export type WishlistItem = { book: ShelfBook; created_at: string }

export type Shelf = {
  read: Reading[]
  reading: Reading[]
  wishlist: WishlistItem[]
}

const SHELF_BOOK = 'id, title, author, pages, cover_url'
const READING_FIELDS = `id, started_on, finished_on, rank_characters, rank_plot, rank_writing, rank_ending,
  favorite_character, favorite_quote, comment, book:books(${SHELF_BOOK}, summary)`

export const shelfKeys = {
  shelf: (userId: string) => ['readings', 'shelf', userId] as const,
  book: (bookId: string) => ['books', bookId] as const,
  myReadingOf: (userId: string, bookId: string) => ['readings', 'of-book', userId, bookId] as const,
  wishlist: (userId: string) => ['readings', 'wishlist', userId] as const,
}

/** Separa as leituras nas prateleiras: Lidos (fim mais recente primeiro) e Em andamento (início mais recente). */
export function groupShelf(readings: Reading[], wishlist: WishlistItem[] = []): Shelf {
  const read = readings
    .filter((r) => r.finished_on)
    .sort((a, b) => b.finished_on!.localeCompare(a.finished_on!))
  const reading = readings.filter((r) => !r.finished_on).sort((a, b) => b.started_on.localeCompare(a.started_on))
  return { read, reading, wishlist }
}

export function useShelf() {
  const user = useCurrentUser()
  return useQuery({
    queryKey: shelfKeys.shelf(user.id),
    queryFn: async (): Promise<Shelf> => {
      const [readings, wishlist] = await Promise.all([
        supabase.from('user_books').select(READING_FIELDS).eq('user_id', user.id),
        supabase
          .from('reading_list')
          .select(`created_at, book:books(${SHELF_BOOK})`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])
      if (readings.error) throw readings.error
      if (wishlist.error) throw wishlist.error
      return groupShelf(readings.data as Reading[], wishlist.data as WishlistItem[])
    },
  })
}

/**
 * Livro do catálogo. Se ainda não tiver resumo, tenta buscar na Open Library e
 * salva (upsert_book só preenche campos vazios), para a próxima visita já vir pronto.
 */
export function useBook(bookId: string) {
  return useQuery({
    queryKey: shelfKeys.book(bookId),
    queryFn: async (): Promise<BookDetail> => {
      const { data, error } = await supabase
        .from('books')
        .select(`${SHELF_BOOK}, summary, openlibrary_work_key, summary_lang, summary_source, enriched_at`)
        .eq('id', bookId)
        .single()
      if (error) throw error
      // Sinopse e capa em português vêm da Google Books (useBookEnrichment); a OL só
      // é consultada aqui quando o livro ainda não tem nenhum resumo.
      if (data.summary || data.enriched_at) return data

      const summary = await getWorkSummary(data.openlibrary_work_key).catch(() => null)
      if (!summary) return data
      await supabase.rpc('upsert_book', {
        p_work_key: data.openlibrary_work_key,
        p_title: data.title,
        p_summary: summary,
      })
      return { ...data, summary, summary_lang: null }
    },
    staleTime: 10 * 60_000,
  })
}

/**
 * O resumo precisa passar pela IA? Só depois que a Google Books já foi consultada
 * (ela costuma ter a sinopse da editora brasileira) e se o idioma ainda não foi verificado.
 */
export const needsTranslation = (
  book: Pick<BookDetail, 'summary' | 'summary_lang' | 'enriched_at'> | undefined,
) => Boolean(book?.enriched_at && book.summary && !book.summary_lang)

/**
 * Completa o livro com a edição em português da Google Books na primeira visita
 * (capa copiada para o nosso Storage, sinopse da editora, páginas).
 */
export function useBookEnrichment(book: BookDetail | undefined) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: ['books', book?.id, 'enrichment'],
    enabled: Boolean(book && !book.enriched_at),
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      const result = await enrichBook(book!.id)
      queryClient.setQueryData<BookDetail>(shelfKeys.book(book!.id), (old) => (old ? { ...old, ...result } : old))
      // Capas novas aparecem também na prateleira e no feed.
      queryClient.invalidateQueries({ queryKey: readingKeys.all })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      return result
    },
  })
}

/**
 * Traduz o resumo para o português na primeira visita (a Edge Function guarda
 * o resultado no livro, então cada livro é traduzido uma vez só).
 */
export function useSummaryTranslation(book: BookDetail | undefined) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: ['books', book?.id, 'translation'],
    enabled: needsTranslation(book),
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      const result = await translateSummary(book!.id)
      queryClient.setQueryData<BookDetail>(shelfKeys.book(book!.id), (old) => (old ? { ...old, ...result } : old))
      return result
    },
  })
}

/** Minha leitura deste livro (ou null). */
export function useMyReadingOf(bookId: string) {
  const user = useCurrentUser()
  return useQuery({
    queryKey: shelfKeys.myReadingOf(user.id, bookId),
    queryFn: async (): Promise<Reading | null> => {
      const { data, error } = await supabase
        .from('user_books')
        .select(READING_FIELDS)
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle()
      if (error) throw error
      return data as Reading | null
    },
  })
}

export function useIsInWishlist(bookId: string) {
  const user = useCurrentUser()
  return useQuery({
    queryKey: [...shelfKeys.wishlist(user.id), bookId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('reading_list')
        .select('book_id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('book_id', bookId)
      if (error) throw error
      return (count ?? 0) > 0
    },
  })
}

/** Adiciona ou remove um livro da lista "Quero ler". */
export function useWishlistToggle() {
  const user = useCurrentUser()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bookId, add }: { bookId: string; add: boolean }) => {
      const { error } = add
        ? await supabase.from('reading_list').upsert({ user_id: user.id, book_id: bookId }, { ignoreDuplicates: true })
        : await supabase.from('reading_list').delete().eq('user_id', user.id).eq('book_id', bookId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: readingKeys.all }),
  })
}

/** Guarda uma sugestão da IA em "Quero ler": salva no catálogo (com Google Books) e adiciona à lista. */
export function useAddSuggestionToWishlist() {
  const user = useCurrentUser()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CatalogInput) => {
      const book = await ensureCatalogBook(input)
      const { error } = await supabase
        .from('reading_list')
        .upsert({ user_id: user.id, book_id: book.id }, { ignoreDuplicates: true })
      if (error) throw error
      return book
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: readingKeys.all }),
  })
}
