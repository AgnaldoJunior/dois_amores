import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { readingKeys, type Reading } from '@/features/readings/api'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { getWorkSummary } from '@/lib/openlibrary/client'
import { supabase, type Tables } from '@/lib/supabase'

export type ShelfBook = Pick<Tables<'books'>, 'id' | 'title' | 'author' | 'pages' | 'cover_url'>
export type BookDetail = Pick<
  Tables<'books'>,
  'id' | 'title' | 'author' | 'pages' | 'cover_url' | 'summary' | 'openlibrary_work_key'
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
        .select(`${SHELF_BOOK}, summary, openlibrary_work_key`)
        .eq('id', bookId)
        .single()
      if (error) throw error
      if (data.summary) return data

      const summary = await getWorkSummary(data.openlibrary_work_key).catch(() => null)
      if (!summary) return data
      await supabase.rpc('upsert_book', {
        p_work_key: data.openlibrary_work_key,
        p_title: data.title,
        p_summary: summary,
      })
      return { ...data, summary }
    },
    staleTime: 10 * 60_000,
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
