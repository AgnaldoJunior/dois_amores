import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export type AuthState = {
  session: Session | null
  user: User | null
  loading: boolean
  /** true depois que o usuário abre o link de recuperação de senha. */
  recovering: boolean
}

export const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  recovering: false,
})

/** Erros do servidor que significam "este login não vale mais" (sem rede não conta: o PWA funciona offline). */
const STALE_SESSION_CODES = new Set(['user_not_found', 'session_not_found', 'bad_jwt'])

export async function isStaleSession(): Promise<boolean> {
  const { error } = await supabase.auth.getUser()
  if (!error) return false
  return (error.code != null && STALE_SESSION_CODES.has(error.code)) || error.status === 403
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    recovering: false,
  })

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      // A sessão salva no aparelho pode ser de uma conta que não existe mais
      // (excluída em outro aparelho, ou banco local recriado). Confirma no servidor.
      if (data.session && (await isStaleSession())) {
        await supabase.auth.signOut({ scope: 'local' })
        if (active) setState((s) => ({ ...s, session: null, user: null, loading: false }))
        return
      }
      if (!active) return
      setState((s) => ({ ...s, session: data.session, user: data.session?.user ?? null, loading: false }))
    })

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState((s) => ({
        session,
        user: session?.user ?? null,
        loading: false,
        recovering: event === 'PASSWORD_RECOVERY' ? true : event === 'SIGNED_OUT' ? false : s.recovering,
      }))
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

/** Usuário autenticado; só usar dentro de rotas protegidas. */
export function useCurrentUser(): User {
  const { user } = useAuth()
  if (!user) throw new Error('useCurrentUser usado fora de rota autenticada')
  return user
}
