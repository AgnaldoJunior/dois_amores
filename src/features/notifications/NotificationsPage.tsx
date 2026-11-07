import { useEffect } from 'react'
import { Link } from 'react-router'
import { Avatar, avatarOf } from '@/components/ui/Avatar'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { Eyebrow, HandText, PageTitle } from '@/components/ui/Typography'
import { useProfile } from '@/features/profile/api'
import { formatDayMonthShort } from '@/lib/dates'
import { groupByWhen, useMarkNotificationsSeen, useNotifications, type Notification } from './api'

function describe(n: Notification) {
  if (n.kind === 'follow') return 'começou a seguir você'
  if (n.kind === 'like') return `curtiu sua ficha${n.book ? ` de ${n.book.title}` : ''}`
  return `comentou na sua ficha: “${n.body ?? ''}”`
}

/** /notificacoes — "novidades": quem seguiu, curtiu ou comentou. */
export function NotificationsPage() {
  const { data: profile } = useProfile()
  const { data, isLoading } = useNotifications()
  const markSeen = useMarkNotificationsSeen()
  const seenAt = profile?.notifications_seen_at
  const unread = data?.filter((n) => !seenAt || n.created_at > seenAt).length ?? 0

  // Abrir a tela marca as novidades como vistas (o ponto do sino some na próxima visita).
  const { mutate } = markSeen
  useEffect(() => {
    if (data && unread > 0) mutate()
  }, [data, unread, mutate])

  return (
    <div className="relative flex flex-col gap-4">
      <BackLink to="/">início</BackLink>
      <div>
        <PageTitle>novidades</PageTitle>
        <HandText>{unread > 0 ? `${unread} ${unread === 1 ? 'nova' : 'novas'} desde a última visita ✦` : 'você está em dia ✧'}</HandText>
      </div>
      {isLoading ? null : !data || data.length === 0 ? (
        <EmptyState title="nada novo por aqui" icon="bell">
          Quando alguém curtir, comentar suas fichas ou começar a seguir você, aparece aqui.
        </EmptyState>
      ) : (
        groupByWhen(data).map((group) => (
          <section key={group.label} aria-label={group.label} className="flex flex-col">
            <Eyebrow className="mb-1">{group.label}</Eyebrow>
            <ul className="flex flex-col">
              {group.items.map((n, i) => {
                const fresh = !seenAt || n.created_at > seenAt
                const to = n.kind === 'follow' ? `/pessoas/${n.actor?.id}` : `/fichas/${n.post_id}`
                return (
                  <li key={`${n.kind}-${n.created_at}-${i}`}>
                    <Link to={to} className="flex items-start gap-3 border-b border-line py-3.5 text-ink no-underline">
                      {n.actor ? <Avatar {...avatarOf(n.actor)} size="xs" /> : <span className="size-avatar-xs" />}
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="font-sans text-base leading-snug">
                          <strong className="font-semibold">{n.actor?.name.split(/\s+/)[0]?.toLowerCase() ?? 'alguém'}</strong> {describe(n)}
                        </span>
                        <span className="font-sans text-2xs font-semibold uppercase tracking-wide text-muted">
                          {formatDayMonthShort(n.created_at.slice(0, 10))}
                        </span>
                      </span>
                      {fresh && <span aria-label="nova" className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
