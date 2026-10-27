import type { ReactNode } from 'react'
import { Link } from 'react-router'

type ShelfTileProps = {
  to: string
  title: string
  coverUrl: string | null
  /** Linha abaixo da capa (estrelas, data etc.). */
  footer?: ReactNode
}

/**
 * Livro na prateleira: recorte borrado da capa (identificação rápida pela cor)
 * com o título por cima, legível graças a um véu na cor papel.
 */
export function ShelfTile({ to, title, coverUrl, footer }: ShelfTileProps) {
  return (
    <Link to={to} className="flex flex-col gap-1.5 rounded-card" aria-label={title}>
      <span className="relative flex aspect-[2/3] w-full items-center justify-center overflow-hidden rounded-card border border-primary bg-card p-1.5">
        {coverUrl && (
          <>
            <img
              src={coverUrl}
              alt=""
              loading="lazy"
              decoding="async"
              data-testid="shelf-cover"
              className="absolute inset-0 size-full scale-125 object-cover blur-cover"
            />
            <span aria-hidden="true" className="absolute inset-0 bg-card/60" />
          </>
        )}
        <span className="relative line-clamp-5 text-center font-display text-sm uppercase leading-tight text-primary">
          {title}
        </span>
      </span>
      {footer}
    </Link>
  )
}

export function ShelfGrid({ children, label }: { children: ReactNode; label: string }) {
  return (
    <ul aria-label={label} className="grid grid-cols-3 gap-3 md:grid-cols-5 lg:grid-cols-6">
      {children}
    </ul>
  )
}
