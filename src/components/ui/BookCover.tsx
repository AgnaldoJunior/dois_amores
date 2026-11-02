import { useState } from 'react'

const sizeClass = {
  xs: 'w-cover-xs-w h-cover-xs-h',
  feed: 'w-feed-cover-w h-feed-cover-h',
  club: 'w-club-xs-w h-club-xs-h',
  stamp: 'w-stamp-w h-stamp-h',
  track: 'w-track-w h-track-h',
  sm: 'w-cover-sm-w h-cover-sm-h',
  md: 'w-cover-md-w h-cover-md-h',
  lg: 'w-cover-lg-w h-cover-lg-h',
  /** ocupa a largura da célula (estantes), proporção 2:3 */
  fill: 'w-full aspect-[2/3]',
} as const

const titleClass = {
  xs: 'hidden',
  feed: 'text-2xs',
  club: 'text-2xs',
  stamp: 'text-xs',
  track: 'text-xs',
  sm: 'text-sm',
  md: 'text-md',
  lg: 'text-lg',
  fill: 'text-xs',
} as const

type BookCoverProps = {
  title: string
  url?: string | null
  size?: keyof typeof sizeClass
  className?: string
  /** true quando o título já aparece ao lado (a imagem vira decorativa). */
  decorative?: boolean
  /** Moldura de selo postal picotada (verde com furos). */
  stamp?: boolean
  /** Contorno verde fino (padrão); falso nas estantes. */
  framed?: boolean
}

/** Capa do livro; sem capa (ou se a imagem falhar) mostra o placeholder kraft com o título. */
export function BookCover({ title, url, size = 'md', className = '', decorative = false, stamp = false, framed = true }: BookCoverProps) {
  const [failed, setFailed] = useState(false)
  const frame = stamp ? `stamp ${sizeClass[size]} ${className}` : ''
  const base = stamp
    ? 'size-full overflow-hidden bg-card'
    : `${sizeClass[size]} shrink-0 overflow-hidden ${framed ? 'border border-primary' : ''} bg-card ${className}`

  const cover =
    url && !failed ? (
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
    ) : (
      <div
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : `Capa de ${title}`}
        aria-hidden={decorative || undefined}
        className={`${base} flex items-center justify-center p-1.5 text-center`}
      >
        <span className={`font-type leading-tight text-primary line-clamp-4 ${titleClass[size]}`}>{title}</span>
      </div>
    )

  return stamp ? <div className={frame}>{cover}</div> : cover
}
