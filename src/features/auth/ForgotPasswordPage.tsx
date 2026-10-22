import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { TextField } from '@/components/ui/TextField'
import { isValidEmail, translateAuthError } from '@/lib/auth/authErrors'
import { supabase } from '@/lib/supabase'
import { AuthLayout, TextLink } from './AuthLayout'
import { authRedirect } from './authRedirects'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValidEmail(email)) return setError('Informe um e-mail válido.')
    setError('')
    setSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: authRedirect.resetPassword(),
    })
    setSubmitting(false)
    if (error) return setError(translateAuthError(error))
    setSent(true)
  }

  return (
    <AuthLayout title="Recuperar senha">
      {sent ? (
        <FormMessage tone="success">
          Se existir uma conta com {email.trim()}, você vai receber um link para criar uma nova senha.
          Confira também a pasta de spam.
        </FormMessage>
      ) : (
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
          <FormMessage tone="error">{error}</FormMessage>
          <Button type="submit" loading={submitting}>
            Enviar link
          </Button>
        </form>
      )}
      <TextLink to="/entrar">Voltar para o login</TextLink>
    </AuthLayout>
  )
}
