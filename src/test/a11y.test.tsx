import { waitFor } from '@testing-library/react'
import axe from 'axe-core'
import { renderApp } from './renderApp'

/**
 * Verificação automática de acessibilidade (axe-core) nas telas principais:
 * rótulos de campos, nomes acessíveis de botões e links, papéis ARIA, imagens etc.
 * O contraste de cores é testado à parte (src/theme/contrast.test.ts), porque o
 * jsdom não calcula estilos.
 */

const book = { id: 'b1', title: 'Três', author: 'Valérie Perrin', pages: 672, cover_url: null, summary: 'Três amigos.', enriched_at: 'x' }
const reading = {
  id: 'r1',
  started_on: '2026-09-01',
  finished_on: '2026-09-27',
  rank_characters: 5,
  rank_plot: 4,
  rank_writing: 5,
  rank_ending: 4,
  favorite_character: 'Nina',
  favorite_quote: null,
  comment: 'Me acompanhou por dias.',
  book,
}
const member = (id: string, name: string, role = 'member') => ({ user_id: id, role, joined_at: '2026-04-20T10:00:00Z', profile: { id, name, avatar_url: null } })
const club = {
  id: 'c1',
  name: 'Dois Amores',
  cover_url: null,
  invite_code: 'DAMS26',
  created_by: 'user-1',
  description: 'a gente lê com calma',
  members: [member('user-1', 'Leyna', 'owner'), member('irla', 'Irla')],
  books: [
    { id: 'cb1', status: 'finished', started_on: '2026-09-01', finished_on: '2026-09-29', edition_number: 5, created_at: '2026-08-28T00:00:00Z', proposed_by: null, book, votes: [] },
    { id: 'cb2', status: 'pending', started_on: null, finished_on: null, edition_number: null, created_at: '2026-10-19T00:00:00Z', proposed_by: 'irla', book: { ...book, id: 'b2', title: 'Torto arado' }, votes: [{ user_id: 'irla', approved: true }] },
  ],
  readings: [{ user_id: 'user-1', book_id: 'b1', started_on: '2026-09-01', finished_on: '2026-09-27', rank_characters: 5, rank_plot: 4, rank_writing: 5, rank_ending: 4, favorite_character: 'Nina', favorite_quote: null, comment: 'Lindo.' }],
}
const mutation = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, isSuccess: false }

vi.mock('@/lib/supabase', () => ({ supabase: { auth: {} } }))
const profile = {
  id: 'user-1',
  name: 'Leyna',
  avatar_url: null,
  bio: 'Lê de tudo.',
  pet: '🐵',
  username: 'leyna.le',
  tagline: 'gosto de finais que doem',
  cover_url: null,
  reading_goal: 40,
  theme: 'classica',
  show_followers: true,
  favorite_genres: ['romance'],
  archetype: 'coruja',
  onboarded_at: '2026-04-20T10:00:00Z',
  notifications_seen_at: '2026-11-01T00:00:00Z',
}
const post = {
  id: 'p1',
  created_at: '2026-09-27',
  author: { id: 'u', name: 'Irla', avatar_url: null },
  reading: { ...reading, favorite_quote: 'Eles eram três.', book },
  likes: [],
  comments: [{ count: 1 }],
}

vi.mock('@/features/profile/api', () => ({
  useProfile: () => ({ data: profile, isLoading: false }),
  useUpdateProfile: () => mutation,
  useUploadAvatar: () => mutation,
  useUploadCover: () => mutation,
  deleteMyAccount: vi.fn(),
  PROFILE_FIELDS: '',
  profileKeys: { detail: () => [] },
}))
vi.mock('@/features/people/api', () => ({
  usePerson: () => ({ data: { ...profile, id: 'irla', name: 'Irla' }, isLoading: false }),
  useFollows: () => ({ data: { followers: [{ id: 'irla', name: 'Irla', username: 'irla.le', avatar_url: null }], following: [], followedByMe: false } }),
  useFavorites: () => ({ data: [{ position: 1, book }] }),
  usePersonReadings: () => ({ data: [{ ...reading, format: 'audiobook' }] }),
  useToggleFollow: () => mutation,
  useSaveFavorites: () => mutation,
  useSearchPeople: () => ({ data: [], isFetching: false }),
  useInvalidatePerson: () => () => undefined,
}))
vi.mock('@/features/readings/api', () => ({
  useMyStats: () => ({ data: { booksRead: 8, pagesRead: 2927, clubs: 1 } }),
  useRecentReadings: () => ({ data: [reading], isLoading: false }),
  useReading: () => ({ data: reading, isLoading: false }),
  useSaveReading: () => mutation,
  useUpdateProgress: () => mutation,
  useDeleteReading: () => mutation,
  ensureBook: vi.fn(),
  findMyReadingId: vi.fn(),
}))
vi.mock('@/features/feed/api', () => ({
  useFeed: () => ({ data: { pages: [[post]] }, isLoading: false, isError: false, hasNextPage: true, fetchNextPage: vi.fn() }),
  useFriendsReadingNow: () => ({ data: [{ id: 'x', user: { id: 'irla', name: 'Irla' }, book }] }),
  useToggleLike: () => mutation,
  usePost: () => ({ data: post, isLoading: false }),
  usePostComments: () => ({ data: [{ id: 'c1', body: 'que lindo', created_at: '2026-09-28T10:00:00Z', user: { id: 'irla', name: 'Irla', avatar_url: null } }] }),
  useAddComment: () => mutation,
  useDeleteComment: () => mutation,
}))
vi.mock('@/features/notifications/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/notifications/api')>()),
  useNotifications: () => ({ data: [{ kind: 'follow', created_at: '2026-11-05T10:00:00Z', body: null, post_id: null, actor: { id: 'irla', name: 'Irla', avatar_url: null }, book: null }], isLoading: false }),
  useMarkNotificationsSeen: () => mutation,
}))
vi.mock('@/features/shelf/api', () => ({
  useShelf: () => ({ data: { read: [reading], reading: [{ ...reading, id: 'r2', finished_on: null, current_page: 100 }], wishlist: [] }, isLoading: false }),
  useBook: () => ({ data: { ...book, openlibrary_work_key: '/works/OL1W', summary_lang: 'pt', summary_source: 'google_books' }, isLoading: false }),
  useMyReadingOf: () => ({ data: reading, isLoading: false }),
  useBookEnrichment: () => ({ isFetching: false }),
  useSummaryTranslation: () => ({ isFetching: false }),
  useIsInWishlist: () => ({ data: false }),
  useWishlistToggle: () => mutation,
  useBookReaders: () => ({ data: [{ ...reading, user: { id: 'irla', name: 'Irla', avatar_url: null } }] }),
}))
vi.mock('@/features/shelf/shelvesApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/shelf/shelvesApi')>()),
  useCustomShelves: () => ({ data: [{ id: 's1', user_id: 'user-1', name: 'lista de praia', color: 'rosa', created_at: '', books: [{ added_at: '2026-10-01', book }] }] }),
  useToggleShelfBook: () => mutation,
  useDeleteShelf: () => mutation,
  useCreateShelf: () => mutation,
}))
vi.mock('@/features/clubs/api', () => ({
  useMyClubs: () => ({
    data: [{ id: 'c1', name: 'Dois Amores', cover_url: null, memberCount: 2, members: club.members, books: [{ status: 'reading', started_on: '2026-11-01', due_on: '2026-11-20', book }] }],
    isLoading: false,
  }),
  useClub: () => ({ data: club, isLoading: false }),
  useJoinClub: () => mutation,
  useCreateClub: () => mutation,
  useVote: () => mutation,
  useFinishClubBook: () => mutation,
  useWithdrawProposal: () => mutation,
  useRegenerateInviteCode: () => mutation,
  useChangeClubCover: () => mutation,
  useLeaveClub: () => mutation,
  useProposeBook: () => mutation,
  useMyClubBooks: () => ({ data: [{ id: 'cb1', club_id: 'c1', status: 'finished', edition_number: 5, started_on: '2026-09-01', proposed_by: 'user-1', book }] }),
  useClubYearReadings: () => ({ data: club.readings, isLoading: false }),
  useClubShelfReadings: () => ({ data: [], isLoading: false }),
  useClubEvents: () => ({ data: [{ id: 'e1', title: 'conversa do clube', notes: null, happens_on: '2099-12-12', created_by: 'user-1' }] }),
  useAddClubEvent: () => mutation,
  useDeleteClubEvent: () => mutation,
  useSetClubBookDue: () => mutation,
  useUpdateClubInfo: () => mutation,
}))

async function violations(path: string, session: 'in' | 'out' = 'in') {
  const { container } = renderApp(path, session === 'in' ? undefined : null)
  await waitFor(() => expect(container.textContent?.length).toBeGreaterThan(0))
  // A tela precisa ter renderido de verdade (sem cair na página de erro do roteador).
  expect(container.textContent).not.toMatch(/Unexpected Application Error|Página não encontrada/)
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
}

describe('acessibilidade (axe-core)', () => {
  it('controle: o verificador reprova um campo sem rótulo e um botão sem nome', async () => {
    const div = document.createElement('div')
    div.innerHTML = '<main><input type="text"><button></button></main>'
    document.body.appendChild(div)
    const result = await axe.run(div, { rules: { 'color-contrast': { enabled: false } } })
    expect(result.violations.map((v) => v.id)).toEqual(expect.arrayContaining(['label', 'button-name']))
    div.remove()
  })

  it.each([
    ['login', '/entrar', 'out'],
    ['cadastro', '/cadastro', 'out'],
    ['recuperar senha', '/recuperar-senha', 'out'],
    ['privacidade', '/privacidade', 'out'],
  ] as const)('%s', async (_name, path, session) => {
    expect(await violations(path, session)).toEqual([])
  })

  it.each([
    ['início', '/'],
    ['estantes', '/estantes'],
    ['estante: lidos', '/estantes/lidos'],
    ['estante própria', '/estantes/s1'],
    ['nova estante', '/estantes/nova'],
    ['números', '/numeros'],
    ['números: autores', '/numeros/autores'],
    ['retrospectiva', '/numeros/retrospectiva'],
    ['buscar livros', '/buscar'],
    ['buscar pessoas', '/buscar/pessoas'],
    ['notificações', '/notificacoes'],
    ['comentários da ficha', '/fichas/p1'],
    ['perfil de outra pessoa', '/pessoas/irla'],
    ['seguidores', '/pessoas/irla/seguidores'],
    ['favoritos', '/perfil/favoritos'],
    ['configurações', '/configuracoes'],
    ['clube: feed', '/clubes/c1/feed'],
    ['clube: biblioteca', '/clubes/c1/biblioteca'],
    ['clube: leitura', '/clubes/c1/leitura'],
    ['clube: agenda', '/clubes/c1/agenda'],
    ['clube: convidar', '/clubes/c1/convidar'],
    ['clube: ajustes', '/clubes/c1/ajustes'],
    ['convite por link', '/convite/DAMS26'],
    ['bem-vindo: nome', '/bem-vindo/1'],
    ['bem-vindo: meta', '/bem-vindo/5'],
    ['bem-vindo: tema', '/bem-vindo/6'],
    ['bem-vindo: gostos', '/bem-vindo/8'],
    ['bem-vindo: pronto', '/bem-vindo/pronto'],
    ['teste: introdução', '/teste'],
    ['teste: pergunta', '/teste/1'],
    ['página do livro', '/livros/b1'],
    ['publicar leitura', '/publicar'],
    ['editar leitura', '/leituras/r1/editar'],
    ['perfil', '/perfil'],
    ['editar perfil', '/perfil/editar'],
    ['criar avatar', '/perfil/avatar'],
    ['ranking do clube', '/clubes/c1/ranking'],
    ['book review do clube', '/clubes/c1/livros/cb1'],
    ['clubes', '/clubes'],
    ['criar clube', '/clubes/novo'],
    ['página do clube', '/clubes/c1'],
    ['propor livro', '/clubes/c1/propor'],
    ['perfil do membro', '/clubes/c1/membros/irla'],
  ])('%s', async (_name, path) => {
    expect(await violations(path)).toEqual([])
  })
})
