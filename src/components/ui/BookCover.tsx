import { useState } from 'react'

const sizeClass = {
  xs: 'w-cover-xs-w h-cover-xs-h rounded-sm',
  sm: 'w-cover-sm-w h-cover-sm-h rounded-card',
  md: 'w-cover-md-w h-cover-md-h rounded-card',
  lg: 'w-cover-lg-w h-cover-lg-h rounded-card',
} as const

const titleClass = {
  xs: 'hidden',
  sm: 'text-sm',
  md: 'text-md',
  lg: 'text-lg',
} as const

type BookCoverProps = {
  title: string
  url?: string | null
  size?: keyof typeof sizeClass
  className?: string
  /** true quando o título já aparece ao lado (a imagem vira decorativa). */
  decorative?: boolean
}

/** Capa do livro; sem capa (ou se a imagem falhar) mostra o placeholder na cor papel com o título. */
export function BookCover({ title, url, size = 'md', className = '', decorative = false }: BookCoverProps) {
  const [failed, setFailed] = useState(false)
  const base = `${sizeClass[size]} shrink-0 overflow-hidden border border-primary bg-card ${className}`

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={decorative ? '' : `Capa de ${title}`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`${base} object-cover`}
      />
    )
  }

  return (
    <div
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : `Capa de ${title}`}
      aria-hidden={decorative || undefined}
      className={`${base} flex items-center justify-center p-2 text-center`}
    >
      <span className={`font-display uppercase leading-tight text-primary line-clamp-4 ${titleClass[size]}`}>
        {title}
      </span>
    </div>
  )
}
