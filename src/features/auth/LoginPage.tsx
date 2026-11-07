import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '@/lib/auth/AuthProvider'
import { translateAuthError } from '@/lib/auth/authErrors'
import { supabase } from '@/lib/supabase'
import { AuthLayout, OrDivider, TextLink } from './AuthLayout'
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
    <AuthLayout title="oi, leitora">
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
        <TextLink to="/recuperar-senha" className="self-end -mt-1.5">
          esqueci a senha
        </TextLink>
        <FormMessage tone="error">{error}</FormMessage>
        <Button type="submit" loading={submitting}>
          entrar
        </Button>
      </form>
      <OrDivider />
      <Button variant="quiet" onClick={onGoogle} loading={googleLoading}>
        <span aria-hidden="true" className="font-display font-bold text-xl leading-none text-primary">G</span>
        continuar com Google
      </Button>
      <p className="m-0 text-center font-sans text-base font-medium">
        ainda não tem conta?{' '}
        <Link to="/cadastro" className="font-bold text-primary no-underline">
          criar conta
        </Link>
      </p>
      <TextLink to="/privacidade">privacidade</TextLink>
    </AuthLayout>
  )
}
