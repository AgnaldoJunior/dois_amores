import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiError } from '@/lib/ai/client'
import { QuoteSuggestions } from './QuoteSuggestions'

const suggestQuotes = vi.hoisted(() => vi.fn())
vi.mock('@/lib/ai/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/ai/client')>()),
  suggestQuotes,
}))

function setup(bookId: string | null = 'b1') {
  const onUse = vi.fn()
  render(
    <QueryClientProvider client={new QueryClient()}>
      <QuoteSuggestions bookId={bookId} onUse={onUse} />
    </QueryClientProvider>,
  )
  return { onUse }
}

beforeEach(() => {
  suggestQuotes.mockReset()
})

describe('Sugerir citações com IA', () => {
  it('só funciona depois de escolher o livro', () => {
    setup(null)
    expect(screen.getByRole('button', { name: 'SUGERIR COM IA' })).toBeDisabled()
  })

  it('mostra as sugestões com o aviso e só usa a que a pessoa escolher', async () => {
    suggestQuotes.mockResolvedValue([
      { text: 'Tudo no mundo começou com um sim.', context: 'Início do livro' },
      { text: 'Outra frase.', context: null },
    ])
    const { onUse } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'SUGERIR COM IA' }))

    const list = await screen.findByRole('region', { name: 'Citações sugeridas pela IA' })
    expect(list).toHaveTextContent('sugerido por IA, confira se é literal')
    expect(list).toHaveTextContent('“Tudo no mundo começou com um sim.”')
    expect(list).toHaveTextContent('Início do livro')
    expect(onUse).not.toHaveBeenCalled()

    await userEvent.click(screen.getAllByRole('button', { name: 'Usar esta citação' })[0]!)
    expect(onUse).toHaveBeenCalledWith('Tudo no mundo começou com um sim.')
    expect(suggestQuotes).toHaveBeenCalledWith('b1')
  })

  it('avisa quando a IA não tem citações seguras', async () => {
    suggestQuotes.mockResolvedValue([])
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'SUGERIR COM IA' }))
    expect(await screen.findByText(/não encontrou citações com segurança/)).toBeInTheDocument()
  })

  it('mostra a mensagem do limite diário', async () => {
    suggestQuotes.mockRejectedValue(new AiError('quota_exceeded'))
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'SUGERIR COM IA' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('todas as sugestões de IA de hoje')
  })
})
