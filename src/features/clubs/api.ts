import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ensureCatalogBook, readingKeys, type CatalogInput } from '@/features/readings/api'
import { CLUB_COVER_SIZE, resizeImage } from '@/features/profile/imageResize'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import type { ClubBookStatus, ReadingLike } from '@/lib/domain/clubs'
import { normalizeInviteCode } from '@/lib/domain/clubs'
import { supabase } from '@/lib/supabase'

/** Campos do avatar ilustrado (ver src/lib/avatar/config.ts). */
export type AvatarFields = { avatar_mode?: string | null; avatar_config?: unknown }

export type ClubSummary = {
  id: string
  name: string
  cover_url: string | null
  memberCount: number
  members?: { user_id: string; profile: { id: string; name: string; avatar_url: string | null } & AvatarFields }[]
  /** Livros do clube (status e datas) para a carta da lista: leitura atual e votação aberta. */
  books?: { status: ClubBookStatus; started_on: string | null; due_on: string | null; book: { title: string; author: string | null } }[]
}

export type ClubMember = {
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  profile: { id: string; name: string; avatar_url: string | null; pet: string | null } & AvatarFields
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
  queued_at: string | null
  due_on: string | null
}

export type ClubDetail = {
  id: string
  name: string
  cover_url: string | null
  invite_code: string
  created_by: string | null
  description: string | null
  members: ClubMember[]
  books: ClubBook[]
  /** Leituras dos membros para os livros do clube (médias e reviews). */
  readings: ClubReading[]
}

/** Leitura de um membro para um livro do clube, com os campos da review. */
export type ClubReading = ReadingLike & {
  favorite_character: string | null
  favorite_quote: string | null
  comment: string | null
}

export const clubKeys = {
  all: ['clubs'] as const,
  list: (userId: string) => ['clubs', 'list', userId] as const,
  detail: (clubId: string) => ['clubs', 'detail', clubId] as const,
  member: (userId: string) => ['clubs', 'member', userId] as const,
  myBooks: (userId: string) => ['clubs', 'my-books', userId] as const,
  year: (clubId: string, year: number) => ['clubs', 'year', clubId, year] as const,
  shelves: (clubId: string) => ['clubs', 'shelves', clubId] as const,
  events: (clubId: string) => ['clubs', 'events', clubId] as const,
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
        .select(
          `id, name, cover_url, created_at,
           members:club_members(user_id, profile:profiles(id, name, avatar_url, avatar_mode, avatar_config)),
           books:club_books(status, started_on, due_on, book:books(title, author))`,
        )
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as unknown as (Omit<ClubSummary, 'memberCount'> & { members: NonNullable<ClubSummary['members']> })[]).map((c) => ({
        ...c,
        memberCount: c.members.length,
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
          `id, name, cover_url, invite_code, created_by, description,
           members:club_members(user_id, role, joined_at, profile:profiles(id, name, avatar_url, pet, avatar_mode, avatar_config)),
           books:club_books(id, status, started_on, finished_on, edition_number, created_at, queued_at, due_on, proposed_by,
             book:books(id, title, author, cover_url, pages, enriched_at),
             votes:club_book_votes(user_id, approved))`,
        )
        .eq('id', clubId)
        .single()
      if (error) throw error
      const club = data as unknown as Omit<ClubDetail, 'readings'>

      const bookIds = club.books.map((b) => b.book.id)
      const memberIds = club.members.map((m) => m.user_id)
      let readings: ClubReading[] = []
      if (bookIds.length && memberIds.length) {
        const res = await supabase
          .from('user_books')
          .select(`user_id, book_id, started_on, finished_on, ${RANKS}, favorite_character, favorite_quote, comment`)
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
  profile: { id: string; name: string; avatar_url: string | null; bio: string | null; pet: string | null } & AvatarFields
  readings: (ReadingLike & { book: { id: string; title: string; cover_url: string | null; enriched_at?: string | null } })[]
}

/** Perfil de um membro (Figma 10): foto, nome e dados literários. */
export function useMemberProfile(userId: string) {
  return useQuery({
    queryKey: clubKeys.member(userId),
    queryFn: async (): Promise<MemberProfile> => {
      const [profile, readings] = await Promise.all([
        supabase.from('profiles').select('id, name, avatar_url, bio, pet, avatar_mode, avatar_config').eq('id', userId).single(),
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

export type MyClubBook = {
  id: string
  club_id: string
  status: ClubBookStatus
  edition_number: number | null
  started_on: string | null
  proposed_by: string | null
  book: { id: string; title: string; author: string | null; cover_url: string | null }
}

/** Livros de todos os clubes de que a pessoa participa (RLS filtra os clubes). */
export function useMyClubBooks() {
  const user = useCurrentUser()
  return useQuery({
    queryKey: clubKeys.myBooks(user.id),
    queryFn: async (): Promise<MyClubBook[]> => {
      const { data, error } = await supabase
        .from('club_books')
        .select('id, club_id, status, edition_number, started_on, proposed_by, book:books(id, title, author, cover_url)')
        .in('status', ['queued', 'reading', 'finished'])
        .order('edition_number', { ascending: false, nullsFirst: true })
      if (error) throw error
      return data as unknown as MyClubBook[]
    },
  })
}

/** Leituras terminadas no ano por todos os membros do clube (ranking e prêmios). */
export function useClubYearReadings(clubId: string, memberIds: string[], year: number) {
  return useQuery({
    queryKey: clubKeys.year(clubId, year),
    enabled: memberIds.length > 0,
    queryFn: async (): Promise<ReadingLike[]> => {
      const { data, error } = await supabase
        .from('user_books')
        .select(`user_id, book_id, started_on, finished_on, ${RANKS}`)
        .in('user_id', memberIds)
        .gte('finished_on', `${year}-01-01`)
        .lte('finished_on', `${year}-12-31`)
      if (error) throw error
      return data
    },
  })
}

export type ShelfReading = ReadingLike & {
  book: { id: string; title: string; author: string | null; cover_url: string | null }
}

/** Livros terminados por todos os membros (os favoritos das estantes, fora do clube). */
export function useClubShelfReadings(clubId: string, memberIds: string[]) {
  return useQuery({
    queryKey: clubKeys.shelves(clubId),
    enabled: memberIds.length > 0,
    queryFn: async (): Promise<ShelfReading[]> => {
      const { data, error } = await supabase
        .from('user_books')
        .select(`user_id, book_id, started_on, finished_on, ${RANKS}, book:books(id, title, author, cover_url)`)
        .in('user_id', memberIds)
        .not('finished_on', 'is', null)
      if (error) throw error
      return data as unknown as ShelfReading[]
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

export type ClubEvent = {
  id: string
  title: string
  notes: string | null
  happens_on: string
  created_by: string | null
}

/** Agenda do clube (encontros, conversas, combinados). */
export function useClubEvents(clubId: string) {
  return useQuery({
    queryKey: clubKeys.events(clubId),
    queryFn: async (): Promise<ClubEvent[]> => {
      const { data, error } = await supabase
        .from('club_events')
        .select('id, title, notes, happens_on, created_by')
        .eq('club_id', clubId)
        .order('happens_on')
      if (error) throw error
      return data
    },
  })
}

export function useAddClubEvent(clubId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (event: { title: string; happens_on: string; notes: string | null }) => {
      const { error } = await supabase.from('club_events').insert({ club_id: clubId, ...event })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clubKeys.events(clubId) }),
  })
}

export function useDeleteClubEvent(clubId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from('club_events').delete().eq('id', eventId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clubKeys.events(clubId) }),
  })
}

/** Prazo da leitura da vez (qualquer membro ajusta). */
export function useSetClubBookDue(clubId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ clubBookId, dueOn }: { clubBookId: string; dueOn: string | null }) => {
      const { error } = await supabase.rpc('set_club_book_due', { p_club_book_id: clubBookId, p_due_on: dueOn as string })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clubKeys.detail(clubId) }),
  })
}

/** Nome e descrição (só a dona). */
export function useUpdateClubInfo(clubId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (info: { name: string; description: string | null }) => {
      const { error } = await supabase.from('clubs').update(info).eq('id', clubId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clubKeys.all }),
  })
}
