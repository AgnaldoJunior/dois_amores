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
  members: [member('user-1', 'Leyna', 'owner'), member('irla', 'Irla')],
  books: [
    { id: 'cb1', status: 'finished', started_on: '2026-09-01', finished_on: '2026-09-29', edition_number: 5, created_at: '2026-08-28T00:00:00Z', proposed_by: null, book, votes: [] },
    { id: 'cb2', status: 'pending', started_on: null, finished_on: null, edition_number: null, created_at: '2026-10-19T00:00:00Z', proposed_by: 'irla', book: { ...book, id: 'b2', title: 'Torto arado' }, votes: [{ user_id: 'irla', approved: true }] },
  ],
  readings: [],
}
const mutation = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, isSuccess: false }

vi.mock('@/lib/supabase', () => ({ supabase: { auth: {} } }))
vi.mock('@/features/profile/api', () => ({
  useProfile: () => ({ data: { id: 'user-1', name: 'Leyna', avatar_url: null, bio: 'Lê de tudo.' }, isLoading: false }),
  useUpdateProfile: () => mutation,
  useUploadAvatar: () => mutation,
  deleteMyAccount: vi.fn(),
}))
vi.mock('@/features/readings/api', () => ({
  useMyStats: () => ({ data: { booksRead: 8, pagesRead: 2927, clubs: 1 } }),
  useRecentReadings: () => ({ data: [reading], isLoading: false }),
  useReading: () => ({ data: reading, isLoading: false }),
  useSaveReading: () => mutation,
  useDeleteReading: () => mutation,
  ensureBook: vi.fn(),
  findMyReadingId: vi.fn(),
}))
vi.mock('@/features/feed/api', () => ({
  useFeed: () => ({
    data: { pages: [[{ id: 'p1', created_at: '2026-09-27', author: { id: 'u', name: 'Leyna', avatar_url: null }, reading: { ...reading, book } }]] },
    isLoading: false,
    isError: false,
    hasNextPage: true,
    fetchNextPage: vi.fn(),
  }),
}))
vi.mock('@/features/shelf/api', () => ({
  useShelf: () => ({ data: { read: [reading], reading: [], wishlist: [] }, isLoading: false }),
  useBook: () => ({ data: { ...book, openlibrary_work_key: '/works/OL1W', summary_lang: 'pt', summary_source: 'google_books' }, isLoading: false }),
  useMyReadingOf: () => ({ data: reading, isLoading: false }),
  useBookEnrichment: () => ({ isFetching: false }),
  useSummaryTranslation: () => ({ isFetching: false }),
  useIsInWishlist: () => ({ data: false }),
  useWishlistToggle: () => mutation,
}))
vi.mock('@/features/clubs/api', () => ({
  useMyClubs: () => ({ data: [{ id: 'c1', name: 'Dois Amores', cover_url: null, memberCount: 2 }], isLoading: false }),
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
  useMemberProfile: () => ({ data: { profile: { id: 'irla', name: 'Irla', avatar_url: null, bio: null }, readings: [] }, isLoading: false }),
}))

async function violations(path: string, session: 'in' | 'out' = 'in') {
  const { container } = renderApp(path, session === 'in' ? undefined : null)
  await waitFor(() => expect(container.textContent?.length).toBeGreaterThan(0))
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
    ['tela inicial', '/'],
    ['feed', '/feed'],
    ['meus livros', '/meus-livros'],
    ['página do livro', '/livros/b1'],
    ['publicar leitura', '/publicar'],
    ['editar leitura', '/leituras/r1/editar'],
    ['perfil', '/perfil'],
    ['clubes', '/clubes'],
    ['criar clube', '/clubes/novo'],
    ['página do clube', '/clubes/c1'],
    ['propor livro', '/clubes/c1/propor'],
    ['perfil do membro', '/clubes/c1/membros/irla'],
  ])('%s', async (_name, path) => {
    expect(await violations(path)).toEqual([])
  })
})
