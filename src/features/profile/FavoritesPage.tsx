import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BookSearch } from '@/components/BookSearch'
import { BackLink } from '@/components/ui/BackLink'
import { BookCover } from '@/components/ui/BookCover'
import { Button } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { HandText, PageTitle } from '@/components/ui/Typography'
import { useFavorites, useSaveFavorites } from '@/features/people/api'
import { ensureBook } from '@/features/readings/api'
import { useShelf } from '@/features/shelf/api'
import { useCustomShelves } from '@/features/shelf/shelvesApi'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import type { BookSearchResult } from '@/lib/openlibrary/client'

export const MAX_FAVORITES = 4

type PickBook = { id: string; title: string; cover_url: string | null }

/** Junta os livros sem repetir, mantendo a primeira ocorrência. */
export function uniqueBooks(books: PickBook[]): PickBook[] {
  const seen = new Set<string>()
  return books.filter((b) => (seen.has(b.id) ? false : (seen.add(b.id), true)))
}

/**
 * /perfil/favoritos — escolha até 4 livros para o destaque do perfil: os favoritos atuais,
 * os das estantes (lidos, lendo, quero ler, estantes próprias) ou qualquer livro da busca.
 */
export function FavoritesPage() {
  const me = useCurrentUser()
  const { data: shelf } = useShelf()
  const { data: custom } = useCustomShelves()
  const { data: current, isLoading } = useFavorites(me.id)
  if (isLoading || !shelf) return <p className="m-0 font-serif italic text-md text-muted">abrindo seus livros…</p>
  const books = uniqueBooks([
    ...(current ?? []).map((f) => f.book),
    ...shelf.read.map((r) => r.book),
    ...shelf.reading.map((r) => r.book),
    ...shelf.wishlist.map((w) => w.book),
    ...(custom ?? []).flatMap((s) => s.books.map((b) => b.book)),
  ])
  return <Picker initial={current?.map((f) => f.book.id) ?? []} books={books} />
}

function Picker({ initial, books }: { initial: string[]; books: PickBook[] }) {
  const navigate = useNavigate()
  const save = useSaveFavorites()
  const [chosen, setChosen] = useState<string[]>(initial)
  const [extra, setExtra] = useState<PickBook[]>([])
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const all = uniqueBooks([...extra, ...books])

  function toggle(id: string) {
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < MAX_FAVORITES ? [...c, id] : c))
  }

  async function onSearch(result: BookSearchResult) {
    setError('')
    setAdding(true)
    try {
      const book = await ensureBook(result)
      setExtra((e) => [{ id: book.id, title: book.title, cover_url: book.cover_url }, ...e])
      setChosen((c) => (c.includes(book.id) || c.length >= MAX_FAVORITES ? c : [...c, book.id]))
    } catch {
      setError('Não foi possível buscar este livro. Tente de novo.')
    } finally {
      setAdding(false)
    }
  }

  async function onSave() {
    setError('')
    try {
      await save.mutateAsync(chosen)
      navigate('/perfil')
    } catch {
      setError('Não foi possível salvar. Tente de novo.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <BackLink to="/perfil/editar">editar perfil</BackLink>
      <div>
        <PageTitle>favoritos</PageTitle>
        <HandText>
          escolha até {MAX_FAVORITES} · {chosen.length} {chosen.length === 1 ? 'escolhido' : 'escolhidos'}. lidos ou não: esses livros aparecem em destaque no seu
          perfil.
        </HandText>
      </div>
      <BookSearch onSelect={onSearch} label="Buscar qualquer livro" disabled={adding} />
      {adding && <p className="m-0 font-serif italic text-md text-muted">buscando o livro…</p>}
      {all.length > 0 && (
        <fieldset className="grid grid-cols-3 gap-x-3 gap-y-4">
          <legend className="mb-3 font-sans text-2xs font-semibold uppercase tracking-label text-primary">Escolha os favoritos</legend>
          {all.map((b) => {
            const on = chosen.includes(b.id)
            const full = !on && chosen.length >= MAX_FAVORITES
            return (
              <label key={b.id} className={`relative flex cursor-pointer flex-col gap-1.5 has-[:focus-visible]:outline has-[:focus-visible]:outline-primary ${full ? 'opacity-50' : ''}`}>
                <input type="checkbox" checked={on} disabled={full} onChange={() => toggle(b.id)} className="sr-only" />
                <BookCover title={b.title} url={b.cover_url} size="fill" decorative />
                <span
                  aria-hidden="true"
                  className={'absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border-strong font-sans text-xs font-bold ' + (on ? 'border-primary bg-primary text-inverse' : 'border-border bg-card')}
                >
                  {on ? chosen.indexOf(b.id) + 1 : ''}
                </span>
                <span className="line-clamp-2 font-display italic font-semibold text-sm leading-tight">{b.title}</span>
              </label>
            )
          })}
        </fieldset>
      )}
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <Button onClick={onSave} loading={save.isPending}>
        salvar favoritos
      </Button>
    </div>
  )
}
