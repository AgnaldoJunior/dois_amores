import { parseQuotes, parseSuggestions, suggestNextReadsRequest, suggestQuotesRequest } from './ai/prompts.ts'
import { pickVerified, verifyBook } from './openLibrary.ts'
import { averageOf, verifySuggestions } from './suggestions.ts'

describe('citações sugeridas', () => {
  it('o pedido leva título, autor e sinopse, e proíbe inventar', () => {
    const req = suggestQuotesRequest({ title: 'Três', author: 'Valérie Perrin', summary: 'Três amigos.' })
    expect(req.prompt).toContain('Três — Valérie Perrin')
    expect(req.prompt).toContain('<sinopse>\nTrês amigos.\n</sinopse>')
    expect(req.system).toMatch(/Nunca invente/)
  })

  it('limpa aspas, descarta vazias e repetidas e limita a 3', () => {
    expect(
      parseQuotes({
        quotes: [
          { text: '“A vida é feita de encontros.”', context: 'Nina, capítulo 1' },
          { text: 'A vida é feita de encontros.' },
          { text: 'curta' },
          { text: 'Outra frase marcante do livro.', context: '' },
          { text: 'Mais uma frase marcante aqui.' },
          { text: 'E a quarta, que deve sobrar.' },
        ],
      }),
    ).toEqual([
      { text: 'A vida é feita de encontros.', context: 'Nina, capítulo 1' },
      { text: 'Outra frase marcante do livro.', context: null },
      { text: 'Mais uma frase marcante aqui.', context: null },
    ])
    expect(parseQuotes({ quotes: [] })).toEqual([])
    expect(() => parseQuotes({})).toThrow()
  })
})

describe('próxima leitura', () => {
  it('o pedido leva títulos, autores e notas, e o que evitar', () => {
    const req = suggestNextReadsRequest(
      [
        { title: 'Três', author: 'Valérie Perrin', average: 4.5, finished: true },
        { title: 'A hora da estrela', author: 'Clarice Lispector', average: null, finished: false },
      ],
      ['Quarta asa'],
    )
    expect(req.prompt).toContain('- Três (Valérie Perrin): nota 4.5/5')
    expect(req.prompt).toContain('- A hora da estrela (Clarice Lispector): lendo agora')
    expect(req.prompt).toContain('Não sugira estes (já lidos ou na lista): Quarta asa')
  })

  it('valida as sugestões', () => {
    expect(
      parseSuggestions({
        suggestions: [
          { title: ' Torto arado ', author: 'Itamar Vieira Junior', reason: 'Porque você gostou de Tudo é rio' },
          { title: '', author: 'Sem título', reason: 'x' },
        ],
      }),
    ).toEqual([{ title: 'Torto arado', author: 'Itamar Vieira Junior', reason: 'Porque você gostou de Tudo é rio' }])
  })

  it('média das notas preenchidas', () => {
    expect(averageOf([5, 4, null, 3])).toBe(4)
    expect(averageOf([null, undefined])).toBeNull()
  })
})

describe('confirmação na Open Library', () => {
  const doc = {
    key: '/works/OL24141556W',
    title: 'Torto Arado',
    author_name: ['Itamar Vieira Junior'],
    cover_i: 12369648,
    editions: { docs: [{ title: 'Torto arado', cover_i: 99, language: ['por'] }] },
  }

  it('aceita quando título e autor batem (preferindo a edição em português)', () => {
    expect(pickVerified([doc], 'Torto arado', 'Itamar Vieira Junior')).toEqual({
      workKey: '/works/OL24141556W',
      title: 'Torto arado',
      author: 'Itamar Vieira Junior',
      coverUrl: 'https://covers.openlibrary.org/b/id/99-L.jpg',
      pages: null,
    })
  })

  it('recusa título inventado ou de outro autor', () => {
    expect(pickVerified([doc], 'O arado das estrelas', 'Itamar Vieira Junior')).toBeNull()
    expect(pickVerified([doc], 'Torto arado', 'Outra Pessoa')).toBeNull()
  })

  it('falha de rede vira "não confirmado"', async () => {
    await expect(verifyBook('X', null, vi.fn().mockRejectedValue(new Error('offline')))).resolves.toBeNull()
  })

  it('mantém só confirmadas, sem repetir nem trazer o que já foi lido, no máximo 3', async () => {
    const books: Record<string, string | null> = {
      Inventado: null,
      'Já lido': '/works/OL1W',
      Bom1: '/works/OL2W',
      'Bom1 de novo': '/works/OL2W',
      Bom2: '/works/OL3W',
      Bom3: '/works/OL4W',
      Bom4: '/works/OL5W',
    }
    const verify = vi.fn(async (title: string) =>
      books[title] ? { workKey: books[title]!, title, author: 'A', coverUrl: null, pages: null } : null,
    )
    const raw = Object.keys(books).map((title) => ({ title, author: 'A', reason: `por ${title}` }))
    const result = await verifySuggestions(raw, ['/works/OL1W'], verify)
    expect(result.map((s) => s.title)).toEqual(['Bom1', 'Bom2', 'Bom3'])
    expect(result[0]!.reason).toBe('por Bom1')
  })
})
