import type { Session } from '@supabase/supabase-js'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { AuthContext, type AuthState } from '@/lib/auth/AuthProvider'

export const fakeSession = (id = 'user-1', email = 'leyna@example.com') =>
  ({ access_token: 'token', user: { id, email } }) as unknown as Session

/** Renderiza o app numa rota, com sessão fake (ou sem sessão) e QueryClient isolado. */
export function renderApp(path: string, session: Session | null = fakeSession()) {
  const auth: AuthState = { session, user: session?.user ?? null, loading: false, recovering: false }
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
  return { ...utils, router }
}
