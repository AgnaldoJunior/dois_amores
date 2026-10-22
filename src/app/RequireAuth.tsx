import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/lib/auth/AuthProvider'

/** Protege as rotas internas: sem sessão, manda para o login e volta depois. */
export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-dvh bg-page flex items-center justify-center" role="status">
        <span className="font-script text-3xl text-primary">carregando…</span>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
