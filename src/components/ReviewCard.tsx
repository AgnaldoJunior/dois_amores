import type { ReactNode } from 'react'
import { Stars } from '@/components/ui/Stars'
import { Quote } from '@/components/ui/Typography'
import { formatDayMonth } from '@/lib/dates'
import { memberAverage, type Ranks } from '@/lib/domain/ratings'
import { RANK_FIELDS } from '@/features/readings/validation'

export type ReviewData = Ranks & {
  started_on: string | null
  finished_on: string | null
  favorite_character: string | null
  favorite_quote: string | null
  comment: string | null
}

/** Linha de informação da ficha: rótulo em caixa alta e o valor. */
export function Field({ label, children }: { label: string; children: ReactNode; stacked?: boolean }) {
  return (
    <div className="flex min-w-0 items-baseline gap-2">
      <span className="font-sans text-2xs font-semibold uppercase tracking-label text-muted">{label}</span>
      <span className="min-w-0 break-words font-sans text-base text-ink">{children}</span>
    </div>
  )
}

type ReviewCardProps = {
  /** Título da ficha ("sua ficha", nome da amiga). */
  title: string
  review: ReviewData
  /** Linhas extras antes das datas (autor, nº de páginas). */
  extraFields?: ReactNode
}

/** Ficha de leitura: nota geral, datas, nota por critério, personagem, citação e o que achou. */
export function ReviewCard({ title, review, extraFields }: ReviewCardProps) {
  const average = memberAverage(review)
  return (
    <section className="flex flex-col gap-3.5 rounded-card border border-line bg-card p-4" aria-label={title}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 font-display italic font-semibold text-2xl leading-none text-primary">{title}</h2>
        <Stars value={average} size="md" />
      </div>
      {extraFields}
      <p className="m-0 font-sans text-sm text-muted">
        <span className="sr-only">Início </span>
        <span>{formatDayMonth(review.started_on) || '—'}</span> → <span className="sr-only">fim </span>
        <span>{review.finished_on ? formatDayMonth(review.finished_on) : 'lendo'}</span>
      </p>
      <dl className="m-0 flex flex-col gap-2 border-y border-line py-3">
        {RANK_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <dt className="font-sans text-md font-medium lowercase">{label}</dt>
            <dd className="m-0">
              <Stars value={review[key]} size="sm" />
            </dd>
          </div>
        ))}
      </dl>
      <p className="m-0 font-serif italic text-md text-primary">
        personagem favorita · <span>{review.favorite_character ?? 'não informado'}</span> ♡
      </p>
      {review.favorite_quote ? <Quote className="text-lg">{review.favorite_quote}</Quote> : <p className="m-0 font-serif italic text-md text-muted">citação favorita: <span>nenhuma ainda</span></p>}
      <div className="flex flex-col gap-1">
        <span className="font-sans text-2xs font-semibold uppercase tracking-label text-muted">o que eu achei</span>
        <p className="m-0 font-sans text-base leading-relaxed">{review.comment ?? 'nenhum ainda'}</p>
      </div>
    </section>
  )
}
