import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { groupByWhen } from '@/features/notifications/api'
import { renderApp } from '@/test/renderApp'
import type { FeedPost } from './api'

const m = vi.hoisted(() => ({
  addComment: vi.fn(),
  deleteComment: vi.fn(),
  markSeen: vi.fn(),
  comments: [] as unknown[],
}))

const post: FeedPost = {
  id: 'p1',
  created_at: '2026-10-12T20:00:00Z',
  author: { id: 'user-1', name: 'Leyna', avatar_url: null },
  reading: {
    id: 'r1',
    finished_on: '2026-10-12',
    rank_characters: 5,
    rank_plot: 4,
    rank_writing: 5,
    rank_ending: 4,
    comment: 'o final ficou comigo',
    favorite_quote: null,
    book: { id: 'b1', title: 'Três', author: 'Valérie Perrin', cover_url: null },
  },
  likes: [],
  comments: [{ count: 1 }],
}

vi.mock('@/features/feed/api', () => ({
  usePost: () => ({ data: post, isLoading: false, isError: false }),
  usePostComments: () => ({ data: m.comments }),
  useAddComment: () => ({ mutateAsync: m.addComment, isPending: false }),
  useDeleteComment: () => ({ mutate: m.deleteComment }),
  useToggleLike: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/features/profile/api', () => ({
  useProfile: () => ({ data: { id: 'user-1', name: 'Leyna', notifications_seen_at: '2026-11-04T00:00:00Z' }, isLoading: false }),
}))
vi.mock('@/features/notifications/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/notifications/api')>()),
  useNotifications: () => ({
    data: [
      { kind: 'comment', created_at: '2026-11-05T10:00:00Z', body: 'helena é a minha!', post_id: 'p1', actor: { id: 'irla', name: 'Irla', avatar_url: null }, book: { id: 'b1', title: 'Três' } },
      { kind: 'follow', created_at: '2026-10-01T10:00:00Z', body: null, post_id: null, actor: { id: 'wane', name: 'Wanessa', avatar_url: null }, book: null },
    ],
    isLoading: false,
  }),
  useMarkNotificationsSeen: () => ({ mutate: m.markSeen }),
}))

beforeEach(() => {
  m.comments = [{ id: 'c1', body: 'parem, eu ainda não acabei ✋', created_at: '2026-10-13T10:00:00Z', user: { id: 'thais', name: 'Thaís', avatar_url: null } }]
  m.addComment.mockReset().mockResolvedValue(undefined)
  m.deleteComment.mockReset()
  m.markSeen.mockReset()
})

describe('comentários de uma ficha', () => {
  it('mostra a ficha, os comentários e envia um novo', async () => {
    renderApp('/fichas/p1')
    expect(screen.getByRole('heading', { name: 'Três' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '1 comentário' })).toBeInTheDocument()
    expect(screen.getByText('parem, eu ainda não acabei ✋')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Escreva um comentário'), 'eu também!')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar comentário' }))
    expect(m.addComment).toHaveBeenCalledWith('eu também!')
  })

  it('a autora da ficha pode apagar comentários', async () => {
    renderApp('/fichas/p1')
    await userEvent.click(screen.getByRole('button', { name: 'Apagar comentário' }))
    expect(m.deleteComment).toHaveBeenCalledWith('c1')
  })
})

describe('notificações', () => {
  it('agrupa por quando aconteceu e marca como visto', () => {
    renderApp('/notificacoes')
    expect(screen.getByText('1 nova desde a última visita ✦')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /irla comentou na sua ficha: “helena é a minha!”/ })).toHaveAttribute('href', '/fichas/p1')
    expect(within(screen.getByRole('region', { name: 'antes' })).getByRole('link', { name: /wanessa começou a seguir você/ })).toHaveAttribute('href', '/pessoas/wane')
    expect(m.markSeen).toHaveBeenCalled()
  })

  it('groupByWhen separa hoje, esta semana e antes', () => {
    const now = new Date(2026, 10, 7, 15)
    const groups = groupByWhen(
      [{ created_at: new Date(2026, 10, 7, 9).toISOString() }, { created_at: new Date(2026, 10, 4).toISOString() }, { created_at: new Date(2026, 9, 1).toISOString() }],
      now,
    )
    expect(groups.map((g) => [g.label, g.items.length])).toEqual([
      ['hoje', 1],
      ['esta semana', 1],
      ['antes', 1],
    ])
  })
})
