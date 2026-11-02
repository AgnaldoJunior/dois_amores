import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { TextField } from '@/components/ui/TextField'
import { Icon } from '@/components/ui/Icon'
import { PageTitle, SectionTitle } from '@/components/ui/Typography'
import { OrDivider } from '@/features/auth/AuthLayout'
import { isValidInviteCode } from '@/lib/domain/clubs'
import { useJoinClub, useMyClubs } from './api'

export const clubPath = (clubId: string) => `/clubes/${clubId}`

/** /clubes — lista de clubes, criar e entrar com código (Figma 08). */
export function ClubsPage() {
  const location = useLocation()
  const flash = (location.state as { flash?: string } | null)?.flash
  const { data: clubs, isLoading, isError } = useMyClubs()

  return (
    <div className="flex flex-col gap-4">
      <PageTitle>Clubes</PageTitle>
      {flash && <FormMessage tone="success">{flash}</FormMessage>}

      <Card className="flex flex-col gap-3 p-3.5">
        <ButtonLink to="/clubes/novo">
          <Icon name="plus" className="size-icon-sm" />
          CRIAR CLUBE
        </ButtonLink>
        <OrDivider />
        <JoinClubForm />
      </Card>

      <SectionTitle>Meus clubes</SectionTitle>
      {isLoading && <p className="font-hand text-lg text-primary">Carregando clubes…</p>}
      {isError && <FormMessage tone="error">Não foi possível carregar seus clubes.</FormMessage>}
      {clubs && clubs.length === 0 && (
        <EmptyState>Você ainda não participa de nenhum clube. Crie um ou entre com o código de convite.</EmptyState>
      )}

      <ul className="flex flex-col gap-3" aria-label="Seus clubes">
        {clubs?.map((club) => (
          <li key={club.id}>
            <Link to={clubPath(club.id)} className="flex items-center gap-3.5 rounded-card border border-primary bg-card p-3 no-underline">
              <ClubBadge name={club.name} coverUrl={club.cover_url} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="font-type font-normal text-lg leading-tight">{club.name}</h2>
                <p className="font-mono font-bold text-2xs uppercase tracking-label">
                  {club.memberCount} {club.memberCount === 1 ? 'membro' : 'membros'}
                </p>
              </div>
              <Icon name="next" />
            </Link>
          </li>
        ))}
      </ul>
      {clubs && clubs.length > 0 && (
        <p className="rounded-card border border-dashed border-slot p-4 text-center font-hand text-md text-muted">
          seus outros clubes aparecem aqui
        </p>
      )}
    </div>
  )
}

/** Capa do clube ou, sem capa, o mini ingresso "Book Club" sobre as listras. */
export function ClubBadge({ name, coverUrl }: { name: string; coverUrl: string | null }) {
  if (coverUrl) {
    return <img src={coverUrl} alt="" className="size-club-badge shrink-0 rounded-sm border border-primary object-cover" />
  }
  return (
    <span aria-hidden="true" className="stripes flex size-club-badge shrink-0 items-center justify-center rounded-sm border border-primary">
      <span className="tilt-l2 flex max-w-full flex-col items-center bg-primary px-1.5 pt-1 pb-0.5">
        <span className="font-display text-xl leading-none text-inverse">Book Club</span>
        <span className="line-clamp-1 font-script text-sm leading-none text-pill">{name}</span>
      </span>
    </span>
  )
}

function JoinClubForm() {
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
        value={code}
        error={error}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="font-mono tracking-label uppercase"
      />
      </div>
      <Button
        type="submit"
        variant="secondary"
        fullWidth={false}
        loading={join.isPending}
        disabled={!code.trim()}
        aria-label="Entrar no clube"
        className="mt-6"
      >
        Entrar
      </Button>
    </form>
  )
}
