import { NavLink, useParams } from 'react-router'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTitle } from '@/components/ui/Typography'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { formatCount } from '@/lib/domain/stats'
import { useFollows, usePerson } from './api'
import { PeopleList } from './PeopleList'
import { personPath } from './ProfileView'

/** /pessoas/:userId/seguidores e /seguindo */
export function FollowsPage({ tab }: { tab: 'seguidores' | 'seguindo' }) {
  const { userId = '' } = useParams()
  const me = useCurrentUser()
  const { data: person } = usePerson(userId)
  const { data, isLoading } = useFollows(userId)
  const list = tab === 'seguidores' ? data?.followers : data?.following
  const base = personPath(userId)
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    'flex h-9 flex-1 items-center justify-center rounded-full font-sans text-sm font-semibold no-underline ' +
    (isActive ? 'bg-primary text-inverse' : 'text-muted')

  return (
    <div className="flex flex-col gap-4">
      <BackLink to={userId === me.id ? '/perfil' : base}>{person?.name.split(/\s+/)[0]?.toLowerCase() ?? 'perfil'}</BackLink>
      <PageTitle>pessoas</PageTitle>
      <nav aria-label="Seguidores e seguindo" className="flex gap-1 rounded-full bg-tag p-1">
        <NavLink to={`${base}/seguidores`} className={tabClass}>
          seguidores · {formatCount(data?.followers.length ?? 0)}
        </NavLink>
        <NavLink to={`${base}/seguindo`} className={tabClass}>
          seguindo · {formatCount(data?.following.length ?? 0)}
        </NavLink>
      </nav>
      {isLoading ? null : list && list.length > 0 ? (
        <PeopleList people={list} label={tab === 'seguidores' ? 'Seguidores' : 'Seguindo'} />
      ) : (
        <EmptyState title={tab === 'seguidores' ? 'ninguém por aqui ainda' : 'ainda não segue ninguém'} icon="people">
          {tab === 'seguidores' ? 'Quando alguém seguir, aparece aqui.' : 'Busque amigas pelo nome ou @usuário.'}
        </EmptyState>
      )}
    </div>
  )
}
