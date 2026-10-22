import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '@/lib/auth/AuthProvider'
import { translateAuthError, validatePassword } from '@/lib/auth/authErrors'
import { supabase } from '@/lib/supabase'
import { AuthLayout, TextLink } from './AuthLayout'

/** Aberta pelo link do e-mail de recuperação: o Supabase cria uma sessão temporária. */
export function ResetPasswordPage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const invalid = validatePassword(password)
    if (invalid) return setError(invalid)
    if (password !== confirm) return setError('As senhas não são iguais.')
    setError('')
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (error) return setError(translateAuthError(error))
    navigate('/', { replace: true })
  }

  if (loading) {
    return (
      <AuthLayout title="Nova senha">
        <p className="font-hand text-lg text-primary">Abrindo o link…</p>
      </AuthLayout>
    )
  }

  if (!session) {
    return (
      <AuthLayout title="Nova senha">
        <FormMessage tone="error">Este link expirou ou já foi usado. Peça um novo.</FormMessage>
        <TextLink to="/recuperar-senha">Pedir novo link</TextLink>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Nova senha">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          hint="mínimo de 8 caracteres, com letras e números"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          label="Confirmar nova senha"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <FormMessage tone="error">{error}</FormMessage>
        <Button type="submit" loading={submitting}>
          Salvar nova senha
        </Button>
      </form>
    </AuthLayout>
  )
}
