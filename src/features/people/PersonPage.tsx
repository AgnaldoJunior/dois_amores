import { Navigate, useParams } from 'react-router'
import { FormMessage } from '@/components/ui/FormMessage'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { usePerson } from './api'
import { ProfileView } from './ProfileView'

/** /pessoas/:userId — perfil de outra pessoa, com o tema que ela escolheu. */
export function PersonPage() {
  const { userId = '' } = useParams()
  const me = useCurrentUser()
  const { data: profile, isLoading, isError } = usePerson(userId)
  if (userId === me.id) return <Navigate to="/perfil" replace />
  if (isLoading) return <p className="m-0 font-serif italic text-md text-muted">abrindo o perfil…</p>
  if (isError || !profile) return <FormMessage tone="error">Perfil não encontrado.</FormMessage>
  return <ProfileView profile={profile} />
}
