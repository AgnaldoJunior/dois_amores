import { NavLink, useParams } from 'react-router'
import { BackLink } from '@/components/ui/BackLink'
import { BookCover } from '@/components/ui/BookCover'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { StatTiles } from '@/components/ui/StatTiles'
import { Eyebrow, HandText, PageTitle } from '@/components/ui/Typography'
import { useProfile } from '@/features/profile/api'
import { useShelf } from '@/features/shelf/api'
import { formatAverage } from '@/lib/domain/ratings'
import { formatCount } from '@/lib/domain/stats'
import { goalPace, MONTH_INITIALS, MONTH_NAMES, yearStats } from '@/lib/domain/year'

type Stats = ReturnType<typeof yearStats>

const TABS = [
  { to: '/numeros', label: 'o ano', end: true },
  { to: '/numeros/autores', label: 'autores' },
  { to: '/numeros/retrospectiva', label: 'retrospectiva' },
]

const books = (n: number) => `${formatCount(n)} ${n === 1 ? 'livro' : 'livros'}`

/** /numeros, /numeros/autores, /numeros/retrospectiva — "seus números" do ano. */
export function NumbersPage() {
  const { aba } = useParams()
  const year = new Date().getFullYear()
  const { data: shelf, isLoading } = useShelf()
  const { data: profile } = useProfile()
  const stats = yearStats(shelf?.read ?? [], year)
  const goal = profile?.reading_goal ?? null

  if (aba === 'retrospectiva') return <Retrospective stats={stats} year={year} />

  return (
    <div className="relative flex flex-col gap-5">
      <span aria-hidden="true" className="twinkle top-24 right-3 text-sm">✧</span>
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between">
          <span className="font-sans text-base font-semibold text-ink">seus números</span>
          <Eyebrow>{year}</Eyebrow>
        </div>
        <PageTitle className="mt-3">{aba === 'autores' ? 'o que você leu' : 'este ano'}</PageTitle>
        <HandText>
          {goal ? `${stats.books} de ${books(goal)}` : `${books(stats.books)} terminados`}
          {goal && goalPace(stats.books, goal, new Date()).onTrack ? ' · você está no ritmo ✦' : ' ✦'}
        </HandText>
      </header>

      <nav aria-label="Seções dos números" className="flex gap-1 rounded-full bg-tag p-1">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              'flex h-9 flex-1 items-center justify-center rounded-full font-sans text-sm font-semibold no-underline ' +
              (isActive ? 'bg-primary text-inverse' : 'text-muted')
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      {isLoading ? (
        <p className="m-0 font-serif italic text-md text-muted">somando as páginas…</p>
      ) : aba === 'autores' ? (
        <Authors stats={stats} />
      ) : (
        <TheYear stats={stats} goal={goal} />
      )}
    </div>
  )
}

function TheYear({ stats, goal }: { stats: Stats; goal: number | null }) {
  const max = Math.max(1, ...stats.byMonth)
  const pace = goal ? goalPace(stats.books, goal, new Date()) : null
  return (
    <>
      {goal && pace && (
        <section aria-label="Meta de leitura" className="flex flex-col gap-2.5 rounded-card border border-line bg-card p-4">
          <Eyebrow>meta de leitura</Eyebrow>
          <div className="flex items-baseline justify-between">
            <p className="m-0 font-display italic font-semibold text-2xl text-ink">
              {pace.left === 0 ? 'meta batida! ♡' : `faltam ${books(pace.left)}`}
            </p>
            <span className="font-sans text-xs font-semibold text-muted">
              {stats.books}/{goal}
            </span>
          </div>
          <div className="h-progress overflow-hidden rounded-full bg-track" role="progressbar" aria-label="Progresso da meta" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(stats.books, goal)}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (stats.books / goal) * 100)}%` }} />
          </div>
          {pace.left > 0 && <HandText className="text-sm">para fechar o ano: cerca de {pace.perWeek} por semana ✧</HandText>}
        </section>
      )}

      <StatTiles
        label="Resumo do ano"
        items={[
          { value: formatCount(stats.pages), label: 'páginas' },
          { value: stats.average == null ? '–' : `${formatAverage(stats.average)}★`, label: 'média' },
          { value: stats.pagesPerBook == null ? '–' : formatCount(stats.pagesPerBook), label: 'págs/livro' },
        ]}
      />

      <section aria-labelledby="per-month" className="flex flex-col gap-3">
        <h2 id="per-month" className="m-0 font-display italic font-semibold text-title-md text-primary">
          livros por mês
        </h2>
        <ol className="flex h-32 items-end gap-1.5" aria-label="Livros terminados por mês">
          {stats.byMonth.map((n, i) => (
            <li key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="sr-only">
                {MONTH_NAMES[i]}: {books(n)}
              </span>
              <span
                aria-hidden="true"
                className={`w-full rounded-t-sm ${i === stats.bestMonth ? 'bg-primary' : 'bg-blush'}`}
                style={{ height: `${(n / max) * 100}%`, minHeight: n ? undefined : 'var(--da-space-0_5)' }}
              />
              <span aria-hidden="true" className="font-sans text-2xs font-semibold text-muted">
                {MONTH_INITIALS[i]}
              </span>
            </li>
          ))}
        </ol>
        {stats.bestMonth != null && (
          <HandText className="text-sm">
            {MONTH_NAMES[stats.bestMonth]} foi seu mês mais forte, com {books(stats.bestMonthCount)} ✦
          </HandText>
        )}
      </section>

      <NavLinkCard />
    </>
  )
}

function NavLinkCard() {
  return (
    <NavLink to="/numeros/retrospectiva" className="flex items-center justify-between rounded-card bg-primary px-4.5 py-4 text-inverse no-underline hover:text-inverse">
      <span className="font-display italic font-semibold text-xl">ver sua retrospectiva de {new Date().getFullYear()}</span>
      <Icon name="next" />
    </NavLink>
  )
}

function Authors({ stats }: { stats: Stats }) {
  if (stats.topAuthors.length === 0) return <EmptyState title="nenhum livro ainda">Os livros que você terminar este ano aparecem aqui.</EmptyState>
  return (
    <section aria-labelledby="top-authors" className="flex flex-col gap-2">
      <h2 id="top-authors" className="m-0 font-display italic font-semibold text-title-md text-primary">
        quem você mais leu
      </h2>
      <ol className="flex flex-col">
        {stats.topAuthors.map((a, i) => (
          <li key={a.author} className="flex items-center gap-3.5 border-t border-line py-3 first:border-t-0">
            <span className="w-6 font-display italic font-bold text-3xl text-primary">{i + 1}</span>
            <span className="flex flex-col">
              <span className="font-display italic font-semibold text-xl text-ink">{a.author}</span>
              <span className="font-sans text-2xs font-semibold uppercase tracking-label text-muted">
                {books(a.books)}
                {a.average != null && ` · média ${formatAverage(a.average)}★`}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Retrospectiva em fundo vinho: total, livro do ano e o mês mais forte. */
function Retrospective({ stats, year }: { stats: Stats; year: number }) {
  return (
    <div className="relative -mx-6 -mt-4.5 flex min-h-dvh flex-col gap-6 overflow-hidden bg-primaryHover px-6 pt-4.5 pb-10 text-inverse lg:mx-0 lg:mt-0 lg:min-h-0 lg:rounded-sheet">
      <span aria-hidden="true" className="twinkle top-20 right-10 text-xl">✦</span>
      <span aria-hidden="true" className="twinkle twinkle-late top-56 left-8 text-sm">✧</span>
      <div className="flex items-center justify-between [&_a]:text-blush">
        <BackLink to="/numeros">números</BackLink>
        <Eyebrow className="text-blush">{year}</Eyebrow>
      </div>
      <header className="rise text-center">
        <Eyebrow className="text-blush">sua retrospectiva</Eyebrow>
        <h1 className="m-0 mt-2 font-display italic font-bold text-5xl leading-tight">o seu ano em livros</h1>
      </header>
      <section className="rise delay-1 text-center">
        <Eyebrow className="text-blush">você leu</Eyebrow>
        <p className="m-0 font-display italic font-bold text-6xl leading-none">{stats.books}</p>
        <p className="m-0 mt-2 font-sans text-sm text-blush">
          {stats.books === 1 ? 'livro' : 'livros'} · {formatCount(stats.pages)} páginas
          {stats.pagesPerBook != null && ` · ${formatCount(stats.pagesPerBook)} por livro`}
        </p>
      </section>
      {stats.bookOfYear && (
        <section className="rise delay-2 flex flex-col items-center gap-3 text-center">
          <Eyebrow className="text-blush">o livro do ano</Eyebrow>
          <BookCover title={stats.bookOfYear.book.title} url={stats.bookOfYear.book.cover_url} size="grid" />
          <p className="m-0 font-display italic font-semibold text-3xl leading-tight">{stats.bookOfYear.book.title}</p>
          <p className="m-0 font-serif italic text-md text-blush">média {formatAverage(stats.bookOfYear.average)}★ ♡</p>
        </section>
      )}
      {stats.bestMonth != null && (
        <section className="rise delay-3 rounded-card border border-primarySoft p-4 text-center">
          <Eyebrow className="text-blush">e ainda</Eyebrow>
          <p className="m-0 mt-2 font-serif italic text-xl">
            {MONTH_NAMES[stats.bestMonth]} foi seu mês mais forte, com {books(stats.bestMonthCount)}.
          </p>
        </section>
      )}
      {stats.books === 0 && <p className="m-0 text-center font-serif italic text-xl text-blush">seu ano em livros começa no primeiro que você terminar ✦</p>}
    </div>
  )
}
