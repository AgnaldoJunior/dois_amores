import { Navigate, Outlet } from 'react-router'
import { useProfile } from '@/features/profile/api'
import { AppNav } from './AppNav'

export function AppLayout() {
  const { data: profile } = useProfile()
  // Conta nova (sem data de cadastro do perfil) passa primeiro pelo "bem-vindo".
  if (profile && profile.onboarded_at === null) return <Navigate to="/bem-vindo/1" replace />
  return (
    <div className="min-h-dvh bg-page lg:bg-backdrop lg:pl-sidebar-w">
      <main
        className={
          'mx-auto w-full max-w-content-max px-6 pt-4.5 ' +
          'pb-[calc(var(--da-size-nav-h)+env(safe-area-inset-bottom)+var(--da-space-8))] ' +
          'lg:my-6 lg:max-w-content-wide lg:rounded-sheet lg:bg-page lg:px-10 lg:pt-10 lg:pb-16'
        }
      >
        <Outlet />
      </main>
      <AppNav />
    </div>
  )
}
