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
      <label htmlFor={id} className="font-sans text-2xs font-semibold uppercase tracking-label text-primary">
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
          'h-control-h w-full rounded-full border border-border bg-card px-4.5 ' +
          'font-sans text-lg text-ink placeholder:text-muted'
        }
      />
      <p id={statusId} aria-live="polite" className="m-0 min-h-6 font-serif italic text-base text-muted">
        {status}
      </p>
      <ul
        id={listId}
        role="listbox"
        aria-label="Sugestões de livros"
        hidden={!visible}
        className="flex flex-col rounded-card border border-line bg-card"
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
              'flex cursor-pointer items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0 ' +
              (i === activeIndex ? 'bg-tag' : '')
            }
          >
            <BookCover
              title={book.title}
              url={book.coverId ? coverUrl(book.coverId, 'S') : null}
              size="xs"
              decorative
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-display italic font-semibold text-lg text-ink">{book.title}</span>
              <span className="truncate font-serif italic text-sm text-muted">
                {[book.author, book.year].filter(Boolean).join(' · ')}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
