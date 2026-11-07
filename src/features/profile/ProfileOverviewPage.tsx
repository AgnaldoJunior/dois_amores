import { Link } from 'react-router'
import { Icon } from '@/components/ui/Icon'
import { ProfileView } from '@/features/people/ProfileView'
import { useShelf } from '@/features/shelf/api'
import { useProfile } from './api'

const iconLink = 'flex size-11 items-center justify-center rounded-full bg-page text-primary'

/** /perfil — o próprio perfil, com atalhos para editar e para as configurações. */
export function ProfileOverviewPage() {
  const { data: profile, isLoading } = useProfile()
  const { data: shelf } = useShelf()
  if (isLoading || !profile) return <p className="m-0 font-serif italic text-md text-muted">abrindo seu perfil…</p>
  return (
    <ProfileView
      profile={profile}
      wishlistCount={shelf?.wishlist.length ?? 0}
      topActions={
        <>
          <Link to="/perfil/editar" aria-label="Editar perfil" className={iconLink}>
            <Icon name="edit" className="size-icon-sm" />
          </Link>
          <Link to="/configuracoes" aria-label="Configurações" className={iconLink}>
            <Icon name="settings" className="size-icon-sm" />
          </Link>
        </>
      }
    />
  )
}
