import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Avatar, avatarOf } from '@/components/ui/Avatar'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { Icon } from '@/components/ui/Icon'
import { TextAreaField, TextField } from '@/components/ui/TextField'
import { HandText } from '@/components/ui/Typography'
import { useInvalidatePerson } from '@/features/people/api'
import { profileThemes, type ProfileThemeId } from '@/theme/tokens'
import { useProfile, useUpdateProfile, useUploadAvatar, useUploadCover, type Profile } from './api'
import { AVATAR_ACCEPT, validateAvatarFile } from './imageResize'
import { CoverCropDialog } from './CoverCropDialog'
import type { Crop } from './coverCrop'
import { PetPicker } from './PetPicker'

export const USERNAME_PATTERN = /^[a-z0-9._]{3,30}$/

/** "Leyna Souza" → "leyna.souza" (sugestão de @usuário). */
export const suggestUsername = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, 30)

/** /perfil/editar — capa, foto, nome, @usuário, frase, meta, tema, bichinho e favoritos. */
export function ProfileEditPage() {
  const { data: profile, isLoading } = useProfile()
  if (isLoading || !profile) return <p className="m-0 font-serif italic text-md text-muted">abrindo seu perfil…</p>
  return <ProfileForm profile={profile} />
}

function ProfileForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()
  const upload = useUploadAvatar()
  const uploadCover = useUploadCover()
  const invalidatePerson = useInvalidatePerson()

  const [name, setName] = useState(profile.name)
  const [username, setUsername] = useState(profile.username ?? '')
  const [tagline, setTagline] = useState(profile.tagline ?? '')
  const [goal, setGoal] = useState(profile.reading_goal?.toString() ?? '')
  const [theme, setTheme] = useState<ProfileThemeId>((profile.theme as ProfileThemeId) ?? 'classica')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [pet, setPet] = useState<string | null>(profile.pet)
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)
  const [pendingCover, setPendingCover] = useState<File | null>(null)

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setMessage({ tone: 'error', text: 'O nome não pode ficar vazio.' })
    const user = username.trim().replace(/^@/, '').toLowerCase()
    if (user && !USERNAME_PATTERN.test(user)) {
      return setMessage({ tone: 'error', text: 'O @usuário tem de 3 a 30 letras minúsculas, números, ponto ou sublinhado.' })
    }
    const goalNumber = goal.trim() ? Number(goal) : null
    if (goalNumber != null && (!Number.isInteger(goalNumber) || goalNumber < 1 || goalNumber > 1000)) {
      return setMessage({ tone: 'error', text: 'A meta é um número de livros entre 1 e 1000.' })
    }
    try {
      await update.mutateAsync({
        name: name.trim(),
        username: user || null,
        tagline: tagline.trim() || null,
        reading_goal: goalNumber,
        theme,
        bio: bio.trim() || null,
        pet,
      })
      invalidatePerson()
      setMessage({ tone: 'success', text: 'Perfil salvo ♡' })
    } catch (err) {
      setMessage({
        tone: 'error',
        text: (err as { code?: string }).code === '23505' ? 'Esse @usuário já é de outra pessoa.' : 'Não foi possível salvar. Tente de novo.',
      })
    }
  }

  async function onImage(e: ChangeEvent<HTMLInputElement>, kind: 'avatar' | 'cover') {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const invalid = validateAvatarFile(file)
    if (invalid) return setMessage({ tone: 'error', text: invalid })
    // A capa passa antes pelo ajuste de enquadramento.
    if (kind === 'cover') return setPendingCover(file)
    try {
      await upload.mutateAsync(file)
      invalidatePerson()
      setMessage({ tone: 'success', text: 'Foto atualizada.' })
    } catch {
      setMessage({ tone: 'error', text: 'Não foi possível enviar a imagem. Tente outra.' })
    }
  }

  async function onCoverCrop(crop: Crop) {
    if (!pendingCover) return
    try {
      await uploadCover.mutateAsync({ file: pendingCover, crop })
      invalidatePerson()
      setPendingCover(null)
      setMessage({ tone: 'success', text: 'Capa atualizada.' })
    } catch {
      setPendingCover(null)
      setMessage({ tone: 'error', text: 'Não foi possível enviar a imagem. Tente outra.' })
    }
  }

  return (
    <form onSubmit={onSave} className="flex flex-col gap-5" noValidate>
      {pendingCover && (
        <CoverCropDialog file={pendingCover} busy={uploadCover.isPending} onCancel={() => setPendingCover(null)} onConfirm={onCoverCrop} />
      )}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <BackLink to="/perfil">perfil</BackLink>
        <span className="font-display italic font-semibold text-xl text-ink">editar perfil</span>
        <span />
      </div>

      <div className="relative -mx-6 h-32 overflow-hidden bg-blush lg:mx-0 lg:rounded-card">
        {profile.cover_url && <img src={profile.cover_url} alt="" className="size-full object-cover" />}
        <label className="absolute right-4 bottom-3 flex min-h-9 cursor-pointer items-center rounded-full bg-page px-3.5 font-sans text-sm font-semibold text-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-primary">
          {uploadCover.isPending ? 'enviando…' : 'trocar capa'}
          <input type="file" accept={AVATAR_ACCEPT} className="sr-only" onChange={(e) => onImage(e, 'cover')} disabled={uploadCover.isPending} />
        </label>
      </div>

      <div className="-mt-14 flex items-end gap-3">
        <label className="relative cursor-pointer rounded-full has-[:focus-visible]:outline has-[:focus-visible]:outline-primary" aria-label="Trocar foto">
          <Avatar {...avatarOf(profile)} size="lg" border="thick" />
          <span aria-hidden="true" className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border-strong border-page bg-primary text-inverse">
            <Icon name="camera" className="size-icon-sm" />
          </span>
          <input type="file" accept={AVATAR_ACCEPT} className="sr-only" onChange={(e) => onImage(e, 'avatar')} disabled={upload.isPending} />
        </label>
        <Link to="/perfil/avatar" className="mb-2 font-sans text-sm font-semibold text-primary no-underline">
          ou crie um avatar ilustrado →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Nome" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          label="Usuário"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={31}
          placeholder={`@${suggestUsername(profile.name) || 'seu.nome'}`}
          value={username ? `@${username.replace(/^@/, '')}` : ''}
          onChange={(e) => setUsername(e.target.value.replace(/^@/, '').toLowerCase())}
        />
      </div>
      <TextAreaField
        label="Frase do perfil"
        maxLength={120}
        rows={2}
        hint={`${tagline.length} / 120`}
        placeholder="um marcador é só a promessa de voltar…"
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
      />
      <TextField
        label={`Meta de leitura · ${new Date().getFullYear()}`}
        type="number"
        inputMode="numeric"
        min={1}
        max={1000}
        placeholder="ex.: 40 livros"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-sans text-2xs font-semibold uppercase tracking-label text-primary">Tema do perfil</legend>
        <div className="no-scrollbar -mx-6 flex gap-2.5 overflow-x-auto px-6 pb-2">
          {(Object.entries(profileThemes) as [ProfileThemeId, (typeof profileThemes)[ProfileThemeId]][]).map(([id, t]) => (
            <label
              key={id}
              className={
                'relative h-theme-card-h w-theme-card-w shrink-0 cursor-pointer overflow-hidden rounded-md border-strong has-[:focus-visible]:outline has-[:focus-visible]:outline-primary ' +
                (theme === id ? 'border-primary shadow-selected' : 'border-line')
              }
              style={{ backgroundColor: t.paper }}
            >
              <input type="radio" name="theme" value={id} checked={theme === id} onChange={() => setTheme(id)} className="sr-only" />
              <span aria-hidden="true" className="block h-6" style={{ backgroundColor: t.band }} />
              <span aria-hidden="true" className="absolute top-3.5 left-1/2 size-4.5 -translate-x-1/2 rounded-full border-strong border-card" style={{ backgroundColor: t.accent }} />
              <span className="absolute inset-x-1 top-10 text-center font-display italic font-semibold text-xs leading-tight" style={{ color: t.accent }}>
                {t.label}
              </span>
            </label>
          ))}
        </div>
        <HandText className="text-sm">o tema define a cor de destaque e o papel do seu perfil.</HandText>
      </fieldset>

      <TextAreaField label="Sobre você" maxLength={500} rows={3} hint="conte um pouco do seu jeito de ler" value={bio} onChange={(e) => setBio(e.target.value)} />
      <PetPicker value={pet} onChange={setPet} />

      <div className="flex flex-col border-t border-line">
        <Link to="/perfil/favoritos" className="flex min-h-13 items-center justify-between border-b border-line text-ink no-underline">
          <span className="flex flex-col">
            <span className="font-sans text-md font-semibold">favoritos</span>
            <span className="font-serif italic text-sm text-muted">até 4 capas no perfil</span>
          </span>
          <span className="font-sans text-sm font-semibold text-primary">editar →</span>
        </Link>
      </div>

      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
      <div className="flex gap-2.5">
        <Link to="/perfil" className="flex min-h-button-h flex-1 items-center justify-center rounded-full border border-border font-sans text-md font-semibold text-ink no-underline">
          cancelar
        </Link>
        <Button type="submit" loading={update.isPending} className="flex-1">
          salvar ♡
        </Button>
      </div>
    </form>
  )
}
