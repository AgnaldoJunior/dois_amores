import { formatDateShort, parseIsoDate, todayIso } from '@/lib/dates'
import { cleanDescription, coverUrl, normalizeSearchDoc, resizeCoverUrl, searchBooks } from './client'

describe('Open Library', () => {
  it('normaliza um resultado da busca', () => {
    expect(
      normalizeSearchDoc({
        key: '/works/OL21464434W',
        title: 'A Cabeça do Santo',
        author_name: ['Socorro Acioli', 'Outro'],
        cover_i: 10373791,
        number_of_pages_median: 192,
        first_publish_year: 2014,
      }),
    ).toEqual({
      workKey: '/works/OL21464434W',
      title: 'A Cabeça do Santo',
      author: 'Socorro Acioli',
      coverId: 10373791,
      pages: 192,
      year: 2014,
    })
  })

  it('descarta resultados que não são obras', () => {
    expect(normalizeSearchDoc({ key: '/books/OL1M', title: 'Edição' })).toBeNull()
    expect(normalizeSearchDoc({ key: '/works/OL1W' })).toBeNull()
  })

  it('aceita resumo em texto ou objeto e remove notas de fonte', () => {
    expect(cleanDescription('Um livro.\n----------\nSee also [x][1]')).toBe('Um livro.')
    expect(cleanDescription({ type: '/type/text', value: 'Outro [livro][1] bom.\n\n[1]: https://x' })).toBe(
      'Outro livro bom.',
    )
    expect(cleanDescription(undefined)).toBeNull()
    expect(cleanDescription('   ')).toBeNull()
  })

  it('monta e redimensiona URLs de capa', () => {
    expect(coverUrl(123)).toBe('https://covers.openlibrary.org/b/id/123-L.jpg')
    expect(resizeCoverUrl('https://covers.openlibrary.org/b/id/123-L.jpg', 'S')).toBe(
      'https://covers.openlibrary.org/b/id/123-S.jpg',
    )
  })

  it('busca com no máximo 5 resultados', async () => {
    const docs = Array.from({ length: 8 }, (_, i) => ({ key: `/works/OL${i + 1}W`, title: `Livro ${i + 1}` }))
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ docs })))
    vi.stubGlobal('fetch', fetchMock)
    const results = await searchBooks(' torto arado ')
    expect(results).toHaveLength(5)
    const url = new URL(fetchMock.mock.calls[0]![0] as string)
    expect(url.searchParams.get('q')).toBe('torto arado')
    expect(url.searchParams.get('limit')).toBe('5')
    vi.unstubAllGlobals()
  })
})

describe('datas', () => {
  it('formata no estilo dos cartões, sem erro de fuso', () => {
    expect(formatDateShort('2026-10-12')).toBe('12 OUT 2026')
    expect(formatDateShort('2026-01-01')).toBe('01 JAN 2026')
    expect(formatDateShort(null)).toBe('')
    expect(parseIsoDate('x')).toBeNull()
  })

  it('gera a data de hoje no formato do campo de data', () => {
    expect(todayIso(new Date(2026, 9, 5, 23, 59))).toBe('2026-10-05')
  })
})
