import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from './router'

const renderAt = (path: string) =>
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />)

describe('navegação principal', () => {
  it('mostra as quatro abas', () => {
    renderAt('/')
    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
    const links = [...nav.querySelectorAll('a')].map((a) => a.textContent)
    expect(links).toEqual(['Início', 'Feed', 'Meus livros', 'Clubes'])
  })

  it('marca a aba atual com aria-current', () => {
    renderAt('/clubes')
    expect(screen.getByRole('link', { name: 'Clubes' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current')
  })

  it('a tela inicial mostra as estatísticas', () => {
    renderAt('/')
    expect(screen.getByText('Livros lidos')).toBeInTheDocument()
    expect(screen.getByText('Páginas lidas')).toBeInTheDocument()
    expect(screen.getByText('Clubes', { selector: 'span' })).toBeInTheDocument()
  })

  it('rota desconhecida mostra página não encontrada', () => {
    renderAt('/nao-existe')
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
  })
})
