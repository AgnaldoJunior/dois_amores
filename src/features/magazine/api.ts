import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MagazineSource } from './buildMagazineData'

const BOOK = 'id, title, author, pages, cover_url'

/** Tudo o que a revista precisa: clube, membros, livros do clube e leituras dos membros. */
export async function fetchMagazineSource(clubId: string): Promise<MagazineSource> {
  const { data: club, error } = await supabase
    .from('clubs')
    .select(
      `name, cover_url,
       members:club_members(user_id, joined_at, profile:profiles(name, avatar_url)),
       clubBooks:club_books(status, started_on, finished_on, edition_number, book:books(${BOOK}))`,
    )
    .eq('id', clubId)
    .single()
  if (error) throw error
  const source = club as unknown as Omit<MagazineSource, 'readings' | 'club'> & { name: string; cover_url: string | null }

  const memberIds = source.members.map((m) => m.user_id)
  const { data: readings, error: readingsError } = await supabase
    .from('user_books')
    .select(
      `user_id, book_id, started_on, finished_on, rank_characters, rank_plot, rank_writing, rank_ending,
       favorite_character, favorite_quote, comment, book:books(${BOOK})`,
    )
    .in('user_id', memberIds.length ? memberIds : ['00000000-0000-0000-0000-000000000000'])
  if (readingsError) throw readingsError

  return {
    club: { name: source.name, cover_url: source.cover_url },
    members: source.members,
    clubBooks: source.clubBooks,
    readings: readings as unknown as MagazineSource['readings'],
  }
}

export function useMagazineSource(clubId: string) {
  return useQuery({ queryKey: ['clubs', 'magazine', clubId], queryFn: () => fetchMagazineSource(clubId) })
}
