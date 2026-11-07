import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { IllustratedAvatar } from '@/components/IllustratedAvatar'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { Icon } from '@/components/ui/Icon'
import { TextField } from '@/components/ui/TextField'
import { PageTitle } from '@/components/ui/Typography'
import {
  DEFAULT_AVATAR,
  EXTRAS,
  GLASSES,
  HAIR_STYLES,
  parseAvatarConfig,
  randomAvatar,
  type AvatarConfig,
} from '@/lib/avatar/config'
import { PETS } from '@/lib/pets'
import { tokens } from '@/theme/tokens'
import { useProfile, useUpdateProfile, type Profile } from './api'

const TABS = [
  { id: 'skin', label: 'pele', hint: 'escolha o tom de pele' },
  { id: 'style', label: 'cabelo', hint: 'qual é o penteado?' },
  { id: 'hair', label: 'cor', hint: 'e a cor do cabelo?' },
  { id: 'glasses', label: 'óculos', hint: 'óculos de leitora' },
  { id: 'pet', label: 'bichinho', hint: 'seu bichinho marca os livros que você escolher' },
  { id: 'shirt', label: 'roupa', hint: 'cor da blusinha' },
  { id: 'extras', label: 'extras', hint: 'um toque final' },
] as const

type TabId = (typeof TABS)[number]['id']

/** /perfil/avatar — "Crie seu avatar". */
export function AvatarBuilderPage() {
  const { data: profile, isLoading } = useProfile()
  if (isLoading || !profile) return <p className="font-serif italic text-lg text-primary">Abrindo o ateliê…</p>
  return <Builder profile={profile} />
}

function Builder({ profile }: { profile: Profile }) {
  const navigate = useNavigate()
  const update = useUpdateProfile()
  const [config, setConfig] = useState<AvatarConfig>(() => parseAvatarConfig(profile.avatar_config) ?? DEFAULT_AVATAR)
  const [pet, setPet] = useState<string | null>(profile.pet)
  const [name, setName] = useState(profile.name)
  const [tab, setTab] = useState<TabId>('skin')
  const [error, setError] = useState('')
  const set = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => setConfig((c) => ({ ...c, [key]: value }))
  const current = TABS.find((t) => t.id === tab)!

  function shuffle() {
    setConfig(randomAvatar())
    setPet(PETS[Math.floor(Math.random() * PETS.length)]!.emoji)
  }

  async function save(mode: 'illustrated' | 'photo') {
    if (!name.trim()) return setError('O nome não pode ficar vazio.')
    setError('')
    try {
      await update.mutateAsync(
        mode === 'illustrated'
          ? { name: name.trim(), pet, avatar_mode: 'illustrated', avatar_config: config }
          : { avatar_mode: 'photo' },
      )
      navigate('/perfil')
    } catch {
      setError('Não foi possível salvar o avatar. Tente de novo.')
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <BackLink to="/perfil">perfil</BackLink>
        <button
          type="button"
          onClick={shuffle}
          className=" inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-primary bg-tag px-3 font-sans font-semibold text-2xs uppercase tracking-label"
        >
          <Icon name="dice" className="size-icon-sm" />
          sortear
        </button>
      </div>
      <PageTitle className="-mt-2">Crie seu avatar</PageTitle>

      <div className="bg-tag flex h-preview items-center justify-center rounded-card border border-line">
        <figure className=" relative m-0 flex flex-col items-center bg-accent px-2.5 pt-2.5 pb-1">
          <span aria-hidden="true" className=" absolute -top-2.5 left-1/2 h-6 w-16 -translate-x-1/2 bg-card opacity-90" />
          <IllustratedAvatar config={config} className="size-avatar-xl max-w-full" label="Prévia do seu avatar" />
          <figcaption className="font-display italic text-3xl leading-tight">{name || 'você'}</figcaption>
          {pet && (
            <span aria-hidden="true" className="absolute -right-4 -bottom-3 flex size-12 items-center justify-center rounded-full border border-primary bg-page text-2xl">
              {pet}
            </span>
          )}
        </figure>
      </div>

      <div role="tablist" aria-label="Partes do avatar" className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`avatar-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="avatar-panel"
            onClick={() => setTab(t.id)}
            className={
              'min-h-11 shrink-0 rounded-full border border-primary px-3.5 font-sans font-semibold text-2xs uppercase tracking-label ' +
              (tab === t.id ? 'bg-primary text-inverse' : 'bg-page text-primary')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id="avatar-panel" role="tabpanel" aria-labelledby={`avatar-tab-${tab}`} className="flex flex-col gap-2.5">
        <p className="font-serif italic text-lg">{current.hint}</p>
        {tab === 'skin' && (
          <Swatches
            label="Tom de pele"
            options={tokens.avatar.skin.map((s) => ({ color: s.fill, label: s.label }))}
            value={config.skin}
            onChange={(i) => set('skin', i)}
          />
        )}
        {tab === 'hair' && (
          <Swatches
            label="Cor do cabelo"
            options={tokens.avatar.hair.map((h) => ({ color: h.fill, label: h.label }))}
            value={config.hair}
            onChange={(i) => set('hair', i)}
          />
        )}
        {tab === 'shirt' && (
          <Swatches
            label="Cor da blusa"
            options={tokens.avatar.shirt.map((s) => ({ color: s.fill, label: s.label }))}
            value={config.shirt}
            onChange={(i) => set('shirt', i)}
          />
        )}
        {tab === 'style' && (
          <Tiles label="Penteado" value={config.style} onChange={(v) => set('style', v)} options={HAIR_STYLES.map((o) => ({ value: o.id, label: o.label, preview: { ...config, style: o.id } }))} />
        )}
        {tab === 'glasses' && (
          <Tiles label="Óculos" value={config.glasses} onChange={(v) => set('glasses', v)} options={GLASSES.map((o) => ({ value: o.id, label: o.label, preview: { ...config, glasses: o.id } }))} />
        )}
        {tab === 'extras' && (
          <Tiles label="Extras" value={config.extras} onChange={(v) => set('extras', v)} options={EXTRAS.map((o) => ({ value: o.id, label: o.label, preview: { ...config, extras: o.id } }))} />
        )}
        {tab === 'pet' && (
          <Tiles
            label="Bichinho"
            value={pet ?? ''}
            onChange={(v) => setPet(v)}
            options={PETS.map((p) => ({ value: p.emoji, label: p.label, content: <span className="text-3xl">{p.emoji}</span> }))}
          />
        )}
      </div>

      <TextField label="Nome no clube" autoComplete="nickname" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <Button onClick={() => save('illustrated')} loading={update.isPending && update.variables?.avatar_mode === 'illustrated'}>
        Pronta!
      </Button>
      {profile.avatar_mode === 'illustrated' && (
        <Button variant="outline" onClick={() => save('photo')} loading={update.isPending && update.variables?.avatar_mode === 'photo'}>
          {profile.avatar_url ? 'Voltar a usar minha foto' : 'Voltar a usar a inicial'}
        </Button>
      )}
    </div>
  )
}

/** Círculos de cor (rádios). */
function Swatches({ label, options, value, onChange }: { label: string; options: { color: string; label: string }[]; value: number; onChange: (i: number) => void }) {
  return (
    <fieldset className="flex flex-wrap gap-3">
      <legend className="sr-only">{label}</legend>
      {options.map((o, i) => (
        <label
          key={o.label}
          className={
            'flex size-swatch cursor-pointer rounded-full has-[:focus-visible]:outline has-[:focus-visible]:outline-primary ' +
            (value === i ? 'border-thick border-title' : 'border border-primary')
          }
          style={{ backgroundColor: o.color }}
        >
          <input type="radio" name={label} checked={value === i} onChange={() => onChange(i)} className="sr-only" aria-label={o.label} />
        </label>
      ))}
    </fieldset>
  )
}

type TileOption<T extends string> = { value: T; label: string; preview?: AvatarConfig; content?: ReactNode }

/** Grade de opções (rádios) com miniatura do avatar ou um emoji. */
function Tiles<T extends string>({ label, options, value, onChange }: { label: string; options: TileOption<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset className="grid grid-cols-4 gap-2">
      <legend className="sr-only">{label}</legend>
      {options.map((o) => {
        const on = value === o.value
        return (
          <label
            key={o.value}
            className={
              'flex cursor-pointer flex-col items-center gap-1 rounded-card border border-primary p-1.5 has-[:focus-visible]:outline has-[:focus-visible]:outline-primary ' +
              (on ? 'bg-primary text-inverse' : 'bg-page text-primary')
            }
          >
            <input type="radio" name={label} checked={on} onChange={() => onChange(o.value)} className="sr-only" />
            {o.preview ? <IllustratedAvatar config={o.preview} className="size-avatar-md rounded-sm" /> : <span aria-hidden="true">{o.content}</span>}
            <span className="font-sans font-semibold text-2xs uppercase tracking-label">{o.label}</span>
          </label>
        )
      })}
    </fieldset>
  )
}
