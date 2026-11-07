import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { Avatar, avatarOf } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { TextField } from '@/components/ui/TextField'
import { Eyebrow, HandText, PageTitle } from '@/components/ui/Typography'
import { todayIso } from '@/lib/dates'
import { isValidInviteCode } from '@/lib/domain/clubs'
import { useJoinClub, useMyClubs, type ClubSummary } from './api'
import { dueProgress } from './schedule'

export const clubPath = (clubId: string) => `/clubes/${clubId}`

/** /clubes — "meus clubes": uma carta por clube, criar e entrar com código. */
export function ClubsPage() {
  const location = useLocation()
  const [params] = useSearchParams()
  const flash = (location.state as { flash?: string } | null)?.flash
  const { data: clubs, isLoading, isError } = useMyClubs()
  const reading = clubs?.filter((c) => c.books?.some((b) => b.status === 'reading')).length ?? 0

  return (
    <div className="relative flex flex-col gap-5">
      <span aria-hidden="true" className="twinkle top-20 right-4 text-sm">✦</span>
      <header className="flex items-center justify-between">
        <span className="font-sans text-base font-semibold text-ink">clubes</span>
        <Link to="/clubes/novo" className="flex min-h-11 items-center font-sans text-base font-semibold text-primary no-underline">
          + criar clube
        </Link>
      </header>
      <div className="-mt-2">
        <PageTitle>meus clubes</PageTitle>
        {clubs && (
          <HandText>
            {clubs.length} {clubs.length === 1 ? 'grupo' : 'grupos'} · {reading} {reading === 1 ? 'leitura rolando' : 'leituras rolando'} ✦
          </HandText>
        )}
      </div>
      {flash && <FormMessage tone="success">{flash}</FormMessage>}

      {isLoading && <p className="m-0 font-serif italic text-md text-muted">carregando clubes…</p>}
      {isError && <FormMessage tone="error">Não foi possível carregar seus clubes.</FormMessage>}
      {clubs && clubs.length === 0 && (
        <EmptyState title="nenhum clube ainda" icon="people">
          Você ainda não participa de nenhum clube. Crie um ou entre com o código de convite.
        </EmptyState>
      )}

      <ul className="flex flex-col gap-4" aria-label="Seus clubes">
        {clubs?.map((club, i) => (
          <li key={club.id}>
            <ClubCard club={club} featured={i === 0} />
          </li>
        ))}
      </ul>

      <section aria-labelledby="join-title" className="flex flex-col gap-3 rounded-card border border-line bg-card p-4">
        <h2 id="join-title" className="m-0 font-display italic font-semibold text-xl text-primary">
          tem um código?
        </h2>
        <HandText className="-mt-2 text-sm">cole o convite de 6 caracteres que alguém te mandou.</HandText>
        <JoinClubForm autoFocus={params.get('entrar') === '1'} />
      </section>
    </div>
  )
}

/** Carta do clube: capa, situação da leitura, nome, livro atual e quem participa. */
function ClubCard({ club, featured }: { club: ClubSummary; featured: boolean }) {
  const current = club.books?.find((b) => b.status === 'reading')
  const voting = club.books?.filter((b) => b.status === 'pending').length ?? 0
  const due = current ? dueProgress(current.started_on, current.due_on, todayIso()) : null
  const status = current
    ? `lendo agora${due ? ` · dia ${due.day} de ${due.total}` : ''}`
    : voting > 0
      ? 'votação aberta'
      : 'sem livro'
  const names = club.members?.map((m) => m.profile.name.split(/\s+/)[0]?.toLowerCase()).join(' · ')

  return (
    <Link to={clubPath(club.id)} aria-label={club.name} className="block overflow-hidden rounded-card border border-line bg-card text-ink no-underline">
      {featured && (
        <div className="relative h-32 overflow-hidden bg-blush">
          {club.cover_url && <img src={club.cover_url} alt="" className="size-full object-cover" />}
        </div>
      )}
      <div className="flex gap-3.5 p-4">
        {!featured && (
          <span aria-hidden="true" className="flex size-club-badge shrink-0 items-center justify-center overflow-hidden rounded-md bg-tag font-display italic font-bold text-3xl text-primary">
            {club.cover_url ? <img src={club.cover_url} alt="" className="size-full object-cover" /> : club.name.charAt(0).toLowerCase()}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Eyebrow className={current ? '' : 'text-muted'}>{status}</Eyebrow>
          <h2 className="m-0 font-display italic font-semibold text-title-md leading-tight text-primary">{club.name}</h2>
          {current && (
            <p className="m-0 font-sans text-sm text-muted">
              {current.book.title}
              {current.book.author && ` · ${current.book.author}`}
            </p>
          )}
          {!current && voting > 0 && <p className="m-0 font-sans text-sm text-muted">{voting} {voting === 1 ? 'sugestão esperando votos' : 'sugestões esperando votos'}</p>}
          <div className="mt-2 flex items-center gap-2.5">
            <span className="flex">
              {club.members?.slice(0, 5).map((m) => (
                <span key={m.user_id} className="-ml-2 first:ml-0">
                  <Avatar {...avatarOf(m.profile)} size="xs" border="thick" />
                </span>
              ))}
            </span>
            <span className="min-w-0 truncate font-sans text-xs font-medium text-muted">
              {club.memberCount === 1 ? 'só você por enquanto · convide alguém' : (names ?? `${club.memberCount} membros`)}
            </span>
          </div>
          {names && (
            <span className="sr-only">
              {club.memberCount} {club.memberCount === 1 ? 'membro' : 'membros'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function JoinClubForm({ autoFocus }: { autoFocus?: boolean }) {
  const navigate = useNavigate()
  const join = useJoinClub()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValidInviteCode(code)) return setError('O código tem 6 letras e números, como DAMS26.')
    setError('')
    try {
      const clubId = await join.mutateAsync(code)
      navigate(clubPath(clubId), { state: { flash: 'Bem-vinda(o) ao clube!' } })
    } catch (err) {
      setError(
        (err as { code?: string }).code === 'P0002'
          ? 'Não encontramos um clube com esse código. Confira e tente de novo.'
          : 'Não foi possível entrar agora. Tente de novo.',
      )
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-start gap-2" noValidate>
      <div className="min-w-0 flex-1">
        <TextField
          label="Entrar com código"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={10}
          placeholder="ex.: DAMS26"
          autoFocus={autoFocus}
          value={code}
          error={error}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="tracking-wide uppercase"
        />
      </div>
      <Button type="submit" size="sm" fullWidth={false} loading={join.isPending} disabled={!code.trim()} aria-label="Entrar no clube" className="mt-5 min-h-control-h">
        entrar
      </Button>
    </form>
  )
}
