const tone = [
  'tilt-l1 bg-primary text-inverse',
  'bg-card text-primary',
  'tilt-r1 bg-pill text-primary',
] as const

export type StatTile = { value: string; label: string }

/** Três números grandes lado a lado (verde, kraft e rosa), como etiquetas coladas. */
export function StatTiles({ items, label }: { items: [StatTile, StatTile, StatTile]; label: string }) {
  return (
    <section aria-label={label} className="grid grid-cols-3 gap-2">
      {items.map((item, i) => (
        <div key={item.label} className={`flex flex-col items-center rounded-card border border-primary px-1 py-2.5 ${tone[i]}`}>
          <span className="font-display text-stat leading-none">{item.value}</span>
          <span className={`text-center font-mono font-bold text-2xs uppercase tracking-label ${i === 0 ? 'text-pill' : ''}`}>
            {item.label}
          </span>
        </div>
      ))}
    </section>
  )
}
