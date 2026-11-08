import { useState, type ChangeEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { Avatar, avatarOf } from '@/components/ui/Avatar'
import { Button, ButtonLink } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { Icon } from '@/components/ui/Icon'
import { TextField } from '@/components/ui/TextField'
import { Eyebrow } from '@/components/ui/Typography'
import { useMyClubs } from '@/features/clubs/api'
import { useInvalidatePerson } from '@/features/people/api'
import { useProfile, useUpdateProfile, useUploadAvatar, useUploadCover, type Profile, type ProfileChanges } from '@/features/profile/api'
import { CoverCropDialog } from '@/features/profile/CoverCropDialog'
import type { Crop } from '@/features/profile/coverCrop'
import { AVATAR_ACCEPT, validateAvatarFile } from '@/features/profile/imageResize'
import { suggestUsername, USERNAME_PATTERN } from '@/features/profile/ProfilePage'
import { useShelf } from '@/features/shelf/api'
import { profileThemes, type ProfileThemeId } from '@/theme/tokens'

export const TAGLINES = [
  'gosto de finais que doem',
  'always one more chapter',
  'lendo com a luz baixa',
  'leio com café e chuva lá fora',
  'um livro por vez, com calma',
  'se não for um pouco triste, não é de verdade',
  'my shelf is my biography',
  'releio para sentir de novo',
]

export const GOALS = [
  { value: 12, note: 'um livro a cada mês, no seu tempo' },
  { value: 24, note: 'dois livros por mês, sem pressa' },
  { value: 40, note: 'quase um livro a cada dez dias' },
  { value: 52, note: 'um livro por semana, respirando' },
]

export const GENRES = [
  'romance',
  'suspense',
  'ficção científica',
  'não ficção',
  'poesia',
  'fantasia',
  'drama',
  'clássicos',
  'humor',
  'histórias de família',
  'biografia',
  'terror',
]

const STEPS = 8
const path = (step: number | string) => `/bem-vindo/${step}`

/** /bem-vindo/:passo — cadastro do perfil em 8 passos, depois clube e "tudo pronto". */
export function OnboardingPage() {
  const { passo = '1' } = useParams()
  const { data: profile, isLoading } = useProfile()
  if (isLoading || !profile) return <Shell>{null}</Shell>
  if (passo === 'clube') return <ClubStep />
  if (passo === 'pronto') return <DoneStep profile={profile} />
  const step = Number(passo)
  if (!Number.isInteger(step) || step < 1 || step > STEPS) return <Navigate to={path(1)} replace />
  return <ProfileStep key={step} step={step} profile={profile} />
}

function Shell({ children, back, label, bars }: { children: ReactNode; back?: { to: string; label: string }; label?: string; bars?: number }) {
  return (
    <main className="min-h-dvh bg-page lg:bg-backdrop lg:py-10">
      <div className="relative mx-auto flex min-h-dvh max-w-content-max flex-col gap-6 bg-page px-6 pt-4.5 pb-8 lg:min-h-0 lg:rounded-sheet">
        <div className="flex min-h-11 items-center justify-between">
          {back ? (
            <Link to={back.to} className="font-sans text-base font-semibold text-primary no-underline">
              ‹ {back.label}
            </Link>
          ) : (
            <span />
          )}
          {label && <span className="font-sans text-2xs font-semibold uppercase tracking-label text-muted">{label}</span>}
        </div>
        {bars != null && (
          <div aria-hidden="true" className="-mt-4 flex gap-1.5">
            {Array.from({ length: STEPS }, (_, i) => (
              <i key={i} className={`h-1 flex-1 rounded-full ${i + 1 < bars ? 'bg-primary' : i + 1 === bars ? 'bg-accent' : 'bg-line'}`} />
            ))}
          </div>
        )}
        {children}
      </div>
    </main>
  )
}

function Heading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <header className="rise flex flex-col gap-2">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="m-0 font-display italic font-semibold text-4xl leading-tight text-primary">{title}</h1>
      <p className="m-0 font-sans text-md leading-relaxed text-muted">{text}</p>
    </header>
  )
}

const chipClass = (on: boolean) =>
  'inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3.5 font-sans text-md font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-primary ' +
  (on ? 'border-primary bg-primary text-inverse' : 'border-border bg-card text-ink')

function ProfileStep({ step, profile }: { step: number; profile: Profile }) {
  const navigate = useNavigate()
  const update = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()
  const uploadCover = useUploadCover()
  const invalidate = useInvalidatePerson()
  const [name, setName] = useState(profile.name)
  const [username, setUsername] = useState(profile.username ?? suggestUsername(profile.name))
  const [tagline, setTagline] = useState(profile.tagline ?? '')
  const [goal, setGoal] = useState<number | null>(profile.reading_goal)
  const [theme, setTheme] = useState<ProfileThemeId>((profile.theme as ProfileThemeId) ?? 'classica')
  const [genres, setGenres] = useState<string[]>(profile.favorite_genres ?? [])
  const [pendingCover, setPendingCover] = useState<File | null>(null)
  const [error, setError] = useState('')

  const next = step < STEPS ? path(step + 1) : path('clube')
  const back = step === 1 ? undefined : { to: path(step - 1), label: 'voltar' }

  async function save(changes: ProfileChanges) {
    setError('')
    try {
      await update.mutateAsync(changes)
      invalidate()
      navigate(next)
    } catch (err) {
      setError((err as { code?: string }).code === '23505' ? 'Esse @usuário já é de outra pessoa. Tente outro.' : 'Não foi possível salvar. Tente de novo.')
    }
  }

  async function onImage(e: ChangeEvent<HTMLInputElement>, kind: 'avatar' | 'cover') {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const invalid = validateAvatarFile(file)
    if (invalid) return setError(invalid)
    setError('')
    if (kind === 'cover') return setPendingCover(file)
    try {
      await uploadAvatar.mutateAsync(file)
      invalidate()
    } catch {
      setError('Não foi possível enviar a imagem. Tente outra.')
    }
  }

  async function onCoverCrop(crop: Crop) {
    if (!pendingCover) return
    try {
      await uploadCover.mutateAsync({ file: pendingCover, crop })
      invalidate()
    } catch {
      setError('Não foi possível enviar a imagem. Tente outra.')
    }
    setPendingCover(null)
  }

  const footer = (onContinue: () => void, label = 'continuar', skip = true) => (
    <div className="mt-auto flex flex-col gap-2">
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <Button onClick={onContinue} loading={update.isPending}>
        {label}
      </Button>
      {skip && (
        <Link to={next} className="flex min-h-11 items-center justify-center font-sans text-sm font-semibold text-muted no-underline">
          pular por agora
        </Link>
      )}
    </div>
  )

  return (
    <Shell back={back} label={`passo ${step} de ${STEPS}`} bars={step}>
      {step === 1 && (
        <>
          <Heading eyebrow="primeira página da sua ficha" title="como você se chama?" text="é assim que suas amigas vão te reconhecer nas fichas e no clube." />
          <section className="flex flex-col gap-4 rounded-card border border-line bg-card p-5">
            <div className="flex justify-between">
              <Eyebrow>ficha de leitora</Eyebrow>
              <span className="font-sans text-2xs font-semibold uppercase tracking-label text-muted">nº {profile.id.slice(0, 4)}</span>
            </div>
            <TextField label="Nome" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
            <TextField
              label="Usuário"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={31}
              value={username ? `@${username}` : ''}
              placeholder="@seu.nome"
              onChange={(e) => setUsername(e.target.value.replace(/^@/, '').toLowerCase())}
            />
          </section>
          {footer(() => {
            if (!name.trim()) return setError('Conte como quer ser chamada.')
            if (username && !USERNAME_PATTERN.test(username)) return setError('O @usuário tem de 3 a 30 letras minúsculas, números, ponto ou sublinhado.')
            void save({ name: name.trim(), username: username || null })
          }, 'continuar', false)}
        </>
      )}

      {step === 2 && (
        <>
          <Heading eyebrow="um rosto para a ficha" title="uma foto sua" text="escolha uma imagem da galeria. dá para trocar quando quiser." />
          <div className="flex flex-col items-center gap-4">
            <Avatar {...avatarOf(profile)} size="xl" border="thick" />
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-primary px-5 font-sans text-md font-semibold text-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-primary">
              <Icon name="camera" className="size-icon-sm" />
              {uploadAvatar.isPending ? 'enviando…' : 'escolher da galeria'}
              <input type="file" accept={AVATAR_ACCEPT} className="sr-only" onChange={(e) => onImage(e, 'avatar')} />
            </label>
            <Link to="/perfil/avatar" className="font-sans text-sm font-semibold text-primary no-underline">
              ou crie um avatar ilustrado →
            </Link>
          </div>
          {footer(() => navigate(next))}
        </>
      )}

      {step === 3 && (
        <>
          {pendingCover && (
            <CoverCropDialog file={pendingCover} busy={uploadCover.isPending} onCancel={() => setPendingCover(null)} onConfirm={onCoverCrop} />
          )}
          <Heading eyebrow="o cenário da ficha" title="a capa do seu perfil" text="uma imagem da sua galeria aparece no topo do seu perfil." />
          <div className="relative h-36 overflow-hidden rounded-card bg-blush">
            {profile.cover_url && <img src={profile.cover_url} alt="" className="size-full object-cover" />}
            <label className="absolute right-3 bottom-3 flex min-h-9 cursor-pointer items-center rounded-full bg-page px-3.5 font-sans text-sm font-semibold text-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-primary">
              {uploadCover.isPending ? 'enviando…' : '+ escolher da galeria'}
              <input type="file" accept={AVATAR_ACCEPT} className="sr-only" onChange={(e) => onImage(e, 'cover')} />
            </label>
          </div>
          {footer(() => navigate(next))}
        </>
      )}

      {step === 4 && (
        <>
          <Heading eyebrow="o que vai na sua ficha" title="uma frase sobre você" text="escolha uma sugestão ou escreva a sua. ela aparece logo abaixo do nome." />
          <fieldset className="flex flex-wrap gap-2">
            <legend className="mb-2 font-serif italic text-md text-muted">sem ideia? a gente te dá umas dicas ✦</legend>
            {TAGLINES.map((t) => (
              <label key={t} className={chipClass(tagline === t)}>
                <input type="radio" name="tagline" checked={tagline === t} onChange={() => setTagline(t)} className="sr-only" />
                {t}
              </label>
            ))}
          </fieldset>
          <TextField label="Sua frase" maxLength={120} value={tagline} onChange={(e) => setTagline(e.target.value)} />
          {footer(() => void save({ tagline: tagline.trim() || null }))}
        </>
      )}

      {step === 5 && (
        <>
          <Heading eyebrow="o ano que começa" title={`quantos livros em ${new Date().getFullYear()}?`} text="sua meta aparece nos seus números. dá para mudar quando quiser." />
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Meta de leitura</legend>
            {[...GOALS, { value: null, note: 'sem números, só leitura' }].map((g) => (
              <label
                key={g.value ?? 'sem'}
                className={
                  'flex min-h-14 cursor-pointer items-center gap-4 rounded-card border px-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-primary ' +
                  (goal === g.value ? 'border-primary bg-tag' : 'border-line bg-card')
                }
              >
                <input type="radio" name="goal" checked={goal === g.value} onChange={() => setGoal(g.value)} className="sr-only" />
                <span className="w-16 font-display italic font-bold text-3xl text-primary">{g.value ?? '—'}</span>
                <span className="font-serif italic text-md text-ink">{g.note}</span>
              </label>
            ))}
          </fieldset>
          {footer(() => void save({ reading_goal: goal }))}
        </>
      )}

      {step === 6 && (
        <>
          <Heading eyebrow="a última camada" title="o tema do seu perfil" text="ele define a cor de destaque e o papel do seu perfil." />
          <fieldset className="grid grid-cols-2 gap-2.5">
            <legend className="sr-only">Tema do perfil</legend>
            {(Object.entries(profileThemes) as [ProfileThemeId, (typeof profileThemes)[ProfileThemeId]][]).map(([id, t]) => (
              <label
                key={id}
                className={'relative flex h-20 cursor-pointer flex-col justify-end overflow-hidden rounded-md border-strong p-2.5 has-[:focus-visible]:outline has-[:focus-visible]:outline-primary ' + (theme === id ? 'border-primary shadow-selected' : 'border-line')}
                style={{ backgroundColor: t.paper }}
              >
                <input type="radio" name="theme" checked={theme === id} onChange={() => setTheme(id)} className="sr-only" />
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-5" style={{ backgroundColor: t.band }} />
                <span className="relative font-display italic font-semibold text-md" style={{ color: t.accent }}>
                  {theme === id ? '✓ ' : ''}
                  {t.label}
                </span>
              </label>
            ))}
          </fieldset>
          {footer(() => void save({ theme }), 'continuar', false)}
        </>
      )}

      {step === 7 && (
        <>
          <Heading eyebrow="sua estante" title="o que você está lendo?" text="a gente monta sua estante a partir disso. ela pode começar vazia, e tudo bem." />
          <nav aria-label="Como começar a estante" className="flex flex-col gap-2.5">
            {[
              { to: '/publicar', title: 'estou lendo um', note: 'já comecei um livro' },
              { to: '/buscar', title: 'quero ler', note: 'quero guardar um livro para depois' },
              { to: next, title: 'só olhando', note: 'a estante fica vazia por enquanto' },
            ].map((o) => (
              <Link key={o.title} to={o.to} className="flex min-h-16 items-center justify-between rounded-card border border-line bg-card px-4 text-ink no-underline">
                <span className="flex flex-col">
                  <span className="font-display italic font-semibold text-xl">{o.title}</span>
                  <span className="font-serif italic text-sm text-muted">{o.note}</span>
                </span>
                <span aria-hidden="true" className="text-muted">›</span>
              </Link>
            ))}
          </nav>
          {footer(() => navigate(next), 'continuar', false)}
        </>
      )}

      {step === 8 && (
        <>
          <Heading eyebrow="o que você lê" title="do que você gosta?" text="escolha pelo menos três. isso ajuda nas sugestões; dá para mudar depois." />
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Gostos</legend>
            {GENRES.map((g) => {
              const on = genres.includes(g)
              return (
                <label key={g} className={chipClass(on)}>
                  <input type="checkbox" checked={on} onChange={() => setGenres((c) => (on ? c.filter((x) => x !== g) : [...c, g]))} className="sr-only" />
                  {g}
                </label>
              )
            })}
          </fieldset>
          <p className="m-0 font-sans text-2xs font-semibold uppercase tracking-label text-muted">
            {genres.length} {genres.length === 1 ? 'escolhido' : 'escolhidos'} · mínimo 3
          </p>
          {footer(() => {
            if (genres.length < 3) return setError('Escolha pelo menos três gostos.')
            void save({ favorite_genres: genres })
          }, 'continuar', false)}
        </>
      )}
    </Shell>
  )
}

function ClubStep() {
  return (
    <Shell back={{ to: path(STEPS), label: 'gostos' }} label="opcional">
      <Heading eyebrow="clube de leitura" title="quer ler com alguém?" text="dá para entrar em um clube, criar o seu ou deixar para depois." />
      <nav aria-label="Clube de leitura" className="flex flex-col gap-2.5">
        <Link to="/clubes?entrar=1" className="flex flex-col gap-1 rounded-card border border-line bg-card p-4 text-ink no-underline">
          <Eyebrow>tenho um convite</Eyebrow>
          <span className="font-display italic font-semibold text-2xl">entrar em um clube</span>
          <span className="font-sans text-base text-muted">use o código que você recebeu.</span>
        </Link>
        <Link to="/clubes/novo" className="flex flex-col gap-1 rounded-card bg-primary p-4 text-inverse no-underline hover:text-inverse">
          <Eyebrow className="text-blush">começar do zero</Eyebrow>
          <span className="font-display italic font-semibold text-2xl">criar um clube ✦</span>
          <span className="font-sans text-base text-blush">dê um nome e convide quem quiser.</span>
        </Link>
      </nav>
      <ButtonLink to={path('pronto')} variant="outline" className="mt-auto">
        pular etapa
      </ButtonLink>
    </Shell>
  )
}

function DoneStep({ profile }: { profile: Profile }) {
  const navigate = useNavigate()
  const update = useUpdateProfile()
  const { data: shelf } = useShelf()
  const { data: clubs } = useMyClubs()
  const books = (shelf?.read.length ?? 0) + (shelf?.reading.length ?? 0) + (shelf?.wishlist.length ?? 0)

  async function finish(to: string) {
    if (!profile.onboarded_at) await update.mutateAsync({ onboarded_at: new Date().toISOString() }).catch(() => undefined)
    navigate(to, { replace: true })
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-primaryHover px-6 py-12 text-inverse lg:bg-backdrop">
      <div className="mx-auto flex max-w-content-max flex-col items-center gap-6 text-center lg:rounded-sheet lg:bg-primaryHover lg:p-10">
        <span aria-hidden="true" className="twinkle top-16 left-10 text-xl">✦</span>
        <span aria-hidden="true" className="twinkle twinkle-late top-40 right-10 text-sm">✧</span>
        <Eyebrow className="text-blush">tudo pronto ✦</Eyebrow>
        <h1 className="rise m-0 font-display italic font-bold text-5xl leading-tight">seu perfil está pronto</h1>
        <p className="m-0 font-serif italic text-xl text-blush">bem-vinda ao dois amores. sua história começa agora.</p>
        <div className="rise delay-1 flex flex-col items-center gap-3 rounded-card bg-page px-8 py-6 text-ink">
          <Avatar {...avatarOf(profile)} size="lg" border="thick" />
          <p className="m-0 font-display italic font-semibold text-3xl text-primary">{profile.name}</p>
          {profile.tagline && <p className="m-0 font-serif italic text-md text-primary">{profile.tagline} ♡</p>}
          <dl className="m-0 flex gap-6">
            {[
              [books, 'livros'],
              [profile.favorite_genres.length, 'gostos'],
              [clubs?.length ?? 0, 'clubes'],
            ].map(([n, l]) => (
              <div key={l} className="flex flex-col items-center">
                <dt className="sr-only">{l}</dt>
                <dd className="m-0 font-display italic font-semibold text-2xl text-primary">{n}</dd>
                <span aria-hidden="true" className="font-sans text-2xs text-muted">
                  {l}
                </span>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex w-full flex-col gap-2.5">
          <Button onClick={() => finish('/teste')} className="bg-page text-primary hover:bg-tag hover:text-primary">
            descobrir meu lado leitora ✦
          </Button>
          <Button variant="outline" onClick={() => finish('/')} className="border-blush text-inverse hover:bg-primarySoft hover:text-inverse">
            ir para o início
          </Button>
          <button type="button" onClick={() => finish('/perfil')} className="min-h-11 font-sans text-sm font-semibold text-blush">
            ver meu perfil
          </button>
        </div>
      </div>
    </main>
  )
}
