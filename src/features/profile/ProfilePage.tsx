import { useQueryClient } from '@tanstack/react-query'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Avatar } from '@/components/ui/Avatar'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormMessage } from '@/components/ui/FormMessage'
import { TextAreaField, TextField } from '@/components/ui/TextField'
import { PageTitle, SectionTitle } from '@/components/ui/Typography'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { deleteMyAccount, useProfile, useUpdateProfile, useUploadAvatar, type Profile } from './api'
import { AVATAR_ACCEPT, validateAvatarFile } from './imageResize'

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile()
  if (isLoading || !profile) {
    return <p className="font-hand text-lg text-primary">Carregando perfil…</p>
  }
  return <ProfileForm profile={profile} />
}

function ProfileForm({ profile }: { profile: Profile }) {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const update = useUpdateProfile()
  const upload = useUploadAvatar()

  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setMessage({ tone: 'error', text: 'O nome não pode ficar vazio.' })
    try {
      await update.mutateAsync({ name: name.trim(), bio: bio.trim() || null })
      setMessage({ tone: 'success', text: 'Perfil salvo.' })
    } catch {
      setMessage({ tone: 'error', text: 'Não foi possível salvar. Tente de novo.' })
    }
  }

  async function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const invalid = validateAvatarFile(file)
    if (invalid) return setMessage({ tone: 'error', text: invalid })
    try {
      await upload.mutateAsync(file)
      setMessage({ tone: 'success', text: 'Foto atualizada.' })
    } catch {
      setMessage({ tone: 'error', text: 'Não foi possível enviar a foto. Tente outra imagem.' })
    }
  }

  async function onSignOut() {
    await supabase.auth.signOut()
    queryClient.clear()
    navigate('/entrar', { replace: true })
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

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>Perfil</PageTitle>

      <div className="flex flex-col items-center gap-3">
        <Avatar name={profile.name} url={profile.avatar_url} size="lg" />
        <label className={buttonClass('outline', false, 'cursor-pointer focus-within:outline focus-within:outline-primary')}>
          {upload.isPending ? 'Enviando…' : profile.avatar_url ? 'Trocar foto' : 'Adicionar foto'}
          <input
            type="file"
            accept={AVATAR_ACCEPT}
            className="sr-only"
            onChange={onPhoto}
            disabled={upload.isPending}
          />
        </label>
      </div>

      <form onSubmit={onSave} className="flex flex-col gap-4">
        <TextField label="Nome" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="E-mail" type="email" value={user.email ?? ''} readOnly disabled />
        <TextAreaField
          label="Bio"
          maxLength={500}
          rows={3}
          hint="conte um pouco do seu jeito de ler"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
        <Button type="submit" loading={update.isPending}>
          Salvar
        </Button>
      </form>

      <Button variant="outline" onClick={onSignOut}>
        Sair
      </Button>

      <Link to="/privacidade" className="self-center font-sans text-sm text-primary underline underline-offset-4">
        Política de privacidade
      </Link>

      <Card className="flex flex-col gap-3">
        <SectionTitle>Excluir conta</SectionTitle>
        <p className="font-sans text-sm text-primary">
          Apaga seu perfil, suas leituras, seus posts e sua foto. Clubes que você criou passam para o membro mais
          antigo. Não dá para desfazer.
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
      </Card>
    </div>
  )
}
