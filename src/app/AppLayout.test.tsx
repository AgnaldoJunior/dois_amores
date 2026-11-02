import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'

vi.mock('@/features/profile/api', () => ({
  useProfile: () => ({
    data: { id: 'user-1', name: 'Leyna Souza', avatar_url: null, bio: null },
    isLoading: false,
  }),
}))

vi.mock('@/features/readings/api', () => ({
  useMyStats: () => ({ data: { booksRead: 12, pagesRead: 3480, clubs: 2 } }),
  useRecentReadings: () => ({
    data: [
      {
        id: 'r1',
        started_on: '2026-09-01',
        finished_on: '2026-09-27',
        rank_characters: 5,
        rank_plot: 4,
        rank_writing: 5,
        rank_ending: 4,
        favorite_character: null,
        favorite_quote: null,
        comment: 'Me acompanhou por dias.',
        book: { id: 'b1', title: 'Três', author: 'Valérie Perrin', pages: 672, cover_url: null, summary: null },
      },
    ],
    isLoading: false,
  }),
}))

vi.mock('@/features/clubs/api', () => ({
  useJoinClub: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useMyClubs: () => ({ data: [{ id: 'c1', name: 'Dois Amores', cover_url: null, memberCount: 4 }] }),
  useMyClubBooks: () => ({
    data: [
      {
        id: 'cb8',
        club_id: 'c1',
        status: 'reading',
        edition_number: 8,
        started_on: '2026-10-01',
        proposed_by: 'irla',
        book: { id: 'b8', title: '10 minutos e 38 segundos neste mundo estranho', author: 'Elif Shafak', cover_url: null },
      },
    ],
  }),
}))

describe('navegação principal', () => {
  it('mostra as quatro abas', () => {
    renderApp('/')
    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
    const links = [...nav.querySelectorAll('a')].map((a) => a.textContent)
    expect(links).toEqual(['Início', 'Feed', 'Meus livros', 'Clubes'])
  })

  it('marca a aba atual com aria-current', () => {
    renderApp('/clubes')
    expect(screen.getByRole('link', { name: 'Clubes' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current')
  })

  it('a tela inicial cumprimenta pelo primeiro nome e mostra as estatísticas', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { name: 'Olá, Leyna!' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Abrir meu perfil' })).toHaveAttribute('href', '/perfil')
    expect(screen.getByText('Livros lidos')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('3.480')).toBeInTheDocument()
    expect(screen.getByText('Páginas lidas')).toBeInTheDocument()
  })

  it('a tela inicial lista as leituras recentes com link para a página do livro', () => {
    renderApp('/')
    const link = screen.getByRole('link', { name: /^Três/ })
    expect(link).toHaveAttribute('href', '/livros/b1')
    expect(screen.getByRole('img', { name: '4,5 de 5 estrelas' })).toBeInTheDocument()
  })

  it('a tela inicial mostra o livro que o clube está lendo e o atalho para o ranking', () => {
    renderApp('/')
    const ticket = screen.getByRole('link', { name: /no clube agora · No\.08/ })
    expect(ticket).toHaveAttribute('href', '/clubes/c1/livros/cb8')
    expect(ticket).toHaveTextContent('10 minutos e 38 segundos neste mundo estranho')
    expect(screen.getByRole('link', { name: 'ver o ranking do clube' })).toHaveAttribute('href', '/clubes/c1/ranking')
  })

  it('rota desconhecida mostra página não encontrada', () => {
    renderApp('/nao-existe')
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
  })
})

describe('rotas protegidas', () => {
  it('sem sessão, manda para o login guardando o destino', () => {
    const { router } = renderApp('/clubes', null)
    expect(router.state.location.pathname).toBe('/entrar')
    expect(router.state.location.state).toEqual({ from: '/clubes' })
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('a política de privacidade é pública', () => {
    renderApp('/privacidade', null)
    expect(screen.getByRole('heading', { name: 'Política de privacidade' })).toBeInTheDocument()
  })

  it('com sessão, o login redireciona para o início', () => {
    const { router } = renderApp('/entrar')
    expect(router.state.location.pathname).toBe('/')
  })
})
