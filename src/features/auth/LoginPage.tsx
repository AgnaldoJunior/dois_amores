import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Button, ButtonLink } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '@/lib/auth/AuthProvider'
import { translateAuthError } from '@/lib/auth/authErrors'
import { supabase } from '@/lib/supabase'
import { AuthLayout, TextLink } from './AuthLayout'
import { authRedirect, safeNext } from './authRedirects'

export function LoginPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const next = safeNext((location.state as { from?: string } | null)?.from)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  if (session) return <Navigate to={next} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return setError('Informe e-mail e senha.')
    setError('')
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setSubmitting(false)
    if (error) return setError(translateAuthError(error))
    navigate(next, { replace: true })
  }

  async function onGoogle() {
    setError('')
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirect.home() },
    })
    if (error) {
      setGoogleLoading(false)
      setError(translateAuthError(error))
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FormMessage tone="error">{error}</FormMessage>
        <Button type="submit" loading={submitting}>
          Entrar
        </Button>
      </form>
      <ButtonLink to="/cadastro" variant="outline">
        Criar conta
      </ButtonLink>
      <Button variant="outline" onClick={onGoogle} loading={googleLoading}>
        Continuar com Google
      </Button>
      <TextLink to="/recuperar-senha">Esqueci minha senha</TextLink>
      <TextLink to="/privacidade">Privacidade</TextLink>
    </AuthLayout>
  )
}
