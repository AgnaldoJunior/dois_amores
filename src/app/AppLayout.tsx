import { Outlet } from 'react-router'
import { AppNav } from './AppNav'

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-page lg:pl-sidebar-w">
      <main
        className={
          'mx-auto w-full max-w-content-max px-5 pt-12 ' +
          'pb-[calc(var(--da-size-nav-h)+env(safe-area-inset-bottom)+var(--da-space-8))] ' +
          'lg:max-w-content-wide lg:pb-16'
        }
      >
        <Outlet />
      </main>
      <AppNav />
    </div>
  )
}
