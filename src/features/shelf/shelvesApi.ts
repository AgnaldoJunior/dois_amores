import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { supabase } from '@/lib/supabase'

export const SHELF_COLORS = ['vinho', 'rosa', 'areia', 'dourado', 'tinta'] as const
export type ShelfColor = (typeof SHELF_COLORS)[number]

export type ShelfBook = { id: string; title: string; author: string | null; cover_url: string | null; pages: number | null }

export type CustomShelf = {
  id: string
  user_id: string
  name: string
  color: ShelfColor
  created_at: string
  books: { added_at: string; book: ShelfBook }[]
}

export const customShelfKeys = {
  list: (userId: string) => ['readings', 'custom-shelves', userId] as const,
}

/** Estantes próprias (ex.: "lista de praia") de uma pessoa, com os livros (mais recentes primeiro). */
export function useCustomShelves(userId?: string) {
  const me = useCurrentUser()
  const owner = userId ?? me.id
  return useQuery({
    queryKey: customShelfKeys.list(owner),
    queryFn: async (): Promise<CustomShelf[]> => {
      const { data, error } = await supabase
        .from('shelves')
        .select('id, user_id, name, color, created_at, books:shelf_books(added_at, book:books(id, title, author, cover_url, pages))')
        .eq('user_id', owner)
        .order('created_at')
      if (error) throw error
      return (data as unknown as CustomShelf[]).map((s) => ({
        ...s,
        books: [...s.books].sort((a, b) => b.added_at.localeCompare(a.added_at)),
      }))
    },
  })
}

function useInvalidateShelves() {
  const queryClient = useQueryClient()
  const me = useCurrentUser()
  return () => queryClient.invalidateQueries({ queryKey: customShelfKeys.list(me.id) })
}

export function useCreateShelf() {
  const invalidate = useInvalidateShelves()
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: ShelfColor }) => {
      const { data, error } = await supabase.from('shelves').insert({ name: name.trim(), color }).select('id').single()
      if (error) throw error
      return data.id
    },
    onSuccess: invalidate,
  })
}

export function useDeleteShelf() {
  const invalidate = useInvalidateShelves()
  return useMutation({
    mutationFn: async (shelfId: string) => {
      const { error } = await supabase.from('shelves').delete().eq('id', shelfId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

/** Põe ou tira um livro de uma estante própria. */
export function useToggleShelfBook() {
  const invalidate = useInvalidateShelves()
  return useMutation({
    mutationFn: async ({ shelfId, bookId, add }: { shelfId: string; bookId: string; add: boolean }) => {
      const { error } = add
        ? await supabase.from('shelf_books').insert({ shelf_id: shelfId, book_id: bookId })
        : await supabase.from('shelf_books').delete().eq('shelf_id', shelfId).eq('book_id', bookId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}
