import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Button } from '@/components/ui/Button'
import { BookCover } from '@/components/ui/BookCover'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Eyebrow } from '@/components/ui/Typography'
import { useFeed, useFriendsReadingNow, type FeedPost } from '@/features/feed/api'
import { PostActions } from '@/features/feed/PostActions'
import { PostCard } from '@/features/feed/PostCard'
import { useNotifications } from '@/features/notifications/api'
import { useProfile } from '@/features/profile/api'
import { ProgressCard } from '@/features/readings/ProgressCard'
import { useShelf } from '@/features/shelf/api'
import { todayIso } from '@/lib/dates'
import { pickOfTheDay } from '@/lib/domain/year'

type Filter = 'tudo' | 'resenhas'

/** Ícone redondo do topo (buscar, descobrir, novidades). */
function TopIcon({ to, icon, label }: { to: string; icon: IconName; label: string }) {
  return (
    <Link to={to} aria-label={label} className="flex size-11 items-center justify-center text-primary">
      <Icon name={icon} className="size-icon" />
    </Link>
  )
}

/** Sino com o pontinho rosa quando há novidades desde a última visita. */
function NotificationsBell() {
  const { data: profile } = useProfile()
  const { data } = useNotifications()
  const fresh = data?.some((n) => !profile?.notifications_seen_at || n.created_at > profile.notifications_seen_at) ?? false
  return (
    <Link to="/notificacoes" aria-label={fresh ? 'Novidades (há novas)' : 'Novidades'} className="relative flex size-11 items-center justify-center text-primary">
      <Icon name="bell" />
      {fresh && <span aria-hidden="true" className="absolute top-2.5 right-2.5 size-2 rounded-full border border-page bg-accent" />}
    </Link>
  )
}

/** "Citação do dia": uma das citações favoritas das fichas do feed, a mesma o dia inteiro. */
function QuoteOfTheDay({ posts }: { posts: FeedPost[] }) {
  const quotes = posts.filter((p) => p.reading?.favorite_quote && p.reading.book)
  const pick = pickOfTheDay(quotes, todayIso())
  if (!pick) return null
  const reading = pick.reading!
  return (
    <figure className="rise m-0 rounded-card bg-primary px-4.5 py-4 text-inverse">
      <Eyebrow className="text-blush">citação do dia</Eyebrow>
      <blockquote className="m-0 mt-2.5 font-serif italic text-2xl leading-snug">“{reading.favorite_quote}”</blockquote>
      <figcaption className="mt-2.5 font-sans text-2xs font-semibold tracking-wide text-blush lowercase">
        {[reading.book!.title, reading.book!.author].filter(Boolean).join(' · ')}
      </figcaption>
    </figure>
  )
}

/** "Lendo agora entre amigos": capas do que as outras pessoas estão lendo. */
function FriendsReading() {
  const { data } = useFriendsReadingNow()
  if (!data || data.length === 0) return null
  return (
    <section aria-labelledby="friends-reading" className="flex flex-col gap-3">
      <Eyebrow>
        <span id="friends-reading">lendo agora entre amigos</span>
      </Eyebrow>
      <ul className="no-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6">
        {data.map((r) => (
          <li key={r.id} className="shrink-0 text-center">
            <Link to={`/livros/${r.book.id}`} className="flex flex-col items-center gap-2 no-underline" aria-label={`${r.user.name} está lendo ${r.book.title}`}>
              <BookCover title={r.book.title} url={r.book.cover_url} size="friend" decorative />
              <span className="font-serif italic text-sm text-ink">{r.user.name.split(/\s+/)[0]?.toLowerCase()}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** "Você está lendo": a própria leitura em andamento, com a página atual. */
function MyReading() {
  const { data: shelf } = useShelf()
  const reading = shelf?.reading ?? []
  if (reading.length === 0) return null
  return (
    <section className="flex flex-col gap-2.5" aria-labelledby="reading-now">
      <Eyebrow>
        <span id="reading-now">você está lendo</span>
      </Eyebrow>
      <ul className="flex flex-col gap-2.5">
        {reading.map((r) => (
          <li key={r.id}>
            <ProgressCard reading={r} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Início: citação do dia, o que as amigas estão lendo e o feed de fichas. */
export function HomePage() {
  const location = useLocation()
  const flash = (location.state as { flash?: string } | null)?.flash
  const { data: profile } = useProfile()
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } = useFeed()
  const [filter, setFilter] = useState<Filter>('tudo')
  const posts = data?.pages.flat() ?? []
  const shown = filter === 'resenhas' ? posts.filter((p) => p.reading?.comment) : posts
  const firstName = profile?.name.split(/\s+/)[0]?.toLowerCase()

  return (
    <div className="relative flex flex-col gap-5">
      <span aria-hidden="true" className="twinkle twinkle-late top-14 right-28 text-2xs">✧</span>
      <header className="flex items-center justify-between">
        <h1 className="m-0 font-sans text-base font-semibold text-ink">{firstName ? `olá, ${firstName}` : 'olá!'}</h1>
        <nav aria-label="Atalhos" className="-mr-3 flex">
          <TopIcon to="/buscar" icon="search" label="Buscar livro" />
          <TopIcon to="/descobrir" icon="sparkle" label="Descobrir livros" />
          <NotificationsBell />
          <Link to="/publicar" aria-label="Publicar leitura" className="flex size-11 items-center justify-center text-primary">
            <Icon name="plus" />
          </Link>
        </nav>
      </header>

      {flash && <FormMessage tone="success">{flash}</FormMessage>}

      <QuoteOfTheDay posts={posts} />
      <MyReading />
      <FriendsReading />

      <section aria-labelledby="feed-title" className="flex flex-col gap-3">
        <h2 id="feed-title" className="sr-only">
          Fichas das amigas
        </h2>
        <div role="group" aria-label="Filtrar o feed" className="flex gap-1.5">
          {(['tudo', 'resenhas'] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={
                'h-chip-h rounded-full border px-3.5 font-sans text-xs font-semibold ' +
                (filter === f ? 'border-primary bg-primary text-inverse' : 'border-border bg-card text-ink')
              }
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading && <p className="m-0 font-serif italic text-md text-muted">abrindo as fichas…</p>}
        {isError && (
          <>
            <FormMessage tone="error">Não foi possível carregar o feed.</FormMessage>
            <Button variant="outline" onClick={() => refetch()}>
              tentar de novo
            </Button>
          </>
        )}
        {!isLoading && !isError && posts.length === 0 && (
          <EmptyState title="nada por aqui ainda" icon="book">
            Ninguém terminou um livro ainda. Que tal ser a primeira pessoa?
          </EmptyState>
        )}

        <ul className="flex flex-col gap-3" aria-label="Leituras concluídas">
          {shown.map((post) => (
            <li key={post.id}>
              <PostCard post={post} footer={<PostActions post={post} />} />
            </li>
          ))}
        </ul>

        {hasNextPage ? (
          <Button variant="outline" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
            carregar mais
          </Button>
        ) : (
          posts.length > 0 && <p className="m-0 text-center font-serif italic text-base text-muted">você está em dia ✦</p>
        )}
      </section>
    </div>
  )
}
