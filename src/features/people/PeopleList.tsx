import { Link } from 'react-router'
import { Avatar, avatarOf } from '@/components/ui/Avatar'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { useFollows, type PersonSummary } from './api'
import { FollowButton, personPath } from './ProfileView'

/** Lista de pessoas com o botão seguir/seguindo (seguidores, busca, membros). */
export function PeopleList({ people, label, note }: { people: PersonSummary[]; label: string; note?: (p: PersonSummary) => string | undefined }) {
  const me = useCurrentUser()
  const { data: mine } = useFollows(me.id)
  const following = new Set(mine?.following.map((p) => p.id))
  return (
    <ul aria-label={label} className="flex flex-col">
      {people.map((p) => (
        <li key={p.id} className="flex items-center gap-3 border-b border-line py-3">
          <Link to={personPath(p.id)} className="flex min-w-0 flex-1 items-center gap-3 no-underline">
            <Avatar {...avatarOf(p)} size="sm" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-display italic font-semibold text-xl text-ink">{p.name}</span>
              <span className="truncate font-sans text-sm text-muted">
                {p.username ? `@${p.username}` : 'sem @usuário'}
                {note?.(p) && ` · ${note(p)}`}
              </span>
            </span>
          </Link>
          {p.id !== me.id && <FollowButton userId={p.id} following={following.has(p.id)} />}
        </li>
      ))}
    </ul>
  )
}
