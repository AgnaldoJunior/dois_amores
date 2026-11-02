import type { ReactNode } from 'react'
import { Stars } from '@/components/ui/Stars'
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

/** Rótulo em máquina de escrever, bem pequeno, dentro dos campos da ficha. */
function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="font-mono font-bold text-2xs uppercase tracking-label">{children}</span>
}

/** Campo da ficha: contorno verde, rótulo e valor manuscrito. */
export function Field({ label, children, stacked = false }: { label: string; children: ReactNode; stacked?: boolean }) {
  return (
    <div
      className={`flex min-w-0 gap-1.5 rounded-sm border border-primary px-2 py-1 ${stacked ? 'flex-col gap-0.5' : 'items-baseline'}`}
    >
      <FieldLabel>{label}:</FieldLabel>
      <span className="min-w-0 break-words font-hand text-md leading-tight">{children}</span>
    </div>
  )
}

type ReviewCardProps = {
  /** Título cursivo no cabeçalho verde ("seus dados", nome da amiga). */
  title: string
  review: ReviewData
  /** Campos extras antes das datas (autor, nº de páginas). */
  extraFields?: ReactNode
}

/** Ficha de review: cabeçalho verde com a nota geral, datas, notas por categoria e comentários. */
export function ReviewCard({ title, review, extraFields }: ReviewCardProps) {
  const average = memberAverage(review)
  return (
    <section className="overflow-hidden rounded-card bg-card" aria-label={title}>
      <div className="flex items-center justify-between gap-2 bg-primary px-3.5 pt-1.5 pb-1 text-inverse">
        <h2 className="font-script font-normal text-3xl leading-none first-letter:uppercase">{title}</h2>
        <Stars value={average} size="md" tone="inverse" />
      </div>
      <div className="flex flex-col gap-1.5 p-2.5">
        {extraFields}
        <div className="grid grid-cols-2 gap-1.5">
          <Field label="início">{formatDayMonth(review.started_on) || '—'}</Field>
          <Field label="fim">{review.finished_on ? formatDayMonth(review.finished_on) : 'lendo'}</Field>
        </div>
        <dl className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 px-1.5 py-0.5">
          {RANK_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <dt className="w-full rounded-xs bg-pill py-0.5 text-center font-mono font-bold text-2xs uppercase tracking-label">
                {label}
              </dt>
              <dd>
                <Stars value={review[key]} size="md" />
              </dd>
            </div>
          ))}
        </dl>
        <Field label="personagem fav">{review.favorite_character ?? 'não informado'}</Field>
        <Field label="citação favorita" stacked>
          {review.favorite_quote ? `“${review.favorite_quote}”` : 'nenhuma ainda'}
        </Field>
        <Field label="comentário" stacked>
          {review.comment ?? 'nenhum ainda'}
        </Field>
      </div>
    </section>
  )
}
