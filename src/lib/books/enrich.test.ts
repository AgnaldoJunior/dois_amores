import { enrichBook, enrichBookWithin } from './enrich'

const invoke = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { functions: { invoke } } }))

beforeEach(() => {
  invoke.mockReset()
})

describe('enriquecimento do livro', () => {
  it('chama a função "books" com a ação enrich', async () => {
    invoke.mockResolvedValue({ data: { id: 'b1', summary_source: 'google_books' }, error: null })
    await expect(enrichBook('b1')).resolves.toMatchObject({ summary_source: 'google_books' })
    expect(invoke).toHaveBeenCalledWith('books', { body: { action: 'enrich', bookId: 'b1' } })
  })

  it('se a Google demorar, segue sem esperar (o livro é completado depois)', async () => {
    invoke.mockReturnValue(new Promise(() => {}))
    const started = Date.now()
    await expect(enrichBookWithin('b1', 50)).resolves.toBeNull()
    expect(Date.now() - started).toBeLessThan(1000)
  })

  it('erro na função não impede salvar o livro', async () => {
    invoke.mockResolvedValue({ data: null, error: new Error('503') })
    await expect(enrichBookWithin('b1', 8000)).resolves.toBeNull()
  })
})
