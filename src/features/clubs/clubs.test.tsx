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
  yearReadings: [] as unknown[],
  shelfReadings: [] as unknown[],
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
  useClubYearReadings: () => ({ data: m.yearReadings, isLoading: false }),
  useClubShelfReadings: () => ({ data: m.shelfReadings, isLoading: false }),
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
  profile: { id, name, avatar_url: null, pet: null as string | null },
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
  queued_at: null,
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
  favorite_character: null,
  favorite_quote: null,
  comment: null,
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
  m.yearReadings = []
  m.shelfReadings = []
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
    expect(within(finished).getByText('No.05')).toBeInTheDocument()

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
      profile: { id: 'irla', name: 'Irla', avatar_url: null, bio: 'Sublinha e anota nas margens.', pet: '🐭' },
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
    expect(within(screen.getByRole('list', { name: 'Livros de Irla' })).getAllByRole('link')).toHaveLength(2)
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

describe('book review do clube', () => {
  it('abre na ficha de quem está logada e troca de membro pelas abas', async () => {
    const club = seedClub()
    club.readings[0] = { ...club.readings[0]!, favorite_character: 'Nina', comment: 'Me acompanhou por dias.' }
    m.club = club
    renderApp('/clubes/club-1/livros/tres')
    expect(screen.getByRole('heading', { level: 1, name: 'Três' })).toBeInTheDocument()
    expect(screen.getByText('4,5 · média do clube')).toBeInTheDocument()
    const tabs = screen.getByRole('tablist', { name: 'Reviews por membro' })
    expect(within(tabs).getByRole('tab', { name: 'Leyna' })).toHaveAttribute('aria-selected', 'true')
    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByText('Nina')).toBeInTheDocument()
    expect(within(panel).getByText('Me acompanhou por dias.')).toBeInTheDocument()

    await userEvent.click(within(tabs).getByRole('tab', { name: 'Novata' }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Novata ainda não escreveu a review de Três.')
  })

  it('sem review minha: convida a escrever e mostra as notas das amigas', () => {
    const club = seedClub()
    club.readings = [ranks('irla', 'book-tres', 4)]
    m.club = club
    renderApp('/clubes/club-1/livros/tres')
    // Sem review própria, abre na primeira amiga que avaliou.
    expect(screen.getByRole('tab', { name: 'Irla' })).toHaveAttribute('aria-selected', 'true')
  })

  it('estado pendente para quem está logada', async () => {
    const club = seedClub()
    club.readings = [ranks('irla', 'book-tres', 4), { ...ranks('novata', 'book-tres', 3) }]
    m.club = club
    renderApp('/clubes/club-1/livros/tres')
    await userEvent.click(screen.getByRole('tab', { name: 'Leyna' }))
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveTextContent('sua review de Três ainda está em branco…')
    expect(panel).toHaveTextContent('as amigas já deram 4 e 3 estrelas')
    expect(within(panel).getByRole('link', { name: 'escrever minha review' })).toHaveAttribute('href', '/publicar?livro=book-tres')
  })
})

describe('ranking do clube', () => {
  const year = new Date().getFullYear()
  const done = (user: string, book: string, r: number) => ({ ...ranks(user, book, r), finished_on: `${year}-03-10` })

  it('pódio por livros lidos, troca para média e mostra os prêmios', async () => {
    m.yearReadings = [done(ME, 'book-tres', 5), done(ME, 'fora-1', 4), done('irla', 'book-tres', 3), done('irla', 'fora-2', 3), done('irla', 'fora-3', 3)]
    renderApp('/clubes/club-1/ranking')
    const podium = screen.getByRole('list', { name: 'Pódio' })
    // Ordem visual 2º, 1º, 3º.
    expect(within(podium).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      expect.stringContaining('Leyna2'),
      expect.stringContaining('Irla3'),
      expect.stringContaining('Novata0'),
    ])
    await userEvent.click(screen.getByRole('button', { name: 'média de estrelas' }))
    expect(screen.getByRole('button', { name: 'média de estrelas' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(podium).getAllByRole('listitem')[1]).toHaveTextContent('Leyna4,5★1º lugar')

    const awards = screen.getByRole('region', { name: 'Prêmios do clube' })
    expect(awards).toHaveTextContent('Irla: 2 livros fora do clube')
    expect(awards).toHaveTextContent('Leyna: 1× 5★ no clube')
    expect(awards).toHaveTextContent('Irla: menor média: 3,0★')
  })
})

describe('página do clube: extras', () => {
  it('os mais amados e os votos de cada membro', () => {
    renderApp('/clubes/club-1')
    const loved = screen.getByRole('region', { name: 'Os mais amados' })
    expect(within(loved).getByRole('link', { name: /Três/ })).toHaveAttribute('href', '/clubes/club-1/livros/tres')
    const votes = within(screen.getByRole('region', { name: 'Aguardando aprovação' })).getByRole('list', { name: 'Votos' })
    expect(within(votes).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['LLeyna…ainda não votou', 'IIrla✓aprovou'])
    expect(screen.getByRole('link', { name: 'RANKING' })).toHaveAttribute('href', '/clubes/club-1/ranking')
  })

  it('o livro em leitura leva às reviews do clube', () => {
    renderApp('/clubes/club-1')
    expect(screen.getByRole('link', { name: 'reviews do clube' })).toHaveAttribute('href', '/clubes/club-1/livros/amanhecer')
  })
})

describe('favoritos das estantes', () => {
  it('livros fora do clube com a média dos membros, para propor', async () => {
    m.suggestClubReads.mockResolvedValue([])
    m.shelfReadings = [
      { ...ranks(ME, 'duna', 5), book: { id: 'duna', title: 'Duna', author: 'Frank Herbert', cover_url: null } },
      { ...ranks('irla', 'duna', 4), book: { id: 'duna', title: 'Duna', author: 'Frank Herbert', cover_url: null } },
      { ...ranks('irla', 'book-tres', 5), book: { id: 'book-tres', title: 'Três', author: 'V', cover_url: null } },
    ]
    renderApp('/clubes/club-1/sugestoes')
    const list = screen.getByRole('list', { name: 'Favoritos das estantes' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(1) // Três já é do clube
    expect(within(list).getByText('4,5 · média de 2 membros')).toBeInTheDocument()
    await userEvent.click(within(list).getByRole('button', { name: 'propor ao clube' }))
    expect(m.propose).toHaveBeenCalledWith({ bookId: 'duna' })
  })
})

describe('fila do clube', () => {
  it('próximas leituras com o número planejado e quem escolheu', () => {
    const club = seedClub()
    club.members[1]!.profile.pet = '🐭'
    club.books.push(
      clubBook('verity', 'Verity', { status: 'queued', finished_on: null, edition_number: null, proposed_by: 'irla', queued_at: '2026-10-22T10:00:00Z' }),
    )
    m.club = club
    renderApp('/clubes/club-1')
    const next = screen.getByRole('region', { name: 'Próximas' })
    // Edição 5 concluída → em leitura é a No.06 e a fila começa na No.07.
    expect(next).toHaveTextContent('No.07')
    expect(next).toHaveTextContent('escolha de 🐭 Irla')
    expect(screen.getByRole('list', { name: 'Livros em leitura no clube' })).toHaveTextContent('No.06')
    expect(within(screen.getByRole('region', { name: 'Membros' })).getByText('Irla 🐭')).toBeInTheDocument()
  })
})
