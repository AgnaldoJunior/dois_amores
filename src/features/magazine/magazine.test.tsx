import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import { sampleSource } from './sampleSource'
import { listTemplates } from './templates'

const m = vi.hoisted(() => ({ render: vi.fn(), inline: vi.fn() }))
vi.mock('@/features/magazine/api', () => ({
  useMagazineSource: () => ({ data: sampleSource, isLoading: false, isError: false }),
}))
vi.mock('@/features/magazine/render', () => ({ renderMagazine: m.render }))
vi.mock('@/features/magazine/inlineImages', () => ({ inlineImages: m.inline }))

beforeEach(() => {
  m.render.mockReset().mockResolvedValue(new Blob(['%PDF-'], { type: 'application/pdf' }))
  m.inline.mockReset().mockImplementation(async (data) => data)
  URL.createObjectURL = vi.fn(() => 'blob:revista')
  URL.revokeObjectURL = vi.fn()
  HTMLAnchorElement.prototype.click = vi.fn()
})

describe('templates da revista', () => {
  it('descobre as pastas de templates/revista sozinho (dois-amores primeiro)', () => {
    const list = listTemplates(
      {
        '/templates/revista/outro/tokens.json': { meta: { name: 'Outro', description: 'x' } },
        '/templates/revista/dois-amores/tokens.json': { meta: { name: 'Dois Amores', description: 'y' } },
        '/templates/revista/sem-template/tokens.json': { meta: { name: 'Incompleto', description: 'z' } },
      },
      {
        '/templates/revista/outro/template.tsx': vi.fn(),
        '/templates/revista/dois-amores/template.tsx': vi.fn(),
      },
    )
    expect(list.map((t) => t.id)).toEqual(['dois-amores', 'outro'])
  })

  it('o projeto tem o template "dois-amores"', () => {
    expect(listTemplates().map((t) => t.id)).toContain('dois-amores')
  })
})

describe('Exportar revista', () => {
  it('mostra o template selecionado e o período das edições', () => {
    renderApp('/clubes/club-1/revista')
    expect(screen.getByRole('radio', { name: /Dois Amores/ })).toBeChecked()
    expect(screen.getByLabelText('De')).toHaveValue('2026-05')
    expect(screen.getByLabelText('Até')).toHaveValue('2026-10')
    expect(screen.getByText('Período: maio a outubro de 2026.')).toBeInTheDocument()
  })

  it('gera o PDF com os dados do clube e oferece o arquivo', async () => {
    renderApp('/clubes/club-1/revista')
    await userEvent.click(screen.getByRole('button', { name: 'GERAR PDF' }))
    await waitFor(() => expect(m.render).toHaveBeenCalled())
    const [template, data] = m.render.mock.calls[0]!
    expect(typeof template.Document).toBe('function')
    expect(data.club.name).toBe('Dois Amores')
    expect(data.editions).toHaveLength(6)
    expect(await screen.findByRole('status')).toHaveTextContent('Revista pronta!')
    expect(screen.getByRole('link', { name: 'Abrir a revista (PDF)' })).toHaveAttribute('href', 'blob:revista')
  })

  it('período escolhido entra nos dados', async () => {
    renderApp('/clubes/club-1/revista')
    // jsdom não digita em <input type="month">: dispara a escolha do mês como o navegador.
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-09' } })
    await userEvent.click(screen.getByRole('button', { name: 'GERAR PDF' }))
    await waitFor(() => expect(m.render).toHaveBeenCalled())
    expect(m.render.mock.calls[0]![1].editions.map((e: { number: number }) => e.number)).toEqual([5, 6])
  })

  it('erro na geração é avisado', async () => {
    m.render.mockRejectedValue(new Error('falhou'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderApp('/clubes/club-1/revista')
    await userEvent.click(screen.getByRole('button', { name: 'GERAR PDF' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Não foi possível gerar a revista')
  })
})
