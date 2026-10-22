import { useId } from 'react'
import { StarIcon } from './Stars'

type RatingInputProps = {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  max?: number
}

/**
 * Nota de 1 a 5 em estrelas. Por baixo é um grupo de rádios: Tab entra no
 * grupo, ←/→ mudam a nota, e tocar de novo na estrela marcada limpa a nota.
 */
export function RatingInput({ label, value, onChange, max = 5 }: RatingInputProps) {
  const name = useId()
  return (
    <fieldset className="flex items-center gap-3">
      <legend className="sr-only">{label}</legend>
      <span aria-hidden="true" className="flex-1 font-mono text-xs uppercase tracking-label text-primary">
        {label}
      </span>
      <span className="flex flex-1 items-center gap-1.5">
        {Array.from({ length: max }, (_, i) => {
          const n = i + 1
          return (
            <label
              key={n}
              className="cursor-pointer rounded-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-primary"
            >
              <input
                type="radio"
                name={name}
                value={n}
                checked={value === n}
                onChange={() => onChange(n)}
                onClick={() => {
                  if (value === n) onChange(null)
                }}
                className="sr-only"
                aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
              />
              <StarIcon fill={value != null && n <= value ? 'full' : 'empty'} className="size-star-lg" />
            </label>
          )
        })}
      </span>
    </fieldset>
  )
}
