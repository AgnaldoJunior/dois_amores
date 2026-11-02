import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { BookCover } from '@/components/ui/BookCover'
import { Icon } from '@/components/ui/Icon'

type ShelfTileProps = {
  to: string
  title: string
  coverUrl: string | null
  /** Linha abaixo da tábua (estrelas, etiqueta etc.). */
  footer?: ReactNode
}

/** Pedaço de tábua sob cada livro; lado a lado, formam a prateleira inteira. */
function Plank() {
  return <span aria-hidden="true" className="plank -mt-0.5 rounded-none" />
}

const cell = 'flex flex-col justify-end'

/** Livro de pé na prateleira: capa real, tábua e, embaixo, estrelas ou etiqueta. */
export function ShelfTile({ to, title, coverUrl, footer }: ShelfTileProps) {
  return (
    <li className={cell}>
      <Link to={to} aria-label={title} className="relative z-1 block px-1">
        <BookCover title={title} url={coverUrl} size="fill" decorative framed={false} className="shadow-spine" />
      </Link>
      <Plank />
      <div className="flex min-h-star-lg justify-center pt-1">{footer}</div>
    </li>
  )
}

/** Vaga tracejada "+" no fim da estante. */
export function ShelfAddSlot({ to, label }: { to: string; label: string }) {
  return (
    <li className={cell}>
      <Link
        to={to}
        aria-label={label}
        className="relative z-1 mx-1 flex aspect-[2/3] items-center justify-center rounded-xs border border-dashed border-slot text-muted"
      >
        <Icon name="plus" />
      </Link>
      <Plank />
      <div className="min-h-star-lg" />
    </li>
  )
}

/** Completa a última prateleira com tábua vazia (5 colunas no celular, 8 no desktop). */
function Fillers({ count }: { count: number }) {
  const fill = (cols: number) => (cols - (count % cols)) % cols
  return (
    <>
      {Array.from({ length: fill(5) }, (_, i) => (
        <li key={`m${i}`} aria-hidden="true" className={`${cell} lg:hidden`}>
          <Plank />
          <div className="min-h-star-lg" />
        </li>
      ))}
      {Array.from({ length: fill(8) }, (_, i) => (
        <li key={`d${i}`} aria-hidden="true" className={`${cell} hidden lg:flex`}>
          <Plank />
          <div className="min-h-star-lg" />
        </li>
      ))}
    </>
  )
}

/** Estante: grade sem espaço entre colunas para as tábuas se emendarem. */
export function ShelfGrid({ children, label, count }: { children: ReactNode; label: string; count: number }) {
  return (
    <ul aria-label={label} className="grid grid-cols-5 gap-x-0 gap-y-3 lg:grid-cols-8">
      {children}
      <Fillers count={count} />
    </ul>
  )
}

/** Etiqueta rosa sob o livro em andamento ("desde 10/10", "38%"). */
export function ShelfTag({ children }: { children: ReactNode }) {
  return (
    <span className="mx-1 w-full rounded-xs bg-pill py-0.5 text-center font-mono font-bold text-2xs uppercase leading-tight">
      {children}
    </span>
  )
}
