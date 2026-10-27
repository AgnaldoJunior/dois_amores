import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ensureCatalogBook, readingKeys, type CatalogInput } from '@/features/readings/api'
import { CLUB_COVER_SIZE, resizeImage } from '@/features/profile/imageResize'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import type { ClubBookStatus, ReadingLike } from '@/lib/domain/clubs'
import { normalizeInviteCode } from '@/lib/domain/clubs'
import { supabase } from '@/lib/supabase'

export type ClubSummary = { id: string; name: string; cover_url: string | null; memberCount: number }

export type ClubMember = {
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  profile: { id: string; name: string; avatar_url: string | null }
}

export type ClubBook = {
  id: string
  status: ClubBookStatus
  started_on: string | null
  finished_on: string | null
  edition_number: number | null
  created_at: string
  proposed_by: string | null
  book: {
    id: string
    title: string
    author: string | null
    cover_url: string | null
    pages: number | null
    enriched_at?: string | null
  }
  votes: { user_id: string; approved: boolean }[]
}

export type ClubDetail = {
  id: string
  name: string
  cover_url: string | null
  invite_code: string
  created_by: string | null
  members: ClubMember[]
  books: ClubBook[]
  /** Leituras dos membros para os livros do clube (para as médias). */
  readings: ReadingLike[]
}

export const clubKeys = {
  all: ['clubs'] as const,
  list: (userId: string) => ['clubs', 'list', userId] as const,
  detail: (clubId: string) => ['clubs', 'detail', clubId] as const,
  member: (userId: string) => ['clubs', 'member', userId] as const,
}

const RANKS = 'rank_characters, rank_plot, rank_writing, rank_ending'

export function useMyClubs() {
  const user = useCurrentUser()
  return useQuery({
    queryKey: clubKeys.list(user.id),
    queryFn: async (): Promise<ClubSummary[]> => {
      // RLS: só aparecem clubes de que a pessoa participa.
      const { data, error } = await supabase
        .from('clubs')
        .select('id, name, cover_url, created_at, club_members(count)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data.map((c) => ({
        id: c.id,
        name: c.name,
        cover_url: c.cover_url,
        memberCount: (c.club_members as unknown as { count: number }[])[0]?.count ?? 0,
      }))
    },
  })
}

export function useClub(clubId: string) {
  return useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: async (): Promise<ClubDetail> => {
      const { data, error } = await supabase
        .from('clubs')
        .select(
          `id, name, cover_url, invite_code, created_by,
           members:club_members(user_id, role, joined_at, profile:profiles(id, name, avatar_url)),
           books:club_books(id, status, started_on, finished_on, edition_number, created_at, proposed_by,
             book:books(id, title, author, cover_url, pages, enriched_at),
             votes:club_book_votes(user_id, approved))`,
        )
        .eq('id', clubId)
        .single()
      if (error) throw error
      const club = data as unknown as Omit<ClubDetail, 'readings'>

      const bookIds = club.books.map((b) => b.book.id)
      const memberIds = club.members.map((m) => m.user_id)
      let readings: ReadingLike[] = []
      if (bookIds.length && memberIds.length) {
        const res = await supabase
          .from('user_books')
          .select(`user_id, book_id, started_on, finished_on, ${RANKS}`)
          .in('book_id', bookIds)
          .in('user_id', memberIds)
        if (res.error) throw res.error
        readings = res.data
      }
      return { ...club, readings }
    },
  })
}

export type MemberProfile = {
  profile: { id: string; name: string; avatar_url: string | null; bio: string | null }
  readings: (ReadingLike & { book: { id: string; title: string; cover_url: string | null; enriched_at?: string | null } })[]
}

/** Perfil de um membro (Figma 10): foto, nome e dados literários. */
export function useMemberProfile(userId: string) {
  return useQuery({
    queryKey: clubKeys.member(userId),
    queryFn: async (): Promise<MemberProfile> => {
      const [profile, readings] = await Promise.all([
        supabase.from('profiles').select('id, name, avatar_url, bio').eq('id', userId).single(),
        supabase
          .from('user_books')
          .select(`user_id, book_id, started_on, finished_on, ${RANKS}, book:books(id, title, cover_url, pages, enriched_at)`)
          .eq('user_id', userId)
          .order('finished_on', { ascending: false, nullsFirst: false }),
      ])
      if (profile.error) throw profile.error
      if (readings.error) throw readings.error
      return {
        profile: profile.data,
        readings: readings.data.map((r) => ({ ...r, pages: r.book?.pages ?? null })) as MemberProfile['readings'],
      }
    },
  })
}

function useInvalidateClubs() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: clubKeys.all })
    queryClient.invalidateQueries({ queryKey: readingKeys.all })
  }
}

/** Envia a capa (2:3, sem EXIF) para club-covers/<clube>/cover.jpg e atualiza o clube. */
export async function uploadClubCover(clubId: string, file: File) {
  const blob = await resizeImage(file, CLUB_COVER_SIZE)
  const path = `${clubId}/cover.jpg`
  const { error } = await supabase.storage
    .from('club-covers')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' })
  if (error) throw error
  const { data } = supabase.storage.from('club-covers').getPublicUrl(path)
  const url = `${data.publicUrl}?v=${Date.now()}`
  const update = await supabase.from('clubs').update({ cover_url: url }).eq('id', clubId)
  if (update.error) throw update.error
  return url
}

export function useCreateClub() {
  const invalidate = useInvalidateClubs()
  return useMutation({
    mutationFn: async ({ name, cover }: { name: string; cover: File | null }) => {
      const { data, error } = await supabase.rpc('create_club', { p_name: name.trim() }).select('id').single()
      if (error) throw error
      const id = (data as { id: string }).id
      // A capa é opcional: se falhar, o clube já existe e dá para trocar depois.
      if (cover) await uploadClubCover(id, cover).catch(() => null)
      return id
    },
    onSuccess: invalidate,
  })
}

export function useJoinClub() {
  const invalidate = useInvalidateClubs()
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase
        .rpc('join_club', { p_code: normalizeInviteCode(code) })
        .select('id')
        .single()
      if (error) throw error
      return (data as { id: string }).id
    },
    onSuccess: invalidate,
  })
}

export function useProposeBook(clubId: string) {
  const invalidate = useInvalidateClubs()
  return useMutation({
    mutationFn: async (input: CatalogInput | { bookId: string }) => {
      const bookId = 'bookId' in input ? input.bookId : (await ensureCatalogBook(input)).id
      const { error } = await supabase.rpc('propose_club_book', { p_club_id: clubId, p_book_id: bookId })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useVote() {
  const user = useCurrentUser()
  const invalidate = useInvalidateClubs()
  return useMutation({
    // Sem upsert: ele reescreve todas as colunas, e o banco só permite mudar "approved"
    // (ninguém move o próprio voto para outra proposta). Atualiza; se não existir, insere.
    mutationFn: async ({ clubBookId, approved }: { clubBookId: string; approved: boolean }) => {
      const updated = await supabase
        .from('club_book_votes')
        .update({ approved })
        .eq('club_book_id', clubBookId)
        .eq('user_id', user.id)
        .select('club_book_id')
      if (updated.error) throw updated.error
      if (updated.data.length > 0) return
      const { error } = await supabase
        .from('club_book_votes')
        .insert({ club_book_id: clubBookId, user_id: user.id, approved })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useFinishClubBook() {
  const invalidate = useInvalidateClubs()
  return useMutation({
    mutationFn: async (clubBookId: string) => {
      const { error } = await supabase.rpc('finish_club_book', { p_club_book_id: clubBookId })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useWithdrawProposal() {
  const invalidate = useInvalidateClubs()
  return useMutation({
    mutationFn: async (clubBookId: string) => {
      const { error } = await supabase.from('club_books').delete().eq('id', clubBookId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useRegenerateInviteCode(clubId: string) {
  const invalidate = useInvalidateClubs()
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('regenerate_invite_code', { p_club_id: clubId })
      if (error) throw error
      return data as string
    },
    onSuccess: invalidate,
  })
}

export function useChangeClubCover(clubId: string) {
  const invalidate = useInvalidateClubs()
  return useMutation({ mutationFn: (file: File) => uploadClubCover(clubId, file), onSuccess: invalidate })
}

/** Sair do clube (membro) ou excluir (dona). */
export function useLeaveClub(clubId: string) {
  const user = useCurrentUser()
  const invalidate = useInvalidateClubs()
  return useMutation({
    mutationFn: async ({ asOwner }: { asOwner: boolean }) => {
      const { error } = asOwner
        ? await supabase.from('clubs').delete().eq('id', clubId)
        : await supabase.from('club_members').delete().eq('club_id', clubId).eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}
