export type StatTile = { value: string; label: string }

/** Linha de números entre dois fios (ex.: "27 livros · 9.267 páginas · 3,8★ média"). */
export function StatTiles({ items, label }: { items: StatTile[]; label: string }) {
  return (
    <section aria-label={label} className="flex border-y border-line">
      {items.map((item, i) => (
        <div key={item.label} className={`flex flex-1 flex-col items-center gap-1.5 py-2.5 ${i > 0 ? 'border-l border-line' : ''}`}>
          <span className="font-display italic font-semibold text-title-md leading-none text-primary">{item.value}</span>
          <span className="text-center font-sans text-2xs font-medium text-muted">{item.label}</span>
        </div>
      ))}
    </section>
  )
}
