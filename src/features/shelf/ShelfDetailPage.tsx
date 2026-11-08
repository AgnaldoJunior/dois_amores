import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { BackLink } from '@/components/ui/BackLink'
import { BookCover } from '@/components/ui/BookCover'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Stars } from '@/components/ui/Stars'
import { HandText, PageTitle } from '@/components/ui/Typography'
import { usePerson, usePersonReadings } from '@/features/people/api'
import { personPath } from '@/features/people/ProfileView'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { formatDayMonthShort } from '@/lib/dates'
import { MONTH_NAMES } from '@/lib/domain/year'
import { useShelf } from './api'
import { filterShelf, fromReadings, groupByMonth, type ShelfFilter, type ShelfItem } from './shelves'
import { AddBookToShelf } from './AddBookToShelf'
import { useCustomShelves, useDeleteShelf, useToggleShelfBook } from './shelvesApi'

const VIEW_KEY = 'da-shelf-view'
type View = 'lista' | 'grade'

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'grade' ? 'grade' : 'lista'
  } catch {
    return 'lista'
  }
}

const SYSTEM: Record<string, { name: string; note: string }> = {
  lidos: { name: 'lidos', note: 'do mais recente ao mais antigo' },
  lendo: { name: 'lendo agora', note: 'as leituras em andamento' },
  'quero-ler': { name: 'quero ler', note: 'a fila das próximas' },
}

/**
 * /estantes/:shelf (minhas) e /pessoas/:userId/estantes/:shelf (de outra pessoa):
 * lidos, lendo, quero ler ou uma estante própria, em lista (por mês) ou grade.
 */
export function ShelfDetailPage() {
  const { shelf = 'lidos', userId } = useParams()
  const me = useCurrentUser()
  const owner = userId ?? me.id
  const isMe = owner === me.id
  const navigate = useNavigate()
  const year = new Date().getFullYear()
  const [view, setView] = useState<View>(readView)
  const [filter, setFilter] = useState<ShelfFilter>('todos')

  const { data: myShelf } = useShelf()
  const { data: person } = usePerson(owner)
  const { data: personReadings } = usePersonReadings(owner)
  const { data: custom } = useCustomShelves(owner)
  const remove = useDeleteShelf()
  const toggle = useToggleShelfBook()

  const readings = isMe ? [...(myShelf?.read ?? []), ...(myShelf?.reading ?? [])] : (personReadings ?? [])
  const customShelf = custom?.find((s) => s.id === shelf)
  let items: ShelfItem[] = []
  if (shelf === 'lidos') items = fromReadings(readings.filter((r) => r.finished_on).sort((a, b) => b.finished_on!.localeCompare(a.finished_on!)), 'finished')
  else if (shelf === 'lendo') items = fromReadings(readings.filter((r) => !r.finished_on), 'started')
  else if (shelf === 'quero-ler' && isMe)
    items = (myShelf?.wishlist ?? []).map((w) => ({ key: w.book.id, book: { ...w.book, author: w.book.author ?? null }, date: w.created_at.slice(0, 10), rating: null }))
  else if (customShelf) items = customShelf.books.map((b) => ({ key: b.book.id, book: b.book, date: b.added_at.slice(0, 10), rating: null }))

  const meta = SYSTEM[shelf] ?? (customShelf ? { name: customShelf.name, note: 'na ordem em que entraram' } : null)
  const shown = filterShelf(items, filter, year)
  const back = isMe ? '/estantes' : personPath(owner)

  function changeView(v: View) {
    setView(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      // sem armazenamento local: a escolha vale só nesta visita
    }
  }

  if (!meta) return <EmptyState title="estante não encontrada">Ela pode ter sido apagada.</EmptyState>

  return (
    <div className="relative flex flex-col gap-4">
      <span aria-hidden="true" className="twinkle twinkle-late top-28 right-8 text-sm">✧</span>
      <div className="flex items-center justify-between">
        <BackLink to={back}>{isMe ? 'estantes' : (person?.name.split(/\s+/)[0]?.toLowerCase() ?? 'perfil')}</BackLink>
        {isMe && customShelf && (
          <Button
            variant="quiet"
            size="sm"
            fullWidth={false}
            loading={remove.isPending}
            onClick={async () => {
              if (!window.confirm(`Apagar a estante "${customShelf.name}"? Os livros continuam nas outras estantes.`)) return
              await remove.mutateAsync(customShelf.id)
              navigate('/estantes', { replace: true })
            }}
          >
            apagar estante
          </Button>
        )}
      </div>
      <div>
        <PageTitle>{meta.name}</PageTitle>
        <HandText>
          {items.length} {items.length === 1 ? 'livro' : 'livros'} · {meta.note}
          {!isMe && person && ` · de ${person.name.split(/\s+/)[0]}`}
        </HandText>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Filtrar" className="flex gap-1.5">
          {(
            [
              ['todos', 'todos'],
              ['ano', String(year)],
              ...(shelf === 'lidos' ? [['top', '★ 4+']] : []),
            ] as [ShelfFilter, string][]
          ).map(([f, label]) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={'h-8 rounded-full border px-3 font-sans text-xs font-semibold ' + (filter === f ? 'border-primary bg-primary text-inverse' : 'border-border bg-card text-ink')}
            >
              {label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Ver como" className="flex rounded-full border border-border bg-card">
          {(['lista', 'grade'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => changeView(v)}
              className={'min-h-8 rounded-full px-3 font-sans text-2xs font-semibold uppercase tracking-wide ' + (view === v ? 'bg-primary text-inverse' : 'text-muted')}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {isMe && customShelf && <AddBookToShelf target={{ kind: 'shelf', shelfId: customShelf.id }} />}
      {isMe && shelf === 'quero-ler' && <AddBookToShelf target={{ kind: 'wishlist' }} />}

      {shown.length === 0 ? (
        <EmptyState title="nada nesta estante" icon="shelves">
          {filter === 'todos' ? 'Os livros que entrarem aqui aparecem nesta lista.' : 'Nenhum livro com esse filtro.'}
        </EmptyState>
      ) : view === 'grade' ? (
        <ul aria-label={`Livros: ${meta.name}`} className="grid grid-cols-3 gap-x-3 gap-y-5">
          {shown.map((item) => (
            <li key={item.key}>
              <Link to={`/livros/${item.book.id}`} className="flex flex-col no-underline">
                <BookCover title={item.book.title} url={item.book.cover_url} size="fill" decorative />
                <span className="mt-2 line-clamp-2 font-display italic font-semibold text-md leading-tight text-ink">{item.book.title}</span>
                <span className="mt-1 font-sans text-2xs font-semibold uppercase tracking-wide text-muted">
                  {item.date && formatDayMonthShort(item.date)}
                </span>
              </Link>
              {isMe && customShelf && (
                <button
                  type="button"
                  onClick={() => toggle.mutate({ shelfId: customShelf.id, bookId: item.book.id, add: false })}
                  className="min-h-9 font-sans text-xs font-semibold text-muted"
                >
                  tirar da estante
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-4">
          {groupByMonth(shown, MONTH_NAMES).map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h2 className="m-0 mb-0.5 font-display italic font-semibold text-xl text-primary">{group.label}</h2>
              <ul aria-label={`Livros: ${meta.name} · ${group.label}`} className="flex flex-col">
                {group.items.map((item, i) => (
                  <li key={item.key}>
                    <Link to={`/livros/${item.book.id}`} className={`flex items-start gap-3.5 py-3 no-underline ${i > 0 ? 'border-t border-line' : ''}`}>
                      <BookCover title={item.book.title} url={item.book.cover_url} size="list" decorative />
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="flex items-center gap-2 font-sans text-2xs font-semibold uppercase tracking-label text-muted">
                          {item.date && formatDayMonthShort(item.date)}
                          {item.rating != null && <Stars value={item.rating} size="xs" />}
                        </span>
                        <span className="font-display italic font-semibold text-xl leading-tight text-ink">{item.book.title}</span>
                        {item.book.author && <span className="font-serif italic text-sm text-muted">{item.book.author}</span>}
                      </span>
                    </Link>
                    {isMe && customShelf && (
                      <button
                        type="button"
                        onClick={() => toggle.mutate({ shelfId: customShelf.id, bookId: item.book.id, add: false })}
                        className="-mt-1 mb-2 ml-16 min-h-9 font-sans text-xs font-semibold text-muted"
                      >
                        tirar da estante
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
