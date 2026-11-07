import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Reading } from '@/features/readings/api'
import { renderApp } from '@/test/renderApp'
import { groupShelf, needsTranslation, type Shelf } from './api'

const state = vi.hoisted(() => ({
  shelf: undefined as Shelf | undefined,
  book: undefined as Record<string, unknown> | undefined,
  myReading: null as Reading | null,
  inWishlist: false,
  translating: false,
  enriching: false,
  toggle: vi.fn(),
  custom: [] as unknown[],
  toggleShelf: vi.fn(),
  createShelf: vi.fn(),
}))

vi.mock('@/features/shelf/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  useShelf: () => ({ data: state.shelf, isLoading: false, isError: false }),
  useBook: () => ({ data: state.book, isLoading: false, isError: !state.book }),
  useMyReadingOf: () => ({ data: state.myReading, isLoading: false }),
  useIsInWishlist: () => ({ data: state.inWishlist }),
  useWishlistToggle: () => ({ mutate: state.toggle, isPending: false }),
  useSummaryTranslation: () => ({ isFetching: state.translating }),
  useBookEnrichment: () => ({ isFetching: state.enriching }),
  useBookReaders: () => ({
    data: [{ finished_on: '2026-10-01', rank_characters: 4, rank_plot: 4, rank_writing: 4, rank_ending: 4, user: { id: 'irla', name: 'Irla', avatar_url: null } }],
  }),
}))
vi.mock('@/features/shelf/shelvesApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./shelvesApi')>()),
  useCustomShelves: () => ({ data: state.custom }),
  useToggleShelfBook: () => ({ mutate: state.toggleShelf }),
  useDeleteShelf: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateShelf: () => ({ mutateAsync: state.createShelf, isPending: false }),
}))
vi.mock('@/features/people/api', () => ({
  usePerson: () => ({ data: undefined }),
  usePersonReadings: () => ({ data: [] }),
}))
vi.mock('@/features/clubs/api', () => ({
  useMyClubBooks: () => ({ data: [{ id: 'cb5', club_id: 'c1', status: 'finished', edition_number: 5, book: { id: 'book-1', title: 'Três' } }] }),
  useMyClubs: () => ({ data: [{ id: 'c1', name: 'Dois Amores', cover_url: null, memberCount: 4 }] }),
}))
vi.mock('@/features/readings/api', () => ({
  useUpdateProgress: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

const reading = (id: string, title: string, over: Partial<Reading> = {}): Reading => ({
  id,
  started_on: '2026-09-01',
  finished_on: '2026-09-27',
  rank_characters: 5,
  rank_plot: 4,
  rank_writing: 5,
  rank_ending: 4,
  favorite_character: null,
  favorite_quote: null,
  comment: null,
  format: null,
  book: { id: `book-${id}`, title, author: 'Autora', pages: 300, cover_url: null, summary: null },
  ...over,
})

describe('groupShelf', () => {
  it('separa lidos (fim mais recente primeiro) e em andamento (início mais recente primeiro)', () => {
    const shelf = groupShelf([
      reading('a', 'Antigo', { finished_on: '2026-05-01' }),
      reading('b', 'Novo', { finished_on: '2026-10-01' }),
      reading('c', 'Lendo há tempo', { finished_on: null, started_on: '2026-08-01' }),
      reading('d', 'Lendo agora', { finished_on: null, started_on: '2026-10-20' }),
    ])
    expect(shelf.read.map((r) => r.book.title)).toEqual(['Novo', 'Antigo'])
    expect(shelf.reading.map((r) => r.book.title)).toEqual(['Lendo agora', 'Lendo há tempo'])
  })
})

describe('needsTranslation', () => {
  it('só traduz resumos com idioma ainda não verificado', () => {
    const done = '2026-10-28T12:00:00Z'
    expect(needsTranslation({ summary: 'Three friends.', summary_lang: null, enriched_at: done })).toBe(true)
    expect(needsTranslation({ summary: 'Três amigos.', summary_lang: 'pt', enriched_at: done })).toBe(false)
    expect(needsTranslation({ summary: null, summary_lang: null, enriched_at: done })).toBe(false)
    expect(needsTranslation(undefined)).toBe(false)
  })

  it('espera a Google Books antes de usar a IA (ela costuma ter a sinopse da editora)', () => {
    expect(needsTranslation({ summary: 'Three friends.', summary_lang: null, enriched_at: null })).toBe(false)
  })
})

describe('Estantes', () => {
  beforeEach(() => {
    state.shelf = groupShelf(
      [
        reading('1', 'Três', { book: { id: 'book-1', title: 'Três', author: 'Valérie Perrin', pages: 672, cover_url: 'https://covers.openlibrary.org/b/id/1-L.jpg', summary: null } }),
        reading('2', 'Antigo', { finished_on: '2025-07-22', rank_plot: 2, rank_characters: 2, rank_writing: 2, rank_ending: 2 }),
        reading('3', 'A hora da estrela', { finished_on: null, started_on: '2026-10-10' }),
      ],
      [{ created_at: '2026-10-15', book: { id: 'book-9', title: 'Quarta asa', author: null, pages: null, cover_url: null } }],
    )
    state.custom = [
      { id: 's1', user_id: 'user-1', name: 'lista de praia', color: 'rosa', created_at: '2026-10-01', books: [{ added_at: '2026-10-02', book: { id: 'book-7', title: 'Daisy Jones', author: null, cover_url: null, pages: null } }] },
    ]
  })

  it('mostra lidos, lendo, quero ler e as estantes próprias, cada uma numa prateleira', () => {
    renderApp('/estantes')
    expect(screen.getByRole('heading', { level: 1, name: 'minhas estantes' })).toBeInTheDocument()
    expect(screen.getByText('5 livros em 4 estantes ✦')).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Capas da estante lidos' })).getByRole('link', { name: 'Três' })).toHaveAttribute('href', '/livros/book-1')
    expect(screen.getByRole('link', { name: /lista de praia/ })).toHaveAttribute('href', '/estantes/s1')
    expect(screen.getByRole('link', { name: '+ nova estante' })).toHaveAttribute('href', '/estantes/nova')
  })

  it('lidos em lista por mês, com filtros e grade', async () => {
    renderApp('/estantes/lidos')
    expect(screen.getByRole('heading', { level: 1, name: 'lidos' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'setembro de 2026' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'julho de 2025' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '★ 4+' }))
    expect(screen.queryByRole('region', { name: 'julho de 2025' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'grade' }))
    expect(screen.getByRole('list', { name: 'Livros: lidos' })).toBeInTheDocument()
  })

  it('quero ler e estante própria', () => {
    const { unmount } = renderApp('/estantes/quero-ler')
    expect(screen.getByRole('link', { name: /Quarta asa/ })).toHaveAttribute('href', '/livros/book-9')
    unmount()
    renderApp('/estantes/s1')
    expect(screen.getByRole('heading', { level: 1, name: 'lista de praia' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Daisy Jones/ })).toHaveAttribute('href', '/livros/book-7')
    expect(screen.getByRole('button', { name: 'apagar estante' })).toBeInTheDocument()
  })

  it('cria uma estante', async () => {
    state.createShelf.mockResolvedValue('s2')
    const { router } = renderApp('/estantes/nova')
    await userEvent.type(screen.getByLabelText('Nome da estante'), 'pra chorar')
    await userEvent.click(screen.getByRole('radio', { name: 'tinta' }))
    await userEvent.click(screen.getByRole('button', { name: 'criar estante' }))
    expect(state.createShelf).toHaveBeenCalledWith({ name: 'pra chorar', color: 'tinta' })
    expect(router.state.location.pathname).toBe('/estantes/s2')
  })

  it('estante vazia', () => {
    state.shelf = groupShelf([], [])
    state.custom = []
    renderApp('/estantes')
    expect(screen.getByText('sua estante está vazia')).toBeInTheDocument()
  })
})

describe('Página do livro', () => {
  beforeEach(() => {
    state.book = { id: 'book-1', title: 'Três', author: 'Valérie Perrin', pages: 672, cover_url: null, summary: null, openlibrary_work_key: '/works/OL1W' }
    state.myReading = null
    state.inWishlist = false
    state.translating = false
    state.enriching = false
    state.toggle.mockClear()
  })

  it('mostra autor, páginas e "sem resumo disponível"', () => {
    renderApp('/livros/book-1')
    expect(screen.getByRole('heading', { level: 1, name: 'Três' })).toBeInTheDocument()
    expect(screen.getByText('Valérie Perrin')).toBeInTheDocument()
    expect(screen.getByText('672 páginas')).toBeInTheDocument()
    expect(screen.getByText('sem resumo disponível')).toBeInTheDocument()
  })

  it('sem resumo, avisa enquanto procura a sinopse em português', () => {
    state.enriching = true
    renderApp('/livros/book-1')
    expect(screen.getByText('buscando a sinopse em português…')).toBeInTheDocument()
  })

  it('mostra o resumo quando existe', () => {
    state.book = { ...state.book, summary: 'Três amigos de infância.' }
    renderApp('/livros/book-1')
    expect(screen.getByText('Três amigos de infância.')).toBeInTheDocument()
  })

  it('avisa enquanto traduz e marca o resumo traduzido por IA', () => {
    state.translating = true
    state.book = { ...state.book, summary: 'Three friends.', summary_lang: null, summary_source: 'openlibrary' }
    const { unmount } = renderApp('/livros/book-1')
    expect(screen.getByRole('status')).toHaveTextContent('traduzindo para o português…')
    expect(screen.queryByText('resumo traduzido por IA')).not.toBeInTheDocument()
    unmount()

    state.translating = false
    state.book = { ...state.book, summary: 'Três amigos.', summary_lang: 'pt', summary_source: 'ai_translation' }
    renderApp('/livros/book-1')
    expect(screen.getByText('Três amigos.')).toBeInTheDocument()
    expect(screen.getByText('resumo traduzido por IA')).toBeInTheDocument()
  })

  it('resumo longo começa recolhido', async () => {
    state.book = { ...state.book, summary: 'a'.repeat(500) }
    renderApp('/livros/book-1')
    expect(screen.getByText(/^a+…$/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'ler resumo completo' }))
    expect(screen.getByText('a'.repeat(500))).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'mostrar menos' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('livro lido: sua nota, sua ficha e o botão para editar', () => {
    state.myReading = reading('r1', 'Três', {
      started_on: '2026-10-01',
      finished_on: '2026-10-12',
      favorite_character: 'Nina',
      comment: 'Me acompanhou por dias.',
    })
    renderApp('/livros/book-1')
    const card = screen.getByRole('region', { name: 'sua ficha' })
    expect(within(card).getByText('01/10')).toBeInTheDocument()
    expect(within(card).getByText('12/10')).toBeInTheDocument()
    expect(within(card).getByText('Nina')).toBeInTheDocument()
    expect(within(card).getByText('nenhuma ainda')).toBeInTheDocument()
    expect(within(card).getByText('Me acompanhou por dias.')).toBeInTheDocument()
    expect(within(card).getByRole('img', { name: '4,5 de 5 estrelas' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /já li · editar/ })).toHaveAttribute('href', '/leituras/r1/editar')
  })

  it('livro ainda não lido: começar a ler ou guardar em "quero ler"', async () => {
    renderApp('/livros/book-1')
    expect(screen.getByRole('link', { name: /começar a ler/ })).toHaveAttribute('href', '/publicar?livro=book-1')
    await userEvent.click(screen.getByRole('button', { name: /quero ler/ }))
    expect(state.toggle).toHaveBeenCalledWith({ bookId: 'book-1', add: true })
  })

  it('quem leu entre as amigas e o livro no clube', () => {
    renderApp('/livros/book-1')
    expect(screen.getByText('irla · média 4,0★')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Dois Amores/ })).toHaveAttribute('href', '/clubes/c1/livros/cb5')
  })

  it('+ estante marca o livro nas estantes próprias', async () => {
    state.custom = [{ id: 's1', user_id: 'user-1', name: 'lista de praia', color: 'rosa', created_at: '2026-10-01', books: [] }]
    renderApp('/livros/book-1')
    await userEvent.click(screen.getByRole('button', { name: '+ estante' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'lista de praia' }))
    expect(state.toggleShelf).toHaveBeenCalledWith({ shelfId: 's1', bookId: 'book-1', add: true })
  })
})
