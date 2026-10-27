import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiError } from '@/lib/ai/client'
import { renderApp } from '@/test/renderApp'

const mocks = vi.hoisted(() => ({ suggestNextReads: vi.fn(), add: vi.fn(), added: null as null | { id: string } }))

vi.mock('@/lib/ai/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/ai/client')>()),
  suggestNextReads: mocks.suggestNextReads,
}))
vi.mock('@/features/shelf/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  useAddSuggestionToWishlist: () => ({ mutateAsync: mocks.add, isPending: false, data: mocks.added }),
}))

const suggestion = {
  workKey: '/works/OL24141556W',
  title: 'Torto arado',
  author: 'Itamar Vieira Junior',
  coverUrl: null,
  pages: 280,
  reason: 'Porque você gostou de Tudo é rio',
}

beforeEach(() => {
  mocks.suggestNextReads.mockReset()
  mocks.add.mockReset()
  mocks.added = null
})

describe('Sugestão de próxima leitura', () => {
  it('mostra as sugestões confirmadas com motivo e botão para a lista', async () => {
    mocks.suggestNextReads.mockResolvedValue([suggestion])
    mocks.add.mockResolvedValue({ id: 'book-7' })
    renderApp('/meus-livros/sugestoes')

    const list = await screen.findByRole('list', { name: 'Sugestões de leitura' })
    const card = within(list).getByRole('listitem')
    expect(within(card).getByRole('heading', { name: 'Torto arado' })).toBeInTheDocument()
    expect(within(card).getByText('Itamar Vieira Junior')).toBeInTheDocument()
    expect(within(card).getByText('Porque você gostou de Tudo é rio')).toBeInTheDocument()
    expect(screen.getByText(/conferido na Open Library/)).toBeInTheDocument()

    await userEvent.click(within(card).getByRole('button', { name: 'ADICIONAR À LISTA' }))
    expect(mocks.add).toHaveBeenCalledWith(suggestion)
  })

  it('depois de adicionada, mostra que está na lista com link para o livro', async () => {
    mocks.suggestNextReads.mockResolvedValue([suggestion])
    mocks.added = { id: 'book-7' }
    renderApp('/meus-livros/sugestoes')
    expect(await screen.findByText(/Na sua lista "Quero ler"/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'ver livro' })).toHaveAttribute('href', '/livros/book-7')
  })

  it('sem livros terminados, explica o que falta', async () => {
    mocks.suggestNextReads.mockRejectedValue(new AiError('not_enough_data'))
    renderApp('/meus-livros/sugestoes')
    expect(await screen.findByRole('alert')).toHaveTextContent('Termine pelo menos um livro')
  })
})
