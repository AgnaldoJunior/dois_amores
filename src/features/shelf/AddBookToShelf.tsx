import { useState } from 'react'
import { BookSearch } from '@/components/BookSearch'
import { Button } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { ensureBook } from '@/features/readings/api'
import type { BookSearchResult } from '@/lib/openlibrary/client'
import { useWishlistToggle } from './api'
import { useToggleShelfBook } from './shelvesApi'

/** Mensagem de erro ao pôr um livro numa estante (livro repetido ou sem permissão). */
export function shelfErrorMessage(err: unknown) {
  const code = (err as { code?: string } | null)?.code
  if (code === '23505') return 'Esse livro já está nesta estante.'
  if (code === '42501' || code === '42P01') return 'Não foi possível salvar: confira se o banco está atualizado (supabase db push).'
  return 'Não foi possível adicionar agora. Tente de novo.'
}

/**
 * "+ adicionar livro" dentro de uma estante própria ou da lista "quero ler":
 * busca na Open Library, salva no catálogo e coloca na estante.
 */
export function AddBookToShelf({ target }: { target: { kind: 'shelf'; shelfId: string } | { kind: 'wishlist' } }) {
  const toggleShelf = useToggleShelfBook()
  const toggleWishlist = useWishlistToggle()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  async function onSelect(result: BookSearchResult) {
    setMessage(null)
    setBusy(true)
    try {
      const book = await ensureBook(result)
      if (target.kind === 'shelf') await toggleShelf.mutateAsync({ shelfId: target.shelfId, bookId: book.id, add: true })
      else await toggleWishlist.mutateAsync({ bookId: book.id, add: true })
      setMessage({ tone: 'success', text: `${book.title} entrou na estante ✦` })
    } catch (err) {
      setMessage({ tone: 'error', text: shelfErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        + adicionar livro
      </Button>
    )
  }
  return (
    <section aria-label="Adicionar livro à estante" className="flex flex-col gap-2 rounded-card border border-line bg-card p-4">
      <BookSearch onSelect={onSelect} label="Buscar livro para a estante" disabled={busy} />
      {busy && <p className="m-0 font-serif italic text-md text-muted">guardando o livro…</p>}
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
      <button type="button" onClick={() => setOpen(false)} className="min-h-11 self-start font-sans text-sm font-semibold text-muted">
        fechar
      </button>
    </section>
  )
}
