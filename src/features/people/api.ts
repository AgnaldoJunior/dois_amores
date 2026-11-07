import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PROFILE_FIELDS, profileKeys, type Profile } from '@/features/profile/api'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import type { Ranks } from '@/lib/domain/ratings'
import { supabase } from '@/lib/supabase'

export const peopleKeys = {
  all: ['people'] as const,
  person: (userId: string) => ['people', 'person', userId] as const,
  follows: (userId: string) => ['people', 'follows', userId] as const,
  favorites: (userId: string) => ['people', 'favorites', userId] as const,
  readings: (userId: string) => ['people', 'readings', userId] as const,
  search: (q: string) => ['people', 'search', q] as const,
}

export type PersonSummary = Pick<Profile, 'id' | 'name' | 'username' | 'avatar_url' | 'avatar_mode' | 'avatar_config' | 'tagline'>
const SUMMARY_FIELDS = 'id, name, username, avatar_url, avatar_mode, avatar_config, tagline'

/** Perfil de qualquer pessoa (o próprio vem do cache de useProfile). */
export function usePerson(userId: string) {
  return useQuery({
    queryKey: peopleKeys.person(userId),
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase.from('profiles').select(PROFILE_FIELDS).eq('id', userId).single()
      if (error) throw error
      return data as unknown as Profile
    },
  })
}

export type FollowInfo = {
  followers: PersonSummary[]
  following: PersonSummary[]
  /** A pessoa logada segue este perfil. */
  followedByMe: boolean
}

/** Seguidores e quem a pessoa segue. */
export function useFollows(userId: string) {
  const me = useCurrentUser()
  return useQuery({
    queryKey: peopleKeys.follows(userId),
    queryFn: async (): Promise<FollowInfo> => {
      const [followers, following] = await Promise.all([
        supabase.from('follows').select(`follower:profiles!follows_follower_id_fkey(${SUMMARY_FIELDS})`).eq('followee_id', userId),
        supabase.from('follows').select(`followee:profiles!follows_followee_id_fkey(${SUMMARY_FIELDS})`).eq('follower_id', userId),
      ])
      if (followers.error) throw followers.error
      if (following.error) throw following.error
      const f = (followers.data as unknown as { follower: PersonSummary }[]).map((r) => r.follower)
      return {
        followers: f,
        following: (following.data as unknown as { followee: PersonSummary }[]).map((r) => r.followee),
        followedByMe: f.some((p) => p.id === me.id),
      }
    },
  })
}

export function useToggleFollow(userId: string) {
  const queryClient = useQueryClient()
  const me = useCurrentUser()
  return useMutation({
    mutationFn: async (follow: boolean) => {
      const { error } = follow
        ? await supabase.from('follows').insert({ followee_id: userId })
        : await supabase.from('follows').delete().eq('follower_id', me.id).eq('followee_id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: peopleKeys.follows(userId) })
      queryClient.invalidateQueries({ queryKey: peopleKeys.follows(me.id) })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export type FavoriteBook = { position: number; book: { id: string; title: string; author: string | null; cover_url: string | null } }

export function useFavorites(userId: string) {
  return useQuery({
    queryKey: peopleKeys.favorites(userId),
    queryFn: async (): Promise<FavoriteBook[]> => {
      const { data, error } = await supabase
        .from('profile_favorites')
        .select('position, book:books(id, title, author, cover_url)')
        .eq('user_id', userId)
        .order('position')
      if (error) throw error
      return data as unknown as FavoriteBook[]
    },
  })
}

/** Troca os favoritos (até 4) mantendo a ordem escolhida. */
export function useSaveFavorites() {
  const me = useCurrentUser()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bookIds: string[]) => {
      const del = await supabase.from('profile_favorites').delete().eq('user_id', me.id)
      if (del.error) throw del.error
      if (bookIds.length === 0) return
      const { error } = await supabase
        .from('profile_favorites')
        .insert(bookIds.slice(0, 4).map((book_id, i) => ({ position: i + 1, book_id })))
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: peopleKeys.favorites(me.id) }),
  })
}

export type PersonReading = Ranks & {
  id: string
  started_on: string
  finished_on: string | null
  favorite_quote: string | null
  comment: string | null
  format: string | null
  book: { id: string; title: string; author: string | null; pages: number | null; cover_url: string | null }
}

/** Leituras de qualquer pessoa (para o perfil, os lidos e os números de outra pessoa). */
export function usePersonReadings(userId: string) {
  return useQuery({
    queryKey: peopleKeys.readings(userId),
    queryFn: async (): Promise<PersonReading[]> => {
      const { data, error } = await supabase
        .from('user_books')
        .select(
          `id, started_on, finished_on, rank_characters, rank_plot, rank_writing, rank_ending, favorite_quote, comment, format,
           book:books(id, title, author, pages, cover_url)`,
        )
        .eq('user_id', userId)
        .order('finished_on', { ascending: false, nullsFirst: true })
      if (error) throw error
      return data as unknown as PersonReading[]
    },
  })
}

/** Busca pessoas por nome ou @usuário. */
export function useSearchPeople(q: string) {
  const me = useCurrentUser()
  const term = q.trim().replace(/^@/, '').replace(/[%,()]/g, '')
  return useQuery({
    queryKey: peopleKeys.search(term),
    enabled: term.length >= 2,
    queryFn: async (): Promise<PersonSummary[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select(SUMMARY_FIELDS)
        .or(`name.ilike.%${term}%,username.ilike.%${term}%`)
        .neq('id', me.id)
        .limit(20)
      if (error) throw error
      return data as unknown as PersonSummary[]
    },
  })
}

/** Invalida o perfil próprio e o público ao salvar. */
export function useInvalidatePerson() {
  const queryClient = useQueryClient()
  const me = useCurrentUser()
  return () => {
    queryClient.invalidateQueries({ queryKey: profileKeys.detail(me.id) })
    queryClient.invalidateQueries({ queryKey: peopleKeys.person(me.id) })
  }
}
