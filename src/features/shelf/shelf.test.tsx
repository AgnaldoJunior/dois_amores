import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Reading } from '@/features/readings/api'
import { renderApp } from '@/test/renderApp'
import { groupShelf, type Shelf } from './api'

const state = vi.hoisted(() => ({
  shelf: undefined as Shelf | undefined,
  book: undefined as Record<string, unknown> | undefined,
  myReading: null as Reading | null,
  inWishlist: false,
  toggle: vi.fn(),
}))

vi.mock('@/features/shelf/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  useShelf: () => ({ data: state.shelf, isLoading: false, isError: false }),
  useBook: () => ({ data: state.book, isLoading: false, isError: !state.book }),
  useMyReadingOf: () => ({ data: state.myReading, isLoading: false }),
  useIsInWishlist: () => ({ data: state.inWishlist }),
  useWishlistToggle: () => ({ mutate: state.toggle, isPending: false }),
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

describe('Meus livros', () => {
  beforeEach(() => {
    state.shelf = groupShelf(
      [
        reading('1', 'Três', { book: { id: 'book-1', title: 'Três', author: 'Valérie Perrin', pages: 672, cover_url: 'https://covers.openlibrary.org/b/id/1-L.jpg', summary: null } }),
        reading('2', 'A hora da estrela', { finished_on: null, started_on: '2026-10-10' }),
      ],
      [{ created_at: '2026-10-15', book: { id: 'book-9', title: 'Quarta asa', author: null, pages: null, cover_url: null } }],
    )
  })

  it('mostra as prateleiras Lidos, Em andamento e Quero ler', () => {
    renderApp('/meus-livros')
    const read = screen.getByRole('list', { name: 'Livros lidos' })
    expect(within(read).getByRole('link', { name: 'Três' })).toHaveAttribute('href', '/livros/book-1')
    expect(within(read).getByRole('img', { name: '4,5 de 5 estrelas' })).toBeInTheDocument()

    const reading = screen.getByRole('list', { name: 'Leituras em andamento' })
    expect(within(reading).getByText('desde 10 OUT 2026')).toBeInTheDocument()

    expect(within(screen.getByRole('list', { name: 'Quero ler' })).getByRole('link', { name: 'Quarta asa' })).toBeInTheDocument()
  })

  it('usa um recorte borrado da capa atrás do título', () => {
    renderApp('/meus-livros')
    const cover = screen.getByTestId('shelf-cover')
    expect(cover).toHaveAttribute('src', 'https://covers.openlibrary.org/b/id/1-L.jpg')
    expect(cover).toHaveClass('blur-cover')
    expect(cover).toHaveAttribute('alt', '')
  })

  it('estados vazios', () => {
    state.shelf = groupShelf([], [])
    renderApp('/meus-livros')
    expect(screen.getByText('Nenhum livro terminado ainda.')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma leitura em andamento.')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Quero ler' })).not.toBeInTheDocument()
  })
})

describe('Página do livro', () => {
  beforeEach(() => {
    state.book = { id: 'book-1', title: 'Três', author: 'Valérie Perrin', pages: 672, cover_url: null, summary: null, openlibrary_work_key: '/works/OL1W' }
    state.myReading = null
    state.inWishlist = false
    state.toggle.mockClear()
  })

  it('mostra autor, páginas e "sem resumo disponível"', () => {
    renderApp('/livros/book-1')
    expect(screen.getByRole('heading', { level: 1, name: 'Três' })).toBeInTheDocument()
    expect(screen.getByText('Valérie Perrin')).toBeInTheDocument()
    expect(screen.getByText('672 páginas')).toBeInTheDocument()
    expect(screen.getByText('sem resumo disponível')).toBeInTheDocument()
  })

  it('mostra o resumo quando existe', () => {
    state.book = { ...state.book, summary: 'Três amigos de infância.' }
    renderApp('/livros/book-1')
    expect(screen.getByText('Três amigos de infância.')).toBeInTheDocument()
  })

  it('resumo longo começa recolhido', async () => {
    state.book = { ...state.book, summary: 'a'.repeat(500) }
    renderApp('/livros/book-1')
    expect(screen.getByText(/^a+…$/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'ler resumo completo' }))
    expect(screen.getByText('a'.repeat(500))).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'mostrar menos' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('mostra os dados cadastrados e o botão Editar', () => {
    state.myReading = reading('r1', 'Três', {
      started_on: '2026-10-01',
      finished_on: '2026-10-12',
      favorite_character: 'Nina',
      comment: 'Me acompanhou por dias.',
    })
    renderApp('/livros/book-1')
    expect(screen.getByRole('heading', { name: 'Seus dados' })).toBeInTheDocument()
    expect(screen.getByText('Início: 01 OUT 2026')).toBeInTheDocument()
    expect(screen.getByText('Fim: 12 OUT 2026')).toBeInTheDocument()
    expect(screen.getByText('Personagem favorito: Nina')).toBeInTheDocument()
    expect(screen.getByText('Citação favorita: nenhuma ainda')).toBeInTheDocument()
    expect(screen.getByText('Comentário: Me acompanhou por dias.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '4,5 de 5 estrelas' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'EDITAR' })).toHaveAttribute('href', '/leituras/r1/editar')
  })

  it('livro ainda não lido: começar a ler ou guardar em "Quero ler"', async () => {
    renderApp('/livros/book-1')
    expect(screen.getByRole('link', { name: 'COMEÇAR A LER' })).toHaveAttribute('href', '/publicar?livro=book-1')
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar a "Quero ler"' }))
    expect(state.toggle).toHaveBeenCalledWith({ bookId: 'book-1', add: true })
  })
})
