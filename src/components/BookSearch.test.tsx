import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { BookSearchResult } from '@/lib/openlibrary/client'
import { BookSearch } from './BookSearch'

const { searchBooks } = vi.hoisted(() => ({ searchBooks: vi.fn() }))
vi.mock('@/lib/openlibrary/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/openlibrary/client')>()),
  searchBooks,
}))

const book = (n: number): BookSearchResult => ({
  workKey: `/works/OL${n}W`,
  title: `Livro ${n}`,
  author: `Autora ${n}`,
  coverId: null,
  pages: 100,
  year: 2020,
})

function setup() {
  const onSelect = vi.fn()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <BookSearch onSelect={onSelect} />
    </QueryClientProvider>,
  )
  return { onSelect, input: screen.getByRole('combobox', { name: 'Buscar livro' }) }
}

beforeEach(() => {
  searchBooks.mockReset()
  searchBooks.mockResolvedValue([book(1), book(2), book(3), book(4), book(5)])
})

describe('<BookSearch>', () => {
  it('espera a pessoa parar de digitar (debounce) e busca uma vez só', async () => {
    const { input } = setup()
    await userEvent.type(input, 'torto arado')
    expect(searchBooks).not.toHaveBeenCalled()
    await waitFor(() => expect(searchBooks).toHaveBeenCalledTimes(1))
    expect(searchBooks.mock.calls[0]![0]).toBe('torto arado')
    expect(searchBooks.mock.calls[0]![1]).toMatchObject({ limit: 5 })
  })

  it('mostra até 5 sugestões com título e autor', async () => {
    const { input } = setup()
    await userEvent.type(input, 'livro')
    const options = await screen.findAllByRole('option')
    expect(options).toHaveLength(5)
    expect(options[0]).toHaveTextContent('Livro 1')
    expect(options[0]).toHaveTextContent('Autora 1 · 2020')
    expect(input).toHaveAttribute('aria-expanded', 'true')
  })

  it('navega pelo teclado e escolhe com Enter', async () => {
    const { input, onSelect } = setup()
    await userEvent.type(input, 'livro')
    await screen.findAllByRole('option')

    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    const options = screen.getAllByRole('option')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', options[1]!.id)

    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    expect(screen.getAllByRole('option')[4]).toHaveAttribute('aria-selected', 'true')

    await userEvent.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith(book(5))
    expect(input).toHaveValue('')
  })

  it('Esc fecha a lista', async () => {
    const { input } = setup()
    await userEvent.type(input, 'livro')
    await screen.findAllByRole('option')
    await userEvent.keyboard('{Escape}')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('escolhe com o mouse', async () => {
    const { input, onSelect } = setup()
    await userEvent.type(input, 'livro')
    await userEvent.click((await screen.findAllByRole('option'))[2]!)
    expect(onSelect).toHaveBeenCalledWith(book(3))
  })

  it('avisa quando não encontra nada', async () => {
    searchBooks.mockResolvedValue([])
    const { input } = setup()
    await userEvent.type(input, 'xyzxyz')
    expect(await screen.findByText('Nenhum livro encontrado.')).toBeInTheDocument()
  })

  it('não busca com menos de 2 letras', async () => {
    const { input } = setup()
    await userEvent.type(input, 'a')
    await new Promise((r) => setTimeout(r, 400))
    expect(searchBooks).not.toHaveBeenCalled()
  })
})
