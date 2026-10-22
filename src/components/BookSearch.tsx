import { useQuery } from '@tanstack/react-query'
import { useId, useState, type KeyboardEvent } from 'react'
import { BookCover } from '@/components/ui/BookCover'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { coverUrl, searchBooks, type BookSearchResult } from '@/lib/openlibrary/client'

export const SEARCH_DEBOUNCE_MS = 300
export const SEARCH_MIN_CHARS = 2
export const SEARCH_LIMIT = 5

type BookSearchProps = {
  onSelect: (book: BookSearchResult) => void
  label?: string
  disabled?: boolean
}

/**
 * Busca na Open Library com autocomplete (padrão ARIA combobox):
 * até 5 sugestões, debounce de 300 ms, ↑/↓ para navegar, Enter escolhe, Esc fecha.
 */
export function BookSearch({ onSelect, label = 'Buscar livro', disabled }: BookSearchProps) {
  const id = useId()
  const listId = `${id}-list`
  const statusId = `${id}-status`

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const term = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS)
  const enabled = term.length >= SEARCH_MIN_CHARS
  const { data: results = [], isFetching, isError } = useQuery({
    queryKey: ['openlibrary', 'search', term],
    queryFn: ({ signal }) => searchBooks(term, { limit: SEARCH_LIMIT, signal }),
    enabled,
    staleTime: 5 * 60_000,
  })

  const visible = open && enabled && results.length > 0
  const activeIndex = visible && active < results.length ? active : -1
  const optionId = (i: number) => `${id}-opt-${i}`

  function choose(book: BookSearchResult) {
    onSelect(book)
    setQuery('')
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setOpen(true)
        if (results.length) setActive((i) => (i + 1) % results.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setOpen(true)
        if (results.length) setActive((i) => (i <= 0 ? results.length - 1 : i - 1))
        break
      case 'Enter':
        if (activeIndex >= 0) {
          e.preventDefault()
          choose(results[activeIndex]!)
        }
        break
      case 'Escape':
        if (visible) {
          e.preventDefault()
          setOpen(false)
          setActive(-1)
        } else {
          setQuery('')
        }
        break
    }
  }

  let status = ''
  if (enabled && isFetching) status = 'Buscando…'
  else if (enabled && isError) status = 'Não foi possível buscar agora. Tente de novo.'
  else if (enabled && open && results.length === 0) status = 'Nenhum livro encontrado.'
  else if (visible) status = `${results.length} ${results.length === 1 ? 'sugestão' : 'sugestões'}. Use as setas para escolher.`

  return (
    <div className="relative flex flex-col gap-2">
      <label htmlFor={id} className="font-mono text-xs uppercase tracking-label text-primary">
        {label}
      </label>
      <input
        id={id}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visible}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-describedby={statusId}
        autoComplete="off"
        placeholder="título ou autor"
        disabled={disabled}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={
          'h-control-h w-full rounded-card border border-primary bg-card px-4 ' +
          'font-sans text-md text-primary placeholder:text-primary placeholder:opacity-60'
        }
      />
      <p id={statusId} aria-live="polite" className="font-hand text-lg leading-tight text-primary min-h-6">
        {status}
      </p>
      <ul
        id={listId}
        role="listbox"
        aria-label="Sugestões de livros"
        hidden={!visible}
        className="flex flex-col gap-1 rounded-card bg-card p-2"
      >
        {results.map((book, i) => (
          <li
            key={book.workKey}
            id={optionId(i)}
            role="option"
            aria-selected={i === activeIndex}
            // mousedown mantém o foco no campo; o clique escolhe.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(book)}
            onMouseEnter={() => setActive(i)}
            className={
              'flex cursor-pointer items-center gap-3 rounded-sm p-1 ' +
              (i === activeIndex ? 'outline outline-primary' : '')
            }
          >
            <BookCover
              title={book.title}
              url={book.coverId ? coverUrl(book.coverId, 'S') : null}
              size="xs"
              decorative
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-sans text-sm text-primary">{book.title}</span>
              <span className="truncate font-mono text-xs text-primary">
                {[book.author, book.year].filter(Boolean).join(' · ')}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
