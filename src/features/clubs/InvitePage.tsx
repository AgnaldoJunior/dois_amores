import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { FormMessage } from '@/components/ui/FormMessage'
import { Eyebrow, HandText, PageTitle } from '@/components/ui/Typography'
import { isValidInviteCode, normalizeInviteCode } from '@/lib/domain/clubs'
import { useJoinClub } from './api'
import { clubPath } from './ClubsPage'

/** /convite/:code — quem abre o link de convite entra no clube com um toque. */
export function InvitePage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const join = useJoinClub()
  const [error, setError] = useState('')
  const valid = isValidInviteCode(code)

  async function onJoin() {
    setError('')
    try {
      const clubId = await join.mutateAsync(code)
      navigate(clubPath(clubId), { replace: true, state: { flash: 'Bem-vinda(o) ao clube!' } })
    } catch (err) {
      setError(
        (err as { code?: string }).code === 'P0002'
          ? 'Esse convite não vale mais. Peça um link novo para quem te convidou.'
          : 'Não foi possível entrar agora. Tente de novo.',
      )
    }
  }

  return (
    <div className="relative flex flex-col gap-5">
      <span aria-hidden="true" className="twinkle top-20 right-6 text-lg">✦</span>
      <BackLink to="/clubes">clubes</BackLink>
      <Eyebrow>convite para ler junto</Eyebrow>
      <PageTitle>alguém te chamou para um clube ♡</PageTitle>
      <HandText>o código do convite é</HandText>
      <p className="m-0 flex gap-2">
        <span className="sr-only">Código {normalizeInviteCode(code)}</span>
        {normalizeInviteCode(code)
          .split('')
          .map((ch, i) => (
            <span key={i} aria-hidden="true" className="flex h-13 w-11 items-center justify-center rounded-md border border-border bg-card font-sans text-2xl font-semibold">
              {ch}
            </span>
          ))}
      </p>
      {!valid && <FormMessage tone="error">Esse link de convite parece incompleto. Confira o código.</FormMessage>}
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <Button onClick={onJoin} loading={join.isPending} disabled={!valid}>
        entrar no clube
      </Button>
    </div>
  )
}
