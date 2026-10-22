import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { PageTitle } from '@/components/ui/Typography'
import { useFeed } from './api'
import { PostCard } from './PostCard'

export function FeedPage() {
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } = useFeed()
  const posts = data?.pages.flat() ?? []

  return (
    <div className="flex flex-col gap-4">
      <PageTitle>Feed</PageTitle>

      {isLoading && <p className="font-hand text-lg text-primary">Carregando leituras…</p>}

      {isError && (
        <>
          <FormMessage tone="error">Não foi possível carregar o feed.</FormMessage>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </>
      )}

      {!isLoading && !isError && posts.length === 0 && (
        <EmptyState>Ninguém terminou um livro ainda. Que tal ser a primeira pessoa?</EmptyState>
      )}

      <ul className="flex flex-col gap-4" aria-label="Leituras concluídas">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard post={post} />
          </li>
        ))}
      </ul>

      {hasNextPage && (
        <Button variant="outline" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
          Carregar mais
        </Button>
      )}
    </div>
  )
}
