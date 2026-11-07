/** Carregando: um livrinho que abre e fecha, com uma legenda em DM Serif. */
export function BookLoading({ label = 'abrindo o livro…', fullScreen = false }: { label?: string; fullScreen?: boolean }) {
  return (
    <div role="status" className={`flex flex-col items-center justify-center gap-4 ${fullScreen ? 'min-h-dvh bg-page' : 'py-10'}`}>
      <span aria-hidden="true" className="relative block h-16 w-12 rounded-xs bg-tag shadow-cover">
        <span className="book-loading absolute inset-0 rounded-xs bg-primary" />
      </span>
      <span className="font-serif italic text-lg text-muted">{label}</span>
    </div>
  )
}
