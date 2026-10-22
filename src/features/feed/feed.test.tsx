import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/renderApp'
import type { FeedPost } from './api'

const feed = vi.hoisted(() => ({ state: {} as Record<string, unknown>, fetchNextPage: vi.fn() }))
vi.mock('@/features/feed/api', () => ({ useFeed: () => feed.state }))

const post = (over: Partial<FeedPost['reading'] & object> = {}, name = 'Leyna'): FeedPost => ({
  id: `post-${name}`,
  created_at: '2026-10-12T23:00:00Z',
  author: { id: 'u1', name, avatar_url: null },
  reading: {
    id: 'r1',
    finished_on: '2026-10-12',
    rank_characters: 5,
    rank_plot: 4,
    rank_writing: 5,
    rank_ending: 4,
    comment: 'Me acompanhou por dias, e o final ficou comigo.',
    book: { id: 'b1', title: 'Três', author: 'Valérie Perrin', cover_url: null },
    ...over,
  },
})

const setFeed = (pages: FeedPost[][], hasNextPage = false) => {
  feed.state = {
    data: { pages },
    isLoading: false,
    isError: false,
    hasNextPage,
    isFetchingNextPage: false,
    fetchNextPage: feed.fetchNextPage,
    refetch: vi.fn(),
  }
}

describe('Feed', () => {
  it('mostra quem terminou qual livro, com nota média, data e comentário', () => {
    setFeed([[post()]])
    renderApp('/feed')
    const item = within(screen.getByRole('list', { name: 'Leituras concluídas' })).getByRole('listitem')
    expect(within(item).getByText('Leyna')).toBeInTheDocument()
    expect(within(item).getByRole('heading', { name: 'Três' })).toBeInTheDocument()
    expect(within(item).getByText('Valérie Perrin')).toBeInTheDocument()
    // (5+4+5+4)/4 = 4,5
    expect(within(item).getByRole('img', { name: '4,5 de 5 estrelas' })).toBeInTheDocument()
    expect(within(item).getByText('12 OUT 2026')).toBeInTheDocument()
    expect(within(item).getByText(/o final ficou comigo/)).toBeInTheDocument()
  })

  it('leitura sem notas mostra "Sem nota" e sem comentário não mostra texto vazio', () => {
    setFeed([[post({ rank_characters: null, rank_plot: null, rank_writing: null, rank_ending: null, comment: null })]])
    renderApp('/feed')
    expect(screen.getByRole('img', { name: 'Sem nota' })).toBeInTheDocument()
  })

  it('carrega mais posts quando há próxima página', async () => {
    setFeed([[post({}, 'Leyna'), post({}, 'Irla')]], true)
    renderApp('/feed')
    expect(within(screen.getByRole('list', { name: 'Leituras concluídas' })).getAllByRole('listitem')).toHaveLength(2)
    await userEvent.click(screen.getByRole('button', { name: 'Carregar mais' }))
    expect(feed.fetchNextPage).toHaveBeenCalled()
  })

  it('estado vazio', () => {
    setFeed([[]])
    renderApp('/feed')
    expect(screen.getByText(/Ninguém terminou um livro ainda/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument()
  })
})
