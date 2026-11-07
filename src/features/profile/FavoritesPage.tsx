import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BackLink } from '@/components/ui/BackLink'
import { BookCover } from '@/components/ui/BookCover'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { HandText, PageTitle } from '@/components/ui/Typography'
import { useFavorites, useSaveFavorites } from '@/features/people/api'
import { useShelf } from '@/features/shelf/api'
import { useCurrentUser } from '@/lib/auth/AuthProvider'

export const MAX_FAVORITES = 4

/** /perfil/favoritos — escolha até 4 livros lidos para o destaque do perfil. */
export function FavoritesPage() {
  const me = useCurrentUser()
  const { data: shelf } = useShelf()
  const { data: current, isLoading } = useFavorites(me.id)
  if (isLoading || !shelf) return <p className="m-0 font-serif italic text-md text-muted">abrindo seus livros…</p>
  return <Picker initial={current?.map((f) => f.book.id) ?? []} books={shelf.read.map((r) => r.book)} />
}

function Picker({ initial, books }: { initial: string[]; books: { id: string; title: string; cover_url: string | null }[] }) {
  const navigate = useNavigate()
  const save = useSaveFavorites()
  const [chosen, setChosen] = useState<string[]>(initial)
  const [error, setError] = useState('')

  function toggle(id: string) {
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < MAX_FAVORITES ? [...c, id] : c))
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
          escolha até {MAX_FAVORITES} · {chosen.length} {chosen.length === 1 ? 'escolhido' : 'escolhidos'}. esses livros aparecem em destaque no seu perfil.
        </HandText>
      </div>
      {books.length === 0 ? (
        <EmptyState title="nenhum livro lido ainda" icon="book">
          Os favoritos saem dos livros que você já terminou.
        </EmptyState>
      ) : (
        <fieldset className="grid grid-cols-3 gap-x-3 gap-y-4">
          <legend className="sr-only">Livros lidos</legend>
          {books.map((b) => {
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
