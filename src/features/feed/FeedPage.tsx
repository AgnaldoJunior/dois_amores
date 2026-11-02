import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { useFeed } from './api'
import { PostCard } from './PostCard'

export function FeedPage() {
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } = useFeed()
  const posts = data?.pages.flat() ?? []

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-2.5">
        <span className="rule" aria-hidden="true" />
        <h1 className="tilt-l2 bg-primary px-4 pt-1 font-display font-normal text-5xl leading-none text-inverse">Feed</h1>
        <span className="font-script text-title-md leading-none text-title">das amigas</span>
        <span className="rule" aria-hidden="true" />
      </header>

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

      <ul className="flex flex-col gap-3.5" aria-label="Leituras concluídas">
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
