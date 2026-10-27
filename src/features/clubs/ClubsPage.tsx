import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { BookCover } from '@/components/ui/BookCover'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage } from '@/components/ui/FormMessage'
import { TextField } from '@/components/ui/TextField'
import { PageTitle } from '@/components/ui/Typography'
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

      <ButtonLink to="/clubes/novo" className="text-base">
        CRIAR CLUBE
      </ButtonLink>
      <JoinClubForm />

      {isLoading && <p className="font-hand text-lg text-primary">Carregando clubes…</p>}
      {isError && <FormMessage tone="error">Não foi possível carregar seus clubes.</FormMessage>}
      {clubs && clubs.length === 0 && (
        <EmptyState>Você ainda não participa de nenhum clube. Crie um ou entre com o código de convite.</EmptyState>
      )}

      <ul className="flex flex-col gap-4" aria-label="Seus clubes">
        {clubs?.map((club) => (
          <li key={club.id}>
            <Link to={clubPath(club.id)} className="block rounded-card">
              <Card className="flex items-center gap-4">
                <BookCover title={club.name} url={club.cover_url} size="club" decorative />
                <div className="flex min-w-0 flex-col gap-1">
                  <h2 className="font-script text-3xl leading-tight text-primary">{club.name}</h2>
                  <p className="font-mono text-xs text-primary">
                    {club.memberCount} {club.memberCount === 1 ? 'membro' : 'membros'}
                  </p>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
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
    <form onSubmit={onSubmit} className="flex flex-col gap-2" noValidate>
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
      <Button type="submit" variant="outline" loading={join.isPending} disabled={!code.trim()}>
        Entrar no clube
      </Button>
    </form>
  )
}
