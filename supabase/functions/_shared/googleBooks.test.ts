import { coverSources, plannedChanges } from './enrichment.ts'
import {
  authorMatches,
  buildSearchUrl,
  cleanGoogleDescription,
  coverUrls,
  editionCountry,
  pickBestVolume,
  searchPortugueseEdition,
  titleScore,
  type GoogleVolume,
} from './googleBooks.ts'

const volume = (id: string, info: GoogleVolume['volumeInfo']): GoogleVolume => ({ id, volumeInfo: info })
const thumb = 'http://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'

describe('Google Books', () => {
  it('busca livre por título e autor, só em português, com a chave', () => {
    const url = new URL(buildSearchUrl({ title: 'Torto arado', author: 'Itamar Vieira Junior' }, 'chave'))
    expect(url.searchParams.get('q')).toBe('Torto arado Itamar Vieira Junior')
    expect(url.searchParams.get('langRestrict')).toBe('pt')
    expect(url.searchParams.get('key')).toBe('chave')
  })

  it('tenta a busca livre e depois a filtrada por título e autor', async () => {
    const reply = { items: [volume('ok', { title: 'O massacre da família Hope', authors: ['Riley Sager'], language: 'pt', description: 'Sinopse longa o bastante para valer.', imageLinks: { thumbnail: thumb } })] }
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ totalItems: 0 })))
      .mockResolvedValueOnce(new Response(JSON.stringify(reply)))
    const result = await searchPortugueseEdition({ title: 'O massacre da família Hope', author: 'Riley Sager' }, 'k', { fetchFn })
    expect(result?.volumeId).toBe('ok')
    const queries = fetchFn.mock.calls.map((c) => new URL(String(c[0])).searchParams.get('q'))
    expect(queries).toEqual(['O massacre da família Hope Riley Sager', 'intitle:O massacre da família Hope inauthor:Sager'])
  })

  it('compara títulos ignorando acentos, caixa e pontuação', () => {
    expect(titleScore('Água Fresca para as Flores', 'agua fresca para as flores')).toBe(3)
    expect(titleScore('Torto Arado (Prémio LeYa 2018)', 'Torto arado')).toBe(2)
    expect(titleScore('O Hobbit', 'Torto arado')).toBe(0)
  })

  it('confere o autor pelo sobrenome', () => {
    expect(authorMatches(['Itamar Vieira Junior'], 'Itamar Vieira Junior')).toBe(true)
    expect(authorMatches(['Valérie Perrin'], 'Valerie Perrin')).toBe(true)
    expect(authorMatches(['Outra Pessoa'], 'Valérie Perrin')).toBe(false)
    expect(authorMatches(undefined, null)).toBe(true)
  })

  it('escolhe a edição em português mais completa e com o título mais parecido', () => {
    const book = { title: 'Torto arado', author: 'Itamar Vieira Junior' }
    const best = pickBestVolume(
      [
        volume('en', { title: 'Crooked Plow', authors: ['Itamar Vieira Junior'], language: 'en', description: 'x', imageLinks: { thumbnail: thumb } }),
        volume('pt-pt', { title: 'Torto Arado (Prémio LeYa 2018)', authors: ['Itamar Vieira Junior'], language: 'pt', description: 'Sinopse', imageLinks: { thumbnail: thumb } }),
        volume('br', { title: 'Torto Arado', authors: ['Itamar Vieira Junior'], language: 'pt-BR', description: 'Sinopse', imageLinks: { thumbnail: thumb } }),
        volume('sem-capa', { title: 'Torto Arado', authors: ['Itamar Vieira Junior'], language: 'pt' }),
      ],
      book,
    )
    expect(best?.id).toBe('br')
  })

  it('identifica o país da edição pelo ISBN', () => {
    const isbn = (id: string) => volume('v', { industryIdentifiers: [{ type: 'ISBN_13', identifier: id }] })
    expect(editionCountry(isbn('9786555953282'))).toBe('BR')
    expect(editionCountry(isbn('978-85-359-0277-0'))).toBe('BR')
    expect(editionCountry(isbn('9789896605858'))).toBe('PT')
    expect(editionCountry(isbn('9780141439518'))).toBeNull()
  })

  it('caso real "Torto arado": ignora a adaptação em quadrinhos e aceita a edição portuguesa', () => {
    const author = ['Itamar Vieira Junior']
    const best = pickBestVolume(
      [
        volume('leya', { title: 'Torto Arado (Prémio LeYa 2018)', authors: author, language: 'pt-BR', description: 'd', imageLinks: { thumbnail: thumb }, pageCount: 237, industryIdentifiers: [{ type: 'ISBN_13', identifier: '9789896605858' }] }),
        volume('hq', { title: 'Torto arado: Romance gráfico em quadrinhos', authors: author, language: 'pt-BR', description: 'd', imageLinks: { thumbnail: thumb }, industryIdentifiers: [{ type: 'ISBN_13', identifier: '9786562640014' }] }),
      ],
      { title: 'Torto arado', author: 'Itamar Vieira Junior' },
    )
    expect(best?.id).toBe('leya')
  })

  it('entre edições equivalentes, prefere a brasileira', () => {
    const base = { title: 'Três', authors: ['Valérie Perrin'], language: 'pt', description: 'd', imageLinks: { thumbnail: thumb }, pageCount: 600 }
    const best = pickBestVolume(
      [
        volume('pt', { ...base, industryIdentifiers: [{ type: 'ISBN_13', identifier: '9789722071000' }] }),
        volume('br', { ...base, industryIdentifiers: [{ type: 'ISBN_13', identifier: '9786555600001' }] }),
      ],
      { title: 'Três', author: 'Valérie Perrin' },
    )
    expect(best?.id).toBe('br')
  })

  it('não aceita livro de outro autor nem título diferente', () => {
    expect(
      pickBestVolume([volume('x', { title: 'Três', authors: ['Outra Autora'], language: 'pt', description: 'd' })], {
        title: 'Três',
        author: 'Valérie Perrin',
      }),
    ).toBeNull()
  })

  it('limpa o HTML da sinopse', () => {
    expect(
      cleanGoogleDescription('<p><b>Best-seller</b> da autora de &quot;Água fresca&quot;.</p><p>Três amigos&nbsp;inseparáveis &amp; um segredo.<br>Fim.</p>'),
    ).toBe('Best-seller da autora de "Água fresca".\n\nTrês amigos inseparáveis & um segredo.\nFim.')
    expect(cleanGoogleDescription('curta')).toBeNull()
    expect(cleanGoogleDescription(undefined)).toBeNull()
  })

  it('gera URLs de capa em https, sem a dobra, da maior para a menor', () => {
    const urls = coverUrls(volume('v', { imageLinks: { thumbnail: thumb } }))
    expect(urls).toHaveLength(3)
    expect(urls[0]).toMatch(/^https:/)
    expect(urls[0]).toContain('zoom=3')
    expect(urls[2]).toContain('zoom=1')
    expect(urls[0]).not.toContain('edge=curl')
  })

  it('tenta de novo quando a API responde 503', async () => {
    const reply = { items: [volume('ok', { title: 'Três', authors: ['Valérie Perrin'], language: 'pt', description: 'Novo romance da autora de Água fresca para as flores.', imageLinks: { thumbnail: thumb }, pageCount: 608 })] }
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(reply)))
    const sleep = vi.fn().mockResolvedValue(undefined)
    const result = await searchPortugueseEdition({ title: 'Três', author: 'Valérie Perrin' }, 'k', { fetchFn, sleep })
    expect(result).toMatchObject({ volumeId: 'ok', pages: 608, summary: 'Novo romance da autora de Água fresca para as flores.' })
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('livro que não existe na Google devolve null; indisponível de vez lança erro', async () => {
    const empty = vi.fn(async () => new Response(JSON.stringify({ totalItems: 0 })))
    await expect(searchPortugueseEdition({ title: 'X', author: null }, 'k', { fetchFn: empty })).resolves.toBeNull()
    const down = vi.fn(async () => new Response('', { status: 503 }))
    await expect(
      searchPortugueseEdition({ title: 'X', author: null }, 'k', { fetchFn: down, sleep: async () => {} }),
    ).rejects.toThrow(/indisponível/)
  })
})

describe('o que muda no livro', () => {
  const book = {
    id: 'b1',
    title: 'Três',
    author: 'Valérie Perrin',
    pages: null,
    cover_url: 'https://covers.openlibrary.org/b/id/1-L.jpg',
    summary: 'Three friends.',
    summary_source: 'openlibrary',
    summary_lang: null,
    enriched_at: null,
  }
  const found = { volumeId: 'g1', summary: 'Três amigos inseparáveis.', pages: 608, coverUrls: ['https://g/zoom=3'], fromPortugal: false }

  it('com edição em português: sinopse da editora, páginas e original guardado', () => {
    expect(plannedChanges(book, found)).toEqual({
      summary: 'Três amigos inseparáveis.',
      summary_source: 'google_books',
      summary_lang: 'pt',
      summary_original: 'Three friends.',
      pages: 608,
      google_volume_id: 'g1',
    })
  })

  it('não troca o número de páginas já salvo nem sobrescreve o original de uma tradução por IA', () => {
    const changes = plannedChanges({ ...book, pages: 500, summary_source: 'ai_translation' }, found)
    expect(changes).not.toHaveProperty('pages')
    expect(changes).not.toHaveProperty('summary_original')
  })

  it('sem edição em português não muda nada (a IA traduz depois)', () => {
    expect(plannedChanges(book, null)).toEqual({})
  })

  it('capa: primeiro a da Google, depois a da Open Library', () => {
    expect(coverSources(book, found)).toEqual(['https://g/zoom=3', 'https://covers.openlibrary.org/b/id/1-L.jpg'])
    expect(coverSources({ ...book, cover_url: 'https://x.supabase.co/storage/v1/object/public/covers/b1.jpg' }, null)).toEqual([])
  })

  it('edição de Portugal: a capa da Open Library (brasileira) vem primeiro', () => {
    expect(coverSources(book, { ...found, fromPortugal: true })).toEqual([
      'https://covers.openlibrary.org/b/id/1-L.jpg',
      'https://g/zoom=3',
    ])
  })
})
