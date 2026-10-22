import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'

vi.mock('@/features/profile/api', () => ({
  useProfile: () => ({
    data: { id: 'user-1', name: 'Leyna Souza', avatar_url: null, bio: null },
    isLoading: false,
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
    expect(screen.getByText('Olá, Leyna')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Abrir meu perfil' })).toHaveAttribute('href', '/perfil')
    expect(screen.getByText('Livros lidos')).toBeInTheDocument()
    expect(screen.getByText('Páginas lidas')).toBeInTheDocument()
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
