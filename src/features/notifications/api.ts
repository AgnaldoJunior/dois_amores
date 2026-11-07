import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileKeys } from '@/features/profile/api'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { supabase } from '@/lib/supabase'

export type Notification = {
  kind: 'follow' | 'like' | 'comment'
  created_at: string
  body: string | null
  post_id: string | null
  actor: { id: string; name: string; avatar_url: string | null; avatar_mode?: string | null; avatar_config?: unknown } | null
  book: { id: string; title: string } | null
}

export const notificationKeys = { list: (userId: string) => ['notifications', userId] as const }

/** Quem seguiu, curtiu ou comentou, com o nome da pessoa e o livro da ficha. */
export function useNotifications() {
  const me = useCurrentUser()
  return useQuery({
    queryKey: notificationKeys.list(me.id),
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase.rpc('my_notifications', { p_limit: 50 })
      if (error) throw error
      const rows = data ?? []
      const actorIds = [...new Set(rows.map((r) => r.actor_id))]
      const postIds = [...new Set(rows.map((r) => r.post_id).filter((id): id is string => !!id))]
      const [actors, posts] = await Promise.all([
        actorIds.length
          ? supabase.from('profiles').select('id, name, avatar_url, avatar_mode, avatar_config').in('id', actorIds)
          : Promise.resolve({ data: [], error: null }),
        postIds.length
          ? supabase.from('posts').select('id, reading:user_books!posts_user_book_id_fkey(book:books(id, title))').in('id', postIds)
          : Promise.resolve({ data: [], error: null }),
      ])
      if (actors.error) throw actors.error
      if (posts.error) throw posts.error
      const actorById = new Map((actors.data ?? []).map((a) => [a.id, a]))
      const bookByPost = new Map(
        ((posts.data ?? []) as unknown as { id: string; reading: { book: Notification['book'] } | null }[]).map((p) => [p.id, p.reading?.book ?? null]),
      )
      return rows.map((r) => ({
        kind: r.kind as Notification['kind'],
        created_at: r.created_at,
        body: r.body,
        post_id: r.post_id,
        actor: (actorById.get(r.actor_id) as Notification['actor']) ?? null,
        book: r.post_id ? (bookByPost.get(r.post_id) ?? null) : null,
      }))
    },
  })
}

/** Marca tudo como visto (o ponto do sino some). */
export function useMarkNotificationsSeen() {
  const me = useCurrentUser()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('profiles').update({ notifications_seen_at: new Date().toISOString() }).eq('id', me.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.detail(me.id) }),
  })
}

/** Agrupa por "hoje", "esta semana" e "antes". */
export function groupByWhen<T extends { created_at: string }>(items: T[], now = new Date()) {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const weekAgo = startOfDay - 6 * 24 * 3600 * 1000
  const groups: { label: string; items: T[] }[] = [
    { label: 'hoje', items: [] },
    { label: 'esta semana', items: [] },
    { label: 'antes', items: [] },
  ]
  for (const item of items) {
    const t = Date.parse(item.created_at)
    groups[t >= startOfDay ? 0 : t >= weekAgo ? 1 : 2]!.items.push(item)
  }
  return groups.filter((g) => g.items.length > 0)
}
