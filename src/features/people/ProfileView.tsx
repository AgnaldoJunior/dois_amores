import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router'
import { Avatar, avatarOf } from '@/components/ui/Avatar'
import { BookCover } from '@/components/ui/BookCover'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { StatTiles } from '@/components/ui/StatTiles'
import { Quote, SectionTitle } from '@/components/ui/Typography'
import type { Profile } from '@/features/profile/api'
import { archetypeLabel } from '@/features/quiz/archetypes'
import { useCustomShelves } from '@/features/shelf/shelvesApi'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { bookAverage, formatAverage, memberAverage } from '@/lib/domain/ratings'
import { formatCount } from '@/lib/domain/stats'
import { shelfColors, themeVars, type ProfileThemeId } from '@/theme/tokens'
import { useFavorites, useFollows, usePersonReadings, useToggleFollow, type PersonReading } from './api'

export const personPath = (userId: string) => `/pessoas/${userId}`

type ShelfCard = { key: string; to: string; name: string; count: number; cover: PersonReading['book'] | null; color: keyof typeof shelfColors }

/**
 * Perfil "documento": capa, avatar, nome, @usuário, seguidores, frase, arquétipo do teste,
 * números, favoritos e estantes — com o tema escolhido pela pessoa.
 */
export function ProfileView({
  profile,
  wishlistCount,
  topActions,
  extra,
  back,
}: {
  profile: Profile
  wishlistCount?: number
  topActions?: ReactNode
  /** Bloco logo abaixo do cabeçalho (ex.: a participação no clube). */
  extra?: ReactNode
  back?: { to: string; label: string }
}) {
  const me = useCurrentUser()
  const isMe = profile.id === me.id
  const { data: follows } = useFollows(profile.id)
  const { data: favorites } = useFavorites(profile.id)
  const { data: readings } = usePersonReadings(profile.id)
  const { data: custom } = useCustomShelves(profile.id)

  const read = readings?.filter((r) => r.finished_on) ?? []
  const reading = readings?.filter((r) => !r.finished_on) ?? []
  const average = bookAverage(read.map(memberAverage))
  const audiobooks = read.filter((r) => r.format === 'audiobook').length
  const pages = read.reduce((s, r) => s + (r.book.pages ?? 0), 0)
  const base = isMe ? '/estantes' : `${personPath(profile.id)}/estantes`
  const quote = read.find((r) => r.favorite_quote)

  const shelves: ShelfCard[] = [
    { key: 'lidos', to: `${base}/lidos`, name: 'lidos', count: read.length, cover: read[0]?.book ?? null, color: 'areia' },
    { key: 'lendo', to: `${base}/lendo`, name: 'lendo', count: reading.length, cover: reading[0]?.book ?? null, color: 'vinho' },
    ...(isMe && wishlistCount != null ? [{ key: 'quero', to: '/estantes/quero-ler', name: 'quero ler', count: wishlistCount, cover: null, color: 'rosa' as const }] : []),
    ...(custom ?? []).map((s) => ({ key: s.id, to: `${base}/${s.id}`, name: s.name, count: s.books.length, cover: s.books[0]?.book ?? null, color: s.color })),
  ]

  return (
    <div style={themeVars(profile.theme as ProfileThemeId) as CSSProperties} className="relative -mx-6 -mt-4.5 bg-page text-ink lg:mx-0 lg:mt-0 lg:overflow-hidden lg:rounded-sheet">
      <div className="absolute inset-x-6 top-3 z-10 flex items-center justify-between">
        {isMe ? (
          <span className="font-display italic font-semibold text-xl text-primary">
            dois amores <span className="text-gold">✦</span>
          </span>
        ) : (
          <Link to={back?.to ?? '/'} className="rounded-full bg-page px-3 py-1.5 font-sans text-base font-semibold text-primary no-underline">
            ‹ {back?.label ?? 'voltar'}
          </Link>
        )}
        <div className="flex gap-1">{topActions}</div>
      </div>

      <div className="relative h-profile-cover overflow-hidden bg-primary">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="" className="size-full object-cover" />
        ) : (
          <div aria-hidden="true" className="size-full bg-blush opacity-60" />
        )}
      </div>

      <div className="relative -mt-8 flex flex-col gap-5 rounded-t-sheet bg-page px-6 pt-16 pb-6">
        <div className="absolute -top-13 left-1/2 -translate-x-1/2">
          <Avatar {...avatarOf(profile)} size="xl" border="thick" />
        </div>

        <header className="rise flex flex-col items-center gap-2 text-center">
          <h1 className="m-0 font-display italic font-semibold text-4xl leading-none text-primary">{profile.name}</h1>
          <p className="m-0 font-sans text-sm font-medium text-muted">
            {profile.username && <>@{profile.username} · </>}
            {profile.show_followers || isMe ? (
              <>
                <Link to={`${personPath(profile.id)}/seguidores`} className="text-muted no-underline hover:underline">
                  {formatCount(follows?.followers.length ?? 0)} seguidores
                </Link>{' '}
                ·{' '}
                <Link to={`${personPath(profile.id)}/seguindo`} className="text-muted no-underline hover:underline">
                  {formatCount(follows?.following.length ?? 0)} seguindo
                </Link>
              </>
            ) : (
              'perfil de leitora'
            )}
          </p>
          {profile.tagline && <p className="m-0 max-w-xs font-serif italic text-lg leading-snug text-primary">{profile.tagline} ♡</p>}
          {profile.archetype && (
            <Link to="/teste/resultado" className="rounded-full border border-primary px-3.5 py-1 font-sans text-2xs font-semibold uppercase tracking-wide text-primary no-underline">
              ♡ {archetypeLabel(profile.archetype)}
            </Link>
          )}
          {!isMe && <FollowButton userId={profile.id} following={follows?.followedByMe ?? false} />}
        </header>

        {extra}

        <Link to={isMe ? '/numeros' : `${base}/lidos`} aria-label={isMe ? 'Ver seus números' : `Ver os livros de ${profile.name}`} className="no-underline">
          <StatTiles
            label="Números do perfil"
            items={[
              { value: formatCount(read.length), label: 'livros' },
              { value: formatCount(audiobooks), label: 'audiobooks' },
              { value: formatCount(pages), label: 'páginas' },
              { value: average == null ? '–' : `${formatAverage(average)}★`, label: 'média' },
            ]}
          />
        </Link>

        <section aria-labelledby="favorites" className="flex flex-col gap-3">
          <SectionTitle action={isMe ? { to: '/perfil/favoritos', label: 'editar →' } : undefined}>
            <span id="favorites">{isMe ? 'favoritos' : 'favoritos dela'}</span>
          </SectionTitle>
          {favorites && favorites.length > 0 ? (
            <ul className="grid grid-cols-4 gap-2">
              {favorites.map((f) => (
                <li key={f.position}>
                  <Link to={`/livros/${f.book.id}`} aria-label={f.book.title}>
                    <BookCover title={f.book.title} url={f.book.cover_url} size="fill" decorative />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 font-serif italic text-md text-muted">
              {isMe ? (
                <>
                  escolha até 4 livros para mostrar aqui ·{' '}
                  <Link to="/perfil/favoritos" className="text-primary">
                    escolher
                  </Link>
                </>
              ) : (
                'ainda sem favoritos'
              )}
            </p>
          )}
        </section>

        <section aria-labelledby="shelves" className="flex flex-col gap-3">
          <SectionTitle action={isMe ? { to: '/estantes', label: 'ver todas →' } : undefined}>
            <span id="shelves">estantes</span>
          </SectionTitle>
          <ul className="no-scrollbar -mx-6 flex gap-2.5 overflow-x-auto px-6">
            {shelves.map((s) => {
              const c = shelfColors[s.color]
              return (
                <li key={s.key} className="shrink-0">
                  <Link
                    to={s.to}
                    className="flex w-28 flex-col items-center gap-1.5 rounded-card px-2 py-2.5 text-center no-underline"
                    style={{ backgroundColor: c.bg, color: c.fg }}
                  >
                    {s.cover ? (
                      <BookCover title={s.cover.title} url={s.cover.cover_url} size="xs" decorative />
                    ) : (
                      <span aria-hidden="true" className="flex h-cover-xs-h items-center">
                        <Icon name="book" />
                      </span>
                    )}
                    <span className="font-display italic font-semibold text-md leading-tight">{s.name}</span>
                    <span className="font-sans text-2xs font-semibold tracking-wide" style={{ color: c.sub }}>
                      {s.count}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        {quote && (
          <figure className="m-0 rounded-card border border-line bg-card p-4">
            <Quote className="text-lg">{quote.favorite_quote}</Quote>
            <figcaption className="mt-2 font-sans text-2xs font-semibold uppercase tracking-label text-muted">
              {quote.book.title} · citação favorita
            </figcaption>
          </figure>
        )}
      </div>
    </div>
  )
}

export function FollowButton({ userId, following, size = 'sm' }: { userId: string; following: boolean; size?: 'sm' | 'lg' }) {
  const toggle = useToggleFollow(userId)
  return (
    <Button
      size={size}
      fullWidth={false}
      variant={following ? 'outline' : 'primary'}
      aria-pressed={following}
      loading={toggle.isPending}
      onClick={() => toggle.mutate(!following)}
    >
      {following ? 'seguindo ✓' : 'seguir +'}
    </Button>
  )
}
