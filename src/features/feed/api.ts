import { useInfiniteQuery } from '@tanstack/react-query'
import type { Ranks } from '@/lib/domain/ratings'
import { supabase } from '@/lib/supabase'

export const FEED_PAGE_SIZE = 10

export type FeedPost = {
  id: string
  created_at: string
  author: { id: string; name: string; avatar_url: string | null } | null
  reading:
    | (Ranks & {
        id: string
        finished_on: string | null
        comment: string | null
        book: { id: string; title: string; author: string | null; cover_url: string | null } | null
      })
    | null
}

const FEED_FIELDS = `id, created_at,
  author:profiles!posts_user_id_fkey(id, name, avatar_url),
  reading:user_books!posts_user_book_id_fkey(id, finished_on, rank_characters, rank_plot, rank_writing, rank_ending,
    comment, book:books(id, title, author, cover_url))`

export async function fetchFeedPage(offset: number): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(FEED_FIELDS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + FEED_PAGE_SIZE - 1)
  if (error) throw error
  return data as FeedPost[]
}

/** Paginação simples: 10 posts por vez, do mais recente para o mais antigo. */
export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchFeedPage(pageParam),
    getNextPageParam: (last, pages) => (last.length < FEED_PAGE_SIZE ? undefined : pages.length * FEED_PAGE_SIZE),
  })
}
