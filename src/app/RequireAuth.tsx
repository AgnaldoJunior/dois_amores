import { Navigate, Outlet, useLocation } from 'react-router'
import { BookLoading } from '@/components/ui/Loading'
import { useAuth } from '@/lib/auth/AuthProvider'

/** Protege as rotas internas: sem sessão, manda para o login e volta depois. */
export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <BookLoading fullScreen />
  }

  if (!session) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
