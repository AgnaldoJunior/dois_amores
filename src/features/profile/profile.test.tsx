import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

const update = vi.hoisted(() => vi.fn())

const year = new Date().getFullYear()
const book = (id: string, title: string) => ({ id, title, author: 'Autora', pages: 300, cover_url: null })
const reading = (id: string, b: ReturnType<typeof book>, finished_on: string | null, r: number | null) => ({
  id,
  started_on: `${year}-01-02`,
  finished_on,
  rank_characters: r,
  rank_plot: r,
  rank_writing: r,
  rank_ending: r,
  favorite_character: null,
  favorite_quote: null,
  comment: null,
  book: b,
})

vi.mock('@/features/profile/api', () => ({
  useProfile: () => ({ data: { id: 'user-1', name: 'Leyna', avatar_url: null, bio: 'Lê de tudo.', pet: '🐵' }, isLoading: false }),
  useUpdateProfile: () => ({ mutateAsync: update, isPending: false }),
  useUploadAvatar: () => ({ mutateAsync: vi.fn(), isPending: false }),
  deleteMyAccount: vi.fn(),
}))
vi.mock('@/features/shelf/api', () => ({
  useShelf: () => ({
    data: {
      read: [
        reading('r1', book('tres', 'Três'), `${year}-09-27`, 5),
        reading('r2', book('duna', 'Duna'), `${year}-03-01`, 4),
        reading('r3', book('velho', 'Antigo'), `${year - 1}-12-01`, 3),
      ],
      reading: [reading('r4', book('hora', 'A hora da estrela'), null, null)],
      wishlist: [],
    },
  }),
}))
vi.mock('@/features/clubs/api', () => ({
  useMyClubBooks: () => ({
    data: [
      { id: 'cb5', club_id: 'c1', status: 'finished', edition_number: 5, started_on: null, proposed_by: 'user-1', book: book('tres', 'Três') },
      { id: 'cb6', club_id: 'c1', status: 'finished', edition_number: 6, started_on: null, proposed_by: 'irla', book: book('outro', 'Outro') },
    ],
  }),
}))

describe('perfil', () => {
  it('números do ano, livros fora do clube e minhas escolhas', () => {
    renderApp('/perfil')
    expect(screen.getByRole('heading', { level: 1, name: 'Leyna' })).toBeInTheDocument()
    expect(screen.getByText('escolheu No.05')).toBeInTheDocument()

    const stats = screen.getByRole('region', { name: `Seus números em ${year}` })
    expect(within(stats).getByText('2')).toBeInTheDocument() // lidos no ano
    expect(within(stats).getByText('1')).toBeInTheDocument() // do clube
    expect(within(stats).getByText('4,5★')).toBeInTheDocument()

    const outside = screen.getByRole('list', { name: 'Livros fora do clube' })
    expect(within(outside).getAllByRole('link').map((a) => a.getAttribute('aria-label'))).toEqual(['A hora da estrela', 'Duna', 'Antigo'])
    expect(within(outside).getByText('lendo')).toBeInTheDocument()

    const mine = screen.getByRole('list', { name: 'Livros que escolhi para o clube' })
    expect(within(mine).getByRole('link', { name: 'Três' })).toHaveAttribute('href', '/clubes/c1/livros/cb5')
    expect(screen.getByRole('link', { name: 'Editar perfil' })).toHaveAttribute('href', '/perfil/editar')
  })
})

describe('editar perfil', () => {
  it('escolhe o bichinho e salva junto com nome e bio', async () => {
    update.mockResolvedValue(undefined)
    renderApp('/perfil/editar')
    const pets = screen.getByRole('group', { name: 'Seu bichinho' })
    expect(within(pets).getByRole('radio', { name: 'macaquinho' })).toBeChecked()
    await userEvent.click(within(pets).getByRole('radio', { name: 'raposa' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(update).toHaveBeenCalledWith({ name: 'Leyna', bio: 'Lê de tudo.', pet: '🦊' })
  })
})

describe('criador de avatar', () => {
  it('monta o avatar pelas abas e salva como avatar ilustrado', async () => {
    update.mockResolvedValue(undefined)
    const { router } = renderApp('/perfil/avatar')
    expect(screen.getByRole('img', { name: 'Prévia do seu avatar' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: 'pele' }))
    await userEvent.click(screen.getByRole('radio', { name: 'pele escura' }))
    await userEvent.click(screen.getByRole('tab', { name: 'cabelo' }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('qual é o penteado?')
    await userEvent.click(screen.getByRole('radio', { name: /coque/ }))
    await userEvent.click(screen.getByRole('tab', { name: 'óculos' }))
    await userEvent.click(screen.getByRole('radio', { name: /gatinho/ }))
    await userEvent.click(screen.getByRole('tab', { name: 'bichinho' }))
    await userEvent.click(screen.getByRole('radio', { name: /sapinho/ }))

    const name = screen.getByRole('textbox', { name: 'Nome no clube' })
    await userEvent.clear(name)
    await userEvent.type(name, 'Ley')
    await userEvent.click(screen.getByRole('button', { name: 'Pronta!' }))
    expect(update).toHaveBeenCalledWith({
      name: 'Ley',
      pet: '🐸',
      avatar_mode: 'illustrated',
      avatar_config: { skin: 3, hair: 1, style: 'bun', glasses: 'cat', shirt: 0, extras: 'none' },
    })
    expect(router.state.location.pathname).toBe('/perfil')
  })

  it('o dado sorteia uma combinação nova', async () => {
    renderApp('/perfil/avatar')
    const before = screen.getByRole('img', { name: 'Prévia do seu avatar' }).innerHTML
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    await userEvent.click(screen.getByRole('button', { name: 'sortear' }))
    expect(screen.getByRole('img', { name: 'Prévia do seu avatar' }).innerHTML).not.toBe(before)
    vi.restoreAllMocks()
  })
})
