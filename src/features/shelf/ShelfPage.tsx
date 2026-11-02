import { ButtonLink } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { Stars } from '@/components/ui/Stars'
import { Label, PageTitle, SectionTitle } from '@/components/ui/Typography'
import { useBackgroundEnrichment } from '@/lib/books/useBackgroundEnrichment'
import { formatDayMonth } from '@/lib/dates'
import { memberAverage } from '@/lib/domain/ratings'
import { useShelf } from './api'
import { ShelfAddSlot, ShelfGrid, ShelfTag, ShelfTile } from './ShelfTile'

export const bookPath = (bookId: string) => `/livros/${bookId}`

export function ShelfPage() {
  const { data, isLoading, isError } = useShelf()
  useBackgroundEnrichment(data && [...data.read, ...data.reading, ...data.wishlist].map((r) => r.book))

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between">
        <PageTitle>Meus livros</PageTitle>
        <Label className="tilt-l2 mb-2 text-2xs">book track {new Date().getFullYear()}</Label>
      </header>

      {isLoading && <p className="font-hand text-lg text-primary">Arrumando a estante…</p>}
      {isError && <FormMessage tone="error">Não foi possível carregar seus livros.</FormMessage>}

      {data && (
        <>
          <section className="flex flex-col gap-4" aria-labelledby="shelf-read">
            <SectionTitle aside={data.read.length || undefined}>
              <span id="shelf-read">Lidos</span>
            </SectionTitle>
            {data.read.length === 0 ? (
              <EmptyState>Nenhum livro terminado ainda.</EmptyState>
            ) : (
              <ShelfGrid label="Livros lidos" count={data.read.length + 1}>
                {data.read.map((r) => (
                  <ShelfTile
                    key={r.id}
                    to={bookPath(r.book.id)}
                    title={r.book.title}
                    coverUrl={r.book.cover_url}
                    footer={<Stars value={memberAverage(r)} size="sm" className="gap-px" />}
                  />
                ))}
                <ShelfAddSlot to="/publicar" label="Publicar nova leitura" />
              </ShelfGrid>
            )}
          </section>

          <section className="flex flex-col gap-4" aria-labelledby="shelf-reading">
            <SectionTitle aside={data.reading.length || undefined}>
              <span id="shelf-reading">Em andamento</span>
            </SectionTitle>
            {data.reading.length === 0 ? (
              <EmptyState>Nenhuma leitura em andamento.</EmptyState>
            ) : (
              <ShelfGrid label="Leituras em andamento" count={data.reading.length}>
                {data.reading.map((r) => (
                  <ShelfTile
                    key={r.id}
                    to={bookPath(r.book.id)}
                    title={r.book.title}
                    coverUrl={r.book.cover_url}
                    footer={<ShelfTag>desde {formatDayMonth(r.started_on)}</ShelfTag>}
                  />
                ))}
              </ShelfGrid>
            )}
          </section>

          {data.wishlist.length > 0 && (
            <section className="flex flex-col gap-4" aria-labelledby="shelf-wishlist">
              <SectionTitle>
                <span id="shelf-wishlist">Quero ler</span>
              </SectionTitle>
              <ShelfGrid label="Quero ler" count={data.wishlist.length}>
                {data.wishlist.map((w) => (
                  <ShelfTile key={w.book.id} to={bookPath(w.book.id)} title={w.book.title} coverUrl={w.book.cover_url} />
                ))}
              </ShelfGrid>
            </section>
          )}

          <ButtonLink to="/meus-livros/sugestoes" variant="secondary">
            <Icon name="sparkle" className="size-icon-sm" />
            Sugestão de próxima leitura
          </ButtonLink>
        </>
      )}
    </div>
  )
}
