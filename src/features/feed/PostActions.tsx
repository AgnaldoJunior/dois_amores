import { Link } from 'react-router'
import { Icon } from '@/components/ui/Icon'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { useToggleLike, type FeedPost } from './api'

/** Rodapé da ficha: curtir, comentar e abrir o livro para pôr na estante. */
export function PostActions({ post, showComment = true }: { post: FeedPost; showComment?: boolean }) {
  const me = useCurrentUser()
  const toggle = useToggleLike()
  const liked = post.likes.some((l) => l.user_id === me.id)
  const likes = post.likes.length
  const comments = post.comments[0]?.count ?? 0
  return (
    <>
      <button
        type="button"
        aria-pressed={liked}
        onClick={() => toggle.mutate({ postId: post.id, like: !liked })}
        disabled={toggle.isPending}
        className={`flex min-h-11 items-center gap-1.5 ${liked ? 'text-primary' : 'text-muted'}`}
      >
        <span aria-hidden="true">{liked ? '♥' : '♡'}</span>
        {liked ? 'curtido' : 'curtir'}
        {likes > 0 && ` · ${likes}`}
      </button>
      {showComment && (
        <Link to={`/fichas/${post.id}`} className="flex min-h-11 items-center gap-1.5 text-muted no-underline">
          <Icon name="message" className="size-icon-sm" />
          {comments > 0 ? `comentar · ${comments}` : 'comentar'}
        </Link>
      )}
      {post.reading?.book && (
        <Link to={`/livros/${post.reading.book.id}`} className="ml-auto flex min-h-11 items-center text-primary no-underline">
          + estante
        </Link>
      )}
    </>
  )
}
