import { render, screen } from '@testing-library/react'
import { Stars, starFills } from './Stars'

describe('starFills', () => {
  it('preenche estrelas inteiras', () => {
    expect(starFills(3)).toEqual(['full', 'full', 'full', 'empty', 'empty'])
  })

  it('suporta meia estrela', () => {
    expect(starFills(3.5)).toEqual(['full', 'full', 'full', 'half', 'empty'])
  })

  it('arredonda para o meio ponto mais próximo', () => {
    expect(starFills(4.24)).toEqual(['full', 'full', 'full', 'full', 'empty'])
    expect(starFills(4.25)).toEqual(['full', 'full', 'full', 'full', 'half'])
    expect(starFills(4.8)).toEqual(['full', 'full', 'full', 'full', 'full'])
  })

  it('limita valores fora do intervalo e trata ausência de nota', () => {
    expect(starFills(9)).toEqual(Array(5).fill('full'))
    expect(starFills(-1)).toEqual(Array(5).fill('empty'))
    expect(starFills(null)).toEqual(Array(5).fill('empty'))
  })
})

describe('<Stars>', () => {
  it('tem rótulo acessível em português', () => {
    render(<Stars value={4.5} />)
    expect(screen.getByRole('img', { name: '4,5 de 5 estrelas' })).toBeInTheDocument()
  })

  it('indica quando não há nota', () => {
    render(<Stars value={null} />)
    expect(screen.getByRole('img', { name: 'Sem nota' })).toBeInTheDocument()
  })

  it('renderiza o preenchimento de cada estrela', () => {
    const { container } = render(<Stars value={2.5} />)
    const fills = [...container.querySelectorAll('svg')].map((s) => s.dataset.fill)
    expect(fills).toEqual(['full', 'full', 'half', 'empty', 'empty'])
  })
})
