import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate, useParams } from 'react-router'
import { Avatar, avatarOf } from '@/components/ui/Avatar'
import { BookCover } from '@/components/ui/BookCover'
import { Button, ButtonLink, buttonClass } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { Icon } from '@/components/ui/Icon'
import { BookLoading } from '@/components/ui/Loading'
import { Stars } from '@/components/ui/Stars'
import { TextAreaField, TextField } from '@/components/ui/TextField'
import { Eyebrow, HandText, Label, Quote } from '@/components/ui/Typography'
import { AVATAR_ACCEPT, validateAvatarFile } from '@/features/profile/imageResize'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { useBackgroundEnrichment } from '@/lib/books/useBackgroundEnrichment'
import { formatDayMonth, formatDayMonthShort, todayIso } from '@/lib/dates'
import { clubBookAverage, formatEdition, groupClubBooks, plannedEditions } from '@/lib/domain/clubs'
import { mostLoved } from '@/lib/domain/ranking'
import { formatAverage, memberAverage } from '@/lib/domain/ratings'
import { withPet } from '@/lib/pets'
import {
  useAddClubEvent,
  useChangeClubCover,
  useClub,
  useClubEvents,
  useDeleteClubEvent,
  useFinishClubBook,
  useLeaveClub,
  useRegenerateInviteCode,
  useSetClubBookDue,
  useUpdateClubInfo,
  type ClubBook,
  type ClubDetail,
  type ClubMember,
} from './api'
import { clubBookPath } from './ClubReviewPage'
import { clubPath } from './ClubsPage'
import { ClubBookGrid, ClubBookTile, ProposalCard } from './components'
import { dueProgress } from './schedule'

const TABS = [
  { aba: '', label: 'início' },
  { aba: 'feed', label: 'feed' },
  { aba: 'biblioteca', label: 'biblioteca' },
  { aba: 'leitura', label: 'leitura' },
  { aba: 'agenda', label: 'agenda' },
]

const firstName = (name: string) => name.split(/\s+/)[0]?.toLowerCase() ?? name

/** /clubes/:clubId/:aba — perfil do clube com abas: início, feed, biblioteca, leitura e agenda. */
export function ClubPage() {
  const { clubId = '', aba = '' } = useParams()
  const location = useLocation()
  const flash = (location.state as { flash?: string } | null)?.flash
  const { data: club, isLoading, isError } = useClub(clubId)
  useBackgroundEnrichment(club?.books.map((cb) => cb.book))

  if (isLoading) return <BookLoading label="abrindo o clube…" />
  if (isError || !club) return <FormMessage tone="error">Clube não encontrado ou você não participa dele.</FormMessage>

  const finishedCount = club.books.filter((b) => b.status === 'finished').length

  return (
    <div className="flex flex-col gap-5">
      <header className="relative -mx-6 -mt-4.5 lg:mx-0 lg:mt-0">
        <div className="cover-fade relative h-club-cover overflow-hidden bg-blush lg:rounded-t-sheet">
          {club.cover_url && <img src={club.cover_url} alt="" className="size-full object-cover" />}
        </div>
        <span aria-hidden="true" className="twinkle twinkle-rose top-10 left-2 text-sm">✦</span>
        <span aria-hidden="true" className="twinkle twinkle-late top-16 right-3 text-sm">✦</span>
        <div className="absolute inset-x-6 top-3 flex items-center justify-between">
          <Link to="/clubes" className="rounded-full bg-page px-3 py-1.5 font-sans text-base font-semibold text-primary no-underline">
            ‹ clubes
          </Link>
          <span className="rounded-full bg-page px-3 py-1.5 font-sans text-2xs font-semibold uppercase tracking-label text-muted">
            edição {finishedCount + 1}
          </span>
        </div>
        <div className="relative -mt-8 flex flex-col items-center gap-1.5 px-6 text-center">
          <h1 className="rise m-0 font-display italic font-bold text-4xl leading-none text-primary">{club.name}</h1>
          <Eyebrow className="text-muted">clube de leitura</Eyebrow>
          {club.description && <HandText className="max-w-xs">{club.description}</HandText>}
          <Link to={`${clubPath(club.id)}/ajustes`} aria-label="Informações do clube" className="absolute right-6 top-6 flex size-11 items-center justify-center text-accent">
            <Icon name="more" />
          </Link>
        </div>
      </header>

      {flash && <FormMessage tone="success">{flash}</FormMessage>}

      <nav aria-label="Seções do clube" className="no-scrollbar -mx-6 flex justify-center gap-1.5 overflow-x-auto px-6">
        {TABS.map((t) => (
          <NavLink
            key={t.aba}
            to={t.aba ? `${clubPath(club.id)}/${t.aba}` : clubPath(club.id)}
            end
            className={({ isActive }) =>
              'flex h-chip-h shrink-0 items-center rounded-full border px-3.5 font-sans text-xs font-semibold no-underline ' +
              (isActive ? 'border-primary bg-primary text-inverse' : 'border-line bg-card text-muted')
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      {aba === 'feed' ? (
        <FeedTab club={club} />
      ) : aba === 'biblioteca' ? (
        <LibraryTab club={club} />
      ) : aba === 'leitura' ? (
        <ReadingTab club={club} />
      ) : aba === 'agenda' ? (
        <AgendaTab club={club} />
      ) : aba === 'convidar' ? (
        <InviteTab club={club} />
      ) : aba === 'ajustes' ? (
        <SettingsTab club={club} />
      ) : (
        <HomeTab club={club} />
      )}
    </div>
  )
}

function Section({ title, action, children, id }: { title: string; action?: { to: string; label: string }; children: ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id={id} className="m-0 font-display italic font-semibold text-2xl text-primary">
            {title}
          </h2>
          {action && (
            <Link to={action.to} className="shrink-0 font-sans text-2xs font-semibold uppercase tracking-label text-accent no-underline">
              {action.label}
            </Link>
          )}
        </div>
        <span aria-hidden="true" className="h-px bg-line" />
      </div>
      {children}
    </section>
  )
}

/** Quem escolheu o livro, com o bichinho: "escolha de 🐭 irla". */
function chooserOf(clubBook: ClubBook, members: ClubMember[]) {
  const p = members.find((m) => m.user_id === clubBook.proposed_by)?.profile
  return p ? `${p.pet ? `${p.pet} ` : ''}${firstName(p.name)}` : null
}

/** "Lendo agora": capa, título, quem escolheu, prazo e atalhos para as fichas. */
function CurrentBookCard({ club, clubBook, edition }: { club: ClubDetail; clubBook: ClubBook; edition?: number }) {
  const chooser = chooserOf(clubBook, club.members)
  const due = dueProgress(clubBook.started_on, clubBook.due_on, todayIso())
  return (
    <article className="flex gap-4.5">
      <Link to={clubBookPath(club.id, clubBook.id)} aria-label={clubBook.book.title} className="shrink-0">
        <BookCover title={clubBook.book.title} url={clubBook.book.cover_url} size="grid" decorative />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {edition != null && <Label className="text-primary">leitura {formatEdition(edition)}</Label>}
        <h3 className="m-0 font-display italic font-semibold text-2xl leading-tight">{clubBook.book.title}</h3>
        {clubBook.book.author && <p className="m-0 font-sans text-2xs font-semibold uppercase tracking-eyebrow text-muted">{clubBook.book.author}</p>}
        {chooser && <HandText className="text-md">escolha de {chooser}</HandText>}
        {due && (
          <span className="inline-flex h-tag-h self-start items-center rounded-full bg-tag px-2.5 font-sans text-2xs font-semibold uppercase tracking-wide text-primary">
            {due.left > 0 ? `faltam ${due.left} ${due.left === 1 ? 'dia' : 'dias'}` : due.left === 0 ? 'termina hoje' : 'prazo encerrado'}
          </span>
        )}
        <ButtonLink to={clubBookPath(club.id, clubBook.id)} size="sm" variant="outline" fullWidth={false} className="mt-1 self-start">
          reviews do clube
        </ButtonLink>
      </div>
    </article>
  )
}

function HomeTab({ club }: { club: ClubDetail }) {
  const memberIds = club.members.map((m) => m.user_id)
  const groups = groupClubBooks(club.books)
  const planned = plannedEditions(club.books)
  const loved = mostLoved(groups.finished, club.readings, memberIds, 4)

  return (
    <>
      <Section id="club-reading" title="lendo agora" action={groups.reading[0] ? { to: `${clubPath(club.id)}/leitura`, label: 'ver prazo →' } : undefined}>
        {groups.reading.length === 0 ? (
          <EmptyState title="nenhum livro em leitura" icon="book" action={<Link to={`${clubPath(club.id)}/propor`} className="font-sans text-base font-semibold text-primary">sugerir o próximo →</Link>}>
            Quando uma sugestão for aprovada por todo mundo, ela aparece aqui.
          </EmptyState>
        ) : (
          <ul aria-label="Livros em leitura no clube" className="flex flex-col gap-4">
            {groups.reading.map((cb) => (
              <li key={cb.id}>
                <CurrentBookCard club={club} clubBook={cb} edition={cb.edition_number ?? planned.get(cb.id)} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="club-members" title="quem tá lendo" action={{ to: `${clubPath(club.id)}/convidar`, label: `${club.members.length} pessoas +` }}>
        <ul aria-label="Membros" className="flex flex-wrap gap-3">
          {club.members.map((m) => (
            <li key={m.user_id}>
              <Link
                to={`${clubPath(club.id)}/membros/${m.user_id}`}
                aria-label={`${m.profile.name}${m.role === 'owner' ? ' (criou o clube)' : ''}`}
                className="flex w-14 flex-col items-center gap-2 no-underline"
              >
                <Avatar {...avatarOf(m.profile)} size="sm" border="thick" />
                <span className="font-serif italic text-sm text-muted">{withPet(firstName(m.profile.name), m.profile.pet)}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link to={`${clubPath(club.id)}/convidar`} className="flex w-14 flex-col items-center gap-2 no-underline">
              <span aria-hidden="true" className="flex size-avatar-sm items-center justify-center rounded-full border border-dashed border-border text-xl text-muted">
                +
              </span>
              <span className="font-serif italic text-sm text-muted">convidar</span>
            </Link>
          </li>
        </ul>
      </Section>

      {loved.length > 0 && (
        <Section id="club-loved" title="o que a gente amou" action={{ to: `${clubPath(club.id)}/biblioteca`, label: 'ver todos →' }}>
          <ul aria-label="Os mais amados" className="grid grid-cols-4 gap-2.5">
            {loved.map((cb) => (
              <li key={cb.id} className="flex flex-col items-center gap-1.5">
                <Link to={clubBookPath(club.id, cb.id)} aria-label={`${cb.book.title}, média ${formatAverage(cb.average)}`} className="w-full">
                  <BookCover title={cb.book.title} url={cb.book.cover_url} size="fill" decorative />
                </Link>
                <Stars value={cb.average} size="xs" className="gap-px" />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {groups.queued.length > 0 && (
        <Section id="club-next" title="próximas">
          <ol aria-label="Próximas" className="flex flex-col gap-2">
            {groups.queued.map((cb) => (
              <li key={cb.id} className="flex items-center gap-3 rounded-card border border-dashed border-border bg-card p-2.5 pr-3">
                <span className="w-12 shrink-0 text-center font-sans text-2xs font-semibold uppercase tracking-label text-primary">{formatEdition(planned.get(cb.id))}</span>
                <BookCover title={cb.book.title} url={cb.book.cover_url} size="xs" decorative />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-display italic font-semibold text-lg">{cb.book.title}</span>
                  {chooserOf(cb, club.members) && <span className="font-serif italic text-sm text-muted">escolha de {chooserOf(cb, club.members)}</span>}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {groups.pending.length > 0 && (
        <Section id="club-pending" title="votação aberta" action={{ to: `${clubPath(club.id)}/biblioteca`, label: 'sugestões →' }}>
          <ul aria-label="Aguardando aprovação" className="flex flex-col gap-3">
            {groups.pending.map((cb) => (
              <li key={cb.id}>
                <ProposalCard clubBook={cb} members={club.members} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <nav aria-label="Mais do clube" className="grid grid-cols-2 gap-2.5">
        <ButtonLink to={`${clubPath(club.id)}/propor`}>
          <Icon name="plus" className="size-icon-sm" />
          sugerir livro
        </ButtonLink>
        <ButtonLink to={`${clubPath(club.id)}/ranking`} variant="outline">
          <Icon name="trophy" className="size-icon-sm" />
          ranking
        </ButtonLink>
        <ButtonLink to={`${clubPath(club.id)}/sugestoes`} variant="secondary">
          <Icon name="sparkle" className="size-icon-sm" />
          ideias do clube
        </ButtonLink>
        <ButtonLink to={`${clubPath(club.id)}/revista`} variant="secondary">
          <Icon name="magazine" className="size-icon-sm" />
          revista
        </ButtonLink>
      </nav>
    </>
  )
}

/** Feed do clube: as fichas dos membros para os livros do clube, das mais recentes. */
function FeedTab({ club }: { club: ClubDetail }) {
  const bookById = new Map(club.books.map((b) => [b.book.id, b]))
  const memberById = new Map(club.members.map((m) => [m.user_id, m]))
  const items = club.readings
    .filter((r) => r.finished_on && memberById.has(r.user_id) && bookById.has(r.book_id))
    .sort((a, b) => b.finished_on!.localeCompare(a.finished_on!))
  if (items.length === 0) return <EmptyState title="nenhuma ficha ainda" icon="message">Quando alguém terminar um livro do clube, a ficha aparece aqui.</EmptyState>
  return (
    <ul aria-label="Fichas do clube" className="flex flex-col gap-3">
      {items.map((r) => {
        const m = memberById.get(r.user_id)!
        const cb = bookById.get(r.book_id)!
        const avg = memberAverage(r)
        return (
          <li key={`${r.user_id}-${r.book_id}`} className="rounded-card border border-line bg-card p-4">
            <div className="flex items-center gap-2.5">
              <Avatar {...avatarOf(m.profile)} size="xs" />
              <p className="m-0 font-sans text-sm font-semibold">
                {firstName(m.profile.name)} <span className="font-normal text-muted">terminou</span>
              </p>
              <span className="ml-auto font-sans text-2xs font-semibold uppercase tracking-wide text-muted">{formatDayMonthShort(r.finished_on)}</span>
            </div>
            <Link to={clubBookPath(club.id, cb.id)} className="mt-2.5 block font-display italic font-semibold text-xl text-ink no-underline">
              {cb.book.title}
            </Link>
            <Stars value={avg} size="sm" className="mt-1" />
            {(r.favorite_quote || r.comment) && <Quote className="mt-2">{r.favorite_quote ?? r.comment}</Quote>}
          </li>
        )
      })}
    </ul>
  )
}

/** Biblioteca: lidos (com a média do clube), na fila e as sugestões em votação. */
function LibraryTab({ club }: { club: ClubDetail }) {
  const memberIds = club.members.map((m) => m.user_id)
  const groups = groupClubBooks(club.books)
  return (
    <>
      <Section id="club-finished" title={`lidos · ${groups.finished.length}`}>
        {groups.finished.length === 0 ? (
          <EmptyState title="nenhuma edição concluída" icon="book">As edições concluídas vão aparecer aqui.</EmptyState>
        ) : (
          <ClubBookGrid label="Livros concluídos no clube">
            {groups.finished.map((cb) => (
              <ClubBookTile
                key={cb.id}
                clubBook={cb}
                to={clubBookPath(club.id, cb.id)}
                average={clubBookAverage(cb.book.id, club.readings, memberIds)}
                footer={<Label className="text-primary">{formatEdition(cb.edition_number)}</Label>}
              />
            ))}
          </ClubBookGrid>
        )}
      </Section>
      <Section id="club-suggestions" title={`sugestões · ${groups.pending.length}`} action={{ to: `${clubPath(club.id)}/propor`, label: '+ sugerir' }}>
        {groups.pending.length === 0 ? (
          <HandText>ninguém sugeriu nada ainda. que tal ser a primeira? ✦</HandText>
        ) : (
          <ul aria-label="Aguardando aprovação" className="flex flex-col gap-3">
            {groups.pending.map((cb) => (
              <li key={cb.id}>
                <ProposalCard clubBook={cb} members={club.members} />
              </li>
            ))}
          </ul>
        )}
        <section className="rounded-card bg-petal p-4">
          <Eyebrow>como funciona</Eyebrow>
          <p className="m-0 mt-1.5 font-sans text-base leading-relaxed text-ink">
            quem sugere já vota a favor. quando todas aprovam, o livro vira a leitura da vez (ou entra na fila, se já tiver uma rolando). um voto contra tira a sugestão da lista.
          </p>
        </section>
      </Section>
    </>
  )
}

/** Leitura da vez: prazo (dia X de Y), marcos e concluir. */
function ReadingTab({ club }: { club: ClubDetail }) {
  const { reading } = groupClubBooks(club.books)
  const current = reading[0]
  if (!current) {
    return (
      <EmptyState title="sem leitura da vez" icon="book" action={<Link to={`${clubPath(club.id)}/biblioteca`} className="font-sans text-base font-semibold text-primary">ver sugestões →</Link>}>
        Aprovem uma sugestão para começar a próxima rodada.
      </EmptyState>
    )
  }
  return <CurrentReading club={club} clubBook={current} />
}

function CurrentReading({ club, clubBook }: { club: ClubDetail; clubBook: ClubBook }) {
  const setDue = useSetClubBookDue(club.id)
  const [editing, setEditing] = useState(false)
  const [dueOn, setDueOn] = useState(clubBook.due_on ?? '')
  const [error, setError] = useState('')
  const due = dueProgress(clubBook.started_on, clubBook.due_on, todayIso())
  const chooser = chooserOf(clubBook, club.members)

  async function onSaveDue(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await setDue.mutateAsync({ clubBookId: clubBook.id, dueOn: dueOn || null })
      setEditing(false)
    } catch {
      setError('O prazo precisa ser depois do início da leitura.')
    }
  }

  return (
    <>
      <article className="flex flex-col items-center gap-3 text-center">
        <Eyebrow>lendo agora</Eyebrow>
        <BookCover title={clubBook.book.title} url={clubBook.book.cover_url} size="grid" decorative />
        <h2 className="m-0 font-display italic font-semibold text-3xl leading-tight text-primary">{clubBook.book.title}</h2>
        <p className="m-0 font-sans text-sm text-muted">
          {[clubBook.book.author, clubBook.book.pages && `${clubBook.book.pages} páginas`].filter(Boolean).join(' · ')}
        </p>
        {chooser && <HandText>sugerido por {chooser}</HandText>}
      </article>

      <section aria-labelledby="due-title" className="flex flex-col gap-3 rounded-card border border-line bg-card p-4">
        <div className="flex items-baseline justify-between">
          <h2 id="due-title" className="m-0 font-display italic font-semibold text-xl text-primary">
            prazo da leitura
          </h2>
          {due && (
            <span className="font-sans text-2xs font-semibold uppercase tracking-label text-muted">
              dia {due.day} de {due.total}
            </span>
          )}
        </div>
        {due ? (
          <>
            <div role="progressbar" aria-label="Andamento do prazo" aria-valuemin={0} aria-valuemax={due.total} aria-valuenow={Math.min(due.day, due.total)} className="h-progress overflow-hidden rounded-full bg-track">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (due.day / due.total) * 100)}%` }} />
            </div>
            <HandText className="text-sm">
              começou dia {formatDayMonth(clubBook.started_on)} · termina dia {formatDayMonth(clubBook.due_on)} ✦
            </HandText>
          </>
        ) : (
          <HandText className="text-sm">ainda sem prazo. combinem uma data para todo mundo terminar.</HandText>
        )}
        {editing ? (
          <form onSubmit={onSaveDue} className="flex items-end gap-2">
            <div className="flex-1">
              <TextField label="Termina em" type="date" min={clubBook.started_on ?? undefined} value={dueOn} onChange={(e) => setDueOn(e.target.value)} />
            </div>
            <Button type="submit" size="sm" fullWidth={false} loading={setDue.isPending} className="min-h-control-h">
              salvar
            </Button>
          </form>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="min-h-11 self-start font-sans text-sm font-semibold text-primary">
            {due ? 'mudar o prazo' : 'definir o prazo'}
          </button>
        )}
        {error && <FormMessage tone="error">{error}</FormMessage>}
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        <ButtonLink to={`/publicar?livro=${clubBook.book.id}`}>escrever ficha ✎</ButtonLink>
        <FinishButton clubBookId={clubBook.id} startedOn={clubBook.started_on} />
      </div>
    </>
  )
}

function FinishButton({ clubBookId, startedOn }: { clubBookId: string; startedOn: string | null }) {
  const finish = useFinishClubBook()
  const [confirm, setConfirm] = useState(false)
  return confirm ? (
    <div className="flex flex-col gap-1">
      <Button size="sm" onClick={() => finish.mutate(clubBookId)} loading={finish.isPending}>
        confirmar
      </Button>
      <button type="button" className="min-h-11 font-sans text-sm font-semibold text-muted" onClick={() => setConfirm(false)}>
        cancelar
      </button>
    </div>
  ) : (
    <Button variant="outline" onClick={() => setConfirm(true)} title={startedOn ? `lendo desde ${formatDayMonth(startedOn)}` : undefined}>
      concluir leitura
    </Button>
  )
}

/** Agenda: encontros e combinados do clube, mais o fim da leitura da vez. */
function AgendaTab({ club }: { club: ClubDetail }) {
  const me = useCurrentUser()
  const { data: events } = useClubEvents(club.id)
  const add = useAddClubEvent(club.id)
  const remove = useDeleteClubEvent(club.id)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const today = todayIso()
  const isOwner = club.members.some((m) => m.user_id === me.id && m.role === 'owner')
  const current = groupClubBooks(club.books).reading[0]

  const items = [
    ...(events ?? []).map((e) => ({ key: e.id, date: e.happens_on, title: e.title, notes: e.notes, kind: 'evento', event: e })),
    ...(current?.due_on ? [{ key: 'due', date: current.due_on, title: 'fim da leitura', notes: current.book.title, kind: 'prazo', event: null }] : []),
  ].sort((a, b) => a.date.localeCompare(b.date))
  const upcoming = items.filter((i) => i.date >= today)
  const past = items.filter((i) => i.date < today).reverse()

  async function onAdd(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date) return setError('Dê um nome e uma data para o encontro.')
    setError('')
    try {
      await add.mutateAsync({ title: title.trim(), happens_on: date, notes: notes.trim() || null })
      setTitle('')
      setDate('')
      setNotes('')
    } catch {
      setError('Não foi possível agendar. Tente de novo.')
    }
  }

  const list = (rows: typeof items, label: string) => (
    <ul aria-label={label} className="flex flex-col">
      {rows.map((i) => {
        const [y, m, d] = i.date.split('-')
        return (
          <li key={i.key} className="flex items-start gap-3.5 border-t border-line py-4 first:border-t-0">
            <span className="flex w-13 shrink-0 flex-col items-center">
              <span className="font-sans text-2xs font-semibold uppercase tracking-eyebrow text-muted">{formatDayMonthShort(i.date).split(' ')[1]}</span>
              <span className="font-display italic font-bold text-3xl leading-none text-primary">{Number(d)}</span>
              <span className="sr-only">
                {d}/{m}/{y}
              </span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Label className={i.kind === 'prazo' ? 'text-primary' : ''}>{i.kind === 'prazo' ? 'prazo' : 'encontro'}</Label>
              <span className="font-display italic font-semibold text-xl">{i.title}</span>
              {i.notes && <span className="font-serif italic text-sm text-muted">{i.notes}</span>}
            </span>
            {i.event && (i.event.created_by === me.id || isOwner) && (
              <button type="button" aria-label={`Apagar ${i.title}`} onClick={() => remove.mutate(i.event!.id)} className="flex size-11 shrink-0 items-center justify-center text-muted">
                <Icon name="close" className="size-icon-sm" />
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      <Section id="agenda-next" title="próximos">
        {upcoming.length === 0 ? <HandText>nada marcado ainda ✦</HandText> : list(upcoming, 'Próximos')}
      </Section>
      <form onSubmit={onAdd} className="flex flex-col gap-3 rounded-card border border-line bg-card p-4" noValidate>
        <h2 className="m-0 font-display italic font-semibold text-xl text-primary">marcar um encontro</h2>
        <TextField label="O quê" maxLength={80} placeholder="conversa do clube" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField label="Quando" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <TextAreaField label="Detalhes" maxLength={200} rows={2} placeholder="a irla traz o bolo ✦" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <Button type="submit" size="sm" loading={add.isPending}>
          agendar
        </Button>
      </form>
      {past.length > 0 && <Section id="agenda-past" title="passados">{list(past, 'Passados')}</Section>}
    </>
  )
}

/** Convidar: link de convite, código e quem já está no clube. */
function InviteTab({ club }: { club: ClubDetail }) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/convite/${club.invite_code}`
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <>
      <div>
        <h2 className="m-0 font-display italic font-semibold text-3xl text-primary">chama mais gente</h2>
        <HandText>quem entra pelo link cai direto no clube ✦</HandText>
      </div>
      <section aria-label="Link de convite" className="flex flex-col gap-3 rounded-card border border-line bg-card p-4">
        <Eyebrow>link de convite</Eyebrow>
        <p className="m-0 break-all font-sans text-md font-medium">{link}</p>
        <p className="m-0 font-sans text-sm text-muted">
          código <strong className="font-semibold tracking-wide text-ink">{club.invite_code}</strong>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" onClick={copy} aria-live="polite">
            {copied ? 'link copiado ✓' : 'copiar link'}
          </Button>
          {canShare && (
            <Button size="sm" variant="outline" onClick={() => navigator.share({ title: club.name, text: `Vem ler com a gente no ${club.name}: ${link}` }).catch(() => undefined)}>
              enviar
            </Button>
          )}
        </div>
      </section>
      <Section id="invite-members" title={`membros · ${club.members.length}`}>
        <ul aria-label="Membros e papéis" className="flex flex-col">
          {club.members.map((m) => (
            <li key={m.user_id} className="flex items-center gap-3 border-b border-line py-3">
              <Avatar {...avatarOf(m.profile)} size="xs" />
              <Link to={`${clubPath(club.id)}/membros/${m.user_id}`} className="flex-1 font-sans text-md font-semibold text-ink no-underline">
                {firstName(m.profile.name)}
              </Link>
              <span className="inline-flex h-tag-h items-center rounded-full bg-tag px-2.5 font-sans text-2xs font-semibold uppercase tracking-wide text-primary">
                {m.role === 'owner' ? 'dona' : 'membro'}
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}

/** Ajustes: nome, descrição, capa e código (dona); sair ou excluir. */
function SettingsTab({ club }: { club: ClubDetail }) {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const isOwner = club.members.some((m) => m.user_id === user.id && m.role === 'owner')
  const regenerate = useRegenerateInviteCode(club.id)
  const changeCover = useChangeClubCover(club.id)
  const updateInfo = useUpdateClubInfo(club.id)
  const leave = useLeaveClub(club.id)
  const [name, setName] = useState(club.name)
  const [description, setDescription] = useState(club.description ?? '')
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  async function onCover(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const invalid = validateAvatarFile(file)
    if (invalid) return setMessage({ tone: 'error', text: invalid })
    await changeCover.mutateAsync(file).catch(() => setMessage({ tone: 'error', text: 'Não foi possível trocar a capa.' }))
  }

  async function onSaveInfo(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setMessage({ tone: 'error', text: 'O clube precisa de um nome.' })
    try {
      await updateInfo.mutateAsync({ name: name.trim(), description: description.trim() || null })
      setMessage({ tone: 'success', text: 'Clube atualizado ♡' })
    } catch {
      setMessage({ tone: 'error', text: 'Não foi possível salvar. Tente de novo.' })
    }
  }

  async function onLeave() {
    try {
      await leave.mutateAsync({ asOwner: isOwner })
      navigate('/clubes', { replace: true, state: { flash: isOwner ? 'Clube excluído.' : 'Você saiu do clube.' } })
    } catch {
      setMessage({ tone: 'error', text: 'Não foi possível concluir agora. Tente de novo.' })
    }
  }

  return (
    <>
      <h2 className="m-0 font-display italic font-semibold text-3xl text-primary">informações do clube</h2>
      {isOwner && (
        <form onSubmit={onSaveInfo} className="flex flex-col gap-4" noValidate>
          <TextField label="Nome" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          <TextAreaField label="Descrição" maxLength={300} rows={2} placeholder="a gente lê com calma e se conta tudo depois ♡" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button type="submit" size="sm" loading={updateInfo.isPending}>
            salvar alterações
          </Button>
          <label className={buttonClass('outline', true, 'cursor-pointer focus-within:outline focus-within:outline-primary', 'sm')}>
            {changeCover.isPending ? 'enviando capa…' : 'trocar foto de capa'}
            <input type="file" accept={AVATAR_ACCEPT} className="sr-only" onChange={onCover} />
          </label>
          <Button variant="outline" size="sm" loading={regenerate.isPending} onClick={() => regenerate.mutate()}>
            Gerar novo código
          </Button>
          <HandText className="text-sm">o código antigo deixa de funcionar; quem já entrou continua no clube.</HandText>
        </form>
      )}
      <Link to={`${clubPath(club.id)}/convidar`} className="flex min-h-13 items-center justify-between border-y border-line text-ink no-underline">
        <span className="font-sans text-md font-semibold">membros e convite</span>
        <span aria-hidden="true" className="text-muted">›</span>
      </Link>
      {confirmLeave ? (
        <div className="flex flex-col gap-2">
          <p className="m-0 font-sans text-base text-muted">
            {isOwner ? 'Excluir o clube apaga as prateleiras, sugestões e votos de todo mundo. As leituras pessoais continuam.' : 'Você sai do clube; suas leituras continuam no seu perfil.'}
          </p>
          <Button variant="danger" loading={leave.isPending} onClick={onLeave}>
            {isOwner ? 'Sim, excluir o clube' : 'Sim, sair do clube'}
          </Button>
          <Button variant="outline" onClick={() => setConfirmLeave(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button variant="quiet" onClick={() => setConfirmLeave(true)} className="text-danger hover:text-danger">
          {isOwner ? 'Excluir clube' : 'Sair do clube'}
        </Button>
      )}
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
    </>
  )
}
