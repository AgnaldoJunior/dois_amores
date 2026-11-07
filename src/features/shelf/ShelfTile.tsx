import { Link } from 'react-router'
import { BookCover } from '@/components/ui/BookCover'

type ShelfCover = { id: string; title: string; cover_url: string | null }

/** Prateleira: até quatro capas de pé sobre a tábua de madeira clara. */
export function ShelfBoard({ books, label }: { books: ShelfCover[]; label: string }) {
  return (
    <div className="flex flex-col">
      <ul aria-label={label} className="flex h-cover-shelf-h items-end gap-3 px-1">
        {books.slice(0, 4).map((b) => (
          <li key={b.id}>
            <Link to={`/livros/${b.id}`} aria-label={b.title}>
              <BookCover title={b.title} url={b.cover_url} size="shelf" decorative />
            </Link>
          </li>
        ))}
        {books.length === 0 && (
          <li className="flex h-full items-center font-serif italic text-md text-muted">estante vazia por enquanto ✧</li>
        )}
      </ul>
      <span aria-hidden="true" className="shelf-board -mx-2" />
    </div>
  )
}
