import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import type { ClubBook, ClubDetail, MemberProfile } from './api'

const m = vi.hoisted(() => ({
  clubs: [] as unknown[],
  club: undefined as unknown,
  member: undefined as unknown,
  join: vi.fn(),
  create: vi.fn(),
  vote: vi.fn(),
  finish: vi.fn(),
  propose: vi.fn(),
  leave: vi.fn(),
  regenerate: vi.fn(),
  searchBooks: vi.fn(),
  suggestClubReads: vi.fn(),
}))

const mutation = (fn: ReturnType<typeof vi.fn>) => ({ mutate: fn, mutateAsync: fn, isPending: false, isSuccess: false })

vi.mock('@/features/clubs/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  useMyClubs: () => ({ data: m.clubs, isLoading: false, isError: false }),
  useClub: () => ({ data: m.club, isLoading: false, isError: !m.club }),
  useMemberProfile: () => ({ data: m.member, isLoading: false, isError: !m.member }),
  useJoinClub: () => mutation(m.join),
  useCreateClub: () => mutation(m.create),
  useVote: () => ({ ...mutation(m.vote), variables: undefined }),
  useFinishClubBook: () => mutation(m.finish),
  useProposeBook: () => mutation(m.propose),
  useWithdrawProposal: () => mutation(vi.fn()),
  useRegenerateInviteCode: () => mutation(m.regenerate),
  useChangeClubCover: () => mutation(vi.fn()),
  useLeaveClub: () => mutation(m.leave),
}))
vi.mock('@/lib/openlibrary/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/openlibrary/client')>()),
  searchBooks: m.searchBooks,
}))
vi.mock('@/lib/ai/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/ai/client')>()),
  suggestClubReads: m.suggestClubReads,
}))

const ME = 'user-1' // renderApp loga como user-1

const member = (id: string, name: string, role: 'owner' | 'member' = 'member', joined = '2026-04-20T10:00:00Z') => ({
  user_id: id,
  role,
  joined_at: joined,
  profile: { id, name, avatar_url: null },
})

const clubBook = (id: string, title: string, over: Partial<ClubBook> = {}): ClubBook => ({
  id,
  status: 'finished',
  started_on: '2026-09-01',
  finished_on: '2026-09-29',
  edition_number: 5,
  created_at: '2026-08-28T12:00:00Z',
  proposed_by: null,
  book: { id: `book-${id}`, title, author: 'Autora', cover_url: null, pages: 300 },
  votes: [],
  ...over,
})

const ranks = (user: string, book: string, r: number) => ({
  user_id: user,
  book_id: book,
  started_on: '2026-09-01',
  finished_on: '2026-09-28',
  rank_characters: r,
  rank_plot: r,
  rank_writing: r,
  rank_ending: r,
})

function seedClub(role: 'owner' | 'member' = 'owner'): ClubDetail {
  return {
    id: 'club-1',
    name: 'Dois Amores',
    cover_url: null,
    invite_code: 'DAMS26',
    created_by: ME,
    members: [member(ME, 'Leyna', role), member('irla', 'Irla'), member('novata', 'Novata', 'member', '2026-10-25T00:00:00Z')],
    books: [
      clubBook('tres', 'Três'),
      clubBook('amanhecer', 'Amanhecer na colheita', { status: 'reading', finished_on: null, edition_number: null, started_on: '2026-10-01' }),
      clubBook('torto', 'Torto arado', {
        status: 'pending',
        finished_on: null,
        edition_number: null,
        created_at: '2026-10-19T20:00:00Z',
        proposed_by: 'irla',
        votes: [{ user_id: 'irla', approved: true }],
      }),
    ],
    readings: [ranks(ME, 'book-tres', 5), ranks('irla', 'book-tres', 4)],
  }
}

beforeEach(() => {
  Object.values(m).forEach((v) => typeof v === 'function' && 'mockReset' in v && (v as ReturnType<typeof vi.fn>).mockReset())
  m.clubs = [{ id: 'club-1', name: 'Dois Amores', cover_url: null, memberCount: 4 }]
  m.club = seedClub()
})

describe('lista de clubes', () => {
  it('mostra os clubes com o número de membros', () => {
    renderApp('/clubes')
    const list = screen.getByRole('list', { name: 'Seus clubes' })
    expect(within(list).getByRole('link', { name: /Dois Amores/ })).toHaveAttribute('href', '/clubes/club-1')
    expect(within(list).getByText('4 membros')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'CRIAR CLUBE' })).toHaveAttribute('href', '/clubes/novo')
  })

  it('entra com o código e abre o clube', async () => {
    m.join.mockResolvedValue('club-9')
    const { router } = renderApp('/clubes')
    await userEvent.type(screen.getByLabelText('Entrar com código'), 'dams26')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar no clube' }))
    expect(m.join).toHaveBeenCalledWith('DAMS26')
    await waitFor(() => expect(router.state.location.pathname).toBe('/clubes/club-9'))
  })

  it('código no formato errado nem chama o servidor; código inexistente explica', async () => {
    renderApp('/clubes')
    const field = screen.getByLabelText('Entrar com código')
    await userEvent.type(field, 'abc')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar no clube' }))
    expect(field).toHaveAccessibleDescription(/6 letras e números/)
    expect(m.join).not.toHaveBeenCalled()

    m.join.mockRejectedValue({ code: 'P0002' })
    await userEvent.clear(field)
    await userEvent.type(field, 'ZZZZZZ')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar no clube' }))
    expect(await screen.findByText(/Não encontramos um clube com esse código/)).toBeInTheDocument()
  })

  it('estado vazio', () => {
    m.clubs = []
    renderApp('/clubes')
    expect(screen.getByText(/ainda não participa de nenhum clube/)).toBeInTheDocument()
  })
})

describe('criar clube', () => {
  it('exige o nome e cria', async () => {
    m.create.mockResolvedValue('club-2')
    const { router } = renderApp('/clubes/novo')
    await userEvent.click(screen.getByRole('button', { name: 'CRIAR CLUBE' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Dê um nome ao clube.')
    await userEvent.type(screen.getByLabelText('Nome do clube'), 'Leitoras da Praia')
    await userEvent.click(screen.getByRole('button', { name: 'CRIAR CLUBE' }))
    expect(m.create).toHaveBeenCalledWith({ name: 'Leitoras da Praia', cover: null })
    await waitFor(() => expect(router.state.location.pathname).toBe('/clubes/club-2'))
  })
})

describe('página do clube', () => {
  it('mostra o código, copia e lista os membros', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderApp('/clubes/club-1')
    expect(screen.getByRole('heading', { level: 1, name: 'Dois Amores' })).toBeInTheDocument()
    expect(screen.getByText('DAMS26')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'COPIAR CÓDIGO' }))
    expect(writeText).toHaveBeenCalledWith('DAMS26')
    expect(await screen.findByRole('button', { name: 'CÓDIGO COPIADO ✓' })).toBeInTheDocument()

    const members = screen.getByRole('region', { name: 'Membros' })
    expect(within(members).getByRole('link', { name: 'Irla' })).toHaveAttribute('href', '/clubes/club-1/membros/irla')
    expect(within(members).getByRole('link', { name: 'Leyna (criou o clube)' })).toBeInTheDocument()
  })

  it('prateleiras com a média do clube (média das médias)', () => {
    renderApp('/clubes/club-1')
    const finished = screen.getByRole('list', { name: 'Livros concluídos no clube' })
    expect(within(finished).getByRole('link', { name: 'Três' })).toBeInTheDocument()
    expect(within(finished).getByRole('img', { name: '4,5 de 5 estrelas' })).toBeInTheDocument() // (5 + 4) / 2
    expect(within(finished).getByText(/Edição 5/)).toBeInTheDocument()

    const reading = screen.getByRole('list', { name: 'Livros em leitura no clube' })
    expect(within(reading).getByRole('link', { name: 'Amanhecer na colheita' })).toBeInTheDocument()
  })

  it('concluir a leitura pede confirmação', async () => {
    renderApp('/clubes/club-1')
    await userEvent.click(screen.getByRole('button', { name: 'concluir leitura' }))
    expect(m.finish).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'confirmar' }))
    expect(m.finish).toHaveBeenCalledWith('amanhecer')
  })

  it('proposta pendente: andamento da votação e votos', async () => {
    renderApp('/clubes/club-1')
    const pending = screen.getByRole('region', { name: 'Aguardando aprovação' })
    expect(within(pending).getByText('Proposto por Irla')).toBeInTheDocument()
    // Novata entrou depois da proposta: só Leyna e Irla votam.
    expect(within(pending).getByText('1 de 2 membros aprovaram')).toBeInTheDocument()
    await userEvent.click(within(pending).getByRole('button', { name: 'APROVAR' }))
    expect(m.vote).toHaveBeenCalledWith({ clubBookId: 'torto', approved: true })
  })

  it('ações do clube', () => {
    renderApp('/clubes/club-1')
    expect(screen.getByRole('link', { name: 'PROPOR LIVRO' })).toHaveAttribute('href', '/clubes/club-1/propor')
    expect(screen.getByRole('link', { name: 'SUGESTÃO DO CLUBE' })).toHaveAttribute('href', '/clubes/club-1/sugestoes')
    expect(screen.getByRole('link', { name: 'EXPORTAR REVISTA' })).toHaveAttribute('href', '/clubes/club-1/revista')
  })

  it('dona gerencia o clube; membro só pode sair', async () => {
    const { unmount } = renderApp('/clubes/club-1')
    expect(screen.getByRole('button', { name: 'Gerar novo código' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Excluir clube' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir o clube' }))
    expect(m.leave).toHaveBeenCalledWith({ asOwner: true })
    unmount()

    m.club = seedClub('member')
    renderApp('/clubes/club-1')
    expect(screen.queryByRole('button', { name: 'Gerar novo código' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Sair do clube' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sim, sair do clube' }))
    expect(m.leave).toHaveBeenLastCalledWith({ asOwner: false })
  })
})

describe('perfil do membro', () => {
  it('mostra nome, foto e dados literários', () => {
    const profile: MemberProfile = {
      profile: { id: 'irla', name: 'Irla', avatar_url: null, bio: 'Sublinha e anota nas margens.' },
      readings: [
        { ...ranks('irla', 'b1', 5), pages: 200, book: { id: 'b1', title: 'Três', cover_url: null } },
        { ...ranks('irla', 'b2', 3), pages: 100, book: { id: 'b2', title: 'Verity', cover_url: null } },
      ],
    }
    m.member = profile
    renderApp('/clubes/club-1/membros/irla')
    expect(screen.getByRole('heading', { level: 1, name: 'Irla' })).toBeInTheDocument()
    const stats = screen.getByRole('region', { name: 'Dados literários' })
    expect(within(stats).getByText('2')).toBeInTheDocument()
    expect(within(stats).getByText('300')).toBeInTheDocument()
    expect(within(stats).getByText('4,0')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Livros de Irla' }).children).toHaveLength(2)
  })
})

describe('propor livro', () => {
  it('busca, escolhe e propõe', async () => {
    m.searchBooks.mockResolvedValue([
      { workKey: '/works/OL1W', title: 'Torto arado', author: 'Itamar Vieira Junior', coverId: 7, pages: 280, year: 2019 },
    ])
    m.propose.mockResolvedValue(undefined)
    const { router } = renderApp('/clubes/club-1/propor')
    await userEvent.type(screen.getByRole('combobox', { name: 'Buscar livro' }), 'torto')
    await userEvent.click(await screen.findByRole('option', { name: /Torto arado/ }))
    await userEvent.click(screen.getByRole('button', { name: 'PROPOR AO CLUBE' }))
    expect(m.propose).toHaveBeenCalledWith({
      workKey: '/works/OL1W',
      title: 'Torto arado',
      author: 'Itamar Vieira Junior',
      pages: 280,
      coverUrl: 'https://covers.openlibrary.org/b/id/7-L.jpg',
    })
    await waitFor(() => expect(router.state.location.pathname).toBe('/clubes/club-1'))
  })

  it('livro repetido explica o motivo', async () => {
    m.searchBooks.mockResolvedValue([{ workKey: '/works/OL1W', title: 'Três', author: 'V', coverId: null, pages: null, year: null }])
    m.propose.mockRejectedValue({ code: '23505' })
    renderApp('/clubes/club-1/propor')
    await userEvent.type(screen.getByRole('combobox', { name: 'Buscar livro' }), 'tres')
    await userEvent.click(await screen.findByRole('option', { name: /Três/ }))
    await userEvent.click(screen.getByRole('button', { name: 'PROPOR AO CLUBE' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('já está no clube ou aguardando aprovação')
  })
})

describe('sugestão do clube', () => {
  it('mostra sugestões confirmadas e propõe ao clube', async () => {
    const s = { workKey: '/works/OL2W', title: 'Dias perfeitos', author: 'Raphael Montes', coverUrl: null, pages: 280, reason: 'O clube gostou de suspense' }
    m.suggestClubReads.mockResolvedValue([s])
    renderApp('/clubes/club-1/sugestoes')
    const list = await screen.findByRole('list', { name: 'Sugestões para o clube' })
    expect(within(list).getByText('O clube gostou de suspense')).toBeInTheDocument()
    await userEvent.click(within(list).getByRole('button', { name: 'PROPOR AO CLUBE' }))
    expect(m.propose).toHaveBeenCalledWith(s)
  })
})
