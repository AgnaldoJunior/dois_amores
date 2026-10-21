import { useId } from 'react'

/** Contorno da estrela do Figma (Design System · Star), viewBox 15.2169 × 14.4721. */
const STAR_PATH =
  'M7.60845 0L9.72448 5.08754L15.2169 5.52786L11.0323 9.11246L12.3107 14.4721L7.60845 11.6L2.90617 14.4721L4.18465 9.11246L0 5.52786L5.49243 5.08754L7.60845 0Z'
const VIEW_W = 15.2169
const VIEW_H = 14.4721

export type StarFill = 'full' | 'half' | 'empty'

const sizeClass = {
  sm: 'size-star-sm',
  md: 'size-star-md',
  lg: 'size-star-lg',
} as const

/** Arredonda para o meio ponto mais próximo e devolve o preenchimento de cada uma das `max` estrelas. */
export function starFills(value: number | null | undefined, max = 5): StarFill[] {
  const v = Math.min(max, Math.max(0, Math.round((value ?? 0) * 2) / 2))
  return Array.from({ length: max }, (_, i) => {
    if (v >= i + 1) return 'full'
    if (v >= i + 0.5) return 'half'
    return 'empty'
  })
}

export function formatRating(value: number) {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function Star({ fill, className }: { fill: StarFill; className: string }) {
  const id = useId()
  const maskId = `${id}-inner-stroke`
  const clipId = `${id}-half`
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      aria-hidden="true"
      focusable="false"
      data-fill={fill}
    >
      <defs>
        {/* Contorno interno, como no Figma: stroke duplo recortado pela própria forma. */}
        <mask id={maskId}>
          <path d={STAR_PATH} className="fill-inverse" />
        </mask>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={VIEW_W / 2} height={VIEW_H} />
        </clipPath>
      </defs>
      {fill === 'full' ? (
        <path d={STAR_PATH} className="fill-ratingFilled" />
      ) : (
        <>
          <path d={STAR_PATH} className="fill-page" />
          {fill === 'half' && (
            <path d={STAR_PATH} className="fill-ratingFilled" clipPath={`url(#${clipId})`} />
          )}
          <path
            d={STAR_PATH}
            className="fill-transparent stroke-ratingEmpty"
            strokeWidth={2.4}
            mask={`url(#${maskId})`}
          />
        </>
      )}
    </svg>
  )
}

type StarsProps = {
  value: number | null | undefined
  size?: keyof typeof sizeClass
  max?: number
  /** Texto acessível; por padrão "4,5 de 5 estrelas" ou "Sem nota". */
  label?: string
  className?: string
}

/** Exibição de nota (somente leitura): estrelas cheias verdes, vazias com contorno rosa, suporte a meia estrela. */
export function Stars({ value, size = 'md', max = 5, label, className = '' }: StarsProps) {
  const fills = starFills(value, max)
  const accessibleLabel =
    label ?? (value == null ? 'Sem nota' : `${formatRating(Math.round(value * 2) / 2)} de ${max} estrelas`)
  return (
    <span
      role="img"
      aria-label={accessibleLabel}
      className={`inline-flex items-center gap-1.5 ${className}`}
    >
      {fills.map((fill, i) => (
        <Star key={i} fill={fill} className={sizeClass[size]} />
      ))}
    </span>
  )
}
