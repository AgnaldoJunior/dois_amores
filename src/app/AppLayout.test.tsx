import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

const m = vi.hoisted(() => ({
  updateProgress: vi.fn(),
  like: vi.fn(),
  profile: { id: 'user-1', name: 'Leyna Souza', avatar_url: null, bio: null, onboarded_at: '2026-04-20T10:00:00Z', notifications_seen_at: '2026-11-01T00:00:00Z' } as Record<string, unknown>,
}))

const post = {
  id: 'p1',
  created_at: '2026-09-27T20:00:00Z',
  author: { id: 'irla', name: 'Irla Lima', avatar_url: null },
  reading: {
    id: 'r1',
    finished_on: '2026-09-27',
    rank_characters: 5,
    rank_plot: 4,
    rank_writing: 5,
    rank_ending: 4,
    comment: 'Me acompanhou por dias.',
    favorite_quote: 'Eles eram três. Ou nada.',
    book: { id: 'b1', title: 'Três', author: 'Valérie Perrin', cover_url: null },
  },
  likes: [{ user_id: 'thais' }],
  comments: [{ count: 2 }],
}

vi.mock('@/features/profile/api', () => ({
  useProfile: () => ({ data: m.profile, isLoading: false }),
}))
vi.mock('@/features/feed/api', () => ({
  useFeed: () => ({ data: { pages: [[post]] }, isLoading: false, isError: false, hasNextPage: false }),
  useFriendsReadingNow: () => ({ data: [{ id: 'x', user: { id: 'wane', name: 'Wanessa' }, book: { id: 'b8', title: 'Recursão', cover_url: null } }] }),
  useToggleLike: () => ({ mutate: m.like, isPending: false }),
}))
vi.mock('@/features/notifications/api', () => ({
  useNotifications: () => ({ data: [{ kind: 'like', created_at: '2026-11-05T10:00:00Z', body: null, post_id: 'p1', actor: null, book: null }] }),
}))
vi.mock('@/features/shelf/api', () => ({
  useShelf: () => ({
    data: {
      read: [],
      wishlist: [],
      reading: [
        {
          id: 'r9',
          started_on: '2026-10-10',
          finished_on: null,
          current_page: 152,
          book: { id: 'b9', title: 'A hora da estrela', author: 'Clarice Lispector', pages: 400, cover_url: null },
        },
      ],
    },
  }),
}))
vi.mock('@/features/readings/api', () => ({
  useUpdateProgress: () => ({ mutateAsync: m.updateProgress, isPending: false }),
}))
vi.mock('@/features/clubs/api', () => ({
  useJoinClub: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useMyClubs: () => ({ data: [], isLoading: false }),
}))

describe('navegação principal', () => {
  it('mostra as cinco abas', () => {
    renderApp('/')
    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
    expect([...nav.querySelectorAll('a')].map((a) => a.textContent)).toEqual(['início', 'estantes', 'clubes', 'números', 'perfil'])
  })

  it('marca a aba atual com aria-current', () => {
    renderApp('/clubes')
    expect(screen.getByRole('link', { name: 'clubes' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'início' })).not.toHaveAttribute('aria-current')
  })

  it('rota desconhecida mostra página não encontrada', () => {
    renderApp('/nao-existe')
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
  })

  it('endereços antigos levam às telas novas', () => {
    const { router } = renderApp('/meus-livros')
    expect(router.state.location.pathname).toBe('/estantes')
  })

  it('conta nova vai para o cadastro do perfil antes do app', () => {
    m.profile = { ...m.profile, onboarded_at: null }
    const { router } = renderApp('/')
    expect(router.state.location.pathname).toBe('/bem-vindo/1')
    m.profile = { ...m.profile, onboarded_at: '2026-04-20T10:00:00Z' }
  })
})

describe('início', () => {
  it('cumprimenta, mostra a citação do dia e o que as amigas estão lendo', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { level: 1, name: 'olá, leyna' })).toBeInTheDocument()
    expect(screen.getByText('“Eles eram três. Ou nada.”')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Wanessa está lendo Recursão' })).toHaveAttribute('href', '/livros/b8')
    expect(screen.getByRole('link', { name: 'Novidades (há novas)' })).toHaveAttribute('href', '/notificacoes')
    expect(screen.getByRole('link', { name: 'Buscar livro' })).toHaveAttribute('href', '/buscar')
  })

  it('fichas com curtir, comentar e o número de cada um', async () => {
    renderApp('/')
    const item = within(screen.getByRole('list', { name: 'Leituras concluídas' })).getByRole('listitem')
    expect(within(item).getByRole('heading', { name: 'Três' })).toBeInTheDocument()
    expect(within(item).getByRole('img', { name: '4,5 de 5 estrelas' })).toBeInTheDocument()
    expect(within(item).getByText('27 set')).toBeInTheDocument()
    expect(within(item).getByRole('link', { name: /comentar · 2/ })).toHaveAttribute('href', '/fichas/p1')
    await userEvent.click(within(item).getByRole('button', { name: /curtir · 1/ }))
    expect(m.like).toHaveBeenCalledWith({ postId: 'p1', like: true })
  })

  it('filtra só as resenhas (fichas com comentário)', async () => {
    renderApp('/')
    await userEvent.click(screen.getByRole('button', { name: 'resenhas' }))
    expect(screen.getByRole('button', { name: 'resenhas' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(screen.getByRole('list', { name: 'Leituras concluídas' })).getAllByRole('listitem')).toHaveLength(1)
  })

  it('"você está lendo" mostra o progresso e atualiza a página atual', async () => {
    renderApp('/')
    expect(screen.getByRole('progressbar', { name: 'Progresso de A hora da estrela' })).toHaveAttribute('aria-valuenow', '38')
    expect(screen.getByText('38% lido · pág. 152 de 400')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar página atual de A hora da estrela' }))
    const page = screen.getByRole('spinbutton', { name: 'página atual' })
    await userEvent.clear(page)
    await userEvent.type(page, '500')
    await userEvent.click(screen.getByRole('button', { name: 'salvar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Informe uma página entre 0 e 400.')
    await userEvent.clear(page)
    await userEvent.type(page, '200')
    await userEvent.click(screen.getByRole('button', { name: 'salvar' }))
    expect(m.updateProgress).toHaveBeenCalledWith({ id: 'r9', page: 200 })
  })
})

describe('rotas protegidas', () => {
  it('sem sessão, manda para o login guardando o destino', () => {
    const { router } = renderApp('/clubes', null)
    expect(router.state.location.pathname).toBe('/entrar')
    expect(router.state.location.state).toEqual({ from: '/clubes' })
    expect(screen.getByRole('button', { name: 'entrar' })).toBeInTheDocument()
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
