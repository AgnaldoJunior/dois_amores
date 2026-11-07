import { useId } from 'react'

/** Estrela (viewBox 24 × 24): cheia em vinho, vazia só com o contorno. */
const STAR_PATH = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3 6.1 20.5l1.3-6.5L2.5 9.4l6.6-.8z'
const VIEW = 24

export type StarFill = 'full' | 'half' | 'empty'

const sizeClass = {
  xs: 'size-star-xs',
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

export type StarTone = 'primary' | 'inverse'

const toneClass = {
  primary: { fill: 'fill-ratingFilled', stroke: 'stroke-ratingFilled' },
  inverse: { fill: 'fill-inverse', stroke: 'stroke-inverse' },
} as const

export function StarIcon({ fill, className, tone = 'primary' }: { fill: StarFill; className: string; tone?: StarTone }) {
  const t = toneClass[tone]
  const clipId = `${useId()}-half`
  return (
    <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className={className} aria-hidden="true" focusable="false" data-fill={fill}>
      {fill === 'half' && (
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={VIEW / 2} height={VIEW} />
          </clipPath>
        </defs>
      )}
      {fill === 'half' && <path d={STAR_PATH} className={t.fill} clipPath={`url(#${clipId})`} />}
      <path
        d={STAR_PATH}
        className={`${fill === 'full' ? t.fill : 'fill-transparent'} ${t.stroke}`}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
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
  /** `inverse` para estrelas creme sobre fundo verde. */
  tone?: StarTone
}

/** Exibição de nota (somente leitura): estrelas cheias em vinho, vazias só com contorno, suporte a meia estrela. */
export function Stars({ value, size = 'md', max = 5, label, className = '', tone = 'primary' }: StarsProps) {
  const fills = starFills(value, max)
  const accessibleLabel =
    label ?? (value == null ? 'Sem nota' : `${formatRating(Math.round(value * 2) / 2)} de ${max} estrelas`)
  return (
    <span
      role="img"
      aria-label={accessibleLabel}
      className={`inline-flex items-center gap-0.5 ${className}`}
    >
      {fills.map((fill, i) => (
        <StarIcon key={i} fill={fill} tone={tone} className={sizeClass[size]} />
      ))}
    </span>
  )
}
