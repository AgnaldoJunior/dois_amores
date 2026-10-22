import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { toReadingValues, validateReading, type ReadingForm } from './validation'

const mocks = vi.hoisted(() => ({
  searchBooks: vi.fn(),
  ensureBook: vi.fn(),
  findMyReadingId: vi.fn(),
  save: vi.fn(),
}))

vi.mock('@/lib/openlibrary/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/openlibrary/client')>()),
  searchBooks: mocks.searchBooks,
}))

vi.mock('@/features/readings/api', () => ({
  ensureBook: mocks.ensureBook,
  findMyReadingId: mocks.findMyReadingId,
  useSaveReading: () => ({ mutateAsync: mocks.save, isPending: false }),
  useDeleteReading: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReading: () => ({ data: undefined, isLoading: true }),
  useMyStats: () => ({ data: { booksRead: 0, pagesRead: 0, clubs: 0 } }),
  useRecentReadings: () => ({ data: [], isLoading: false }),
}))

vi.mock('@/features/profile/api', () => ({
  useProfile: () => ({ data: { id: 'user-1', name: 'Leyna', avatar_url: null, bio: null } }),
}))

const form = (over: Partial<ReadingForm> = {}): ReadingForm => ({
  started_on: '2026-10-01',
  finished_on: '',
  rank_characters: null,
  rank_plot: null,
  rank_writing: null,
  rank_ending: null,
  favorite_character: '',
  favorite_quote: '',
  comment: '',
  ...over,
})

describe('validação da leitura', () => {
  const today = '2026-10-21'

  it('exige livro e início', () => {
    expect(validateReading(form({ started_on: '' }), false, today)).toEqual({
      book: 'Escolha um livro na busca.',
      started_on: 'Informe quando você começou a ler.',
    })
  })

  it('o fim é opcional, mas não pode ser antes do início nem no futuro', () => {
    expect(validateReading(form(), true, today)).toEqual({})
    expect(validateReading(form({ finished_on: '2026-09-30' }), true, today).finished_on).toMatch(/depois do início/)
    expect(validateReading(form({ finished_on: '2026-10-22' }), true, today).finished_on).toMatch(/futuro/)
    expect(validateReading(form({ finished_on: '2026-10-01' }), true, today)).toEqual({})
  })

  it('campos de texto vazios viram null', () => {
    expect(toReadingValues(form({ comment: '   ', favorite_quote: ' "Uma frase." ' }))).toMatchObject({
      finished_on: null,
      comment: null,
      favorite_quote: '"Uma frase."',
    })
  })
})

describe('Publicar leitura', () => {
  const result = { workKey: '/works/OL1W', title: 'Torto Arado', author: 'Itamar Vieira Junior', coverId: null, pages: 280, year: 2019 }
  const savedBook = { id: 'book-1', title: 'Torto Arado', author: 'Itamar Vieira Junior', pages: 280, cover_url: null, summary: null }

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.searchBooks.mockResolvedValue([result])
    mocks.ensureBook.mockResolvedValue(savedBook)
    mocks.findMyReadingId.mockResolvedValue(null)
    mocks.save.mockResolvedValue('reading-1')
  })

  async function chooseBook() {
    await userEvent.type(screen.getByRole('combobox', { name: 'Buscar livro' }), 'torto')
    await userEvent.click(await screen.findByRole('option', { name: /Torto Arado/ }))
    await screen.findByText('280 páginas')
  }

  it('não salva sem livro', async () => {
    renderApp('/publicar')
    await userEvent.click(screen.getByRole('button', { name: 'SALVAR' }))
    expect(screen.getByText('Escolha um livro na busca.')).toBeInTheDocument()
    expect(mocks.save).not.toHaveBeenCalled()
  })

  it('escolhe o livro, salva no catálogo e publica a leitura concluída', async () => {
    const { router } = renderApp('/publicar')
    await chooseBook()
    expect(mocks.ensureBook).toHaveBeenCalledWith(result)

    const start = screen.getByLabelText('Início da leitura *')
    await userEvent.clear(start)
    await userEvent.type(start, '2026-10-01')
    await userEvent.type(screen.getByLabelText('Fim da leitura'), '2026-10-12')
    await userEvent.click(screen.getByRole('group', { name: 'Personagens' }).querySelectorAll('input')[4]!)
    await userEvent.click(screen.getByRole('group', { name: 'Final' }).querySelectorAll('input')[3]!)
    await userEvent.type(screen.getByLabelText('Comentário'), 'Necessário.')
    await userEvent.click(screen.getByRole('button', { name: 'SALVAR' }))

    await waitFor(() => expect(mocks.save).toHaveBeenCalled())
    expect(mocks.save.mock.calls[0]![0]).toEqual({
      id: undefined,
      bookId: 'book-1',
      values: expect.objectContaining({
        started_on: '2026-10-01',
        finished_on: '2026-10-12',
        rank_characters: 5,
        rank_plot: null,
        rank_ending: 4,
        comment: 'Necessário.',
      }),
    })
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(await screen.findByText('Leitura publicada no feed!')).toBeInTheDocument()
  })

  it('mostra erro de data sem chamar o banco', async () => {
    renderApp('/publicar')
    await chooseBook()
    const start = screen.getByLabelText('Início da leitura *')
    await userEvent.clear(start)
    await userEvent.type(start, '2026-10-10')
    await userEvent.type(screen.getByLabelText('Fim da leitura'), '2026-10-01')
    await userEvent.click(screen.getByRole('button', { name: 'SALVAR' }))
    expect(screen.getByLabelText('Fim da leitura')).toHaveAccessibleDescription('O fim precisa ser depois do início.')
    expect(mocks.save).not.toHaveBeenCalled()
  })

  it('se o livro já foi registrado, abre a leitura existente para edição', async () => {
    mocks.findMyReadingId.mockResolvedValue('reading-9')
    const { router } = renderApp('/publicar')
    await userEvent.type(screen.getByRole('combobox', { name: 'Buscar livro' }), 'torto')
    await userEvent.click(await screen.findByRole('option', { name: /Torto Arado/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/leituras/reading-9/editar'))
  })
})
