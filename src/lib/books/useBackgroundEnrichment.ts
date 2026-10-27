import { useQuery, useQueryClient } from '@tanstack/react-query'
import { enrichBook } from './enrich'

/** Quantos livros completar por vez (um de cada vez, para não sobrecarregar a Google Books). */
export const BACKGROUND_BATCH = 6

type MaybeEnriched = { id: string; enriched_at?: string | null }

/** Livros que ainda não passaram pela Google Books (null = nunca tentou; undefined = campo não carregado). */
export const pendingEnrichment = (books: MaybeEnriched[]) =>
  [...new Set(books.filter((b) => b.enriched_at === null).map((b) => b.id))].slice(0, BACKGROUND_BATCH)

/**
 * Completa em segundo plano (capa e sinopse em português) os livros exibidos que
 * ainda não foram enriquecidos — por exemplo, os do seed ou de antes da Google Books.
 * Também garante a capa no nosso Storage, necessária para o PDF da revista.
 */
export function useBackgroundEnrichment(books: MaybeEnriched[] | undefined) {
  const queryClient = useQueryClient()
  const ids = pendingEnrichment(books ?? [])
  useQuery({
    queryKey: ['books', 'background-enrichment', ids.join(',')],
    enabled: ids.length > 0,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      let changed = 0
      for (const id of ids) {
        const result = await enrichBook(id).catch(() => null)
        if (result) changed++
      }
      if (changed > 0) {
        queryClient.invalidateQueries({ queryKey: ['clubs'] })
        queryClient.invalidateQueries({ queryKey: ['readings'] })
        queryClient.invalidateQueries({ queryKey: ['feed'] })
      }
      return changed
    },
  })
}
