import { useQuery } from '@tanstack/react-query'
import { illustrationOf } from '@/lib/avatar/config'
import { svgToPng } from '@/lib/avatar/rasterize'
import { avatarSvg } from '@/lib/avatar/shapes'
import { supabase } from '@/lib/supabase'
import type { MagazineSource } from './buildMagazineData'

const BOOK = 'id, title, author, pages, cover_url'

/** Tudo o que a revista precisa: clube, membros, livros do clube e leituras dos membros. */
export async function fetchMagazineSource(clubId: string): Promise<MagazineSource> {
  const { data: club, error } = await supabase
    .from('clubs')
    .select(
      `name, cover_url,
       members:club_members(user_id, joined_at, profile:profiles(name, avatar_url, avatar_mode, avatar_config)),
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
    members: await resolveAvatars(source.members),
    clubBooks: source.clubBooks,
    readings: readings as unknown as MagazineSource['readings'],
  }
}

type MemberWithAvatar = {
  profile: { name: string; avatar_url: string | null; avatar_mode?: string | null; avatar_config?: unknown }
}

/** Quem escolheu o avatar ilustrado aparece na revista com ele (rasterizado em PNG). */
export async function resolveAvatars<M extends MemberWithAvatar>(members: M[], rasterize = svgToPng): Promise<M[]> {
  return Promise.all(
    members.map(async (m) => {
      const config = illustrationOf(m.profile)
      if (!config) return m
      const avatar_url = await rasterize(avatarSvg(config)).catch(() => m.profile.avatar_url)
      return { ...m, profile: { ...m.profile, avatar_url } }
    }),
  )
}

export function useMagazineSource(clubId: string) {
  return useQuery({ queryKey: ['clubs', 'magazine', clubId], queryFn: () => fetchMagazineSource(clubId) })
}
