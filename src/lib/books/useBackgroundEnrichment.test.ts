import { BACKGROUND_BATCH, pendingEnrichment } from './useBackgroundEnrichment'

describe('enriquecimento em segundo plano', () => {
  it('só livros que nunca passaram pela Google Books, sem repetir, em lotes', () => {
    const books = [
      { id: 'a', enriched_at: null },
      { id: 'b', enriched_at: '2026-10-28T10:00:00Z' },
      { id: 'a', enriched_at: null },
      { id: 'c' }, // campo não carregado: não decide
      ...Array.from({ length: 10 }, (_, i) => ({ id: `x${i}`, enriched_at: null })),
    ]
    const ids = pendingEnrichment(books)
    expect(ids[0]).toBe('a')
    expect(ids).not.toContain('b')
    expect(ids).not.toContain('c')
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toHaveLength(BACKGROUND_BATCH)
  })
})
