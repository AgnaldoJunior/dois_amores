import { useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { PageTitle } from '@/components/ui/Typography'
import { authRedirect } from '@/features/auth/authRedirects'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { deleteMyAccount, useProfile, useUpdateProfile } from './api'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col">
      <h2 className="m-0 mb-1 font-display italic font-semibold text-2xl text-primary">{title}</h2>
      <div className="flex flex-col border-t border-line">{children}</div>
    </section>
  )
}

const rowClass = 'flex min-h-14 items-center justify-between gap-4 border-b border-line py-3 text-ink no-underline'

/** /configuracoes — privacidade, conta, sair e excluir a conta. */
export function SettingsPage() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: profile } = useProfile()
  const update = useUpdateProfile()
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function onSignOut() {
    await supabase.auth.signOut()
    queryClient.clear()
    navigate('/entrar', { replace: true })
  }

  async function onPasswordLink() {
    if (!user.email) return
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: authRedirect.resetPassword() })
    setMessage(error ? { tone: 'error', text: 'Não foi possível enviar agora. Tente de novo.' } : { tone: 'success', text: `Enviamos um link para ${user.email}.` })
  }

  async function onDelete() {
    setDeleting(true)
    try {
      await deleteMyAccount(user.id)
      queryClient.clear()
      navigate('/entrar', { replace: true })
    } catch {
      setDeleting(false)
      setMessage({ tone: 'error', text: 'Não foi possível excluir a conta. Tente de novo.' })
    }
  }

  const showFollowers = profile?.show_followers ?? true

  return (
    <div className="flex flex-col gap-6">
      <BackLink to="/perfil">perfil</BackLink>
      <PageTitle>configurações</PageTitle>

      <Section title="privacidade">
        <label className={rowClass}>
          <span className="flex flex-col">
            <span className="font-sans text-md font-semibold">mostrar seguidores</span>
            <span className="font-serif italic text-sm text-muted">quantas pessoas te seguem e quem você segue</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={showFollowers}
            onChange={() => update.mutate({ show_followers: !showFollowers })}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className={
              'relative h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-primary ' +
              (showFollowers ? 'bg-primary' : 'bg-line')
            }
          >
            <span className={'absolute top-1 size-4 rounded-full bg-card transition-all ' + (showFollowers ? 'right-1' : 'left-1')} />
          </span>
        </label>
      </Section>

      <Section title="conta">
        <Link to="/perfil/editar" className={rowClass}>
          <span className="font-sans text-md font-semibold">editar perfil</span>
          <span aria-hidden="true" className="text-muted">›</span>
        </Link>
        <button type="button" onClick={onPasswordLink} className={`${rowClass} w-full text-left`}>
          <span className="flex flex-col">
            <span className="font-sans text-md font-semibold">trocar senha</span>
            <span className="font-serif italic text-sm text-muted">mandamos um link para o seu e-mail</span>
          </span>
          <span aria-hidden="true" className="text-muted">›</span>
        </button>
        <Link to="/privacidade" className={rowClass}>
          <span className="font-sans text-md font-semibold">política de privacidade</span>
          <span aria-hidden="true" className="text-muted">›</span>
        </Link>
        <button type="button" onClick={onSignOut} className={`${rowClass} w-full text-left`}>
          <span className="font-sans text-md font-semibold text-primary">sair da conta</span>
          <span aria-hidden="true" className="text-muted">›</span>
        </button>
      </Section>

      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}

      <section aria-label="Excluir conta" className="flex flex-col gap-3 rounded-card border border-line bg-card p-4">
        <h2 className="m-0 font-display italic font-semibold text-xl text-primary">excluir conta</h2>
        <p className="m-0 font-sans text-base leading-relaxed text-muted">
          Apaga seu perfil, suas leituras, estantes, fichas e sua foto. Clubes que você criou passam para o membro mais antigo. Não dá para desfazer.
        </p>
        {confirmDelete ? (
          <div className="flex flex-col gap-2">
            <Button variant="danger" onClick={onDelete} loading={deleting}>
              Sim, excluir minha conta
            </Button>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setConfirmDelete(true)}>
            Excluir conta
          </Button>
        )}
      </section>

      <p className="m-0 text-center font-serif italic text-sm text-muted">dois amores · clube do livro ✦</p>
    </div>
  )
}
