import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button, buttonClass } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { TextField } from '@/components/ui/TextField'
import { PageTitle } from '@/components/ui/Typography'
import { AVATAR_ACCEPT, validateAvatarFile } from '@/features/profile/imageResize'
import { useCreateClub } from './api'
import { clubPath } from './ClubsPage'

/** /clubes/novo — nome e capa opcional. Quem cria vira dona do clube. */
export function CreateClubPage() {
  const navigate = useNavigate()
  const create = useCreateClub()
  const [name, setName] = useState('')
  const [cover, setCover] = useState<File | null>(null)
  const [error, setError] = useState('')
  const preview = useMemo(() => (cover ? URL.createObjectURL(cover) : null), [cover])
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview])

  function onCover(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const invalid = validateAvatarFile(file)
    if (invalid) return setError(invalid)
    setError('')
    setCover(file)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Dê um nome ao clube.')
    setError('')
    try {
      const clubId = await create.mutateAsync({ name, cover })
      navigate(clubPath(clubId), {
        replace: true,
        state: { flash: 'Clube criado! Copie o código e envie para quem você quer convidar.' },
      })
    } catch {
      setError('Não foi possível criar o clube. Tente de novo.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <PageTitle>Criar clube</PageTitle>
      <TextField label="Nome do clube" maxLength={80} required value={name} onChange={(e) => setName(e.target.value)} />

      <div className="flex items-center gap-4">
        {preview ? (
          <img src={preview} alt="Prévia da capa do clube" className="w-cover-sm-w h-cover-sm-h rounded-card border border-primary object-cover" />
        ) : (
          <div aria-hidden="true" className="w-cover-sm-w h-cover-sm-h rounded-card border border-primary bg-card" />
        )}
        <label className={buttonClass('outline', false, 'cursor-pointer focus-within:outline focus-within:outline-primary')}>
          {cover ? 'Trocar capa' : 'Escolher capa (opcional)'}
          <input type="file" accept={AVATAR_ACCEPT} className="sr-only" onChange={onCover} />
        </label>
      </div>

      {error && <FormMessage tone="error">{error}</FormMessage>}
      <Button type="submit" loading={create.isPending} className="text-base">
        CRIAR CLUBE
      </Button>
    </form>
  )
}
