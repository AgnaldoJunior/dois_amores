import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import type { Ranks } from '@/lib/domain/ratings'
import { supabase } from '@/lib/supabase'

export const FEED_PAGE_SIZE = 10

export type FeedPost = {
  id: string
  created_at: string
  author: { id: string; name: string; avatar_url: string | null; avatar_mode?: string | null; avatar_config?: unknown } | null
  reading:
    | (Ranks & {
        id: string
        finished_on: string | null
        comment: string | null
        favorite_quote: string | null
        book: { id: string; title: string; author: string | null; cover_url: string | null } | null
      })
    | null
  likes: { user_id: string }[]
  comments: { count: number }[]
}

const FEED_FIELDS = `id, created_at,
  author:profiles!posts_user_id_fkey(id, name, avatar_url, avatar_mode, avatar_config),
  reading:user_books!posts_user_book_id_fkey(id, finished_on, rank_characters, rank_plot, rank_writing, rank_ending,
    comment, favorite_quote, book:books(id, title, author, cover_url)),
  likes:post_likes(user_id),
  comments:post_comments(count)`

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

export type ReadingNow = {
  id: string
  user: { id: string; name: string }
  book: { id: string; title: string; cover_url: string | null }
}

/** "Lendo agora entre amigos": leituras em andamento das outras pessoas (mais recentes primeiro). */
export function useFriendsReadingNow(limit = 8) {
  const user = useCurrentUser()
  return useQuery({
    queryKey: ['feed', 'reading-now', user.id],
    queryFn: async (): Promise<ReadingNow[]> => {
      const { data, error } = await supabase
        .from('user_books')
        .select('id, user:profiles!user_books_user_id_fkey(id, name), book:books(id, title, cover_url)')
        .is('finished_on', null)
        .neq('user_id', user.id)
        .order('started_on', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as unknown as ReadingNow[]
    },
  })
}

/** Uma ficha do feed (para a tela de comentários). */
export function usePost(postId: string) {
  return useQuery({
    queryKey: ['feed', 'post', postId],
    queryFn: async (): Promise<FeedPost> => {
      const { data, error } = await supabase.from('posts').select(FEED_FIELDS).eq('id', postId).single()
      if (error) throw error
      return data as unknown as FeedPost
    },
  })
}

export function useToggleLike() {
  const queryClient = useQueryClient()
  const me = useCurrentUser()
  return useMutation({
    mutationFn: async ({ postId, like }: { postId: string; like: boolean }) => {
      const { error } = like
        ? await supabase.from('post_likes').insert({ post_id: postId })
        : await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', me.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  })
}

export type PostComment = {
  id: string
  body: string
  created_at: string
  user: { id: string; name: string; avatar_url: string | null; avatar_mode?: string | null; avatar_config?: unknown }
}

export function usePostComments(postId: string) {
  return useQuery({
    queryKey: ['feed', 'comments', postId],
    queryFn: async (): Promise<PostComment[]> => {
      const { data, error } = await supabase
        .from('post_comments')
        .select('id, body, created_at, user:profiles!post_comments_user_id_fkey(id, name, avatar_url, avatar_mode, avatar_config)')
        .eq('post_id', postId)
        .order('created_at')
      if (error) throw error
      return data as unknown as PostComment[]
    },
  })
}

export function useAddComment(postId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from('post_comments').insert({ post_id: postId, body: body.trim() })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  })
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('post_comments').delete().eq('id', commentId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed', 'comments', postId] }),
  })
}
