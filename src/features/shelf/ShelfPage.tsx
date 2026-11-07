import { Link } from 'react-router'
import { EmptyState } from '@/components/ui/EmptyState'
import { HandText, PageTitle } from '@/components/ui/Typography'
import { useBackgroundEnrichment } from '@/lib/books/useBackgroundEnrichment'
import { shelfColors } from '@/theme/tokens'
import { useShelf } from './api'
import { useCustomShelves, type ShelfColor } from './shelvesApi'
import { ShelfBoard } from './ShelfTile'

export const bookPath = (bookId: string) => `/livros/${bookId}`

type Overview = { key: string; to: string; name: string; color: ShelfColor; books: { id: string; title: string; cover_url: string | null }[] }

/** /estantes — "minhas estantes": lidos, lendo, quero ler e as estantes próprias, cada uma numa prateleira. */
export function ShelfPage() {
  const { data, isLoading } = useShelf()
  const { data: custom } = useCustomShelves()
  useBackgroundEnrichment(data && [...data.read, ...data.reading, ...data.wishlist].map((r) => r.book))

  const shelves: Overview[] = data
    ? [
        { key: 'lidos', to: '/estantes/lidos', name: 'lidos', color: 'vinho', books: data.read.map((r) => r.book) },
        { key: 'lendo', to: '/estantes/lendo', name: 'lendo agora', color: 'areia', books: data.reading.map((r) => r.book) },
        { key: 'quero-ler', to: '/estantes/quero-ler', name: 'quero ler', color: 'rosa', books: data.wishlist.map((w) => w.book) },
        ...(custom ?? []).map((s) => ({ key: s.id, to: `/estantes/${s.id}`, name: s.name, color: s.color, books: s.books.map((b) => b.book) })),
      ]
    : []
  const total = new Set(shelves.flatMap((s) => s.books.map((b) => b.id))).size

  return (
    <div className="relative flex flex-col gap-6">
      <span aria-hidden="true" className="twinkle twinkle-late top-24 right-2 text-sm">✧</span>
      <span aria-hidden="true" className="twinkle twinkle-rose twinkle-later top-72 -left-1 text-2xs">✦</span>
      <header className="flex items-center justify-between">
        <span className="font-sans text-base font-semibold text-ink">estantes</span>
        <Link to="/estantes/nova" className="flex min-h-11 items-center font-sans text-base font-semibold text-primary no-underline">
          + nova estante
        </Link>
      </header>
      <div className="-mt-2">
        <PageTitle>minhas estantes</PageTitle>
        <HandText>
          {total} {total === 1 ? 'livro' : 'livros'} em {shelves.length} estantes ✦
        </HandText>
      </div>

      {isLoading && <p className="m-0 font-serif italic text-md text-muted">arrumando a estante…</p>}
      {data && total === 0 && (
        <EmptyState title="sua estante está vazia" icon="shelves" action={<Link to="/buscar" className="font-sans text-base font-semibold text-primary">buscar um livro →</Link>}>
          Busque um livro para começar a ler ou guardar na lista "quero ler".
        </EmptyState>
      )}

      {shelves.map((s) => {
        const c = shelfColors[s.color]
        return (
          <section key={s.key} aria-labelledby={`shelf-${s.key}`} className="rise flex flex-col gap-3">
            <ShelfBoard books={s.books} label={`Capas da estante ${s.name}`} />
            <Link to={s.to} className="flex items-baseline justify-between gap-3 no-underline">
              <span className="flex items-baseline gap-2">
                <span className="inline-flex h-tag-h items-center rounded-full px-2.5 font-sans text-2xs font-semibold uppercase tracking-wide" style={{ backgroundColor: c.bg, color: c.fg }}>
                  {s.books.length} {s.books.length === 1 ? 'livro' : 'livros'}
                </span>
                <span id={`shelf-${s.key}`} className="font-display italic font-semibold text-2xl text-primary">
                  {s.name}
                </span>
              </span>
              <span className="font-sans text-2xs font-semibold uppercase tracking-label text-muted">abrir →</span>
            </Link>
          </section>
        )
      })}
    </div>
  )
}
