import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { Stars } from '@/components/ui/Stars'
import { Label, PageTitle, SectionTitle } from '@/components/ui/Typography'
import { formatDateShort } from '@/lib/dates'
import { memberAverage } from '@/lib/domain/ratings'
import { useShelf } from './api'
import { ShelfGrid, ShelfTile } from './ShelfTile'

export const bookPath = (bookId: string) => `/livros/${bookId}`

export function ShelfPage() {
  const { data, isLoading, isError } = useShelf()

  return (
    <div className="flex flex-col gap-4">
      <PageTitle>Meus livros</PageTitle>

      {isLoading && <p className="font-hand text-lg text-primary">Arrumando a estante…</p>}
      {isError && <FormMessage tone="error">Não foi possível carregar seus livros.</FormMessage>}

      {data && (
        <>
          <section className="flex flex-col gap-4" aria-labelledby="shelf-read">
            <SectionTitle>
              <span id="shelf-read">Lidos</span>
            </SectionTitle>
            {data.read.length === 0 ? (
              <EmptyState>Nenhum livro terminado ainda.</EmptyState>
            ) : (
              <ShelfGrid label="Livros lidos">
                {data.read.map((r) => (
                  <li key={r.id}>
                    <ShelfTile
                      to={bookPath(r.book.id)}
                      title={r.book.title}
                      coverUrl={r.book.cover_url}
                      footer={<Stars value={memberAverage(r)} size="sm" />}
                    />
                  </li>
                ))}
              </ShelfGrid>
            )}
          </section>

          <section className="flex flex-col gap-4" aria-labelledby="shelf-reading">
            <SectionTitle>
              <span id="shelf-reading">Em andamento</span>
            </SectionTitle>
            {data.reading.length === 0 ? (
              <EmptyState>Nenhuma leitura em andamento.</EmptyState>
            ) : (
              <ShelfGrid label="Leituras em andamento">
                {data.reading.map((r) => (
                  <li key={r.id}>
                    <ShelfTile
                      to={bookPath(r.book.id)}
                      title={r.book.title}
                      coverUrl={r.book.cover_url}
                      footer={<Label className="text-2xs">desde {formatDateShort(r.started_on)}</Label>}
                    />
                  </li>
                ))}
              </ShelfGrid>
            )}
          </section>

          {data.wishlist.length > 0 && (
            <section className="flex flex-col gap-4" aria-labelledby="shelf-wishlist">
              <SectionTitle>
                <span id="shelf-wishlist">Quero ler</span>
              </SectionTitle>
              <ShelfGrid label="Quero ler">
                {data.wishlist.map((w) => (
                  <li key={w.book.id}>
                    <ShelfTile to={bookPath(w.book.id)} title={w.book.title} coverUrl={w.book.cover_url} />
                  </li>
                ))}
              </ShelfGrid>
            </section>
          )}

          <ButtonLink to="/publicar" className="text-base">
            PUBLICAR NOVA LEITURA
          </ButtonLink>
          <ButtonLink to="/meus-livros/sugestoes" variant="outline" className="text-base">
            SUGESTÃO DE PRÓXIMA LEITURA
          </ButtonLink>
        </>
      )}
    </div>
  )
}
