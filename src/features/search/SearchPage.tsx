import { useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router'
import { BookSearch } from '@/components/BookSearch'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { PageTitle } from '@/components/ui/Typography'
import { useSearchPeople } from '@/features/people/api'
import { PeopleList } from '@/features/people/PeopleList'
import { ensureBook } from '@/features/readings/api'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import type { BookSearchResult } from '@/lib/openlibrary/client'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  'flex h-9 flex-1 items-center justify-center rounded-full font-sans text-sm font-semibold no-underline ' +
  (isActive ? 'bg-primary text-inverse' : 'text-muted')

/** /buscar (livros) e /buscar/pessoas */
export function SearchPage() {
  const { aba } = useParams()
  return (
    <div className="relative flex flex-col gap-4">
      <span aria-hidden="true" className="twinkle top-14 right-6 text-sm">✧</span>
      <BackLink to="/">início</BackLink>
      <PageTitle>buscar</PageTitle>
      <nav aria-label="O que buscar" className="flex gap-1 rounded-full bg-tag p-1">
        <NavLink to="/buscar" end className={tabClass}>
          livros
        </NavLink>
        <NavLink to="/buscar/pessoas" className={tabClass}>
          pessoas
        </NavLink>
      </nav>
      {aba === 'pessoas' ? <PeopleSearch /> : <BooksSearch />}
    </div>
  )
}

function BooksSearch() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function onSelect(result: BookSearchResult) {
    setError('')
    setBusy(true)
    try {
      const book = await ensureBook(result)
      navigate(`/livros/${book.id}`)
    } catch {
      setError('Não foi possível abrir este livro. Tente de novo.')
      setBusy(false)
    }
  }
  return (
    <>
      <BookSearch onSelect={onSelect} label="Título ou autora" disabled={busy} />
      {busy && <p className="m-0 font-serif italic text-md text-muted">abrindo o livro…</p>}
      {error && <FormMessage tone="error">{error}</FormMessage>}
    </>
  )
}

function PeopleSearch() {
  const [q, setQ] = useState('')
  const term = useDebouncedValue(q, 300)
  const { data, isFetching } = useSearchPeople(term)
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-2xs font-semibold uppercase tracking-label text-primary">Nome ou @usuário</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="nome ou @usuário"
          className="h-control-h w-full rounded-full border border-border bg-card px-4.5 font-sans text-lg text-ink placeholder:text-muted"
        />
      </label>
      {term.trim().length < 2 ? (
        <p className="m-0 text-center font-serif italic text-md text-muted">procure pelo @usuário pra achar direto ✦</p>
      ) : isFetching ? (
        <p className="m-0 font-serif italic text-md text-muted">procurando…</p>
      ) : data && data.length > 0 ? (
        <PeopleList people={data} label="Pessoas encontradas" />
      ) : (
        <EmptyState title="ninguém com esse nome" icon="search">
          Confira a grafia ou procure pelo @usuário.
        </EmptyState>
      )}
    </>
  )
}
