import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { Avatar, avatarOf } from '@/components/ui/Avatar'
import { BackLink } from '@/components/ui/BackLink'
import { FormMessage } from '@/components/ui/FormMessage'
import { Icon } from '@/components/ui/Icon'
import { useCurrentUser } from '@/lib/auth/AuthProvider'
import { formatDayMonthShort } from '@/lib/dates'
import { useAddComment, useDeleteComment, usePost, usePostComments } from './api'
import { PostActions } from './PostActions'
import { PostCard } from './PostCard'

/** /fichas/:postId — a ficha e os comentários, com o campo para escrever embaixo. */
export function CommentsPage() {
  const { postId = '' } = useParams()
  const me = useCurrentUser()
  const { data: post, isLoading, isError } = usePost(postId)
  const { data: comments } = usePostComments(postId)
  const add = useAddComment(postId)
  const remove = useDeleteComment(postId)
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setError('')
    try {
      await add.mutateAsync(body)
      setBody('')
    } catch {
      setError('Não foi possível comentar. Tente de novo.')
    }
  }

  if (isLoading) return <p className="m-0 font-serif italic text-md text-muted">abrindo a ficha…</p>
  if (isError || !post) return <FormMessage tone="error">Ficha não encontrada.</FormMessage>
  const isAuthor = post.author?.id === me.id

  return (
    <div className="flex flex-col gap-4">
      <BackLink to="/">início</BackLink>
      <PostCard post={post} footer={<PostActions post={post} showComment={false} />} />
      <section aria-labelledby="comments-title" className="flex flex-col">
        <h1 id="comments-title" className="m-0 font-display italic font-semibold text-title-md text-primary">
          {comments?.length ?? 0} {comments?.length === 1 ? 'comentário' : 'comentários'}
        </h1>
        <ul className="flex flex-col">
          {comments?.map((c) => (
            <li key={c.id} className="flex gap-2.5 border-t border-line py-3.5 first:border-t-0">
              <Avatar {...avatarOf(c.user)} size="xs" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link to={`/pessoas/${c.user.id}`} className="font-sans text-sm font-semibold text-ink no-underline">
                  {c.user.name.split(/\s+/)[0]?.toLowerCase()}
                </Link>
                <p className="m-0 font-sans text-base leading-normal break-words">{c.body}</p>
                <span className="font-sans text-2xs font-semibold uppercase tracking-wide text-muted">
                  {formatDayMonthShort(c.created_at.slice(0, 10))}
                </span>
              </div>
              {(c.user.id === me.id || isAuthor) && (
                <button
                  type="button"
                  aria-label="Apagar comentário"
                  onClick={() => remove.mutate(c.id)}
                  className="flex size-11 shrink-0 items-center justify-center text-muted"
                >
                  <Icon name="close" className="size-icon-sm" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
      <form onSubmit={onSubmit} className="sticky bottom-[calc(var(--da-size-nav-h)+var(--da-space-3))] flex gap-2 lg:bottom-4">
        <label className="sr-only" htmlFor="comment-body">
          Escreva um comentário
        </label>
        <input
          id="comment-body"
          value={body}
          maxLength={1000}
          onChange={(e) => setBody(e.target.value)}
          placeholder="escreva um comentário…"
          className="h-control-h min-w-0 flex-1 rounded-full border border-border bg-card px-4 font-sans text-md text-ink placeholder:text-muted"
        />
        <button
          type="submit"
          aria-label="Enviar comentário"
          disabled={!body.trim() || add.isPending}
          className="flex size-control-h shrink-0 items-center justify-center rounded-full bg-primary text-inverse disabled:opacity-50"
        >
          ↑
        </button>
      </form>
      {error && <FormMessage tone="error">{error}</FormMessage>}
    </div>
  )
}
