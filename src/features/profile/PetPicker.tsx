import { PETS } from '@/lib/pets'

/** Escolha do bichinho: grupo de rádios com os emojis (tocar de novo no escolhido remove). */
export function PetPicker({ value, onChange }: { value: string | null; onChange: (pet: string | null) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-sans font-semibold text-xs uppercase tracking-label">Seu bichinho</legend>
      <p className="-mt-1 font-serif italic text-md">ele marca os livros que você escolher no clube</p>
      <div className="grid grid-cols-4 gap-2">
        {PETS.map((p) => (
          <label
            key={p.emoji}
            className={
              'flex h-12 cursor-pointer items-center justify-center rounded-card border border-primary text-2xl ' +
              'has-[:focus-visible]:outline has-[:focus-visible]:outline-primary ' +
              (value === p.emoji ? 'bg-primary' : 'bg-page')
            }
          >
            <input
              type="radio"
              name="pet"
              value={p.emoji}
              checked={value === p.emoji}
              onChange={() => onChange(p.emoji)}
              onClick={() => value === p.emoji && onChange(null)}
              className="sr-only"
              aria-label={p.label}
            />
            <span aria-hidden="true">{p.emoji}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
