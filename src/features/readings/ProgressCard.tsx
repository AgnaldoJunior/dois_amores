import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { BookCover } from '@/components/ui/BookCover'
import { Button } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { BookTitle, Label } from '@/components/ui/Typography'
import { formatCount, readingProgress } from '@/lib/domain/stats'
import { useUpdateProgress, type Reading } from './api'

/** Barra de progresso verde sobre creme. */
export function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-progress w-full overflow-hidden rounded-full bg-track"
    >
      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
    </div>
  )
}

/** "Lendo agora": capa, barra de progresso e atualização rápida da página atual. */
export function ProgressCard({ reading }: { reading: Reading }) {
  const { book } = reading
  const percent = readingProgress(reading.current_page, book.pages)
  const [editing, setEditing] = useState(false)

  return (
    <article className="flex gap-3.5 rounded-card border border-line bg-card p-3.5">
      <Link to={`/livros/${book.id}`} aria-label={book.title} className="shrink-0">
        <BookCover title={book.title} url={book.cover_url} size="feed" decorative />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <BookTitle className="text-lg">{book.title}</BookTitle>
        {percent != null && <ProgressBar percent={percent} label={`Progresso de ${book.title}`} />}
        {editing ? (
          <PageForm reading={reading} onDone={() => setEditing(false)} />
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Label>
              {percent != null ? `${percent}% lido` : 'quantas páginas já foram?'}
              {reading.current_page != null && book.pages ? ` · pág. ${formatCount(reading.current_page)} de ${formatCount(book.pages)}` : ''}
            </Label>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="min-h-11 shrink-0 font-sans text-sm font-semibold text-primary"
              aria-label={`Atualizar página atual de ${book.title}`}
            >
              atualizar
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

function PageForm({ reading, onDone }: { reading: Reading; onDone: () => void }) {
  const update = useUpdateProgress()
  const pages = reading.book.pages
  const [value, setValue] = useState(reading.current_page?.toString() ?? '')
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const page = value.trim() === '' ? null : Number(value)
    if (page != null && (!Number.isInteger(page) || page < 0 || (pages != null && page > pages))) {
      return setError(pages ? `Informe uma página entre 0 e ${pages}.` : 'Informe um número de página válido.')
    }
    setError('')
    try {
      await update.mutateAsync({ id: reading.id, page })
      onDone()
    } catch {
      setError('Não foi possível salvar. Tente de novo.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1.5" noValidate>
      <div className="flex items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-sans text-2xs font-semibold uppercase tracking-label text-primary">página atual</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={pages ?? undefined}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-11 w-full rounded-sm border border-border bg-page px-3 font-sans text-lg text-ink"
            autoFocus
          />
        </label>
        <Button type="submit" fullWidth={false} size="sm" loading={update.isPending} className="min-h-11">
          salvar
        </Button>
      </div>
      <button type="button" onClick={onDone} className="min-h-11 self-start font-sans text-sm font-semibold text-muted">
        cancelar
      </button>
      {error && <FormMessage tone="error">{error}</FormMessage>}
    </form>
  )
}
