import { useState } from 'react'

const sizeClass = {
  xs: 'w-cover-xs-w h-cover-xs-h',
  feed: 'w-cover-feed-w h-cover-feed-h',
  list: 'w-cover-list-w h-cover-list-h',
  friend: 'w-cover-friend-w h-cover-friend-h',
  shelf: 'w-cover-shelf-w h-cover-shelf-h',
  fav: 'w-cover-fav-w h-cover-fav-h',
  grid: 'w-cover-grid-w h-cover-grid-h',
  hero: 'w-cover-hero-w h-cover-hero-h',
  /** ocupa a largura da célula, proporção 2:3 */
  fill: 'w-full aspect-[2/3]',
} as const

const titleClass = {
  xs: 'hidden',
  feed: 'text-2xs',
  list: 'text-2xs',
  friend: 'text-2xs',
  shelf: 'text-xs',
  fav: 'text-xs',
  grid: 'text-sm',
  hero: 'text-xl',
  fill: 'text-xs',
} as const

export type CoverSize = keyof typeof sizeClass

type BookCoverProps = {
  title: string
  url?: string | null
  size?: CoverSize
  className?: string
  /** true quando o título já aparece ao lado (a imagem vira decorativa). */
  decorative?: boolean
}

/** Capa com lombada; sem capa (ou se a imagem falhar) mostra o título sobre o papel. */
export function BookCover({ title, url, size = 'list', className = '', decorative = false }: BookCoverProps) {
  const [failed, setFailed] = useState(false)
  const base = `${sizeClass[size]} shrink-0 overflow-hidden bg-tag ${size === 'hero' ? 'book-cover-hero' : 'book-cover'} ${className}`

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={decorative ? '' : `Capa de ${title}`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        // A Open Library responde 1×1 px transparente quando não tem a capa.
        onLoad={(e) => e.currentTarget.naturalWidth <= 1 && setFailed(true)}
        className={`${base} block object-cover`}
      />
    )
  }

  return (
    <div
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : `Capa de ${title}`}
      aria-hidden={decorative || undefined}
      className={`${base} flex items-center justify-center p-1.5 text-center`}
    >
      <span className={`font-display italic font-semibold leading-tight text-primary line-clamp-4 ${titleClass[size]}`}>{title}</span>
    </div>
  )
}
