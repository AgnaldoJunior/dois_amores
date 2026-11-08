import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'

const m = vi.hoisted(() => ({
  update: vi.fn(),
  saveFavorites: vi.fn(),
  follow: vi.fn(),
  profile: {} as Record<string, unknown>,
  ensureBook: vi.fn(),
  searchBooks: vi.fn(),
}))

const year = new Date().getFullYear()
const book = (id: string, title: string) => ({ id, title, author: 'Autora', pages: 300, cover_url: null })
const reading = (id: string, b: ReturnType<typeof book>, finished_on: string | null, r: number | null, format: string | null = null) => ({
  id,
  started_on: `${year}-01-02`,
  finished_on,
  rank_characters: r,
  rank_plot: r,
  rank_writing: r,
  rank_ending: r,
  favorite_character: null,
  favorite_quote: id === 'r1' ? 'Eles eram três.' : null,
  comment: null,
  format,
  book: b,
})
const readings = [
  reading('r1', book('tres', 'Três'), `${year}-09-27`, 5, 'audiobook'),
  reading('r2', book('duna', 'Duna'), `${year}-03-01`, 4),
  reading('r4', book('hora', 'A hora da estrela'), null, null),
]

const baseProfile = {
  id: 'user-1',
  name: 'Leyna',
  avatar_url: null,
  bio: 'Lê de tudo.',
  pet: '🐵',
  username: 'leyna.le',
  tagline: 'gosto de finais que doem',
  cover_url: null,
  reading_goal: 40,
  theme: 'madrugada',
  show_followers: true,
  favorite_genres: ['romance'],
  archetype: 'coruja',
  onboarded_at: '2026-04-20T10:00:00Z',
  notifications_seen_at: '2026-11-01T00:00:00Z',
}

vi.mock('@/features/profile/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  useProfile: () => ({ data: m.profile, isLoading: false }),
  useUpdateProfile: () => ({ mutateAsync: m.update, mutate: m.update, isPending: false }),
  useUploadAvatar: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUploadCover: () => ({ mutateAsync: vi.fn(), isPending: false }),
  deleteMyAccount: vi.fn(),
}))
vi.mock('@/features/people/api', () => ({
  usePerson: () => ({ data: { ...baseProfile, id: 'irla', name: 'Irla', username: 'irla.le', theme: 'tinta', archetype: null }, isLoading: false }),
  useFollows: () => ({ data: { followers: [{ id: 'irla', name: 'Irla', username: 'irla.le', avatar_url: null }], following: [], followedByMe: false } }),
  useFavorites: () => ({ data: [{ position: 1, book: book('tres', 'Três') }] }),
  usePersonReadings: () => ({ data: readings }),
  useToggleFollow: () => ({ mutate: m.follow, isPending: false }),
  useSaveFavorites: () => ({ mutateAsync: m.saveFavorites, isPending: false }),
  useInvalidatePerson: () => () => undefined,
}))
vi.mock('@/features/shelf/api', () => ({
  useShelf: () => ({ data: { read: readings.filter((r) => r.finished_on), reading: readings.filter((r) => !r.finished_on), wishlist: [] } }),
}))
vi.mock('@/features/shelf/shelvesApi', () => ({
  useCustomShelves: () => ({ data: [{ id: 's1', user_id: 'user-1', name: 'lista de praia', color: 'rosa', created_at: '', books: [] }] }),
}))
vi.mock('@/features/readings/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/readings/api')>()),
  ensureBook: m.ensureBook,
}))
vi.mock('@/lib/openlibrary/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/openlibrary/client')>()),
  searchBooks: m.searchBooks,
}))
vi.mock('@/features/clubs/api', () => ({
  useMyClubs: () => ({ data: [] }),
}))

beforeEach(() => {
  m.profile = { ...baseProfile }
  m.update.mockReset().mockResolvedValue(undefined)
  m.saveFavorites.mockReset().mockResolvedValue(undefined)
  m.follow.mockReset()
  sessionStorage.clear()
})

describe('meu perfil', () => {
  it('nome, @usuário, seguidores, frase, arquétipo, números, favoritos e estantes', () => {
    renderApp('/perfil')
    expect(screen.getByRole('heading', { level: 1, name: 'Leyna' })).toBeInTheDocument()
    expect(screen.getByText(/@leyna\.le/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '1 seguidores' })).toHaveAttribute('href', '/pessoas/user-1/seguidores')
    expect(screen.getByText('gosto de finais que doem ♡')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '♡ a coruja da madrugada' })).toHaveAttribute('href', '/teste/resultado')

    const stats = screen.getByRole('region', { name: 'Números do perfil' })
    expect(within(stats).getByText('2')).toBeInTheDocument() // livros
    expect(within(stats).getByText('1')).toBeInTheDocument() // audiobooks
    expect(within(stats).getByText('4,5★')).toBeInTheDocument()

    expect(within(screen.getByRole('region', { name: 'favoritos' })).getByRole('link', { name: 'Três' })).toHaveAttribute('href', '/livros/tres')
    const shelves = screen.getByRole('region', { name: 'estantes' })
    expect(within(shelves).getByRole('link', { name: /lista de praia/ })).toHaveAttribute('href', '/estantes/s1')
    expect(screen.getByRole('link', { name: 'Editar perfil' })).toHaveAttribute('href', '/perfil/editar')
    expect(screen.getByRole('link', { name: 'Configurações' })).toHaveAttribute('href', '/configuracoes')
  })

  it('perfil de outra pessoa com o botão seguir', async () => {
    renderApp('/pessoas/irla')
    expect(screen.getByRole('heading', { level: 1, name: 'Irla' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'seguir +' }))
    expect(m.follow).toHaveBeenCalledWith(true)
  })
})

describe('editar perfil', () => {
  it('salva nome, @usuário, frase, meta, tema e bichinho', async () => {
    renderApp('/perfil/editar')
    const user = screen.getByLabelText('Usuário')
    await userEvent.clear(user)
    await userEvent.type(user, 'leyna.k')
    await userEvent.click(screen.getByRole('radio', { name: 'poesia de bolso' }))
    await userEvent.click(within(screen.getByRole('group', { name: 'Seu bichinho' })).getByRole('radio', { name: 'raposa' }))
    await userEvent.click(screen.getByRole('button', { name: 'salvar ♡' }))
    expect(m.update).toHaveBeenCalledWith({
      name: 'Leyna',
      username: 'leyna.k',
      tagline: 'gosto de finais que doem',
      reading_goal: 40,
      theme: 'poesia',
      bio: 'Lê de tudo.',
      pet: '🦊',
    })
  })

  it('recusa @usuário inválido', async () => {
    renderApp('/perfil/editar')
    const user = screen.getByLabelText('Usuário')
    await userEvent.clear(user)
    await userEvent.type(user, 'a b')
    await userEvent.click(screen.getByRole('button', { name: 'salvar ♡' }))
    expect(screen.getByRole('alert')).toHaveTextContent('O @usuário tem de 3 a 30')
    expect(m.update).not.toHaveBeenCalled()
  })

  it('favoritos: escolhe até 4 lidos', async () => {
    renderApp('/perfil/favoritos')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Duna' }))
    await userEvent.click(screen.getByRole('button', { name: 'salvar favoritos' }))
    expect(m.saveFavorites).toHaveBeenCalledWith(['tres', 'duna'])
  })
})

describe('favoritos sem precisar ter lido', () => {
  it('oferece leituras em andamento e estantes', () => {
    renderApp('/perfil/favoritos')
    expect(screen.getByRole('checkbox', { name: 'A hora da estrela' })).not.toBeChecked()
  })

  it('qualquer livro da busca entra nos favoritos', async () => {
    m.searchBooks.mockResolvedValue([{ workKey: '/works/OL9W', title: 'Torto arado', author: 'Itamar', coverId: null, pages: 280, year: 2019 }])
    m.ensureBook.mockResolvedValue({ id: 'torto', title: 'Torto arado', cover_url: null })
    renderApp('/perfil/favoritos')
    await userEvent.type(screen.getByRole('combobox', { name: 'Buscar qualquer livro' }), 'torto')
    await userEvent.click(await screen.findByRole('option', { name: /Torto arado/ }))
    expect(await screen.findByRole('checkbox', { name: 'Torto arado' })).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'salvar favoritos' }))
    expect(m.saveFavorites).toHaveBeenCalledWith(['tres', 'torto'])
  })
})

describe('configurações', () => {
  it('liga e desliga a contagem de seguidores', async () => {
    renderApp('/configuracoes')
    await userEvent.click(screen.getByRole('switch', { name: /mostrar seguidores/ }))
    expect(m.update).toHaveBeenCalledWith({ show_followers: false })
    expect(screen.getByRole('button', { name: 'Excluir conta' })).toBeInTheDocument()
  })
})

describe('bem-vindo (cadastro do perfil)', () => {
  it('passo 1: nome e @usuário, depois o passo 2', async () => {
    m.profile = { ...baseProfile, username: null, onboarded_at: null }
    const { router } = renderApp('/bem-vindo/1')
    expect(screen.getByText('passo 1 de 8')).toBeInTheDocument()
    expect(screen.getByLabelText('Usuário')).toHaveValue('@leyna')
    await userEvent.click(screen.getByRole('button', { name: 'continuar' }))
    expect(m.update).toHaveBeenCalledWith({ name: 'Leyna', username: 'leyna' })
    expect(router.state.location.pathname).toBe('/bem-vindo/2')
  })

  it('passo 8: pede pelo menos três gostos', async () => {
    m.profile = { ...baseProfile, favorite_genres: [] }
    renderApp('/bem-vindo/8')
    await userEvent.click(screen.getByRole('checkbox', { name: 'romance' }))
    await userEvent.click(screen.getByRole('button', { name: 'continuar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha pelo menos três gostos.')
    await userEvent.click(screen.getByRole('checkbox', { name: 'suspense' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'poesia' }))
    await userEvent.click(screen.getByRole('button', { name: 'continuar' }))
    expect(m.update).toHaveBeenCalledWith({ favorite_genres: ['romance', 'suspense', 'poesia'] })
  })

  it('tudo pronto marca o cadastro como feito', async () => {
    m.profile = { ...baseProfile, onboarded_at: null }
    m.update.mockImplementation(async (changes: Record<string, unknown>) => {
      m.profile = { ...m.profile, ...changes }
    })
    const { router } = renderApp('/bem-vindo/pronto')
    await userEvent.click(screen.getByRole('button', { name: 'ir para o início' }))
    expect(m.update).toHaveBeenCalledWith({ onboarded_at: expect.any(String) })
    expect(router.state.location.pathname).toBe('/')
  })
})

describe('teste de leitora', () => {
  it('15 perguntas, resultado e salvar com permissão', async () => {
    const { router } = renderApp('/teste')
    await userEvent.click(screen.getByRole('button', { name: 'descobrir meu lado leitora →' }))
    for (let i = 0; i < 15; i++) {
      const options = within(screen.getByRole('list', { name: 'Respostas' })).getAllByRole('button')
      await userEvent.click(options[1]!)
    }
    expect(router.state.location.pathname).toBe('/teste/revelacao')
    await router.navigate('/teste/resultado')
    expect(await screen.findByRole('heading', { name: 'a detetive dos plot twists' })).toBeInTheDocument()
    await router.navigate('/teste/salvar')
    const save = await screen.findByRole('button', { name: 'salvar meu universo literário →' })
    expect(save).toBeDisabled()
    await userEvent.click(screen.getByRole('checkbox', { name: /quero salvar meu arquétipo/ }))
    await userEvent.click(save)
    expect(m.update).toHaveBeenCalledWith({ archetype: 'detetive' })
  })
})
