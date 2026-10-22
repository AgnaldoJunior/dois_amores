import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '@/lib/auth/AuthProvider'
import { isValidEmail, translateAuthError, validatePassword } from '@/lib/auth/authErrors'
import { supabase } from '@/lib/supabase'
import { AuthLayout, TextLink } from './AuthLayout'
import { authRedirect } from './authRedirects'

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm', string>>

export function SignUpPage() {
  const { session } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (session) return <Navigate to="/" replace />

  function validate(): Errors {
    const next: Errors = {}
    if (!name.trim()) next.name = 'Conte como quer ser chamada(o).'
    if (!isValidEmail(email)) next.email = 'Informe um e-mail válido.'
    const pw = validatePassword(password)
    if (pw) next.password = pw
    if (confirm !== password) next.confirm = 'As senhas não são iguais.'
    return next
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() }, emailRedirectTo: authRedirect.home() },
    })
    setSubmitting(false)
    if (error) return setFormError(translateAuthError(error))
    // Com confirmação ativa, a sessão só existe depois do clique no e-mail.
    if (!data.session) setSentTo(email.trim())
  }

  if (sentTo) {
    return (
      <AuthLayout title="Confira seu e-mail">
        <FormMessage tone="success">
          Enviamos um link de confirmação para {sentTo}. Abra o e-mail e toque no link para ativar a conta.
          Se não encontrar, olhe também a pasta de spam.
        </FormMessage>
        <TextLink to="/entrar">Voltar para o login</TextLink>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Criar conta">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          label="Nome"
          autoComplete="name"
          required
          value={name}
          error={errors.name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="new-password"
          required
          hint="mínimo de 8 caracteres, com letras e números"
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          error={errors.confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <FormMessage tone="error">{formError}</FormMessage>
        <Button type="submit" loading={submitting}>
          Criar conta
        </Button>
      </form>
      <TextLink to="/entrar">Já tenho conta</TextLink>
    </AuthLayout>
  )
}
